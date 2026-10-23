# Patrones probados para eForms de Therefore™

> Cada sección corresponde a un "bloque" seleccionable en la UI. El backend inyecta en el
> system prompt **solo** las secciones de los bloques elegidos.
> El código se muestra en varias líneas para leerlo; en el eForm debe ir en **una sola línea**,
> respetando `knowledge/eform-rules.md` (sin `<` `>`, sin `&&`, sin comillas dobles dentro del JS).

---

## [qr] Lector QR / códigos de barras

**Origen:** eForm probado en Therefore Online (tenant CES), 9 iteraciones hasta funcionar.

**Componentes:**
1. `textfield` destino (p. ej. key `codigoQr`, label "Código leído").
2. `htmlelement` (key `qrPanel`) con:
   - Botón "📷 Escanear" cuyo `onclick` contiene **toda** la lógica (patrón *init-on-first-click*:
     la primera pulsación define las funciones en `window` y las siguientes las reutilizan).
   - Contenedor modal oculto (`div` con `id='qrModal'`) con `<video id='qrVideo' playsinline>`,
     marco de escaneo y botón "Cerrar".

**Lógica (resumen):**
```js
// onclick del botón (colapsar a una línea, solo comillas simples)
if (!window.qrOpen) {
  window.qrSetValue = function (key, val) {
    var done = false;
    try { var f = window.Formio ? Object.values(window.Formio.forms)[0] : null;
          if (f) { var c = f.getComponent(key); if (c) { c.setValue(val); done = true; } } } catch (e) {}
    if (!done) { var el = document.querySelector('input[name*=' + key + ']');
                 if (el) { el.value = val; el.dispatchEvent(new Event('input', {bubbles:true}));
                           el.dispatchEvent(new Event('change', {bubbles:true})); } }
  };
  window.qrClose = function () { /* parar tracks del stream, ocultar modal */ };
  window.qrOpen = function (key) {
    // getUserMedia({video:{facingMode:'environment'}}) con fallback {video:true} (iOS Safari)
    // BarcodeDetector nativo (Chrome/Edge/Android) si existe;
    // si no, cargar jsQR desde https://cdn.jsdelivr.net/npm/jsqr/dist/jsQR.js y leer frames en canvas
    // al detectar: window.qrSetValue(key, valor); window.qrClose();
  };
}
window.qrOpen('codigoQr');
```

**Notas:**
- Comparaciones sin `<`/`>`: `codes.length !== 0`, bucles con `i !== n`.
- Variante EAN/código de barras: resolución mayor (`width:{ideal:1920}`), formatos
  `['ean_13','ean_8','code_128','qr_code']`, linterna (`torch`) si el track lo soporta.
- La cámara requiere HTTPS (Therefore Online lo es).

---

## [autofill] Autorrelleno con el usuario conectado

**Origen:** eForm "Solicitud Servicio Mensajería" (Naturgy, On-Premise).

- Datos del usuario del Web Client sin llamada API:
  `var u = JSON.parse(localStorage.getItem('userInfo') || '{}');` → `u.SMTP` (email),
  `u.DisplayName`, `u.UserName`, `u.UserId`.
- **On-Premise:** en el `customDefaultValue` del campo email: `value = (u.SMTP || '').toLowerCase();`
  y, con `setTimeout(..., 800)`, rellenar el resto de campos y ponerlos readonly
  (`el.setAttribute('readonly','true')` + estilo gris). No usar `disabled`.
- **Online:** si `customDefaultValue` no se ejecuta, ofrecer un botón "Cargar mis datos"
  en un `htmlelement` con la misma lógica en `onclick`.
- Fecha de hoy en un `datetime`: `defaultValue` vía `customDefaultValue: "value = moment().format('YYYY-MM-DD');"`
  (o botón en Online).

---

## [lookup] Buscar en una categoría maestra

**Origen:** buscador de usuarios (BuildingCenter, Online) y maestro de usuarios cat. 78 (Naturgy).

