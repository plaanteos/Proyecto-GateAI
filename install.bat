@echo off
REM Script de Instalación Completa UnionTech v2.0 para Windows
REM Instala todas las dependencias y configura el sistema

echo.
echo 🚀 ==================================
echo    UNIONTECH INSTALLATION SCRIPT
echo    Version 2.0 - Complete Edition
echo 🚀 ==================================
echo.

REM Verificar Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js no está instalado. Por favor instala Node.js 18+ primero.
    echo    Descarga desde: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=1 delims=v" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✅ Node.js detectado: %NODE_VERSION%

REM Verificar npm
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm no está disponible
    pause
    exit /b 1
)

for /f %%i in ('npm -v') do set NPM_VERSION=%%i
echo ✅ npm detectado: %NPM_VERSION%

REM Instalar dependencias
echo.
echo 📦 Instalando dependencias de Node.js...
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error instalando dependencias
    pause
    exit /b 1
)

echo ✅ Dependencias instaladas exitosamente

REM Configurar archivo .env
echo.
echo ⚙️ Configurando archivo de entorno...
if not exist .env (
    copy .env.example .env >nul
    echo ✅ Archivo .env creado desde .env.example
    echo ⚠️ IMPORTANTE: Edita el archivo .env con tus configuraciones específicas
) else (
    echo ⚠️ Archivo .env ya existe, no se sobrescribió
)

REM Crear directorios necesarios
echo.
echo 📁 Creando directorios del sistema...
if not exist logs mkdir logs
if not exist data\documents mkdir data\documents
if not exist data\faces mkdir data\faces
if not exist uploads mkdir uploads
if not exist backups mkdir backups

echo ✅ Directorios creados

REM Verificar Redis (opcional)
echo.
echo 🔴 Verificando Redis...
where redis-cli >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    redis-cli ping >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Redis está ejecutándose
    ) else (
        echo ⚠️ Redis instalado pero no ejecutándose
        echo    Para iniciar Redis: redis-server
    )
) else (
    echo ⚠️ Redis no detectado (opcional para cache)
    echo    Para instalar Redis en Windows:
    echo    1. Descargar desde: https://redis.io/download
    echo    2. O usar Docker: docker run -d -p 6379:6379 redis
)

REM Verificar SQL Server
echo.
echo 🗄️ Verificando configuración de base de datos...
echo ⚠️ IMPORTANTE: Asegúrate de tener SQL Server configurado
echo    1. Instala SQL Server Express desde: https://aka.ms/sqlserverexpress
echo    2. Crea una base de datos llamada 'uniontech'
echo    3. Configura la cadena de conexión en .env
echo    4. Ejecuta: npm run prisma:migrate

REM Mostrar siguientes pasos
echo.
echo 🎯 ==================================
echo    INSTALACIÓN COMPLETADA
echo 🎯 ==================================
echo.
echo 📋 PRÓXIMOS PASOS:
echo.
echo 1. 📝 Editar configuración:
echo    notepad .env
echo.
echo 2. 🗄️ Configurar base de datos:
echo    npm run prisma:generate
echo    npm run prisma:migrate
echo.
echo 3. 🚀 Iniciar el sistema:
echo    REM Modo desarrollo:
echo    npm run dev
echo    REM Modo producción:
echo    npm run production:start
echo.
echo 4. 🔧 Inicializar servicios (opcional):
echo    REM Con PM2:
echo    npm run pm2:start
echo.
echo 📡 URLs del sistema:
echo    - API REST: http://localhost:3000/api
echo    - Health Check: http://localhost:3000/health
echo    - Dashboard: http://localhost:3000/dashboard
echo.
echo 📚 DOCUMENTACIÓN:
echo    - README.md: Documentación general
echo    - DEPLOYMENT-GUIDE.md: Guía de despliegue
echo    - API endpoints: GET /api/system/info
echo.
echo 🎉 ¡UnionTech está listo para usar!
echo.
pause
