import ExcelJS from 'exceljs';

const COLORS = {
  headerBg: 'FFE5E7EB',
  headerText: 'FF374151',
  summaryBg: 'FFF3F4F6',
  barCompleted: '7C3AED',    // Púrpura oscuro
  barPending: 'E9D5FF',      // Púrpura claro
  editableBg: 'FEF3C7'       // Amarillo claro
};

function columnNumberToLetter(num) {
  let letter = '';
  while (num > 0) {
    num--;
    letter = String.fromCharCode(65 + (num % 26)) + letter;
    num = Math.floor(num / 26);
  }
  return letter;
}

function buildTasksFromProjectData(projectData) {
  if (!projectData?.estimacion?.tareas || projectData.estimacion.tareas.length === 0) {
    throw new Error('No tasks found in project data');
  }

  const projectName = projectData.proyecto?.nombre || 'Sin nombre';
  const tareas = projectData.estimacion.tareas.filter(t => !t.pendiente);

  const tasks = tareas.map((tarea, idx) => ({
    id: idx + 1,
    name: tarea.descripcion || `Tarea ${idx + 1}`,
    responsible: 'General',
    dias: Math.max(tarea.dias || 1, 0.5),
    progress: 0,
    startDate: null,
    endDate: null
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

function calculateDates(tasks, startDate = new Date(2026, 2, 1)) {
  let currentDate = new Date(startDate);

  tasks.forEach(task => {
    task.startDate = new Date(currentDate);
    currentDate.setDate(currentDate.getDate() + Math.ceil(task.dias));
    task.endDate = new Date(currentDate);
  });

  return tasks;
}

async function generateExcelGantt(tasksData) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Gantt');

  const projectStart = tasksData.tasks[0]?.startDate || new Date(2026, 2, 1);
  const lastTask = tasksData.tasks[tasksData.tasks.length - 1];
  const projectEnd = lastTask?.endDate || new Date(projectStart.getTime() + 30 * 24 * 60 * 60 * 1000);

  const totalDays = Math.ceil((projectEnd.getTime() - projectStart.getTime()) / (24 * 60 * 60 * 1000)) + 2;

  // ═══ CONFIGURAR COLUMNAS ═══
  const columns = [
    { width: 3 },    // Nº
    { width: 28 },   // Tarea
    { width: 14 },   // Responsable
    { width: 12 },   // Inicio (editable)
    { width: 12 },   // Fin (fórmula)
    { width: 6 },    // Días
    { width: 7 },    // % (editable)
  ];

  for (let i = 0; i < totalDays; i++) {
    columns.push({ width: 2.2 });
  }

  sheet.columns = columns;

  // ═══ FILA 1: TÍTULO ═══
  const titleRow = sheet.addRow([`Diagrama de Gantt — ${tasksData.projectName}`]);
  titleRow.getCell(1).font = { bold: true, size: 12, color: { argb: 'FF1F2937' } };
  titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + COLORS.summaryBg } };
  titleRow.height = 20;
  const lastCol = columnNumberToLetter(totalDays + 7);
  sheet.mergeCells(`A1:${lastCol}1`);

  // ═══ FILA 2: RESUMEN ═══
  const summary = `${tasksData.totalDias.toFixed(1)} jornadas · ${Math.round(tasksData.totalHoras)}h · ${tasksData.totalImporte.toLocaleString('es-ES')} € · ${tasksData.clientName}`;
  const summaryRow = sheet.addRow([summary]);
  summaryRow.getCell(1).font = { size: 10, color: { argb: 'FF' + COLORS.headerText } };
  summaryRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + COLORS.summaryBg } };
  summaryRow.height = 16;
  sheet.mergeCells(`A2:${lastCol}2`);

  sheet.addRow([]); // Espaciador

  // ═══ FILA 4: HEADERS ═══
  const headers = ['Nº', 'Tarea', 'Responsable', 'Inicio', 'Fin', 'Días', '%'];

  for (let i = 0; i < totalDays; i++) {
    const date = new Date(projectStart);
    date.setDate(date.getDate() + i);
    const dayNum = date.getDate();
    headers.push(`${dayNum}`);
  }

  const headerRow = sheet.addRow(headers);
  headerRow.height = 26;

  for (let i = 1; i <= headers.length; i++) {
    const cell = headerRow.getCell(i);
    cell.font = { bold: true, size: 9, color: { argb: 'FF' + COLORS.headerText } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + COLORS.headerBg } };
    cell.alignment = { horizontal: 'center', vertical: 'center', wrapText: true };
    cell.border = { bottom: { style: 'thin', color: { argb: 'FF' + COLORS.headerText } } };
  }

  // ═══ FILAS DE TAREAS CON FORMATO CONDICIONAL ═══
  const dataStartRow = 5;
  const dataColOffset = 7;

  tasksData.tasks.forEach((task, taskIdx) => {
    const rowIdx = dataStartRow + taskIdx;
    const row = sheet.getRow(rowIdx);

    // Datos básicos
    row.getCell(1).value = taskIdx + 1;
    row.getCell(2).value = task.name;
    row.getCell(3).value = task.responsible;

    // INICIO (editable)
    row.getCell(4).value = task.startDate;
    row.getCell(4).numFmt = 'dd/mm/yyyy';
    row.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + COLORS.editableBg } };

    // FIN (FÓRMULA) = Inicio + Días
    row.getCell(5).value = {
      formula: `=D${rowIdx}+F${rowIdx}`,
      result: task.endDate
    };
    row.getCell(5).numFmt = 'dd/mm/yyyy';

    // DÍAS (fijo)
    row.getCell(6).value = task.dias;
    row.getCell(6).numFmt = '0.0';

    // % PROGRESO (editable)
    row.getCell(7).value = task.progress / 100;
    row.getCell(7).numFmt = '0%';
    row.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + COLORS.editableBg } };

    // ═══ BARRAS GANTT - COLOREADO DIRECTO ═══
    for (let dayCol = 0; dayCol < totalDays; dayCol++) {
      const cellCol = dataColOffset + dayCol;
      const cell = row.getCell(cellCol);

      const dayDate = new Date(projectStart);
      dayDate.setDate(dayDate.getDate() + dayCol);

      const isInRange = dayDate >= task.startDate && dayDate < task.endDate;

      cell.value = '';
      cell.alignment = { horizontal: 'center', vertical: 'center' };
      cell.border = {
        top: { style: 'hair', color: { argb: 'FFE8E8E8' } },
        bottom: { style: 'hair', color: { argb: 'FFE8E8E8' } },
        left: { style: 'hair', color: { argb: 'FFE8E8E8' } },
        right: { style: 'hair', color: { argb: 'FFE8E8E8' } }
      };

      if (isInRange) {
        const daysFromStart = Math.floor((dayDate - task.startDate) / (24 * 60 * 60 * 1000)) + 1;
        const totalDaysTask = Math.ceil(task.dias);
        const completedDays = Math.ceil((totalDaysTask * task.progress) / 100);

        if (daysFromStart <= completedDays) {
          // Completado
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + COLORS.barCompleted } };
        } else {
          // Pendiente
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + COLORS.barPending } };
        }
      }
    }

    // Estilos de datos
    const bgColor = taskIdx % 2 === 0 ? 'FFFFFFFF' : 'FFFAFAFA';
    for (let col = 1; col <= 7; col++) {
      const cell = row.getCell(col);
      if (col !== 4 && col !== 7) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
      }
      cell.border = {
        top: { style: 'hair', color: { argb: 'FFD1D5DB' } },
        bottom: { style: 'hair', color: { argb: 'FFD1D5DB' } }
      };
      cell.alignment = { horizontal: col === 1 ? 'center' : 'left', vertical: 'center' };
      cell.font = { size: 9 };
    }

    row.height = 22;
  });

  // ═══ CONFIGURACIÓN DE IMPRESIÓN ═══
  sheet.pageSetup = {
    paperSize: 9,
    orientation: 'landscape',
    fitToPage: true,
    fitToHeight: 1,
    fitToWidth: 2
  };

  sheet.margins = { left: 0.4, right: 0.4, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 };
  sheet.headerFooter.firstHeader = `Gantt — ${tasksData.projectName}`;
  sheet.headerFooter.firstFooter = `Generado: ${new Date().toLocaleDateString('es-ES')}`;

  // Congelar panes
  sheet.views = [{ state: 'frozen', ySplit: 4, xSplit: 7 }];

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

    const tasksData = buildTasksFromProjectData(projectData);
    calculateDates(tasksData.tasks);

    const workbook = await generateExcelGantt(tasksData);
    const buffer = await workbook.xlsx.writeBuffer();

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
