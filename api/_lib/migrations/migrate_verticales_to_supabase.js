// Script para migrar verticales de hardcoded a Supabase
// Uso: node migrate_verticales_to_supabase.js

import { VERTICALES } from '../knowledge/verticales.js';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL o SUPABASE_SERVICE_KEY no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateVerticales() {
  console.log('🔄 Iniciando migración de verticales...\n');

  for (const [key, vertData] of Object.entries(VERTICALES)) {
    try {
      const record = {
        nombre: key,
        titulo: vertData.nombre || vertData.titulo,
        descripcion_intro: vertData.descripcion_intro || '',
        claves: vertData.claves || [],
        premisas_especificas: vertData.premisas_especificas || [],
        tablas_maestras: (vertData.tablas_maestras || []).map(t => ({
          nombre: t.nombre,
          descripcion: t.descripcion || t.nombre,
          campos: t.campos || t.tablas?.map(x => x.nombre) || []
        })),
        herramientas_recomendadas: vertData.herramientas_recomendadas || [],

        // Estimación / Oferta
        tarifa_diaria: 800,
        duracion_tipica_dias: vertData.duracion_tipica_dias || 10,
        margen_oferta_pct: 20,

        // EFDT: Arquitectura
        categorias_arquitectura: {
          Maestros: vertData.tablas_maestras ? vertData.tablas_maestras.map(t => t.nombre) : [],
          Documentacion: vertData.categorias_documentales ? vertData.categorias_documentales.filter(c => c.includes('Documentacion') || c.includes('Dato')) : [],
          Operacion: vertData.workflows ? vertData.workflows.map(w => w.nombre) : []
        },
        ejemplo_workflows: vertData.workflows || [],
        integraciones_comunes: vertData.integraciones_comunes || [],
        descripcion_implementacion: `Implementación de ${vertData.nombre} usando Therefore™. Incluye configuración de categorías documentales, tablas maestras y workflows de tramitación.`,

        // UAT
        casos_prueba_tipicos: [
          { caso: 'Crear y tramitar documento', descripcion: 'Validar flujo completo de creación, asignación y cierre' },
          { caso: 'Búsqueda y filtrado', descripcion: 'Verificar búsquedas por campos clave y filtrados' },
          { caso: 'Escalado automático', descripcion: 'Comprobar workflows de escalado por vencimiento' }
        ],
        criterios_aceptacion: [
          'Todos los workflows funcionan como se especifica',
          'Búsquedas devuelven resultados correctos',
          'No hay pérdida de datos en transiciones',
          'Auditoría registra todas las acciones',
          'Performance aceptable con volumen de datos esperado'
        ],

        // Manual HTML
        modulos_funcionales: [
          { nombre: 'Búsqueda y Consulta', desc: 'Cómo buscar documentos y acceder a ellos' },
          { nombre: 'Creación de Documentos', desc: 'Proceso para crear nuevos expedientes' },
          { nombre: 'Gestión de Workflows', desc: 'Cómo tramitar documentos en los flujos' },
          { nombre: 'Reportes', desc: 'Generación de informes y estadísticas' }
        ],
        procesos_clave: vertData.workflows || [],
        integraciones_usuario: vertData.integraciones_comunes || [],
        plantilla_html_manual: null, // Se genera bajo demanda

        activo: true
      };

      const { data, error } = await supabase
        .from('verticales')
        .upsert([record], { onConflict: 'nombre' });

      if (error) {
        console.error(`❌ ${key}: ${error.message}`);
      } else {
        console.log(`✅ ${key}: Migrado correctamente`);
      }
    } catch (err) {
      console.error(`❌ ${key}: ${err.message}`);
    }
  }

  console.log('\n🎉 Migración completada');
}

migrateVerticales();
