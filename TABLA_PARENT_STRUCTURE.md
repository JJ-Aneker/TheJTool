# 📊 Estructura de Tablas - TablaParent

## 🎯 Cómo funciona el TablaParent

Cuando importas el CSV, los campos que tienen un valor en la columna **TablaParent** se agrupan automáticamente como columnas de su tabla padre.

---

## 📋 PRL_Examenes

### Sin Pestaña (campos fuera de pestañas)
```
┌─────────────────────────────────────┐
│ SIN PESTAÑA (Identificación)        │
├─────────────────────────────────────┤
│ • ID_Examen (NumericCounter)        │
│ • Titulo (String, 200)              │
└─────────────────────────────────────┘
```

### Con Pestaña: General
```
┌─────────────────────────────────────┐
│ GENERAL (Identificación)            │
├─────────────────────────────────────┤
│ • Descripcion (String, 1000)        │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ GENERAL (Configuración)             │
├─────────────────────────────────────┤
│ • Tiempo_Max_Min (Int)              │
│ • Aprobado_Min_Pct (Int)            │
│ • Activo (Logical)                  │
└─────────────────────────────────────┘
```

### Con Pestaña: Preguntas (CON TABLE)
```
┌─────────────────────────────────────┐
│ PREGUNTAS (Preguntas del examen)    │
├─────────────────────────────────────┤
│ 📋 TABLE: Preguntas_Examen          │
│    └─ ID_Pregunta_Ref (Int)  ◄──┐  │
│    └─ Orden (Int)             ◄──┤  │
│                                    │  │
│ ⬅─ TablaParent=Preguntas_Examen ──┘  │
└─────────────────────────────────────┘
```

---

## 📋 PRL_Preguntas

### Con Pestaña: General
```
┌──────────────────────────────────┐
│ GENERAL (Identificación)         │
├──────────────────────────────────┤
│ • ID_Pregunta (NumericCounter)   │
│ • Enunciado (String, 500)        │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ GENERAL (Clasificación)          │
├──────────────────────────────────┤
│ • Bloque (Keyword)               │
│ • Activo (Logical)               │
└──────────────────────────────────┘
```

### Con Pestaña: Opciones (CON TABLE)
```
┌──────────────────────────────────┐
│ OPCIONES (Opciones de respuesta) │
├──────────────────────────────────┤
│ 📋 TABLE: Opciones               │
│    └─ Texto_Opcion (String, 300) ◄─┐
│    └─ Valor_Opcion (String, 50)  ◄─┤
│    └─ Es_Correcta (Logical)      ◄─┤
│                                     │
│ ⬅─ TablaParent=Opciones ───────────┘
└──────────────────────────────────┘
```

---

## 📋 PRL_Resultados

### Con Pestaña: General
```
┌──────────────────────────────────┐
│ GENERAL (Identificación)         │
├──────────────────────────────────┤
│ • ID_Resultado (NumericCounter)  │
│ • ID_Examen_Ref (Int)            │
│ • Titulo_Examen (String, 200)    │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ GENERAL (Alumno)                 │
├──────────────────────────────────┤
│ • Nombre_Alumno (String, 150)    │
│ • DNI (String, 15)               │
│ • Empresa (String, 200)          │
│ • Puesto (String, 100)           │
└──────────────────────────────────┘
```

### Con Pestaña: Resultado
```
┌──────────────────────────────────┐
│ RESULTADO (Evaluación)           │
├──────────────────────────────────┤
│ • Fecha_Realizacion (Date)       │
│ • Nota (Decimal)                 │
│ • Apto (Keyword)                 │
│ • Tiempo_Empleado_Seg (Int)      │
│ • Observaciones_Evaluador (Str)  │
└──────────────────────────────────┘
```

### Con Pestaña: Detalle (CON TABLE)
```
┌────────────────────────────────────┐
│ DETALLE (Detalle de respuestas)    │
├────────────────────────────────────┤
│ 📋 TABLE: Detalle_Respuestas       │
│    └─ ID_Pregunta_Ref (Int)    ◄──┐
│    └─ Valor_Respondido (Str)   ◄──┤
│    └─ Es_Correcta (Logical)    ◄──┤
│                                    │
│ ⬅─ TablaParent=Detalle_Respuestas┘
└────────────────────────────────────┘
```

