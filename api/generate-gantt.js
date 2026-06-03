import ExcelJS from 'exceljs';

/**
 * Colores profesionales y suaves
 */
const COLORS = {
  headerBg: 'FFE5E7EB',
  headerText: 'FF374151',
  summaryBg: 'FFF3F4F6',
  taskRowBg: 'FFFAFAFA',
  taskBorder: 'FFD1D5DB',
  barCompleted: 'FF7C3AED',    // Púrpura oscuro - completado
  barPending: 'FFE9D5FF',      // Púrpura claro - pendiente
  alternateRow: 'FFFAFAFA'
};

/**
 * Convierte tareas del proyecto en estructura Gantt
 */
function buildTasksFromProjectData(projectData) {
  if (!projectData?.estimacion?.tareas || projectData.estimacion.tareas.length === 0) {
    throw new Error('No tasks found in project data');
  }

  const projectName = projectData.proyecto?.nombre || 'Sin nombre';
  const tareas = projectData.estimacion.tareas.filter(t => !t.pendiente);

  const tasks = tareas.map((tarea, idx) => ({
    id: idx + 1,
    name: tarea.descripcion || `Tarea ${idx + 1}`,
    profile: 'General',
    dias: Math.max(tarea.dias || 1, 0.5),
    horas: tarea.horas || (tarea.dias * 8),
    importe: tarea.importe || 0,
    startDate: null,
    endDate: null,
    progress: 0,
    dependsOn: null
  }));

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
 * Calcula fechas de forma secuencial
 */
function calculateDates(tasks, startDate = new Date(2026, 2, 1)) {
  let currentDate = new Date(startDate);

  tasks.forEach(task => {
    task.startDate = new Date(currentDate);
    currentDate.setDate(currentDate.getDate() + Math.ceil(task.dias));
    task.endDate = new Date(currentDate);
  });

  return tasks;
}

/**
 * Obtiene rango de fechas del proyecto
 */
function getProjectDateRange(tasks) {
  if (tasks.length === 0) {
    return { start: new Date(), end: new Date() };
  }

  const dates = tasks
    .filter(t => t.startDate && t.endDate)
    .flatMap(t => [t.startDate, t.endDate]);

  const start = new Date(Math.min(...dates.map(d => d.getTime())));
  const end = new Date(Math.max(...dates.map(d => d.getTime())));

  return { start, end };
}

/**
 * Calcula posición de columna para una fecha
 */
function getColumnForDate(date, projectStart) {
  const diff = date.getTime() - projectStart.getTime();
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
}

/**
 * Convierte número a letra Excel (1=A, 2=B, 27=AA, etc)
 */
function columnNumberToLetter(num) {
  let letter = '';
  while (num > 0) {
    num--;
    letter = String.fromCharCode(65 + (num % 26)) + letter;
    num = Math.floor(num / 26);
  }
  return letter;
}

/**
 * Genera el Gantt limpio y profesional
 */
async function generateExcelGantt(tasksData) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Gantt');

  const dateRange = getProjectDateRange(tasksData.tasks);
  const projectStart = dateRange.start;
  const projectEnd = dateRange.end;
  const totalDays = Math.ceil((projectEnd.getTime() - projectStart.getTime()) / (24 * 60 * 60 * 1000)) + 2;

  // ═══ CONFIGURAR COLUMNAS ═══
  const columns = [
    { width: 3 },    // Número
    { width: 32 },   // Nombre tarea
    { width: 10 },   // Inicio
    { width: 10 },   // Fin
    { width: 6 },    // Días
    { width: 6 },    // Avance %
  ];

  // Agregar columnas de días
  for (let i = 0; i < totalDays; i++) {
    columns.push({ width: 2.5 });
  }

  sheet.columns = columns;

  // ═══ FILA 1: TÍTULO ═══
  const titleRow = sheet.addRow([`Diagrama de Gantt — ${tasksData.projectName}`]);
  titleRow.getCell(1).font = { bold: true, size: 12, color: { argb: 'FF1F2937' } };
  titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.summaryBg } };
  titleRow.height = 20;
  const lastCol = columnNumberToLetter(totalDays + 6);
  sheet.mergeCells(`A1:${lastCol}1`);

  // ═══ FILA 2: RESUMEN ═══
  const summary = `${tasksData.totalDias.toFixed(1)} jornadas · ${Math.round(tasksData.totalHoras)}h · ${tasksData.totalImporte.toLocaleString('es-ES')} € · ${tasksData.clientName}`;
  const summaryRow = sheet.addRow([summary]);
  summaryRow.getCell(1).font = { size: 10, color: { argb: COLORS.headerText } };
  summaryRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.summaryBg } };
  summaryRow.height = 16;
  sheet.mergeCells(`A2:${lastCol}2`);

  // ═══ FILA 3: VACÍA ═══
  sheet.addRow([]);

  // ═══ FILA 4: HEADERS DE TABLA ═══
  const headerData = ['Nº', 'Tarea', 'Inicio', 'Fin', 'Días', '%'];

  // Agregar headers de fechas (semanas/días)
  for (let i = 0; i < totalDays; i++) {
    const date = new Date(projectStart);
    date.setDate(date.getDate() + i);
    const dayNames = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
    const dayName = dayNames[date.getDay()];
    const dayNum = date.getDate();
    headerData.push(`${dayNum}`);
  }

  const headerRow = sheet.addRow(headerData);
  headerRow.height = 24;

  // Aplicar estilos a headers
  for (let i = 1; i <= headerData.length; i++) {
    const cell = headerRow.getCell(i);
    cell.font = { bold: true, size: 9, color: { argb: COLORS.headerText } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } };
    cell.alignment = { horizontal: 'center', vertical: 'center' };
    cell.border = {
      bottom: { style: 'thin', color: { argb: COLORS.taskBorder } }
    };
  }

  // ═══ FILAS DE TAREAS ═══
  let rowIdx = 0;

  tasksData.tasks.forEach((task, idx) => {
    const rowData = [
      idx + 1,
      task.name,
      task.startDate.toLocaleDateString('es-ES', { month: '2-digit', day: '2-digit' }),
      task.endDate.toLocaleDateString('es-ES', { month: '2-digit', day: '2-digit' }),
      task.dias.toFixed(1),
      `${task.progress}%`
    ];

    // Llenar celdas de días (vacías, serán coloreadas después)
    for (let i = 0; i < totalDays; i++) {
      rowData.push('');
    }

    const row = sheet.addRow(rowData);
    row.height = 20;

    // Estilos de fila
    const bgColor = idx % 2 === 0 ? 'FFFFFFFF' : COLORS.alternateRow;

    for (let i = 1; i <= 6; i++) {
      const cell = row.getCell(i);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
      cell.font = { size: 9 };
      cell.alignment = { horizontal: i === 2 ? 'left' : 'center', vertical: 'center' };
      cell.border = {
        top: { style: 'hair', color: { argb: COLORS.taskBorder } },
        bottom: { style: 'hair', color: { argb: COLORS.taskBorder } },
        right: i === 6 ? { style: 'thin', color: { argb: COLORS.taskBorder } } : undefined
      };
    }

    // Calcular columnas de inicio y fin
    const colStart = getColumnForDate(task.startDate, projectStart);
    const colEnd = getColumnForDate(task.endDate, projectStart);
    const colOffset = 6; // Primera columna de datos después de info

    // Rellenar barras Gantt
    for (let col = colStart; col < colEnd; col++) {
      const cellCol = col + colOffset;
      if (cellCol < headerData.length) {
        const cell = row.getCell(cellCol);

        // Determinar si esta parte está completada o pendiente
        const progressPercentage = task.progress / 100;
        const daysCompleted = Math.ceil((colEnd - colStart) * progressPercentage);

        // Color según progreso
        const isCompleted = col < colStart + daysCompleted;
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: isCompleted ? COLORS.barCompleted : COLORS.barPending }
        };

        cell.border = {
          left: col === colStart ? { style: 'thin', color: { argb: '00000000' } } : undefined,
          right: col === colEnd - 1 ? { style: 'thin', color: { argb: '00000000' } } : undefined,
          top: { style: 'thin', color: { argb: '00000000' } },
          bottom: { style: 'thin', color: { argb: '00000000' } }
        };
      }
    }

    // Estilos celdas de Gantt
    for (let col = 0; col < totalDays; col++) {
      const cellCol = col + colOffset;
      const cell = row.getCell(cellCol);

      if (!cell.fill || !cell.fill.fgColor) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
      }

      cell.alignment = { horizontal: 'center', vertical: 'center' };
      cell.border = {
        top: { style: 'hair', color: { argb: COLORS.taskBorder } },
        bottom: { style: 'hair', color: { argb: COLORS.taskBorder } },
        left: { style: 'hair', color: { argb: COLORS.taskBorder } },
        right: { style: 'hair', color: { argb: COLORS.taskBorder } }
      };
    }
  });

  // ═══ CONFIGURACIÓN DE IMPRESIÓN ═══
  sheet.pageSetup = {
    paperSize: 9,
    orientation: 'landscape',
    fitToPage: true,
    fitToHeight: 1,
    fitToWidth: 2,
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
  sheet.headerFooter.firstFooter = `Generado: ${new Date().toLocaleDateString('es-ES')}`;

  // Congelar panes
  sheet.views = [{ state: 'frozen', ySplit: 4, xSplit: 6 }];

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

    // Procesar datos
    const tasksData = buildTasksFromProjectData(projectData);
    calculateDates(tasksData.tasks);

    // Generar Excel
    const workbook = await generateExcelGantt(tasksData);
    const buffer = await workbook.xlsx.writeBuffer();

    // Sanitizar nombre
    const safeName = tasksData.projectName
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Gantt_${safeName}.xlsx"`);
    res.send(buffer);
  } catch (error) {
    console.error('Error generating Gantt:', error);
    res.status(500).json({ error: error.message });
  }
}

export { buildTasksFromProjectData, calculateDates, generateExcelGantt };
