# Fix: Problema de Login - Usuarios Aprobados Siendo Rechazados

## Problema
Algunos usuarios que están aprobados en la tabla `profiles` (con `approved = true`) no pueden hacer login. Reciben el error:
> "Tu cuenta no ha sido aprobada aún. Contacta con un administrador."

## Causa
El método de login intenta consultar directamente la tabla `profiles` para verificar si el usuario está aprobado. Con las nuevas políticas RLS, esta consulta puede fallar con un error de permisos, lo que rechaza el login incluso si el usuario está aprobado.

## Solución
Usar una función RPC de Supabase con `SECURITY DEFINER` que pueda consultar la tabla sin estar sujeta a las políticas RLS.

---

## Pasos de Instalación

### 1. Ejecuta el SQL en Supabase
1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **SQL Editor** → **New Query**
4. Copia el contenido de `docs/SUPABASE_CHECK_USER_APPROVED_RPC.sql`
5. Haz clic en **Run**

### 2. Verifica que la función se creó
En SQL Editor, ejecuta:
```sql
SELECT * FROM pg_proc WHERE proname = 'is_user_approved';
```

Deberías ver una fila con la función `is_user_approved`.

### 3. El código ya está actualizado
El archivo `src/services/authService.js` ya usa esta función RPC automáticamente.

---

## Testing

Después de ejecutar el SQL, prueba:

1. **Login con un usuario aprobado**:
   - Ve a la página de Login
   - Usa credenciales de un usuario que está en `profiles` con `approved = true`
   - Debería entrar sin problemas

2. **Verifica en Supabase** que el usuario tiene `approved = true`:
   ```sql
   SELECT user_id, email, approved FROM profiles 
   WHERE email = 'tu-email@example.com';
   ```

3. **Si sigue fallando**, ejecuta la función manualmente:
   ```sql
   SELECT is_user_approved('uuid-del-usuario-aqui'::UUID);
   ```
   
   Debería retornar `true` si el usuario está aprobado.

---

## Qué Cambió

**Antes:**
```javascript
const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('approved')
  .eq('user_id', data.user.id)
  .single()

if (profileError || !profile?.approved) {  // ❌ Rechazaba si había error
  throw new Error('No aprobado')
}
```

**Ahora:**
```javascript
const { data: isApproved, error: rpcError } = await supabase
  .rpc('is_user_approved', { user_id: data.user.id })  // ✅ Usa RPC con permisos elevados

if (rpcError) {
  throw new Error('Error al verificar')
}

if (!isApproved) {  // ✅ Solo rechaza si realmente no está aprobado
  throw new Error('No aprobado')
}
```

---

## Resultado
- ✅ Usuarios aprobados pueden hacer login sin problemas
- ✅ La verificación de aprobación bypassa las políticas RLS
- ✅ Los errores de permisos no afectan el login
