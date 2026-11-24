# Script para extraer y mostrar el código VBA de la plantilla

param(
    [Parameter(Mandatory=$true)][string]$TemplatePath
)

try {
    Write-Host "Abriendo plantilla..."
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    
    $workbook = $excel.Workbooks.Open($TemplatePath)
    
    Write-Host "Módulos encontrados:`n"
    foreach ($component in $workbook.VBProject.VBComponents) {
        Write-Host "- $($component.Name) (Tipo: $($component.Type))"
    }
    
    Write-Host "`nVerificando ThisWorkbook..."
    $thisWorkbook = $workbook.VBProject.VBComponents("ThisWorkbook")
    $code = $thisWorkbook.CodeModule.Lines(1, $thisWorkbook.CodeModule.CountOfLines)
    
    if ($code -match "Workbook_Open") {
        Write-Host "✓ Workbook_Open ENCONTRADO"
    } else {
        Write-Host "✗ Workbook_Open NO ENCONTRADO"
        Write-Host "`nCódigo actual:"
        Write-Host $code
    }
    
    $workbook.Close($false)
    $excel.Quit()
    
} catch {
    Write-Host "Error: $_"
    exit 1
}
