# Therefore eForms — Guía: Carga y Actualización de Datos de Usuario

> Patrón completo para obtener datos del usuario logado, rellenar campos del formulario
> consultando categorías (maestros) via REST API, y permitir al usuario actualizar
> sus propios datos directamente desde el eForm.
> Entorno de referencia: `naturgy.casp.biscloud.canon-europe.com`

---

## 1. Obtener Datos del Usuario Logado

El Web Client de Therefore (Canon) guarda los datos del usuario logado en `localStorage.userInfo`.
**No requiere ninguna llamada API.**

```javascript
var userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

// Campos disponibles:
var email    = userInfo.SMTP;          // email del usuario  ← el más útil
var nombre   = userInfo.DisplayName;   // nombre completo
var usuario  = userInfo.UserName;      // nombre de usuario (login)
var userId   = userInfo.UserId;        // ID numérico
var dominio  = userInfo.DomainName;    // dominio AD
var guid     = userInfo.GUID;          // GUID del usuario
```

**Ejemplo de objeto completo:**
```json
{
  "DisplayName": "Juan García",
  "SMTP": "juan.garcia@empresa.com",
  "UserId": 6152,
  "UserName": "jgarcia",
  "UserType": 1,
  "DomainName": "EMPRESA",
  "GUID": "2B9D5F35-71E5-495B-A41D-8DE37F2ECEDF"
}
```

> ⚠️ El email puede venir en cualquier capitalización. Usar siempre `.toLowerCase()` antes de comparar.

---

## 2. Autenticación REST con Cuenta de Servicio

Para llamar a la API de Therefore desde el eForm se necesita una **cuenta de servicio** con usuario/contraseña.
El flujo es: obtener token → usar token en llamadas posteriores.

```javascript
var BASE = 'https://<host>/theservice/v0001/restun';
var SVC_USER = 'UsuarioServicio';
var SVC_PASS = 'PasswordServicio';

fetch(BASE + '/GetConnectionToken', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Basic ' + btoa(SVC_USER + ':' + SVC_PASS)
  },
  body: '{}'
})
.then(function(r) { return r.json(); })
.then(function(d) {
  var token = d.Token;
  // Usar token en llamadas posteriores con header UseToken: 1
  // Authorization: Basic btoa(SVC_USER + ':' + token)
});
```

> ⚠️ `GetConnectedUser` con token de cuenta de servicio devuelve los datos de ESA cuenta,
> NO del usuario logado en el navegador. Para el usuario logado, usar `localStorage.userInfo`.

> ⚠️ **Credenciales hardcodeadas en el eForm:** las credenciales de la cuenta de servicio
> se almacenan en el código del eForm en dos lugares:
> 1. `customDefaultValue` del campo email (carga inicial — `SVC_USER` y `SVC_PASS`)
> 2. `customDefaultValue` del campo hidden `_modalInit` (funciones del modal — solo `SVC_USER`,
>    la contraseña no se repite porque el token ya fue obtenido en el paso 1 y se guarda en
>    `window._therefore.token`)
>
> Para cambiar credenciales en producción hay que actualizar ambos campos en el eForm Designer.

---

## 3. Compartir Estado entre Scripts del eForm — `window._therefore`

Cuando se necesita pasar datos entre el `customDefaultValue` de un campo y las funciones
de un modal/htmlelement, se usa el objeto global `window._therefore` como almacén de sesión.

```javascript
// En el customDefaultValue del campo email (se ejecuta al cargar el formulario):
window._therefore = window._therefore || {};
window._therefore.email     = email;
window._therefore.token     = d.Token;    // token de la cuenta de servicio
window._therefore.docNo     = row.DocNo;  // DocNo del registro en el Maestro
window._therefore.nombre    = vals[0];
window._therefore.direccion = vals[1];
window._therefore.dir2      = vals[2];
window._therefore.cp        = vals[3];
window._therefore.telefono  = vals[4];

// En el customDefaultValue del campo hidden _modalInit (funciones del modal):
var t = window._therefore || {};
// t.docNo, t.token, t.nombre, etc. ya disponibles
```

