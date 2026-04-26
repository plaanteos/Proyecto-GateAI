@echo off
echo === UnionTech System Startup ===
echo.
echo Iniciando servidores...
echo.

REM Matar procesos Node existentes
taskkill /f /im node.exe >nul 2>&1

REM Esperar un momento
timeout /t 2 >nul

REM Iniciar API Server
echo Iniciando API Server en puerto 3000...
start "UnionTech API" cmd /k "node simple-api-server.js"

REM Esperar
timeout /t 3 >nul

REM Iniciar Frontend Server
echo Iniciando Frontend Server en puerto 8080...
start "UnionTech Frontend" cmd /k "node frontend-server.js"

echo.
echo Sistema iniciado!
echo API: http://localhost:3000
echo Frontend: http://localhost:8080
echo Credenciales: admin@uniontech.com / admin123
echo.
pause
