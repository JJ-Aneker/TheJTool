# Script para escribir datos en plantilla Gantt y preservar VBA
# Uso: powershell -ExecutionPolicy Bypass -File write-gantt-excel.ps1 -TemplatePath "..." -OutputPath "..." -JsonDataPath "..."

param(
    [Parameter(Mandatory=$true)][string]$TemplatePath,
    [Parameter(Mandatory=$true)][string]$OutputPath,
    [Parameter(Mandatory=$true)][string]$JsonDataPath
)

Write-Host "📊 Escribiendo datos en Excel..." -ForegroundColor Cyan

try {
    # Leer JSON desde archivo
    Write-Host "  Leyendo datos..."
    $jsonContent = Get-Content -Path $JsonDataPath -Raw
    $data = $jsonContent | ConvertFrom-Json
    
    # Abrir Excel
    Write-Host "  Abriendo Excel..."
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    
    # Copiar plantilla
    Write-Host "  Copiando plantilla..."
    Copy-Item $TemplatePath $OutputPath -Force
    
    # Abrir copia
    Write-Host "  Abriendo archivo..."
    $workbook = $excel.Workbooks.Open($OutputPath)
    $ws = $workbook.Sheets("Gantt")
    
    # Escribir datos fila por fila
    Write-Host "  Escribiendo $($data.tareas.Count) filas..."
    $rowIndex = 5
    foreach ($tarea in $data.tareas) {
        # Col A: Número
        if ($null -ne $tarea.numero) {
            $ws.Cells($rowIndex, 1).Value = $tarea.numero
        }
        $ws.Cells($rowIndex, 1).HorizontalAlignment = -4108  # xlCenter
        
        # Col B: Nombre
        $ws.Cells($rowIndex, 2).Value = $tarea.nombre
        $ws.Cells($rowIndex, 2).HorizontalAlignment = -4131  # xlLeft
        
        # Col C: Responsable
        $ws.Cells($rowIndex, 3).Value = $tarea.responsable
        $ws.Cells($rowIndex, 3).HorizontalAlignment = -4131  # xlLeft
        
        # Col D: F.Inicio (fecha como fecha, no número)
        $fecha = [datetime]::ParseExact($tarea.fechaInicio, "yyyy-MM-dd", $null)
        $ws.Cells($rowIndex, 4).Value = $fecha
        $ws.Cells($rowIndex, 4).NumberFormat = "dd/mm/yyyy"
        $ws.Cells($rowIndex, 4).HorizontalAlignment = -4108  # xlCenter
        
        # Col E: Vacío (VBA lo calcula)
        $ws.Cells($rowIndex, 5).NumberFormat = "dd/mm/yyyy"
        $ws.Cells($rowIndex, 5).HorizontalAlignment = -4108  # xlCenter
        
        # Col F: Días
        $ws.Cells($rowIndex, 6).Value = $tarea.dias
        $ws.Cells($rowIndex, 6).NumberFormat = "0"
        $ws.Cells($rowIndex, 6).HorizontalAlignment = -4108  # xlCenter
        
        # Col G: %
        $ws.Cells($rowIndex, 7).Value = $tarea.progreso
        $ws.Cells($rowIndex, 7).NumberFormat = "0%"
        $ws.Cells($rowIndex, 7).HorizontalAlignment = -4108  # xlCenter
        
        $rowIndex++
    }
    
    # Guardar
    Write-Host "  Guardando..."
    $workbook.Save()
    $workbook.Close($false)
    $excel.Quit()
    
    Write-Host "✅ Archivo creado" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    if ($excel) { 
        try { $excel.Quit() } catch {}
    }
    exit 1
} finally {
    # Limpiar archivo temporal JSON
    if (Test-Path $JsonDataPath) {
        try {
            Remove-Item -Path $JsonDataPath -Force
        } catch {}
    }
}