**Por qué es necesario:** cada `customDefaultValue` se evalúa en un contexto aislado.
El modal necesita el `DocNo` y el `token` para poder hacer el save — sin `window._therefore`
no habría forma de pasarlos.

---

## 4. Buscar en una Categoría (Maestro) por Condición

### Estructura correcta de `ExecuteSingleQuery`

La estructura del contrato es **diferente** a la documentación estándar.
Los campos clave son:
- `Condition`: el **valor** a buscar (no el operador)
- `FieldNoOrName`: nombre del campo (`ColName`) como string
- `TimeZone`: siempre `"0"`
- `SelectedFieldsNoOrNames`: array de `ColName` a devolver
- `CategoryNo`: siempre como **string**, no número

```javascript
fetch(BASE + '/ExecuteSingleQuery', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Basic ' + btoa(SVC_USER + ':' + token),
    'UseToken': '1'
  },
  body: JSON.stringify({
    Query: {
      CategoryNo: '78',           // <-- string, no número
      Conditions: [{
        Condition: 'valor_buscar', // <-- el VALOR, no el operador
        FieldNoOrName: 'ColName',  // <-- ColName del campo como string
        TimeZone: '0'
      }],
      SelectedFieldsNoOrNames: [  // campos a devolver
        'Campo1',
        'Campo2',
        'Campo3'
      ]
    }
  })
})
```

### Leer los resultados

La respuesta devuelve `ResultRows` con `IndexValues` — array posicional
que corresponde al orden de `SelectedFieldsNoOrNames`. El `DocNo` del registro
también viene en cada fila y es clave para operaciones de actualización posteriores:

```javascript
.then(function(data) {
  if (!data.QueryResult || !data.QueryResult.ResultRows.length) {
    console.log('No encontrado');
    return;
  }
  var row  = data.QueryResult.ResultRows[0];
  var vals = row.IndexValues;
  var docNo = row.DocNo;   // ← guardar para SaveDocumentIndexData
  // vals[0] -> Campo1
  // vals[1] -> Campo2
  // vals[2] -> Campo3
});
```

---

## 5. Patrón Completo: Email → Buscar en Maestro → Rellenar eForm + Guardar Estado

Este es el patrón completo para el `customDefaultValue` del campo email del remitente.
Hace todo de una vez: lee email, busca en maestro, rellena campos, y guarda estado
en `window._therefore` para uso posterior por el modal de actualización.

```javascript
var userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
var email = userInfo.SMTP ? userInfo.SMTP.toLowerCase() : '';
if (!email) { value = ''; return; }

value = email;
window._therefore = window._therefore || {};
window._therefore.email = email;

var BASE = 'https://<host>/theservice/v0001/restun';
var SVC_USER = 'UsuarioServicio';
var SVC_PASS = 'PasswordServicio';

fetch(BASE + '/GetConnectionToken', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Basic ' + btoa(SVC_USER + ':' + SVC_PASS)
  },
  body: '{}'
})
.then(function(r) { return r.json(); })
.then(function(d) {
  window._therefore.token = d.Token;
  return fetch(BASE + '/ExecuteSingleQuery', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + btoa(SVC_USER + ':' + d.Token),
      'UseToken': '1'
    },
    body: JSON.stringify({
      Query: {
        CategoryNo: '78',
        Conditions: [{
          Condition: email,
          FieldNoOrName: 'Usuario_Email',
          TimeZone: '0'
        }],
        SelectedFieldsNoOrNames: [
          'Usuario_Nombre',   // -> vals[0]
          'Direccion',        // -> vals[1]
          'Direccion2',       // -> vals[2]
          'CP',               // -> vals[3]
          'Telefono'          // -> vals[4]
        ]
      }
    })
  });
})
.then(function(r) { return r.json(); })
.then(function(data) {
  if (!data.QueryResult || !data.QueryResult.ResultRows.length) return;
  var row  = data.QueryResult.ResultRows[0];
  var vals = row.IndexValues;

  // Guardar DocNo y valores para el modal de actualización
  window._therefore.docNo     = row.DocNo;
  window._therefore.nombre    = vals[0] || '';
  window._therefore.direccion = vals[1] || '';
  window._therefore.dir2      = vals[2] || '';
  window._therefore.cp        = vals[3] || '';
  window._therefore.telefono  = vals[4] || '';

  setTimeout(function() {
    function setField(id, val) {
      var el = document.getElementById(id);
      if (el && val) {
        el.value = val;
        el.dispatchEvent(new Event('input',  { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
    var elEmail = document.getElementById('emailRemitente');
    if (elEmail) {
      elEmail.setAttribute('readonly', 'true');
      elEmail.style.backgroundColor = '#f4f4f4';
      elEmail.style.color = '#555';
      elEmail.style.cursor = 'not-allowed';
    }
    setField('nombreRemitente',    vals[0]);
    setField('direccionRemitente', vals[1]);
    setField('direccion2',         vals[2]);
    setField('cpRemitente',        vals[3]);
    setField('telefonoRemitente',  vals[4]);
  }, 800);
})
.catch(function(e) { console.error('Error carga datos remitente:', e); });
```

