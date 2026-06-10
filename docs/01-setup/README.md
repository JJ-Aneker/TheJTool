# 01 - Setup & Configuración

Guías de instalación y configuración inicial del proyecto.

## 📋 Orden Recomendado

1. **[Setup de Perfiles](setup-profiles.md)** - Configurar tabla de perfiles en Supabase
2. **[Setup de eForms](setup-eforms.md)** - Configurar tablas para eForms Builder
3. **[Setup de Verticales](setup-verticales.md)** - Configurar gestión de verticales
4. **[Category Builder Setup](category-builder-setup.md)** - Configurar Category Builder
5. **[Fase 2: Verticales](fase2-verticales.md)** - Funcionalidades avanzadas

## ⚙️ Configuración Básica

### Variables de Entorno (.env)

```env
# Supabase
VITE_SUPABASE_URL=tu-url-aqui
VITE_SUPABASE_ANON_KEY=tu-key-aqui

# AWS Bedrock (opcional)
AWS_ACCESS_KEY_ID=tu-key
AWS_SECRET_ACCESS_KEY=tu-secret
AWS_REGION=us-east-1
```

### Instalación

```bash
# Instalar dependencias
npm install

# Iniciar desarrollo
npm run dev

# Build producción
npm run build
```

## 🔗 Ver También

- [Arquitectura del Sistema](../02-architecture/README.md)
- [Guías de Desarrollo](../03-development/README.md)
