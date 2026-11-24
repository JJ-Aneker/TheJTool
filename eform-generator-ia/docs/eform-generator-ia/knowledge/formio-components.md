# Componentes form.io admitidos en eForms de Therefore™

Therefore usa form.io (formiojs). El `FDef` es un JSON form.io estándar. Lista de `type`
permitidos por el validador del módulo:

| Grupo | type | Uso / propiedades clave |
|-------|------|-------------------------|
| Layout | `panel` | Sección con título (`label`, `collapsible`, `components`) |
| Layout | `columns` | Fila de columnas (`columns`: array de `column`) |
| Layout | `column` | `width` 1-12 (suma 12 por fila), `offset`, `push`, `pull`, `components` |
| Layout | `fieldset` | Grupo con borde (`legend`, `components`) |
| Layout | `tabs` | Pestañas (`components`: cada uno una pestaña con `label`, `key`, `components`) |
| Layout | `table` | Tabla de maquetación (`rows`, `numRows`, `numCols`) |
| Input | `textfield` | Texto corto (`inputFormat: "plain"`, `validate.maxLength`) |
| Input | `textarea` | Texto largo (`rows`) |
| Input | `number` | Número (`delimiter`, `requireDecimal`, `decimalLimit`, `validate.min/max`) |
| Input | `currency` | Importe (`currency: "EUR"`) |
| Input | `select` | Desplegable (`data.values: [{label, value}]`, `defaultValue`) |
| Input | `radio` | Opción única (`values: [{label, value}]`) |
| Input | `selectboxes` | Varias casillas (`values: [{label, value}]`) |
| Input | `checkbox` | Booleano |
| Input | `datetime` | Fecha/hora (`enableDate`, `enableTime`, `format: "dd/MM/yyyy"`) |
| Input | `email` | Email con validación |
| Input | `phoneNumber` | Teléfono (`inputMask` opcional) |
| Input | `file` | Adjunto (`storage`, `filePattern`, `fileMaxSize`) |
| Input | `hidden` | Valor oculto (`persistent`) |
| Datos | `datagrid` | Filas repetibles (para campos tabla de la categoría) |
| Datos | `editgrid` | Grid con edición en modal |
| Datos | `container` | Agrupa campos bajo una key |
| Avanzado | `htmlelement` | HTML propio (`tag: "div"`, `content`) — sin `<script>` |
| Avanzado | `content` | Texto enriquecido estático (`html`) |
| Avanzado | `button` | Submit (`key: "submit"`, `theme: "primary"`) o acción |

`signature` está **permitido pero desaconsejado** (aviso del validador).

## Plantillas base (como las exporta Therefore)

**textfield**
```json
{
  "label": "Nombre", "allowMultipleMasks": false, "showWordCount": false, "showCharCount": false,
  "tableView": true, "alwaysEnabled": false, "type": "textfield", "input": true, "key": "nombre",
  "inputFormat": "plain", "encrypted": false, "properties": {}, "customConditional": "",
  "logic": [], "attributes": {}, "reorder": false,
  "validate": { "required": true, "maxLength": 100, "customMessage": "", "json": "" },
  "conditional": { "show": "", "when": "", "json": "" }
}
```

**select**
```json
{
  "label": "Curso", "tableView": true, "alwaysEnabled": false, "type": "select", "input": true,
  "key": "curso", "reorder": false, "properties": {}, "customConditional": "", "logic": [],
  "attributes": {},
  "validate": { "required": true, "customMessage": "", "json": "" },
  "conditional": { "show": "", "when": "", "json": "" },
  "data": { "values": [ { "label": "1 ESO", "value": "1ESO" } ] }
}
```

**datetime**
```json
{
  "label": "Fecha", "tableView": true, "alwaysEnabled": false, "type": "datetime", "input": true,
  "key": "fecha", "enableDate": true, "enableTime": false, "format": "dd/MM/yyyy",
  "reorder": false, "properties": {}, "customConditional": "", "logic": [], "attributes": {},
  "validate": { "required": true, "customMessage": "", "json": "" },
  "conditional": { "show": "", "when": "", "json": "" }
}
```

**panel + columns**
```json
{
  "label": "Datos personales", "type": "panel", "key": "panelPersonal", "input": false,
  "tableView": false, "collapsible": false, "reorder": false, "properties": {},
  "customConditional": "", "logic": [], "attributes": {},
  "conditional": { "show": "", "when": "", "json": "" },
  "components": [
    {
      "label": "Columnas", "type": "columns", "key": "colsPersonal1", "input": false,
      "tableView": false, "mask": false, "alwaysEnabled": false, "reorder": false,
      "properties": {}, "customConditional": "", "logic": [], "attributes": {},
      "conditional": { "show": "", "when": "", "json": "" },
      "columns": [
        { "width": 6, "offset": 0, "push": 0, "pull": 0, "type": "column", "input": false,
          "hideOnChildrenHidden": false, "key": "colPersonal1a", "tableView": true,
          "label": "Column", "components": [ ] },
        { "width": 6, "offset": 0, "push": 0, "pull": 0, "type": "column", "input": false,
          "hideOnChildrenHidden": false, "key": "colPersonal1b", "tableView": true,
          "label": "Column", "components": [ ] }
      ]
    }
  ]
}
```
Nota: las keys de `column` también deben ser únicas en todo el formulario.

**htmlelement**
```json
{
  "label": "Panel QR", "type": "htmlelement", "key": "qrPanel", "input": false,
  "tableView": false, "tag": "div", "className": "", "attrs": [], "refreshOnChange": false,
  "content": "<div id='qrWrap'><button type='button' onclick=\"window.qrOpen('codigoQr')\">📷 Escanear</button></div>",
  "properties": {}, "customConditional": "", "logic": [], "attributes": {}, "reorder": false,
  "conditional": { "show": "", "when": "", "json": "" }
}
```

**submit**
```json
{ "type": "button", "label": "Enviar", "key": "submit", "theme": "primary", "input": true, "tableView": true }
```

Documentación form.io: https://github.com/formio/formio.js/wiki/Components-JSON-Schema
