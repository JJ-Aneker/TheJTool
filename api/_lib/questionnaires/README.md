# Módulo de Procesamiento de Cuestionarios de Seguridad IT

## Descripción

Este módulo procesa cuestionarios de seguridad IT de proveedores (formularios Excel de clientes como ING) de forma asíncrona, extrayendo preguntas estructuradas mediante análisis inteligente del formato.

**Fase actual**: v1 — Solo extracción de preguntas. La generación de respuestas con IA vendrá en fase 2.

## Arquitectura

```
Aplicativo externo
    |
    | POST multipart/form-data
    v
/api/questionnaires/upload
    |
    +---> Guarda fichero en Supabase Storage
    +---> Crea registro en tabla `formularios` (estado: pendiente)
    +---> Lanza procesamiento en background
    +---> Responde 202 Accepted inmediatamente
    |
    | (background)
    v
excelParser.js
    |
    +---> Detecta formato: cabeceras vs. heurístico
    +---> Extrae preguntas con metadatos (celda, sección, confianza)
    +---> Inserta en `formulario_preguntas_extraidas`
    +---> Actualiza estado del formulario a 'completado'

Aplicativo externo
    |
    | GET (polling)
    v
/api/questionnaires/:id/status
    |
    +---> Devuelve estado (pendiente|procesando|completado|error)
    +---> Si completado: lista de preguntas extraídas + estadísticas
```

## Endpoints

### POST /api/questionnaires/upload

**Autenticación**: JWT de Supabase Auth (Bearer token)

**Request**: `multipart/form-data`
- `file` (required): fichero Excel (.xlsx, máx 20MB)
- `cliente` (required): nombre del cliente (p.ej. "ING")
- `nombre_formulario` (required): nombre del formulario (p.ej. "Third Party IT Security Compliance v3")
- `producto_afectado` (optional): "Therefore" | "DOCAI" | "Corporativo" | "Mixto"

**Response**: 202 Accepted
```json
{
  "message": "Cuestionario recibido y en procesamiento",
  "id": 123,
  "estado": "pendiente",
  "cliente": "ING",
  "nombre_formulario": "Third Party IT Security Compliance v3"
}
```

**Errores**:
- 400: Campos requeridos faltantes o fichero inválido
- 401: Token inválido o faltante
- 413: Fichero demasiado grande (>20MB)
- 500: Error del servidor

### GET /api/questionnaires/:id/status

**Autenticación**: JWT de Supabase Auth (Bearer token)

**Response** (ejemplo estado `completado`):
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
      "texto_pregunta": "¿Dispone de un sistema de autenticación multifactor?",
      "respuesta_existente": "",
      "evidencia_nota": "",
      "cell_ref": "C12",
      "answer_cell_ref": "D12",
      "detection_method": "header",
      "confidence": "alta",
      "pregunta_normalizada_id": null,
      "revisado": false
    }
    // ... resto de preguntas
  ],
  "estadisticas": {
    "total": 487,
    "por_confianza": { "alta": 450, "baja": 37 },
    "por_metodo": { "header": 450, "heuristic": 37 },
    "revisadas": 0,
    "pendientes_revision": 487
  }
}
```

**Response** (ejemplo estado `procesando`):
```json
{
  "id": 123,
  "estado": "procesando",
  "progreso": {
    "procesadas": 250,
    "total": 487,
    "porcentaje": 51
  }
}
```

**Response** (ejemplo estado `error`):
```json
{
  "id": 123,
  "estado": "error",
  "mensaje_error": "Error insertando lote: duplicate key value violates unique constraint"
}
```

**Errores**:
- 400: ID inválido
- 401: Token inválido o faltante
- 404: Formulario no encontrado
- 500: Error del servidor

## Estrategia de Detección

El parser (`excelParser.js`) implementa una estrategia en dos fases:

### Fase 1: Detección de Cabeceras

Busca en las primeras 10 filas una fila de cabeceras reconocibles con palabras clave:
- **question**: "pregunta", "question", "requisito", "requirement", "item"
- **answer**: "respuesta", "answer", "response"
- **evidence**: "evidencia", "evidence", "comentario", "comment", "notes"
- **category**: "categoría", "category", "sección", "section"
- **id**: "id", "ref.", "referencia", "reference"

**Requisitos**:
- Mínimo 2 roles distintos detectados en la misma fila
- Si no se detecta columna "question" pero sí otras, se infiere por longitud media de texto (≥25 caracteres)

**Características especiales**:
- Detecta cabeceras repetidas dentro de la misma hoja (skip)
- Detecta secciones mediante celdas combinadas de una fila que abarcan múltiples columnas
- Prioriza columna de categoría explícita sobre sección heredada de título combinado

**Confianza**: `alta`

### Fase 2: Modo Heurístico (fallback)

Si no se detectan cabeceras claras:
- Busca celdas con marcadores de pregunta: "?", "indicar", "describir", "especificar", "detallar", "explicar"
- Asume respuesta en celda vacía a la derecha; si está ocupada, en celda vacía debajo
- Detecta títulos de sección por texto en mayúsculas corto (<80 caracteres)

**Confianza**: `baja` (requiere revisión humana)

### Filtros

- Longitud mínima de texto: 5 caracteres (descarta ruido tipo "?" suelto)
- Hojas excluidas por defecto: "mapper", "mapperold", "itss v3 mapper", "rating", "process catalogue", "itss"

## Modelo de Datos

Ver migración completa en `supabase/migrations/20260710_create_questionnaires_tables.sql`.

### Tablas principales

1. **formularios**: metadatos del cuestionario recibido
   - Estados: `pendiente` → `procesando` → `completado` | `error`
   - Incluye campos de progreso (`preguntas_procesadas`, `total_preguntas`)

2. **formulario_preguntas_extraidas**: salida cruda del parser
   - Cada pregunta con: hoja, sección, texto, respuesta existente, celda de origen
   - `detection_method`: "header" | "heuristic"
   - `confidence`: "alta" | "baja"
   - `pregunta_normalizada_id`: FK opcional (se rellena en fase de match con preguntas canónicas)

3. **preguntas_normalizadas**: versión canónica única de cada pregunta (para RAG posterior)

4. **pregunta_variantes**: variantes de texto conocidas (para matching futuro)

5. **respuestas_oficiales**: respuesta curada y versionada (fase 2)

## Configuración

### Variables de entorno necesarias

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...  # Service role key (server-side)
```

