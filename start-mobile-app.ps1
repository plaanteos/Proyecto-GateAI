# UnionTech Mobile App - Script de Ejecución Automática
# Ejecuta la aplicación móvil React Native

param(
    [string]$Platform = "android",
    [switch]$Clean = $false,
    [switch]$Reset = $false,
    [string]$Device = ""
)

# Colores para output
function Write-ColorOutput($Message, $Color = "White") {
    Write-Host $Message -ForegroundColor $Color
}

# Función para verificar prerrequisitos
function Test-Prerequisites {
    Write-ColorOutput "📋 Verificando prerrequisitos..." "Yellow"
    
    # Verificar Node.js
    try {
        $nodeVersion = node --version
        Write-ColorOutput "✅ Node.js: $nodeVersion" "Green"
    } catch {
        Write-ColorOutput "❌ Node.js no está instalado" "Red"
        return $false
    }
    
    # Verificar npm
    try {
        $npmVersion = npm --version
        Write-ColorOutput "✅ npm: $npmVersion" "Green"
    } catch {
        Write-ColorOutput "❌ npm no está disponible" "Red"
        return $false
    }
    
    # Verificar React Native CLI
    try {
        npx react-native --version | Out-Null
        Write-ColorOutput "✅ React Native CLI disponible" "Green"
    } catch {
        Write-ColorOutput "⚠️ React Native CLI no encontrado - usaremos npx" "Yellow"
    }
    
    return $true
}

# Función para verificar backend
function Test-Backend {
    Write-ColorOutput "🌐 Verificando backend UnionTech..." "Yellow"
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-ColorOutput "✅ Backend ejecutándose en puerto 3000" "Green"
            return $true
        }
    } catch {
        Write-ColorOutput "❌ Backend no está ejecutándose en puerto 3000" "Red"
        Write-ColorOutput "💡 Asegúrate de ejecutar el backend primero:" "Yellow"
        Write-ColorOutput "   cd .. && node uniontech-server.js" "Cyan"
        return $false
    }
}

# Función para configurar ambiente
function Set-Environment {
    Write-ColorOutput "⚙️ Configurando ambiente..." "Yellow"
    
    # Verificar archivo .env
    if (-not (Test-Path ".env")) {
        if (Test-Path ".env.example") {
            Copy-Item ".env.example" ".env"
            Write-ColorOutput "✅ Archivo .env creado desde .env.example" "Green"
        } else {
            Write-ColorOutput "⚠️ Archivo .env no encontrado" "Yellow"
        }
    } else {
        Write-ColorOutput "✅ Archivo .env encontrado" "Green"
    }
    
    # Verificar directorio mobile-app
    if (-not (Test-Path "package.json")) {
        Write-ColorOutput "❌ No se encontró package.json. ¿Estás en el directorio correcto?" "Red"
        return $false
    }
    
    return $true
}

# Función para instalar dependencias
function Install-Dependencies {
    Write-ColorOutput "📦 Instalando dependencias..." "Yellow"
    
    try {
        npm install
        Write-ColorOutput "✅ Dependencias instaladas correctamente" "Green"
        
        # Para iOS (si está en macOS)
        if ($Platform -eq "ios" -and (Get-Command "pod" -ErrorAction SilentlyContinue)) {
            Write-ColorOutput "🍎 Instalando pods para iOS..." "Yellow"
            Push-Location "ios"
            pod install
            Pop-Location
            Write-ColorOutput "✅ Pods de iOS instalados" "Green"
        }
        
        return $true
    } catch {
        Write-ColorOutput "❌ Error instalando dependencias: $_" "Red"
        return $false
    }
}

# Función para limpiar proyecto
function Clear-Project {
    Write-ColorOutput "🧹 Limpiando proyecto..." "Yellow"
    
    try {
        # Limpiar caché de React Native
        npx react-native start --reset-cache --non-interactive
        Start-Sleep -Seconds 2
        
        # Limpiar build de Android si existe
        if (Test-Path "android") {
            Push-Location "android"
            if (Test-Path "gradlew.bat") {
                .\gradlew.bat clean
            }
            Pop-Location
        }
        
        Write-ColorOutput "✅ Proyecto limpiado" "Green"
        return $true
    } catch {
        Write-ColorOutput "⚠️ Error durante limpieza: $_" "Yellow"
        return $true  # No es crítico
    }
}

# Función para configurar Android
function Set-AndroidConfiguration {
    Write-ColorOutput "🤖 Configurando Android..." "Yellow"
    
    # Verificar ADB
    try {
        $devices = adb devices
        Write-ColorOutput "✅ ADB disponible" "Green"
        
        # Mostrar dispositivos conectados
        $deviceLines = $devices -split "`n" | Where-Object { $_ -match "device$" }
        if ($deviceLines.Count -gt 0) {
            Write-ColorOutput "📱 Dispositivos Android conectados:" "Green"
            foreach ($line in $deviceLines) {
                Write-ColorOutput "   $line" "Cyan"
            }
        } else {
            Write-ColorOutput "⚠️ No hay dispositivos Android conectados" "Yellow"
            Write-ColorOutput "💡 Asegúrate de tener un emulador ejecutándose o dispositivo conectado" "Cyan"
        }
        
        # Configurar port forwarding
        Write-ColorOutput "🔗 Configurando port forwarding..." "Yellow"
        adb reverse tcp:3000 tcp:3000
        adb reverse tcp:8081 tcp:8081
        Write-ColorOutput "✅ Port forwarding configurado" "Green"
        
        return $true
    } catch {
        Write-ColorOutput "❌ Error configurando Android: $_" "Red"
        return $false
    }
}