---

## 6. Actualizar un Documento en el Maestro — `SaveDocumentIndexData`

### Estructura correcta del contrato

El contrato real de `SaveDocumentIndexData` difiere significativamente de la documentación.
Puntos críticos:

- Los items van envueltos en `IndexData` (wrapper obligatorio)
- `LastChangeTime` usa formato `/Date(timestamp)/` — **NO** ISO 8601
- Cada item usa el nombre del tipo como clave: `StringIndexData`, `IntIndexData`, etc.
- `DataValue` es el nombre del campo del valor dentro de cada tipo

```javascript
fetch(BASE + '/SaveDocumentIndexData', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Basic ' + btoa(SVC_USER + ':' + token),
    'UseToken': '1'
  },
  body: JSON.stringify({
    DocNo: 3924426,
    VersionNo: 0,
    IndexData: {
      LastChangeTime: '/Date(1774524331915)/',  // ← obtenido de GetDocumentIndexData
      IndexDataItems: [
        { StringIndexData: { FieldNo: 3875,  DataValue: 'Juan García'   } },
        { StringIndexData: { FieldNo: 28119, DataValue: 'Calle Mayor 1' } },
        { StringIndexData: { FieldNo: 28128, DataValue: 'Edificio A'    } },
        { IntIndexData:    { FieldNo: 28120, DataValue: 28001           } }, // CP es Int
        { StringIndexData: { FieldNo: 28141, DataValue: '666777888'     } }
      ]
    }
  })
})
```

### Tipos de IndexData disponibles

| Tipo JSON | Para campos de tipo | Propiedad del valor |
|-----------|---------------------|---------------------|
| `StringIndexData` | String, TextCounter | `DataValue` (string) |
| `IntIndexData` | Int, NumericCounter | `DataValue` (number) |
| `DateIndexData` | Date | `DataValue` (string YYYY-MM-DD) |
| `LogicalIndexData` | Logical | `DataValue` (boolean) |
| `MoneyIndexData` | Money | `DataValue` (number) |
| `SingleKeywordData` | Single keyword | `DataValue` (string) |

> ⚠️ **CP es IntIndexData** — aunque visualmente parezca texto, el campo CP
> en la Cat. 78 de Naturgy es de tipo Int. Enviar como número, no como string.
> Usar `parseInt(cp, 10) || 0` para convertir el valor del input.

### Control de concurrencia — LastChangeTime

Therefore usa `LastChangeTime` para control de concurrencia optimista. Si el timestamp
enviado no coincide con el del servidor, devuelve error `"Index data to be saved is outdated"`.

**Patrón correcto: GET justo antes del SAVE:**

```javascript
// Paso 1: obtener LastChangeTime fresco
fetch(BASE + '/GetDocumentIndexData', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Basic ' + btoa(SVC_USER + ':' + token),
    'UseToken': '1'
  },
  body: JSON.stringify({ DocNo: docNo, VersionNo: 0 })
})
.then(function(r) { return r.json(); })
.then(function(d) {
  var lastChange = d.IndexData.LastChangeTime; // '/Date(1774524331915)/'

  // Paso 2: save con ese LastChangeTime
  return fetch(BASE + '/SaveDocumentIndexData', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + btoa(SVC_USER + ':' + token),
      'UseToken': '1'
    },
    body: JSON.stringify({
      DocNo: docNo,
      VersionNo: 0,
      IndexData: {
        LastChangeTime: lastChange,  // ← siempre fresco del GET anterior
        IndexDataItems: [ ... ]
      }
    })
  });
})
```

