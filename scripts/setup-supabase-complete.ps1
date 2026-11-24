# ============================================================
# Script automatizado de setup de Supabase para módulo de cuestionarios
# ============================================================
# Uso: .\scripts\setup-supabase-complete.ps1
# ============================================================

param(
    [string]$UserPassword = "CuestSeg2026!BuildCtr#IT"
)

Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Setup Automatizado de Supabase - Módulo Cuestionarios   ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Cargar variables de entorno desde .env
Write-Host "📋 Cargando configuración desde .env..." -ForegroundColor Yellow

if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            Set-Item -Path "env:$name" -Value $value
        }
    }
    Write-Host "   ✅ Variables cargadas`n" -ForegroundColor Green
} else {
    Write-Host "   ❌ Fichero .env no encontrado" -ForegroundColor Red
    exit 1
}

$SUPABASE_URL = $env:VITE_SUPABASE_URL
$SUPABASE_ANON_KEY = $env:VITE_SUPABASE_ANON_KEY
$USER_EMAIL = "servicio.cuestionarios@buildingcenter.com"

Write-Host "🔧 Configuración:" -ForegroundColor Cyan
Write-Host "   URL: $SUPABASE_URL"
Write-Host "   Usuario: $USER_EMAIL"
Write-Host "`n"

# ============================================================
# PASO 1: Verificar que las tablas NO existan ya
# ============================================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "PASO 1: Preparando migración de base de datos" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

Write-Host "⚠️  IMPORTANTE: Debes ejecutar manualmente la migración SQL`n" -ForegroundColor Yellow
Write-Host "   1. Ir a: $SUPABASE_URL/project/*/sql" -ForegroundColor White
Write-Host "   2. Copiar TODO el contenido de:" -ForegroundColor White
Write-Host "      supabase/migrations/20260710_create_questionnaires_tables.sql" -ForegroundColor White
Write-Host "   3. Pegar y ejecutar en SQL Editor de Supabase" -ForegroundColor White
Write-Host "`n   [INFO] El fichero tiene 220 lineas (5 tablas + 1 vista + trigger)`n" -ForegroundColor Gray

$response = Read-Host "   ¿Has ejecutado ya la migración SQL? (s/n)"
if ($response -ne "s") {
    Write-Host "`n   ⏸️  Pausado. Ejecuta la migración y vuelve a lanzar el script.`n" -ForegroundColor Yellow
    exit 0
}

Write-Host "   ✅ Migración confirmada por el usuario`n" -ForegroundColor Green

# ============================================================
# PASO 2: Crear usuario de servicio
# ============================================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "PASO 2: Creando usuario de servicio" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

Write-Host "⚠️  IMPORTANTE: Debes crear manualmente el usuario en Supabase`n" -ForegroundColor Yellow
Write-Host "   1. Ir a: $SUPABASE_URL/project/*/auth/users" -ForegroundColor White
Write-Host "   2. Click en 'Add user' → 'Create new user'" -ForegroundColor White
Write-Host "   3. Email: $USER_EMAIL" -ForegroundColor White
Write-Host "   4. Password: $UserPassword" -ForegroundColor White
Write-Host "   5. Auto Confirm User: ✅ Marcar" -ForegroundColor White
Write-Host "   6. Click en 'Create user'`n" -ForegroundColor White

$response = Read-Host "   ¿Has creado ya el usuario? (s/n)"
if ($response -ne "s") {
    Write-Host "`n   ⏸️  Pausado. Crea el usuario y vuelve a lanzar el script.`n" -ForegroundColor Yellow
    exit 0
}

Write-Host "   ✅ Usuario confirmado por el usuario`n" -ForegroundColor Green

# ============================================================
# PASO 3: Obtener JWT del usuario de servicio
# ============================================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "PASO 3: Obteniendo JWT del usuario de servicio" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

