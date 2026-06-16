# ═══════════════════════════════════════════════════════════════════
# SCRIPT DE IMPORTACIÓN PARA MIGRACIÓN - TheJTool
# Ejecutar en el NUEVO ORDENADOR después de clonar
# ═══════════════════════════════════════════════════════════════════

param(
    [Parameter(Mandatory=$true)]
    [string]$ExportPath
)

Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  IMPORTACIÓN EN NUEVO ORDENADOR - TheJTool" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan

# Configuración
$REPO_URL = "https://github.com/JJ-Aneker/TheJTool.git"
$DESTINO = "C:\GitHub\TheJTool"

# Verificar que la ruta de exportación existe
if (-not (Test-Path $ExportPath)) {
    Write-Host "`n❌ ERROR: No se encontró la carpeta de exportación: $ExportPath" -ForegroundColor Red
    Write-Host "   Uso: .\import-en-nuevo-ordenador.ps1 -ExportPath 'C:\ruta\a\EXPORT_MIGRACION'" -ForegroundColor Yellow
    exit 1
}

# 1. Clonar repositorio
Write-Host "`n[1/5] Clonando repositorio desde GitHub..." -ForegroundColor Yellow
if (-not (Test-Path $DESTINO)) {
    $parentDir = Split-Path $DESTINO
    if (-not (Test-Path $parentDir)) {
        New-Item -ItemType Directory -Path $parentDir -Force | Out-Null
    }

    git clone $REPO_URL $DESTINO
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Repositorio clonado en: $DESTINO" -ForegroundColor Green
    } else {
        Write-Host "❌ ERROR clonando repositorio" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "⚠️  El directorio ya existe: $DESTINO" -ForegroundColor Yellow
    Write-Host "   Se actualizará con los archivos de exportación" -ForegroundColor Gray
}

# Cambiar al directorio del proyecto
Set-Location $DESTINO

# 2. Copiar .env
Write-Host "`n[2/5] Copiando archivo .env..." -ForegroundColor Yellow
$envSource = Join-Path $ExportPath ".env"
if (Test-Path $envSource) {
    Copy-Item $envSource ".env" -Force
    Write-Host "✅ Archivo .env copiado" -ForegroundColor Green

    # Verificar contenido básico
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "VITE_SUPABASE_URL" -and $envContent -match "AWS_ACCESS_KEY_ID") {
        Write-Host "   Credenciales detectadas: Supabase ✓, AWS ✓" -ForegroundColor Cyan
    } else {
        Write-Host "   ⚠️  Verifica que el .env tenga todas las credenciales" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ ERROR: No se encontró .env en la exportación" -ForegroundColor Red
    Write-Host "   Deberás crear el archivo .env manualmente" -ForegroundColor Yellow
}

# 3. Copiar memoria de Claude
Write-Host "`n[3/5] Copiando memoria de Claude Code..." -ForegroundColor Yellow
$memoriaSource = Join-Path $ExportPath "claude_memory"
$memoriaDestino = "C:\Users\$env:USERNAME\.claude\projects\c--GitHub-TheJTool"

if (Test-Path $memoriaSource) {
    # Crear directorio si no existe
    if (-not (Test-Path $memoriaDestino)) {
        New-Item -ItemType Directory -Path $memoriaDestino -Force | Out-Null
    }

    # Copiar archivos
    Copy-Item -Recurse -Force "$memoriaSource\*" $memoriaDestino

    Write-Host "✅ Memoria de Claude copiada en: $memoriaDestino" -ForegroundColor Green

    # Verificar archivos de memoria
    $memoryFiles = Get-ChildItem "$memoriaDestino\memory" -Filter "*.md" -ErrorAction SilentlyContinue
    if ($memoryFiles) {
        Write-Host "   Archivos de memoria restaurados: $($memoryFiles.Count)" -ForegroundColor Cyan
        Write-Host "   Claude Code recordará el contexto del proyecto" -ForegroundColor Green
    }
} else {
    Write-Host "⚠️  No se encontró memoria de Claude en la exportación" -ForegroundColor Yellow
    Write-Host "   El proyecto funcionará, pero Claude no recordará decisiones pasadas" -ForegroundColor Gray
}