> ⚠️ Nunca cachear el `LastChangeTime`. Siempre hacer GET inmediatamente antes del SAVE.
> Cada modificación al documento actualiza el timestamp en el servidor.

### Estructura de la respuesta de GetDocumentIndexData

```json
{
  "DocNo": 3924426,
  "IndexData": {
    "CategoryNo": 78,
    "DocNo": 3924426,
    "IndexDataItems": [
      { "StringIndexData": { "FieldNo": 3875, "DataValue": "Juan García", "FieldName": "Usuario_Nombre" }, "AccessMask": null },
      { "IntIndexData":    { "FieldNo": 28120, "DataValue": 28001, "FieldName": "CP" }, "AccessMask": null }
    ],
    "LastChangeTime": "/Date(1774524331915)/",
    "LastChangeTimeISO8601": "2026-03-26T11:25:31.9150000Z",
    "Title": "...",
    "VersionNo": 1
  }
}
```

---

## 7. Patrón Completo: Modal de Actualización de Datos

Este patrón implementa un botón en el eForm que abre un modal para que el usuario
actualice sus propios datos en el Maestro. Requiere dos componentes en el eForm:

### Componente 1 — Campo hidden `_modalInit` (`customDefaultValue`)

Registra las funciones del modal en `window` para que el HTML del `htmlelement` pueda llamarlas.
Debe ir en un campo hidden dentro del contenedor oculto del eForm.

```javascript
window.thOpenModal = function() {
  var t = window._therefore || {};
  document.getElementById('th-nombre').value = t.nombre    || '';
  document.getElementById('th-dir').value    = t.direccion || '';
  document.getElementById('th-dir2').value   = t.dir2      || '';
  document.getElementById('th-cp').value     = t.cp        || '';
  document.getElementById('th-tel').value    = t.telefono  || '';
  document.getElementById('th-msg').style.display    = 'none';
  document.getElementById('th-modal').style.display   = 'block';
  document.getElementById('th-overlay').style.display = 'block';
};

window.thCloseModal = function() {
  document.getElementById('th-modal').style.display   = 'none';
  document.getElementById('th-overlay').style.display = 'none';
};

window.thSaveModal = function() {
  var t = window._therefore || {};
  if (!t.docNo || !t.token) { /* mostrar error */ return; }

  var nombre = document.getElementById('th-nombre').value.trim();
  var dir    = document.getElementById('th-dir').value.trim();
  var dir2   = document.getElementById('th-dir2').value.trim();
  var cp     = document.getElementById('th-cp').value.trim();
  var tel    = document.getElementById('th-tel').value.trim();

  var BASE = 'https://<host>/theservice/v0001/restun';
  var SVC_USER = 'UsuarioServicio';

  // GET → extraer LastChangeTime → SAVE
  fetch(BASE + '/GetDocumentIndexData', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + btoa(SVC_USER + ':' + t.token),
      'UseToken': '1'
    },
    body: JSON.stringify({ DocNo: t.docNo, VersionNo: 0 })
  })
  .then(function(r) { return r.json(); })
  .then(function(d) {
    return fetch(BASE + '/SaveDocumentIndexData', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(SVC_USER + ':' + t.token),
        'UseToken': '1'
      },
      body: JSON.stringify({
        DocNo: t.docNo,
        VersionNo: 0,
        IndexData: {
          LastChangeTime: d.IndexData.LastChangeTime,
          IndexDataItems: [
            { StringIndexData: { FieldNo: 3875,  DataValue: nombre } },
            { StringIndexData: { FieldNo: 28119, DataValue: dir    } },
            { StringIndexData: { FieldNo: 28128, DataValue: dir2   } },
            { IntIndexData:    { FieldNo: 28120, DataValue: parseInt(cp, 10) || 0 } },
            { StringIndexData: { FieldNo: 28141, DataValue: tel    } }
          ]
        }
      })
    });
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    if (data.WSError) { /* mostrar error */ return; }
    // actualizar window._therefore y campos del formulario principal
    t.nombre = nombre; t.direccion = dir; t.dir2 = dir2; t.cp = cp; t.telefono = tel;
    function setField(id, val) {
      var el = document.getElementById(id);
      if (el) {
        el.value = val;
        el.dispatchEvent(new Event('input',  { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
    setField('nombreRemitente', nombre);
    setField('direccionRemitente', dir);
    setField('direccion2', dir2);
    setField('cpRemitente', cp);
    setField('telefonoRemitente', tel);
    setTimeout(window.thCloseModal, 1800);
  });
};

value = '';
```

