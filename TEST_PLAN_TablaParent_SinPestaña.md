# Plan de Prueba: TablaParent y Sin Pestaña

## ✅ Lo que fue implementado

### 1. **Columna TablaParent para Campos Table**
- Archivo CSV con nueva columna: `TablaParent`
- Asigna columnas automáticamente a sus campos Table
- Ejemplo: `Opciones;Table;;No;` + `Texto_Opcion;String;300;Sí;Opciones` → Texto_Opcion se convierte en columna de Opciones

### 2. **Bug Fix: Campos Sin Pestaña**
- **Problema**: Cuando una categoría mezcla pestañas con campos sin pestaña, los sin pestaña no aparecían en el XML
- **Solución**: Genera campos sin pestaña separadamente (tabMeta='', sin ShowInTabNo)
- **Resultado**: Todos los campos se incluyen en el XML importable a Therefore

---

## 📋 CSV de Prueba Disponible

**Archivo**: `PRL_Examenes_Preguntas_CSV_TablaParent.csv`

Este CSV contiene:
- **PRL_Examenes**: Categoría con campos sin pestaña (`ID_Examen`, `Titulo`) + campos con pestaña (`General`) + Table (`Preguntas_Examen`)
- **PRL_Preguntas**: Categoría con Table `Opciones` usando TablaParent
- **PRL_Resultados**: Categoría con Table `Detalle_Respuestas` usando TablaParent

---

## 🧪 Pasos para Probar

### Prueba 1: TablaParent Funciona
1. Abre Category Builder en http://localhost:5173
2. Haz clic en "📤 Importar CSV"
3. Copia y pega el contenido de `PRL_Examenes_Preguntas_CSV_TablaParent.csv`
4. Haz clic en "Analizar →"
5. **Verifica**: 
   - ✅ 3 categorías detectadas
   - ✅ PRL_Preguntas.Opciones tiene 3 columnas (Texto_Opcion, Valor_Opcion, Es_Correcta)
   - ✅ PRL_Resultados.Detalle_Respuestas tiene 3 columnas (ID_Pregunta_Ref, Valor_Respondido, Es_Correcta)

### Prueba 2: Sin Pestaña Se Incluye en XML
1. En el Category Builder, selecciona **PRL_Examenes**
2. **Verifica estructura**:
   - Campos "Sin pestaña": ID_Examen, Titulo (visible en sección)
   - Tab "General": Descripcion, Tiempo_Max_Min, Aprobado_Min_Pct, Activo
   - Tab "Preguntas": Preguntas_Examen (Table), ID_Pregunta_Ref, Orden
3. Haz clic en "⚡ Generar XML"
4. **En el XML generado, busca**:
   - ✅ Campos ID_Examen y Titulo (SIN ShowInTabNo)
   - ✅ Los campos de "General" CON ShowInTabNo=1
   - ✅ Los campos de "Preguntas" CON ShowInTabNo=2
   - ✅ Table Preguntas_Examen CON columnas: ID_Pregunta_Ref, Orden

### Prueba 3: Importar XML a Therefore
1. Copiar el XML generado
2. En Therefore: Soluciones → Importar Configuración → Importar el XML
3. **Verifica que**:
   - ✅ Todas las 3 categorías se crean
   - ✅ Los campos sin pestaña aparecen en la pantalla (fuera de pestañas)
   - ✅ Los campos con pestaña aparecen en sus respectivas pestañas
   - ✅ Las columnas de tabla se crean correctamente

---

## 🔍 Detalles Técnicos

### CSV Estructura Completa

```
Categoría;Pestaña;Sección;Nombre;Tipo;Longitud;Obligatorio;TablaParent
```

**Columnas**:
- `TablaParent`: (NUEVO) Indicar si este campo es una columna de una tabla
  - Vacío: Campo normal o Table
  - Nombre de table: Esta fila es una columna de esa tabla

**Ejemplos**:
```csv
# Campo sin pestaña (TablaParent vacío)
PRL_Examenes;;Identificación;ID_Examen;NumericCounter;;Sí;

# Campo con pestaña General
PRL_Examenes;General;Identificación;Descripcion;String;1000;No;

# Table field (TablaParent vacío)
PRL_Examenes;Preguntas;Preguntas del examen;Preguntas_Examen;Table;;No;

# Columna de Preguntas_Examen (TablaParent='Preguntas_Examen')
PRL_Examenes;Preguntas;Preguntas del examen;ID_Pregunta_Ref;Int;;Sí;Preguntas_Examen
```

### Generación XML

**Sin Pestaña** → `tabMeta=''` (sin ShowInTabNo)
```xml
<!-- Sin ShowInTabNo, visible fuera de pestañas -->
<Field>...</Field>
```

**Con Pestaña** → `tabMeta=...ShowInTabNo=1` (por ejemplo)
```xml
<!-- Incluye ShowInTabNo, visible en Tab específica -->
<BelongsToTable>-200</BelongsToTable>
<ParentFieldType>3</ParentFieldType>
<ShowInTabNo>1</ShowInTabNo>
```

**Table Columnas** → Generadas automáticamente desde TablaParent
```xml
<Field>
  <TypeNo>10</TypeNo>  <!-- Table field -->
  <FieldID>Opciones</FieldID>
</Field>
<!-- Seguido de columnas con BelongsToTable=... -->
```

---

## ✨ Resultado Esperado

Después de ambas correcciones:
- ✅ CSV con TablaParent agrupa columnas automáticamente
- ✅ Campos Sin Pestaña se incluyen en XML
- ✅ XML importa correctamente a Therefore
- ✅ 100% backward compatible (CSV sin TablaParent sigue funcionando)

**¡Listo para importar a Therefore!** 🚀
