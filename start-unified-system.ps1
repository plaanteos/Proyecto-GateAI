#!/usr/bin/env powershell
<#
.SYNOPSIS
    Script de inicio para UnionTech Security System Unificado
.DESCRIPTION
    Inicia el sistema completo de seguridad empresarial con todas las funcionalidades integradas
.AUTHOR
    UnionTech Development Team
.VERSION
    2.0.0
#>

# Configuración de colores para output
$Host.UI.RawUI.BackgroundColor = "Black"
$Host.UI.RawUI.ForegroundColor = "White"

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "🏢 UNIONTECH SECURITY SYSTEM UNIFICADO" -ForegroundColor Yellow
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "🚀 Iniciando sistema completo..." -ForegroundColor Green
Write-Host ""

# Función para validar dependencias
function Test-Dependencies {
    Write-Host "🔍 Validando dependencias del sistema..." -ForegroundColor Blue
    
    # Verificar Node.js
    try {
        $nodeVersion = node --version
        Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
    } catch {
        Write-Host "❌ Node.js no está instalado" -ForegroundColor Red
        exit 1
    }
    
    # Verificar NPM
    try {
        $npmVersion = npm --version
        Write-Host "✅ NPM: v$npmVersion" -ForegroundColor Green
    } catch {
        Write-Host "❌ NPM no está disponible" -ForegroundColor Red
        exit 1
    }
    
    # Verificar package.json
    if (Test-Path "package.json") {
        Write-Host "✅ Configuración del proyecto encontrada" -ForegroundColor Green
    } else {
        Write-Host "❌ package.json no encontrado" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
}

# Función para instalar dependencias
function Install-Dependencies {
    Write-Host "📦 Instalando/verificando dependencias..." -ForegroundColor Blue
    
    # Instalar dependencias si no existen
    if (-not (Test-Path "node_modules")) {
        Write-Host "📥 Instalando dependencias por primera vez..." -ForegroundColor Yellow
        npm install --production
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Error instalando dependencias" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "✅ Dependencias ya están instaladas" -ForegroundColor Green
    }
    
    Write-Host ""
}

# Función para preparar directorios
function Initialize-Directories {
    Write-Host "📁 Preparando estructura de directorios..." -ForegroundColor Blue
    
    $directories = @(
        "data",
        "data/faces", 
        "data/documents",
        "data/visitors",
        "logs",
        "frontend/public",
        "uploads"
    )
    
    foreach ($dir in $directories) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-Host "✅ Creado: $dir" -ForegroundColor Green
        } else {
            Write-Host "✅ Existe: $dir" -ForegroundColor Green
        }
    }
    
    Write-Host ""
}

# Función para configurar variables de entorno
function Set-Environment {
    Write-Host "⚙️ Configurando variables de entorno..." -ForegroundColor Blue
    
    # Variables de entorno por defecto
    $env:NODE_ENV = "production"
    $env:PORT = "3000"
    $env:HOST = "0.0.0.0"
    $env:CORS_ORIGIN = "*"
    $env:RATE_LIMIT_WINDOW = "15"
    $env:RATE_LIMIT_MAX = "100"
    $env:MAX_FILE_SIZE = "10mb"
    
    # Crear archivo .env.prod si no existe
    if (-not (Test-Path ".env.prod")) {
        @"
# UnionTech Security System - Configuración de Producción
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
CORS_ORIGIN=*
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
MAX_FILE_SIZE=10mb
JWT_SECRET=UnionTech_Security_2024_SuperSecret_Key
"@ | Out-File -FilePath ".env.prod" -Encoding UTF8
        Write-Host "✅ Archivo .env.prod creado" -ForegroundColor Green
    } else {
        Write-Host "✅ Configuración de entorno encontrada" -ForegroundColor Green
    }
    
    Write-Host ""
}

# Función para verificar estado del sistema
function Test-SystemHealth {
    Write-Host "❤️ Verificando estado del sistema..." -ForegroundColor Blue
    
    Start-Sleep 3
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3000/api/health" -Method GET -TimeoutSec 10
        if ($response.status -eq "OK") {
            Write-Host "✅ Sistema operativo y saludable" -ForegroundColor Green
            Write-Host "📊 Módulos activos: $($response.modules.Count)" -ForegroundColor Green
            Write-Host "🔧 Versión: $($response.version)" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Sistema iniciado pero con advertencias" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️ Sistema iniciando... (verificación pendiente)" -ForegroundColor Yellow
    }
    
    Write-Host ""
}

