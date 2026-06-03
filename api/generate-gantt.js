import ExcelJS from 'exceljs';
import { callBedrock } from './bedrockClient.js';

/**
 * Analiza tareas del proyecto y genera estructura Gantt
 */
async function analyzeTasks(projectDescription, vertical) {
  const systemPrompt = `Eres un experto en gestión de proyectos. Analiza la descripción del proyecto y genera un plan de tareas detallado.

Retorna SOLO un JSON válido con esta estructura:
{
  "projectName": "Nombre del Proyecto",
  "projectDuration": "Duración total estimada en días",
  "tasks": [
    {
      "id": "T1",
      "name": "Nombre de la tarea",
      "description": "Descripción clara",
      "duration": 5,
      "dependsOn": ["T0"],
      "assignedTo": "Equipo/Rol",
      "priority": "Alta|Media|Baja"
    }
  ],
  "milestones": [
    {
      "id": "M1",
      "name": "Hito importante",
      "taskId": "T3"
    }
  ]
}

Asegúrate de:
- Las duraciones sean realistas
- Las dependencias sean correctas
- Incluir tareas de análisis, desarrollo, testing y deployment
- Total de tareas: 10-15`;

  const response = await callBedrock({
    model: 'claude-opus-4-7',
    max_tokens: 2000,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Proyecto: ${projectDescription}\n\nVertical: ${vertical}\n\nGenera un plan de tareas detallado en JSON.`
      }
    ]
  });

  try {
    let text = response.content[0].text;

    // Limpiar markdown
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Extraer JSON
    let jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');

    let json = jsonMatch[0];

    // Limpiar caracteres problemáticos
    json = json
      .replace(/[\x00-\x1F\x7F]/g, ' ')  // Control chars
      .replace(/(?<=[^\\"]),(?=\s*[}\]])/g, '');  // Remove trailing commas

    // Intentar parsear
    try {
      return JSON.parse(json);
    } catch (e) {
      // Si falla, intentar arreglar comillas simples por dobles
      json = json.replace(/'/g, '"');
      return JSON.parse(json);
    }
  } catch (err) {
    console.error('Error parsing Bedrock response:', err);
    throw new Error('Failed to parse task structure from Bedrock');
  }
}

/**
 * Calcula fechas de inicio/fin y ruta crítica
 */
function calculateTimeline(tasks) {
  const taskMap = new Map();
  const processed = new Set();

  // Inicializar
  tasks.forEach(task => {
    taskMap.set(task.id, {
      ...task,
      startDay: 0,
      endDay: task.duration,
      slack: 0
    });
  });

  // Calcular startDay/endDay respetando dependencias
  const calculateTask = (id) => {
    if (processed.has(id)) return taskMap.get(id);

    const task = taskMap.get(id);
    if (!task.dependsOn || task.dependsOn.length === 0) {
      task.startDay = 0;
      task.endDay = task.duration;
    } else {
      const maxEnd = Math.max(
        ...task.dependsOn.map(depId => {
          const dep = calculateTask(depId);
          return dep.endDay;
        })
      );
      task.startDay = maxEnd;
      task.endDay = maxEnd + task.duration;
    }

    processed.add(id);
    return task;
  };

  tasks.forEach(task => calculateTask(task.id));

  // Calcular projectDuration
  const projectDuration = Math.max(...Array.from(taskMap.values()).map(t => t.endDay));

  // Calcular slack (holgura) - versión simplificada
  const criticalPath = findCriticalPath(Array.from(taskMap.values()));
  Array.from(taskMap.values()).forEach(task => {
    task.isCritical = criticalPath.includes(task.id);
    task.slack = task.isCritical ? 0 : 2; // Holgura simplificada
  });

  return {
    tasks: Array.from(taskMap.values()),
    projectDuration,
    criticalPath
  };
}

function findCriticalPath(tasks) {
  const taskMap = new Map(tasks.map(t => [t.id, t]));
  let maxEnd = Math.max(...tasks.map(t => t.endDay));

  const path = [];
  let current = tasks.find(t => t.endDay === maxEnd);

  while (current) {
    path.unshift(current.id);
    if (!current.dependsOn || current.dependsOn.length === 0) break;

    const deps = current.dependsOn
      .map(id => taskMap.get(id))
      .filter(t => t && t.endDay === current.startDay);
    current = deps[0];
  }

  return path;
}

/**
 * Genera archivo Excel con tareas y diagrama Gantt
 */
async function generateExcelGantt(tasks, projectName, projectDuration) {
  const workbook = new ExcelJS.Workbook();

  // SHEET 1: Tareas
  const tasksSheet = workbook.addWorksheet('Tareas');
  tasksSheet.columns = [
    { header: 'ID', key: 'id', width: 8 },
    { header: 'Nombre', key: 'name', width: 30 },
    { header: 'Descripción', key: 'description', width: 35 },
    { header: 'Días', key: 'duration', width: 8 },
    { header: 'Depende de', key: 'dependsOn', width: 15 },
    { header: 'Asignado', key: 'assignedTo', width: 15 },
    { header: 'Inicio', key: 'startDay', width: 8 },
    { header: 'Fin', key: 'endDay', width: 8 },
    { header: 'Holgura', key: 'slack', width: 8 },
    { header: 'Crítica', key: 'isCritical', width: 10 },
    { header: '% Avance', key: 'progress', width: 10 }
  ];

  // Agregar datos de tareas
  tasks.forEach((task, index) => {
    tasksSheet.addRow({
      id: task.id,
      name: task.name,
      description: task.description,
      duration: task.duration,
      dependsOn: task.dependsOn?.join(', ') || '-',
      assignedTo: task.assignedTo,
      startDay: task.startDay,
      endDay: task.endDay,
      slack: task.slack,
      isCritical: task.isCritical ? 'SÍ' : 'NO',
      progress: 0
    });
  });

  // Estilos
  tasksSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  tasksSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3663FF' } };

  // SHEET 2: Gantt Visual
  const ganttSheet = workbook.addWorksheet('Gantt');
  ganttSheet.columns = [
    { header: 'Tarea', key: 'name', width: 25 },
    ...Array.from({ length: projectDuration }, (_, i) => ({
      header: `D${i + 1}`,
      key: `day${i + 1}`,
      width: 3
    }))
  ];

  // Dibujar barras Gantt
  tasks.forEach((task, index) => {
    const row = ganttSheet.addRow({ name: task.name });

    for (let day = 1; day <= projectDuration; day++) {
      const cell = row.getCell(`day${day}`);

      if (day > task.startDay && day <= task.endDay) {
        cell.value = '█';
        cell.font = { color: { argb: task.isCritical ? 'FFFF5050' : 'FF3663FF' }, bold: true };
        cell.alignment = { horizontal: 'center', vertical: 'center' };
      }
    }
  });

  ganttSheet.getRow(1).font = { bold: true };
  ganttSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8E8E8' } };

  // SHEET 3: Análisis
  const analysisSheet = workbook.addWorksheet('Análisis');
  analysisSheet.columns = [
    { header: 'Métrica', key: 'metric', width: 25 },
    { header: 'Valor', key: 'value', width: 30 }
  ];

  const criticalTasks = tasks.filter(t => t.isCritical);
  const totalHours = tasks.reduce((sum, t) => sum + (t.duration * 8), 0);
  const avgTaskDuration = (tasks.reduce((sum, t) => sum + t.duration, 0) / tasks.length).toFixed(1);

  analysisSheet.addRows([
    { metric: 'Proyecto', value: projectName },
    { metric: 'Duración Total', value: `${projectDuration} días` },
    { metric: 'Total de Tareas', value: tasks.length },
    { metric: 'Tareas en Ruta Crítica', value: criticalTasks.length },
    { metric: 'Duración Promedio Tarea', value: `${avgTaskDuration} días` },
    { metric: 'Total de Horas', value: `${totalHours} horas` },
    { metric: 'Equipos Involucrados', value: [...new Set(tasks.map(t => t.assignedTo))].join(', ') },
    { metric: 'Tareas de Alta Prioridad', value: tasks.filter(t => t.priority === 'Alta').length }
  ]);

  analysisSheet.getRow(1).font = { bold: true };
  analysisSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8E8E8' } };

  return workbook;
}

/**
 * Handler principal
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { projectDescription, vertical } = req.body;

    if (!projectDescription) {
      return res.status(400).json({ error: 'projectDescription is required' });
    }

    // Analizar tareas con Bedrock
    const taskStructure = await analyzeTasks(projectDescription, vertical || 'General');

    // Calcular timeline
    const { tasks, projectDuration, criticalPath } = calculateTimeline(taskStructure.tasks);

    // Generar Excel
    const workbook = await generateExcelGantt(tasks, taskStructure.projectName, projectDuration);

    // Retornar como buffer
    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Gantt_${taskStructure.projectName.replace(/\s+/g, '_')}.xlsx"`);
    res.send(buffer);
  } catch (error) {
    console.error('Error generating Gantt:', error);
    res.status(500).json({ error: error.message });
  }
}

export { analyzeTasks, calculateTimeline, generateExcelGantt };
