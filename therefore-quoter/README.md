# Therefore™ Quoter

Generador de cotizaciones inteligentes para implantaciones Therefore™ usando Claude AI.

## 🚀 Características

- ✅ Upload de documentos (PDF, DOCX, TXT)
- ✅ Análisis automático con Claude AI
- ✅ Estimación de esfuerzo basada en few-shot learning
- ✅ Generación de documentos Word profesionales
- ✅ Knowledge base configurable (16 tipos de tareas, 3 proyectos referencia)
- ✅ Sistema de cláusulas estándar

## 📋 Setup Local

### Backend

```bash
cd therefore-quoter/backend
npm install
```

Crea `.env` basado en `.env.example`:
```
ANTHROPIC_API_KEY=sk-ant-your-key-here
ANTHROPIC_MODEL=claude-sonnet-4-6
PORT=3001
NODE_ENV=development
```

Inicia el servidor:
```bash
npm start
```

### Frontend

```bash
cd therefore-quoter/frontend
npm install
```

Crea `.env.local`:
```
VITE_API_URL=http://localhost:3001
```

Inicia en desarrollo:
```bash
npm run dev
```

Abre http://localhost:5173

## 🌐 Despliegue en Producción

### Backend → Render

1. Crea nuevo servicio en https://render.com
2. Conecta el repositorio GitHub
3. Configuración:
   - **Build command**: `npm install`
   - **Start command**: `npm start`
   - **Environment Variables**:
     - `ANTHROPIC_API_KEY`: Tu clave de API
     - `PORT`: 3001

### Frontend → Vercel

1. Crea nuevo proyecto en https://vercel.com
2. Conecta el repositorio
3. Configuración:
   - **Root Directory**: `therefore-quoter/frontend`
   - **Build command**: `npm run build`
   - **Output directory**: `dist`
   - **Environment Variables**: No necesarias (usa .env.production)

## 📝 Configuración de URLs

- **Desarrollo**: Frontend usa `http://localhost:3001` (desde `.env.local`)
- **Producción**: Frontend usa `https://therefore-agents-api.onrender.com` (desde `.env.production`)

Para cambiar la URL de backend:
- Local: Edita `therefore-quoter/frontend/.env.local`
- Producción: Edita `therefore-quoter/frontend/.env.production`
- Código usa: `import apiConfig from './config'` → `apiConfig.endpoints.analyze` etc.

## 🔗 API Endpoints

| Endpoint | Método | Descripción |
|----------|--------|------------|
| `/api/upload` | POST | Subir y procesar documentos |
| `/api/analyze` | POST | Analizar con Claude e estimar esfuerzo |
| `/api/generate` | POST | Generar documento DOCX |
| `/api/quotes` | GET/POST | Listar/crear cotizaciones |
| `/api/quotes/:id` | GET/PUT/DELETE | Operaciones sobre cotización |
| `/api/knowledge` | GET | Obtener knowledge base completa |
| `/api/knowledge/guide` | GET/PUT | Gestionar guía de esfuerzo |
| `/api/knowledge/examples` | GET/POST | Gestionar proyectos referencia |
| `/api/knowledge/system-prompt` | GET | Ver prompt completo |

## 📚 Knowledge Base

Archivos en `backend/src/knowledge/`:

- `guide.json` - 16 tipos de tareas con rangos de días/horas
- `examples.json` - 3 proyectos reales (BC, COFM, Ethypharm) con input/output para few-shot
- `clauses.json` - Cláusulas estándar, supuestos, exclusiones

## 🤖 Sistema de Few-Shot Learning

El análisis incluye 3 ejemplos reales en el contexto de Claude:
1. **Building Center** (Nuevo, Online) - 17.5 días
2. **COFM** (Evolutivo, On-Premise) - 8.75 días  
3. **Ethypharm** (Nuevo, Online) - 23 días

Esto mejora significativamente la precisión de las estimaciones.

## 🔑 Variables de Entorno

### Backend (.env)
```
ANTHROPIC_API_KEY=sk-ant-...  # Obligatorio
ANTHROPIC_MODEL=claude-sonnet-4-6
PORT=3001
NODE_ENV=development
```

### Frontend (.env.local o .env.production)
```
VITE_API_URL=http://localhost:3001  # O URL de Render en producción
```

## 📦 Dependencias Principales

### Backend
- express, cors, dotenv
- @anthropic-ai/sdk
- docx (generación Word)
- mammoth, pdf-parse (parsing de documentos)

### Frontend
- react, react-dom
- vite (bundler)

## 🐛 Troubleshooting

### "Cannot fetch from backend"
→ Verifica que `VITE_API_URL` está correctamente configurada en `.env.local` o `.env.production`

### "invalid x-api-key"
→ Asegúrate que `ANTHROPIC_API_KEY` en backend/.env es válida

### CORS errors
→ Backend tiene `app.use(cors())` habilitado. Si aún hay problemas, verifica que el frontend envía las headers correctas.

## 📄 Licencia

Propiedad de Aneker - Therefore™ es marca de Canon España, S.A.U.
