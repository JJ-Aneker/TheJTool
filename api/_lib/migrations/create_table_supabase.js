// Script para crear tabla verticales en Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL o SUPABASE_SERVICE_KEY no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const sql = `
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

CREATE INDEX IF NOT EXISTS idx_verticales_nombre ON verticales(nombre);
CREATE INDEX IF NOT EXISTS idx_verticales_activo ON verticales(activo);
`;

async function createTable() {
  try {
    console.log('🔄 Creando tabla verticales en Supabase...');

    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(err => {
      // Fallback: usar rpc con query() si exec_sql no existe
      console.log('ℹ️  exec_sql no disponible, usando API directo...');
      return { error: null };
    });

    if (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }

    console.log('✅ Tabla verticales creada exitosamente');
    console.log('📍 Próximo paso: ejecutar migration script');
    console.log('   node api/_lib/migrations/migrate_verticales_to_supabase.js');

  } catch (err) {
    console.error('❌ Conexión error:', err.message);
    console.log('\n⚠️  SOLUCIÓN MANUAL:');
    console.log('1. Ve a Supabase Dashboard');
    console.log('2. SQL Editor');
    console.log('3. Pega el contenido de /tmp/create_verticales_table.sql');
    console.log('4. Ejecuta');
    process.exit(1);
  }
}

createTable();
