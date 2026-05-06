/* ============================================================
   CONFIGURACIÓN SUPABASE
============================================================ */

const SUPABASE_URL = "https://osudezxnludhewdxeaks.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zdWRlenhubHVkaGV3ZHhlYWtzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0OTQxMTksImV4cCI6MjA4MDA3MDExOX0.RLkgHZ8FHaSzXt18Zag3QHmkBE1SBjfbZ0wSUmh3sxo";

/**
 * ✅ IMPORTANTE:
 * - Asegúrate de que el nombre del archivo de login coincida EXACTAMENTE
 *   con lo que pongas aquí (por mayúsculas/minúsculas).
 *   Ej: "login.html" vs "Login.html"
 */
const LOGIN_PAGE = "login.html";

const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


/* ============================================================
   AUTENTICACIÓN
============================================================ */

// LOGIN
async function login(email, password) {
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return data.user;
}

// LOGOUT
async function logout() {
  const { error } = await client.auth.signOut();
  if (error) throw new Error(error.message);
  window.location.href = LOGIN_PAGE;
}

// PROTEGER PÁGINA
async function requireAuth() {
  const { data, error } = await client.auth.getUser();

  // Si hubiese error (token inválido, etc.), tratamos como no autenticado
  if (error || !data.user) {
    window.location.href = LOGIN_PAGE;
    return null;
  }

  return data.user;
}


/* ============================================================
   PERFIL DE USUARIO
============================================================ */

// Obtener perfil
async function getProfile() {
  const { data: auth, error: authError } = await client.auth.getUser();
  if (authError || !auth.user) return {};

  const userId = auth.user.id;

  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    console.warn("Perfil no encontrado, devolviendo vacío");
    return {};
  }

  return data;
}

// Guardar perfil (crea o actualiza automáticamente)
async function updateProfile(values) {
  const { data: auth, error: authError } = await client.auth.getUser();
  if (authError || !auth.user) {
    throw new Error("Usuario no autenticado. No se puede actualizar el perfil.");
  }

  const userId = auth.user.id;

  const payload = {
    ...values,
    user_id: userId,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await client
    .from("profiles")
    .upsert(payload, { onConflict: "user_id" })
    .select()
    .single();

  if (error) throw new Error("No se pudo actualizar el perfil: " + error.message);

  return data;
}


/* ============================================================
   REGISTRO
============================================================ */

async function signup(email, password) {
  const { data, error } = await client.auth.signUp({ email, password });

  if (error) throw new Error(error.message);

  // signup NO toca el perfil aquí, solo devuelve el usuario auth
  return data.user;
}


/* ============================================================
   EXPORTAR A NAVEGADOR
============================================================ */

window.client = client;
window.login = login;
window.logout = logout;
window.requireAuth = requireAuth;
window.getProfile = getProfile;
window.updateProfile = updateProfile;
window.signup = signup;