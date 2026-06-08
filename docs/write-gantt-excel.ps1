param(
    [Parameter(Mandatory=$true)][string]$TemplatePath,
    [Parameter(Mandatory=$true)][string]$OutputPath,
    [Parameter(Mandatory=$true)][string]$JsonDataPath
)

try {
    Write-Host "1. Leyendo JSON..."
    $json = Get-Content -Path $JsonDataPath -Raw
    
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
        
        try {
            if ($null -ne $tarea.numero -and $tarea.numero -gt 0) {
                $ws.Cells($rowIndex, 1).Value = [int]$tarea.numero
            }
        } catch { Write-Host "Error en col 1: $_" }
        
        try {
            $ws.Cells($rowIndex, 2).Value = [string]$tarea.nombre
        } catch { Write-Host "Error en col 2: $_" }
        
        try {
            $ws.Cells($rowIndex, 3).Value = [string]$tarea.responsable
        } catch { Write-Host "Error en col 3: $_" }
        
        try {
            $fechaStr = [string]$tarea.fechaInicio
            $fecha = [DateTime]::ParseExact($fechaStr, "yyyy-MM-dd", [System.Globalization.CultureInfo]::InvariantCulture)
            $ws.Cells($rowIndex, 4).Value = $fecha
            $ws.Cells($rowIndex, 4).NumberFormat = "dd/mm/yyyy"
        } catch { Write-Host "Error en col 4 fecha ($($tarea.fechaInicio)): $_" }
        
        try {
            $ws.Cells($rowIndex, 5).NumberFormat = "dd/mm/yyyy"
        } catch { Write-Host "Error en col 5: $_" }
        
        try {
            $ws.Cells($rowIndex, 6).Value = [int]$tarea.dias
        } catch { Write-Host "Error en col 6: $_" }
        
        try {
            $ws.Cells($rowIndex, 7).Value = [double]$tarea.progreso
            $ws.Cells($rowIndex, 7).NumberFormat = "0%"
        } catch { Write-Host "Error en col 7: $_" }
        
        $rowIndex++
    }
    
    Write-Host "8. Ejecutando macro ActualizarGantt..."
    try {
        $excel.Run("ActualizarGantt")
    } catch {
        Write-Host "Nota: Macro no se ejecuto directamente"
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
