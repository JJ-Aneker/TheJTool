# TheJay Downloader

Herramienta HTML standalone para migrar documentos entre servidores Therefore (On-Premise y Online), o descargarlos localmente. Forma parte del ecosistema **TheJToolbox / GlassApp**.

---

## Fichero

`thejay-downloader-v1.html` — standalone, sin dependencias externas. Ejecutar desde un servidor web local (no desde `file://` por restricciones CORS).

```powershell
# Lanzar servidor local en la carpeta donde esté el HTML
python -m http.server 8080
# Abrir: http://localhost:8080/thejay-downloader-v1.html
```

---

## Funcionalidad

### Flujo en 5 pasos

**Paso 1 — Servidor Origen**
- URL del servidor Therefore (On-Premise u Online)
- Tenant Name opcional (solo Therefore Online)
- Autenticación: Usuario/Contraseña (`restun`) o Windows SSO (`restwin`)
- Verificación de conexión via `GetWebAPIServerVersion`

**Paso 2 — Categoría Origen**
- Selector en árbol jerárquico via `GetCategoriesTree` (carga automática al conectar)
- Buscador en tiempo real por nombre o número de categoría
- Modo alternativo: introducir número directamente
- Info de categoría via `GetCategoryInfo`

**Paso 3 — Filtro**
- Campo + Operador + Valor con soporte de comodines (`*contrat*`)
- Operadores: Igual, Like, ≤, ≥, >, <, ≠
- Límite de documentos (útil para pruebas)
- Concurrencia configurable (1–10, recomendado 3–5)
- Control de duplicados: registro en `localStorage` de documentos ya procesados, con exportación y limpieza

**Paso 4 — Destino**
- Toggle: Descarga local (navegador) o Servidor Therefore destino
- Si servidor: conexión independiente + árbol de categorías destino
- Mapeo manual de campos Origen → Destino (tabla campo a campo)
- Toggle para copiar o no el IndexData (metadatos)

**Paso 5 — Ejecución**
- Progreso en tiempo real con ETA y velocidad (docs/s)
- Log con límite de 300 entradas DOM (historial completo en memoria)
- Checkpoint log cada 500 documentos
- Botón Stop (para proceso limpiamente)
- Resumen final: OK / errores / tiempo / velocidad media
- Exportar log completo a `.txt`

---

## Endpoints Therefore utilizados

| Endpoint | Uso |
|----------|-----|
| `GetWebAPIServerVersion` | Verificar conexión |
| `GetCategoriesTree` | Árbol de categorías para selector |
| `GetCategoryInfo` | Info de campos de una categoría |
| `ExecuteMultiQuery` | Enumerar DocNos con filtros y paginación |
| `GetNextMultiQueryRows` | Paginación de resultados |
| `ReleaseMultiQuery` | Liberar query (fire-and-forget) |
| `GetDocument` | Info streams + IndexData de un documento |
| `GetDocumentStream` | Descargar contenido binario de un stream |
| `CreateDocument` | Crear documento en servidor destino |

---

## Detalles técnicos clave

### Autenticación
- **On-Premise (`restun`)**: Basic Auth con `btoa(unescape(encodeURIComponent(user:pass)))`
- **Windows SSO (`restwin`)**: `credentials: 'include'` en fetch, sin header Authorization
- **Therefore Online**: añadir header `TenantName: <tenant>`
- **No usar `GetConnectionToken`** en On-Premise — puede devolver HTTP 500 en algunas versiones

### Formato de streams
- `GetDocumentStream` devuelve `FileData` como **array de bytes** (On-Premise) o string base64 (Online)
- Para **descarga local**: `new Blob([new Uint8Array(fileData)])`
- Para **CreateDocument**: campo `FileDataBase64JSON` con base64. Conversión por chunks de 8192 bytes para evitar stack overflow en ficheros grandes

### Estructura CreateDocument
```json
{
  "CategoryNo": 588,
  "Streams": [
    {
      "FileName": "documento.pdf",
      "FileData": null,
      "StreamNo": 0,
      "FileDataBase64JSON": "<base64>"
    }
  ],
  "IndexDataItems": [
    {
      "StringIndexData": {
        "FieldNo": 0,
        "FieldName": "NombreCampo",
        "DataValue": "valor"
      }
    }
  ]
}
```

> `FieldNo: 0` + `FieldName` — Therefore resuelve el campo por nombre, no requiere el número exacto.

### Estructura IndexData (origen)
La respuesta de `GetDocument` devuelve `IndexData.IndexDataItems[]` con wrappers tipados:
```json
{ "IntIndexData":    { "FieldNo": 2614, "DataValue": 52,     "FieldName": "OrgID" } }
{ "StringIndexData": { "FieldNo": 2622, "DataValue": "ES AAV","FieldName": "OperatingUnit" } }
{ "DateIndexData":   { "FieldNo": 2630, "DataValue": "2024-01-15", "FieldName": "Fecha" } }
```
Al mapear, se conserva el tipo de wrapper (`IntIndexData`, `StringIndexData`, etc.) y se sustituye `FieldNo` y `FieldName` por los del campo destino.

### Multi-stream
- Documentos con múltiples streams: `StreamNo` incremental (0, 1, 2...)
- Streams descargados en paralelo con `Promise.all` dentro de cada documento
- Pool de concurrencia entre documentos: N workers independientes

### Retry con backoff
Cada llamada API reintenta automáticamente hasta 3 veces en caso de `Failed to fetch`:
- Intento 1 falla → espera 2s → intento 2
- Intento 2 falla → espera 4s → intento 3
- Intento 3 falla → error definitivo

### Control de duplicados (localStorage)
- Clave: `thejay_processed_docs`
- Formato: `{ "58810725": { "dstDocNo": 6449523, "ts": "2026-06-22T10:56", "cat": 71 }, ... }`
- Gestión de tamaño: si supera 4MB, elimina el 20% más antiguo (FIFO)
- Exportable a TSV

---

## Valores por defecto (pilot Canon)

| Campo | Valor |
|-------|-------|
| Servidor origen | `https://dpa.cgn.canon-europa.com:8450` |
| Servidor destino | `https://ces-mad1-dms05.canonintra.net` |
| Usuario | `CANONINTRA\jimenezjj` |
| Categoría origen | 71 |
| Categoría destino | 588 |

---

## Historial de versiones

### v1.0 — 2026-06
- Versión inicial funcional
- Conexión On-Premise con Basic Auth (sin GetConnectionToken)
- ExecuteMultiQuery con paginación completa
- Descarga local: FileData array de bytes → Blob
- Copia a servidor destino con CreateDocument + FileDataBase64JSON
- Mapeo manual de campos con wrappers tipados IndexData
- Multi-stream con StreamNo incremental
- Pool de concurrencia configurable
- Retry con backoff exponencial (3 intentos)
- Control de duplicados en localStorage con gestión de tamaño
- ETA y velocidad en tiempo real
- Log DOM limitado (300 entradas) + exportación completa
- Checkpoint log cada 500 documentos
- Árbol de categorías `GetCategoriesTree` con buscador — origen y destino
- Toggle árbol / número en ambos selectores de categoría
