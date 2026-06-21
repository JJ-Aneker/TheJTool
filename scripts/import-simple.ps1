# Script de importacion para TheJTool - Version simplificada sin emojis

param(
    [Parameter(Mandatory=$true)]
    [string]$ExportPath
)

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "  IMPORTACION EN NUEVO ORDENADOR - TheJTool" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# Configuracion
$REPO_URL = "https://github.com/JJ-Aneker/TheJTool.git"
$DESTINO = "C:\GitHub\TheJTool"

# Verificar que la ruta de exportacion existe
if (-not (Test-Path $ExportPath)) {
    Write-Host "`nERROR: No se encontro la carpeta de exportacion: $ExportPath" -ForegroundColor Red
    Write-Host "Uso: .\import-simple.ps1 -ExportPath 'C:\ruta\a\EXPORT_MIGRACION'" -ForegroundColor Yellow
    exit 1
}

# 1. Clonar repositorio (si no existe)
Write-Host "`n[1/5] Clonando repositorio desde GitHub..." -ForegroundColor Yellow
if (-not (Test-Path $DESTINO)) {
    $parentDir = Split-Path $DESTINO
    if (-not (Test-Path $parentDir)) {
        New-Item -ItemType Directory -Path $parentDir -Force | Out-Null
    }

    git clone $REPO_URL $DESTINO
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Repositorio clonado en: $DESTINO" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Error clonando repositorio" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[INFO] El directorio ya existe: $DESTINO" -ForegroundColor Yellow
}

# Cambiar al directorio del proyecto
Set-Location $DESTINO

# 2. Copiar .env
Write-Host "`n[2/5] Copiando archivo .env..." -ForegroundColor Yellow
$envSource = Join-Path $ExportPath ".env"
if (Test-Path $envSource) {
    Copy-Item $envSource ".env" -Force
    Write-Host "[OK] Archivo .env copiado" -ForegroundColor Green
} else {
    Write-Host "[ERROR] No se encontro .env en la exportacion" -ForegroundColor Red
    Write-Host "[INFO] Deberas crear el archivo .env manualmente" -ForegroundColor Yellow
}

# 3. Copiar memoria de Claude
Write-Host "`n[3/5] Copiando memoria de Claude Code..." -ForegroundColor Yellow
$memoriaSource = Join-Path $ExportPath "claude_memory"
$memoriaDestino = "C:\Users\$env:USERNAME\.claude\projects\c--GitHub-TheJTool"

if (Test-Path $memoriaSource) {
    if (-not (Test-Path $memoriaDestino)) {
        New-Item -ItemType Directory -Path $memoriaDestino -Force | Out-Null
    }

    Copy-Item -Recurse -Force "$memoriaSource\*" $memoriaDestino

    Write-Host "[OK] Memoria de Claude copiada en: $memoriaDestino" -ForegroundColor Green

    $memoryFiles = Get-ChildItem "$memoriaDestino\memory" -Filter "*.md" -ErrorAction SilentlyContinue
    if ($memoryFiles) {
        Write-Host "[INFO] Archivos de memoria restaurados: $($memoryFiles.Count)" -ForegroundColor Cyan
    }
} else {
    Write-Host "[INFO] No se encontro memoria de Claude en la exportacion" -ForegroundColor Yellow
}

# 4. Instalar dependencias
Write-Host "`n[4/5] Instalando dependencias de Node.js..." -ForegroundColor Yellow
Write-Host "[INFO] Esto puede tardar varios minutos..." -ForegroundColor Gray

npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Dependencias instaladas correctamente" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Error instalando dependencias" -ForegroundColor Red
    Write-Host "[INFO] Intenta manualmente: npm install" -ForegroundColor Yellow
}

# 5. Verificar instalacion
Write-Host "`n[5/5] Verificando instalacion..." -ForegroundColor Yellow

$checks = @(
    @{ Name = "package.json"; Path = "package.json" },
    @{ Name = ".env"; Path = ".env" },
    @{ Name = "node_modules"; Path = "node_modules" },
    @{ Name = "server.js"; Path = "server.js" },
    @{ Name = "Memoria Claude"; Path = $memoriaDestino }
)

$allOk = $true
foreach ($check in $checks) {
    if (Test-Path $check.Path) {
        Write-Host "  [OK] $($check.Name)" -ForegroundColor Green
    } else {
        Write-Host "  [FALTA] $($check.Name)" -ForegroundColor Red
        $allOk = $false
    }
}

# Resumen final
Write-Host "`n=================================================" -ForegroundColor Cyan

if ($allOk) {
    Write-Host "  MIGRACION COMPLETADA EXITOSAMENTE" -ForegroundColor Green
} else {
    Write-Host "  MIGRACION COMPLETADA CON ADVERTENCIAS" -ForegroundColor Yellow
}

Write-Host "=================================================" -ForegroundColor Cyan

Write-Host "`nProximos pasos:" -ForegroundColor Cyan
Write-Host "  1. Abre DOS terminales en: $DESTINO" -ForegroundColor White
Write-Host "  2. Terminal 1: npm run server    (Backend, puerto 3002)" -ForegroundColor White
Write-Host "  3. Terminal 2: npm run dev       (Frontend, puerto 5173)" -ForegroundColor White
Write-Host "  4. Abre navegador: http://localhost:5173" -ForegroundColor White

if ($allOk) {
    Write-Host "`nProyecto listo para usar!" -ForegroundColor Green
}
