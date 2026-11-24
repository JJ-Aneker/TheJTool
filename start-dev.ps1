# Start Development Environment - TheJTool
# Arranca Frontend (Vite) + Backend (Express) en ventanas separadas

Write-Host "`n🚀 Arrancando TheJTool - Development Environment`n" -ForegroundColor Cyan

# Start Backend (Express - puerto 3002)
Write-Host "📦 Arrancando Backend (Express - puerto 3002)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "cd '$PSScriptRoot'; Write-Host '🟢 BACKEND - Express API' -ForegroundColor Green; node server.js"

Start-Sleep 2

# Start Frontend (Vite - puerto 5173)
Write-Host "⚛️  Arrancando Frontend (Vite - puerto 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "cd '$PSScriptRoot'; Write-Host '🟢 FRONTEND - React + Vite' -ForegroundColor Green; npm run dev"

Start-Sleep 3

Write-Host "`n✅ Servidores arrancando...`n" -ForegroundColor Green
Write-Host "   Frontend: " -NoNewline -ForegroundColor White
Write-Host "http://localhost:5173" -ForegroundColor Cyan
Write-Host "   Backend:  " -NoNewline -ForegroundColor White
Write-Host "http://localhost:3002" -ForegroundColor Cyan
Write-Host "`n💡 Ambos servidores se abrieron en ventanas separadas" -ForegroundColor Gray
Write-Host "   Para detenerlos: cierra las ventanas o Ctrl+C en cada una`n" -ForegroundColor Gray

# Wait a bit and verify
Start-Sleep 5
Write-Host "🔍 Verificando estado...`n" -ForegroundColor Yellow

try {
    $frontend = Invoke-WebRequest -Uri 'http://localhost:5173' -Method GET -UseBasicParsing -TimeoutSec 3
    Write-Host "   ✅ Frontend OK (Status: $($frontend.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Frontend todavía arrancando..." -ForegroundColor Yellow
}

try {
    $backend = Invoke-WebRequest -Uri 'http://localhost:3002/api/health' -Method GET -UseBasicParsing -TimeoutSec 3
    Write-Host "   ✅ Backend OK (Status: $($backend.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Backend todavía arrancando..." -ForegroundColor Yellow
}

Write-Host "`n🎉 Listo! Abre http://localhost:5173 en tu navegador`n" -ForegroundColor Cyan
