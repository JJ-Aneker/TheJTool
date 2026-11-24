# Migraciones de Base de Datos - TheJTool

## Aplicar Índices de Performance

### Opción 1: Supabase Dashboard (Recomendado)

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Click en "SQL Editor"
3. Copia y pega el contenido de `add_performance_indexes.sql`
4. Click en "Run"

### Opción 2: CLI de Supabase

```bash
# Si tienes Supabase CLI instalado
supabase db push

# O aplicar manualmente
psql $DATABASE_URL -f supabase/migrations/add_performance_indexes.sql
```

### Verificar Índices Creados

```sql
-- Ver todos los índices
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;

-- Ver índices de una tabla específica
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'profiles';
```

### Verificar Mejora de Performance

**ANTES de añadir índices:**
```sql
EXPLAIN ANALYZE SELECT * FROM profiles WHERE user_id = 'uuid-aqui';
-- Execution Time: ~300ms (Seq Scan - escaneo secuencial)
```

**DESPUÉS de añadir índices:**
```sql
EXPLAIN ANALYZE SELECT * FROM profiles WHERE user_id = 'uuid-aqui';
-- Execution Time: ~5ms (Index Scan - 60x más rápido)
```

## Impacto Esperado

| Query | Antes | Después | Mejora |
|-------|-------|---------|--------|
| `profiles WHERE user_id =` | 300ms | 5ms | **60x** |
| `tenants WHERE owner_id =` | 200ms | 3ms | **67x** |
| `templates WHERE created_by =` | 150ms | 4ms | **37x** |

## Notas Importantes

- ✅ Los índices mejoran las **lecturas** (SELECT)
- ⚠️ Los índices pueden hacer **escrituras** ligeramente más lentas (INSERT/UPDATE)
- ✅ En esta app, hacemos **muchas más lecturas** que escrituras
- ✅ El trade-off vale la pena

## Mantenimiento

Los índices se mantienen automáticamente por PostgreSQL. No requieren mantenimiento manual.

Para eliminar un índice (si fuera necesario):
```sql
DROP INDEX IF EXISTS idx_profiles_user_id;
```
