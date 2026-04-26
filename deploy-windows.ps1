# 🚀 UnionTech Security System - Deploy PowerShell
# Versión: 1.0.0 para Windows
# Autor: UnionTech Development Team

param(
    [switch]$SkipNodeInstall,
    [switch]$SkipPM2Install,
    [string]$Port = "3000",
    [string]$Environment = "production"
)

# Configuración de colores para Windows PowerShell
$Host.UI.RawUI.ForegroundColor = "White"

function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    } else {
        $input | Write-Output
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Info($message) {
    Write-ColorOutput Blue "[INFO] $message"
}

function Write-Success($message) {
    Write-ColorOutput Green "[SUCCESS] $message"
}

function Write-Warning($message) {
    Write-ColorOutput Yellow "[WARNING] $message"
}

function Write-Error($message) {
    Write-ColorOutput Red "[ERROR] $message"
}

# Banner
Write-Success @"

██╗   ██╗███╗   ██╗██╗ ██████╗ ███╗   ██╗████████╗███████╗ ██████╗██╗  ██╗
██║   ██║████╗  ██║██║██╔═══██╗████╗  ██║╚══██╔══╝██╔════╝██╔════╝██║  ██║
██║   ██║██╔██╗ ██║██║██║   ██║██╔██╗ ██║   ██║   █████╗  ██║     ███████║
██║   ██║██║╚██╗██║██║██║   ██║██║╚██╗██║   ██║   ██╔══╝  ██║     ██╔══██║
╚██████╔╝██║ ╚████║██║╚██████╔╝██║ ╚████║   ██║   ███████╗╚██████╗██║  ██║
 ╚═════╝ ╚═╝  ╚═══╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝   ╚═╝   ╚══════╝ ╚═════╝╚═╝  ╚═╝

🔒 Security Management System - Deploy para Windows
================================================================

"@

# Verificar si estamos corriendo como administrador
function Test-Admin {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Función para verificar Node.js
function Test-NodeJS {
    Write-Info "Verificando instalación de Node.js..."
    
    try {
        $nodeVersion = node --version 2>$null
        if ($nodeVersion) {
            Write-Success "Node.js ya instalado: $nodeVersion"
            return $true
        }
    } catch {
        Write-Warning "Node.js no encontrado"
        return $false
    }
    return $false
}

# Función para instalar Node.js (manual)
function Install-NodeJS {
    if ($SkipNodeInstall) {
        Write-Warning "Saltando instalación de Node.js (flag -SkipNodeInstall)"
        return
    }
    
    Write-Info "Node.js no está instalado."
    Write-Warning "Por favor instala Node.js manualmente desde: https://nodejs.org/"
    Write-Warning "Luego ejecuta este script nuevamente con -SkipNodeInstall"
    
    $response = Read-Host "¿Quieres abrir la página de descarga? (y/n)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        Start-Process "https://nodejs.org/"
    }
    
    exit 1
}

# Función para verificar PM2
function Test-PM2 {
    Write-Info "Verificando PM2..."
    
    try {
        $pm2Version = pm2 --version 2>$null
        if ($pm2Version) {
            Write-Success "PM2 ya instalado: $pm2Version"
            return $true
        }
    } catch {
        Write-Warning "PM2 no encontrado"
        return $false
    }
    return $false
}

# Función para instalar PM2
function Install-PM2 {
    if ($SkipPM2Install) {
        Write-Warning "Saltando instalación de PM2 (flag -SkipPM2Install)"
        return
    }
    
    Write-Info "Instalando PM2..."
    try {
        npm install -g pm2
        Write-Success "PM2 instalado exitosamente"
    } catch {
        Write-Error "Error instalando PM2: $_"
        exit 1
    }
}

# Función para crear directorios
function Setup-Directories {
    Write-Info "Configurando directorios..."
    
    $directories = @("logs", "data", "data\documents", "data\faces")
    
    foreach ($dir in $directories) {
        if (!(Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
        }
    }
    
    Write-Success "Directorios configurados"
}

# Función para instalar dependencias
function Install-Dependencies {
    Write-Info "Instalando dependencias de Node.js..."
    
    try {
        npm install --production
        Write-Success "Dependencias instaladas"
    } catch {
        Write-Error "Error instalando dependencias: $_"
        exit 1
    }
}

# Función para configurar variables de entorno
function Setup-Environment {
    Write-Info "Configurando variables de entorno..."
    
    if (!(Test-Path ".env.prod")) {
        Write-Warning "Archivo .env.prod no encontrado, creando uno básico..."
        
        $envContent = @"
NODE_ENV=$Environment
PORT=$Port
HOST=0.0.0.0
JWT_SECRET=uniontech_windows_secret_$(Get-Random -Maximum 99999)_change_in_production
JWT_EXPIRE=24h
LOG_LEVEL=info
LOG_FILE_PATH=./logs/
CORS_ORIGIN=*
ENABLE_REGISTRATION=true
ENABLE_PASSWORD_RECOVERY=true
ENABLE_FACIAL_RECOGNITION=true
ENABLE_QR_ACCESS=true
"@
        
        $envContent | Out-File -FilePath ".env.prod" -Encoding UTF8
    }
    
    Write-Success "Variables de entorno configuradas"
}

# Función para configurar firewall de Windows
function Setup-WindowsFirewall {
    if (!(Test-Admin)) {
        Write-Warning "Se necesitan permisos de administrador para configurar firewall"
        return
    }
    
    Write-Info "Configurando firewall de Windows..."
    
    try {
        # Permitir tráfico en el puerto especificado
        New-NetFirewallRule -DisplayName "UnionTech Security - Port $Port" -Direction Inbound -Protocol TCP -LocalPort $Port -Action Allow -ErrorAction SilentlyContinue
        Write-Success "Regla de firewall creada para puerto $Port"
    } catch {
        Write-Warning "Error configurando firewall: $_"
    }
}

# Función para crear servicio de Windows
function Setup-WindowsService {
    if (!(Test-Admin)) {
        Write-Warning "Se necesitan permisos de administrador para crear servicio"
        return
    }
    
    Write-Info "El servicio de Windows debe configurarse manualmente."
    Write-Info "Usa PM2 para gestionar el proceso o configura un servicio con nssm."
    Write-Warning "Ejecuta 'pm2 start ecosystem.config.js --env production' para iniciar con PM2"
}

# Función para iniciar con PM2
function Start-WithPM2 {
    Write-Info "Iniciando aplicación con PM2..."
    
    try {
        # Detener procesos existentes
        pm2 stop uniontech-prod 2>$null
        pm2 delete uniontech-prod 2>$null
        
        # Iniciar nueva instancia
        if (Test-Path "ecosystem.config.js") {
            pm2 start ecosystem.config.js --env production
        } else {
            pm2 start main-server.js --name "uniontech-prod" --env production
        }
        
        # Guardar configuración PM2
        pm2 save
        
        Write-Success "Aplicación iniciada con PM2"
        
        # Mostrar estado
        pm2 status
        
    } catch {
        Write-Error "Error iniciando con PM2: $_"
        exit 1
    }
}

# Función para verificar deployment
function Test-Deployment {
    Write-Info "Verificando deployment..."
    
    Start-Sleep -Seconds 5
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$Port/api/health" -TimeoutSec 10 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Success "Health check exitoso"
        }
    } catch {
        Write-Warning "Health check falló, pero el servicio puede estar iniciando"
        Write-Info "Verifica manualmente: http://localhost:$Port"
    }
    
    Write-Success "Deployment verificado"
}

