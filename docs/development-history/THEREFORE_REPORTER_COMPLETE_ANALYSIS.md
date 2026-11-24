# Therefore Reporter V4.2 — Análisis Completo de Lógica

**Fuente:** therefore-reporter-v4.2.html (1806 líneas)  
**Fecha Análisis:** 2026-05-19  
**Versión:** 4.2

---

## 1. ESTADO GLOBAL (STATE OBJECT)

```javascript
const S = {
  // Conexión
  url: '',                 // Base URL: https://buildingcenter.thereforeonline.com
  user: '',                // API username
  pass: '',                // API password (temporal, no guardado)
  tenant: '',              // TenantName (opcional)
  token: null,             // Bearer token tras GetConnectionToken
  headers: {},             // Headers HTTP incluyendo Authorization
  
  // Árbol de categorías
  tree: [],                // Respuesta de GetCategoriesTree
  catNames: {},            // catNo → nombre de categoría (ej: {84: "Notificaciones", 91: "Documentos"})
  
  // Selecciones del usuario
  selectedCatNos: Set(),   // Categorías checked (ej: {84, 91})
  
  // Campos
  allFields: [],           // Todos los campos comunes {name, caption, type, catNos}
  selectedFields: [],      // Subset de allFields (deprecated, usar savedFields)
  captionMap: {},          // ColName → Caption legible
  catFieldOrder: {},       // catNo → [ColNames en orden según GetCategoryInfo]
  
  // Resultados
  results: [],             // Array de objetos {DocNo, campo1, campo2, ..., _cat}
  canonicalFields: [],     // Orden real de campos según Columns de respuesta
  resultHeaders: [],       // (deprecated)
  
  // Ejecución
  activeProfile: null,     // Perfil que se está ejecutando
  _activeQueryId: null,    // QueryID para paginación
  _editingProfileName: null, // Nombre del perfil si se está editando (null=nuevo)
};
```

---

## 2. FLUJO DE CREACIÓN DE PERFIL

### Página: Editor (3 paneles lado a lado)

#### Panel 1: Conexión
**Inputs:**
- Nombre del perfil (input text)
- URL del servidor Therefore (input text)
- Usuario API (input text)
- Contraseña API (input password)
- Tenant (input text, opcional)

**Botón:** "🔗 Conectar y cargar categorías"

**Lógica:**
```javascript
async function conectar() {
  // 1. Leer inputs
  S.url = document.getElementById('inp-url').value.trim();
  S.user = document.getElementById('inp-user').value.trim();
  S.pass = document.getElementById('inp-pass').value;
  S.tenant = document.getElementById('inp-tenant').value.trim();
  
  // 2. Validar
  if (!S.url || !S.user || !S.pass) { error; return; }
  
  // 3. Crear headers con Basic Auth
  const basicAuth = 'Basic ' + btoa(S.user + ':' + S.pass);
  S.headers = {
    'Authorization': basicAuth,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  if (S.tenant) S.headers['TenantName'] = S.tenant;
  
  // 4. GetConnectionToken
  const tr = await api('GetConnectionToken', {});
  S.token = tr.Token;
  
  // 5. Actualizar headers para futuras llamadas
  S.headers['Authorization'] = 'Basic ' + btoa(S.user + ':' + S.token);
  S.headers['UseToken'] = '1';
  
  // 6. Cargar árbol
  await cargarArbol();
  
  // 7. Mostrar "Conectado" y habilitar guardar
}
```

#### Panel 2: Seleccionar Categorías
**Lógica:**
```javascript
async function cargarArbol() {
  // GetCategoriesTree retorna estructura jerárquica
  const resp = await api('GetCategoriesTree', {});
  S.tree = resp.TreeItems || resp.Categories || [];
  
  // Renderizar árbol con:
  // - Carpetas (ItemType === 1) con toggle expand/collapse
  // - Categorías (ItemType === 2) con checkboxes
  // - Guardar nombre: S.catNames[catNo] = node.Name
}

function toggleCat(chk) {
  const n = parseInt(chk.dataset.catno);
  if (chk.checked) {
    S.selectedCatNos.add(n);
  } else {
    S.selectedCatNos.delete(n);
  }
  // Trigger automático a cargarCampos() con debounce
  scheduleFieldsReload();
}
```