### Supabase Storage

Crear bucket `questionnaires` con la siguiente política:
- **Uploads**: autenticado (servicio externo con JWT)
- **Downloads**: servicio (backend con service key)

```sql
-- Política de escritura (aplicativo externo autenticado)
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'questionnaires');

-- Política de lectura (backend con service key)
CREATE POLICY "Allow service role read"
ON storage.objects FOR SELECT
TO service_role
USING (bucket_id = 'questionnaires');
```

## Instalación

```bash
npm install
# multer ya incluido en package.json
# exceljs ya incluido en package.json
```

## Despliegue

**Actual (v1 cloud)**:
- Frontend: Vercel
- Backend: Render
- Base de datos: Supabase (Postgres)
- Storage: Supabase Storage

**Futuro (v2 on-premise)**: 
- Base de datos: SQL Server local
- Vector DB: Qdrant local
- LLM: Ollama local
- **Portabilidad**: el módulo `excelParser.js` es independiente de Express/Supabase y se puede reutilizar en un servicio Node standalone

## Testing

### Crear un usuario de servicio en Supabase

```sql
-- Dashboard de Supabase → Authentication → Users → Create User
-- Email: servicio.cuestionarios@buildingcenter.com
-- Password: (generado seguro)
-- Role: authenticated
```

Obtener JWT del usuario:
```bash
# Llamar a Supabase Auth API para login
curl -X POST 'https://xxx.supabase.co/auth/v1/token?grant_type=password' \
  -H 'apikey: YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"email":"servicio.cuestionarios@buildingcenter.com","password":"..."}'
```

### Ejemplo de llamada con curl

```bash
# Upload
curl -X POST http://localhost:3001/api/questionnaires/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@cuestionario_ing.xlsx" \
  -F "cliente=ING" \
  -F "nombre_formulario=Third Party IT Security Compliance v3" \
  -F "producto_afectado=Therefore"

# Response: {"id":123,"estado":"pendiente",...}

# Status (polling cada 5 segundos hasta estado != procesando)
curl -X GET http://localhost:3001/api/questionnaires/123/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Roadmap

- [x] v1.0: Extracción de preguntas (fase actual)
- [ ] v1.1: Matching automático con preguntas normalizadas (embeddings con Bedrock)
- [ ] v1.2: Generación de respuestas con IA (RAG sobre banco de conocimiento)
- [ ] v2.0: Migración a stack on-premise (SQL Server + Qdrant + Ollama)

## Referencias

- Fichero de referencia Python: `src/reference/excel_parser.py`
- Esquema SQL Server original: `src/reference/banco_conocimiento_schema.sql`
- Migración Postgres: `supabase/migrations/20260710_create_questionnaires_tables.sql`