# Función principal de ejecución
function Start-MobileApp {
    Write-ColorOutput "🚀 Iniciando UnionTech Mobile App..." "Cyan"
    Write-ColorOutput "================================================" "Cyan"
    
    # Verificar prerrequisitos
    if (-not (Test-Prerequisites)) {
        Write-ColorOutput "❌ Prerrequisitos no cumplidos" "Red"
        return
    }
    
    # Verificar backend
    if (-not (Test-Backend)) {
        Write-ColorOutput "❌ Backend no disponible" "Red"
        $response = Read-Host "¿Quieres continuar sin backend? (y/N)"
        if ($response -ne "y" -and $response -ne "Y") {
            return
        }
    }
    
    # Configurar ambiente
    if (-not (Set-Environment)) {
        Write-ColorOutput "❌ Error configurando ambiente" "Red"
        return
    }
    
    # Limpiar si se solicitó
    if ($Clean -or $Reset) {
        Clear-Project
    }
    
    # Instalar dependencias
    if (-not (Install-Dependencies)) {
        Write-ColorOutput "❌ Error instalando dependencias" "Red"
        return
    }
    
    # Configurar plataforma específica
    if ($Platform -eq "android") {
        if (-not (Set-AndroidConfiguration)) {
            Write-ColorOutput "❌ Error configurando Android" "Red"
            return
        }
    }
    
    # Ejecutar aplicación
    Write-ColorOutput "🚀 Ejecutando aplicación en $Platform..." "Green"
    Write-ColorOutput "================================================" "Green"
    
    try {
        if ($Platform -eq "android") {
            if ($Device) {
                npx react-native run-android --deviceId=$Device
            } else {
                npm run android
            }
        } elseif ($Platform -eq "ios") {
            if ($Device) {
                npx react-native run-ios --device="$Device"
            } else {
                npm run ios
            }
        } else {
            Write-ColorOutput "❌ Plataforma no soportada: $Platform" "Red"
            Write-ColorOutput "💡 Usa: android o ios" "Yellow"
        }
    } catch {
        Write-ColorOutput "❌ Error ejecutando aplicación: $_" "Red"
        Write-ColorOutput "💡 Intenta con --Clean para limpiar proyecto" "Yellow"
    }
}

# Mostrar ayuda
function Show-Help {
    Write-ColorOutput "📱 UnionTech Mobile App - Script de Ejecución" "Cyan"
    Write-ColorOutput "============================================" "Cyan"
    Write-ColorOutput ""
    Write-ColorOutput "Uso:" "White"
    Write-ColorOutput "  .\start-mobile-app.ps1 [opciones]" "Yellow"
    Write-ColorOutput ""
    Write-ColorOutput "Opciones:" "White"
    Write-ColorOutput "  -Platform <android|ios>  Plataforma a ejecutar (default: android)" "Gray"
    Write-ColorOutput "  -Clean                    Limpiar proyecto antes de ejecutar" "Gray"
    Write-ColorOutput "  -Reset                    Reset completo (igual que -Clean)" "Gray"
    Write-ColorOutput "  -Device <nombre>          Dispositivo específico" "Gray"
    Write-ColorOutput "  -Help                     Mostrar esta ayuda" "Gray"
    Write-ColorOutput ""
    Write-ColorOutput "Ejemplos:" "White"
    Write-ColorOutput "  .\start-mobile-app.ps1" "Yellow"
    Write-ColorOutput "  .\start-mobile-app.ps1 -Platform android -Clean" "Yellow"
    Write-ColorOutput "  .\start-mobile-app.ps1 -Platform ios" "Yellow"
    Write-ColorOutput "  .\start-mobile-app.ps1 -Device 'iPhone 14'" "Yellow"
    Write-ColorOutput ""
    Write-ColorOutput "Prerrequisitos:" "White"
    Write-ColorOutput "  • Node.js 16+" "Gray"
    Write-ColorOutput "  • Android Studio (para Android)" "Gray"
    Write-ColorOutput "  • Xcode (para iOS - solo macOS)" "Gray"
    Write-ColorOutput "  • Backend UnionTech ejecutándose" "Gray"
}

# Script principal
if ($args -contains "-Help" -or $args -contains "--help" -or $args -contains "-h") {
    Show-Help
    return
}

# Cambiar al directorio de la app móvil si no estamos ahí
$currentDir = Get-Location
$expectedPath = "mobile-app"

if (-not $currentDir.Path.EndsWith($expectedPath)) {
    if (Test-Path $expectedPath) {
        Write-ColorOutput "📂 Cambiando al directorio mobile-app..." "Yellow"
        Set-Location $expectedPath
    } else {
        Write-ColorOutput "❌ Directorio mobile-app no encontrado" "Red"
        Write-ColorOutput "💡 Ejecuta este script desde el directorio UNIONTECH" "Yellow"
        return
    }
}

# Ejecutar aplicación
Start-MobileApp

Write-ColorOutput ""
Write-ColorOutput "🎉 ¡Listo! La aplicación móvil debería estar ejecutándose." "Green"
Write-ColorOutput "💡 Para debugging, abre Chrome en: chrome://inspect" "Cyan"
Write-ColorOutput "📱 En el dispositivo: Shake → Enable Remote Debugging" "Cyan"
