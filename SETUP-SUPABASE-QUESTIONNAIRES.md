# Setup de Supabase para Módulo de Cuestionarios

## 🎯 Objetivo
Configurar Supabase (tablas + storage + auth) para poder usar los endpoints de cuestionarios.

---

## Paso 1: Ejecutar Migración de Base de Datos

### 📍 Ir a: Supabase Dashboard → SQL Editor
URL: https://vvehigbigvqkbgavnqkr.supabase.co/project/vvehigbigvqkbgavnqkr/sql

### 📋 Copiar y ejecutar este SQL:

```sql
-- ============================================================
-- Banco de conocimiento — Cuestionarios de seguridad IT
-- ============================================================
-- Ver fichero completo en: supabase/migrations/20260710_create_questionnaires_tables.sql
-- ⚠️ IMPORTANTE: Copiar TODO el contenido del fichero (264 líneas)
```

### ✅ Verificación:
Ejecutar esta query para verificar que las tablas se crearon:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'formularios',
    'formulario_preguntas_extraidas',
    'preguntas_normalizadas',
    'pregunta_variantes',
    'respuestas_oficiales'
  )
ORDER BY table_name;
```

**Output esperado**:
```
formulario_preguntas_extraidas
formularios
pregunta_variantes
preguntas_normalizadas
respuestas_oficiales
```

---

## Paso 2: Crear Bucket de Supabase Storage

### 📍 Ir a: Supabase Dashboard → Storage
URL: https://vvehigbigvqkbgavnqkr.supabase.co/project/vvehigbigvqkbgavnqkr/storage/buckets

### Opción A: Crear desde UI (recomendado)

1. Click en **"New bucket"**
2. **Bucket name**: `questionnaires`
3. **Public bucket**: ❌ Dejar desmarcado (privado)
4. Click en **"Create bucket"**
5. Una vez creado, ir a **Policies** del bucket
6. Click en **"New Policy"** → **"Create a policy from scratch"**

**Política 1: Allow authenticated uploads**
```sql
CREATE POLICY "Allow authenticated uploads to questionnaires"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'questionnaires');
```

**Política 2: Allow service role read**
```sql
CREATE POLICY "Allow service role read from questionnaires"
ON storage.objects FOR SELECT
TO service_role
USING (bucket_id = 'questionnaires');
```

**Política 3: Allow service role delete**
```sql
CREATE POLICY "Allow service role delete from questionnaires"
ON storage.objects FOR DELETE
TO service_role
USING (bucket_id = 'questionnaires');
```

### Opción B: Crear desde SQL Editor

```sql
-- Ver fichero: scripts/setup-questionnaires-bucket.sql
-- Copiar y ejecutar todo el contenido
```

### ✅ Verificación:
```sql
SELECT * FROM storage.buckets WHERE id = 'questionnaires';
```

**Output esperado**:
```
id: questionnaires
name: questionnaires
public: false
created_at: 2026-07-11 ...
```

---

## Paso 3: Crear Usuario de Servicio

### 📍 Ir a: Supabase Dashboard → Authentication → Users
URL: https://vvehigbigvqkbgavnqkr.supabase.co/project/vvehigbigvqkbgavnqkr/auth/users

### Crear nuevo usuario:

1. Click en **"Add user"** → **"Create new user"**
2. **Email**: `servicio.cuestionarios@buildingcenter.com`
3. **Password**: Generar uno seguro (guárdalo, lo necesitarás después)
   - Sugerencia: `CuestSeg2026!BuildCtr#IT`
4. **Auto Confirm User**: ✅ Marcar (para que no necesite verificar email)
5. Click en **"Create user"**

### ✅ Verificación:
El usuario debe aparecer en la lista de usuarios con:
- Email: `servicio.cuestionarios@buildingcenter.com`
- Email Confirmed: ✅
- Created: (timestamp actual)

---

## Paso 4: Obtener JWT del Usuario de Servicio

### Opción A: Desde PowerShell (recomendado)

Ejecutar este script en PowerShell:

```powershell
# Variables de configuración
$SUPABASE_URL = "https://vvehigbigvqkbgavnqkr.supabase.co"
$SUPABASE_ANON_KEY = $env:VITE_SUPABASE_ANON_KEY
$USER_EMAIL = "servicio.cuestionarios@buildingcenter.com"
$USER_PASSWORD = "CuestSeg2026!BuildCtr#IT"  # Cambiar por tu password

# Obtener token
$body = @{
    email = $USER_EMAIL
    password = $USER_PASSWORD
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "$SUPABASE_URL/auth/v1/token?grant_type=password" `
    -Method POST `
    -Headers @{
        "apikey" = $SUPABASE_ANON_KEY
        "Content-Type" = "application/json"
    } `
    -Body $body

