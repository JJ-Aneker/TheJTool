# Setup: eForms Database en Supabase

## 1. Crear la Tabla `eforms`

### Opción A: Usar el SQL Script (Recomendado)

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **SQL Editor**
4. Crea una **New Query**
5. Copia el contenido de `SUPABASE_EFORMS_TABLE.sql`
6. Ejecuta la query

### Opción B: Crear Manualmente en la UI

1. Ve a **Table Editor**
2. Click en **+ Create a new table**
3. Nombre: `eforms`
4. Agrega las siguientes columnas:

| Nombre | Tipo | Configuración |
|--------|------|---------------|
| id | uuid | Primary Key, Default: `gen_random_uuid()` |
| name | text | Not null |
| definition | text | Not null (contiene el XML) |
| description | text | Nullable |
| created_by | uuid | Foreign key to `auth.users(id)` |
| created_at | timestamptz | Default: `now()` |
| updated_at | timestamptz | Default: `now()` |

5. Activa **Row Level Security** en la pestaña **RLS**
6. Agrega las políticas (ver sección de RLS abajo)

## 2. Row Level Security (RLS)

Las políticas ya están incluidas en el SQL. Si las creas manualmente:

### Policy 1: Lectura (SELECT)
```sql
Auth UID = created_by
```

### Policy 2: Escritura (INSERT)
```sql
Auth UID = created_by
```

### Policy 3: Actualización (UPDATE)
```sql
Auth UID = created_by
```

### Policy 4: Eliminación (DELETE)
```sql
Auth UID = created_by
```

## 3. Verificar la Configuración

En Supabase:
1. **SQL Editor** → Run `SELECT * FROM eforms;`
2. Debe aparecer una tabla vacía
3. Ve a **RLS** → Confirma que tiene 4 políticas activas

## 4. Estructura de Datos

Cuando se guarda un eForm:

```json
{
  "id": "uuid-aqui",
  "name": "Solicitud de Documentos",
  "definition": "<?xml version=\"1.0\"....",
  "description": "Formulario para solicitar documentos",
  "created_by": "uuid-del-usuario",
  "created_at": "2026-04-30T12:00:00Z",
  "updated_at": "2026-04-30T12:00:00Z"
}
```

## 5. Usar en la Aplicación

El botón "💾 Guardar en Supabase" en EFormBuilder guardará automáticamente:
- El nombre del formulario
- El XML generado (definición)
- La descripción (opcional)
- El ID del usuario autenticado
- Timestamp de creación

## 6. Funcionalidades Futuras

Después de tener la tabla creada, podemos agregar:
- ✅ Listar eForms guardados del usuario
- ✅ Editar eForms existentes
- ✅ Duplicar formularios
- ✅ Compartir con otros usuarios
- ✅ Versionado de formularios
- ✅ Búsqueda y filtrado

## 7. Troubleshooting

### Error: "relation 'eforms' does not exist"
- Verifica que ejecutaste el SQL Script correctamente
- Comprueba en Table Editor que la tabla existe

### Error: "new row violates row-level security policy"
- Verifica que `created_by` tiene el UUID correcto del usuario
- Asegúrate de que las RLS policies están activas

### Error: "permission denied"
- Ve a **RLS** y confirma que las políticas están activas
- Verifica que el usuario está autenticado

## 8. Conexión desde EFormBuilder

El componente `EFormBuilder.jsx` ya tiene el código listo:

```javascript
const saveToSupabase = async () => {
  const { error } = await supabase.from('eforms').insert({
    name: formName,
    definition: xml,
    description: description,
    created_by: user?.id,
    created_at: new Date().toISOString()
  })
}
```

Solo necesitas ejecutar el SQL para crear la tabla.

---

**Próximo paso**: Ejecuta el SQL Script y verifica que la tabla se creó correctamente.