---

## 📊 Resumen de Tablas Creadas

| Tabla | Categoría | Pestaña | Columnas |
|-------|-----------|---------|----------|
| **Preguntas_Examen** | PRL_Examenes | Preguntas | ID_Pregunta_Ref, Orden |
| **Opciones** | PRL_Preguntas | Opciones | Texto_Opcion, Valor_Opcion, Es_Correcta |
| **Detalle_Respuestas** | PRL_Resultados | Detalle | ID_Pregunta_Ref, Valor_Respondido, Es_Correcta |

---

## 🔄 Flujo de Datos (CSV → Estructura Interna)

### CSV Original:
```
PRL_Preguntas;Opciones;Opciones de respuesta;Opciones;Table;;No;
PRL_Preguntas;Opciones;Opciones de respuesta;Texto_Opcion;String;300;Sí;Opciones
PRL_Preguntas;Opciones;Opciones de respuesta;Valor_Opcion;String;50;Sí;Opciones
PRL_Preguntas;Opciones;Opciones de respuesta;Es_Correcta;Logical;;No;Opciones
```

### Resultado en Editor (estructura interna):
```javascript
{
  name: "PRL_Preguntas",
  sections: [
    {
      name: "OPCIONES DE RESPUESTA",
      fields: [
        {
          nombre: "Opciones",
          tipo: "10",  // Table
          pestaña: "Opciones",
          columnas: [  // ← AUTOMÁTICAMENTE ASIGNADAS
            { nombre: "Texto_Opcion", tipo: "1", length: "300" },
            { nombre: "Valor_Opcion", tipo: "1", length: "50" },
            { nombre: "Es_Correcta", tipo: "6" }
          ]
        }
      ]
    }
  ]
}
```

---

## ✨ Visualización en Category Builder

Cuando importes el CSV, en el editor verás:

### PRL_Preguntas → Opciones (Tab) → Opciones de respuesta (Section)
```
┌──────────────────────────────────────┐
│ Opciones (TABLE FIELD)               │
│  ▼ EXPANDIR para ver columnas        │
├──────────────────────────────────────┤
│ ✓ Texto_Opcion       String   300 Sí │
│ ✓ Valor_Opcion       String   50  Sí │
│ ✓ Es_Correcta        Logical     No   │
└──────────────────────────────────────┘
```

Cuando expandes el campo Table, ves sus columnas agrupadas automáticamente.

---

## 🎯 Verificación Visual

### En el Editor debería verse:

**PRL_Examenes:**
- [ ] Sección "Identificación" con campos sin pestaña (ID_Examen, Titulo)
- [ ] Pestaña "General" con campos (Descripcion, etc.)
- [ ] Pestaña "Preguntas" con Table "Preguntas_Examen" (expandible, muestra 2 columnas)

**PRL_Preguntas:**
- [ ] Pestaña "General" con 4 campos normales
- [ ] Pestaña "Opciones" con Table "Opciones" (expandible, muestra 3 columnas)

**PRL_Resultados:**
- [ ] Pestaña "General" con 7 campos normales
- [ ] Pestaña "Resultado" con 5 campos normales
- [ ] Pestaña "Detalle" con Table "Detalle_Respuestas" (expandible, muestra 3 columnas)

---

## 💡 Clave: El símbolo ◄─ muestra la relación TablaParent

```
Campo Table:          Columnas que le pertenecen:
Preguntas_Examen  ◄───  ID_Pregunta_Ref, Orden
Opciones          ◄───  Texto_Opcion, Valor_Opcion, Es_Correcta
Detalle_Respuestas◄───  ID_Pregunta_Ref, Valor_Respondido, Es_Correcta
```

Eso es lo que hace TablaParent: **agrupa automáticamente los campos como columnas de su tabla**.
