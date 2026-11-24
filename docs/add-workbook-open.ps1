param(
    [Parameter(Mandatory=$true)][string]$TemplatePath
)

try {
    Write-Host "Abriendo plantilla..."
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    
    $workbook = $excel.Workbooks.Open($TemplatePath)
    
    Write-Host "Obteniendo ThisWorkbook..."
    $thisWorkbook = $workbook.VBProject.VBComponents("ThisWorkbook")
    
    $code = @"
Private Sub Workbook_Open()
    On Error Resume Next
    Call ActualizarGantt
    On Error GoTo 0
End Sub
"@
    
    Write-Host "Agregando Workbook_Open..."
    $thisWorkbook.CodeModule.AddFromString($code)
    
    Write-Host "Guardando..."
    $workbook.Save()
    $workbook.Close($false)
    $excel.Quit()
    
    Write-Host "OK"
    
} catch {
    Write-Host "ERROR"
    if ($excel) { try { $excel.Quit() } catch {} }
    exit 1
}