```js
// Búsqueda por ColName con ExecuteMultiQuery (preferido frente a ExecuteSingleQuery por CORS)
fetch(BASE + '/ExecuteMultiQuery', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json'
             /* + auth según entorno; + TenantName en Online */ },
  body: JSON.stringify({
    Queries: [{ CategoryNo: 78, Mode: 0, MaxRows: 1,
                Conditions: [{ FieldNoOrName: 'Usuario_Email', Operator: 0, Condition: email }] }],
    MaxRows: 1, RowBlockSize: 500
  })
}).then(function (r) { return r.json(); }).then(function (d) {
  if (d.QueryID) { setTimeout(function () { /* POST ReleaseMultiQuery {QueryID: d.QueryID} sin esperar */ }, 100); }
  var qr = d.QueryResults ? d.QueryResults[0] : null;
  if (!qr) return;
  if (qr.ResultRows.length === 0) return;
  var colMap = {};
  qr.Columns.forEach(function (c, i) { colMap[c.IndexDataFieldName] = i; });
  var row = qr.ResultRows[0];
  var nombre = row.IndexValues[colMap['Usuario_Nombre']];
  window._therefore = window._therefore || {};
  window._therefore.docNo = row.DocNo;   // necesario para el patrón [modal]
});
```
- **No** usar `SelectedFieldsNoOrNames` en `ExecuteMultiQuery` (HTTP 500 en Online).
- Operadores: `0` igual, `1` like (comodín `*texto*`). `Condition` = valor buscado.
- Mapear valores con `qr.Columns[i].IndexDataFieldName` (nunca con `GetCategoryInfo`).
- `ExecuteSingleQuery` (si se usa en On-Premise): `CategoryNo` como **string**,
  `TimeZone: "0"`, `Condition` = valor, y aquí sí admite `SelectedFieldsNoOrNames`.
- Lista de resultados: renderizar una tabla en un `htmlelement` (contenedor con `id`) y
  rellenarla por JS; cada fila con `onclick` que copie valores a los campos del formulario.
- Placeholders de configuración claros en el código: `REEMPLAZAR_CATEGORYNO`, `REEMPLAZAR_COLNAME`.

---

## [modal] Modal de actualización de datos

**Origen:** Naturgy — el usuario corrige sus datos de contacto en el maestro desde el eForm.

- `htmlelement` con botón "✏️ Actualizar mis datos", overlay y modal (`display:none`,
  `position:fixed`, `z-index` alto) con inputs propios (`id='th-nombre'`…), mensaje y botones
  Cancelar / Guardar.
- Funciones en `window`: `thOpenModal` (precarga desde `window._therefore`), `thCloseModal`,
  `thSaveModal`.
- `thSaveModal`: `GetDocumentIndexData` → tomar `IndexData.LastChangeTime` →
  `SaveDocumentIndexData` con `{ DocNo, VersionNo: 0, IndexData: { LastChangeTime, IndexDataItems: [...] } }`
  y items tipados (`StringIndexData`, `IntIndexData`…). Después actualizar los campos del
  formulario principal y `window._therefore`, y cerrar el modal.
- Requiere el `DocNo` obtenido en el patrón [lookup].

---

## [signature] Firma (canvas)

**Motivo:** el componente `signature` nativo de form.io no es fiable en Therefore.

- `hidden` (key p. ej. `firmaBase64`) que recibe la imagen PNG en base64.
- `htmlelement` con `<canvas id='sigCanvas' width='500' height='180' style='border:1px solid #ccc;touch-action:none'>`
  y botones "Activar firma", "Borrar" y "Confirmar firma".
- "Activar firma" (`onclick`, init-on-first-click) registra eventos `pointerdown/pointermove/pointerup`
  en el canvas y dibuja trazos con `ctx.lineTo/stroke`.
- "Confirmar firma": `canvas.toDataURL('image/png')` → escribir en el campo hidden con el mismo
  mecanismo que `qrSetValue` (API form.io o input + eventos).
- "Borrar": `ctx.clearRect(0, 0, canvas.width, canvas.height)` y vaciar el hidden.
