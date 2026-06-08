Sub ColorearBarrasGantt()
    '
    ' Macro para colorear automáticamente las barras del Gantt según:
    ' - Rango de fechas (Inicio - Fin)
    ' - Porcentaje de progreso
    ' Colores: 0% (azul claro) a 100% (azul oscuro)
    '

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
    colH = 8 ' Columna H es la primera columna de días

    ' Encontrar última fila y columna con datos
    lastRow = ws.Cells(ws.Rows.Count, 2).End(xlUp).Row
    lastCol = ws.Cells(3, ws.Columns.Count).End(xlToLeft).Column

    ' Limpiar colores previos en las barras
    For i = 3 To lastRow
        For j = colH To lastCol
            ws.Cells(i, j).Interior.ColorIndex = xlNone
            ws.Cells(i, j).Font.ColorIndex = xlAutomatic
        Next j
    Next i

    ' Procesar cada tarea
    For i = 3 To lastRow
        ' Leer fechas y progreso
        If ws.Cells(i, 4).Value <> "" And ws.Cells(i, 5).Value <> "" Then
            taskStart = ws.Cells(i, 4).Value
            taskEnd = ws.Cells(i, 5).Value
            taskProgress = ws.Cells(i, 7).Value

            ' Colorear cada día
            For j = colH To lastCol
                dayDate = taskStart + (j - colH)
                weekday = Weekday(dayDate)

                ' Fines de semana (1=domingo, 7=sábado)
                If weekday = 1 Or weekday = 7 Then
                    ws.Cells(i, j).Interior.Color = RGB(232, 232, 232)
                ' Dentro del rango de tarea
                ElseIf dayDate >= taskStart And dayDate < taskEnd Then
                    ' Determinar color según progreso
                    If taskProgress > 0.75 Then
                        colorValue = RGB(12, 61, 107) ' 76-100%
                        ws.Cells(i, j).Font.Color = RGB(255, 255, 255)
                    ElseIf taskProgress > 0.5 Then
                        colorValue = RGB(26, 94, 154) ' 51-75%
                        ws.Cells(i, j).Font.Color = RGB(255, 255, 255)
                    ElseIf taskProgress > 0.25 Then
                        colorValue = RGB(46, 141, 212) ' 26-50%
                        ws.Cells(i, j).Font.Color = RGB(255, 255, 255)
                    ElseIf taskProgress > 0 Then
                        colorValue = RGB(123, 191, 232) ' 1-25%
                        ws.Cells(i, j).Font.Color = RGB(255, 255, 255)
                    Else
                        colorValue = RGB(206, 234, 249) ' 0%
                        ws.Cells(i, j).Font.Color = RGB(51, 51, 51)
                    End If

                    ws.Cells(i, j).Interior.Color = colorValue
                ' Día laborable sin tarea
                Else
                    ws.Cells(i, j).Interior.Color = RGB(214, 228, 240)
                End If
            Next j
        End If
    Next i

    MsgBox "✓ Barras coloreadas correctamente", vbInformation, "Gantt"
    Exit Sub

ErrorHandler:
    MsgBox "Error al colorear barras: " & Err.Description, vbCritical, "Error"
End Sub
