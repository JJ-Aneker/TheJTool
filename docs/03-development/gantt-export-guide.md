# Gantt Export Implementation Guide

## Overview

El sistema de exportación de Gantt ahora utiliza una plantilla Excel con macros VBA incrustadas. El flujo es:

1. **Backend (Node.js)**: Carga la plantilla `gantt-template.xlsm` desde `public/templates/`
2. **Datos**: ExcelJS escribe solo los datos de tareas (filas 5+, columnas A-G)
3. **Descarga**: El usuario descarga un archivo .xlsm con macros
4. **Excel**: El usuario abre el archivo y hace clic en "Actualizar"
5. **VBA**: Las macros generan calendario, colorean barras y crean leyenda

---

## Archivos Implementados

### 1. Plantilla Base: `public/templates/gantt-template.xlsm`

**Contenido:**
- Hoja "Gantt" con estructura lista para datos
- Filas 1-4: Reservadas para VBA (título, leyenda, meses, días)
- Fila 4: Encabezados (Nº | Tarea | Responsable | F.Inicio | F.Fin | Días | %)
- Fila 5+: Vacías para datos de tareas
- Columnas H+: Vacías para calendario (generado por VBA)

**VBA incrustado:**
- `ActualizarGantt()`: Macro principal (ejecutada al abrir o clic en botón)
- `AgregarTitulo()`: Crea título y botón "Actualizar"
- `CrearLeyenda()`: Leyenda de colores (5 rangos de %)
- `GenerarCalendario()`: Genera meses (fila 2) y días (fila 3)
- `ColorearBarrasGantt()`: Colorea celdas según fechas de tarea y progreso

**Generación:**
```bash
node create-gantt-template.mjs
powershell -ExecutionPolicy Bypass -File docs/agregar-vba-a-plantilla.ps1
```

---

### 2. Backend: `api/exportGanttTemplate.js`

**Función:** `exportGanttFromTemplate(tasks)`

**Qué hace:**
1. Carga `public/templates/gantt-template.xlsm` con ExcelJS
2. Aplana tareas y subtareas para escritura
3. Escribe datos en filas 5+:
   - Col A: Número de tarea (vacío si subtarea)
   - Col B: Nombre de tarea/subtarea (con prefijo `├─` si es subtarea)
   - Col C: Responsable
   - Col D: F.Inicio (como número serial de Excel, formato dd/mm/yyyy)
   - Col E: Vacío (VBA calcula con WORKDAY)
   - Col F: Días laborables
   - Col G: % (como decimal 0-1, formato 0%)
4. Devuelve Buffer para descargar

**Clave:** Conversión de fechas a número serial de Excel:
```javascript
function dateToExcelSerial(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const excelEpoch = new Date(1899, 11, 30)
  return Math.floor((d - excelEpoch) / (1000 * 60 * 60 * 24))
}
```

---

### 3. Handler: `api/export-gantt-handler.js`

**Endpoint:** `POST /api/export-gantt`

**Request:**
```json
{
  "projectData": { /* estimación con tareas */ },
  "startDate": "2026-06-08" // opcional
}
```

**Response:**
- Content-Type: `application/vnd.ms-excel.sheet.macroEnabled.12`
- Content-Disposition: `attachment; filename="Gantt_[NombrProyecto].xlsm"`
- Body: Buffer XLSM (31 KB aprox)

**Flujo:**
1. Mapea `projectData.estimacion.tareas` a estructura interna
2. Calcula fechas de inicio/fin usando días laborables (lunes-viernes)
3. Llama a `exportGanttFromTemplate(tasks)`
4. Envía el buffer al cliente para descargar

---

### 4. Test: `test-gantt-export-template.mjs`

**Uso:**
```bash
node test-gantt-export-template.mjs
```

**Qué hace:**
1. Crea 3 tareas de ejemplo con subtareas
2. Envía POST a `/api/export-gantt`
3. Descarga el archivo en `output/Gantt_Test_Project.xlsm`
4. Muestra tamaño y próximos pasos

**Output esperado:**
```
✅ Archivo descargado: C:\GitHub\TheJTool\output\Gantt_TestProject.xlsm
📊 Tamaño: 16.44 KB

🎯 Próximos pasos:
   1. Abre el archivo en Excel
   2. Haz clic en "Actualizar" para ejecutar la macro
   3. Las barras del Gantt se generarán automáticamente
```

---

## Flujo de Uso (Usuario Final)

1. **En la app:**
   - Usuario analiza un briefing
   - Se estiman tareas y subtareas
   - Hace clic en "Descargar Gantt"

2. **En el servidor:**
   - Handler mapea tareas
   - Carga plantilla desde `public/templates/gantt-template.xlsm`
   - ExcelJS escribe datos
   - Devuelve .xlsm

3. **En el navegador:**
   - Se descarga `Gantt_[NombreProyecto].xlsm`

4. **En Excel:**
   - Usuario abre el archivo
   - Excel ejecuta `Workbook_Open()` automáticamente
   - Las macros generan:
     - Título en A1:G1
     - Leyenda en fila 2
     - Calendario (meses en fila 2, días en fila 3)
     - Barras coloreadas según progreso
   - Usuario puede hacer clic en "Actualizar" para recalcular

