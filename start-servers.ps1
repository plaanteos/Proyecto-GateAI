# Script para iniciar UnionTech v2.0 con Sistema de Roles

Write-Host "=== UnionTech v2.0 - Sistema Completo ===" -ForegroundColor Green

# Matar procesos existentes de Node
Write-Host "Limpiando procesos existentes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

# Esperar un momento
Start-Sleep -Seconds 2

# Iniciar servidor principal UnionTech
Write-Host "Iniciando UnionTech Server (con Roles y DB)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd "c:\Users\jesus\OneDrive\Escritorio\UNIONTECH"; node uniontech-server.js'

# Esperar que el servidor principal se inicie
Start-Sleep -Seconds 3

# Iniciar servidor Frontend con nuevo app
Write-Host "Iniciando Frontend Server (con Vistas por Rol)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd "c:\Users\jesus\OneDrive\Escritorio\UNIONTECH"; node simple-frontend-server.js'

# Esperar que ambos servidores se inicien
Start-Sleep -Seconds 3

Write-Host "=== SISTEMA INICIADO ===" -ForegroundColor Green
Write-Host "API Server: http://localhost:3000" -ForegroundColor Yellow  
Write-Host "Frontend: http://localhost:8080" -ForegroundColor Yellow
Write-Host "" -ForegroundColor White
Write-Host "=== CUENTAS DE DEMOSTRACIÓN ===" -ForegroundColor Magenta
Write-Host "Super Admin: admin@uniontech.com / admin123" -ForegroundColor White
Write-Host "Admin Edificio: admin.edificio@uniontech.com / building123" -ForegroundColor White  
Write-Host "Seguridad: seguridad@uniontech.com / security123" -ForegroundColor White
Write-Host "Residente: maria.garcia@email.com / resident123" -ForegroundColor White

# Verificar que los servidores respondan
Write-Host "Verificando servidores..." -ForegroundColor Blue

try {
    $apiResponse = Invoke-WebRequest -Uri "http://localhost:3000/health" -Method GET -UseBasicParsing -TimeoutSec 5
    Write-Host "API Server: OK" -ForegroundColor Green
} catch {
    Write-Host "API Server: Error" -ForegroundColor Red
}

try {
    Start-Sleep -Seconds 2
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:8080" -Method GET -UseBasicParsing -TimeoutSec 5
    Write-Host "Frontend Server: OK" -ForegroundColor Green
} catch {
    Write-Host "Frontend Server: Error" -ForegroundColor Red
}

Write-Host "=== CARACTERÍSTICAS NUEVAS ===" -ForegroundColor Cyan
Write-Host "✓ Sistema de roles diferenciados" -ForegroundColor Green
Write-Host "✓ Dashboards específicos por usuario" -ForegroundColor Green  
Write-Host "✓ Gestión de invitados avanzada" -ForegroundColor Green
Write-Host "✓ Validación biométrica preparada" -ForegroundColor Green
Write-Host "✓ Base de datos SQL Server configurada" -ForegroundColor Green

Write-Host "Sistema listo para usar!" -ForegroundColor Green
