# Script para agregar VBA a la plantilla gantt-template.xlsm
# Uso: powershell -ExecutionPolicy Bypass -File agregar-vba-a-plantilla.ps1

$templateXlsxPath = "C:\GitHub\TheJTool\public\templates\gantt-template.xlsx"
$templateXlsmPath = "C:\GitHub\TheJTool\public\templates\gantt-template.xlsm"

Write-Host "Agregando VBA a la plantilla Gantt..." -ForegroundColor Cyan

if (-not (Test-Path $templateXlsxPath)) {
    Write-Host "❌ Plantilla no encontrada en: $templateXlsxPath" -ForegroundColor Red
    Write-Host "   Ejecuta primero: node create-gantt-template.mjs" -ForegroundColor Yellow
    exit 1
}

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
$excel.AutomationSecurity = 1

try {
    Write-Host "Abriendo plantilla..." -ForegroundColor Yellow
    $workbook = $excel.Workbooks.Open($templateXlsxPath)

    Write-Host "Agregando módulo VBA..." -ForegroundColor Yellow

    # Agregar nuevo módulo estándar
    $vbModule = $workbook.VBProject.VBComponents.Add(1)
    $vbModule.Name = "GanttMacros"

    # Código VBA completo
    $vbaCode = @'
Sub GenerarCalendario()
    Dim ws As Worksheet
    Dim lastRow As Long
    Dim i As Long, j As Long
    Dim colH As Long
    Dim minDate As Date, maxDate As Date
    Dim fechaInicio As Date, fechaFin As Date
    Dim dayDate As Date
    Dim totalDias As Long
    Dim currentMonth As Integer, currentYear As Integer
    Dim mergeStart As Long
    Dim mesActual As Integer, anioActual As Integer
    Dim lastColOld As Long
    Dim mergeEnd As Long
    Dim diaSemana As Integer
    Dim fmt As String
    Dim tmpDate As Date

    On Error GoTo ErrorHandler
    Set ws = ThisWorkbook.Sheets("Gantt")
    colH = 8

    For j = colH To 500
        ws.Columns(j).ColumnWidth = 5
    Next j

    lastRow = ws.Cells(ws.Rows.Count, 2).End(xlUp).Row
    minDate = CDate("31/12/9999")
    maxDate = CDate("01/01/1900")

    For i = 5 To lastRow
        If ws.Cells(i, 4).Value <> "" Then
            fechaInicio = CDate(ws.Cells(i, 4).Value)
            If fechaInicio < minDate Then minDate = fechaInicio
        End If
        If ws.Cells(i, 5).Value <> "" Then
            fechaFin = CDate(ws.Cells(i, 5).Value)
            If fechaFin > maxDate Then maxDate = fechaFin
        End If
    Next i

    If minDate > maxDate Then Exit Sub

    totalDias = DateDiff("d", minDate, maxDate) + 1
    lastColOld = ws.Cells(3, ws.Columns.Count).End(xlToLeft).Column

    If lastColOld >= colH Then
        On Error Resume Next
        ws.Range(ws.Cells(2, colH), ws.Cells(3, lastColOld + 10)).UnMerge
        ws.Range(ws.Cells(2, colH), ws.Cells(3, lastColOld + 10)).ClearContents
        On Error GoTo ErrorHandler
    End If

    For j = 0 To totalDias - 1
        dayDate = minDate + j
        diaSemana = Weekday(dayDate, vbSunday)
        Select Case diaSemana
            Case 1: fmt = "dd\D"
            Case 2: fmt = "dd\L"
            Case 3: fmt = "dd\M"
            Case 4: fmt = "dd\X"
            Case 5: fmt = "dd\J"
            Case 6: fmt = "dd\V"
            Case 7: fmt = "dd\S"
        End Select
        With ws.Cells(3, colH + j)
            .Value = dayDate
            .NumberFormat = fmt
            .Font.Size = 9
            .HorizontalAlignment = xlCenter
        End With
    Next j

    currentMonth = 0
    currentYear = 0
    mergeStart = colH

    For j = 0 To totalDias - 1
        dayDate = minDate + j
        mesActual = Month(dayDate)
        anioActual = Year(dayDate)

        If mesActual <> currentMonth Or anioActual <> currentYear Then
            If currentMonth > 0 Then
                mergeEnd = colH + j - 1
                If mergeEnd > mergeStart Then
                    On Error Resume Next
                    ws.Range(ws.Cells(2, mergeStart), ws.Cells(2, mergeEnd)).Merge
                    On Error GoTo ErrorHandler
                End If
                tmpDate = DateSerial(currentYear, currentMonth, 1)
                ws.Cells(2, mergeStart).Value = Format(tmpDate, "mmmm yyyy")
                ws.Cells(2, mergeStart).HorizontalAlignment = xlCenter
                ws.Cells(2, mergeStart).Font.Bold = True
            End If
            mergeStart = colH + j
            currentMonth = mesActual
            currentYear = anioActual
        End If

        If j = totalDias - 1 Then
            If colH + j > mergeStart Then
                On Error Resume Next
                ws.Range(ws.Cells(2, mergeStart), ws.Cells(2, colH + j)).Merge
                On Error GoTo ErrorHandler
            End If
            tmpDate = DateSerial(currentYear, currentMonth, 1)
            ws.Cells(2, mergeStart).Value = Format(tmpDate, "mmmm yyyy")
            ws.Cells(2, mergeStart).HorizontalAlignment = xlCenter
            ws.Cells(2, mergeStart).Font.Bold = True
        End If
    Next j

    Exit Sub
ErrorHandler:
    MsgBox "Error en GenerarCalendario: " & Err.Description, vbCritical
End Sub

Sub ColorearBarrasGantt()
    Dim ws As Worksheet
    Dim lastRow As Long, lastCol As Long
    Dim i As Long, j As Long
    Dim taskStart As Date, taskEnd As Date, taskProgress As Variant
    Dim dayDate As Date
    Dim colH As Long
    Dim colorValue As Long
    Dim diaSemana As Integer

    On Error GoTo ErrorHandler
    Set ws = ThisWorkbook.Sheets("Gantt")
    colH = 8
    lastRow = ws.Cells(ws.Rows.Count, 2).End(xlUp).Row
    lastCol = ws.Cells(3, ws.Columns.Count).End(xlToLeft).Column

    For i = 5 To lastRow
        For j = colH To lastCol
            ws.Cells(i, j).Interior.Color = RGB(255, 255, 255)
        Next j
    Next i

    For j = colH To lastCol
        If ws.Cells(3, j).Value <> "" Then
            dayDate = CDate(ws.Cells(3, j).Value)
            diaSemana = Weekday(dayDate, vbMonday)
            If diaSemana = 6 Or diaSemana = 7 Then
                For i = 5 To lastRow
                    ws.Cells(i, j).Interior.Color = RGB(200, 200, 200)
                Next i
            End If
        End If
    Next j

    For i = 5 To lastRow
        If ws.Cells(i, 4).Value <> "" And ws.Cells(i, 5).Value <> "" Then
            taskStart = CDate(ws.Cells(i, 4).Value)
            taskEnd = CDate(ws.Cells(i, 5).Value)
            taskProgress = ws.Cells(i, 7).Value

            If taskProgress >= 0.76 Then
                colorValue = RGB(26, 94, 154)
            ElseIf taskProgress >= 0.51 Then
                colorValue = RGB(46, 141, 212)
            ElseIf taskProgress >= 0.26 Then
                colorValue = RGB(123, 191, 232)
            Else
                colorValue = RGB(189, 221, 242)
            End If

            For j = colH To lastCol
                If ws.Cells(3, j).Value <> "" Then
                    dayDate = CDate(ws.Cells(3, j).Value)
                    diaSemana = Weekday(dayDate, vbMonday)

                    If diaSemana <> 6 And diaSemana <> 7 Then
                        If dayDate >= taskStart And dayDate <= taskEnd Then
                            ws.Cells(i, j).Interior.Color = colorValue
                            If taskProgress >= 0.51 Then
                                ws.Cells(i, j).Font.Color = RGB(255, 255, 255)
                            Else
                                ws.Cells(i, j).Font.Color = RGB(51, 51, 51)
                            End If
                        End If
                    End If
                End If
            Next j
        End If
    Next i

    Exit Sub
ErrorHandler:
End Sub

Sub CrearLeyenda()
    Dim ws As Worksheet, colStart As Long, i As Long
    Dim leyendas As Variant

    On Error GoTo ErrorHandler
    Set ws = ThisWorkbook.Sheets("Gantt")
    colStart = 1

    leyendas = Array( _
        Array("0-25%", RGB(189, 221, 242)), _
        Array("26-50%", RGB(123, 191, 232)), _
        Array("51-75%", RGB(46, 141, 212)), _
        Array("76-100%", RGB(26, 94, 154)), _
        Array("Fin Semana", RGB(200, 200, 200)))

    For i = LBound(leyendas) To UBound(leyendas)
        With ws.Cells(2, colStart + i)
            .Value = leyendas(i)(0)
            .Interior.Color = leyendas(i)(1)
            If leyendas(i)(1) <> RGB(200, 200, 200) Then
                .Font.Color = RGB(255, 255, 255)
            End If
            .HorizontalAlignment = xlCenter
            .Font.Bold = True
            .Font.Size = 9
        End With
    Next i

    Exit Sub
ErrorHandler:
End Sub

Sub AgregarTitulo()
    Dim ws As Worksheet, btn As Shape

    On Error GoTo ErrorHandler
    Set ws = ThisWorkbook.Sheets("Gantt")

    On Error Resume Next
    ws.Range(ws.Cells(1, 1), ws.Cells(1, 7)).UnMerge
    On Error GoTo ErrorHandler

    ws.Range(ws.Cells(1, 1), ws.Cells(1, 7)).Merge
    With ws.Cells(1, 1)
        .Value = "DIAGRAMA DE GANTT"
        .HorizontalAlignment = xlLeft
        .VerticalAlignment = xlCenter
        .Font.Bold = True
        .Font.Size = 12
        .Interior.Color = RGB(44, 62, 80)
        .Font.Color = RGB(255, 255, 255)
    End With

    On Error Resume Next
    ws.Shapes("BtnActualizar").Delete
    On Error GoTo ErrorHandler

    Set btn = ws.Shapes.AddShape(3, 750, 10, 120, 25)
    With btn
        .Name = "BtnActualizar"
        .TextFrame.Characters.Text = "Actualizar"
        .TextFrame.Characters.Font.Bold = True
        .TextFrame.Characters.Font.Size = 9
        .TextFrame.Characters.Font.Color = RGB(255, 255, 255)
        .Fill.ForeColor.RGB = RGB(26, 94, 154)
        .Line.ForeColor.RGB = RGB(12, 61, 107)
        .Line.Weight = 2
        .OnAction = "ActualizarGantt"
    End With

    Exit Sub
ErrorHandler:
    MsgBox "Error en AgregarTitulo: " & Err.Description, vbCritical
End Sub

Sub ActualizarGantt()
    Application.ScreenUpdating = False

    Call AgregarTitulo
    Call CrearLeyenda
    Call GenerarCalendario

    Application.Calculate

    Call ColorearBarrasGantt

    Application.ScreenUpdating = True
End Sub
'@

    $vbModule.CodeModule.AddFromString($vbaCode)

    Write-Host "Guardando plantilla como .xlsm..." -ForegroundColor Yellow
    $workbook.SaveAs($templateXlsmPath, 52)

    Start-Sleep -Milliseconds 500
    $workbook.Close($false)
    $excel.Quit()

    Write-Host "✅ Plantilla actualizada con VBA: $templateXlsmPath" -ForegroundColor Green
    Write-Host "" -ForegroundColor Green
    Write-Host "Proximos pasos:" -ForegroundColor Cyan
    Write-Host "  1. Abre el archivo en Excel"
    Write-Host "  2. Haz clic en el boton 'Actualizar' para ejecutar la macro"
    Write-Host "  3. Las barras del Gantt se colorearan automaticamente" -ForegroundColor Cyan

} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    exit 1
} finally {
    [System.GC]::Collect()
}