---

## Datos de Entrada (Structure)

### ProjectData

```javascript
{
  proyecto: {
    nombre: "Nombre del Proyecto" // se usa para el nombre del archivo
  },
  estimacion: {
    tareas: [
      {
        descripcion: "Tarea 1",
        dias: 5,
        responsable: "Juan",
        progreso: 100, // porcentaje 0-100
        subtareas: [
          {
            descripcion: "Subtarea 1.1",
            dias: 2,
            responsable: "María",
            progreso: 100
          },
          // ...
        ]
      },
      // ...
    ]
  }
}
```

### Mapeo a Excel

```
Entrada (projectData)          Excel (exportGanttFromTemplate)
├── tarea.descripcion       →   Col B: "Tarea 1" o "├─ Subtarea"
├── tarea.responsable       →   Col C: "Juan"
├── tarea.dias              →   Col F: 5
├── tarea.progreso          →   Col G: 1.00 (100%)
├── tarea.inicio (calculado)→   Col D: 44911 (número serial)
└── tarea.fin (por VBA)     →   Col E: (vacío, fórmula WORKDAY)
```

---

## Cálculo de Fechas

### Backend (mapProjectDataToTasks)

```javascript
// Tarea 1 comienza en startDate (ajustado al lunes si es fin de semana)
taskStartDate = lunes siguiente si startDate es sábado/domingo

// Tarea 1 termina después de N días laborables
taskEndDate = addWorkingDays(taskStartDate, dias)
// Cuenta: L, M, X, J, V (salta sábado y domingo)

// Subtarea comienza después de tarea principal
subtaskStartDate = taskStartDate
subtaskEndDate = addWorkingDays(subtaskStartDate, subtaskDias)

// Próxima subtarea comienza después de esta
subtaskDate = addWorkingDays(subtaskEndDate, 1)
```

### Excel VBA (ColorearBarrasGantt)

```vb
taskStart = ws.Cells(i, 4).Value  ' F.Inicio
taskEnd = ws.Cells(i, 5).Value    ' F.Fin (calculada por WORKDAY)

For cada día en el calendario:
  If día >= taskStart AND día <= taskEnd AND día no es fin de semana:
    Colorear celda según progreso %
```

---

## Colores de Progreso

| Rango | Color RGB | Hex |
|-------|-----------|-----|
| 0-25% | 189, 221, 242 | Light Blue |
| 26-50% | 123, 191, 232 | Medium Blue |
| 51-75% | 46, 141, 212 | Medium Dark Blue |
| 76-100% | 26, 94, 154 | Dark Blue |
| Fin de semana | 200, 200, 200 | Gray |

---

## Troubleshooting

### "Plantilla no encontrada"
```bash
# Regenerar plantilla
node create-gantt-template.mjs
powershell -ExecutionPolicy Bypass -File docs/agregar-vba-a-plantilla.ps1
```

### Macros no se ejecutan
- ✅ El archivo debe ser `.xlsm` (macro-enabled)
- ✅ Excel debe permitir macros (no bloquear con "Protected View")
- ✅ Hacer clic en "Actualizar" ejecuta manualmente si no se ejecutan al abrir

### Barras no aparecen
1. Verificar que F.Inicio (Col D) tiene fechas válidas en formato dd/mm/yyyy
2. Verificar que F.Fin (Col E) no está vacío (debería tener fórmula WORKDAY)
3. Hacer clic en "Actualizar"
4. Si sigue sin funcionar, abrir panel de VBA (Alt+F8) y ejecutar `ColorearBarrasGantt` manualmente

### Archivo corrupto
- Excel dirá "Este libro tiene un formato o extensión no válidos"
- Solución: Regenerar plantilla con los scripts de arriba

---

## API Summary

### Endpoint

```
POST /api/export-gantt
Content-Type: application/json

{
  "projectData": { ... },
  "startDate": "2026-06-08"  // opcional
}

Response:
- 200: Blob XLSM con Content-Disposition: attachment
- 400: Error de validación
- 500: Error en generación
```

### JavaScript Client (src/services/ganttService.js)

```javascript
import { ganttService } from './services/ganttService'

// Descargar Gantt
await ganttService.generateGantt(projectData, optionalStartDate)
// → Descarga automáticamente Gantt_[NombreProyecto].xlsm
```

---

## Development Notes

- **ExcelJS:** v4.4.0 (no puede crear/modificar VBA)
- **Plantilla:** Generada con ExcelJS, enriquecida con VBA vía PowerShell COM
- **VBA:** Almacenado en componente `GanttMacros` del workbook
- **Almacenamiento:** Plantilla en `public/templates/` (assets estáticos)
- **Descargas:** No se guardan en servidor (buffer directo al cliente)

---

## Future Improvements

- [ ] Permitir seleccionar colores personalizados
- [ ] Exportar también a PDF con gráfico de barras
- [ ] Sincronizar cambios en Excel de vuelta a la app
- [ ] Plantillas alternativas (proyecto, portfolio, Gantt interactivo)
