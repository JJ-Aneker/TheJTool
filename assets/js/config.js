/**
 * Configuration loader for frontend environment variables
 * Works in development (with .env) and production (injected via build/server)
 */

// Load from import.meta.env (Vite) or window.ENV (manual injection)
const SUPABASE_URL = import.meta?.env?.VITE_SUPABASE_URL || window.ENV?.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta?.env?.VITE_SUPABASE_ANON_KEY || window.ENV?.SUPABASE_ANON_KEY || "";

// Validation
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    "❌ Supabase credentials not found. " +
    "Either use a build tool (Vite/Webpack), set window.ENV in index.html, " +
    "or define environment variables in .env"
  );
}

export { SUPABASE_URL, SUPABASE_ANON_KEY };
