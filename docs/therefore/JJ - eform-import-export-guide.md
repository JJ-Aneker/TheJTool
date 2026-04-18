# Therefore eForms — Guía de Importación/Exportación XML

> Conocimiento acumulado por trial & error en instancias Therefore Online.
> Tenant de referencia: `buildingcenter.thereforeonline.com`

---

## 1. Estructura XML raíz obligatoria

El fichero de importación debe usar `<Configuration>` como raíz, **nunca** `<TherforeExport>` u otras variantes.

```xml
<Configuration>
  <Version>570425345</Version>
  <NewImportExport>1</NewImportExport>
  <Categories></Categories>
  <QueryTemplates></QueryTemplates>
  <CaseDefinitions></CaseDefinitions>
  <Folders>...</Folders>
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

---

## 2. Tags vacíos: NUNCA self-closing

⛔ **INCORRECTO** — Therefore rechaza self-closing tags:
```xml
<Categories />
<WFProcesses />
```

✅ **CORRECTO** — siempre apertura y cierre explícitos:
```xml
<Categories></Categories>
<WFProcesses></WFProcesses>
```

**Este era uno de los errores más frecuentes** y causa el error `SAXMLReader: Parse failed`.

---

## 3. Sección Folders — obligatoria aunque no se use

Siempre debe incluirse una carpeta dummy con `FolderNo>-1`. Therefore la usa para mapear internamente la carpeta destino durante la importación.

```xml
<Folders>
  <Folder>
    <FolderNo>-1</FolderNo>
    <Type>47</Type>
    <Name UPT="1"><TStr><T><L>1034</L><S>Nombre Carpeta</S></T></TStr></n>
    <Id>GUID-UNICO-AQUI</Id>
  </Folder>
</Folders>
```

**Notas importantes:**
- El tag `</n>` después de `</TStr>` es un quirk del parser de Therefore — debe incluirse tal cual. Therefore lo genera así en sus propias exportaciones.
- `<L>1034</L>` = locale English US. Usar `1034` aunque el sistema esté en otro idioma.
- El `<Id>` de la carpeta debe ser un GUID único diferente al del eForm.
- `FFold>-1` en el EForm apunta a esta carpeta dummy. Therefore la reasigna a la carpeta real durante la importación.

---

## 4. Estructura del EForm

```xml
<EForms>
  <EForm>
    <FNo>-1</FNo>                          <!-- Negativo = placeholder, Therefore asigna el real -->
    <FVer>1</FVer>                         <!-- Versión, siempre 1 para nuevos -->
    <FName>Nombre del Formulario</FName>   <!-- Nombre visible en Therefore -->
    <FDef>{ JSON form.io aquí }</FDef>     <!-- Ver sección 5 -->
    <DCrea>20260320120000000</DCrea>        <!-- Timestamp: YYYYMMDDHHmmssSSS -->
    <FFold>-1</FFold>                      <!-- Apunta a la carpeta dummy de <Folders> -->
    <FCreUs>10</FCreUs>                    <!-- UserNo del creador en la instancia -->
    <FCreUsNam>JJ</FCreUsNam>              <!-- Username del creador -->
    <Id>GUID-UNICO-DEL-EFORM</Id>         <!-- GUID único, diferente al de la carpeta -->
    <FormID>IdentificadorSinEspacios</FormID> <!-- ID interno, sin espacios ni caracteres especiales -->
  </EForm>
</EForms>
```

**Campos que NO deben incluirse** (causan problemas en algunas instancias):
- `<DefSubmNo>` — omitir, no está en exportaciones nativas recientes
- `<IxProfNo>` — omitir si no hay perfil de indexación asociado

---

## 5. El FDef — JSON de form.io

### 5.1 El JSON va RAW en el XML (sin escapar la estructura)

Therefore espera el JSON **directamente** dentro de `<FDef>`, sin CDATA y sin escapar los caracteres estructurales del JSON:

```xml
<FDef>{
  "display": "form",
  "components": [...]
}</FDef>
```

⛔ **INCORRECTO** — con CDATA:
```xml
<FDef><![CDATA[{"components":[...]}]]></FDef>
```

⛔ **INCORRECTO** — con escaping XML de la estructura JSON:
```xml
<FDef>{&quot;components&quot;:[...]}</FDef>
```

### 5.2 El JSON puede ir indentado o minificado

Therefore acepta ambos formatos. El JSON indentado (con saltos de línea y espacios) es más seguro y coincide con el formato de las exportaciones nativas.

### 5.3 Encoding de HTML dentro de strings JSON del FDef

Este es el punto más crítico y el que más problemas causó.

Cuando un componente `htmlelement` tiene HTML en su propiedad `content`, ese HTML debe codificarse de una forma muy específica dentro del string JSON:

| Carácter | Encoding correcto dentro del JSON string en FDef |
|----------|--------------------------------------------------|
| `<`      | `&lt;`                                           |
| `>`      | `&gt;`                                           |
| `&`      | `&amp;`                                          |
| `"`      | `\"`  (escape JSON estándar)                     |
| `\n`     | `\n`  (escape JSON estándar)                     |
| `\`      | `\\`  (escape JSON estándar)                     |

**¿Por qué?** Therefore decodifica las entidades XML (`&lt;` → `<`) antes de pasar el JSON a form.io. Si se usan escapes unicode `\u003c` en su lugar, form.io los renderiza como texto literal en pantalla en lugar de interpretarlos como HTML.

**Ejemplo correcto** de `content` de un htmlelement dentro del FDef:
```
"content": "&lt;div id='miApp'&gt;&lt;button onclick='doThing()'&gt;Click&lt;/button&gt;&lt;/div&gt;\n&lt;script&gt;\nfunction doThing(){alert('ok');}\n&lt;/script&gt;"
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

