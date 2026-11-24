# TheJTool

> Panel de administración para **Therefore™ Document Management System**

Aplicación web para gestionar categorías, eForms, reportes y configuración de instancias Therefore DMS.

---

## 🚀 Quick Start

```bash
# Instalar dependencias
npm install

# Iniciar en desarrollo
npm run dev

# Abrir en http://localhost:5173
```

Ver [Guías de Setup](docs/01-setup/README.md) para instalación completa.

---

## ✨ Características

- 📋 **Category Builder** - Creador visual de categorías Therefore
- 📝 **eForm Builder** - Generador de formularios electrónicos
- 📊 **Therefore Reporter** - Reportes y consultas multi-instancia
- 📄 **Document Generator** - Generación de documentación con Bedrock AI
- 🔄 **Gantt Viewer** - Visualización y export de diagramas Gantt
- 👥 **Gestión de Usuarios** - Administración de perfiles y permisos
- 🏢 **Gestión de Tenants** - Configuración de instancias Therefore
- 🎨 **Verticales** - Base de conocimiento para documentos

---

## 🛠️ Stack Tecnológico

### Frontend
- **React 18** + **Vite** - UI framework & build tool
- **Ant Design 5** - Componentes UI
- **React Router 6** - Navegación

### Backend & Services
- **Supabase** - Auth, PostgreSQL, Storage, RLS
- **Express** - API REST
- **AWS Bedrock** - IA generativa (documentación)

### Librerías
- **ExcelJS** - Generación de Excel/Gantt
- **docx** - Generación de Word
- **axios** - HTTP client para Therefore API

---

## 📚 Documentación

La documentación completa está organizada en categorías:

- **[01 - Setup & Configuración](docs/01-setup/README.md)** - Instalación y setup inicial
- **[02 - Arquitectura](docs/02-architecture/README.md)** - Diseño y modelos de datos
- **[03 - Desarrollo](docs/03-development/README.md)** - Guías de desarrollo
- **[04 - Mantenimiento](docs/04-maintenance/README.md)** - Depuración y optimización
- **[05 - Therefore API](docs/05-therefore/README.md)** - Referencia de Therefore DMS
- **[06 - Ejemplos](docs/06-examples/README.md)** - Casos de uso y ejemplos
- **[07 - Samples](docs/07-samples/README.md)** - XMLs de muestra

Ver **[Índice Completo de Documentación](docs/README.md)**

---

## 📊 Estado del Proyecto

| Aspecto | Estado | Nota |
|---------|--------|------|
| **Código** | ✅ Producción | Limpio y refactorizado |
| **Performance** | ✅ Optimizado | Bundle -50%, carga -60% |
| **Tests** | ⚠️ Pendiente | A implementar |
| **TypeScript** | ⚠️ Pendiente | Migración opcional |
| **Docs** | ✅ Completa | Organizada y navegable |

### Métricas

- **Bundle inicial:** 905 KB (gzip: 278 KB)
- **Primera carga:** ~2 segundos (3G)
- **Code splitting:** ✅ Por rutas
- **Lighthouse Performance:** ~85/100

Ver [Estado de Optimización](docs/04-maintenance/optimizacion/estado-optimizacion.md)

---

## 🏗️ Estructura del Proyecto

```
TheJTool/
├── api/                    # Backend Express
│   ├── analyze.js         # Análisis de documentos
│   ├── bedrock.js         # AWS Bedrock integration
│   ├── build-docx.js      # Generación de Word
│   └── generate-gantt.js  # Generación de Gantt
│
├── src/                    # Frontend React
│   ├── components/        # Componentes reutilizables
│   ├── views/             # Vistas principales
│   ├── services/          # Servicios API
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utilidades (errorHandler, logger)
│   └── constants/         # Constantes (messages, types)
│
├── docs/                   # Documentación organizada
├── supabase/              # Migraciones y configuración DB
└── public/                # Assets estáticos
```

---

## 🔐 Variables de Entorno

Crea un archivo `.env` en la raíz:

```env
# Supabase (Requerido)
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui

# AWS Bedrock (Opcional - solo para generación de documentos)
AWS_ACCESS_KEY_ID=tu-aws-key
AWS_SECRET_ACCESS_KEY=tu-aws-secret
AWS_REGION=us-east-1
```

---

## 🧪 Scripts Disponibles

```bash
# Desarrollo (Windows)
./start-dev.ps1          # ⚡ Arranca Frontend + Backend (recomendado)
./stop-dev.ps1           # 🛑 Detiene todos los servidores

# Desarrollo (Manual)
npm run dev              # Iniciar frontend (puerto 5173)
node server.js           # Iniciar backend (puerto 3002)

# Build
npm run build            # Build de producción
npm run preview          # Preview del build

# Utilidades
npm run lint             # Linter
```

### 🚀 Start Development (Script Automático)

**Windows PowerShell:**
```powershell
.\start-dev.ps1
```

Este script arranca automáticamente:
- ✅ Frontend (Vite) en http://localhost:5173
- ✅ Backend (Express) en http://localhost:3002

Ambos en ventanas separadas para ver los logs.

**Para detener:**
```powershell
.\stop-dev.ps1
```

---

## 📦 Deploy

### Frontend (Vercel/Netlify)

```bash
npm run build
# Deploy automático al hacer push a main
```

### Backend (Express en VPS/Cloud)

```bash
node server.js
# Usar PM2 para proceso persistente:
pm2 start server.js --name "thetool-api"
```

---

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📝 Convenciones de Código

- **Componentes:** PascalCase (`CategoryBuilder.jsx`)
- **Utilidades:** camelCase (`errorHandler.js`)
- **Constantes:** UPPER_SNAKE_CASE (`MESSAGES`)
- **Archivos:** kebab-case (`setup-eforms.md`)
- **Mensajes:** Usar `MESSAGES` de `constants/messages.js`
- **Errores:** Usar `handleError` de `utils/errorHandler.js`
- **Logging:** Usar `logger` de `utils/logger.js` (no `console.log`)

Ver [Refactoring Completo](docs/04-maintenance/refactoring/refactoring-completo.md)

---

## 📄 Licencia

Uso interno - Aneker © 2025

---

## 🔗 Links Útiles

- **[Therefore Help](https://www.therefore.net/help/2025/en-us/AR/)** - Documentación oficial
- **[Supabase Docs](https://supabase.com/docs)** - Base de datos y auth
- **[Ant Design](https://ant.design/)** - Componentes UI
- **[React Docs](https://react.dev/)** - Framework frontend

---

## 📧 Soporte

Para soporte o preguntas, contacta: **aneker@gmail.com**
