/* ============================================================
   CONFIGURACIÓN SUPABASE
============================================================ */

// Load from window.ENV injected by index.html (Vite-safe approach)
// window.ENV is set in index.html before this script loads
const SUPABASE_URL = window.ENV?.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = window.ENV?.SUPABASE_ANON_KEY || "";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("❌ Supabase credentials not configured. Check .env file or window.ENV injection.");
}

// Detectar URL base dinámicamente (funciona en localhost y Vercel)
const BASE_URL = (() => {
  if (typeof window !== "undefined") {
    const isDev = window.location.hostname === "localhost" ||
                  window.location.hostname === "127.0.0.1";
    const protocol = window.location.protocol;
    const host = window.location.host;
    return `${protocol}//${host}`;
  }
  return "";
})();

const LOGIN_PAGE = BASE_URL ? `${BASE_URL}/login.html` : "login.html";

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

  // Verificar que el usuario esté aprobado
  const profile = await getProfile();
  if (profile && profile.approved === false) {
    // Usuario no aprobado - mostrar página de espera
    window.location.href = BASE_URL ? `${BASE_URL}/pending-approval.html` : "pending-approval.html";
    return null;
  }

  return data.user;
}


/* ============================================================
   PERFIL DE USUARIO
============================================================ */

// Obtener perfil del usuario actual
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

// Obtener TODOS los perfiles (solo para admins)
async function getAllProfiles() {
  const { data: auth, error: authError } = await client.auth.getUser();
  if (authError || !auth.user) return [];

  // Cargar el perfil actual primero
  const userProfile = await getProfile();

  // Solo admins pueden ver todos
  if (userProfile.role !== "admin") {
    return [userProfile]; // Solo devolver el suyo
  }

  const { data, error } = await client
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("Error cargando perfiles:", error);
    return [];
  }

  return data || [];
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

async function signup(email, password, name = "", surname = "", phone = "") {
  const { data, error } = await client.auth.signUp({ email, password });

  if (error) throw new Error(error.message);

  // Crear perfil inicial con todos los datos
  if (data.user) {
    const { error: profileError } = await client
      .from("profiles")
      .insert([{
        user_id: data.user.id,
        email: email,
        name: name,
        surname: surname,
        phone: phone,
        role: "read",
        approved: false
      }]);

    if (profileError) throw new Error("Error creating profile: " + profileError.message);
  }

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