# Mostrar token
$jwt = $response.access_token
Write-Host "`n✅ JWT Token obtenido exitosamente!`n"
Write-Host "Token (válido 1 hora):"
Write-Host $jwt
Write-Host "`n"

# Guardar en variables de entorno para los tests
$env:QUESTIONNAIRE_JWT = $jwt
$env:QUESTIONNAIRE_REFRESH = $response.refresh_token

Write-Host "✅ Variables de entorno configuradas:"
Write-Host "   `$env:QUESTIONNAIRE_JWT (access token)"
Write-Host "   `$env:QUESTIONNAIRE_REFRESH (refresh token)"
Write-Host "`n"

# Verificar el token
Write-Host "🔍 Verificando token..."
$userInfo = Invoke-RestMethod -Uri "$SUPABASE_URL/auth/v1/user" `
    -Method GET `
    -Headers @{
        "apikey" = $SUPABASE_ANON_KEY
        "Authorization" = "Bearer $jwt"
    }

Write-Host "✅ Token válido para usuario: $($userInfo.email)"
```

### Opción B: Desde curl (Linux/Mac/Git Bash)

```bash
export SUPABASE_URL="https://vvehigbigvqkbgavnqkr.supabase.co"
export SUPABASE_ANON_KEY="$VITE_SUPABASE_ANON_KEY"
export USER_EMAIL="servicio.cuestionarios@buildingcenter.com"
export USER_PASSWORD="CuestSeg2026!BuildCtr#IT"

curl -X POST "$SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$USER_EMAIL\",\"password\":\"$USER_PASSWORD\"}"
```

### ✅ Verificación:

Deberías recibir una respuesta JSON como:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "...",
  "user": {
    "id": "...",
    "email": "servicio.cuestionarios@buildingcenter.com",
    ...
  }
}
```

**Guardar el `access_token`** en un lugar seguro, lo necesitarás para los tests.

---

## ✅ Verificación Final del Setup Completo

Ejecutar este script de PowerShell para verificar que todo está configurado:

```powershell
Write-Host "`n🔍 Verificando setup de Supabase...`n"

# 1. Verificar tablas
Write-Host "1️⃣ Verificando tablas de BD..."
# (Ejecutar query de verificación en SQL Editor)

# 2. Verificar bucket
Write-Host "2️⃣ Verificando bucket de Storage..."
# (Ejecutar query de verificación en SQL Editor)

# 3. Verificar JWT
Write-Host "3️⃣ Verificando JWT..."
if ($env:QUESTIONNAIRE_JWT) {
    Write-Host "   ✅ JWT configurado en `$env:QUESTIONNAIRE_JWT"
} else {
    Write-Host "   ❌ JWT no configurado - ejecutar Paso 4"
}

# 4. Test de conexión al backend
Write-Host "`n4️⃣ Probando conexión al backend local..."
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3002/api/health" -UseBasicParsing
    Write-Host "   ✅ Backend respondiendo: $($health.status)"
} catch {
    Write-Host "   ❌ Backend no responde - verificar que esté arrancado"
}

Write-Host "`n✅ Setup completado!`n"
```

---

## 🚀 Siguiente Paso: Probar los Endpoints

Una vez completado el setup, puedes probar los endpoints con el fichero de prueba:

```powershell
# Ver guía completa de testing en:
# docs/05-therefore/therefore/TESTING-QUESTIONNAIRES.md
```

---

## 🐛 Troubleshooting

### Error: "Invalid API key"
**Causa**: `VITE_SUPABASE_ANON_KEY` no está definida o es incorrecta.  
**Solución**: Verificar en `.env` que está configurada correctamente.

### Error: "Invalid login credentials"
**Causa**: Email o password incorrectos.  
**Solución**: Verificar que el usuario fue creado correctamente en Auth → Users.

### Error: "relation 'formularios' does not exist"
**Causa**: La migración de BD no se ejecutó.  
**Solución**: Ejecutar **Paso 1** completo.

### Error: "Bucket not found"
**Causa**: El bucket 'questionnaires' no existe.  
**Solución**: Ejecutar **Paso 2** completo.

---

## 📝 Checklist de Setup

- [ ] Paso 1: Migración de BD ejecutada (5 tablas creadas)
- [ ] Paso 2: Bucket 'questionnaires' creado (con políticas)
- [ ] Paso 3: Usuario de servicio creado y confirmado
- [ ] Paso 4: JWT obtenido y guardado en `$env:QUESTIONNAIRE_JWT`
- [ ] Verificación: Todas las queries de verificación pasan ✅

**Tiempo estimado**: 10-15 minutos