# Función para mostrar información del sistema
function Show-SystemInfo {
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host "🎉 UNIONTECH SYSTEM COMPLETAMENTE OPERATIVO" -ForegroundColor Green
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🌐 Accesos del Sistema:" -ForegroundColor Yellow
    Write-Host "   ├─ Sistema Principal: http://localhost:3000" -ForegroundColor White
    Write-Host "   ├─ Dashboard Admin: http://localhost:3000/dashboard" -ForegroundColor White
    Write-Host "   ├─ Sistema Biométrico: http://localhost:3000/biometric" -ForegroundColor White
    Write-Host "   ├─ Registro Visitantes: http://localhost:3000/visitors" -ForegroundColor White
    Write-Host "   ├─ Panel Seguridad: http://localhost:3000/security" -ForegroundColor White
    Write-Host "   ├─ Reportes: http://localhost:3000/reports" -ForegroundColor White
    Write-Host "   └─ API Health: http://localhost:3000/api/health" -ForegroundColor White
    Write-Host ""
    Write-Host "✅ Funcionalidades Integradas:" -ForegroundColor Yellow
    Write-Host "   ├─ ✓ Autenticación JWT robusta" -ForegroundColor Green
    Write-Host "   ├─ ✓ Sistema biométrico completo" -ForegroundColor Green
    Write-Host "   ├─ ✓ Gestión de visitantes" -ForegroundColor Green
    Write-Host "   ├─ ✓ Control de accesos" -ForegroundColor Green
    Write-Host "   ├─ ✓ Reportes y estadísticas" -ForegroundColor Green
    Write-Host "   ├─ ✓ Panel de seguridad" -ForegroundColor Green
    Write-Host "   ├─ ✓ Logging crítico" -ForegroundColor Green
    Write-Host "   ├─ ✓ APIs REST completas" -ForegroundColor Green
    Write-Host "   ├─ ✓ Frontend responsivo" -ForegroundColor Green
    Write-Host "   └─ ✓ 11 Historias de Usuario" -ForegroundColor Green
    Write-Host ""
    Write-Host "🛡️ Configuración de Seguridad:" -ForegroundColor Yellow
    Write-Host "   ├─ ✓ Rate limiting activo" -ForegroundColor Green
    Write-Host "   ├─ ✓ Helmet security headers" -ForegroundColor Green
    Write-Host "   ├─ ✓ CORS configurado" -ForegroundColor Green
    Write-Host "   ├─ ✓ Compresión optimizada" -ForegroundColor Green
    Write-Host "   └─ ✓ Logs de auditoría" -ForegroundColor Green
    Write-Host ""
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host "Sistema listo para uso en producción 🚀" -ForegroundColor Green
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host ""
}

# Función principal de inicio
function Start-UnionTechSystem {
    try {
        # Validaciones previas
        Test-Dependencies
        Install-Dependencies
        Initialize-Directories
        Set-Environment
        
        Write-Host "🚀 Iniciando servidor unificado..." -ForegroundColor Yellow
        Write-Host ""
        
        # Iniciar el servidor
        Write-Host "===============================================" -ForegroundColor Cyan
        Write-Host "INICIANDO UNIONTECH UNIFIED SERVER..." -ForegroundColor Yellow
        Write-Host "===============================================" -ForegroundColor Cyan
        
        # Ejecutar el servidor principal
        node uniontech-unified-server.js
        
    } catch {
        Write-Host ""
        Write-Host "❌ Error crítico iniciando el sistema:" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        Write-Host ""
        Write-Host "🔧 Soluciones posibles:" -ForegroundColor Yellow
        Write-Host "   1. Verificar que Node.js esté instalado" -ForegroundColor White
        Write-Host "   2. Ejecutar 'npm install' manualmente" -ForegroundColor White
        Write-Host "   3. Verificar permisos de escritura" -ForegroundColor White
        Write-Host "   4. Liberar el puerto 3000" -ForegroundColor White
        Write-Host ""
        exit 1
    }
}

# Función para manejar Ctrl+C
$null = Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action {
    Write-Host ""
    Write-Host "🛑 Cerrando UnionTech System..." -ForegroundColor Yellow
    Write-Host "✅ Sistema cerrado correctamente" -ForegroundColor Green
}

# Limpiar pantalla y mostrar banner
Clear-Host

# ASCII Art del logo
Write-Host @"
    ██╗   ██╗███╗   ██╗██╗ ██████╗ ███╗   ██╗████████╗███████╗ ██████╗██╗  ██╗
    ██║   ██║████╗  ██║██║██╔═══██╗████╗  ██║╚══██╔══╝██╔════╝██╔════╝██║  ██║
    ██║   ██║██╔██╗ ██║██║██║   ██║██╔██╗ ██║   ██║   █████╗  ██║     ███████║
    ██║   ██║██║╚██╗██║██║██║   ██║██║╚██╗██║   ██║   ██╔══╝  ██║     ██╔══██║
    ╚██████╔╝██║ ╚████║██║╚██████╔╝██║ ╚████║   ██║   ███████╗╚██████╗██║  ██║
     ╚═════╝ ╚═╝  ╚═══╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝   ╚═╝   ╚══════╝ ╚═════╝╚═╝  ╚═╝
                              
                          🔐 SECURITY SYSTEM 🔐
                           Sistema Unificado v2.0
"@ -ForegroundColor Cyan

Write-Host ""

# Ejecutar sistema
Start-UnionTechSystem
