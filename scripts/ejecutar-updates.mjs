/**
 * Script para ejecutar las actualizaciones de verticales directamente en Supabase
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar .env
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🚀 Iniciando actualización de verticales...\n');

// ─────────────────────────────────────────────────────────────────────────────
// 1. EVOLUTIVO (METODOLOGÍA GENÉRICA)
// ─────────────────────────────────────────────────────────────────────────────
console.log('📝 Actualizando: evolutivo');
const { error: e1 } = await supabase
  .from('verticales')
  .update({
    herramientas_recomendadas: [
      'Therefore™ Solution Designer',
      'Therefore™ Workflow Designer',
      'SQL Server Management Studio',
      'Therefore™ Web Access',
      'Therefore™ Navigator',
      'Git (control de versiones de configuración)',
      'Visual Studio Code / SQL Server Data Tools'
    ],
    ejemplo_workflows: [
      {
        nombre: 'WF Genérico de Validación',
        descripcion: 'Flujo adaptable de validación/aprobación de cambios (el alcance concreto se define en Info Adicional)',
        tipo: 'automatico',
        etapas: ['Registro', 'Análisis técnico', 'Validación funcional', 'Aprobación', 'Implementación', 'Cierre']
      },
      {
        nombre: 'WF Control de Cambios',
        descripcion: 'Workflow de seguimiento de change requests sobre sistema existente',
        tipo: 'automatico',
        etapas: ['Nueva solicitud', 'Análisis impacto', 'Aprobación', 'Planificación', 'Ejecución', 'Testing', 'Aceptación UAT']
      }
    ],
    integraciones_comunes: [
      'API REST de Therefore™ (consultas/modificaciones)',
      'Backup automático pre-cambios',
      'Sistema de control de versiones (Git para configs)',
      'Herramientas de testing (Postman, scripts SQL)',
      'Notificaciones email (alertas de cambios)'
    ],
    procesos_clave: [
      'Análisis detallado del alcance del evolutivo (qué cambia exactamente)',
      'Evaluación de impacto sobre configuración y datos existentes',
      'Backup completo del entorno antes de intervenir',
      'Testing exhaustivo en entorno de pruebas (si existe)',
      'Validación con usuarios clave (UAT)',
      'Documentación técnica de cambios realizados',
      'Plan de rollback en caso de incidencias'
    ],
    integraciones_usuario: [
      'Según el dominio del proyecto base (se define en Info Adicional)',
      'Notificaciones automáticas por cambios',
      'Acceso web/navegador a funcionalidad modificada'
    ],
    updated_at: new Date().toISOString()
  })
  .eq('nombre', 'evolutivo');

if (e1) console.log(`   ❌ Error: ${e1.message}`);
else console.log('   ✅ Actualizado\n');

// ─────────────────────────────────────────────────────────────────────────────
// 2. FACTURAS
// ─────────────────────────────────────────────────────────────────────────────
console.log('📝 Actualizando: facturas');
const { error: e2 } = await supabase
  .from('verticales')
  .update({
    herramientas_recomendadas: [
      'Therefore™ Smart Capture (IA extracción)',
      'Therefore™ Workflow Designer',
      'Therefore™ Solution Designer',
      'SQL Server para tablas maestras',
      'Power BI / Tableau (reporting)',
      'API ERP del cliente (SAP/SAGE/Navision)'
    ],
    integraciones_comunes: [
      'ERP (exportación facturas aprobadas vía JSON/XML)',
      'Email Gateway (recepción facturas por correo)',
      'OCR/IA Smart Capture (extracción automática)',
      'Active Directory (validación aprobadores)',
      'Sistema de firmas electrónicas (validación)'
    ],
    procesos_clave: [
      'Recepción de factura (email/scan/web)',
      'Extracción automática de datos con Smart Capture',
      'Validación contra tablas maestras (proveedor, CECO)',
      'Enrutamiento workflow según importe/sociedad',
      'Aprobación jerárquica',
      'Generación fichero para ERP',
      'Archivo digital con trazabilidad completa'
    ],
    integraciones_usuario: [
      'Portal web de consulta de facturas',
      'App móvil para aprobaciones',
      'Dashboard financiero con KPIs',
      'Alertas por email en cada transición'
    ],
    updated_at: new Date().toISOString()
  })
  .eq('nombre', 'facturas');

if (e2) console.log(`   ❌ Error: ${e2.message}`);
else console.log('   ✅ Actualizado\n');

// ─────────────────────────────────────────────────────────────────────────────
// 3. GENERICO (COMPLETO DESDE CERO)
// ─────────────────────────────────────────────────────────────────────────────
console.log('📝 Actualizando: generico');
const { error: e3 } = await supabase
  .from('verticales')
  .update({
    titulo: 'Proyecto Therefore™ Genérico',
    descripcion_intro: 'Plantilla base para proyectos Therefore™ sin vertical específico. Incluye buenas prácticas, estructura básica de categorías y workflows estándar configurables según necesidades del cliente.',
    descripcion_implementacion: 'Implementación estándar de Therefore™ con configuración adaptable. Incluye categorías base, workflows básicos y estructura de tablas maestras genéricas.',
    claves: [
      'Arquitectura flexible adaptable a múltiples casos de uso',
      'Configuración base siguiendo mejores prácticas Therefore™',
      'Workflows estándar (solicitud, aprobación, archivo)',
      'Tablas maestras genéricas configurables',
      'Integración API REST estándar'
    ],
    premisas_especificas: [
      'El alcance se define en detalle durante fase de análisis',
      'Categorías y campos se ajustan según necesidades del cliente',
      'Workflows se personalizan post-implementación inicial'
    ],
    tablas_maestras: [
      'Estados de Documento',
      'Tipos de Documento',
      'Departamentos',
      'Usuarios y Roles'
    ],
    herramientas_recomendadas: [
      'Therefore™ Solution Designer',
      'Therefore™ Workflow Designer',
      'Therefore™ Navigator',
      'SQL Server Management Studio'
    ],
    ejemplo_workflows: [
      {
        nombre: 'WF Solicitud Genérica',
        descripcion: 'Flujo de solicitud-aprobación básico',
        tipo: 'automatico',
        etapas: ['Nueva solicitud', 'Revisión', 'Aprobación', 'Implementación', 'Cerrado']
      },
      {
        nombre: 'WF Archivo Simple',
        descripcion: 'Flujo de archivo documental básico',
        tipo: 'automatico',
        etapas: ['Recepción', 'Clasificación', 'Indexación', 'Archivo']
      }
    ],
    integraciones_comunes: [
      'API REST Therefore™',
      'Active Directory',
      'Email notifications',
      'Export/Import XML'
    ],
    casos_prueba_tipicos: [
      'Crear documento y asignar a usuario',
      'Transitar por workflow completo',
      'Búsqueda por campos indexados',
      'Export masivo de documentos'
    ],
    criterios_aceptacion: [
      'Categorías correctamente configuradas',
      'Workflows funcionales',
      'Búsquedas devuelven resultados',
      'Permisos por rol funcionan correctamente'
    ],
    modulos_funcionales: [
      'Gestión documental básica',
      'Workflows de tramitación',
      'Búsqueda y consulta',
      'Administración de usuarios'
    ],
    procesos_clave: [
      'Análisis de requisitos con cliente',
      'Diseño de arquitectura documental',
      'Configuración de categorías y campos',
      'Diseño de workflows',
      'Testing y UAT',
      'Formación usuarios'
    ],
    integraciones_usuario: [
      'Web Access para consulta',
      'Navigator para gestión',
      'Email notifications'
    ],
    updated_at: new Date().toISOString()
  })
  .eq('nombre', 'generico');

if (e3) console.log(`   ❌ Error: ${e3.message}`);
else console.log('   ✅ Actualizado\n');

// ─────────────────────────────────────────────────────────────────────────────
// 4. HR
// ─────────────────────────────────────────────────────────────────────────────
console.log('📝 Actualizando: hr');
const { error: e4 } = await supabase
  .from('verticales')
  .update({
    herramientas_recomendadas: [
      'Therefore™ Solution Designer',
      'Therefore™ Workflow Designer',
      'Therefore™ Smart Capture (IA)',
      'SQL Server Management Studio',
      'Power BI (HR analytics)',
      'API HRIS (Workday/SAP SuccessFactors)'
    ],
    integraciones_comunes: [
      'HRIS corporativo (importación empleados)',
      'Active Directory (sincronización usuarios)',
      'Portal del empleado (self-service)',
      'Email Gateway (notificaciones)',
      'Sistema de firma electrónica (contratos)',
      'Sistema de nómina (datos salariales)'
    ],
    procesos_clave: [
      'Onboarding de nuevo empleado',
      'Gestión de expediente personal',
      'Tramitación de ausencias/vacaciones',
      'Gestión de formación',
      'Evaluaciones de desempeño',
      'Proceso de baja (offboarding)',
      'Gestión documental legal (contratos, nóminas)'
    ],
    integraciones_usuario: [
      'Portal empleado (consulta expediente, solicitud vacaciones)',
      'App móvil RR.HH.',
      'Dashboard directivos con métricas HR',
      'Self-service para documentos personales'
    ],
    updated_at: new Date().toISOString()
  })
  .eq('nombre', 'hr');

if (e4) console.log(`   ❌ Error: ${e4.message}`);
else console.log('   ✅ Actualizado\n');

// ─────────────────────────────────────────────────────────────────────────────
// 5. NOTIFAPP
// ─────────────────────────────────────────────────────────────────────────────
console.log('📝 Actualizando: notifapp');
const { error: e5 } = await supabase
  .from('verticales')
  .update({
    herramientas_recomendadas: [
      'Therefore™ Solution Designer',
      'Therefore™ Workflow Designer',
      'IVNEOS Plataforma (recepción notificaciones)',
      'Therefore™ Smart Capture (extracción)',
      'SQL Server Management Studio',
      'API cl@ve / Carpeta Ciudadana',
      'Certificado digital corporativo'
    ],
    integraciones_comunes: [
      'IVNEOS (recepción automática notificaciones)',
      'Cl@ve / Carpeta Ciudadana',
      'Plataformas notificación autonómicas',
      'Sistema ERP (asociación expedientes)',
      'Email Gateway (alertas equipo)',
      'Sistema firma electrónica (alegaciones)',
      'Portal web (consulta notificaciones)'
    ],
    procesos_clave: [
      'Recepción automática notificación desde AAPP',
      'Extracción datos (órgano, fecha, plazo)',
      'Clasificación por tipo de notificación',
      'Asignación automática a responsable',
      'Workflow tramitación (alegación/aceptación)',
      'Control de plazos con alertas',
      'Archivo digital con trazabilidad completa'
    ],
    integraciones_usuario: [
      'Portal consulta notificaciones',
      'Dashboard con alertas de plazos',
      'App móvil para notificaciones urgentes',
      'Email diario resumen pendientes'
    ],
    updated_at: new Date().toISOString()
  })
  .eq('nombre', 'notifapp');

if (e5) console.log(`   ❌ Error: ${e5.message}`);
else console.log('   ✅ Actualizado\n');

// ─────────────────────────────────────────────────────────────────────────────
// 6. SAGE
// ─────────────────────────────────────────────────────────────────────────────
console.log('📝 Actualizando: sage');
const { error: e6 } = await supabase
  .from('verticales')
  .update({
    herramientas_recomendadas: [
      'Therefore™ Solution Designer',
      'Therefore™ Workflow Designer',
      'SAGE X3 Web Services API',
      'SQL Server Management Studio',
      'Postman (testing API)',
      'Visual Studio (desarrollo custom)',
      'Therefore™ .NET SDK'
    ],
    integraciones_comunes: [
      'SAGE X3 Web Services (bidireccional)',
      'SAGE X3 Base de datos (consultas)',
      'Therefore™ API REST',
      'Active Directory (usuarios)',
      'Email Gateway (notificaciones)',
      'SFTP (intercambio ficheros)'
    ],
    procesos_clave: [
      'Sincronización maestros (clientes, proveedores, artículos)',
      'Asociación documentos a entidades SAGE',
      'Workflow aprobación documentos con impacto contable',
      'Exportación documentos aprobados a SAGE',
      'Trazabilidad bidireccional (SAGE ↔ Therefore)',
      'Gestión documental de facturas, albaranes, pedidos'
    ],
    integraciones_usuario: [
      'Widget Therefore™ dentro de SAGE X3',
      'Consulta documentos desde SAGE',
      'Upload directo desde pantallas SAGE',
      'Dashboard unificado SAGE + Therefore'
    ],
    updated_at: new Date().toISOString()
  })
  .eq('nombre', 'sage');

if (e6) console.log(`   ❌ Error: ${e6.message}`);
else console.log('   ✅ Actualizado\n');

// ─────────────────────────────────────────────────────────────────────────────
// VERIFICACIÓN FINAL
// ─────────────────────────────────────────────────────────────────────────────
console.log('📊 Verificando resultados...\n');
const { data: verificacion, error: errVer } = await supabase
  .from('verticales')
  .select('nombre, titulo, herramientas_recomendadas, ejemplo_workflows, integraciones_comunes, procesos_clave')
  .order('nombre');

if (errVer) {
  console.log(`❌ Error en verificación: ${errVer.message}`);
} else {
  console.log('┌─────────────┬───────────────┬──────────┬────────────────┬────────────┐');
  console.log('│ Vertical    │ Herramientas  │ Workflows│ Integraciones  │ Procesos   │');
  console.log('├─────────────┼───────────────┼──────────┼────────────────┼────────────┤');
  verificacion.forEach(v => {
    const nombre = (v.nombre || '').padEnd(11);
    const herr = String(v.herramientas_recomendadas?.length || 0).padStart(13);
    const wf = String(v.ejemplo_workflows?.length || 0).padStart(8);
    const int = String(v.integraciones_comunes?.length || 0).padStart(14);
    const proc = String(v.procesos_clave?.length || 0).padStart(10);
    console.log(`│ ${nombre} │${herr} │${wf} │${int} │${proc} │`);
  });
  console.log('└─────────────┴───────────────┴──────────┴────────────────┴────────────┘');
}

console.log('\n✅ Proceso completado!');
