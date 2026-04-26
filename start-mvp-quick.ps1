# UnionTech MVP - Inicio Rapido
# Script simplificado para iniciar el MVP

Write-Host "UnionTech MVP - Inicio Rapido" -ForegroundColor Green
Write-Host "============================" -ForegroundColor Yellow

# Limpiar procesos anteriores
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Iniciar backend
Write-Host "Iniciando Backend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-Command", "node backend-mvp.js" -WindowStyle Normal
Start-Sleep -Seconds 3

# Iniciar frontend  
Write-Host "Iniciando Frontend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-Command", "node frontend-mvp-server.js" -WindowStyle Normal
Start-Sleep -Seconds 2

Write-Host "Servicios iniciados!" -ForegroundColor Green
Write-Host "Aplicacion: http://localhost:8080" -ForegroundColor White
Write-Host "API: http://localhost:3000" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "Usuarios de prueba:" -ForegroundColor Yellow
Write-Host "   admin@uniontech.com / admin123" -ForegroundColor White
Write-Host "   security@uniontech.com / security123" -ForegroundColor White
Write-Host "   visitor@uniontech.com / visitor123" -ForegroundColor White

# Abrir navegador
Start-Process "http://localhost:8080"
