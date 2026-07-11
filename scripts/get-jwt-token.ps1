# ============================================================
# Script para obtener JWT del usuario de servicio de Supabase
# ============================================================
# Uso: .\scripts\get-jwt-token.ps1
# ============================================================

param(
    [string]$UserPassword = "CuestSeg2026!BuildCtr#IT"
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Obtener JWT Token de Supabase" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Cargar variables de entorno desde .env
Write-Host "Cargando configuracion desde .env..." -ForegroundColor Yellow

if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            Set-Item -Path "env:$name" -Value $value
        }
    }
    Write-Host "[OK] Variables cargadas`n" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Fichero .env no encontrado" -ForegroundColor Red
    exit 1
}

$SUPABASE_URL = $env:VITE_SUPABASE_URL
$SUPABASE_ANON_KEY = $env:VITE_SUPABASE_ANON_KEY
$USER_EMAIL = "servicio.cuestionarios@buildingcenter.com"

Write-Host "Configuracion:" -ForegroundColor Cyan
Write-Host "  URL: $SUPABASE_URL"
Write-Host "  Usuario: $USER_EMAIL"
Write-Host "`n"

Write-Host "Obteniendo JWT..." -ForegroundColor Yellow

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

    Write-Host "[OK] JWT obtenido exitosamente!" -ForegroundColor Green
    Write-Host "`nToken (primeros 50 caracteres):" -ForegroundColor Gray
    Write-Host "$($jwt.Substring(0, 50))...`n" -ForegroundColor Gray

    # Guardar en variables de entorno
    $env:QUESTIONNAIRE_JWT = $jwt
    $env:QUESTIONNAIRE_REFRESH = $refresh

    Write-Host "[OK] Variables de entorno configuradas:" -ForegroundColor Green
    Write-Host "  - env:QUESTIONNAIRE_JWT" -ForegroundColor White
    Write-Host "  - env:QUESTIONNAIRE_REFRESH`n" -ForegroundColor White

    # Verificar el token
    Write-Host "Verificando token..." -ForegroundColor Yellow
    $userInfo = Invoke-RestMethod -Uri "$SUPABASE_URL/auth/v1/user" `
        -Method GET `
        -Headers @{
            "apikey" = $SUPABASE_ANON_KEY
            "Authorization" = "Bearer $jwt"
        }

    Write-Host "[OK] Token valido para: $($userInfo.email)`n" -ForegroundColor Green

    # Guardar JWT en fichero
    $jwtFile = ".\QUESTIONNAIRE_JWT.txt"
    $jwt | Out-File -FilePath $jwtFile -Encoding UTF8
    Write-Host "[INFO] JWT guardado en: $jwtFile" -ForegroundColor Gray
    Write-Host "(valido durante 1 hora)`n" -ForegroundColor Gray

    Write-Host "========================================" -ForegroundColor Green
    Write-Host "JWT obtenido correctamente" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Green

    Write-Host "Puedes usar el token con:" -ForegroundColor Cyan
    Write-Host "  `$jwt = `$env:QUESTIONNAIRE_JWT`n" -ForegroundColor White

} catch {
    Write-Host "[ERROR] Error obteniendo JWT:" -ForegroundColor Red
    Write-Host "$($_.Exception.Message)`n" -ForegroundColor Red

    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $reader.DiscardBufferedData()
        $responseBody = $reader.ReadToEnd()
        Write-Host "Respuesta del servidor:" -ForegroundColor Yellow
        Write-Host $responseBody -ForegroundColor Gray
    }

    Write-Host "`nVerifica que:" -ForegroundColor Yellow
    Write-Host "  1. El usuario existe en Supabase Auth" -ForegroundColor White
    Write-Host "  2. El email y password sean correctos" -ForegroundColor White
    Write-Host "  3. El usuario este confirmado (Auto Confirm marcado)`n" -ForegroundColor White
    exit 1
}
