# Testing Login y Gestión de Usuarios

Este documento explica cómo probar el sistema de login y gestión de usuarios con Supabase en desarrollo local.

## 1. Verificar Configuración

### Paso 1: Confirmar credenciales de Supabase

Verifica que tengas `.env.local` en la raíz del proyecto con:

```
VITE_SUPABASE_URL=https://osudezxnludhewdxeaks.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Si falta, cópias desde `.env`:
```bash
cp .env .env.local
```

### Paso 2: Instalar dependencias

```bash
npm install
```

### Paso 3: Iniciar servidor de desarrollo

```bash
npm run dev
```

La app abrirá en `http://localhost:5173`

## 2. Testing de Login

### Flujo de Login básico

1. **Sin credenciales**: La app muestra la página de Login
2. **Campos inválidos**: Muestra validación de email/contraseña
3. **Credenciales incorrectas**: Mensaje de error desde Supabase

### Crear Usuario de Prueba en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Abre tu proyecto `osudezxnludhewdxeaks`
3. Ve a **Authentication** → **Users**
4. Haz clic en **Invite**
5. Completa:
   - **Email**: `test@buildingcenter.com`
   - **Password**: `Test123!@#`
6. Haz clic en **Send Invite**

### Probar Login

1. En la página de login, haz clic en **Iniciar Sesión**
2. Ingresa:
   - Email: `test@buildingcenter.com`
   - Contraseña: `Test123!@#`
3. Haz clic en **Iniciar Sesión**
4. Deberías ser redirigido a la página de Home

### Esperado después de login

- ✅ Página redirige a Home (/inicio)
- ✅ Email visible en el footer del sidebar
- ✅ Menu visible con todas las herramientas
- ✅ Botón "Salir" disponible

## 3. Testing de Registro

### Crear cuenta nueva (Signup)

1. En la página de login, haz clic en **Registrarse**
2. Completa el formulario:
   - Nombre: `Juan Test`
   - Email: `juan.test@buildingcenter.com`
   - Teléfono: `+34 912 345 678`
   - Contraseña: `Test123!@#` (mín 8 caracteres)
   - Confirmar: `Test123!@#`
3. Haz clic en **Registrarse**
4. Deberías ver mensaje de éxito
5. Vuelve a **Iniciar Sesión** con las nuevas credenciales

### Esperado después de signup

- ✅ Cuenta creada en Supabase
- ✅ Puede usar para login inmediatamente
- ✅ Redirección a home después del login

## 4. Testing de Gestión de Usuarios

### Acceder a Gestión de Usuarios

1. Login correctamente
2. Haz clic en **Gestión de Usuarios** en el menu lateral
3. Deberías ver:
   - Estadísticas (4 usuarios de mock)
   - Lista de usuarios con avatares
   - Botones de editar, cambiar contraseña, eliminar

### Crear usuario (Admin)

1. En Gestión de Usuarios, haz clic en **Crear Usuario**
2. Completa:
   - Nombre Completo: `Nuevo Usuario`
   - Email: `nuevo@buildingcenter.com`
   - Teléfono: `+34 912 345 679`
   - Rol: `Usuario`
   - Departamento: `IT`
   - Estado: `Activo`
3. Haz clic en **Guardar**
4. Deberías ver el nuevo usuario en la lista

### Ver Roles y Permisos

1. Haz clic en el tab **Roles y Permisos**
2. Deberías ver tabla con:
   - 4 roles: Administrador, Gerente, Usuario, Auditor
   - Permisos de cada rol

### Ver Auditoría

1. Haz clic en el tab **Auditoría**
2. Deberías ver historial de actividades mock con:
   - Login, crear documento, intentos fallidos, cambios de rol
   - Estados de éxito/error

## 5. Estructura de Carpetas

```
src/
├── config/
│   └── supabaseClient.js          # Cliente Supabase
├── context/
│   └── AuthContext.jsx            # Context de autenticación
├── hooks/
│   └── useAuth.js                 # Hook para auth
├── services/
│   ├── authService.js             # Sign up, sign in, etc.
│   └── userService.js             # CRUD de usuarios
├── components/
│   └── ProtectedRoute.jsx          # Route guard
└── views/
    ├── Login.jsx                  # Página de login
    └── UserManager.jsx            # Gestión de usuarios
```

## 6. Flujo de Autenticación

```
App.jsx
  ↓
BrowserRouter
  ↓
AuthProvider (main.jsx)
  → onAuthStateChange listener
  → getSession en mount
  ↓
AppContent
  → useAuth() para verificar isAuthenticated
  → Si false: muestra <Login />
  → Si true: muestra Layout + Routes
    ↓
    ProtectedRoute wrapper
      → Si no autenticado: redirige a /login
      → Si autenticado: muestra componente
```

## 7. Variables de Ambiente

| Variable | Valor | Donde |
|----------|-------|-------|
| `VITE_SUPABASE_URL` | URL del proyecto | .env.local |
| `VITE_SUPABASE_ANON_KEY` | Anon key | .env.local |
| `VITE_API_BASE_URL` | Backend URL | .env.local |
| `VITE_THEREFORE_BASE_URL` | Therefore™ API | .env.local |

## 8. Debugging

### Ver credenciales de Supabase

En la consola del navegador:
```javascript
import { supabase } from './config/supabaseClient'
console.log(supabase)
```

### Ver estado de autenticación

En cualquier componente:
```javascript
const { user, session, isAuthenticated } = useAuth()
console.log({ user, session, isAuthenticated })
```

### Ver logs de Supabase

1. Ve a Supabase Dashboard
2. **Logs** → **Functions** para ver eventos

## 9. Troubleshooting

### Error: "Missing Supabase credentials"

**Causa**: `.env.local` no existe o no tiene las variables

**Solución**:
```bash
cp .env .env.local
# O copia manualmente las variables de .env
```

### Error: "Invalid request header"

**Causa**: URL o Key inválida en Supabase

**Solución**:
1. Verifica las credenciales en Supabase Dashboard
2. Settings → API
3. Copia URL y Anon Key correctamente

### Login no funciona

**Causas posibles**:
1. Usuario no existe en Supabase (crear en Dashboard)
2. Contraseña incorrecta
3. Credenciales de Supabase incorrectas
4. Navegador con caché viejo

**Soluciones**:
- Crear usuario en Supabase Dashboard
- Limpiar caché: Ctrl+Shift+Delete
- Recargar servidor: Ctrl+C + `npm run dev`
- Verificar .env.local

### Login redirige a /login nuevamente

**Causa**: La sesión no persiste correctamente

**Solución**:
1. Verifica que AuthProvider está en main.jsx
2. Abre DevTools → Application → Cookies
3. Busca cookie de Supabase `sb-` 
4. Si no existe, el login falló silenciosamente
5. Mira la consola para errores

## 10. Próximos Pasos

- [ ] Conectar tabla `users` en Supabase para perfiles completos
- [ ] Implementar 2FA (Two-Factor Authentication)
- [ ] Agregar OAuth (Google, GitHub)
- [ ] Historial de auditoría a BD real
- [ ] Rate limiting en login
- [ ] Email verification
- [ ] Password recovery flow

## Documentación Relacionada

- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Configuración de base de datos
- [authService.js](./src/services/authService.js) - Métodos de autenticación
- [userService.js](./src/services/userService.js) - Gestión de usuarios
