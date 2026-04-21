# User Data Reference

## Accessing User Data in Your App

Después del login, los datos del usuario se cargan **globalmente** y están disponibles en cualquier vista:

### 1. Datos de Autenticación (Supabase Auth)
```javascript
window.__user
```

Propiedades:
```javascript
window.__user.id              // UUID del usuario
window.__user.email           // Email del usuario
window.__user.user_metadata   // Metadatos adicionales
window.__user.aud             // "authenticated"
window.__user.role            // "authenticated"
```

**Ejemplo:**
```javascript
console.log("Email:", window.__user.email);
console.log("User ID:", window.__user.id);
```

### 2. Datos del Perfil (tabla profiles)
```javascript
window.__profile
```

Propiedades:
```javascript
window.__profile.user_id      // Link a auth.user
window.__profile.name         // Nombre del usuario
window.__profile.surname      // Apellidos
window.__profile.email        // Email (puede ser null)
window.__profile.phone        // Teléfono
window.__profile.address      // Dirección
window.__profile.city         // Ciudad
window.__profile.province     // Provincia
window.__profile.postal       // Código postal
window.__profile.avatar_url   // URL del avatar
window.__profile.role         // "read", "write", "admin"
window.__profile.approved     // true/false
window.__profile.created_at   // Fecha de creación
window.__profile.updated_at   // Última actualización
```

**Ejemplo:**
```javascript
if (window.__profile) {
  console.log("Name:", window.__profile.name);
  console.log("Role:", window.__profile.role);
  console.log("Approved:", window.__profile.approved);
}
```

### 3. Verificar Autenticación
```javascript
// En cualquier vista, verificar si está autenticado
if (!window.__user) {
  console.log("No autenticado");
  window.location.href = "login.html";
}
```

### 4. Verificar Rol de Admin
```javascript
// En cualquier vista
if (window.__profile?.role === "admin") {
  console.log("Es administrador");
} else {
  console.log("No es administrador");
}
```

## Ejemplo en un View

```javascript
(function () {
  async function renderMyView() {
    // Acceder a datos del usuario
    const userName = window.__profile?.name || "Usuario";
    const userRole = window.__profile?.role;

    const html = `
      <section class="panel">
        <h2>Hola, ${userName}</h2>
        <p>Tu rol es: ${userRole}</p>
      </section>
    `;

    UI.replaceWithAnimation(html);
  }

  Router.registerView("myview", renderMyView);
})();
```

## Cuando se Cargan los Datos

1. Usuario hace **login** en `login.html`
2. Redirecciona a `index.html`
3. `app.js` en `DOMContentLoaded`:
   - Llama `requireAuth()` → obtiene `window.__user`
   - Llama `getProfile()` → obtiene `window.__profile`
4. Inicia la navegación y carga la vista "home"

**Los datos están disponibles INMEDIATAMENTE después del login.**

## Actualizar Datos del Usuario

Cuando el usuario edita su perfil (en user.js o admin.js):

```javascript
// Después de guardar en Supabase
Object.assign(window.__profile, {
  name: "Nuevo nombre",
  surname: "Nuevo apellido"
});
```

Esto mantiene sincronizados los datos globales con la base de datos.

## Debug

Abre la consola del navegador (F12) y verifica:

```javascript
console.log("User:", window.__user);
console.log("Profile:", window.__profile);
```

Si alguno es `undefined`, significa que no se cargó correctamente. Revisa:
1. ¿El login fue exitoso?
2. ¿Hay un registro en la tabla `profiles` para este usuario?
3. ¿Las políticas RLS permiten acceso?