### Componente 2 — `htmlelement` con el botón y el modal

Insertar después del último campo del bloque de datos del remitente (ej. después del `gap`).
El HTML del modal usa comillas simples para los atributos (ya que el JSON usa dobles):

```html
<div id='th-edit-wrap'>
  <button onclick='window.thOpenModal()' style='padding:6px 16px;background:#004571;color:white;...'>
    ✏️ Actualizar mis datos de contacto
  </button>
  <div id='th-overlay' style='display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9998;'></div>
  <div id='th-modal' style='display:none;position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;z-index:9999;...'>
    <input id='th-nombre' type='text'>
    <input id='th-dir'    type='text'>
    <input id='th-dir2'   type='text'>
    <input id='th-cp'     type='text'>
    <input id='th-tel'    type='text'>
    <div id='th-msg'></div>
    <button onclick='window.thCloseModal()'>Cancelar</button>
    <button onclick='window.thSaveModal()'>Guardar</button>
  </div>
</div>
```

> ⚠️ Los `<script>` dentro de `htmlelement` son eliminados por form.io.
> Toda la lógica JS debe ir en `customDefaultValue` de campos hidden.
> Los `onclick` en el HTML sí funcionan si las funciones están registradas en `window`.

---

## 8. Cómo Encontrar el ColName y FieldNo Correcto de un Campo

Usar `GetCategoryInfo` para ver todos los campos de una categoría:

```javascript
fetch(BASE + '/GetConnectionToken', { ... })
.then(r => r.json())
.then(d => fetch(BASE + '/GetCategoryInfo', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Basic ' + btoa(SVC_USER + ':' + d.Token),
    'UseToken': '1'
  },
  body: JSON.stringify({ CategoryNo: 78 })
}))
.then(r => r.json())
.then(data => {
  data.CategoryFields.forEach(f =>
    console.log('FieldNo:', f.FieldNo, '| ColName:', f.ColName, '| Caption:', f.Caption, '| FieldType:', f.FieldType)
  );
});
```

> ⚠️ La respuesta usa `CategoryFields`, no `Fields`.

**Notas importantes:**
- Los campos con `ColName: ''` (vacío) son campos de layout — no se pueden usar en queries.
- El `Caption` puede diferir del `ColName`. Usar siempre `ColName` en las queries.
- `FieldType: 1` = String, `FieldType: 2` = Int, `FieldType: 3` = Date, `FieldType: 5` = Money, `FieldType: 6` = Logical.
- Si un campo recién creado no aparece, reiniciar el servicio web de Therefore (caché).
- Un campo con `IndexType: 2` (índice único) **no impide** la búsqueda por condición,
  pero la estructura del contrato de `ExecuteSingleQuery` debe ser exactamente la correcta.

---

