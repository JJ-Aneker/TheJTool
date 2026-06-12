# CSV Examples - TheJTool

Esta carpeta contiene plantillas CSV de ejemplo para facilitar la creación de **Categorías** y **eForms** en Therefore™.

---

## 📋 Archivos Disponibles

### 1. `category_fields_example.csv`
Plantilla para crear categorías en **Category Builder**.

**Columnas:**
- `FieldName`: Nombre interno del campo (sin espacios, CamelCase)
- `FieldType`: Tipo de campo (`String`, `Integer`, `Date`, `DateTime`, `Money`, `SingleKeyword`, `MultipleKeyword`)
- `Length`: Longitud máxima (0 para tipos numéricos/fecha)
- `Required`: `true` o `false` - indica si el campo es obligatorio
- `Indexed`: `true` o `false` - indica si el campo está indexado para búsquedas
- `DefaultValue`: Valor por defecto (opcional)
- `TabName`: Nombre de la pestaña donde aparecerá el campo
- `Validation`: Opciones para campos tipo Keyword (separadas por `|`)
- `Description`: Descripción del campo

**Tipos de campo válidos:**
| Tipo | Descripción | Ejemplo |
|------|-------------|---------|
| `String` | Texto libre | "Nombre", "Dirección" |
| `Integer` | Número entero | 123, 456 |
| `Date` | Fecha (sin hora) | 2026-06-12 |
| `DateTime` | Fecha y hora | 2026-06-12 14:30:00 |
| `Money` | Importe monetario | 1234.56 |
| `SingleKeyword` | Lista desplegable (una opción) | "Pendiente", "Activo" |
| `MultipleKeyword` | Lista de opciones múltiples | "Tag1, Tag2, Tag3" |

---

### 2. `eform_fields_example.csv`
Plantilla para crear formularios electrónicos en **eForm Builder**.

**Columnas:**
- `fieldName`: Nombre interno del campo (camelCase)
- `label`: Etiqueta visible para el usuario
- `type`: Tipo de control (`textfield`, `textarea`, `number`, `datetime`, `select`, `checkbox`, `file`)
- `required`: `true` o `false`
- `placeholder`: Texto de ejemplo en el campo
- `defaultValue`: Valor inicial
- `options`: Opciones para campos tipo `select` (separadas por `|`)
- `validation`: Reglas de validación (opcional)
- `helpText`: Texto de ayuda para el usuario

**Tipos de control válidos:**
| Tipo | Descripción | Uso |
|------|-------------|-----|
| `textfield` | Campo de texto corto | Nombres, códigos |
| `textarea` | Campo de texto largo (multilínea) | Descripciones, comentarios |
| `number` | Campo numérico | Presupuestos, cantidades |
| `datetime` | Selector de fecha y hora | Fechas de inicio/fin |
| `select` | Lista desplegable | Selección de una opción |
| `checkbox` | Casilla de verificación | Aprobaciones, confirmaciones |
| `file` | Carga de archivos | Adjuntar documentos |

---

## 🚀 Cómo Usar Estas Plantillas

### Opción 1: Modificar el CSV directamente
1. Abre el archivo CSV con Excel, LibreOffice o un editor de texto
2. Modifica/añade/elimina filas según tus necesidades
3. **IMPORTANTE**: No cambies los nombres de las columnas (primera fila)
4. Guarda el archivo como `.csv` (UTF-8)

### Opción 2: Usar como referencia
1. Estudia la estructura del CSV
2. Crea tu propio CSV desde cero siguiendo el mismo formato
3. Asegúrate de que las columnas coincidan exactamente

---

## ⚙️ Importar en TheJTool

### Para Category Builder:
1. Ve a **Category Builder** en TheJTool
2. Click en **"Importar desde CSV"** (si disponible) o **"Cargar plantilla"**
3. Selecciona tu archivo `category_fields_*.csv`
4. Revisa la vista previa
5. Confirma la creación de la categoría

### Para eForm Builder:
1. Ve a **eForm Builder** en TheJTool
2. Click en **"Nuevo eForm"** → **"Desde CSV"**
3. Selecciona tu archivo `eform_fields_*.csv`
4. Revisa los campos generados
5. Personaliza el diseño si es necesario
6. Guarda el eForm

---

## 📝 Consejos y Buenas Prácticas

### Nombres de campos:
- ✅ Usa CamelCase: `ProjectName`, `InvoiceDate`
- ✅ Sin espacios ni caracteres especiales: `ñ`, `á`, `-`
- ❌ Evita: `Nombre Proyecto`, `Fecha-Inicio`

### Campos obligatorios:
- **DocNo** siempre debe ser obligatorio en categorías
- Marca como `required=true` solo campos críticos
- Demasiados campos obligatorios frustran a los usuarios

### Pestañas/Tabs:
- Agrupa campos relacionados en la misma pestaña
- Nombres sugeridos: `General`, `Financial`, `Assignment`, `Metadata`
- Máximo 6-8 pestañas para mantener usabilidad

### Keywords (listas desplegables):
- Usa `SingleKeyword` para una única selección
- Usa `MultipleKeyword` para selección múltiple
- Separa opciones con `|`: `Opción1|Opción2|Opción3`

### Valores por defecto:
- Usa valores por defecto para campos comunes: `Status=Pendiente`, `Currency=EUR`
- Facilita la entrada de datos y reduce errores

---

## 🐛 Resolución de Problemas

### Error: "Invalid CSV format"
- Verifica que la primera fila contenga exactamente los nombres de columna del ejemplo
- Asegúrate de que el archivo esté codificado en UTF-8
- Comprueba que no haya comas extra dentro de los valores (usa comillas si es necesario)

### Error: "Invalid field type"
- Revisa que los tipos de campo sean exactamente como en la tabla
- Son case-sensitive: `String` (correcto), `string` (incorrecto)

### Los caracteres especiales no se muestran correctamente:
- Guarda el CSV con codificación **UTF-8 with BOM**
- En Excel: Archivo → Guardar como → Herramientas → Opciones web → Codificación → UTF-8

---

## 📚 Recursos Adicionales

- **Category Builder Guide**: `docs/therefore/solution-designer-guide.md`
- **eForm Guide**: `docs/therefore/JJ_-_eform-import-export-guide.md`
- **Therefore Glossary**: `docs/therefore/therefore-glossary.md`

---

**¿Necesitas ayuda?** Consulta la documentación completa en la carpeta `docs/therefore/` del proyecto.
