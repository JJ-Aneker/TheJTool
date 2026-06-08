# Script PowerShell para crear Plantilla Excel.xlsm basada en gantt.xlsx
# Uso: PowerShell.exe -ExecutionPolicy Bypass -File actualizar-plantilla-gantt.ps1

$sourceFile = "$PSScriptRoot\gantt.xlsx"
$outputPath = "$PSScriptRoot\Gantt_Plantilla.xlsm"

Write-Host "Reconstruyendo plantilla basada en gantt.xlsx..." -ForegroundColor Cyan

if (-not (Test-Path $sourceFile)) {
    Write-Host "Error: No existe $sourceFile" -ForegroundColor Red
    exit 1
}

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

try {
    # Abrir gantt.xlsx como referencia
    Write-Host "Abriendo gantt.xlsx..." -ForegroundColor Yellow
    $sourceWorkbook = $excel.Workbooks.Open($sourceFile)
    $sourceSheet = $sourceWorkbook.Sheets(1)

    # Copiar todo (estructura, estilos, encabezados)
    $sourceSheet.Cells.Copy()

    # Crear nuevo workbook
    $workbook = $excel.Workbooks.Add()
    $worksheet = $workbook.Sheets(1)
    $worksheet.Name = "Gantt"

    # Pegar todo
    $worksheet.Cells(1, 1).PasteSpecial(-4104)
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($sourceWorkbook) | Out-Null

    # Limpiar filas de datos pero mantener estructura
    $lastRow = $worksheet.Cells.SpecialCells(11).Row
    if ($lastRow -gt 3) {
        $worksheet.Range("3:$lastRow").Delete()
    }

    Write-Host "Anadiendo macro VBA..." -ForegroundColor Yellow

    # Anadir modulo VBA
    $vbModule = $workbook.VBProject.VBComponents.Add(1)
    $vbModule.Name = "GanttColorizer"

    # Codigo VBA
    $vbaCode = 'Sub ColorearBarrasGantt()
    Dim ws As Worksheet
    Dim lastRow As Long, lastCol As Long
    Dim i As Long, j As Long
    Dim taskStart As Date, taskEnd As Date, taskProgress As Double
    Dim dayDate As Date
    Dim colH As Long
    Dim colorValue As Long
    Dim weekday As Integer

    On Error GoTo ErrorHandler

    Set ws = ThisWorkbook.Sheets("Gantt")
    colH = 8

    lastRow = ws.Cells(ws.Rows.Count, 2).End(xlUp).Row
    lastCol = ws.Cells(3, ws.Columns.Count).End(xlToLeft).Column

    For i = 3 To lastRow
        For j = colH To lastCol
            ws.Cells(i, j).Interior.ColorIndex = xlNone
            ws.Cells(i, j).Font.ColorIndex = xlAutomatic
        Next j
    Next i

    For i = 3 To lastRow
        If ws.Cells(i, 4).Value <> "" And ws.Cells(i, 5).Value <> "" Then
            taskStart = ws.Cells(i, 4).Value
            taskEnd = ws.Cells(i, 5).Value
            taskProgress = ws.Cells(i, 7).Value

            For j = colH To lastCol
                dayDate = taskStart + (j - colH)
                weekday = Weekday(dayDate)

                If weekday = 1 Or weekday = 7 Then
                    ws.Cells(i, j).Interior.Color = RGB(232, 232, 232)
                ElseIf dayDate >= taskStart And dayDate < taskEnd Then
                    If taskProgress > 0.75 Then
                        colorValue = RGB(12, 61, 107)
                        ws.Cells(i, j).Font.Color = RGB(255, 255, 255)
                    ElseIf taskProgress > 0.5 Then
                        colorValue = RGB(26, 94, 154)
                        ws.Cells(i, j).Font.Color = RGB(255, 255, 255)
                    ElseIf taskProgress > 0.25 Then
                        colorValue = RGB(46, 141, 212)
                        ws.Cells(i, j).Font.Color = RGB(255, 255, 255)
                    ElseIf taskProgress > 0 Then
                        colorValue = RGB(123, 191, 232)
                        ws.Cells(i, j).Font.Color = RGB(255, 255, 255)
                    Else
                        colorValue = RGB(206, 234, 249)
                        ws.Cells(i, j).Font.Color = RGB(51, 51, 51)
                    End If
                    ws.Cells(i, j).Interior.Color = colorValue
                Else
                    ws.Cells(i, j).Interior.Color = RGB(214, 228, 240)
                End If
            Next j
        End If
    Next i

    MsgBox "Barras coloreadas correctamente", vbInformation, "Gantt"
    Exit Sub

ErrorHandler:
    MsgBox "Error: " + Err.Description, vbCritical
End Sub'

    # Insertar codigo VBA
    $vbModule.CodeModule.AddFromString($vbaCode)

    # Guardar como .xlsm (52 = Excel Macro-Enabled Workbook)
    Write-Host "Guardando como .xlsm..." -ForegroundColor Yellow
    $workbook.SaveAs($outputPath, 52)
    $workbook.Close()

    Write-Host "Plantilla actualizada: $outputPath" -ForegroundColor Green
    Write-Host ""
    Write-Host "Estructura:" -ForegroundColor Cyan
    Write-Host "  - Encabezados de meses y dias"
    Write-Host "  - Columnas: No., Tarea, Responsable, F.Inicio, F.Fin, Dias, %"
    Write-Host "  - Estilos profesionales (colores, bordes, fuentes)"
    Write-Host "  - Macro VBA integrada"
    Write-Host ""
    Write-Host "Uso:" -ForegroundColor Cyan
    Write-Host "  1. Servidor copia la plantilla automaticamente"
    Write-Host "  2. Rellena datos (tareas, fechas, %)"
    Write-Host "  3. Usuario abre Excel y ejecuta: Alt+F8 -> ColorearBarrasGantt"

} catch {
    Write-Host "Error: $_" -ForegroundColor Red
} finally {
    $excel.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
    [System.GC]::Collect()
}
