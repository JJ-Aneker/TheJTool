// api/_lib/knowledge/ratios.js
// Ratios de estimación validados por JJ Jiménez-Requena, Canon España

export const RATIOS = {
  tarifa_dia: 800,       // €/día
  horas_dia: 8,

  // Configuración Therefore™
  case_expediente_15_20_campos: 2,      // horas
  categoria_dependiente: 1.5,           // horas por categoría
  workflow_simple: 4,                   // horas (inicio→revisión→escalado→email)
  plantilla_word_excel: 2,              // horas por plantilla proporcionada por cliente

  // Actividades estándar
  analisis_funcional: 8,                // horas (1 día)
  content_connector_min: 8,            // horas
  content_connector_max: 12,           // horas
  pruebas_ajustes: 8,                  // horas (1 día)
  formacion_sesion: 4,                 // horas (1 sesión)

  // IVA
  iva: 21,                             // %
};

// Calcular importe desde horas
export function horasAImporte(horas) {
  const dias = horas / RATIOS.horas_dia;
  return dias * RATIOS.tarifa_dia;
}

// Calcular importe desde días
export function diasAImporte(dias) {
  return dias * RATIOS.tarifa_dia;
}

// Formatear importe en español
export function formatImporte(importe) {
  return importe.toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + ' €';
}
