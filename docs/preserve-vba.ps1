# Script para preservar VBA en archivo XLSM generado con ExcelJS
# Uso: powershell -ExecutionPolicy Bypass -File preserve-vba.ps1 -TemplatePath "..." -OutputPath "..."

param(
    [Parameter(Mandatory=$true)][string]$TemplatePath,
    [Parameter(Mandatory=$true)][string]$OutputPath
)

Write-Host "🔧 Preservando VBA..." -ForegroundColor Cyan

try {
    $tempDir = Join-Path $env:TEMP "vba-preserve-$(Get-Random)"
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

    # Extraer vbaProject.bin de la plantilla
    Write-Host "  1. Extrayendo vbaProject.bin de plantilla..."
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $templateZip = [System.IO.Compression.ZipFile]::OpenRead($TemplatePath)
    $vbaEntry = $templateZip.Entries | Where-Object { $_.FullName -eq 'xl/vbaProject.bin' }
    
    if ($vbaEntry) {
        $destPath = Join-Path $tempDir 'vbaProject.bin'
        [System.IO.Compression.ZipFileExtensions]::ExtractToFile($vbaEntry, $destPath, $true)
        Write-Host "  ✓ Extraído"
        
        # Agregar al archivo de salida
        Write-Host "  2. Agregando a archivo de salida..."
        $outputZip = [System.IO.Compression.ZipFile]::Open($OutputPath, [System.IO.Compression.ZipArchiveMode]::Update)
        
        # Crear directorio xl/ si no existe
        $existingXlEntry = $outputZip.Entries | Where-Object { $_.FullName -eq 'xl/' }
        if (-not $existingXlEntry) {
            $outputZip.CreateEntry('xl/') | Out-Null
        }
        
        # Agregar vbaProject.bin
        $content = [System.IO.File]::ReadAllBytes($destPath)
        $newEntry = $outputZip.CreateEntry('xl/vbaProject.bin')
        $stream = $newEntry.Open()
        $stream.Write($content, 0, $content.Length)
        $stream.Close()
        
        $outputZip.Dispose()
        Write-Host "  ✓ Agregado"
    } else {
        Write-Host "  ⚠️  vbaProject.bin no encontrado en plantilla" -ForegroundColor Yellow
    }
    
    $templateZip.Dispose()
    
    # Limpiar
    Remove-Item -Path $tempDir -Recurse -Force | Out-Null
    
    Write-Host "✅ VBA preservado" -ForegroundColor Green

} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    exit 1
}
