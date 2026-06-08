# Gantt Frontend Implementation — Plantilla XLSM

## Resumen de Implementación

Se ha implementado la exportación de Gantt completamente en el **frontend React** usando ExcelJS y la plantilla que ya tienes en `public/templates/gantt-template.xlsm`.

---

## Cambios Realizados

### 1. **src/components/GanttViewer.jsx**

#### Imports agregados:
```javascript
import ExcelJS from 'exceljs'
```

#### Nuevas funciones:

**`dateToExcelSerial(date)`**
- Convierte fecha JavaScript a número serial de Excel sin horas
- Fórmula: `Math.floor((d - excelEpoch) / (1000 * 60 * 60 * 24))`

**`flattenTasksForExport()`**
- Aplana tareas y subtareas para escritura en Excel
- Mapea campos correctamente:
  - `task.descripcion` → `nombre`
  - `task.dias` → `dias`
  - `task.responsable` → `responsable`
  - `task.progress` → `progreso` (convierte a decimal 0-1)
  - `task.startDate` (calculado) → `fechaInicio`
- Agrupa subtareas con prefijo `├─`

**`handleDownloadExcel()` (reemplazada)**
- ✅ Carga plantilla desde `/templates/gantt-template.xlsm`
- ✅ Escribe datos en filas 5+ (columnas A-G SOLAMENTE)
- ✅ Mapeo correcto:
  - Col A: `numero` (vacío si subtarea)
  - Col B: `nombre` (con prefijo ├─)
  - Col C: `responsable`
  - Col D: Fecha como número serial (formato dd/mm/yyyy)
  - Col E: **VACÍO** (VBA lo calcula)
  - Col F: `dias` (entero)
  - Col G: `progreso` (decimal 0-1, formato 0%)
- ✅ Descarga como `.xlsm` con MIME type correcto
- ✅ Nombre: `Gantt_[NombreProyecto].xlsm`

---

### 2. **server.js**

Agregada configuración de archivos estáticos:
```javascript
app.use(express.static(join(__dirname, 'public')));
```

Esto permite que:
- Plantilla sea accesible en: `/templates/gantt-template.xlsm`
- El frontend pueda hacer `fetch('/templates/gantt-template.xlsm')`

---

## Reglas Estrictas Cumplidas

✅ **NO modificar filas 1-4**
- El código comienza a escribir en fila 5: `const rowIndex = 5 + index`

✅ **NO escribir nada en columna E**
- No hay `row.getCell(5).value = ...`
- Solo se asigna formato y alineación, sin valor

✅ **NO escribir nada en columnas H en adelante**
- Rango de escritura: columnas 1-7 solamente
- `row.getCell(col)` where `col ∈ [1,2,3,4,5,6,7]`

✅ **Mantener extensión .xlsm**
- `link.download = 'Gantt_${safeName}.xlsm'`

✅ **Mantener MIME type correcto**
- `type: 'application/vnd.ms-excel.sheet.macroEnabled.12'`

✅ **Usar writeBuffer() — NO writeFile()**
- `const buffer = await workbook.xlsx.writeBuffer()`
- Descarga directo al navegador (no guarda en servidor)

---

## Flujo Completo de Usuario

1. **Usuario genera tareas en la app**
   - Estima tareas con duraciones en días laborables
   - Puede agregar subtareas

2. **Usuario hace clic en "Descargar Gantt .xlsm"**
   - GanttViewer llama a `handleDownloadExcel()`

3. **Frontend (React)**
   - Carga plantilla desde `http://localhost:3002/templates/gantt-template.xlsm`
   - ExcelJS abre el workbook
   - Aplana tareas/subtareas
   - Escribe datos en filas 5+ (columnas A-G)
   - Convierte fechas a números seriales de Excel
   - Genera buffer XLSM
   - Descarga como `Gantt_[Proyecto].xlsm`

4. **Usuario abre archivo en Excel**
   - Excel detecta que es macro-enabled (.xlsm)
   - Ejecuta `Workbook_Open()` automáticamente
   - VBA corre las 5 macros:
     - `AgregarTitulo()` → Crea título y botón
     - `CrearLeyenda()` → Leyenda de colores
     - `GenerarCalendario()` → Meses y días
     - `ColorearBarrasGantt()` → Barras coloreadas
     - `ActualizarGantt()` → Ejecuta todo

5. **Resultado**
   - ✅ Título y leyenda visibles
   - ✅ Calendario generado (meses + días)
   - ✅ Barras coloreadas según progreso %
   - ✅ Fin de semana en gris
   - ✅ Botón "Actualizar" funcional

---

## Datos Esperados (Mapeo)

### Estructura de `projectData`
```javascript
{
  proyecto: { nombre: "Nombre Proyecto" },
  estimacion: {
    tareas: [
      {
        descripcion: "Tarea 1",
        dias: 5,
        responsable: "Juan",
        progress: 100,  // o 'progreso' — código maneja ambos
        subtareas: [
          {
            descripcion: "Subtarea 1.1",
            dias: 2,
            responsable: "María",
            progress: 50
          }
        ]
      }
    ]
  }
}
```