#### Panel 3: Campos Comunes
**Lógica:**
```javascript
async function cargarCampos() {
  const fieldMap = new Map();
  fieldMap.set('DocNo', { caption: 'DocNo', type: 0, catNos: [...S.selectedCatNos] });
  
  // Para cada categoría seleccionada
  for (const catNo of S.selectedCatNos) {
    const resp = await api('GetCategoryInfo', { CategoryNo: catNo });
    
    // Filtrar campos: excluir FieldType === 8 (tablas/arrays)
    const fields = (resp.CategoryFields || []).filter(f => 
      f.ColName && f.FieldType !== 8
    );
    
    // Guardar orden por categoría
    S.catFieldOrder[catNo] = fields.map(f => f.ColName);
    
    // Agregar a map
    fields.forEach(f => {
      S.captionMap[f.ColName] = f.Caption || f.ColName;
      if (!fieldMap.has(f.ColName)) {
        fieldMap.set(f.ColName, {
          caption: f.Caption,
          type: f.FieldType,
          catNos: []
        });
      }
      fieldMap.get(f.ColName).catNos.push(catNo);
    });
  }
  
  // Calcular INTERSECCIÓN: campos que aparecen en TODAS las categorías
  const total = S.selectedCatNos.size;
  S.allFields = [...fieldMap.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .filter(f => f.name === 'DocNo' || f.catNos.length === total);
  
  renderFieldsList(S.allFields);
}

function renderFieldsList(fields) {
  // Mostrar cada campo con:
  // - Checkbox para incluir/excluir (todos checked por defecto)
  // - Checkbox "Agrupar" para usar en gráficos (para dashboard)
  // - Nombre, caption, tipo
  // - DocNo siempre incluido, no mostrar en lista
}
```

**Guardar Perfil:**
```javascript
function saveProfile() {
  const name = document.getElementById('inp-name').value.trim();
  const url = document.getElementById('inp-url').value.trim();
  const user = document.getElementById('inp-user').value.trim();
  const tenant = document.getElementById('inp-tenant').value.trim();
  
  // Recopilar selecciones
  const selectedFields = new Set(['DocNo']);
  document.querySelectorAll('.field-chk:checked').forEach(c => {
    selectedFields.add(c.dataset.field);
  });
  
  const groupFields = [];
  document.querySelectorAll('.grp-chk:checked').forEach(c => {
    groupFields.push(c.dataset.field);
  });
  
  // Guardar en localStorage (o en DB en versión web)
  const profile = {
    url,
    user,
    tenant,
    savedCatNos: [...S.selectedCatNos],
    savedFields: [...selectedFields],
    captionMap: S.captionMap,
    catFieldOrder: S.catFieldOrder,
    catNames: S.catNames || {},
    groupFields  // ← IMPORTANTE: campos a agrupar en dashboard
  };
  
  profiles[name] = profile;
  setProfiles(profiles);
}
```

---

## 3. FLUJO DE EJECUCIÓN DE INFORME

### Página: Home (lista de perfiles)
**Tarjeta de perfil:**
```html
<div class="profile-card">
  <!-- Nombre, URL, categorías, campos -->
  <input type="password" placeholder="Contraseña..." id="home-pass-${safeId}">
  <button onclick="runProfileFromCard('${name}', '${safeId}')">
    📂 Abrir consulta
  </button>
</div>
```

