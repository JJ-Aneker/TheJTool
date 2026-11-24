# FASE 2 — Setup de Verticales en Supabase

## 📋 Instrucciones de Configuración

### Paso 1: Crear tabla en Supabase

1. Accede a Supabase dashboard
2. Abre SQL Editor
3. Copia y ejecuta el SQL en `api/_lib/migrations/verticales_schema.sql`:

```sql
CREATE TABLE IF NOT EXISTS verticales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT UNIQUE NOT NULL,
  titulo TEXT NOT NULL,
  descripcion_intro TEXT,
  
  claves JSONB DEFAULT '[]',
  premisas_especificas JSONB DEFAULT '[]',
  tablas_maestras JSONB DEFAULT '[]',
  herramientas_recomendadas JSONB DEFAULT '[]',
  
  tarifa_diaria NUMERIC DEFAULT 800,
  duracion_tipica_dias NUMERIC DEFAULT 10,
  margen_oferta_pct NUMERIC DEFAULT 20,
  
  categorias_arquitectura JSONB DEFAULT '{"Maestros":[],"Documentacion":[],"Operacion":[]}',
  ejemplo_workflows JSONB DEFAULT '[]',
  integraciones_comunes JSONB DEFAULT '[]',
  descripcion_implementacion TEXT,
  
  casos_prueba_tipicos JSONB DEFAULT '[]',
  criterios_aceptacion JSONB DEFAULT '[]',
  
  modulos_funcionales JSONB DEFAULT '[]',
  procesos_clave JSONB DEFAULT '[]',
  integraciones_usuario JSONB DEFAULT '[]',
  plantilla_html_manual TEXT,
  
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_verticales_nombre ON verticales(nombre);
CREATE INDEX idx_verticales_activo ON verticales(activo);
```

### Paso 2: Ejecutar migración

```bash
cd c:\GitHub\TheJTool
node api/_lib/migrations/migrate_verticales_to_supabase.js
```

Esto migra todos los datos de `verticales.js` a la tabla de Supabase.

### Paso 3: Verificar en Supabase

En el dashboard de Supabase:
- Table Editor
- Selecciona tabla `verticales`
- Verifica que aparecen: notifapp, hr, facturas, etc.

---

## 📁 Archivos Nuevos

| Archivo | Propósito |
|---------|-----------|
| `api/_lib/database/verticalesDb.js` | Acceso a tabla verticales |
| `api/_lib/migrations/migrate_verticales_to_supabase.js` | Script de migración |
| `docs/FASE2_VERTICALES_SETUP.md` | Este archivo (instrucciones) |

---

## 🔄 Cambios en Código

### analyze.js
- Cambiar importación de VERTICALES hardcodeado
- Usar `VerticalesDb.buildVerticalObject(vertical)` en lugar de `VERTICALES[verticalKey]`
- Mantener fallback a verticales.js si BD no disponible

### build-docx.js
- Cambiar importación de VERTICALES
- Usar datos de BD si disponible

---

## ✅ Rollout

1. Crear tabla y ejecutar migración
2. Actualizar analyze.js (próximo paso)
3. Actualizar build-docx.js
4. Probar con datos de BD
5. Fallback a hardcoded si BD falla

---

## 🗑️ Cleanup Futuro

Una vez confirmado que todo funciona con BD:
- Deprecar `verticales.js` (mantener como fallback)
- Remover imports de VERTICALES del código principal
- Documentar tabla como source of truth