try {
    $body = @{
        email = $USER_EMAIL
        password = $UserPassword
    } | ConvertTo-Json

    $authResponse = Invoke-RestMethod -Uri "$SUPABASE_URL/auth/v1/token?grant_type=password" `
        -Method POST `
        -Headers @{
            "apikey" = $SUPABASE_ANON_KEY
            "Content-Type" = "application/json"
        } `
        -Body $body

    $jwt = $authResponse.access_token
    $refresh = $authResponse.refresh_token

    Write-Host "   ✅ JWT obtenido exitosamente!" -ForegroundColor Green
    Write-Host "`n   Token (primeros 50 caracteres):" -ForegroundColor Gray
    Write-Host "   $($jwt.Substring(0, 50))...`n" -ForegroundColor Gray

    # Guardar en variables de entorno
    $env:QUESTIONNAIRE_JWT = $jwt
    $env:QUESTIONNAIRE_REFRESH = $refresh

    Write-Host "   ✅ Variables de entorno configuradas:" -ForegroundColor Green
    Write-Host "      `$env:QUESTIONNAIRE_JWT" -ForegroundColor White
    Write-Host "      `$env:QUESTIONNAIRE_REFRESH`n" -ForegroundColor White

    # Verificar el token
    Write-Host "   🔍 Verificando token..." -ForegroundColor Yellow
    $userInfo = Invoke-RestMethod -Uri "$SUPABASE_URL/auth/v1/user" `
        -Method GET `
        -Headers @{
            "apikey" = $SUPABASE_ANON_KEY
            "Authorization" = "Bearer $jwt"
        }

    Write-Host "   ✅ Token válido para: $($userInfo.email)`n" -ForegroundColor Green

} catch {
    Write-Host "   ❌ Error obteniendo JWT:" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)`n" -ForegroundColor Red
    Write-Host "   Verifica que el email y password sean correctos.`n" -ForegroundColor Yellow
    exit 1
}

# ============================================================
# PASO 4: Crear bucket de Storage
# ============================================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "PASO 4: Configurando Supabase Storage" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

Write-Host "⚠️  IMPORTANTE: Debes crear manualmente el bucket 'questionnaires'`n" -ForegroundColor Yellow
Write-Host "   1. Ir a: $SUPABASE_URL/project/*/storage/buckets" -ForegroundColor White
Write-Host "   2. Click en 'New bucket'" -ForegroundColor White
Write-Host "   3. Bucket name: questionnaires" -ForegroundColor White
Write-Host "   4. Public bucket: ❌ Dejar desmarcado (privado)" -ForegroundColor White
Write-Host "   5. Click en 'Create bucket'" -ForegroundColor White
Write-Host "   6. Ir a Policies del bucket y ejecutar el SQL de:" -ForegroundColor White
Write-Host "      scripts/setup-questionnaires-bucket.sql`n" -ForegroundColor White

$response = Read-Host "   ¿Has creado el bucket y las políticas? (s/n)"
if ($response -ne "s") {
    Write-Host "`n   ⏸️  Pausado. Crea el bucket y vuelve a lanzar el script.`n" -ForegroundColor Yellow
    exit 0
}

Write-Host "   ✅ Bucket confirmado por el usuario`n" -ForegroundColor Green

# ============================================================
# VERIFICACIÓN FINAL
# ============================================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "VERIFICACIÓN FINAL" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

Write-Host "🔍 Verificando setup...`n" -ForegroundColor Yellow

# Test 1: JWT configurado
if ($env:QUESTIONNAIRE_JWT) {
    Write-Host "   ✅ JWT configurado en `$env:QUESTIONNAIRE_JWT" -ForegroundColor Green
} else {
    Write-Host "   ❌ JWT no configurado" -ForegroundColor Red
}

# Test 2: Backend respondiendo
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3002/api/health" -UseBasicParsing
    Write-Host "   ✅ Backend respondiendo: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Backend no responde (¿está arrancado?)" -ForegroundColor Yellow
}

Write-Host "`n"
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              ✅ SETUP COMPLETADO EXITOSAMENTE              ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "📝 Próximos pasos:" -ForegroundColor Cyan
Write-Host "   1. Probar el endpoint de upload con el fichero de prueba:" -ForegroundColor White
Write-Host "      Ver: docs/05-therefore/therefore/TESTING-QUESTIONNAIRES.md" -ForegroundColor Gray
Write-Host "`n   2. El JWT está guardado en:" -ForegroundColor White
Write-Host "      `$env:QUESTIONNAIRE_JWT" -ForegroundColor Gray
Write-Host "`n   3. Fichero de prueba disponible:" -ForegroundColor White
Write-Host "      test_cuestionario_simple.xlsx (15 preguntas)" -ForegroundColor Gray
Write-Host "`n"

# Guardar JWT en fichero temporal para fácil acceso
$jwtFile = ".\QUESTIONNAIRE_JWT.txt"
$jwt | Out-File -FilePath $jwtFile -Encoding UTF8
Write-Host "💾 JWT también guardado en: $jwtFile" -ForegroundColor Gray
Write-Host "   (válido durante 1 hora)`n" -ForegroundColor Gray

Write-Host "🚀 Para probar el upload ahora mismo, ejecuta:" -ForegroundColor Cyan
Write-Host "   node scripts/test-upload-endpoint.ps1`n" -ForegroundColor White