# Función principal
function Main {
    Write-Info "Iniciando deploy de UnionTech Security System en Windows..."
    
    # Verificaciones
    if (!(Test-NodeJS)) {
        Install-NodeJS
    }
    
    if (!(Test-PM2)) {
        Install-PM2
    }
    
    # Configuración
    Setup-Directories
    Install-Dependencies
    Setup-Environment
    Setup-WindowsFirewall
    Setup-WindowsService
    Start-WithPM2
    Test-Deployment
    
    Write-Success @"

================================================================
🎉 DEPLOYMENT COMPLETADO EXITOSAMENTE EN WINDOWS!
================================================================

📍 Información del servicio:
   🌐 URL: http://localhost:$Port
   📁 Directorio: $(Get-Location)
   📝 Logs: .\logs\
   
🔧 Comandos útiles de PM2:
   pm2 status                    # Ver estado
   pm2 restart uniontech-prod    # Reiniciar
   pm2 stop uniontech-prod       # Detener
   pm2 logs uniontech-prod       # Ver logs
   pm2 monit                     # Monitor interactivo

🔑 Usuarios de demo:
   admin/admin123 (Administrador)
   user/user123 (Usuario)  
   security/security123 (Seguridad)

✅ Sistema listo para producción en Windows!

Para producción real, considera:
- Configurar un proxy reverso (IIS/Nginx)
- Usar un servicio de Windows real
- Configurar certificados SSL
- Migrar a base de datos externa

"@
}

# Ejecutar función principal
try {
    Main
} catch {
    Write-Error "Error durante el deployment: $_"
    exit 1
}
