# Configuración de Variables de Entorno Supabase

## ⚠️ Seguridad: Claves Supabase ya no están en el código

Las claves de Supabase ya no están hardcodeadas. Ahora se cargan desde variables de entorno de forma segura.

## Setup en desarrollo

### 1. Copiar el archivo de plantilla
```bash
cp .env.example .env
```

### 2. Completar los valores
Edita `.env` y actualiza con tus credenciales:
```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anonima-aqui
```

### 3. Usar Vite (recomendado)
Si desarrollas con Vite:
```bash
npm install
npm run dev
```

Vite cargará automáticamente `.env` e inyectará las variables via `import.meta.env.*`

## Setup en producción

### Opción 1: Inyección por HTML (Hosting estático/Serverless) ⭐ ACTUAL
En cada archivo HTML, antes de cargar `supabase.js`, inyecta las variables:

```html
<!-- En la sección <head> o antes de supabase.js -->
<script>
  window.ENV = {
    SUPABASE_URL: "https://tu-proyecto.supabase.co",
    SUPABASE_ANON_KEY: "tu-clave-anonima-aqui"
  };
</script>

<!-- Luego carga supabase.js -->
<script src="assets/js/supabase.js"></script>
```

> **Nota**: Esta es la configuración actual del proyecto. Todos los archivos HTML ya incluyen esta inyección.

### Opción 2: Build con Vite
```bash
npm install -D vite
npm run build
```

Esto minifica y optimiza todo, inyectando automáticamente los valores de `.env`.

### Opción 3: Server-side (PHP, Node.js, etc.)
Sirve los archivos HTML desde un servidor que inyecte dinámicamente:

**Ejemplo PHP:**
```php
<?php
$supabaseUrl = getenv('SUPABASE_URL');
$supabaseKey = getenv('SUPABASE_ANON_KEY');
?>
<script>
  window.ENV = {
    SUPABASE_URL: "<?php echo htmlspecialchars($supabaseUrl); ?>",
    SUPABASE_ANON_KEY: "<?php echo htmlspecialchars($supabaseKey); ?>"
  };
</script>
```

**Ejemplo Node.js/Express:**
```javascript
app.get('/index.html', (req, res) => {
  const html = fs.readFileSync('index.html', 'utf8');
  const html_with_env = html.replace(
    '<!-- ENV_PLACEHOLDER -->',
    `<script>window.ENV={SUPABASE_URL:"${process.env.SUPABASE_URL}",SUPABASE_ANON_KEY:"${process.env.SUPABASE_ANON_KEY}"}</script>`
  );
  res.send(html_with_env);
});
```

## Variables disponibles

| Variable | Tipo | Descripción |
|----------|------|-------------|
| `VITE_SUPABASE_URL` | string | URL del proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | string | Clave anónima para acceso desde frontend |

## 🔒 Checklist de Seguridad

✅ **Implementado:**
- `.env` está en `.gitignore` (nunca se commitea)
- Las claves no están hardcodeadas en el código fuente
- `.env.example` proporciona documentación
- Cada HTML inyecta `window.ENV` de forma segura

⚠️ **A hacer en producción:**
- **Nunca** commitar `.env` o cualquier archivo con claves
- En producción, usar un gestor de secretos (Vault, AWS Secrets Manager, etc.)
- La `ANON_KEY` es pública (normal en frontend), pero configura RLS en Supabase
- **Nunca** exponer la `SERVICE_ROLE_KEY` (clave admin) en frontend
- Usar HTTPS siempre en producción

## Archivos afectados

### Archivos que inyectan `window.ENV`:
- `login.html`
- `signup.html`
- `reset.html`
- `forgot.html`
- `verify.html`
- `index.html`
- `therefore_builder.html`

### Archivo que carga desde `window.ENV`:
- `assets/js/supabase.js` - Lee `window.ENV.SUPABASE_URL` y `window.ENV.SUPABASE_ANON_KEY`

## Verificación

Puedes verificar que las variables están cargadas correctamente:

```javascript
// En la consola del navegador:
console.log("URL:", window.ENV.SUPABASE_URL);
console.log("Key loaded:", !!window.ENV.SUPABASE_ANON_KEY);
```

Si ves los valores, todo está funcionando correctamente. ✅

## Troubleshooting

**Error: "Supabase credentials not configured"**
- Verifica que el script de `window.ENV` esté **antes** de cargar `supabase.js`
- Asegúrate de que los valores de la URL y clave sean correctos

**Error: "Client is undefined"**
- El cliente Supabase no se inicializó correctamente
- Verifica el orden de los scripts: primero Supabase library, luego supabase.js

**Las variables no se cargan en producción**
- Si usas Vite: ejecuta `npm run build` y sirve desde `dist/`
- Si usas inyección HTML: asegúrate que el servidor esté inyectando `window.ENV`
- Verifica que las variables de entorno existan en el servidor de producción

## Migración desde código hardcodeado

Si encontraras más claves hardcodeadas en el futuro:

1. **Buscar:** `grep -r "supabase.co" --include="*.js" --include="*.html"`
2. **Reemplazar:** Usar `window.ENV.SUPABASE_URL` en lugar del hardcode
3. **Inyectar:** Asegurarse que el archivo HTML inyecte `window.ENV` primero
4. **Probar:** Verifiquer en la consola del navegador que todo esté disponible

---

**Preguntas?** Revisa la documentación en `docs/therefore/` o contacta al equipo de desarrollo.
