# Therefore eForms — Lecciones Aprendidas: Generación de XML

> Complemento a `JJ_-_eform-import-export-guide.md`.
> Documenta los errores cometidos al generar eForms programáticamente
> y el método correcto definitivo.

---

## El método correcto: reemplazo quirúrgico sobre plantilla nativa

La única forma fiable de generar un XML importable es **partir del XML
exportado por el propio Solution Designer** y hacer reemplazos mínimos.

### Por qué falla construir el XML desde cero

El parser SAX de Therefore (`SAXMLReader`) es extremadamente estricto.
Construir el XML a mano falla por razones que no están documentadas
en ningún sitio oficial y que solo se descubren por trial & error:

| Intento | Error cometido | Resultado |
|---------|---------------|-----------|
| v1 | XML construido a mano con FDef indentado y comillas `"` literales | `SAXMLReader: Parse failed` |
| v2 | FDef minificado, comillas sin escapar pero `ensure_ascii=True` | `SAXMLReader: Parse failed` |
| v3 | FDef con comillas escapadas como `&quot;` | `SAXMLReader: Parse failed` |
| v4 | FDef RAW sin escapar (correcto), pero XML construido a mano | `SAXMLReader: Parse failed` |
| **v5** | **Reemplazo quirúrgico sobre XML nativo exportado** | **✅ Funciona** |

---

## Reglas definitivas

### 1. Siempre usar una plantilla nativa
Exportar un eForm existente desde Solution Designer y usarlo como base.
El archivo `TheConfiguration_eformMatriculas_PLANTILLA.xml` es la plantilla
de referencia para esta instancia.

### 2. El FDef va RAW — sin escapar comillas ni estructura
```
✅ CORRECTO:  <FDef>{"display":"form","components":[...]}</FDef>
❌ INCORRECTO: <FDef>{&quot;display&quot;:&quot;form&quot;...}</FDef>
❌ INCORRECTO: <FDef><![CDATA[{"display":"form"...}]]></FDef>
```

### 3. El JSON del FDef usa \r\n (no \n)
Therefore exporta con `\r\n`. Replicarlo:
```python
fdef = json.dumps(form, ensure_ascii=False, indent=2).replace('\n', '\r\n')
```

### 4. Solo escapar HTML dentro de strings de htmlelement
Si un componente `htmlelement` tiene HTML en su propiedad `content`,
ese HTML sí debe escaparse dentro del string JSON:
```
< → &lt;    > → &gt;    & → &amp;    " → \"    \ → \\    newline → \n
```
Los demás valores del JSON van completamente sin escapar.

### 5. No tocar FCreUs ni FCreUsNam
Estos valores son específicos de la instancia. Mantener los del eForm
original. En esta instancia: `FCreUs=4`, `FCreUsNam=JJ`.

### 6. No añadir elementos que la plantilla no tenga
Si la plantilla exportada no tiene `<Folders>`, `FFold`, `IxProfNo` u otros
elementos, **no añadirlos**. Therefore los gestiona internamente.

---

## Script de generación

El archivo `generar_eform.py` implementa este método con:
- Función `generate_eform()` que hace los reemplazos quirúrgicos
- Helpers `make_textfield()`, `make_select()`, `make_datetime()`,
  `make_number()`, `make_column()` para construir componentes
- Función `encode_html_for_content()` para el caso especial de htmlelement

### Uso básico
```python
from generar_eform import generate_eform, make_textfield, make_select, make_column

components = [
    {
        "label": "Datos principales",
        "type": "panel",
        "key": "panelPrincipal",
        "input": False, "tableView": False, "collapsible": False,
        "reorder": False, "properties": {}, "customConditional": "",
        "logic": [], "attributes": {},
        "conditional": {"show": "", "when": "", "json": ""},
        "components": [
            make_textfield("Nombre", "nombre", required=True),
            make_select("Estado", "estado", required=True, values=[
                {"label": "Activo", "value": "activo"},
                {"label": "Inactivo", "value": "inactivo"}
            ])
        ]
    },
    {"type": "button", "label": "Enviar", "key": "submit",
     "theme": "primary", "input": True, "tableView": True}
]

generate_eform(
    plantilla_path="TheConfiguration_eformMatriculas_PLANTILLA.xml",
    output_path="mi_nuevo_eform.xml",
    form_name="Mi Nuevo Formulario",
    form_id="MiNuevoFormulario",
    components=components
)
```

---

## Archivos del proyecto relacionados

| Archivo | Descripción |
|---------|-------------|
| `TheConfiguration_eformMatriculas_PLANTILLA.xml` | Plantilla XML nativa exportada de Therefore — base para todos los nuevos eForms |
| `generar_eform.py` | Script Python reutilizable con helpers y función de generación |
| `JJ_-_eform-import-export-guide.md` | Guía completa de importación/exportación de eForms |
| `JJ-therefore-eforms-data-loading-guide.md` | Guía de carga y actualización de datos desde eForms |