**Lógica:**
```javascript
async function runProfileFromCard(name, safeId) {
  const pass = document.getElementById('home-pass-' + safeId).value;
  if (!pass) { error; return; }
  
  const p = profiles[name];
  S.activeProfile = { name, ...p };
  S.url = p.url;
  S.user = p.user;
  S.pass = pass;  // ← Solo para esta ejecución, no guardado
  S.tenant = p.tenant || '';
  S.captionMap = p.captionMap || {};
  S.catFieldOrder = p.catFieldOrder || {};
  S.catNames = p.catNames || {};
  S.groupFields = p.groupFields || [];
  S.selectedCatNos = new Set(p.savedCatNos || []);
  
  // Autenticar
  const basicAuth = 'Basic ' + btoa(S.user + ':' + S.pass);
  S.headers = {
    'Authorization': basicAuth,
    'Content-Type': 'application/json'
  };
  if (S.tenant) S.headers['TenantName'] = S.tenant;
  
  // GetConnectionToken
  const tr = await api('GetConnectionToken', {});
  S.token = tr.Token;
  S.headers['Authorization'] = 'Basic ' + btoa(S.user + ':' + S.token);
  S.headers['UseToken'] = '1';
  
  // Mostrar página de resultados con panel de filtro
  showPage('results');
}
```

### Página: Results (ejecución y dashboard)

**Panel de filtro:**
```html
<select id="flt-date-field"><!-- Campos detectados como fecha --></select>
<input type="date" id="flt-date-from">
<input type="date" id="flt-date-to">
<button onclick="ejecutarConsulta()">▶ Ejecutar</button>
```

**Lógica de filtro de fecha:**
```javascript
function populateDateFields(canonicalFields) {
  // Detectar campos de tipo fecha:
  // 1. Por FieldType === 3 o 4 (de GetCategoryInfo)
  // 2. Por nombre que incluya: fecha, date, time, stamp
  
  const dateFields = canonicalFields.filter(f =>
    f !== 'DocNo' && (
      f.toLowerCase().includes('fecha') ||
      f.toLowerCase().includes('date') ||
      f.toLowerCase().includes('time')
    )
  );
  
  // Rellenar select con campos fecha
  // Fallback: si no hay, mostrar todos los campos
}
```

**Ejecución de consulta:**
```javascript
async function ejecutarConsulta() {
  // 1. Refrescar estructura de campos (catFieldOrder)
  S.catFieldOrder = {};
  for (const catNo of [...S.selectedCatNos]) {
    const resp = await api('GetCategoryInfo', { CategoryNo: catNo });
    const fields = resp.CategoryFields.filter(f => f.FieldType !== 8);
    S.catFieldOrder[catNo] = fields.map(f => f.ColName);
  }
  
  // 2. Leer filtro de fecha (OBLIGATORIO)
  const dateField = document.getElementById('flt-date-field').value;
  const dateFrom = document.getElementById('flt-date-from').value;
  const dateTo = document.getElementById('flt-date-to').value;
  
  if (!dateFrom || !dateTo || !dateField) { error; return; }
  
  // 3. Construir Conditions array
  const dateCondition = {
    FieldNoOrName: dateField,
    Operator: 0,  // ← Crítico: siempre usar 0
    Condition: dateFrom + ' TO ' + dateTo  // Formato: "yyyy-mm-dd TO yyyy-mm-dd"
  };
  
  // 4. Construir ExecuteMultiQuery
  const queries = [...S.selectedCatNos].map(catNo => ({
    CategoryNo: catNo,
    Mode: 0,
    MaxRows: 10000,
    Conditions: [dateCondition]
  }));
  
  const resp = await api('ExecuteMultiQuery', {
    Queries: queries,
    MaxRows: 500000,
    RowBlockSize: 500
  });
  
  S._activeQueryId = resp.QueryID;
  let hasMore = resp.HasMoreRows;
  
  // 5. Mapeo CRÍTICO de resultados
  // Usar Columns[i].IndexDataFieldName, NO GetCategoryInfo order
  const savedSet = new Set(S.activeProfile.savedFields || []);
  const firstQR = (resp.QueryResults || []).find(qr => qr.Columns?.length > 0);
  const canonicalFields = [
    'DocNo',
    ...firstQR.Columns
      .map(c => c.IndexDataFieldName)
      .filter(n => n && n !== 'DocNo' && savedSet.has(n))
  ];
  S.canonicalFields = canonicalFields;
  
  // 6. Procesar página actual
  processPage(resp.QueryResults || [], canonicalFields);
  
  // 7. Paginación
  while (hasMore) {
    const next = await api('GetNextMultiQueryRows', { QueryID: S._activeQueryId });
    processPage(next.QueryResults || [], S.canonicalFields);
    hasMore = next.HasMoreRows;
  }
  
  // 8. IMPORTANTE: Liberar recursos (fire-and-forget)
  S._activeQueryId = null;
  fetch(S.url + '/theservice/v0001/restun/ReleaseMultiQuery', {
    method: 'POST',
    headers: S.headers,
    body: JSON.stringify({ QueryID: queryId })
  }).catch(() => {});  // Ignorar errores
  
  // 9. Renderizar dashboard
  renderDashboard(S.canonicalFields);
}
```

