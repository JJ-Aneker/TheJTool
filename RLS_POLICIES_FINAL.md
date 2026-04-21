# RLS Policies - Configuración Final

## Estado: ✅ FUNCIONANDO

### Tabla: `profiles`

## Políticas Configuradas

### 1. **SELECT - Enable read access**
```sql
true
```
**Propósito**: Permitir lectura a todos (la app controla qué datos mostrar)

---

### 2. **UPDATE - Users can update own profile**
```sql
Using: auth.uid() = user_id
With check: auth.uid() = user_id
```
**Propósito**: Usuarios solo editan su propio perfil

---

### 3. **UPDATE - Admins can update all profiles**
```sql
Using: (auth.jwt() ->> 'role' = 'admin')
With check: (auth.jwt() ->> 'role' = 'admin')
```
**Propósito**: Admins editan cualquier perfil

---

## Cómo Funciona

### getProfile()
```javascript
// Obtiene el perfil del usuario ACTUAL
const profile = await getProfile();
// Solo devuelve su propio perfil
```

### getAllProfiles()
```javascript
// Obtiene TODOS los perfiles
const allProfiles = await getAllProfiles();
// Si es admin → devuelve todos
// Si es usuario normal → devuelve solo el suyo
```

## Lógica en la App

**En `app.js`:**
- Carga `window.__user` (auth data)
- Carga `window.__profile` (profile data)
- Muestra botón "Administración" solo si `role === 'admin'`

**En `admin.js`:**
- Usa `getAllProfiles()` para cargar usuarios
- Solo admins ven múltiples registros
- Usuarios normales ven solo el suyo

**En `user.js`:**
- Usa `getProfile()` para cargar el perfil
- Usuario edita solo su datos personales

## Seguridad

- ✅ SELECT: público (la app filtra)
- ✅ UPDATE: protegido por usuario_id
- ✅ UPDATE: protegido para admins
- ✅ No hay INSERT/DELETE (evita creación de perfiles no autorizados)

## Si Algo Falla

1. **Error 406**: Falta política de SELECT
2. **Error 500**: Sintaxis incorrecta en SQL
3. **Profile undefined**: RLS bloquea la lectura

Solución: Revisa que todas las 3 políticas estén presentes.
