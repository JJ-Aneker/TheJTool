# RFP Analyzer - MVP FASE 1 ✅

## ✅ Implementación Completada

### Backend
- ✅ Tablas Supabase (`rfp_analyses`, `rfp_sections`)
- ✅ Endpoint `/api/analyze-rfp` (POST - analizar, GET - listar, GET/:id - detalle)
- ✅ Endpoint `/api/rfp-sections` (PUT - actualizar, POST - crear, DELETE - eliminar)
- ✅ Integración AWS Bedrock para análisis con Claude Sonnet
- ✅ Extracción de texto PDF (pdf.js-extract) y DOCX (mammoth)
- ✅ Upload a Supabase Storage

### Frontend
- ✅ Vista `RFPAnalyzer.jsx` con 2 modos:
  - Modo upload: lista de RFPs + zona drag & drop
  - Modo detalle: viabilidad + plazos + riesgos + requisitos + secciones editables
- ✅ Integrado en sidebar (sección Consultoría)
- ✅ Estilos CSS con soporte dark/light theme
- ✅ Traducciones (es/en)

---

## 🚀 Pasos para Activar

### 1. Aplicar Migración SQL

Ejecuta en Supabase SQL Editor:

\`\`\`bash
# En TheJTool/supabase/migrations/
npx supabase db reset  # Si tienes Supabase CLI local

# O copia el contenido de 20261125_rfp_analyzer.sql y pégalo en:
# https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
\`\`\`

### 2. Crear Bucket de Storage

En Supabase Dashboard → Storage → Create new bucket:

- **Name**: `rfp-documents`
- **Public**: ✅ Yes (para que los archivos sean accesibles)
- **Allowed MIME types**: `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- **Max file size**: 25 MB