**Mapeo de resultados (CRÍTICO):**
```javascript
function processPage(queryResults, savedFields) {
  queryResults.forEach(qr => {
    const catNo = qr.CategoryNo;
    const columns = qr.Columns || [];
    
    // MAPEAR: Columns[i].IndexDataFieldName → índice en IndexValues
    const colMap = {};
    columns.forEach((col, i) => {
      if (col.IndexDataFieldName) {
        colMap[col.IndexDataFieldName] = i;
      }
    });
    
    // Para cada fila
    (qr.ResultRows || []).forEach(row => {
      const rec = { '_cat': catNo };
      
      // Iterar campos guardados
      savedFields.forEach(fname => {
        if (fname === 'DocNo') {
          // DocNo NO está en IndexValues, viene directamente
          rec.DocNo = row.DocNo ?? '';
          return;
        }
        
        // Usar colMap para localizar el índice
        const idx = colMap[fname];
        if (idx !== undefined && idx < row.IndexValues.length) {
          rec[fname] = row.IndexValues[idx] == null ? '' : String(row.IndexValues[idx]);
        } else {
          rec[fname] = '';
        }
      });
      
      S.results.push(rec);
    });
  });
}
```

---

## 4. DASHBOARD Y VISUALIZACIÓN

**Estadísticas:**
```html
<div class="dash-stats">
  <div class="dash-stat-card blue">
    <div class="dash-stat-val">${S.results.length.toLocaleString()}</div>
    <div class="dash-stat-lbl">Total documentos</div>
    <div class="dash-stat-sub">Última extracción: ${now}</div>
  </div>
  <div class="dash-stat-card green">
    <div class="dash-stat-val">${uniqueCats}</div>
    <div class="dash-stat-lbl">Categorías con datos</div>
  </div>
  <div class="dash-stat-card amber">
    <div class="dash-stat-val">${fields.length}</div>
    <div class="dash-stat-lbl">Campos en informe</div>
  </div>
  <div class="dash-stat-card purple" v-if="groupFields.length">
    <div class="dash-stat-val">${groupFields.length}</div>
    <div class="dash-stat-lbl">Agrupaciones activas</div>
  </div>
</div>
```

**Gráficos:**
```javascript
// 1. Agrupar por categoría (SIEMPRE)
const byCat = {};
S.results.forEach(rec => {
  const catNo = rec._cat;
  const name = S.catNames[catNo] || '#' + catNo;
  byCat[name] = (byCat[name] || 0) + 1;
});
renderBarChart('📁 Documentos por categoría', byCat);

// 2. Agrupar por cada campo en groupFields
const groupFields = S.activeProfile.groupFields || [];
groupFields.forEach(f => {
  const byField = {};
  S.results.forEach(rec => {
    const v = rec[f] || '(vacío)';
    byField[v] = (byField[v] || 0) + 1;
  });
  renderBarChart('📊 ' + S.captionMap[f], byField);
});
```

**Gráfico de barras:**
```javascript
function buildBarChart(title, dataObj, colorIdx) {
  // Ordenar por valor descendente, tomar top 15
  const sorted = Object.entries(dataObj)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);
  
  // Renderizar barras con ancho proporcional al máximo
  // Mostrar "+ N valores más" si hay más de 15
}
```

