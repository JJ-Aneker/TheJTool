import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * Devuelve un script PowerShell para que el usuario pueda convertir
 * cualquier .xlsx a .xlsm con VBA agregado
 */
export default function convertGanttScriptHandler(req, res) {
  const scriptPath = path.join(__dirname, '..', 'docs', 'convertir-xlsx-a-xlsm-con-vba.ps1')

  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename="convertir-gantt-a-xlsm.ps1"')

  const script = `# Script para convertir Gantt_*.xlsx a .xlsm con macro VBA
# Uso: PowerShell.exe -ExecutionPolicy Bypass -File convertir-gantt-a-xlsm.ps1 -rutaArchivo "C:\\Descargas\\Gantt_*.xlsx"

param(
    [Parameter(Mandatory=$true, HelpMessage="Ruta del archivo .xlsx a convertir")]
    [string]$rutaArchivo
)

if (-not (Test-Path $rutaArchivo)) {
    Write-Host "Error: Archivo no encontrado: $rutaArchivo" -ForegroundColor Red
    exit 1
}

if (-not $rutaArchivo.EndsWith('.xlsx')) {
    Write-Host "Error: El archivo debe ser .xlsx" -ForegroundColor Red
    exit 1
}

$rutaXlsm = $rutaArchivo -replace '\\.xlsx$', '.xlsm'

Write-Host "Convirtiendo $([System.IO.Path]::GetFileName($rutaArchivo)) a .xlsm..." -ForegroundColor Cyan

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

try {
    # Abrir el xlsx
    Write-Host "Abriendo archivo..." -ForegroundColor Yellow
    $workbook = $excel.Workbooks.Open($rutaArchivo, $null, $null, 1)

    # Verificar que existe la hoja Gantt
    $ganttSheet = $null
    foreach ($sheet in $workbook.Sheets) {
        if ($sheet.Name -eq "Gantt") {
            $ganttSheet = $sheet
            break
        }
    }

    if (-not $ganttSheet) {
        Write-Host "Error: La hoja 'Gantt' no existe en el archivo" -ForegroundColor Red
        $workbook.Close()
        exit 1
    }

    # Agregar evento al abrir el workbook
    Write-Host "Agregando evento Workbook_Open..." -ForegroundColor Yellow
    $thisWorkbook = $workbook.VBProject.VBComponents("ThisWorkbook")
    $thisWorkbookCode = @'
Private Sub Workbook_Open()
    On Error Resume Next
    Call ColorearBarrasGantt
    On Error GoTo 0
End Sub
'@
    $thisWorkbook.CodeModule.AddFromString($thisWorkbookCode)

    # Agregar módulo VBA
    Write-Host "Agregando macro VBA..." -ForegroundColor Yellow
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
    Dim dayOfWeek As Integer
    Dim daysOffset As Long

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
            taskProgress = CDbl(ws.Cells(i, 7).Value)

            For j = colH To lastCol
                daysOffset = j - colH
                dayDate = taskStart + daysOffset

                dayOfWeek = Weekday(dayDate)

                If dayOfWeek = 1 Or dayOfWeek = 7 Then
                    ws.Cells(i, j).Interior.Color = RGB(232, 232, 232)
                ElseIf dayDate >= taskStart And dayDate < taskEnd Then
                    Select Case True
                        Case taskProgress > 0.75
                            ws.Cells(i, j).Interior.Color = RGB(12, 61, 107)
                            ws.Cells(i, j).Font.Color = RGB(255, 255, 255)
                        Case taskProgress > 0.5
                            ws.Cells(i, j).Interior.Color = RGB(26, 94, 154)
                            ws.Cells(i, j).Font.Color = RGB(255, 255, 255)
                        Case taskProgress > 0.25
                            ws.Cells(i, j).Interior.Color = RGB(46, 141, 212)
                            ws.Cells(i, j).Font.Color = RGB(255, 255, 255)
                        Case taskProgress > 0
                            ws.Cells(i, j).Interior.Color = RGB(123, 191, 232)
                            ws.Cells(i, j).Font.Color = RGB(255, 255, 255)
                        Case Else
                            ws.Cells(i, j).Interior.Color = RGB(206, 234, 249)
                            ws.Cells(i, j).Font.Color = RGB(51, 51, 51)
                    End Select
                Else
                    ws.Cells(i, j).Interior.Color = RGB(214, 228, 240)
                End If
            Next j
        End If
    Next i

    MsgBox "Gantt coloreado correctamente", vbInformation, "Exito"
    Exit Sub

ErrorHandler:
    MsgBox "Error: " & Err.Description, vbCritical, "Error en ColorearBarrasGantt"
End Sub
'@

    # Insertar código VBA
    $vbModule.CodeModule.AddFromString($vbaCode)

    # Guardar como .xlsm (52 = Excel Macro-Enabled Workbook)
    Write-Host "Guardando como .xlsm..." -ForegroundColor Yellow
    $workbook.SaveAs($rutaXlsm, 52)
    $workbook.Close()

    Write-Host "Conversion exitosa!" -ForegroundColor Green
    Write-Host "Archivo creado: $rutaXlsm" -ForegroundColor Green
    Write-Host "" -ForegroundColor Green
    Write-Host "Proximos pasos:" -ForegroundColor Cyan
    Write-Host "1. Abre el archivo .xlsm en Excel"
    Write-Host "2. Presiona: Alt + F8"
    Write-Host "3. Selecciona 'ColorearBarrasGantt'"
    Write-Host "4. Haz clic en 'Ejecutar'"

    # Eliminar el xlsx original
    if ($rutaArchivo -ne $rutaXlsm -and (Test-Path $rutaArchivo)) {
        Remove-Item $rutaArchivo -Force
        Write-Host "Archivo original .xlsx eliminado" -ForegroundColor Gray
    }

} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
} finally {
    $excel.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
    [System.GC]::Collect()
}
`

  res.send(script)
}
