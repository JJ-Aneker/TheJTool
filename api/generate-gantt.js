import ExcelJS from 'exceljs';

/**
 * Colores profesionales por tipo de tarea y subtarea
 */
const COLORS = {
  headerBg: 'FF1F2937',
  headerText: 'FFFFFFFF',
  summaryBg: 'FFFCF0F0',

  // Colores para bloques principales
  blockColors: [
    'FF185FA5',  // Azul
    'FF0F6E56',  // Verde
    'FFBE123C',  // Rojo
    'FFA16207',  // Naranja
    'FF6B21A8',  // Púrpura
    'FF0891B2'   // Cian
  ],

  // Colores para barras de Gantt (más claros)
  barColors: [
    'FF4F46E5',  // Azul claro
    'FF059669',  // Verde claro
    'FDF1360F',  // Rojo claro
    'FFF97316',  // Naranja claro
    'FFA855F7',  // Púrpura claro
    'FF06B6D4'   // Cian claro
  ],

  subtaskWhite: 'FFFFFFFF',
  subtaskGray: 'FFF2F2F2',
  progressBg: 'FFE0E7FF',    // Fondo progreso
  progressBar: 'FF3B82F6'     // Barra progreso
};

/**
 * Convierte tareas del proyecto en estructura Gantt profesional con jerarquía
 */
function buildTasksFromProjectData(projectData) {
  if (!projectData?.estimacion?.tareas || projectData.estimacion.tareas.length === 0) {
    throw new Error('No tasks found in project data');
  }

  const projectName = projectData.proyecto?.nombre || 'Sin nombre';
  const tareas = projectData.estimacion.tareas.filter(t => !t.pendiente);

  let blockIdx = 0;
  let tasksByBlock = {};
  const tasks = [];

  // Agrupar tareas por conceptos (cada 2-3 tareas es un bloque)
  let currentBlock = String.fromCharCode(65);
  let blockTaskCount = 0;
  let blockColor = COLORS.blockColors[0];
  let barColor = COLORS.barColors[0];

  tareas.forEach((tarea, idx) => {
    // Crear subtareas si la descripción es larga (dividir en partes)
    const isMainTask = idx % 2 === 0 || idx === 0;

    if (isMainTask && idx > 0) {
      blockIdx++;
      currentBlock = String.fromCharCode(65 + (blockIdx % COLORS.blockColors.length));
      blockColor = COLORS.blockColors[blockIdx % COLORS.blockColors.length];
      barColor = COLORS.barColors[blockIdx % COLORS.barColors.length];
    }

    tasks.push({
      id: isMainTask ? currentBlock : `${currentBlock}.${tasks.filter(t => t.id.startsWith(currentBlock)).length}`,
      level: isMainTask ? 0 : 1,
      name: tarea.descripcion || `Tarea ${idx + 1}`,
      profile: 'General',
      dias: Math.max(tarea.dias || 1, 0.5),
      horas: tarea.horas || (tarea.dias * 8),
      importe: tarea.importe || 0,
      startDate: null,
      endDate: null,
      progress: 0, // 0-100
      blockColor: blockColor,
      barColor: barColor,
      dependsOn: null
    });
  });

  return {
    projectName,
    clientName: projectData.cliente?.nombre || '',
    totalDias: projectData.estimacion?.totalDias || tareas.reduce((s, t) => s + (t.dias || 0), 0),
    totalHoras: projectData.estimacion?.totalHoras || tareas.reduce((s, t) => s + (t.horas || 0), 0),
    totalImporte: projectData.estimacion?.totalImporte || tareas.reduce((s, t) => s + (t.importe || 0), 0),
    tasks
  };
}

/**
 * Calcula fechas de inicio/fin secuenciales basadas en días y dependencias
 */
function calculateDates(tasks, startDate = new Date(2026, 7, 1)) {
  const taskMap = new Map(tasks.map(t => [t.id, t]));

  // Calcular fechas secuencialmente
  let currentDate = new Date(startDate);

  tasks.forEach((task, idx) => {
    task.startDate = new Date(currentDate);

    // Calcular fecha fin: startDate + días
    const endDate = new Date(currentDate);
    endDate.setDate(endDate.getDate() + Math.ceil(task.dias));
    task.endDate = endDate;

    // Siguiente tarea comienza después de esta
    currentDate = new Date(endDate);
  });

  return tasks;
}

