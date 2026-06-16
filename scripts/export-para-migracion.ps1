# ═══════════════════════════════════════════════════════════════════
# SCRIPT DE EXPORTACIÓN PARA MIGRACIÓN - TheJTool
# Ejecutar en el ORDENADOR ACTUAL antes de migrar
# ═══════════════════════════════════════════════════════════════════

Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  EXPORTACIÓN PARA MIGRACIÓN - TheJTool" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan

# Verificar que estamos en la raíz del proyecto
if (-not (Test-Path "package.json")) {
    Write-Host "`n❌ ERROR: Este script debe ejecutarse desde la raíz del proyecto" -ForegroundColor Red
    Write-Host "   cd C:\GitHub\TheJTool" -ForegroundColor Yellow
    exit 1
}

# Crear carpeta de exportación
$EXPORT_DIR = ".\EXPORT_MIGRACION"
Write-Host "`n[1/3] Creando carpeta de exportación..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path $EXPORT_DIR -Force | Out-Null
Write-Host "✅ Carpeta creada: $EXPORT_DIR" -ForegroundColor Green

# Copiar .env
Write-Host "`n[2/3] Copiando archivo .env..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Copy-Item ".env" "$EXPORT_DIR\.env" -Force
    Write-Host "✅ Archivo .env copiado" -ForegroundColor Green
    Write-Host "   ⚠️  IMPORTANTE: Este archivo contiene credenciales sensibles" -ForegroundColor Yellow
} else {
    Write-Host "❌ ERROR: No se encontró .env en el proyecto" -ForegroundColor Red
}

# Copiar memoria de Claude Code
Write-Host "`n[3/3] Copiando memoria de Claude Code..." -ForegroundColor Yellow
$MEMORIA_ORIGEN = "C:\Users\$env:USERNAME\.claude\projects\c--GitHub-TheJTool"

if (Test-Path $MEMORIA_ORIGEN) {
    # Crear directorio destino
    New-Item -ItemType Directory -Path "$EXPORT_DIR\claude_memory" -Force | Out-Null

    # Copiar toda la carpeta de memoria
    Copy-Item -Recurse -Force "$MEMORIA_ORIGEN\*" "$EXPORT_DIR\claude_memory\"

    Write-Host "✅ Memoria de Claude copiada" -ForegroundColor Green

    # Mostrar tamaño
    $memoriaSize = (Get-ChildItem "$EXPORT_DIR\claude_memory" -Recurse | Measure-Object -Property Length -Sum).Sum / 1KB
    Write-Host "   Tamaño: $([math]::Round($memoriaSize, 2)) KB" -ForegroundColor Cyan

    # Listar archivos de memoria
    $memoryFiles = Get-ChildItem "$EXPORT_DIR\claude_memory\memory" -Filter "*.md" -ErrorAction SilentlyContinue
    if ($memoryFiles) {
        Write-Host "   Archivos de memoria incluidos: $($memoryFiles.Count)" -ForegroundColor Cyan
    }
} else {
    Write-Host "⚠️  No se encontró memoria de Claude en: $MEMORIA_ORIGEN" -ForegroundColor Yellow
    Write-Host "   Esto es normal si nunca has usado Claude Code en este proyecto" -ForegroundColor Gray
}

# Resumen
Write-Host "`n═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ✅ EXPORTACIÓN COMPLETADA" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan

Write-Host "`nArchivos exportados en:" -ForegroundColor Yellow
Write-Host "  $(Resolve-Path $EXPORT_DIR)" -ForegroundColor White

Write-Host "`nContenido de la exportación:" -ForegroundColor Yellow
Get-ChildItem $EXPORT_DIR -Recurse -File | ForEach-Object {
    $size = $_.Length / 1KB
    Write-Host "  $($_.FullName.Replace((Resolve-Path $EXPORT_DIR).Path, '')) - $([math]::Round($size, 2)) KB" -ForegroundColor Gray
}

Write-Host "`nPróximos pasos:" -ForegroundColor Cyan
Write-Host "  1. Copia la carpeta 'EXPORT_MIGRACION' a un USB o nube" -ForegroundColor White
Write-Host "  2. En el nuevo ordenador, ejecuta el script de importación" -ForegroundColor White
Write-Host "  3. O sigue la guía manual en MIGRACION.md" -ForegroundColor White

Write-Host "`n⚠️  SEGURIDAD:" -ForegroundColor Yellow
Write-Host "  - NO subas EXPORT_MIGRACION a GitHub (contiene .env con credenciales)" -ForegroundColor Red
Write-Host "  - Elimina EXPORT_MIGRACION después de migrar" -ForegroundColor Red

# Preguntar si quiere comprimir
Write-Host "`n¿Quieres comprimir la carpeta en un ZIP? (S/N): " -ForegroundColor Cyan -NoNewline
$respuesta = Read-Host

if ($respuesta -eq 'S' -or $respuesta -eq 's') {
    $zipPath = ".\EXPORT_MIGRACION.zip"
    Compress-Archive -Path $EXPORT_DIR -DestinationPath $zipPath -Force
    Write-Host "✅ Archivo ZIP creado: $zipPath" -ForegroundColor Green

    $zipSize = (Get-Item $zipPath).Length / 1MB
    Write-Host "   Tamaño: $([math]::Round($zipSize, 2)) MB" -ForegroundColor Cyan
}

Write-Host "`n✅ Exportación finalizada exitosamente" -ForegroundColor Green
