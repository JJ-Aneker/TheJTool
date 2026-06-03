import ExcelJS from 'exceljs';

/**
 * Colores profesionales por tipo de tarea
 */
const COLORS = {
  headerBg: 'FF1F2937',
  headerText: 'FFFFFFFF',
  summaryBg: 'FFFCF0F0',
  blockMain: 'FF185FA5',
  blockAlt1: 'FF0F6E56',
  blockAlt2: 'FFBE123C',
  blockAlt3: 'FFA16207',
  subtaskWhite: 'FFFFFFFF',
  subtaskGray: 'FFF2F2F2'
};

/**
 * Convierte tareas del proyecto en estructura Gantt profesional
 */
function buildTasksFromProjectData(projectData) {
  if (!projectData?.estimacion?.tareas || projectData.estimacion.tareas.length === 0) {
    throw new Error('No tasks found in project data');
  }

  const projectName = projectData.proyecto?.nombre || 'Sin nombre';
  const tareas = projectData.estimacion.tareas.filter(t => !t.pendiente);

  const tasks = tareas.map((tarea, idx) => ({
    id: `${String.fromCharCode(65 + Math.floor(idx / 10))}${idx % 10 || ''}`.substring(0, 3),
    level: 0,
    name: tarea.descripcion || `Tarea ${idx + 1}`,
    profile: 'General',
    dias: Math.max(tarea.dias || 1, 0.5),
    horas: tarea.horas || (tarea.dias * 8),
    importe: tarea.importe || 0,
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

/**
 * Calcula fechas de inicio/fin secuenciales
 */
function calculateDates(tasks, startDate = new Date(2026, 6, 1)) {
  let currentDate = new Date(startDate);

  tasks.forEach(task => {
    task.startDate = new Date(currentDate);
    currentDate.setDate(currentDate.getDate() + task.dias);
    task.endDate = new Date(currentDate);
  });

  return tasks;
}

/**
 * Genera archivo Excel profesional con diagrama Gantt
 */
async function generateExcelGantt(tasksData) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Gantt');

  // Configurar ancho de columnas
  sheet.columns = [
    { width: 5 },   // Blq.
    { width: 35 },  // Descripción
    { width: 12 },  // Perfil
    { width: 6 },   // Días
    { width: 6 },   // Horas
    { width: 11 },  // Inicio
    { width: 11 },  // Fin
    ...Array.from({ length: 20 }, () => ({ width: 4.2 }))  // Columnas de días
  ];

  // ═══ FILA 1: Título del Proyecto ═══
  const titleRow = sheet.addRow([`Diagrama de Gantt — ${tasksData.projectName}`]);
  titleRow.getCell(1).font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
  titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC00000' } };
  titleRow.getCell(1).alignment = { horizontal: 'left', vertical: 'center', wrapText: true };
  titleRow.height = 24;
  sheet.mergeCells(`A1:X1`);

  // ═══ FILA 2: Resumen ═══
  const summary = `Estimación: ${tasksData.totalDias.toFixed(1)} jornadas · ${Math.round(tasksData.totalHoras)} h · ${tasksData.totalImporte.toLocaleString('es-ES')} € · ${tasksData.clientName}`;
  const summaryRow = sheet.addRow([summary]);
  summaryRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.summaryBg } };
  summaryRow.getCell(1).alignment = { horizontal: 'left', vertical: 'center', wrapText: true };
  summaryRow.height = 18;
  sheet.mergeCells(`A2:X2`);

  // ═══ FILA 3: Espaciador ═══
  sheet.addRow([]);

  // ═══ FILA 4: Headers ═══
  const startDate = tasksData.tasks[0]?.startDate || new Date(2026, 6, 1);
  const headers = ['Blq.', 'Descripción de tarea', 'Perfil', 'Días', 'Horas', 'Inicio', 'Fin'];

  // Agregar columnas de fechas
  for (let i = 0; i < 20; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    headers.push(`D${i + 1}\n${day}/${month}`);
  }

  const headerRow = sheet.addRow(headers);
  headerRow.height = 30;

  for (let i = 1; i <= headers.length; i++) {
    const cell = headerRow.getCell(i);
    cell.font = { bold: true, color: { argb: COLORS.headerText }, size: 11 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } };
    cell.alignment = { horizontal: 'center', vertical: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' }
    };
  }

  // ═══ FILAS DE TAREAS ═══
  const blockColors = [COLORS.blockMain, COLORS.blockAlt1, COLORS.blockAlt2, COLORS.blockAlt3];
  let currentBlock = '';
  let blockColorIdx = 0;
  let rowIsWhite = true;

  tasksData.tasks.forEach((task, idx) => {
    const blockId = task.id.charAt(0);
    if (blockId !== currentBlock) {
      currentBlock = blockId;
      blockColorIdx = (blockColorIdx + 1) % blockColors.length;
      rowIsWhite = true;
    }

    const blockColor = blockColors[blockColorIdx];
    const bgColor = idx === 0 || task.id.length === 1 ? blockColor : (rowIsWhite ? COLORS.subtaskWhite : COLORS.subtaskGray);
    const textColor = idx === 0 || task.id.length === 1 ? 'FFFFFFFF' : 'FF000000';

    const rowData = [
      task.id,
      task.name,
      task.profile,
      task.dias,
      Math.round(task.horas),
      task.startDate ? task.startDate.toLocaleDateString('es-ES', { weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit' }) : '',
      task.endDate ? task.endDate.toLocaleDateString('es-ES', { weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit' }) : ''
    ];

    // Agregar celdas de Gantt (barras visuales)
    for (let i = 0; i < 20; i++) {
      const dayStart = new Date(startDate);
      dayStart.setDate(dayStart.getDate() + i);

      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const isInRange = task.startDate && task.endDate &&
                        task.startDate < dayEnd && task.endDate > dayStart;

      rowData.push(isInRange ? '█' : '');
    }

    const row = sheet.addRow(rowData);
    row.height = 20;

    for (let i = 1; i <= rowData.length; i++) {
      const cell = row.getCell(i);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
      cell.font = { color: { argb: textColor }, size: i === 2 ? 10 : 9 };
      cell.alignment = {
        horizontal: i >= 8 ? 'center' : 'left',
        vertical: 'center',
        wrapText: i === 2
      };
      cell.border = {
        top: { style: 'hair', color: { argb: 'FFD3D3D3' } },
        bottom: { style: 'hair', color: { argb: 'FFD3D3D3' } },
        left: { style: 'hair', color: { argb: 'FFD3D3D3' } },
        right: { style: 'hair', color: { argb: 'FFD3D3D3' } }
      };
    }

    rowIsWhite = !rowIsWhite;
  });

  // Configurar imprenta
  sheet.pageSetup = {
    paperSize: 9,  // A4
    orientation: 'landscape',
    fitToPage: false,
    fitToHeight: 1,
    fitToWidth: 2,
    horizontalDpi: 300,
    verticalDpi: 300
  };

  sheet.margins = {
    left: 0.5,
    right: 0.5,
    top: 0.75,
    bottom: 0.75,
    header: 0.3,
    footer: 0.3
  };

  // Encabezado y pie de página
  sheet.headerFooter.firstHeader = `Diagrama de Gantt — ${tasksData.projectName}`;
  sheet.headerFooter.firstFooter = `Generado: ${new Date().toLocaleDateString('es-ES')} &P de &N`;

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
