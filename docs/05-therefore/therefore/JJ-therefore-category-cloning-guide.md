# Therefore — Guía: Clonado de Categorías

> Conocimiento obtenido analizando exportaciones XML nativas del Solution Designer.
> Referencia: categoría `01 - Admninistración Inmuebles` exportada de `buildingcenter.thereforeonline.com`.

---

## Regla fundamental

**Nunca construir el XML de una categoría desde cero. Siempre exportar una categoría existente y clonarla.**

El parser SAX de Therefore es igual de estricto con categorías que con eForms. La única forma fiable es partir de un XML exportado por el propio Solution Designer y hacer reemplazos quirúrgicos.

El archivo `TheConfiguration_categoria_PLANTILLA.xml` es la plantilla de referencia para esta instancia. El script `clonar_categoria.py` implementa el proceso completo.

---

## Estructura de una categoría exportada

Una exportación de categoría tiene esta estructura raíz (igual que los eForms):

```xml
<Configuration>
  <Version>570425345</Version>
  <NewImportExport>1</NewImportExport>
  <Categories>
    <Category>
      <CtgryNo>-11</CtgryNo>
      <Name UPT="1"><TStr><T><L>1034</L><S>Nombre Visible</S></T></TStr></n>
      <Version>0</Version>
      <Fields>
        <Field>...</Field>   <!-- 116 campos en la plantilla de referencia -->
      </Fields>
      <Title>Nombre Visible</Title>
      <FolderNo>-7</FolderNo>
      <WorkflowProcessNo>-4</WorkflowProcessNo>
      ...
      <Id>GUID-DE-LA-CATEGORIA</Id>
      <DlgBgColor>...</DlgBgColor>
      <DocTitles>...</DocTitles>
      <CtgryID>Identificador_Sin_Espacios</CtgryID>
    </Category>
  </Categories>
  <Counters>
    <Counter>...</Counter>   <!-- 14 counters en la plantilla de referencia -->
  </Counters>
  <Templates>
    <Template>...</Template>  <!-- 2 templates (logos/cabeceras) -->
  </Templates>
  ... (resto de secciones vacías)
</Configuration>
```

---

## Qué hay que cambiar para clonar

Exactamente **7 tipos de elementos** — todo lo demás se mantiene intacto:

| Elemento | Descripción | Notas |
|----------|-------------|-------|
| `<Name UPT="1"><TStr><T><L>1034</L><S>...</S>` | Nombre visible en Solution Designer | Puede llevar tildes y espacios |
| `<Title>...</Title>` | Título en Web Client | Si no se especifica, igual que Name |
| `<CtgryID>...</CtgryID>` | ID interno de la categoría | Sin espacios ni tildes ni caracteres especiales |
| `<Id>` de la `<Category>` | GUID único de la categoría | Regenerar con `uuid.uuid4()` |
| `<Id>` de cada `<Field>` | GUID de cada campo (116 en la plantilla) | Regenerar todos |
| `<Id>` de cada `<Counter>` | GUID de cada contador (14 en la plantilla) | Regenerar + resetear `<Next>` a 1 |
| `<Id>` de cada `<Template>` | GUID de plantillas de imagen (2 en la plantilla) | Regenerar |

### Lo que NO se cambia

- `<CtgryNo>` — negativo = placeholder, Therefore asigna el real al importar
- `<FieldNo>` — Therefore los reasigna al importar
- `<BelongsTo>`, `<ForeignCol>`, `<Links>` — relaciones internas entre campos
- `<WorkflowProcessNo>`, `<FolderNo>` — Therefore los reapunta al importar
- `<CounterNo>` — Therefore lo reasigna
- El contenido de los campos (layout, validaciones, dependencias) — es lo que se replica

---

## Cómo localizar el GUID de la categoría

El GUID de la `<Category>` es el único `<Id>` que queda en el bloque de la categoría después de eliminar los bloques `<Field>`, `<Counter>` y `<Template>`. En la plantilla es:

```
7C55A81E-9C57-4754-906C-6362673CA6EE
```

El script lo localiza automáticamente mediante regex con eliminación de subbloques.

---

## Script de clonado — clonar_categoria.py

### Clonar una categoría

```python
from clonar_categoria import clonar_categoria

clonar_categoria(
    origen='TheConfiguration_categoria_PLANTILLA.xml',
    destino='TheConfiguration_cat_legal.xml',
    nuevo_nombre='02 - Legal y Fiscal',
    nuevo_ctgry_id='Legal_Fiscal'
)
```

### Clonar en lote (varias categorías de una vez)

```python
from clonar_categoria import clonar_en_lote

clonar_en_lote(
    origen='TheConfiguration_categoria_PLANTILLA.xml',
    clones=[
        {'destino': 'cat_02_legal.xml',
         'nuevo_nombre': '02 - Legal y Fiscal',
         'nuevo_ctgry_id': 'Legal_Fiscal'},
        {'destino': 'cat_03_personas.xml',
         'nuevo_nombre': '03 - Personas',
         'nuevo_ctgry_id': 'Personas'},
        {'destino': 'cat_04_servicios.xml',
         'nuevo_nombre': '04 - Servicios Generales',
         'nuevo_ctgry_id': 'Servicios_Generales'},
    ]
)
```

### Salida del script

```
✅ Categoría clonada: cat_02_legal.xml
   Nombre    : 02 - Legal y Fiscal
   CtgryID   : Legal_Fiscal
   GUID cat  : F406FB86-A81E-4345-B0D2-DA94A6457A1B
   Campos    : 116
   Counters  : 14
   Templates : 2
```

---

## Proceso de importación en Therefore

1. Generar el XML con `clonar_categoria.py`
2. Abrir **Solution Designer**
3. Menú **File → Import Configuration**
4. Seleccionar el XML generado
5. Therefore asignará `CtgryNo`, `FieldNo` y `CounterNo` reales automáticamente
6. Verificar en **Categories** que la nueva categoría aparece con los campos correctos

---

## Diferencias respecto al clonado de eForms

| Aspecto | eForms (`generar_eform.py`) | Categorías (`clonar_categoria.py`) |
|---------|----------------------------|-------------------------------------|
| GUIDs a regenerar | 1 (el eForm) | 116+ (categoría + campos + counters + templates) |
| Counters | No aplica | Regenerar GUIDs + resetear `<Next>` a 1 |
| ID interno | `<FormID>` | `<CtgryID>` |
| Nombre | `<FName>` | `<Name>` + `<Title>` (dos sitios) |
| JSON payload | `<FDef>` (form.io) | No aplica |

---

## Errores comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `SAXMLReader: Parse failed` | XML construido a mano o con caracteres inválidos | Usar siempre `clonar_categoria.py` sobre plantilla nativa |
| Categoría importa pero sin campos | `<FieldNo>` duplicados con categoría existente | No cambiar los `<FieldNo>` — Therefore los reasigna |
| Contador no empieza desde 1 | `<Next>` no reseteado | El script lo hace automáticamente |
| `CtgryID` duplicado | Se usó el mismo `CtgryID` que la plantilla | Especificar `nuevo_ctgry_id` único |
| Conflicto de GUID | Se importó dos veces sin regenerar GUIDs | El script regenera todos los GUIDs en cada ejecución |

---

## Archivos del proyecto relacionados

| Archivo | Descripción |
|---------|-------------|
| `TheConfiguration_categoria_PLANTILLA.xml` | Plantilla XML nativa exportada — base para todos los clones |
| `clonar_categoria.py` | Script Python con funciones `clonar_categoria()` y `clonar_en_lote()` |
| `JJ_-_eform-import-export-guide.md` | Guía equivalente para eForms (mismo patrón de plantilla nativa) |
| `solution-designer-guide.md` | Referencia de tipos de campo, propiedades y acceso |
