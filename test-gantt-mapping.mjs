/**
 * Test para verificar qué datos genera mapProjectDataToTasks
 */

function addWorkingDays(date, days) {
  let current = new Date(date)
  let daysAdded = 0

  while (daysAdded < days) {
    const dayOfWeek = current.getDay()
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      daysAdded++
      if (daysAdded >= days) break
    }
    current.setDate(current.getDate() + 1)
  }

  return current
}

function formatDate(date) {
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const yyyy = date.getFullYear()
  const dayName = ['D', 'L', 'M', 'X', 'J', 'V', 'S'][date.getDay()]
  return `${dd}/${mm}/${yyyy} (${dayName})`
}

function mapProjectDataToTasks(projectData, startDate = null) {
  const projectStartDate = startDate ? new Date(startDate) : new Date(2026, 5, 8) // 8/6/2026
  let currentDate = new Date(projectStartDate)

  return projectData.estimacion.tareas.map((task, idx) => {
    // Si currentDate es fin de semana, saltar al siguiente lunes
    let taskStartDate = new Date(currentDate)
    console.log(`\n  [Antes de ajuste] currentDate = ${formatDate(taskStartDate)}`)

    while (taskStartDate.getDay() === 0 || taskStartDate.getDay() === 6) {
      console.log(`    → Fin de semana, saltando...`)
      taskStartDate.setDate(taskStartDate.getDate() + 1)
    }
    console.log(`  [Después de ajuste] taskStartDate = ${formatDate(taskStartDate)}`)

    const dias = task.dias || task.duracion || 1
    const taskEndDate = addWorkingDays(taskStartDate, Math.ceil(dias))
    console.log(`  [Calculado] F.Fin = taskStartDate + ${dias} días = ${formatDate(taskEndDate)}`)

    // Actualizar fecha actual para la siguiente tarea
    currentDate = new Date(taskEndDate)
    currentDate.setDate(currentDate.getDate() + 1)
    console.log(`  [Siguiente] currentDate = ${formatDate(currentDate)}`)

    return {
      n: idx + 1,
      tarea: task.descripcion || 'Tarea ' + (idx + 1),
      dias: dias,
      inicio: taskStartDate,
      endDate: taskEndDate,
      subtareas: (() => {
        let subtaskDate = new Date(taskStartDate)
        return (task.subtareas || []).map((subtask) => {
          const subtaskDias = subtask.dias || 0.5
          const subtaskStartDate = new Date(subtaskDate)
          const subtaskEndDate = addWorkingDays(subtaskStartDate, Math.ceil(subtaskDias))

          // Próxima subtarea comienza después de esta
          subtaskDate = new Date(subtaskEndDate)
          subtaskDate.setDate(subtaskDate.getDate() + 1)

          return {
            tarea: subtask.descripcion || 'Subtarea',
            dias: subtaskDias,
            inicio: subtaskStartDate,
            endDate: subtaskEndDate
          }
        })
      })()
    }
  })
}

// Datos de ejemplo
const projectData = {
  estimacion: {
    tareas: [
      { descripcion: 'Análisis', dias: 5.0, subtareas: [
        { descripcion: 'Entrevista', dias: 2.0 },
        { descripcion: 'Documento', dias: 2.0 }
      ]},
      { descripcion: 'Diseño', dias: 8.0, subtareas: [
        { descripcion: 'Arquitectura', dias: 3.0 },
        { descripcion: 'BD', dias: 3.0 },
        { descripcion: 'UI', dias: 2.0 }
      ]},
      { descripcion: 'Desarrollo', dias: 10.0, subtareas: [
        { descripcion: 'Frontend', dias: 3.0 },
        { descripcion: 'Backend', dias: 4.0 }
      ]},
      { descripcion: 'Testing', dias: 7.0, subtareas: [
        { descripcion: 'Unit', dias: 3.0 },
        { descripcion: 'Integration', dias: 2.0 }
      ]}
    ]
  }
}

console.log('📊 TEST: Mapeo de Tareas\n')
console.log('='.repeat(80))

const tasks = mapProjectDataToTasks(projectData)

console.log('\n' + '='.repeat(80))
console.log('\n📋 RESULTADO FINAL:\n')

tasks.forEach((task, idx) => {
  console.log(`Tarea ${task.n}: ${task.tarea}`)
  console.log(`  F.Inicio: ${formatDate(task.inicio)}`)
  console.log(`  F.Fin:    ${formatDate(task.endDate)}`)
  console.log(`  Días:     ${task.dias}`)

  if (task.subtareas && task.subtareas.length > 0) {
    console.log(`  Subtareas:`)
    task.subtareas.forEach((sub) => {
      console.log(`    - ${sub.tarea}: ${formatDate(sub.inicio)} → ${formatDate(sub.endDate)} (${sub.dias} días)`)
    })
  }
  console.log('')
})

console.log('='.repeat(80))