# 4. Instalar dependencias
Write-Host "`n[4/5] Instalando dependencias de Node.js..." -ForegroundColor Yellow
Write-Host "   Esto puede tardar varios minutos..." -ForegroundColor Gray

npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencias instaladas correctamente" -ForegroundColor Green

    # Verificar paquetes críticos
    $criticalPackages = @("express", "react", "docx", "@supabase/supabase-js", "@aws-sdk/client-bedrock-runtime")
    $allInstalled = $true

    foreach ($pkg in $criticalPackages) {
        $pkgPath = "node_modules\$pkg"
        if (Test-Path $pkgPath) {
            Write-Host "   ✓ $pkg" -ForegroundColor Green
        } else {
            Write-Host "   ✗ $pkg NO INSTALADO" -ForegroundColor Red
            $allInstalled = $false
        }
    }

    if (-not $allInstalled) {
        Write-Host "`n⚠️  Algunas dependencias críticas no se instalaron correctamente" -ForegroundColor Yellow
        Write-Host "   Intenta: npm install --force" -ForegroundColor Cyan
    }
} else {
    Write-Host "❌ ERROR instalando dependencias" -ForegroundColor Red
    Write-Host "   Intenta manualmente: npm install" -ForegroundColor Yellow
}

# 5. Verificar instalación
Write-Host "`n[5/5] Verificando instalación..." -ForegroundColor Yellow

$checks = @(
    @{ Name = "package.json"; Path = "package.json"; Critical = $true },
    @{ Name = ".env"; Path = ".env"; Critical = $true },
    @{ Name = "node_modules"; Path = "node_modules"; Critical = $true },
    @{ Name = "server.js"; Path = "server.js"; Critical = $true },
    @{ Name = "Memoria Claude"; Path = $memoriaDestino; Critical = $false },
    @{ Name = "CLAUDE.md"; Path = "CLAUDE.md"; Critical = $false }
)

$allOk = $true
foreach ($check in $checks) {
    if (Test-Path $check.Path) {
        Write-Host "  ✅ $($check.Name)" -ForegroundColor Green
    } else {
        if ($check.Critical) {
            Write-Host "  ❌ $($check.Name) NO ENCONTRADO (CRÍTICO)" -ForegroundColor Red
            $allOk = $false
        } else {
            Write-Host "  ⚠️  $($check.Name) no encontrado (opcional)" -ForegroundColor Yellow
        }
    }
}

# Resumen final
Write-Host "`n═══════════════════════════════════════════════" -ForegroundColor Cyan

if ($allOk) {
    Write-Host "  ✅ MIGRACIÓN COMPLETADA EXITOSAMENTE" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  MIGRACIÓN COMPLETADA CON ADVERTENCIAS" -ForegroundColor Yellow
}

Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan

Write-Host "`nPróximos pasos:" -ForegroundColor Cyan
Write-Host "  1. Abre DOS terminales en: $DESTINO" -ForegroundColor White
Write-Host "  2. Terminal 1: npm run server    (Backend, puerto 3002)" -ForegroundColor White
Write-Host "  3. Terminal 2: npm run dev       (Frontend, puerto 5173)" -ForegroundColor White
Write-Host "  4. Abre navegador: http://localhost:5173" -ForegroundColor White

Write-Host "`nVerificación recomendada:" -ForegroundColor Yellow
Write-Host "  - Login funciona" -ForegroundColor White
Write-Host "  - Aparece mosaico de portadas guardadas" -ForegroundColor White
Write-Host "  - Generador de documentos funciona" -ForegroundColor White

Write-Host "`n💡 Tip: Si hay problemas, revisa los logs en:" -ForegroundColor Cyan
Write-Host "   - Consola del navegador (F12)" -ForegroundColor Gray
Write-Host "   - Terminal del backend (donde corre npm run server)" -ForegroundColor Gray

if ($allOk) {
    Write-Host "`n🎉 ¡Proyecto listo para usar!" -ForegroundColor Green
}
