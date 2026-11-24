# Reglas para generar eForms de Therefore™ (form.io)

> Conocimiento consolidado tras muchos intentos reales en Therefore Online y On-Premise.
> Este fichero forma parte del system prompt de la IA. Mantenerlo conciso y correcto.

## 1. Qué produce la IA

- Solo un JSON: `{ "components": [ ... ] }` con componentes form.io válidos.
- **Nunca** XML, nunca `display`/`settings` (los añade el generador), nunca texto fuera del JSON.
- El HTML de `htmlelement.content` se escribe **en claro** (`<div>...</div>`). El generador
  se encarga del escape XML. No usar `&lt;`, ni `<`, ni CDATA.

## 2. Estructura y estilo del formulario

- Organizar en `panel` por secciones lógicas. Dentro, usar `columns` (anchos Bootstrap que
  sumen 12; normalmente 2 o 3 columnas) para campos cortos.
- Último componente de primer nivel: botón submit
  `{ "type": "button", "label": "Enviar", "key": "submit", "theme": "primary", "input": true, "tableView": true }`.
- Cada componente incluye las propiedades base que usa Therefore en sus exportaciones:
  `properties: {}`, `customConditional: ""`, `logic: []`, `attributes: {}`, `reorder: false`,
  `conditional: { show: "", when: "", json: "" }` y, en inputs,
  `validate: { required, customMessage: "", json: "" }` (+ `maxLength` en textos).
- `key` en camelCase, únicas en todo el formulario, solo `[A-Za-z0-9_]`, sin acentos.
  Si se conoce la categoría destino, **la key debe ser exactamente el ColName** del campo.
- Etiquetas (`label`) en el idioma del usuario. Evitar acentos solo en keys, no en labels.
- Fechas: `datetime` con `enableDate: true`, `enableTime: false`, `format: "dd/MM/yyyy"` salvo
  que se pida hora.
- Textos largos: `textarea`. Emails: `email`. Teléfonos: `phoneNumber`. Importes: `currency`
  (EUR) o `number`.
- Condicionales simples: `conditional: { show: true, when: "<keyCampo>", eq: "<valor>", json: "" }`.

## 3. Componentes a evitar o usar con cuidado

- `signature`: poco fiable en Therefore → usar el patrón "Firma (canvas)".
- `textfield` con `disabled: true`: provoca bucles infinitos en form.io. Para campos de solo
  lectura: `htmlelement` que muestre el valor, o readonly aplicado por JS.
- `<script>` dentro de `htmlelement`: Angular/form.io lo elimina silenciosamente. **Nunca** usarlo.

## 4. JavaScript dentro del eForm

### 4.1 Dónde se ejecuta
- **Therefore Online**: el único punto fiable es el atributo `onclick` de botones dentro de un
  `htmlelement`. `customDefaultValue` y `calculateValue` en campos hidden **no** son fiables.
- **On-Premise**: `customDefaultValue` de un campo (p. ej. hidden) sí ha funcionado para
  lógica de carga inicial y para registrar funciones en `window`. Aun así, preferir `onclick`
  cuando la acción la dispara el usuario.
- Registrar funciones compartidas en `window` (`window.miFuncion = function(){...}`) y
  proteger con guardas de inicialización (`if (window._miInitDone) return; window._miInitDone = true;`)
  porque Angular puede re-renderizar el formulario.
- Estado compartido entre scripts: `window._therefore = window._therefore || {}`.

### 4.2 Restricciones de caracteres (críticas)
Dentro de `onclick`:
- El atributo se delimita con comillas dobles y el JS interno usa **solo comillas simples**:
  `<button onclick="window.qrOpen('resultadoQr')">`. **Prohibidas las comillas dobles dentro
  del JS** (rompen el atributo: `SyntaxError: Invalid or unexpected token`).
  El resto de atributos HTML del bloque pueden ir con comillas simples (`<div id='app'>`).
- **Prohibidos `<` y `>`**: reescribir comparaciones (`i !== n`, `a.length !== 0`,
  `Math.max`, etc.).

Dentro de `customDefaultValue` / `calculateValue`:
- Sin saltos de línea reales (todo en una línea, separado por `;`).
- Sin `<`, `>` ni `&&` (usar `if` anidados o `!==`).
- Asignar `value` de forma síncrona (`value = '...';`) aunque luego haya lógica asíncrona.

