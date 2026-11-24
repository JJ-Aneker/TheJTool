# Pasos para Setup de Supabase - Módulo Cuestionarios

## Estado Actual
- ✅ Backend arrancado en http://localhost:3002
- ✅ Frontend arrancado en http://localhost:5173
- ✅ Parser testeado y funcionando (15 preguntas extraídas)
- ⏳ Pendiente: Setup de Supabase para probar endpoints completos

---

## Paso 1: Ejecutar Migración de Base de Datos (SQL)

### Dónde:
Supabase Dashboard → SQL Editor  
**URL**: https://osudezxnludhewdxeaks.supabase.co/project/osudezxnludhewdxeaks/sql

### Qué hacer:
1. Click en "New query"
2. Copiar **TODO** el contenido del fichero:  
   `c:\Github\TheJTool\supabase\migrations\20260710_create_questionnaires_tables.sql`
3. Pegar en el editor SQL
4. Click en "Run" (o Ctrl+Enter)

### Qué deberías ver:
```
Success. No rows returned
```

### Verificación:
Ejecutar esta query en el mismo SQL Editor:

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

**Resultado esperado**: 5 filas (las 5 tablas)

---

## Paso 2: Crear Bucket de Supabase Storage

### Dónde:
Supabase Dashboard → Storage → Buckets  
**URL**: https://osudezxnludhewdxeaks.supabase.co/project/osudezxnludhewdxeaks/storage/buckets

### Qué hacer:
1. Click en "New bucket"
2. **Name**: `questionnaires`
3. **Public bucket**: ❌ NO marcar (debe ser privado)
4. Click en "Create bucket"

### Configurar Políticas (RLS):
Una vez creado el bucket, click en el bucket → "Policies" → "New Policy"

#### Política 1: Allow authenticated uploads
```sql
CREATE POLICY "Allow authenticated uploads to questionnaires"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'questionnaires');
```

#### Política 2: Allow service role read
```sql
CREATE POLICY "Allow service role read from questionnaires"
ON storage.objects FOR SELECT
TO service_role
USING (bucket_id = 'questionnaires');
```

#### Política 3: Allow service role delete
```sql
CREATE POLICY "Allow service role delete from questionnaires"
ON storage.objects FOR DELETE
TO service_role
USING (bucket_id = 'questionnaires');
```

### Verificación:
El bucket debe aparecer en la lista con:
- Name: `questionnaires`
- Public: `false`
- 3 policies activas

---

## Paso 3: Crear Usuario de Servicio

### Dónde:
Supabase Dashboard → Authentication → Users  
**URL**: https://osudezxnludhewdxeaks.supabase.co/project/osudezxnludhewdxeaks/auth/users

### Qué hacer:
1. Click en "Add user" → "Create new user"
2. **Email**: `servicio.cuestionarios@buildingcenter.com`
3. **Password**: `CuestSeg2026!BuildCtr#IT` (o el que prefieras)
4. **Auto Confirm User**: ✅ SÍ marcar (importante!)
5. Click en "Create user"

### Verificación:
El usuario debe aparecer en la lista con:
- Email: `servicio.cuestionarios@buildingcenter.com`
- Confirmed: ✅ Yes
- Provider: email

---

## Paso 4: Obtener JWT del Usuario

### Opción A: Script Automático (Recomendado)

Ejecutar en PowerShell desde `c:\Github\TheJTool`:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\scripts\get-jwt-token.ps1
```

**Output esperado**:
```
========================================
Obtener JWT Token de Supabase
========================================

Cargando configuracion desde .env...
[OK] Variables cargadas

Configuracion:
  URL: https://osudezxnludhewdxeaks.supabase.co
  Usuario: servicio.cuestionarios@buildingcenter.com

Obteniendo JWT...
[OK] JWT obtenido exitosamente!

Token (primeros 50 caracteres):
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJh...

[OK] Variables de entorno configuradas:
  - env:QUESTIONNAIRE_JWT
  - env:QUESTIONNAIRE_REFRESH

Verificando token...
[OK] Token valido para: servicio.cuestionarios@buildingcenter.com

[INFO] JWT guardado en: .\QUESTIONNAIRE_JWT.txt
(valido durante 1 hora)

========================================
JWT obtenido correctamente
========================================

Puedes usar el token con:
  $jwt = $env:QUESTIONNAIRE_JWT
```

El JWT estará disponible en:
- Variable de entorno: `$env:QUESTIONNAIRE_JWT`
- Fichero: `c:\Github\TheJTool\QUESTIONNAIRE_JWT.txt`

### Opción B: Manual con curl

```powershell
$body = @{
    email = "servicio.cuestionarios@buildingcenter.com"
    password = "CuestSeg2026!BuildCtr#IT"
} | ConvertTo-Json

$response = Invoke-RestMethod `
    -Uri "https://osudezxnludhewdxeaks.supabase.co/auth/v1/token?grant_type=password" `
    -Method POST `
    -Headers @{
        "apikey" = $env:VITE_SUPABASE_ANON_KEY
        "Content-Type" = "application/json"
    } `
    -Body $body

$jwt = $response.access_token
$env:QUESTIONNAIRE_JWT = $jwt
Write-Host "JWT: $jwt"
```

---

## ✅ Verificación Final

Ejecutar este script de PowerShell para verificar que todo está listo:

```powershell
Write-Host "`n=== Verificacion de Setup ==="

# 1. JWT configurado
if ($env:QUESTIONNAIRE_JWT) {
    Write-Host "[OK] JWT configurado" -ForegroundColor Green
} else {
    Write-Host "[ERROR] JWT no configurado" -ForegroundColor Red
}

# 2. Backend respondiendo
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3002/api/health"
    Write-Host "[OK] Backend: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Backend no responde" -ForegroundColor Red
}

# 3. Supabase accesible
try {
    $response = Invoke-RestMethod `
        -Uri "https://osudezxnludhewdxeaks.supabase.co/auth/v1/health"
    Write-Host "[OK] Supabase accesible" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Supabase no accesible" -ForegroundColor Red
}

Write-Host "`n=== Todo listo para probar endpoints! ===`n"
```

---

## 🚀 Siguiente Paso: Probar los Endpoints

Una vez completado el setup, puedes probar el flujo completo de upload + status.

Ver guía de testing completa en:  
**[docs/05-therefore/therefore/TESTING-QUESTIONNAIRES.md](docs/05-therefore/therefore/TESTING-QUESTIONNAIRES.md)**

---

## 🐛 Troubleshooting

### Error: "Invalid login credentials"
**Causa**: Usuario no existe o password incorrecto  
**Solución**: Verificar en Supabase Auth → Users que el usuario existe y está confirmado

### Error: "relation 'formularios' does not exist"
**Causa**: Migración no ejecutada  
**Solución**: Ejecutar Paso 1 completo

### Error: "Bucket not found"
**Causa**: Bucket no creado  
**Solución**: Ejecutar Paso 2 completo

### Error: Token expirado (después de 1 hora)
**Solución**: Volver a ejecutar `.\scripts\get-jwt-token.ps1`

---

## 📋 Checklist

- [ ] **Paso 1**: Migración SQL ejecutada (5 tablas + 1 vista)
- [ ] **Paso 2**: Bucket 'questionnaires' creado (con 3 políticas)
- [ ] **Paso 3**: Usuario de servicio creado y confirmado
- [ ] **Paso 4**: JWT obtenido y guardado en `$env:QUESTIONNAIRE_JWT`
- [ ] **Verificación**: Todos los checks pasan ✅

**Tiempo estimado**: 10-15 minutos
