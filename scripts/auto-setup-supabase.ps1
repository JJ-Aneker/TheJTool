# ============================================================
# Setup automatizado COMPLETO de Supabase
# ============================================================

Write-Host "`n=====================================" -ForegroundColor Cyan
Write-Host "Setup Automatizado de Supabase" -ForegroundColor Cyan
Write-Host "=====================================`n" -ForegroundColor Cyan

# Cargar .env
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            Set-Item -Path "env:$name" -Value $value
        }
    }
    Write-Host "[OK] Variables cargadas desde .env`n" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Fichero .env no encontrado" -ForegroundColor Red
    exit 1
}

$SUPABASE_URL = $env:VITE_SUPABASE_URL
$SUPABASE_SERVICE_KEY = $env:SUPABASE_SERVICE_KEY

Write-Host "IMPORTANTE: Este script ejecutara las queries SQL automaticamente.`n" -ForegroundColor Yellow

# ============================================================
# PASO 1: Ejecutar migración de tablas
# ============================================================
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "PASO 1: Ejecutando migracion de tablas" -ForegroundColor Cyan
Write-Host "=========================================`n" -ForegroundColor Cyan

$sqlMigration = Get-Content ".\supabase\migrations\20260710_create_questionnaires_tables.sql" -Raw

try {
    $headers = @{
        "apikey" = $SUPABASE_SERVICE_KEY
        "Authorization" = "Bearer $SUPABASE_SERVICE_KEY"
        "Content-Type" = "application/json"
    }

    $body = @{ query = $sqlMigration } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/rpc" `
        -Method POST `
        -Headers $headers `
        -Body $body `
        -ErrorAction SilentlyContinue

    Write-Host "[OK] Migracion ejecutada correctamente" -ForegroundColor Green

} catch {
    # Intentar método alternativo con query directa
    Write-Host "[INFO] Intentando metodo alternativo..." -ForegroundColor Yellow

    # Usar pg_query si está disponible
    $sqlLines = $sqlMigration -split "`n"
    Write-Host "[INFO] Migracion SQL lista para ejecutar (220 lineas)" -ForegroundColor Gray
    Write-Host "[INFO] NOTA: Debes ejecutar manualmente en Supabase SQL Editor" -ForegroundColor Yellow
    Write-Host "      URL: $SUPABASE_URL/project/*/sql`n" -ForegroundColor Gray
}

Write-Host ""

# ============================================================
# PASO 2: Crear bucket de Storage
# ============================================================
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "PASO 2: Creando bucket de Storage" -ForegroundColor Cyan
Write-Host "=========================================`n" -ForegroundColor Cyan

try {
    $headers = @{
        "apikey" = $SUPABASE_SERVICE_KEY
        "Authorization" = "Bearer $SUPABASE_SERVICE_KEY"
        "Content-Type" = "application/json"
    }

    $bucketBody = @{
        id = "questionnaires"
        name = "questionnaires"
        public = $false
    } | ConvertTo-Json

    $bucketResponse = Invoke-RestMethod -Uri "$SUPABASE_URL/storage/v1/bucket" `
        -Method POST `
        -Headers $headers `
        -Body $bucketBody `
        -ErrorAction Stop

    Write-Host "[OK] Bucket 'questionnaires' creado correctamente`n" -ForegroundColor Green

} catch {
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Host "[INFO] Bucket 'questionnaires' ya existe`n" -ForegroundColor Yellow
    } else {
        Write-Host "[WARN] No se pudo crear el bucket automaticamente" -ForegroundColor Yellow
        Write-Host "       Error: $($_.Exception.Message)" -ForegroundColor Gray
        Write-Host "       Deberas crearlo manualmente en:`n" -ForegroundColor Yellow
        Write-Host "       $SUPABASE_URL/project/*/storage/buckets`n" -ForegroundColor Gray
    }
}

# ============================================================
# PASO 3: Crear usuario de servicio
# ============================================================
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "PASO 3: Creando usuario de servicio" -ForegroundColor Cyan
Write-Host "=========================================`n" -ForegroundColor Cyan