### 4.3 Modificar campos del formulario desde JS
- Preferir la API de form.io si está disponible; si no, buscar el input y disparar eventos:
  `el.value = v; el.dispatchEvent(new Event('input', {bubbles:true})); el.dispatchEvent(new Event('change', {bubbles:true}));`
- Buscar inputs por `name` que contenga la key: `document.querySelector('input[name*=miKey]')`
  (sin comillas dobles si va en onclick).
- El DOM puede no estar listo al evaluar `customDefaultValue`: usar `setTimeout(fn, 800)`.

## 5. Llamadas a la API REST de Therefore desde el eForm

- Base: `https://<host>/theservice/v0001/restun/<Operación>`, siempre `POST` + JSON.
- **Therefore Online**: cabecera `TenantName: <tenant>`. Autenticación preferida sin
  credenciales en el código: token de sesión del propio eForm
  (`$eFormService.getLoginInfo().token` → `Authorization: Bearer <jwt>`) o
  `credentials: 'include'` si hay sesión del Web Client.
- **On-Premise**: **nunca** `GetConnectionToken` (HTTP 500). Basic Auth.
- Credenciales de cuenta de servicio en el JS = visibles para cualquier usuario. Evitarlas;
  si son imprescindibles, marcarlas claramente como `REEMPLAZAR_USUARIO` / `REEMPLAZAR_PASSWORD`.
- Usuario conectado (Web Client): `JSON.parse(localStorage.getItem('userInfo') || '{}')`
  → `SMTP` (email, normalizar con `toLowerCase()`), `DisplayName`, `UserName`, `UserId`.
- Búsquedas: preferir `ExecuteMultiQuery` (`ExecuteSingleQuery` está bloqueado por CORS en
  algunos servidores). Body: `{ Queries: [{ CategoryNo, Mode: 0, MaxRows, Conditions: [{ FieldNoOrName: <ColName>, Operator: 0|1, Condition: <valor> }] }], MaxRows, RowBlockSize }`.
  **Sin** `SelectedFieldsNoOrNames` (HTTP 500 en Online). Comodín `*texto*` con `Operator: 1`.
  Mapear valores con `QueryResults[i].Columns[j].IndexDataFieldName` de la propia respuesta.
- `ExecuteSingleQuery` (solo si hace falta): `CategoryNo` como **string**, `TimeZone: "0"`,
  `Condition` = **valor** buscado.
- `ReleaseMultiQuery`: fire-and-forget con `setTimeout`, nunca esperar la respuesta.
- Guardar índices: `GetDocumentIndexData` justo antes de `SaveDocumentIndexData`
  (usar su `LastChangeTime` `/Date(...)/`). Items tipados:
  `{ StringIndexData: { FieldNo, DataValue } }`, `IntIndexData`, `DateIndexData` (YYYY-MM-DD),
  `MoneyIndexData`, `LogicalIndexData`. `SaveDocumentIndexDataQuick` no funciona en On-Premise.
- Campos dependientes: setear primero el **campo ID maestro**; los dependientes se resuelven solos.
- Login inválido en Online: HTTP 500 con `WSError.ErrorCodeString = "InvalidLogin"` (no 401).

## 6. Mapeo a categoría Therefore

- Los datos enviados llegan al perfil de indexación como `data.<key>`
  (`Json.GetValue("data.<key>")`). Por eso las keys deben coincidir con lo que espere el perfil
  o con los ColName de la categoría.
- `email` y `phoneNumber` → en la categoría son campos String.
- Campos tabla de la categoría (TypeNo 8) → `datagrid` en el eForm, con keys de columna
  iguales a los ColName de la tabla.

## 7. Checklist que la IA debe cumplir antes de responder

- [ ] Solo JSON `{ "components": [...] }`, válido.
- [ ] Keys únicas, camelCase o ColName exacto, sin espacios ni acentos.
- [ ] Botón `submit` al final.
- [ ] Sin `<script>`; sin comillas dobles ni `<` `>` en `onclick`.
- [ ] Sin saltos de línea, `<`, `>` ni `&&` en `customDefaultValue`/`calculateValue`.
- [ ] Sin `signature` nativo; sin `textfield` deshabilitado.
- [ ] Llamadas API coherentes con el entorno (Online vs On-Premise).
- [ ] Sin credenciales reales en el código.
