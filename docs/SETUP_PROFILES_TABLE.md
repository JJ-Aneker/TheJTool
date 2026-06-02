# Setup: Tabla `profiles` con Creación Automática de Perfiles

## Problema
Cuando un usuario intenta registrarse, la creación del perfil en la tabla `profiles` falla porque:
- No hay un trigger automático que cree el perfil cuando se registra un usuario
- O las políticas RLS no permiten el insert

## Solución
Vamos a crear un **trigger automático de Supabase** que crea automáticamente un perfil cada vez que se registra un nuevo usuario.

---

## Pasos de Instalación

### 1. Abre Supabase SQL Editor
1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. En el menú lateral, ve a **SQL Editor**
4. Haz clic en **New Query**

### 2. Copia el SQL
1. Abre el archivo: `docs/SUPABASE_PROFILES_TABLE_SETUP.sql`
2. Copia TODO el contenido SQL

### 3. Ejecuta el SQL en Supabase
1. Pega el SQL en el editor de Supabase
2. Haz clic en el botón **Run** (▶ verde)
3. Verifica que NO haya errores

### 4. Verifica la Instalación
En Supabase SQL Editor, ejecuta este comando:

```sql
-- Verifica que la tabla existe
SELECT * FROM profiles LIMIT 5;

-- Verifica que el trigger existe
SELECT * FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';

-- Verifica las políticas RLS
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

---

## Qué Hace Este Setup

### Tabla `profiles`
Almacena información del perfil del usuario con estos campos:
- `id` - Identificador único del perfil
- `user_id` - Referencia al usuario en `auth.users` (único)
- `email` - Email del usuario
- `name` - Nombre
- `surname` - Apellido
- `phone` - Teléfono
- `address` - Dirección
- `city` - Ciudad
- `province` - Provincia
- `postal` - Código postal
- `role` - Rol del usuario (`user`, `admin`, `manager`, `auditor`)
- `approved` - Si el usuario está aprobado por admin
- `created_at` - Fecha de creación
- `updated_at` - Fecha de actualización

### Trigger Automático `on_auth_user_created`
Cuando un usuario se registra en `auth.users`, automáticamente:
1. Se crea un registro en `profiles`
2. Se establece `approved = FALSE` (requiere aprobación del admin)
3. Se copia el email del usuario

### Políticas RLS
- **SELECT**: Usuarios pueden ver su propio perfil, admins ven todos
- **INSERT**: Se permite inserción (usada por el trigger)
- **UPDATE**: Usuarios pueden actualizar su perfil, admins pueden actualizar cualquiera
- **DELETE**: Solo admins pueden eliminar

---

## Probando el Registro

Después de ejecutar el SQL:

1. Inicia la aplicación: `npm run dev`
2. Ve a la página de Login
3. Haz clic en **Crear cuenta**
4. Completa el formulario con:
   - Nombre: `Juan`
   - Apellidos: `Pérez`
   - Teléfono: `+34612345678`
   - Email: `juan@example.com`
   - Contraseña: `MySecurePass123!`
5. Haz clic en **Crear cuenta**

### Verificación
El registro debería completarse sin errores. Para verificar:

**En la aplicación:**
- Ve a **User Manager** (si tienes acceso de admin)
- Deberías ver el nuevo usuario en la lista con `approved = false`

**En Supabase:**
```sql
SELECT * FROM profiles WHERE email = 'juan@example.com';
```

---

## Troubleshooting

### Error: "Error al crear perfil"
**Causa**: La tabla `profiles` no existe o las políticas RLS son restrictivas

**Solución**:
1. Verifica que ejecutaste TODO el SQL sin errores
2. En Supabase, ve a **Table Editor** → `profiles`
3. Verifica que la tabla existe y tiene las columnas correctas

### Error: "Permission denied"
**Causa**: Las políticas RLS están bloqueando el insert

**Solución**:
1. Abre la tabla `profiles` en Supabase
2. Ve a **RLS** → Policies
3. Verifica que existe la policy "Authenticated users can create profile"
4. Si no está, re-ejecuta el SQL completo

### El perfil se crea pero aparece vacío
**Causa**: El trigger crea el perfil básico, pero los campos (name, surname, phone) se actualizan luego

**Solución**:
- Esto es normal, los campos se llenan cuando completas el perfil
- En el código ya está manejado: `authService.signUp()` actualiza estos campos después

### El trigger no se ejecuta
**Causa**: El trigger existe pero la tabla `auth.users` cambió

**Solución**:
```sql
-- Verifica el trigger
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created' 
AND event_object_table = 'users';

-- Si no aparece, re-ejecuta esta parte del SQL:
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

---

## Código de la Aplicación (Ya Actualizado)

El archivo `src/services/authService.js` ya está actualizado para:
1. Confiar en el trigger automático
2. Usar `upsert` para mayor confiabilidad
3. Actualizar los campos opcionales (name, surname, phone) después del registro

No necesitas cambios adicionales en el código de la app.

---

## Siguiente Paso

Después de configurar esto:
1. Ejecuta `npm run dev` para iniciar la aplicación
2. Prueba el registro de un nuevo usuario
3. Verifica en **User Manager** que el usuario aparece con `approved = false`
4. Un admin debe aprobar el usuario para que pueda hacer login
