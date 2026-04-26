# Script de inicio principal para UnionTech
Write-Host "=== UnionTech Access Control System ===" -ForegroundColor Green
Write-Host "Iniciando sistema completo..." -ForegroundColor Yellow

# Verificar Node.js
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Node.js no está instalado" -ForegroundColor Red
    exit 1
}

# Matar procesos existentes
Write-Host "Deteniendo procesos existentes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

# Esperar
Start-Sleep -Seconds 2

# Iniciar servidor API
Write-Host "Iniciando API Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd "$PWD"; node simple-api-server.js'

# Esperar que se inicie
Start-Sleep -Seconds 3

# Iniciar servidor Frontend
Write-Host "Iniciando Frontend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd "$PWD"; node frontend-server.js'

# Esperar
Start-Sleep -Seconds 3

Write-Host "Sistema iniciado!" -ForegroundColor Green
Write-Host "API: http://localhost:3000" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:8080" -ForegroundColor Yellow
Write-Host "Credenciales: admin@uniontech.com / admin123" -ForegroundColor Magenta
