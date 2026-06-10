# ⚠️ SETUP MANUAL — Tabla Verticales en Supabase

**La tabla `verticales` necesita crearse manualmente en Supabase.**

## 🔧 Pasos (2 minutos)

### Paso 1: Abre Supabase SQL Editor

1. Ve a **https://supabase.com/dashboard**
2. Selecciona tu proyecto
3. Lado izquierdo → **SQL Editor**
4. Click en **"New Query"**

### Paso 2: Copia y ejecuta este SQL

```sql
CREATE TABLE IF NOT EXISTS public.verticales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT UNIQUE NOT NULL,
  titulo TEXT NOT NULL,
  descripcion_intro TEXT,
  claves JSONB DEFAULT '[]'::jsonb,
  premisas_especificas JSONB DEFAULT '[]'::jsonb,
  tablas_maestras JSONB DEFAULT '[]'::jsonb,
  herramientas_recomendadas JSONB DEFAULT '[]'::jsonb,
  tarifa_diaria NUMERIC DEFAULT 800,
  duracion_tipica_dias NUMERIC DEFAULT 10,
  margen_oferta_pct NUMERIC DEFAULT 20,
  categorias_arquitectura JSONB DEFAULT '{"Maestros":[],"Documentacion":[],"Operacion":[]}'::jsonb,
  ejemplo_workflows JSONB DEFAULT '[]'::jsonb,
  integraciones_comunes JSONB DEFAULT '[]'::jsonb,
  descripcion_implementacion TEXT,
  casos_prueba_tipicos JSONB DEFAULT '[]'::jsonb,
  criterios_aceptacion JSONB DEFAULT '[]'::jsonb,
  modulos_funcionales JSONB DEFAULT '[]'::jsonb,
  procesos_clave JSONB DEFAULT '[]'::jsonb,
  integraciones_usuario JSONB DEFAULT '[]'::jsonb,
  plantilla_html_manual TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verticales_nombre ON public.verticales(nombre);
CREATE INDEX IF NOT EXISTS idx_verticales_activo ON public.verticales(activo);
```

5. Click **RUN** (botón azul arriba)
6. Espera a que termine (1-2 segundos)

### Paso 3: Verifica en Table Editor

1. Lado izquierdo → **Table Editor**
2. Aparecerá tabla `verticales` en la lista
3. ✅ Lista!

---

## 🚀 Próximos pasos (una vez creada la tabla)

```bash
# 1. Ejecutar migration
cd c:\GitHub\TheJTool
node api/_lib/migrations/migrate_verticales_to_supabase.js

# 2. Reiniciar servidores
npm run server
npm run dev

# 3. Probar
# Ve a http://localhost:5173
# Genera un documento
# Debe funcionar igual pero con datos de BD
```

---

## ✅ Verificación

- [ ] Tabla `verticales` creada en Supabase
- [ ] Migration script ejecutado (sin errores)
- [ ] Servidores reiniciados
- [ ] Documento generado y funciona

**Si tienes problemas en cualquier paso, avísame.**
