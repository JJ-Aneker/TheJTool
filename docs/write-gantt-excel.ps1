param(
    [Parameter(Mandatory=$true)][string]$TemplatePath,
    [Parameter(Mandatory=$true)][string]$OutputPath,
    [Parameter(Mandatory=$true)][string]$JsonDataPath
)

try {
    Write-Host "1. Leyendo JSON..."
    $json = Get-Content -Path $JsonDataPath -Raw -Encoding UTF8
    
    Write-Host "2. Parseando JSON..."
    $data = $json | ConvertFrom-Json
    
    Write-Host "3. Abriendo Excel..."
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    
    Write-Host "4. Copiando plantilla..."
    Copy-Item $TemplatePath $OutputPath -Force
    
    Write-Host "5. Abriendo workbook..."
    $workbook = $excel.Workbooks.Open($OutputPath)
    
    Write-Host "6. Obteniendo hoja..."
    $ws = $workbook.Sheets("Gantt")
    
    Write-Host "7. Escribiendo datos..."
    $rowIndex = 5
    foreach ($tarea in $data.tareas) {
        Write-Host "   Fila $rowIndex : $($tarea.nombre)"
        
        # Columna A: Numero (solo para tareas principales)
        if ($null -ne $tarea.numero -and $tarea.numero -gt 0) {
            $ws.Cells($rowIndex, 1).Value = [int]$tarea.numero
            $ws.Cells($rowIndex, 1).Font.Bold = $true
        }
        $ws.Cells($rowIndex, 1).HorizontalAlignment = -4108
        
        # Columna B: Nombre
        $ws.Cells($rowIndex, 2).Value = [string]$tarea.nombre
        # Si es tarea principal (tiene numero), pone en negrita
        if ($null -ne $tarea.numero -and $tarea.numero -gt 0) {
            $ws.Cells($rowIndex, 2).Font.Bold = $true
        }
        $ws.Cells($rowIndex, 2).HorizontalAlignment = -4131
        
        # Columna C: Responsable
        $ws.Cells($rowIndex, 3).Value = [string]$tarea.responsable
        $ws.Cells($rowIndex, 3).HorizontalAlignment = -4131
        
        # Columna D: F.Inicio
        $fechaStr = [string]$tarea.fechaInicio
        $fecha = [DateTime]::ParseExact($fechaStr, "yyyy-MM-dd", [System.Globalization.CultureInfo]::InvariantCulture)
        $ws.Cells($rowIndex, 4).Value = $fecha
        $ws.Cells($rowIndex, 4).NumberFormat = "dd/mm/yyyy"
        $ws.Cells($rowIndex, 4).HorizontalAlignment = -4108
        
        # Columna E: F.Fin (vacia, VBA la calcula)
        $ws.Cells($rowIndex, 5).NumberFormat = "dd/mm/yyyy"
        $ws.Cells($rowIndex, 5).HorizontalAlignment = -4108
        
        # Columna F: Dias
        $ws.Cells($rowIndex, 6).Value = [int]$tarea.dias
        $ws.Cells($rowIndex, 6).NumberFormat = "0"
        $ws.Cells($rowIndex, 6).HorizontalAlignment = -4108
        
        # Columna G: Progreso
        $ws.Cells($rowIndex, 7).Value = [double]$tarea.progreso
        $ws.Cells($rowIndex, 7).NumberFormat = "0%"
        $ws.Cells($rowIndex, 7).HorizontalAlignment = -4108
        
        $rowIndex++
    }
    
    Write-Host "8. Ejecutando macro ActualizarGantt..."
    try {
        $excel.Run("ActualizarGantt")
        Write-Host "   OK - Macro ejecutada"
    } catch {
        Write-Host "   Nota: Macro ejecutara al abrir en Excel"
    }
    
    Write-Host "9. Guardando..."
    $workbook.Save()
    $workbook.Close($false)
    $excel.Quit()
    
    Write-Host "OK"
    
} catch {
    Write-Host "EXCEPTION: $_"
    if ($excel) { try { $excel.Quit() } catch {} }
    exit 1
} finally {
    if (Test-Path $JsonDataPath) {
        try { Remove-Item -Path $JsonDataPath -Force } catch {}
    }
}