**Tabla detalle (toggle):**
```javascript
function toggleDetail() {
  // Mostrar tabla HTML con:
  // - Headers: Categoría, campo1, campo2, ...
  // - Filas: datos del S.results
  // - Categoría mostrada como badge con nombre
}
```

---

## 5. EXPORTAR A CSV

```javascript
function exportCSV() {
  const p = S.activeProfile;
  const savedFields = S.canonicalFields || p.savedFields || [];
  const headers = ['Categoría', ...savedFields];
  const dataKeys = ['_cat', ...savedFields];
  
  // CSV separado por punto y coma (;)
  const rows = [headers.join(';')];
  
  S.results.forEach(rec => {
    rows.push(dataKeys.map(k => {
      const v = k === '_cat' ? (S.catNames[rec[k]] || rec[k]) : (rec[k] ?? '');
      // Escapar comillas dobles
      return '"' + String(v).replace(/"/g, '""') + '"';
    }).join(';'));
  });
  
  // Agregar BOM UTF-8 para que Excel lea correctamente
  const blob = new Blob(['﻿' + rows.join('\r\n')], {
    type: 'text/csv;charset=utf-8'
  });
  
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${p.name}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
}
```

---

## 6. PERFILES EN ALMACENAMIENTO

**En HTML standalone:** localStorage  
**En web app:** tabla `reporter_profiles` en Supabase

**Estructura de perfil:**
```json
{
  "nombre": "Aliseda - Notificaciones",
  "url": "https://buildingcenter.thereforeonline.com",
  "user": "api_user@example.com",
  "tenant": "buildingcenter",
  "savedCatNos": [84, 91, 108],
  "savedFields": ["DocNo", "Org_nombre", "Fecha_Envio", "Estado_ID"],
  "groupFields": ["Estado_ID", "Org_nombre"],
  "captionMap": {
    "Org_nombre": "Organismo",
    "Fecha_Envio": "Fecha Envío",
    "Estado_ID": "Estado"
  },
  "catFieldOrder": {
    "84": ["Org_nombre", "Fecha_Envio", "Estado_ID", ...],
    "91": ["Org_nombre", "Fecha_Envio", ...],
    "108": [...]
  },
  "catNames": {
    "84": "Notificaciones",
    "91": "Documentos",
    "108": "Archivos"
  }
}
```

---

## 7. ERRORES COMUNES A EVITAR

❌ **NO HACER:**
1. Usar `SelectedFieldsNoOrNames` en ExecuteMultiQuery (error 500)
2. Usar operadores numéricos (Operator: 2, 3) para fechas (no funciona)
3. Inferir orden de IndexValues desde GetCategoryInfo (varía por categoría)
4. Usar `await` en ReleaseMultiQuery (debe ser fire-and-forget)
5. Asumir FieldType 8 (tablas) en IndexValues (no aparecen)

✅ **HACER:**
1. Usar `Columns[i].IndexDataFieldName` para mapear IndexValues
2. Usar `Operator: 0` con formato "yyyy-mm-dd TO yyyy-mm-dd" para fechas
3. Siempre refrescar catFieldOrder antes de ejecutar
4. Liberar QueryID con setTimeout asíncrono
5. Filtrar FieldType !== 8 en GetCategoryInfo

---

## 8. FLUJO TÉCNICO RESUMIDO

```
HOME
├─ Crear → EDITOR (Paso 1-4)
│  └─ Guardar → localStorage
└─ Ejecutar → conectar → GetConnectionToken
   └─ RESULTS
      ├─ Filtro fecha
      └─ Ejecutar
         ├─ Refrescar catFieldOrder
         ├─ ExecuteMultiQuery
         ├─ Paginación (GetNextMultiQueryRows)
         ├─ ReleaseMultiQuery (async)
         └─ renderDashboard
            ├─ Stat cards
            ├─ Gráficos (por categoría + groupFields)
            ├─ Tabla detalle (toggle)
            └─ Exportar CSV
```

---

**Conclusión:** La lógica es compleja pero bien estructurada. El mapeo de resultados usando `Columns` es crítico. Los campos tipo tabla (FieldType 8) deben excluirse siempre. La paginación es importante para datasets grandes.
