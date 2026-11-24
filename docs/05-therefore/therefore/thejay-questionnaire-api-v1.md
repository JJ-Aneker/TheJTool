# TheJTool Questionnaire API v1

## Descripción General

API REST para procesamiento asíncrono de cuestionarios de seguridad IT de proveedor (formularios Excel de clientes como ING) mediante extracción inteligente de preguntas con IA.

**Versión actual**: v1.0 — Solo extracción de preguntas (fase 1)  
**Próximas versiones**: matching con preguntas normalizadas + generación de respuestas con IA

---

## Autenticación

Todos los endpoints requieren autenticación mediante JWT de Supabase Auth.

```http
Authorization: Bearer <JWT_TOKEN>
```

### Obtener Token de Acceso

**Endpoint**: `POST https://buildingcenter.supabase.co/auth/v1/token?grant_type=password`

**Headers**:
```http
apikey: <SUPABASE_ANON_KEY>
Content-Type: application/json
```

**Body**:
```json
{
  "email": "servicio.cuestionarios@buildingcenter.com",
  "password": "<PASSWORD>"
}
```

**Response**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "..."
}
```

**Nota**: El `access_token` es válido durante 1 hora. Para renovarlo, usar el `refresh_token` con `grant_type=refresh_token`.

---

## Endpoints

### 1. Subir Cuestionario

Recibe un fichero Excel de cuestionario de seguridad IT y lo procesa de forma asíncrona.

**Endpoint**: `POST /api/questionnaires/upload`

**Autenticación**: JWT de Supabase Auth (Bearer token)

**Content-Type**: `multipart/form-data`

**Parámetros**:

| Campo | Tipo | Requerido | Descripción | Ejemplo |
|-------|------|-----------|-------------|---------|
| `file` | File | ✅ | Fichero Excel (.xlsx, máx 20MB) | `cuestionario_ing.xlsx` |
| `cliente` | String | ✅ | Nombre del cliente | `"ING"` |
| `nombre_formulario` | String | ✅ | Nombre del formulario | `"Third Party IT Security Compliance v3"` |
| `producto_afectado` | String | ⬜ | Producto: "Therefore", "DOCAI", "Corporativo", "Mixto" | `"Therefore"` |

**Ejemplo de Llamada (curl)**:

```bash
curl -X POST https://api.thejay.es/api/questionnaires/upload \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F "file=@cuestionario_ing.xlsx" \
  -F "cliente=ING" \
  -F "nombre_formulario=Third Party IT Security Compliance v3" \
  -F "producto_afectado=Therefore"
```

**Ejemplo de Llamada (JavaScript/Fetch)**:

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('cliente', 'ING');
formData.append('nombre_formulario', 'Third Party IT Security Compliance v3');
formData.append('producto_afectado', 'Therefore');

const response = await fetch('https://api.thejay.es/api/questionnaires/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${JWT_TOKEN}`
  },
  body: formData
});

const result = await response.json();
console.log('ID del cuestionario:', result.id);
```

**Response** (202 Accepted):

```json
{
  "message": "Cuestionario recibido y en procesamiento",
  "id": 123,
  "estado": "pendiente",
  "cliente": "ING",
  "nombre_formulario": "Third Party IT Security Compliance v3"
}
```

**Códigos de Error**:

| Código | Descripción |
|--------|-------------|
| 400 | Campos requeridos faltantes o fichero inválido |
| 401 | Token JWT inválido o faltante |
| 413 | Fichero demasiado grande (>20MB) |
| 500 | Error del servidor |

---

### 2. Consultar Estado del Procesamiento

Consulta el estado actual del procesamiento de un cuestionario y obtiene los resultados si está completado.

**Endpoint**: `GET /api/questionnaires/:id/status`

**Autenticación**: JWT de Supabase Auth (Bearer token)

**Parámetros de Ruta**:

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | Integer | ID del cuestionario (devuelto en `/upload`) |

**Ejemplo de Llamada (curl)**:

```bash
curl -X GET https://api.thejay.es/api/questionnaires/123/status \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Ejemplo de Llamada (JavaScript/Fetch)**:

```javascript
const response = await fetch('https://api.thejay.es/api/questionnaires/123/status', {
  headers: {
    'Authorization': `Bearer ${JWT_TOKEN}`
  }
});

const status = await response.json();

if (status.estado === 'completado') {
  console.log(`✅ Procesamiento completado: ${status.total_preguntas} preguntas extraídas`);
  console.log('Preguntas:', status.preguntas);
} else if (status.estado === 'procesando') {
  console.log(`⏳ Procesando: ${status.progreso.porcentaje}% (${status.progreso.procesadas}/${status.progreso.total})`);
} else if (status.estado === 'error') {
  console.error(`❌ Error: ${status.mensaje_error}`);
}
```

