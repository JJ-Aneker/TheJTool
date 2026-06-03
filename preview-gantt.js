#!/usr/bin/env node
import { buildTasksFromProjectData, calculateDates, generateExcelGantt } from './api/generate-gantt.js';

// Datos de prueba
const testData = {
  proyecto: {
    nombre: "Campaña Marketing",
    descripcion: "Test"
  },
  cliente: {
    nombre: "Test Client"
  },
  estimacion: {
    tareas: [
      { descripcion: "Planificación", dias: 3, horas: 24, importe: 1800, pendiente: false },
      { descripcion: "Junta directivos", dias: 1, horas: 8, importe: 600, pendiente: false },
      { descripcion: "Aprobación", dias: 2, horas: 16, importe: 1200, pendiente: false },
      { descripcion: "Grabación", dias: 3, horas: 24, importe: 1800, pendiente: false },
      { descripcion: "Edición", dias: 2, horas: 16, importe: 1200, pendiente: false }
    ],
    totalDias: 11,
    totalHoras: 88,
    totalImporte: 6600
  }
};

async function preview() {
  console.log('🎬 PREVISUALIZACIÓN DE GANTT\n');
  console.log('═'.repeat(100));

  const tasksData = buildTasksFromProjectData(testData);
  calculateDates(tasksData.tasks);

  console.log(`\n📋 ${tasksData.projectName}`);
  console.log(`${tasksData.totalDias} jornadas · ${tasksData.totalHoras}h · ${tasksData.totalImporte}€ · ${tasksData.clientName}\n`);

  const projectStart = tasksData.tasks[0].startDate;

  // Mostrar tabla ASCII
  console.log('Nº | Tarea                    | Responsable | Inicio     | Fin        | Días | %  | Gantt');
  console.log('─'.repeat(100));

  tasksData.tasks.forEach((task, idx) => {
    const taskNum = String(idx + 1).padEnd(2);
    const taskName = task.name.substring(0, 24).padEnd(24);
    const responsible = (task.responsible || 'General').padEnd(11);
    const startStr = task.startDate.toLocaleDateString('es-ES');
    const endStr = task.endDate.toLocaleDateString('es-ES');
    const dias = String(task.dias.toFixed(1)).padStart(4);
    const progress = String(task.progress).padStart(2);

    // Calcular barra visual
    const daysFromStart = Math.floor((task.startDate.getTime() - projectStart.getTime()) / (24 * 60 * 60 * 1000));
    const barStart = Math.max(0, daysFromStart);
    const barLength = Math.ceil(task.dias);

    let bar = ' '.repeat(barStart);
    const completedDays = Math.ceil(barLength * (task.progress / 100));
    bar += '█'.repeat(completedDays);
    bar += '░'.repeat(barLength - completedDays);

    console.log(
      `${taskNum} | ${taskName} | ${responsible} | ${startStr} | ${endStr} | ${dias} | ${progress} | ${bar}`
    );
  });

  console.log('\n═'.repeat(100));
  console.log('\n✨ LEYENDA:');
  console.log('  █ = Completado    ░ = Pendiente');
  console.log('\n💾 Generando Excel...\n');

  // Generar Excel
  const workbook = await generateExcelGantt(tasksData);
  await workbook.xlsx.writeFile('C:/Temp/Preview_Gantt.xlsx');

  console.log('✅ Excel guardado en: C:/Temp/Preview_Gantt.xlsx');
  console.log('\n📝 NOTAS:');
  console.log('  • Celdas amarillas = Editables (Inicio y %)');
  console.log('  • La columna Fin se calcula automáticamente');
  console.log('  • Las barras deberían colorearse según el progreso');
}

preview().catch(console.error);
