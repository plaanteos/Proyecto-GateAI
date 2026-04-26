@echo off
echo ========================================
echo    UNIONTECH - Inicio Modo Fallback
echo ========================================
echo.
echo 🚀 Iniciando sistema sin base de datos...
echo 📄 Base de datos: OMITIDA (modo fallback)
echo 🔧 Servicios: Modo fallback habilitado  
echo.
echo Presiona Ctrl+C para detener
echo.

REM Configurar variables de entorno
set DATABASE_MODE=fallback
set SKIP_DB_CONNECTION=true

REM Iniciar servidor
node src/server-complete.js

echo.
echo ✅ Sistema detenido
pause