**Response** — Estado `pendiente`:

```json
{
  "id": 123,
  "cliente": "ING",
  "nombre_formulario": "Third Party IT Security Compliance v3",
  "producto_afectado": "Therefore",
  "estado": "pendiente",
  "fecha_recepcion": "2026-07-10",
  "creado_en": "2026-07-10T14:30:00.000Z"
}
```

**Response** — Estado `procesando`:

```json
{
  "id": 123,
  "cliente": "ING",
  "estado": "procesando",
  "progreso": {
    "procesadas": 250,
    "total": 487,
    "porcentaje": 51
  }
}
```

**Response** — Estado `completado`:

```json
{
  "id": 123,
  "cliente": "ING",
  "nombre_formulario": "Third Party IT Security Compliance v3",
  "producto_afectado": "Therefore",
  "estado": "completado",
  "fecha_recepcion": "2026-07-10",
  "total_preguntas": 487,
  "preguntas": [
    {
      "id": 5001,
      "hoja": "Questions",
      "seccion": "1. AUTENTICACIÓN Y AUTORIZACIÓN",
      "question_id_origen": "SG-01",
      "texto_pregunta": "¿Dispone de un sistema de autenticación multifactor para acceso remoto?",
      "respuesta_existente": "",
      "evidencia_nota": "",
      "cell_ref": "C12",
      "answer_cell_ref": "D12",
      "detection_method": "header",
      "confidence": "alta",
      "pregunta_normalizada_id": null,
      "revisado": false
    },
    {
      "id": 5002,
      "hoja": "Questions",
      "seccion": "1. AUTENTICACIÓN Y AUTORIZACIÓN",
      "question_id_origen": "SG-02",
      "texto_pregunta": "¿Se revisan y revocan periódicamente los permisos de acceso?",
      "respuesta_existente": "Sí, trimestralmente",
      "evidencia_nota": "Ver política PO-SEC-001 sección 4.2",
      "cell_ref": "C13",
      "answer_cell_ref": "D13",
      "detection_method": "header",
      "confidence": "alta",
      "pregunta_normalizada_id": null,
      "revisado": false
    }
    // ... resto de preguntas (máx 487 en este ejemplo)
  ],
  "estadisticas": {
    "total": 487,
    "por_confianza": {
      "alta": 450,
      "baja": 37
    },
    "por_metodo": {
      "header": 450,
      "heuristic": 37
    },
    "revisadas": 0,
    "pendientes_revision": 487
  }
}
```

**Response** — Estado `error`:

```json
{
  "id": 123,
  "cliente": "ING",
  "estado": "error",
  "mensaje_error": "Error insertando lote: duplicate key value violates unique constraint \"uq_formulario_pregunta\"",
  "fecha_recepcion": "2026-07-10"
}
```

**Códigos de Error**:

| Código | Descripción |
|--------|-------------|
| 400 | ID inválido |
| 401 | Token JWT inválido o faltante |
| 404 | Cuestionario no encontrado |
| 500 | Error del servidor |

---

## Modelo de Pregunta Extraída

Cada pregunta extraída incluye los siguientes campos:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | Integer | ID único de la pregunta extraída |
| `hoja` | String | Nombre de la hoja de Excel de origen |
| `seccion` | String | Sección/categoría de la pregunta (puede ser `null`) |
| `question_id_origen` | String | ID de referencia del propio Excel (p.ej. "SG-01"), puede ser `null` |
| `texto_pregunta` | String | Texto de la pregunta |
| `respuesta_existente` | String | Respuesta existente en el Excel (si la hay), puede ser `null` |
| `evidencia_nota` | String | Nota/evidencia del Excel (si existe), puede ser `null` |
| `cell_ref` | String | Referencia de celda de la pregunta (p.ej. "C12") |
| `answer_cell_ref` | String | Referencia de celda donde va la respuesta (para rellenar después) |
| `detection_method` | String | Método de detección: `"header"` o `"heuristic"` |
| `confidence` | String | Nivel de confianza: `"alta"` o `"baja"` |
| `pregunta_normalizada_id` | Integer | FK a pregunta normalizada (fase 2, actualmente `null`) |
| `revisado` | Boolean | Si la pregunta ha sido revisada manualmente (actualmente `false`) |

### Interpretación de `detection_method` y `confidence`

- **`header` + `alta`**: Pregunta detectada mediante cabeceras claras (fila con "Pregunta", "Respuesta", etc.). Alta confiabilidad.
- **`heuristic` + `baja`**: Pregunta detectada mediante heurísticas (busca "?", "indicar", etc.). Requiere revisión manual.

**Recomendación**: Las preguntas con `confidence: "baja"` deben ser revisadas manualmente antes de proceder con la generación de respuestas.

---

## Flujo de Trabajo Recomendado

### 1. Subida del Cuestionario