/**
 * Detecta rango de fechas del proyecto
 */
function getProjectDateRange(tasks) {
  if (tasks.length === 0) return { start: new Date(), end: new Date() };

  const dates = tasks
    .filter(t => t.startDate && t.endDate)
    .flatMap(t => [t.startDate, t.endDate]);

  return {
    start: new Date(Math.min(...dates.map(d => d.getTime()))),
    end: new Date(Math.max(...dates.map(d => d.getTime())))
  };
}

/**
 * Calcula el día del proyecto (0-N) para una fecha
 */
function getDayOfProject(date, projectStart) {
  const diff = date.getTime() - projectStart.getTime();
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
}

/**
 * Genera archivo Excel profesional con diagrama Gantt
 */
async function generateExcelGantt(tasksData) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Gantt');

  // Configurar ancho de columnas
  sheet.columns = [
    { width: 5 },    // Blq.
    { width: 38 },   // Descripción (más ancho)
    { width: 11 },   // Perfil
    { width: 6 },    // Días
    { width: 6 },    // Horas
    { width: 12 },   // Inicio
    { width: 12 },   // Fin
    { width: 8 },    // Progreso
    ...Array.from({ length: 24 }, () => ({ width: 3.5 }))  // Más columnas de días
  ];

  // ═══ FILA 1: Título del Proyecto ═══
  const titleRow = sheet.addRow([`Diagrama de Gantt — ${tasksData.projectName}`]);
  titleRow.getCell(1).font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
  titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC00000' } };
  titleRow.getCell(1).alignment = { horizontal: 'left', vertical: 'center', wrapText: true };
  titleRow.height = 24;
  sheet.mergeCells(`A1:AH1`);

  // ═══ FILA 2: Resumen ═══
  const summary = `Estimación: ${tasksData.totalDias.toFixed(1)} jornadas · ${Math.round(tasksData.totalHoras)} h · ${tasksData.totalImporte.toLocaleString('es-ES')} € · ${tasksData.clientName}`;
  const summaryRow = sheet.addRow([summary]);
  summaryRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.summaryBg } };
  summaryRow.getCell(1).alignment = { horizontal: 'left', vertical: 'center', wrapText: true };
  summaryRow.height = 18;
  sheet.mergeCells(`A2:AH2`);

  // ═══ FILA 3: Espaciador ═══
  sheet.addRow([]);

  // ═══ FILA 4: Headers ═══
  const startDate = tasksData.tasks[0]?.startDate || new Date(2026, 7, 1);
  const headers = ['Blq.', 'Descripción de tarea', 'Perfil', 'Días', 'Horas', 'Inicio', 'Fin', '% Avance'];

  // Agregar columnas de fechas (24 días)
  for (let i = 0; i < 24; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const dayName = ['L', 'M', 'X', 'J', 'V', 'S', 'D'][date.getDay()];
    headers.push(`${dayName}\n${day}/${month}`);
  }

  const headerRow = sheet.addRow(headers);
  headerRow.height = 32;

  for (let i = 1; i <= headers.length; i++) {
    const cell = headerRow.getCell(i);
    cell.font = { bold: true, color: { argb: COLORS.headerText }, size: 10 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } };
    cell.alignment = { horizontal: 'center', vertical: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    };
  }

  // ═══ FILAS DE TAREAS CON BARRAS DE COLOR ═══
  let rowIsWhite = true;

  tasksData.tasks.forEach((task, idx) => {
    const isMainTask = task.level === 0;
    const bgColor = isMainTask ? task.blockColor : (rowIsWhite ? COLORS.subtaskWhite : COLORS.subtaskGray);
    const textColor = isMainTask ? 'FFFFFFFF' : 'FF000000';
    const indent = task.level > 0 ? '  ├─ ' : '';

    const rowData = [
      task.id,
      indent + task.name,
      task.profile,
      task.dias,
      Math.round(task.horas),
      task.startDate ? task.startDate.toLocaleDateString('es-ES', { year: '2-digit', month: '2-digit', day: '2-digit' }) : '',
      task.endDate ? task.endDate.toLocaleDateString('es-ES', { year: '2-digit', month: '2-digit', day: '2-digit' }) : '',
      `${task.progress}%`
    ];

    // Agregar celdas de Gantt con barras de color sólido
    for (let i = 0; i < 24; i++) {
      const dayStart = new Date(startDate);
      dayStart.setDate(dayStart.getDate() + i);

      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      // Verificar si la tarea incluye este día
      const taskStart = new Date(task.startDate);
      const taskEnd = new Date(task.endDate);

      const isInRange = taskStart < dayEnd && taskEnd > dayStart;

      rowData.push(isInRange ? '█' : '');
    }

    const row = sheet.addRow(rowData);
    row.height = 22;

    // Aplicar estilos a cada celda
    for (let i = 1; i <= rowData.length; i++) {
      const cell = row.getCell(i);

      // Celdas de datos (1-8)
      if (i <= 8) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        cell.font = { color: { argb: textColor }, size: i === 2 ? 10 : 9, bold: isMainTask };
        cell.alignment = {
          horizontal: i === 8 ? 'center' : (i === 2 ? 'left' : 'center'),
          vertical: 'center',
          wrapText: i === 2
        };
      }
      // Celdas de Gantt (9+)
      else {
        const dayStart = new Date(startDate);
        dayStart.setDate(dayStart.getDate() + (i - 9));
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const isInRange = task.startDate < dayEnd && task.endDate > dayStart;

        if (isInRange) {
          // Color de barra según tarea
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: task.barColor } };
          cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
        } else {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        }

        cell.alignment = { horizontal: 'center', vertical: 'center' };
      }

      // Bordes
      cell.border = {
        top: { style: 'hair', color: { argb: 'FFD3D3D3' } },
        bottom: { style: 'hair', color: { argb: 'FFD3D3D3' } },
        left: { style: 'hair', color: { argb: 'FFD3D3D3' } },
        right: { style: 'hair', color: { argb: 'FFD3D3D3' } }
      };
    }

    rowIsWhite = !rowIsWhite;
  });

  // ═══ CONFIGURACIÓN DE IMPRESIÓN ═══
  sheet.pageSetup = {
    paperSize: 9,
    orientation: 'landscape',
    fitToPage: true,
    fitToHeight: 1,
    fitToWidth: 3,
    horizontalDpi: 300,
    verticalDpi: 300
  };

  sheet.margins = {
    left: 0.4,
    right: 0.4,
    top: 0.75,
    bottom: 0.75,
    header: 0.3,
    footer: 0.3
  };

  sheet.headerFooter.firstHeader = `Diagrama de Gantt — ${tasksData.projectName}`;
  sheet.headerFooter.firstFooter = `Generado: ${new Date().toLocaleDateString('es-ES')} | Página &P de &N`;

  // Congelar panes (mantener headers visibles)
  sheet.views = [{ state: 'frozen', ySplit: 4, xSplit: 2 }];

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
    const { projectData } = req.body;

    if (!projectData) {
      return res.status(400).json({ error: 'projectData is required' });
    }

    // Convertir y procesar datos
    const tasksData = buildTasksFromProjectData(projectData);

    // Calcular fechas
    calculateDates(tasksData.tasks);

    // Generar Excel
    const workbook = await generateExcelGantt(tasksData);

    // Retornar como buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Sanitizar nombre del proyecto para el filename
    const safeName = tasksData.projectName
      .replace(/[^a-zA-Z0-9\s]/g, '')  // Eliminar caracteres especiales
      .replace(/\s+/g, '_')             // Reemplazar espacios
      .substring(0, 50);                // Limitar longitud

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Gantt_${safeName}.xlsx"`);
    res.send(buffer);
  } catch (error) {
    console.error('Error generating Gantt:', error);
    res.status(500).json({ error: error.message });
  }
}

export { buildTasksFromProjectData, calculateDates, generateExcelGantt };