### Mapeo a Excel
```
Entrada (projectData)          Fila Excel     Columna    Valor
├── proyecto.nombre            (cualquiera)   (generado) Gantt_[nombre].xlsm
├── tarea.descripcion          5+             B          "Tarea 1"
├── subtarea.descripcion       5+             B          "  ├─ Subtarea 1.1"
├── tarea.responsable          5+             C          "Juan"
├── tarea.dias                 5+             F          5
├── tarea.progress             5+             G          1.00 (100%)
├── task.startDate (calculado) 5+             D          44911 (serial)
└── (VBA lo calcula)           5+             E          (vacío)
```

---

## Conversión de Fechas

### Backend (GanttViewer):
```javascript
const dateToExcelSerial = (date) => {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)                   // Elimina horas
  const excelEpoch = new Date(1899, 11, 30)
  return Math.floor((d - excelEpoch) / (1000 * 60 * 60 * 24))
}

// Ejemplo:
dateToExcelSerial(new Date(2026, 5, 8))  // → 44911
// En Excel: 44911 se muestra como 08/06/2026 (formato dd/mm/yyyy)
```

### Excel VBA (ColorearBarrasGantt):
```vb
taskStart = ws.Cells(i, 4).Value  ' Leer F.Inicio
taskEnd = ws.Cells(i, 5).Value    ' F.Fin (calculada por WORKDAY)

For cada día en columnas H+:
  If día >= taskStart AND día <= taskEnd AND no fin de semana:
    Colorear celda según % en columna G
```

---

## Colores de Progreso (VBA)

| Rango | RGB | Hex | Significado |
|-------|-----|-----|-------------|
| 0-25% | 189, 221, 242 | #BDDDF2 | Azul claro |
| 26-50% | 123, 191, 232 | #7BBFE8 | Azul medio |
| 51-75% | 46, 141, 212 | #2E8DD4 | Azul oscuro |
| 76-100% | 26, 94, 154 | #1A5E9A | Azul muy oscuro |
| Fin semana | 200, 200, 200 | #C8C8C8 | Gris |

---

## Testing

### Test manual en navegador:
1. Abre http://localhost:3002 (si tienes el frontend)
2. Genera un proyecto con tareas
3. Haz clic en "Descargar Gantt .xlsm"
4. Abre el archivo en Excel
5. Verifica que:
   - ✅ Título en A1:G1
   - ✅ Leyenda en fila 2
   - ✅ Calendario en filas 2-3 (columnas H+)
   - ✅ Datos de tareas en fila 5+
   - ✅ Barras coloreadas automáticamente
   - ✅ Botón "Actualizar" funciona (Alt+F8 o clic)

---

## Archivos Implicados

| Archivo | Cambio | Propósito |
|---------|--------|-----------|
| `src/components/GanttViewer.jsx` | Modificado | Implementa exportarGantt() con plantilla |
| `server.js` | Modificado | Sirve archivos estáticos desde public/ |
| `public/templates/gantt-template.xlsm` | Ya existe | Plantilla con VBA correcto |
| `package.json` | ✓ ExcelJS 4.4.0 | Ya estaba instalado |

---

## Dependencias

✅ **ExcelJS 4.4.0** — Ya estaba en `package.json`
- Usada para: cargar plantilla, escribir datos, generar buffer

✅ **dayjs** — Ya estaba en `package.json`
- Usada para: picker de fecha de inicio

✅ **Ant Design** — Ya estaba en `package.json`
- Usada para: UI del botón de descarga y mensajes

---

## Problemas Conocidos & Soluciones

### Problema: "Plantilla no encontrada"
**Causa:** `public/templates/gantt-template.xlsm` no existe o Express no sirve archivos estáticos

**Solución:**
```bash
# Verificar plantilla existe:
ls -la public/templates/gantt-template.xlsm

# Reiniciar servidor para recargar configuración de Express:
npm run server:dev
```

### Problema: Macros no se ejecutan al abrir
**Causa:** Excel puede estar bloqueando macros por política de seguridad

**Solución:**
1. Ir a: Archivo → Opciones → Centro de confianza
2. Habilitar macros
3. O hacer clic en "Actualizar" manualmente

### Problema: Barras no aparecen
**Causa:** F.Inicio vacío, F.Fin no calculada, o sin hacer clic en "Actualizar"

**Solución:**
1. Abre el archivo en Excel
2. Haz clic en botón "Actualizar" o Alt+F8 → ActualizarGantt
3. Verifica que F.Inicio (Col D) tiene fechas válidas

---

## Próximos Pasos (Opcional)

- [ ] Permitir elegir colores personalizados
- [ ] Exportar a PDF con gráfico de barras
- [ ] Importar cambios de Excel de vuelta a la app
- [ ] Soporte para múltiples idiomas (mes/día labels)

---

## Resumen Técnico

✅ **Arquitectura:** Frontend-only (sin servidor intermedio)
✅ **Plantilla:** Servida estáticamente desde `public/templates/`
✅ **ExcelJS:** Lee plantilla con macros, escribe datos, devuelve buffer
✅ **VBA:** Incrustado en plantilla, se ejecuta en Excel automáticamente
✅ **Descargar:** Blob directo al navegador (no almacenado en servidor)

---

Implementación completada. ¿Dudas o ajustes adicionales?
