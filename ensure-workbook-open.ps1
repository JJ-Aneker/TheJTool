param(
    [Parameter(Mandatory=$true)][string]$TemplatePath
)

try {
    Write-Host "Verificando Workbook_Open en plantilla..."
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    
    $workbook = $excel.Workbooks.Open($TemplatePath)
    $thisWorkbook = $workbook.VBProject.VBComponents("ThisWorkbook")
    $codeCount = $thisWorkbook.CodeModule.CountOfLines
    
    if ($codeCount -gt 0) {
        $code = $thisWorkbook.CodeModule.Lines(1, $codeCount)
        if ($code -match "Workbook_Open") {
            Write-Host "OK - Workbook_Open ya existe"
        } else {
            Write-Host "Agregando Workbook_Open..."
            $newCode = @"
Private Sub Workbook_Open()
    On Error Resume Next
    Call ActualizarGantt
    On Error GoTo 0
End Sub
"@
            $thisWorkbook.CodeModule.AddFromString($newCode)
            $workbook.Save()
            Write-Host "OK - Agregado"
        }
    } else {
        Write-Host "Agregando Workbook_Open..."
        $newCode = @"
Private Sub Workbook_Open()
    On Error Resume Next
    Call ActualizarGantt
    On Error GoTo 0
End Sub
"@
        $thisWorkbook.CodeModule.AddFromString($newCode)
        $workbook.Save()
        Write-Host "OK - Agregado"
    }
    
    $workbook.Close($false)
    $excel.Quit()
    
} catch {
    Write-Host "ERROR: $_"
    if ($excel) { try { $excel.Quit() } catch {} }
    exit 1
}
