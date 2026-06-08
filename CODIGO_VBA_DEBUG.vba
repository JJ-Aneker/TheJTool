Sub ColorearBarrasGantt_DEBUG()
    Dim ws As Worksheet
    Dim lastRow As Long, lastCol As Long
    Dim i As Long, j As Long
    Dim taskStart As Date, taskEnd As Date, taskProgress As Variant
    Dim dayDate As Date
    Dim colH As Long
    Dim colorValue As Long
    Dim diaSemana As Integer
    Dim debugMsg As String

    On Error GoTo ErrorHandler
    Set ws = ThisWorkbook.Sheets("Gantt")
    colH = 8
    lastRow = ws.Cells(ws.Rows.Count, 2).End(xlUp).Row
    lastCol = ws.Cells(3, ws.Columns.Count).End(xlToLeft).Column

    ' LIMPIAR COLORES PREVIOS
    For i = 5 To lastRow
        For j = colH To lastCol
            ws.Cells(i, j).Interior.Color = RGB(255, 255, 255)
        Next j
    Next i

    ' COLOREAR FIN DE SEMANA
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

    ' COLOREAR TAREAS - CON DEBUG
    For i = 5 To lastRow
        If ws.Cells(i, 4).Value <> "" And ws.Cells(i, 5).Value <> "" Then
            taskStart = CDate(ws.Cells(i, 4).Value)
            taskEnd = CDate(ws.Cells(i, 5).Value)
            taskProgress = ws.Cells(i, 7).Value

            ' DEBUG: Mostrar valores de la primera tarea
            If i = 5 Then
                debugMsg = "FILA 5 (PRIMERA TAREA):" & vbCrLf
                debugMsg = debugMsg & "F.Inicio (D5): " & ws.Cells(i, 4).Value & " -> " & taskStart & vbCrLf
                debugMsg = debugMsg & "F.Fin (E5): " & ws.Cells(i, 5).Value & " -> " & taskEnd & vbCrLf
                debugMsg = debugMsg & "Dias (F5): " & ws.Cells(i, 6).Value & vbCrLf
                debugMsg = debugMsg & "% (G5): " & taskProgress & vbCrLf
                debugMsg = debugMsg & "Diferencia de días: " & (taskEnd - taskStart) & vbCrLf
                MsgBox debugMsg, vbInformation, "DEBUG"
            End If

            If taskProgress >= 0.76 Then
                colorValue = RGB(26, 94, 154)
            ElseIf taskProgress >= 0.51 Then
                colorValue = RGB(46, 141, 212)
            ElseIf taskProgress >= 0.26 Then
                colorValue = RGB(123, 191, 232)
            Else
                colorValue = RGB(189, 221, 242)
            End If

            Dim colorCount As Long
            colorCount = 0

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
                            colorCount = colorCount + 1
                        End If
                    End If
                End If
            Next j

            ' DEBUG: Mostrar cuántas celdas se colorearon
            If i = 5 Then
                MsgBox "CELDAS COLOREADAS EN FILA 5: " & colorCount, vbInformation, "DEBUG"
            End If
        End If
    Next i

    Exit Sub
ErrorHandler:
    MsgBox "Error: " & Err.Description, vbCritical
End Sub
