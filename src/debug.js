// Debug file para verificar conexión a Supabase
// Ejecuta esto en la consola del navegador (F12)

import { supabase } from './config/supabaseClient'

export async function debugSupabase() {
  console.log('🔍 Verificando conexión a Supabase...\n')

  // 1. Verificar credenciales
  console.log('1️⃣ Credenciales de Supabase:')
  console.log('URL:', import.meta.env.VITE_SUPABASE_URL)
  console.log('Key está configurada:', !!import.meta.env.VITE_SUPABASE_ANON_KEY)
  console.log('Cliente Supabase:', supabase)

  // 2. Verificar sesión actual
  console.log('\n2️⃣ Sesión actual:')
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
      console.error('❌ Error al obtener sesión:', error.message)
    } else {
      console.log('✅ Sesión actual:', session)
    }
  } catch (err) {
    console.error('❌ Error:', err.message)
  }

  // 3. Verificar usuario actual
  console.log('\n3️⃣ Usuario actual:')
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      console.error('❌ Error al obtener usuario:', error.message)
    } else {
      console.log('✅ Usuario actual:', user)
    }
  } catch (err) {
    console.error('❌ Error:', err.message)
  }

  // 4. Verificar tabla 'profiles'
  console.log('\n4️⃣ Verificar tabla de perfiles:')
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(5)

    if (error) {
      console.error('❌ Error al leer tabla profiles:', error.message)
      console.log('   Posible causa: La tabla "profiles" no existe o no hay permisos RLS')
    } else {
      console.log('✅ Tabla profiles accesible. Registros:', data.length)
      console.log('   Datos:', data)
    }
  } catch (err) {
    console.error('❌ Error:', err.message)
  }

  // 5. Intentar login de prueba
  console.log('\n5️⃣ Intentar login:')
  console.log('   Abre la consola y ejecuta:')
  console.log('   await testLogin("tu-email@example.com", "tu-contraseña")')
}

export async function testLogin(email, password) {
  console.log(`\n🔑 Intentando login con: ${email}`)

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      console.error('❌ Error de login:', error.message)
      console.log('   Posibles causas:')
      console.log('   - Contraseña incorrecta')
      console.log('   - Usuario no existe')
      console.log('   - Usuario no ha confirmado email')
      return { success: false, error: error.message }
    } else {
      console.log('✅ Login exitoso!')
      console.log('   Usuario:', data.user)
      console.log('   Session:', data.session)
      return { success: true, user: data.user, session: data.session }
    }
  } catch (err) {
    console.error('❌ Exception:', err.message)
    return { success: false, error: err.message }
  }
}

// Exportar para uso global
window.debugSupabase = debugSupabase
window.testLogin = testLogin
window.supabase = supabase

console.log('✅ Debug tools cargadas. Ejecuta en consola:')
console.log('   debugSupabase()  - Verificar conexión')
console.log('   testLogin("email", "pass") - Probar login')
console.log('   supabase.auth.signOut() - Cerrar sesión')
