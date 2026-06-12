# Debug Signup - Ver qué datos se están pasando

## 1. Verifica qué hay en raw_user_meta_data

Ejecuta en Supabase SQL Editor:

```sql
SELECT 
  id,
  email,
  raw_user_meta_data,
  raw_user_meta_data->>'name' as name,
  raw_user_meta_data->>'surname' as surname,
  raw_user_meta_data->>'phone' as phone,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;
```

Esto te mostrará:
- ✅ Si los datos están llegando a `raw_user_meta_data`
- ✅ Qué keys exactas se están usando
- ✅ Si el trigger puede leerlos

---

## 2. Verifica qué hay en profiles

```sql
SELECT 
  user_id,
  email,
  name,
  surname,
  phone,
  approved,
  created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 5;
```

---

## 3. Compara ambas tablas

```sql
SELECT 
  u.email,
  u.raw_user_meta_data->>'name' as meta_name,
  p.name as profile_name,
  u.raw_user_meta_data->>'surname' as meta_surname,
  p.surname as profile_surname,
  u.raw_user_meta_data->>'phone' as meta_phone,
  p.phone as profile_phone
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.user_id
ORDER BY u.created_at DESC
LIMIT 5;
```

---

## Posibles Resultados

### ✅ Caso 1: metadata está vacía
```
raw_user_meta_data: {}
```
**Problema:** authService no está pasando los datos correctamente
**Solución:** Revisar authService.js

### ✅ Caso 2: metadata tiene datos pero con keys diferentes
```
raw_user_meta_data: {"fullName": "Juan Pérez", "phone": "123456"}
```
**Problema:** El trigger busca 'name' y 'surname' pero vienen como 'fullName'
**Solución:** Actualizar el trigger para leer 'fullName' y dividirlo

### ✅ Caso 3: metadata correcta pero el trigger no se ejecutó
```
metadata: {"name": "Juan", "surname": "Pérez", "phone": "123"}
profile: name="", surname="", phone=""
```
**Problema:** El trigger no se disparó o falló
**Solución:** Recrear el trigger