## 6. Estrategia para generar el XML en Python

La forma más fiable es usar el XML de una exportación nativa que funcione como plantilla y hacer reemplazos quirúrgicos:

```python
import re, uuid, datetime

with open('eform_que_funciona.xml', 'r', encoding='utf-8') as f:
    template = f.read()

def encode_html_for_fdef(html):
    """Codifica HTML para usarlo dentro de un string JSON en el FDef de Therefore."""
    html = html.replace('\\', '\\\\')   # primero los backslashes
    html = html.replace('"', '\\"')      # comillas dobles
    html = html.replace('\n', '\\n')     # saltos de línea
    html = html.replace('&', '&amp;')   # & primero (antes de < >)
    html = html.replace('<', '&lt;')    # menor que
    html = html.replace('>', '&gt;')    # mayor que
    return html

# Construir el FDef manualmente con el content ya encodado
content_encoded = encode_html_for_fdef("""<style>...</style><div>...</div><script>...</script>""")

fdef_json = '''{
  "display": "form",
  "components": [
    {
      "type": "htmlelement",
      "tag": "div",
      "key": "miApp",
      "input": false,
      "tableView": false,
      "label": "Mi App",
      "content": "''' + content_encoded + '''"
    },
    {
      "type": "button",
      "label": "Submit",
      "key": "submit",
      "input": true,
      "tableView": false,
      "hidden": true
    }
  ]
}'''

# Reemplazos quirúrgicos
now = datetime.datetime.now().strftime('%Y%m%d%H%M%S000')
new_guid = str(uuid.uuid4()).upper()

result = template
result = result.replace('<FName>Nombre Original</FName>', '<FName>Nuevo Nombre</FName>')

# Reemplazar FDef
fdef_start = result.index('<FDef>') + 6
fdef_end = result.index('</FDef>')
result = result[:fdef_start] + fdef_json + result[fdef_end:]

# Reemplazar DCrea
result = re.sub(r'<DCrea>\d+</DCrea>', f'<DCrea>{now}</DCrea>', result)

# Reemplazar Id del EForm (después de </FFold>)
ffold_pos = result.index('</FFold>')
id_start = result.index('<Id>', ffold_pos) + 4
id_end = result.index('</Id>', ffold_pos)
result = result[:id_start] + new_guid + result[id_end:]

# Reemplazar FormID
result = result.replace('<FormID>IdOriginal</FormID>', '<FormID>NuevoId</FormID>')

with open('nuevo_eform.xml', 'w', encoding='utf-8') as f:
    f.write(result)
```

---

## 7. Autenticación en eForms con htmlelement

Para eForms de **consulta** (no archivado) accesibles solo por usuarios autenticados en Therefore Online:

- **No incluir pantalla de login** — el navegador ya tiene la cookie de sesión activa.
- Usar `credentials: 'include'` en todas las llamadas `fetch` para que el navegador envíe la cookie automáticamente.
- Llamar a `GetConnectedUser` al inicio para obtener el usuario activo.
- Llamar a `GetCategoryInfo` para mapear `ColName → FieldNo` dinámicamente (no hardcodear FieldNos).

```javascript
function api(endpoint, body) {
  return fetch(BASE + '/' + endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',   // <-- clave para sesión automática
    body: JSON.stringify(body)
  }).then(function(r) {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  });
}
```

---

## 8. Errores comunes y sus causas

| Error | Causa más probable |
|-------|-------------------|
| `SAXMLReader: Parse failed` | Self-closing tags (`<Tag />`), o HTML sin escapar dentro del FDef |
| `Failed to load information from database: Folder - ID=XX` | `FFold` apunta a una carpeta que no existe; usar `-1` con carpeta dummy |
| `DoImportExport failed` + XML en el mensaje | El XML tiene caracteres que rompen el parser SAX de Therefore |
| eForm importa pero muestra `\u003c` como texto | Se usaron unicode escapes en lugar de `&lt;` dentro del content |
| eForm importa pero content aparece como texto plano | Se escapó el HTML con `&amp;lt;` (doble escape) en lugar de `&lt;` |
| eForm no encuentra campos (`FieldNo undefined`) | Los `ColName` en el script no coinciden con los de la categoría; usar `GetCategoryInfo` para mapearlos dinámicamente |

---

## 9. Valores de instancia (buildingcenter.thereforeonline.com)

| Campo | Valor |
|-------|-------|
| `FCreUs` | `10` |
| `FCreUsNam` | `JJ` |
| `<L>` (locale) | `1034` |
| Carpeta eForms | `28` (se mapea via `FFold>-1` + carpeta dummy) |
| Base URL API | `https://buildingcenter.thereforeonline.com/theservice/v0001/restun` |

---

## 10. Checklist antes de importar

- [ ] Raíz es `<Configuration>`, no `<TherforeExport>`
- [ ] Todos los tags vacíos usan `<Tag></Tag>`, no `<Tag />`
- [ ] `<Folders>` incluye una carpeta dummy con `FolderNo>-1`
- [ ] `FFold>-1` en el EForm
- [ ] `FNo>-1` en el EForm
- [ ] El FDef va RAW en `<FDef>`, sin CDATA
- [ ] El HTML dentro de strings JSON usa `&lt;` / `&gt;` / `&amp;`
- [ ] No hay `\u003c` ni `\u003e` en el content del htmlelement
- [ ] `FCreUs` y `FCreUsNam` corresponden a un usuario real de la instancia
- [ ] `FormID` no contiene espacios ni caracteres especiales
- [ ] El GUID del EForm y el de la carpeta son diferentes entre sí