## 9. Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `500` en `ExecuteSingleQuery` | `ColName` incorrecto o campo sin `ColName` | Verificar con `GetCategoryInfo` |
| `ResultRows: []` | Valor buscado no coincide o email en mayúsculas | Normalizar con `.toLowerCase()` |
| `cannot be deserialized... Condition, FieldNoOrName` | Estructura de condición incorrecta | `Condition` es el valor (string), no el operador |
| `cannot be deserialized... IndexData` | Falta el wrapper `IndexData` en el save | Envolver `IndexDataItems` dentro de `IndexData: { LastChangeTime, IndexDataItems }` |
| `DateTime content does not start with /Date(` | `LastChangeTime` en formato ISO | Usar formato `/Date(timestamp)/` — obtener del GET previo |
| `Index data to be saved is outdated` | `LastChangeTime` desactualizado | Hacer GET justo antes del SAVE para obtener timestamp fresco |
| `Index data value is not specified` | Nombre del campo del valor incorrecto | Usar `DataValue` dentro del objeto de tipo (`StringIndexData`, `IntIndexData`, etc.) |
| Campo no aparece en `GetCategoryInfo` | Caché del servidor | Reiniciar IIS/servicios web de Therefore |
| `data.Fields` undefined | La respuesta usa `CategoryFields` | Cambiar a `data.CategoryFields` |
| HTML no se renderiza en htmlelement | Doble codificación XML en el FDef | Ver sección 10 |
| SQL 547 al importar XML | Falta `DefSubmNo` u otro metadato de instancia | Partir siempre del XML exportado por Therefore |

---

## 10. Generación del XML de Importación del eForm

Al generar el XML programáticamente para importar en Therefore, el encoding del FDef
es el punto más crítico. El patrón correcto es:

1. **Partir siempre del XML exportado por Therefore** — nunca construir el XML desde cero.
   Therefore incluye metadatos específicos de la instancia (`DefSubmNo`, `FCreUs`, `FFold`, etc.)
   que si faltan causan error SQL 547 al importar.

2. **Parsear el FDef** decodificando primero las entidades XML:
   ```python
   fdef_decoded = fdef_raw.replace('&lt;', '<').replace('&gt;', '>').replace('&amp;', '&')
   fdef = json.loads(fdef_decoded)
   ```

3. **Modificar** el objeto Python (añadir componentes, actualizar `customDefaultValue`, etc.)

4. **Serializar de vuelta** y XML-encodear el resultado completo:
   ```python
   new_fdef_json = json.dumps(fdef, ensure_ascii=False)
   fdef_for_xml = new_fdef_json.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
   ```

5. **Reemplazar solo el bloque `<EForm>`** en el XML original — todo lo demás queda intacto.

**Por qué este orden importa:** el HTML del content de los `htmlelement` originales
ya tenía `<` como `<` en Python (tras json.loads). Al hacer el XML-encode final,
esos `<` se convierten en `&lt;` correctamente. Si se hace el encode antes del json.loads,
se produce doble codificación (`&amp;lt;`) y el HTML se muestra como texto en el eForm.

**Metadatos obligatorios del `<EForm>` en Therefore On-Premise:**

| Tag | Descripción | Notas |
|-----|-------------|-------|
| `<FNo>` | Número del form | Negativo = placeholder |
| `<FVer>` | Versión | Siempre 1 para nuevos |
| `<FName>` | Nombre visible | |
| `<FDef>` | JSON form.io con XML-encoding | |
| `<DCrea>` | Timestamp creación | Formato `YYYYMMDDHHmmssSSS` |
| `<FCreUs>` | UserNo del creador | Específico de la instancia |
| `<FCreUsNam>` | Username del creador | |
| `<IxProfNo>` | Perfil de indexación | -1 si ninguno |
| `<DefSubmNo>` | Nº submission por defecto | **Obligatorio** — causa SQL 547 si falta |
| `<Id>` | GUID único del eForm | |

---

## 11. Referencia de FieldNos — Categoría 78 Naturgy (Maestro de Usuarios)

| ColName | FieldNo | Tipo | Notas |
|---------|---------|------|-------|
| Usuario_Nombre | 3875 | String | Nombre completo |
| Usuario_ID | 3876 | NumericCounter | ID automático |
| Usuario_Email | 3886 | String | Clave única, siempre minúsculas |
| Codigo_Empleado | 3890 | String | |
| eMail_alternativo | 5599 | String | |
| Clasificacion_Usuario | 10928 | String | |
| TheUserNo | 26841 | Int | |
| Usuario_Notificaciones | 26842 | Logical | |
| TipoUsuario | 26848 | String | Externo / Genérico / Naturgy |
| Direccion | 28119 | String | |
| CP | 28120 | **Int** | ⚠️ Es entero, no string |
| Direccion2 | 28128 | String | |
| Telefono | 28141 | String | |