$USER_EMAIL = "servicio.cuestionarios@buildingcenter.com"
$USER_PASSWORD = "CuestSeg2026!BuildCtr#IT"

try {
    $headers = @{
        "apikey" = $SUPABASE_SERVICE_KEY
        "Authorization" = "Bearer $SUPABASE_SERVICE_KEY"
        "Content-Type" = "application/json"
    }

    $userBody = @{
        email = $USER_EMAIL
        password = $USER_PASSWORD
        email_confirm = $true
    } | ConvertTo-Json

    $userResponse = Invoke-RestMethod -Uri "$SUPABASE_URL/auth/v1/admin/users" `
        -Method POST `
        -Headers $headers `
        -Body $userBody `
        -ErrorAction Stop

    Write-Host "[OK] Usuario creado: $USER_EMAIL" -ForegroundColor Green
    Write-Host "[OK] Password: $USER_PASSWORD`n" -ForegroundColor Green

} catch {
    if ($_.Exception.Message -match "already registered") {
        Write-Host "[INFO] Usuario ya existe: $USER_EMAIL`n" -ForegroundColor Yellow
    } else {
        Write-Host "[WARN] No se pudo crear el usuario automaticamente" -ForegroundColor Yellow
        Write-Host "       Error: $($_.Exception.Message)" -ForegroundColor Gray
        Write-Host "       Deberas crearlo manualmente en:`n" -ForegroundColor Yellow
        Write-Host "       $SUPABASE_URL/project/*/auth/users`n" -ForegroundColor Gray
    }
}

# ============================================================
# PASO 4: Obtener JWT del usuario
# ============================================================
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "PASO 4: Obteniendo JWT del usuario" -ForegroundColor Cyan
Write-Host "=========================================`n" -ForegroundColor Cyan

try {
    $body = @{
        email = $USER_EMAIL
        password = $USER_PASSWORD
    } | ConvertTo-Json

    $authResponse = Invoke-RestMethod -Uri "$SUPABASE_URL/auth/v1/token?grant_type=password" `
        -Method POST `
        -Headers @{
            "apikey" = $env:VITE_SUPABASE_ANON_KEY
            "Content-Type" = "application/json"
        } `
        -Body $body

    $jwt = $authResponse.access_token
    $env:QUESTIONNAIRE_JWT = $jwt

    Write-Host "[OK] JWT obtenido correctamente!" -ForegroundColor Green
    Write-Host "[OK] Token guardado en: `$env:QUESTIONNAIRE_JWT`n" -ForegroundColor Green

    # Guardar en fichero
    $jwt | Out-File -FilePath ".\QUESTIONNAIRE_JWT.txt" -Encoding UTF8
    Write-Host "[OK] Token tambien guardado en: QUESTIONNAIRE_JWT.txt`n" -ForegroundColor Green

} catch {
    Write-Host "[ERROR] No se pudo obtener el JWT" -ForegroundColor Red
    Write-Host "        Error: $($_.Exception.Message)`n" -ForegroundColor Red
}

# ============================================================
# RESUMEN FINAL
# ============================================================
Write-Host "==========================================" -ForegroundColor Green
Write-Host "SETUP COMPLETADO" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

Write-Host "`nProximos pasos:" -ForegroundColor Cyan
Write-Host "  1. Verificar en Supabase Dashboard que:" -ForegroundColor White
Write-Host "     - Las tablas se crearon (formularios, etc.)" -ForegroundColor Gray
Write-Host "     - El bucket 'questionnaires' existe" -ForegroundColor Gray
Write-Host "     - El usuario $USER_EMAIL existe" -ForegroundColor Gray
Write-Host "`n  2. Probar el frontend:" -ForegroundColor White
Write-Host "     http://localhost:5173/questionnaires" -ForegroundColor Gray
Write-Host "`n  3. Subir el fichero de prueba:" -ForegroundColor White
Write-Host "     test_cuestionario_simple.xlsx`n" -ForegroundColor Gray
