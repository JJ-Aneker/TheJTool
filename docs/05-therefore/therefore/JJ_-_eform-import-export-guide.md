# Therefore eForms — Guía de Importación/Exportación XML

> Conocimiento acumulado por trial & error en instancias Therefore Online.
> Tenant de referencia: `buildingcenter.thereforeonline.com`

---

## ⚠️ Regla fundamental — Leer antes de cualquier otra cosa

**Nunca construir el XML desde cero. Siempre partir de una exportación nativa.**

El parser SAX de Therefore (`SAXMLReader`) es extremadamente estricto con la estructura
del XML. Intentar construir el fichero manualmente falla de forma consistente aunque
el contenido sea correcto, porque hay metadatos específicos de cada instancia
(`FCreUs`, `FCreUsNam`, y otros) que solo aparecen en una exportación real.

El único método fiable es:
1. Exportar un eForm existente desde Solution Designer
2. Hacer **reemplazos quirúrgicos** sobre ese XML: solo `FName`, `FDef`, `DCrea`, `Id`, `FormID`
3. No tocar nada más

El archivo `TheConfiguration_eformMatriculas_PLANTILLA.xml` es la plantilla de referencia
para esta instancia. El script `generar_eform.py` implementa este método con helpers
reutilizables. **Usar siempre ambos.**

---

## 1. Estructura XML del fichero exportado

La exportación nativa tiene `<Configuration>` como raíz y todos los tags vacíos
con apertura y cierre explícitos (nunca self-closing):

```xml
<Configuration>
  <Version>570425345</Version>
  <NewImportExport>1</NewImportExport>
  <Categories></Categories>
  <QueryTemplates></QueryTemplates>
  <CaseDefinitions></CaseDefinitions>
  <Folders></Folders>
  <Datatypes></Datatypes>
  <KeywordDictionaries></KeywordDictionaries>
  <Counters></Counters>
  <Templates></Templates>
  <WFProcesses></WFProcesses>
  <UCProfiles></UCProfiles>
  <TreeViews></TreeViews>
  <CloudStorages></CloudStorages>
  <Preprocessors></Preprocessors>
  <Forms></Forms>
  <FormImgs></FormImgs>
  <ReportDefinitions></ReportDefinitions>
  <ReportTemplates></ReportTemplates>
  <PowerBIDataSets></PowerBIDataSets>
  <PowerBITables></PowerBITables>
  <EForms>...</EForms>
  <ESignatureProviders></ESignatureProviders>
  <Roles></Roles>
  <RoleAssignments></RoleAssignments>
  <CommonScripts></CommonScripts>
  <OfficeProfiles></OfficeProfiles>
  <IxProfiles></IxProfiles>
  <Queries></Queries>
  <Users></Users>
  <CaptProfiles></CaptProfiles>
  <References></References>
  <CntConnSrcs></CntConnSrcs>
  <Dashboards></Dashboards>
  <Stamps></Stamps>
  <RetentionPolicies></RetentionPolicies>
  <SmartCaptureProcessors></SmartCaptureProcessors>
  <SmartCaptureQueues></SmartCaptureQueues>
  <DocDownloadProviders></DocDownloadProviders>
  <Credentials></Credentials>
</Configuration>
```

**Notas importantes:**
- No incluir declaración `<?xml version="1.0"?>` — la exportación nativa no la lleva.
- Tags vacíos siempre con apertura y cierre explícitos: `<Tag></Tag>`, nunca `<Tag />`.
- No añadir `<Folders>` con carpeta dummy ni `<FFold>` en el EForm — la exportación nativa
  de esta instancia no los incluye. Añadirlos causa `SAXMLReader: Parse failed`.

---

## 2. Estructura del EForm

```xml
<EForms>
  <EForm>
    <FNo>-1</FNo>
    <FVer>1</FVer>
    <FName>Nombre del Formulario</FName>
    <FDef>{ JSON form.io aquí — ver sección 3 }</FDef>
    <DCrea>20260408120000000</DCrea>
    <FCreUs>4</FCreUs>
    <FCreUsNam>JJ</FCreUsNam>
    <Id>GUID-UNICO-DEL-EFORM</Id>
    <FormID>IdentificadorSinEspacios</FormID>
  </EForm>
</EForms>
```

| Tag | Descripción | Notas |
|-----|-------------|-------|
| `<FNo>` | Número del form | Negativo = placeholder, Therefore asigna el real |
| `<FVer>` | Versión | Siempre `1` para nuevos |
| `<FName>` | Nombre visible en Therefore | |
| `<FDef>` | JSON form.io | Ver sección 3 |
| `<DCrea>` | Timestamp de creación | Formato `YYYYMMDDHHmmssSSS` |
| `<FCreUs>` | UserNo del creador | Específico de la instancia — no cambiar |
| `<FCreUsNam>` | Username del creador | Específico de la instancia — no cambiar |
| `<Id>` | GUID único del eForm | Generar nuevo para cada eForm |
| `<FormID>` | ID interno | Sin espacios ni caracteres especiales |

**Campos que NO deben incluirse** salvo que la plantilla los tenga:
- `<DefSubmNo>` — solo en instancias On-Premise, ver `JJ-therefore-eforms-data-loading-guide.md`
- `<IxProfNo>` — solo si hay perfil de indexación asociado
- `<FFold>` — no está en la exportación nativa de esta instancia

---

## 3. El FDef — JSON de form.io

### 3.1 El JSON va RAW en el XML

Therefore espera el JSON **directamente** dentro de `<FDef>`, sin CDATA y sin escapar
las comillas ni la estructura del JSON:

```xml
<FDef>{
  "display": "form",
  "components": [...]
}</FDef>
```

⛔ **INCORRECTO** — comillas escapadas como entidades XML:
```xml
<FDef>{&quot;display&quot;:&quot;form&quot;...}</FDef>
```

⛔ **INCORRECTO** — con CDATA:
```xml
<FDef><![CDATA[{"components":[...]}]]></FDef>
```

### 3.2 Formato: indentado con \r\n

Therefore exporta el JSON con `indent=2` y saltos de línea `\r\n`. Replicarlo exactamente:

```python
fdef = json.dumps(form, ensure_ascii=False, indent=2).replace('\n', '\r\n')
```

### 3.3 Encoding de HTML dentro de strings de htmlelement

Esta regla aplica **únicamente** al valor del atributo `content` de componentes `htmlelement`.
El resto del JSON va sin ningún tipo de escaping.

Cuando `content` contiene HTML, ese HTML debe estar codificado así dentro del string JSON:

| Carácter | Encoding correcto |
|----------|-------------------|
| `<` | `&lt;` |
| `>` | `&gt;` |
| `&` | `&amp;` |
| `"` | `\"` (escape JSON estándar) |
| `\n` | `\n` (escape JSON estándar) |
| `\` | `\\` (escape JSON estándar) |

**Por qué:** Therefore decodifica las entidades XML (`&lt;` → `<`) antes de pasar el JSON
a form.io. Si se usan escapes unicode `\u003c`, form.io los muestra como texto literal.

```python
def encode_html_for_content(html):
    html = html.replace('\\', '\\\\')
    html = html.replace('"', '\\"')
    html = html.replace('\n', '\\n')
    html = html.replace('&', '&amp;')
    html = html.replace('<', '&lt;')
    html = html.replace('>', '&gt;')
    return html
```

Ejemplo correcto de `content` de un `htmlelement`:
```
"content": "&lt;div id='miApp'&gt;&lt;button onclick='doThing()'&gt;Click&lt;/button&gt;&lt;/div&gt;"
```

⛔ **INCORRECTO** (unicode escapes — se muestran como texto):
```
"content": "\u003cdiv id='miApp'\u003e..."
```

⛔ **INCORRECTO** (HTML sin escapar — rompe el XML):
```
"content": "<div id='miApp'>..."
```

---

## 4. Script de generación — generar_eform.py

El archivo `generar_eform.py` implementa el método de plantilla nativa con helpers
para construir componentes form.io sin tocar el XML directamente.

```python
from generar_eform import generate_eform, make_textfield, make_select, make_datetime, make_column

components = [
    {
        "label": "Panel principal",
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

Helpers disponibles: `make_textfield`, `make_select`, `make_datetime`, `make_number`,
`make_column`, `encode_html_for_content`.

---

## 5. Autenticación en eForms con htmlelement

Para eForms de **consulta** (no archivado) accesibles por usuarios autenticados en Therefore Online:

- **No incluir pantalla de login** — el navegador ya tiene la cookie de sesión activa.
- Usar `credentials: 'include'` en todas las llamadas `fetch`.
- Llamar a `GetConnectedUser` al inicio para obtener el usuario activo.
- Llamar a `GetCategoryInfo` para mapear `ColName → FieldNo` dinámicamente.

```javascript
function api(endpoint, body) {
  return fetch(BASE + '/' + endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body)
  }).then(function(r) {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  });
}
```

---

## 6. Errores comunes y sus causas

| Error | Causa más probable |
|-------|-------------------|
| `SAXMLReader: Parse failed` | XML construido a mano / tags self-closing / comillas escapadas como `&quot;` en el FDef |
| `DoImportExport failed` + XML en el mensaje | Ídem anterior |
| `Failed to load information from database: Folder - ID=XX` | Se añadió `<FFold>` apuntando a una carpeta inexistente |
| eForm importa pero muestra `\u003c` como texto | Se usaron unicode escapes en lugar de `&lt;` en `content` de htmlelement |
| eForm importa pero content aparece como texto plano | Doble codificación (`&amp;lt;`) — ver sección 3.3 |
| eForm no encuentra campos (`FieldNo undefined`) | `ColName` incorrecto — usar `GetCategoryInfo` para mapearlos |
| SQL 547 al importar (On-Premise) | Falta `DefSubmNo` — partir siempre de la plantilla exportada |

---

## 7. Checklist antes de importar

- [ ] Se parte de la plantilla nativa `TheConfiguration_eformMatriculas_PLANTILLA.xml`
- [ ] Solo se han modificado: `FName`, `FDef`, `DCrea`, `Id`, `FormID`
- [ ] `FCreUs` y `FCreUsNam` son los del eForm original (no se han tocado)
- [ ] El FDef va RAW en `<FDef>`, sin CDATA, sin `&quot;`
- [ ] El JSON usa `\r\n` (no solo `\n`)
- [ ] Si hay `htmlelement`, su `content` usa `&lt;` / `&gt;` / `&amp;`
- [ ] No hay `\u003c` ni `\u003e` en ningún string del JSON
- [ ] `FormID` no contiene espacios ni caracteres especiales
- [ ] El GUID del `<Id>` es nuevo y único

---

## 8. Valores de instancia (buildingcenter.thereforeonline.com)

| Campo | Valor |
|-------|-------|
| `FCreUs` | `4` |
| `FCreUsNam` | `JJ` |
| Base URL API | `https://buildingcenter.thereforeonline.com/theservice/v0001/restun` |
| Plantilla de referencia | `TheConfiguration_eformMatriculas_PLANTILLA.xml` |