---

## 12. Notas de Implementación

- El script va en **`customDefaultValue`** del campo, no en `htmlelement` — los scripts en htmlelement son eliminados por form.io.
- `value = email` debe asignarse **sincrónicamente** — form.io lee esta variable al evaluar el campo.
- El `setTimeout(fn, 800)` es necesario porque el DOM del formulario no está completamente renderizado en el momento de evaluación del `customDefaultValue`.
- Usar `el.dispatchEvent(new Event('input/change', {bubbles:true}))` para que form.io registre el cambio y lo incluya en el submit.
- No usar `disabled: true` en form.io para campos readonly — impide que el valor se envíe. Usar `setAttribute('readonly', 'true')` + estilos CSS.
- Los emails en la categoría maestro deben estar en **minúsculas** — usar siempre `.toLowerCase()` al comparar.
- Los apóstrofes y acentos en valores de campos (ej. `"Avinguda Dama d'Elx"`) **no causan problemas** — `JSON.stringify` los maneja correctamente.
- `SaveDocumentIndexDataQuick` **no funciona** correctamente en instancias Canon/Therefore On-Premise — usar siempre `SaveDocumentIndexData` con el patrón GET→SAVE.
- El token obtenido con `GetConnectionToken` es válido durante la sesión — se puede reutilizar para múltiples llamadas sin necesidad de obtener uno nuevo cada vez.

---

## 13. Campos Dependientes en Therefore — Patrón Correcto

### Concepto clave

En Therefore, los campos dependientes funcionan a través de un **campo ID maestro** (lookup). Siempre hay que distinguir:

- **Campo ID (maestro)** — contiene el identificador único del registro en la tabla referenciada. Es el que tiene la relación de dependencia configurada. Al setearlo, Therefore resuelve automáticamente todos los campos dependientes.
- **Campos dependientes** — se rellenan automáticamente a partir del ID maestro. Setearlos directamente no dispara ninguna actualización.

**Ejemplo en Naturgy (Cat. 78):**
- `CP` (FieldNo 28120, Int) → campo ID maestro del código postal
- `CodigoPostal` (FieldNo 28129, String) → campo dependiente (texto del CP)
- `Localidad`, `Provincia`, `PaisISOCode` → campos dependientes resueltos a partir del ID

### Regla de implementación

**Siempre setear el campo ID primero.** Los dependientes se resuelven solos.

```javascript
// CORRECTO — setear el ID dispara la resolución de dependientes
setField('recogidaPostalCodeID', vals[3]);  // CP (ID numérico) → dispara dependientes
setField('cpRemitente',          vals[4]);  // CodigoPostal (texto) → solo visual

// INCORRECTO — setear solo el texto no dispara nada
setField('cpRemitente', vals[4]);  // Localidad, Provincia, País quedan vacíos
```

### El botón `...` (lookup)

Cuando hay múltiples registros para un mismo valor de texto (ej. dos CPs con el mismo literal), el botón `...` permite al usuario elegir el registro correcto. Therefore asigna el ID único del registro elegido y resuelve los dependientes sin ambigüedad.

En la carga automática desde el Maestro, usamos el ID almacenado directamente — evitando la ambigüedad porque el Maestro ya tiene el ID correcto resuelto previamente.

### Búsqueda en el Maestro

Aunque la búsqueda se haga por un campo dependiente (ej. buscar por `CodigoPostal` el texto), el resultado debe recuperar también el **ID maestro** para poder setearlo en el formulario:

```javascript
SelectedFieldsNoOrNames: [
  'Usuario_Nombre',   // vals[0]
  'Direccion',        // vals[1]
  'Direccion2',       // vals[2]
  'CP',               // vals[3] ← ID maestro → setField('recogidaPostalCodeID')
  'CodigoPostal',     // vals[4] ← texto dependiente → setField('cpRemitente')
  'Telefono'          // vals[5]
]
```
