# Script PowerShell para crear Plantilla Excel.xlsm con VBA
# Uso: PowerShell.exe -ExecutionPolicy Bypass -File crear-plantilla-gantt.ps1

$outputPath = "$PSScriptRoot\Gantt_Plantilla.xlsm"

Write-Host "🔄 Creando plantilla Excel con VBA..." -ForegroundColor Cyan

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

try {
    # Crear nuevo workbook
    $workbook = $excel.Workbooks.Add()
    $sheet = $workbook.Sheets(1)
    $sheet.Name = "Gantt"

    # Crear headers
    $sheet.Cells(1, 1).Value = "Nº"
    $sheet.Cells(1, 2).Value = "Tarea"
    $sheet.Cells(1, 3).Value = "Responsable"
    $sheet.Cells(1, 4).Value = "F. Inicio"
    $sheet.Cells(1, 5).Value = "F. Fin"
    $sheet.Cells(1, 6).Value = "Días"
    $sheet.Cells(1, 7).Value = "%"

    # Ajustar ancho de columnas
    $sheet.Columns(2).ColumnWidth = 40

    # Añadir módulo VBA
    $vbModule = $workbook.VBProject.VBComponents.Add(1)
    $vbModule.Name = "GanttColorizer"

    # Código VBA
    $vbaCode = @'
Sub ColorearBarrasGantt()
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

    ' Limpiar colores previos
    For i = 3 To lastRow
        For j = colH To lastCol
            ws.Cells(i, j).Interior.ColorIndex = xlNone
            ws.Cells(i, j).Font.ColorIndex = xlAutomatic
        Next j
    Next i

    ' Procesar cada tarea
    For i = 3 To lastRow
        If ws.Cells(i, 4).Value <> "" And ws.Cells(i, 5).Value <> "" Then
            taskStart = ws.Cells(i, 4).Value
            taskEnd = ws.Cells(i, 5).Value
            taskProgress = ws.Cells(i, 7).Value

            For j = colH To lastCol
                dayDate = taskStart + (j - colH)
                weekday = Weekday(dayDate)

                ' Fines de semana
                If weekday = 1 Or weekday = 7 Then
                    ws.Cells(i, j).Interior.Color = RGB(232, 232, 232)
                ' Dentro del rango
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

    MsgBox "✓ Barras coloreadas correctamente", vbInformation, "Gantt"
    Exit Sub

ErrorHandler:
    MsgBox "Error: " & Err.Description, vbCritical
End Sub
'@

    # Insertar código VBA
    $vbModule.CodeModule.AddFromString($vbaCode)

    # Guardar como .xlsm (52 = Excel Macro-Enabled Workbook)
    $workbook.SaveAs($outputPath, 52)
    $workbook.Close()

    Write-Host "✅ Plantilla creada: $outputPath" -ForegroundColor Green
    Write-Host ""
    Write-Host "La plantilla está lista. El servidor la usará automáticamente para:" -ForegroundColor Cyan
    Write-Host "  1. Copiar la plantilla"
    Write-Host "  2. Rellenar datos (tareas, fechas, %)"
    Write-Host "  3. El VBA se ejecuta automáticamente al abrir en Excel"

} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
} finally {
    $excel.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
    [System.GC]::Collect()
}
