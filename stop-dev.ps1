# Stop Development Environment - TheJTool
# Detiene todos los procesos Node.js de TheJTool

Write-Host "`n🛑 Deteniendo TheJTool Development Environment`n" -ForegroundColor Red

# Get all node processes
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    Write-Host "📋 Procesos Node encontrados:" -ForegroundColor Yellow
    foreach ($proc in $nodeProcesses) {
        $cmdLine = (Get-CimInstance Win32_Process -Filter "ProcessId = $($proc.Id)").CommandLine
        Write-Host "   PID $($proc.Id): $cmdLine" -ForegroundColor Gray
    }

    Write-Host "`n⚠️  ¿Detener TODOS los procesos Node? (S/N): " -NoNewline -ForegroundColor Yellow
    $confirm = Read-Host

    if ($confirm -eq 'S' -or $confirm -eq 's' -or $confirm -eq 'Y' -or $confirm -eq 'y') {
        Stop-Process -Name node -Force
        Write-Host "`n✅ Todos los procesos Node detenidos`n" -ForegroundColor Green
    } else {
        Write-Host "`n❌ Operación cancelada`n" -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ No hay procesos Node corriendo`n" -ForegroundColor Green
}
