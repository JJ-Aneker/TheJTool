// Endpoint de diagnóstico de variables de entorno
export default function handler(req, res) {
  const envVars = {
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? '✅ Configurada' : '❌ FALTA',
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ? '✅ Configurada' : '❌ FALTA',
    AWS_REGION: process.env.AWS_REGION || 'eu-south-2 (default)',
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ? '✅ Configurada' : '❌ FALTA',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configurada' : '❌ FALTA',
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY ? '✅ Configurada (alias)' : 'No configurada'
  }

  res.json({
    message: 'Diagnóstico de Variables de Entorno',
    environment: process.env.VERCEL_ENV || 'local',
    variables: envVars,
    missing: Object.entries(envVars)
      .filter(([key, value]) => value.includes('❌'))
      .map(([key]) => key)
  })
}