**RLS Policy** (opcional, ya está en RFP):
\`\`\`sql
-- Permitir uploads autenticados
CREATE POLICY "Users can upload RFP documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'rfp-documents');

-- Permitir lecturas públicas
CREATE POLICY "Anyone can read RFP documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'rfp-documents');
\`\`\`

### 3. Verificar Variables de Entorno

En `.env`:

\`\`\`env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AWS Bedrock
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# API
VITE_API_BASE_URL=http://localhost:3002
\`\`\`

### 4. Reiniciar Servidor

\`\`\`bash
# Terminal 1 (backend)
npm run server:dev

# Terminal 2 (frontend)
npm run dev
\`\`\`

---

## 📋 Cómo Probar

1. **Login** en TheJTool (http://localhost:5173)

2. **Ir a "Analizador de RFPs"** en el sidebar (sección Consultoría)

3. **Upload de RFP**:
   - Nombre: "Prueba VWFS"
   - Arrastra el PDF `VWFES_Pliego_LCYC.pdf` (si lo tienes)
   - Click "Analizar RFP"
   - Espera ~30-60 segundos (Bedrock analizando)

4. **Ver Resultados**:
   - Viabilidad (alta/media/baja) con justificación
   - Plazos críticos (deadline + hitos)
   - Riesgos principales (high/medium/low)
   - Requisitos técnicos
   - Tabla de secciones editables:
     - Cambiar área (dropdown)
     - Cambiar prioridad (crítica/opcional)
     - Cambiar estado (pendiente/en curso/completado)

5. **Volver a lista**:
   - Click "← Volver a lista"
   - Ver todas las RFPs analizadas
   - Click en una para ver detalles

---

## 🎯 Funcionalidades MVP

### ✅ Implementado
- Upload multi-documento (PDF/DOCX, máx 5 archivos, 25MB cada uno)
- Análisis automático con AWS Bedrock (Claude Sonnet)
- Detección de viabilidad (alta/media/baja)
- Extracción de plazos y deadlines
- Identificación de riesgos (con severidad)
- Lista de requisitos técnicos
- Reparto automático de secciones a áreas (8 áreas predefinidas)
- Tabla editable de secciones (área, prioridad, estado, responsable)
- Guardado en Supabase
- Listado de RFPs analizadas
- Auto-save al editar secciones

### ❌ Pendiente (Fase 2)
- Matriz de encaje editable (Cubre/Parcial/Con socio/No cubre)
- Requisitos ocultos explicados (IT-STD, SIEM, SBOM, etc.)
- Perfil de producto editable (JSON)
- Reglas de prudencia en el prompt
- Export a DOCX del informe completo
- Carta de declinación automática
- Consultas al cliente
- Pipeline de 14 pasos con edición humana intermedia

---

## 📊 Estructura de Datos

### rfp_analyses
\`\`\`json
{
  "id": "uuid",
  "user_id": "uuid",
  "name": "VWFS - Facturación Electrónica",
  "files_urls": [
    {"name": "pliego.pdf", "url": "https://...", "path": "user/..."}
  ],
  "viability": "baja",
  "viability_reason": "Therefore™ solo cubre archivo y custodia...",
  "deadlines": {
    "deadline": "2026-11-20",
    "milestones": [{"date": "2026-11-10", "description": "Consultas"}]
  },
  "risks": [
    {"risk": "No somos plataforma SEFE", "severity": "high", "description": "..."}
  ],
  "technical_requirements": ["IT-STD", "SIEM", "SBOM", ...]
}
\`\`\`

### rfp_sections
\`\`\`json
{
  "id": "uuid",
  "rfp_id": "uuid",
  "section_name": "Portal web para proveedores",
  "area": "Técnica",
  "responsible_user_id": null,
  "priority": "critical",
  "status": "pending",
  "order_index": 0
}
\`\`\`

---

## 🔧 Troubleshooting

### Error: "Cannot find module 'pdf.js-extract'"
\`\`\`bash
npm install pdf.js-extract mammoth
\`\`\`

### Error: "Bucket 'rfp-documents' does not exist"
Crear el bucket en Supabase Storage (ver paso 2).

### Error: "No autorizado" al analizar
Verificar que el token de Supabase sea válido y que el usuario esté logueado.

### Bedrock timeout o error de análisis
Verificar que las credenciales AWS estén correctas en `.env` y que el modelo `anthropic.claude-3-5-sonnet-20241022-v2:0` esté disponible en la región configurada.

### Análisis devuelve viabilidad incorrecta
El prompt de Bedrock está en `api/analyze-rfp.js`. Puedes ajustar las reglas de detección ahí.

---

## 📝 Notas Técnicas

- **Extracción PDF**: Usa `pdf.js-extract` para mantener estructura de páginas
- **Extracción DOCX**: Usa `mammoth` para texto plano
- **Límite de texto a Bedrock**: 50.000 caracteres (truncado si es mayor)
- **Timeout Bedrock**: 60 segundos por defecto (configurable)
- **Auto-save**: Cada cambio en secciones se guarda inmediatamente
- **RLS Policies**: Cada usuario solo ve sus propias RFPs

---

## 🎨 Capturas

**Modo Upload**:
- Zona drag & drop
- Input de nombre de RFP
- Lista de RFPs recientes con tags de viabilidad

**Modo Detalle**:
- Card de viabilidad (verde/amber/rojo)
- 2 columnas: Plazos | Riesgos
- Card de Requisitos Técnicos
- Tabla editable de Secciones (dropdowns inline, auto-save)

---

## 🚀 Próximos Pasos (Fase 2)

Ver `Brief_EJEMPLO_Modulo_Analisis_RFP_TheJTool.md` para el pipeline completo de 14 pasos estilo VWFS.

Implementar:
1. Perfil de producto editable (tabla `product_profiles` con JSON)
2. Matriz de encaje con 4 niveles (tabla `rfp_requirements`)
3. Requisitos ocultos (bloques IT-STD con 3 puntos: qué/en pocas palabras/impacto)
4. Reglas de prudencia en el prompt de Bedrock
5. Export a DOCX (usar `docx` lib, ya disponible)
6. Carta de declinación (template)
7. Consultas al cliente (tabla `rfp_consultations`)
8. Regeneración de conclusiones tras editar matriz