```javascript
const uploadResponse = await fetch('/api/questionnaires/upload', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});

const { id } = await uploadResponse.json();
console.log(`Cuestionario subido, ID: ${id}`);
```

### 2. Polling del Estado (cada 5 segundos)

```javascript
async function waitForCompletion(questionnaireId, token) {
  while (true) {
    const response = await fetch(`/api/questionnaires/${questionnaireId}/status`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const status = await response.json();

    if (status.estado === 'completado') {
      console.log(`✅ Completado: ${status.total_preguntas} preguntas extraídas`);
      return status.preguntas;
    } else if (status.estado === 'error') {
      throw new Error(`Error en procesamiento: ${status.mensaje_error}`);
    } else if (status.estado === 'procesando') {
      console.log(`⏳ Procesando: ${status.progreso.porcentaje}%`);
    }

    // Esperar 5 segundos antes del siguiente polling
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}

const preguntas = await waitForCompletion(id, token);
```

### 3. Procesamiento del Resultado

```javascript
// Filtrar preguntas de alta confianza
const preguntasAlta = preguntas.filter(p => p.confidence === 'alta');
const preguntasBaja = preguntas.filter(p => p.confidence === 'baja');

console.log(`Preguntas de alta confianza: ${preguntasAlta.length}`);
console.log(`Preguntas de baja confianza (requieren revisión): ${preguntasBaja.length}`);

// Agrupar por sección
const porSeccion = preguntas.reduce((acc, p) => {
  const seccion = p.seccion || 'Sin sección';
  if (!acc[seccion]) acc[seccion] = [];
  acc[seccion].push(p);
  return acc;
}, {});

console.log('Preguntas por sección:', Object.keys(porSeccion).map(s => `${s}: ${porSeccion[s].length}`));
```

---

## Límites y Consideraciones

- **Tamaño máximo del fichero**: 20MB
- **Formatos soportados**: .xlsx (Excel 2007+)
- **Timeout del procesamiento**: ~10 minutos (para cuestionarios muy grandes)
- **Polling recomendado**: cada 5 segundos
- **Token JWT**: válido 1 hora (renovar con refresh_token si expira durante el procesamiento)

---

## Formatos de Excel Soportados

El parser soporta dos tipos de formatos:

### 1. Formato con Cabeceras Claras (Confianza Alta)

```
| Pregunta                        | Respuesta | Evidencia       | Categoría     |
|----------------------------------|-----------|-----------------|---------------|
| ¿Dispone de autenticación MFA?   |           |                 | Autenticación |
| ¿Revisa permisos trimestralmente?| Sí        | PO-SEC-001 §4.2 | Autorización  |
```

- **Cabeceras detectadas**: "Pregunta", "Respuesta", "Evidencia", "Categoría", "ID", "Referencia"
- **Idiomas**: español, inglés (keywords case-insensitive)
- **Confianza**: `alta`

### 2. Formato Heurístico (Confianza Baja)

Detecta preguntas por patrones:
- Texto que termina en "?"
- Palabras clave: "indicar", "describir", "especificar", "detallar", "explicar"
- Asume respuesta en celda vacía a la derecha o debajo

**Confianza**: `baja` (requiere revisión manual)

### 3. Secciones mediante Celdas Combinadas

```
| 1. AUTENTICACIÓN Y AUTORIZACIÓN (celda combinada A1:D1) |
|----------------------------------------------------------|
| Pregunta                        | Respuesta | ... |
| ¿Dispone de autenticación MFA?   |           | ... |
```

Las secciones se heredan a todas las preguntas siguientes hasta la próxima sección.

---

## Troubleshooting

### Error 413: Fichero demasiado grande

**Solución**: Comprimir el fichero Excel o dividirlo en múltiples ficheros (<20MB cada uno).

### Error 401: Token inválido

**Causas posibles**:
- Token expirado (válido 1 hora)
- Token de otro entorno (dev/staging/prod)

**Solución**: Renovar el token con el `refresh_token`.

### Estado `error` con mensaje "SAXMLReader: Parse failed"

**Causa**: Fichero Excel corrupto o no es un .xlsx válido.

**Solución**: Abrir el fichero en Excel, guardarlo nuevamente como .xlsx y volver a subirlo.

### Preguntas extraídas de baja confianza (>30%)

**Causa**: Formato del Excel no tiene cabeceras claras o está muy desestructurado.

**Solución**: 
1. Revisar manualmente las preguntas con `confidence: "baja"`
2. Si es posible, estandarizar el formato del Excel del cliente con cabeceras claras

---

## Contacto y Soporte

Para soporte técnico, contactar con:
- **Email**: aneker@buildingcenter.com
- **GitHub Issues**: https://github.com/buildingcenter/thejay/issues

---

**Versión**: v1.0  
**Última actualización**: 2026-07-10
