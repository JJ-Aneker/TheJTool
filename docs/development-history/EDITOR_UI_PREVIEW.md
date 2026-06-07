# 🎨 Vista Previa: Cómo se verá en el Category Builder

## 📱 Panel Izquierdo: Selector de Categorías

```
┌─────────────────────────┐
│ + Nueva    💾 Guardar  │
├─────────────────────────┤
│ ✓ PRL_Examenes          │
│   PRL_Preguntas         │
│   PRL_Resultados        │
└─────────────────────────┘
```

---

## 🖼️ Cuando selecciones PRL_Examenes

### HEADER (Arriba)
```
┌────────────────────────────────────────────────┐
│ PRL_Examenes              [Therefore Azul ▼]  X│
│ 2020px ancho × 478px alto                      │
└────────────────────────────────────────────────┘
```

### CAMPOS SIN PESTAÑA
```
┌────────────────────────────────────────────────┐
│ CAMPOS SIN PESTAÑA                             │
├────────────────────────────────────────────────┤
│ Nombre        │ Tipo                 │ Long│ ✓ │
├────────────────────────────────────────────────┤
│ ID_Examen     │ 🔢 Número (Integer)  │  - │ ✓ │
│ Titulo        │ 📝 Texto (String)    │200 │ ✓ │
└────────────────────────────────────────────────┘
```

### PESTAÑA: General
```
┌─────────────┬─────────────┐
│ General (2) │ Preguntas(3)│◄─ Tabs en la UI
├─────────────────────────────┤
│ Nombre              │ Tipo              │ Long│ ✓│
├─────────────────────────────┤
│ Descripcion         │ 📝 String         │1000│  │
│ Tiempo_Max_Min      │ 🔢 Integer        │  - │ ✓│
│ Aprobado_Min_Pct    │ 🔢 Integer        │  - │ ✓│
│ Activo              │ ✅ Logical        │  - │  │
└─────────────────────────────┘
```

### PESTAÑA: Preguntas
```
┌─────────────┬─────────────┐
│ General     │ Preguntas(1)│◄─ Tab seleccionada
├─────────────────────────────┤
│ Nombre              │ Tipo          │ Long│ ✓│
├─────────────────────────────┤
│ Preguntas_Examen [▼ EXPANDIR]                 │
│ Tabla con 2 columnas        ◄─ TABLE FIELD   │
│ │ • ID_Pregunta_Ref (Int)                    │
│ │ • Orden (Int)                              │
│ └─ + Columna                                 │
│                                             │
│ ID_Pregunta_Ref     │ 🔢 Integer        │ -│ ✓│
│ Orden               │ 🔢 Integer        │ -│  │
└─────────────────────────────┘
```

---

## 🖼️ Cuando selecciones PRL_Preguntas

### PESTAÑA: General
```
┌─────────────┬──────────────┐
│ General (4) │ Opciones (1) │
├──────────────────────────────┤
│ ID_Pregunta        │ 🔢 Número  │  -│ ✓│
│ Enunciado          │ 📝 String  │500│ ✓│
│ Bloque             │ 📌 Keyword │  -│  │
│ Activo             │ ✅ Logical │  -│  │
└──────────────────────────────┘
```

### PESTAÑA: Opciones (CON TABLE)
```
┌─────────────┬──────────────┐
│ General     │ Opciones (1) │◄─ Tab seleccionada
├──────────────────────────────┤
│ Nombre              │ Tipo              │ Long│
├──────────────────────────────┤
│ Opciones [▼ EXPANDIR]                      │
│ 📋 Tabla con 3 columnas                    │
│ │ • Texto_Opcion (String, 300)             │
│ │ • Valor_Opcion (String, 50)              │
│ │ • Es_Correcta (Logical)                  │
│ └─ + Columna                               │
│                                            │
│ Texto_Opcion        │ 📝 String    │300│ ✓│
│ Valor_Opcion        │ 📝 String    │50 │ ✓│
│ Es_Correcta         │ ✅ Logical   │  -│  │
└──────────────────────────────┘
```

---

## 🖼️ Cuando selecciones PRL_Resultados

### PESTAÑA: General (8 campos)
```
┌─────────────┬──────────────┬─────────────┐
│ General (8) │ Resultado (5)│ Detalle (1) │
├───────────────────────────────────────────┤
│ ID_Resultado        │ 🔢 Número  │  │ ✓│
│ ID_Examen_Ref       │ 🔢 Integer │  │ ✓│
│ Titulo_Examen       │ 📝 String  │200│  │
│ Nombre_Alumno       │ 📝 String  │150│ ✓│
│ DNI                 │ 📝 String  │15 │ ✓│
│ Empresa             │ 📝 String  │200│  │
│ Puesto              │ 📝 String  │100│  │
└───────────────────────────────────────────┘
```

### PESTAÑA: Resultado (5 campos)
```
┌─────────────┬──────────────┬─────────────┐
│ General     │ Resultado(5) │ Detalle (1) │
├───────────────────────────────────────────┤
│ Fecha_Realizacion   │ 📅 Date    │  │ ✓│
│ Nota                │ 💰 Decimal │  │ ✓│
│ Apto                │ 📌 Keyword │  │ ✓│
│ Tiempo_Empleado_Seg │ 🔢 Integer │  │  │
│ Observaciones_...   │ 📝 String  │500│  │
└───────────────────────────────────────────┘
```

### PESTAÑA: Detalle (CON TABLE)
```
┌─────────────┬──────────────┬─────────────┐
│ General     │ Resultado    │ Detalle (1) │◄─ Activa
├───────────────────────────────────────────┤
│ Detalle_Respuestas [▼ EXPANDIR]            │
│ 📋 Tabla con 3 columnas                    │
│ │ • ID_Pregunta_Ref (Int)                  │
│ │ • Valor_Respondido (String, 50)          │
│ │ • Es_Correcta (Logical)                  │
│ └─ + Columna                               │
│                                            │
│ ID_Pregunta_Ref     │ 🔢 Integer │  │ ✓│
│ Valor_Respondido    │ 📝 String  │50│  │
│ Es_Correcta         │ ✅ Logical │  │  │
└───────────────────────────────────────────┘
```

---

## 🎯 Flujo Visual: De CSV a Editor

### PASO 1: Importar CSV
```
📤 Importar CSV
  └─ Pega contenido
     └─ Haz clic "Analizar →"
        └─ Verifica: 3 categorías, 11 campos en tablas
```

### PASO 2: Selecciona Categoría
```
El editor carga con:
├─ Nombre de categoría (editable)
├─ Selector de paleta de colores
├─ Botón eliminar (si hay más de 1)
├─ CAMPOS SIN PESTAÑA (si existen)
├─ PESTAÑA 1: con sus campos/tables
├─ PESTAÑA 2: con sus campos/tables
└─ PESTAÑA 3: con sus campos/tables
```

### PASO 3: Expandir Table Fields
```
Preguntas_Examen [▼]  ◄─ Click para expandir
├─ Columnas de tabla
│  ├─ ID_Pregunta_Ref (Int)
│  ├─ Orden (Int)
│  └─ + Columna ◄─ Agregar más columnas manualmente
└─ Campos normales del mismo nivel (fuera de la tabla)
```

---

## 🔍 Detalles Importantes en la Vista

### Table Fields (TypeNo 10)
```
Opciones [▼ EXPANDIR] ◄─ Indica que es expandible
📋 Tabla con 3 columnas ◄─ Resumen de lo que contiene
│ • Campo1
│ • Campo2
│ • Campo3
└─ + Columna ◄─ Botón para agregar columnas manualmente
```

### Campos Sin Pestaña
```
Sección especial "CAMPOS SIN PESTAÑA"
├─ Visible como cualquier otro campo
├─ NO tienen pestaña asignada
├─ Aparecen fuera de los tabs en Therefore
└─ En el XML generado: sin atributo ShowInTabNo
```

### Pestañas
```
[General (4)] [Preguntas (3)] [Opciones (1)]
      ▲             ▲               ▲
      │             │               │
      └─────────────┴───────────────┘
    El número indica cuántos campos tiene cada pestaña
```

---

## ✅ Verificación Visual Completa

- [ ] **PRL_Examenes**: 
  - Sin pestaña: 2 campos (ID_Examen, Titulo)
  - General: 4 campos
  - Preguntas: 1 Table + 2 campos

- [ ] **PRL_Preguntas**:
  - General: 4 campos
  - Opciones: 1 Table con 3 columnas + 3 campos normales

- [ ] **PRL_Resultados**:
  - General: 8 campos
  - Resultado: 5 campos
  - Detalle: 1 Table con 3 columnas + 3 campos normales

**Cuando todo esté visible así = ✅ TablaParent funcionando correctamente**
