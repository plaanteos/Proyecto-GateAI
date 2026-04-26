# UnionTech MVP - Script de Inicio
# Version sin caracteres especiales para compatibilidad

param(
    [switch]$Force
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "UnionTech MVP - Sistema de Arranque" -ForegroundColor White
Write-Host "==========================================" -ForegroundColor Cyan

function Test-Port {
    param($Port)
    try {
        $Connection = Test-NetConnection localhost -Port $Port -InformationLevel Quiet -WarningAction SilentlyContinue
        return $Connection
    } catch {
        return $false
    }
}

function Stop-ExistingProcesses {
    Write-Host "Deteniendo procesos existentes..." -ForegroundColor Yellow
    Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 3
    Write-Host "Procesos detenidos." -ForegroundColor Green
}

function Start-Backend {
    Write-Host "Iniciando Backend MVP (Puerto 3000)..." -ForegroundColor Green
    
    $BackendJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        node backend-mvp.js
    }
    
    # Esperar a que el backend esté listo
    $Timeout = 30
    $Timer = 0
    
    do {
        Start-Sleep -Seconds 2
        $Timer += 2
        $BackendReady = Test-Port -Port 3000
        Write-Host "Esperando backend... ($Timer/$Timeout)" -ForegroundColor Yellow
    } while (-not $BackendReady -and $Timer -lt $Timeout)
    
    if ($BackendReady) {
        Write-Host "Backend MVP iniciado correctamente!" -ForegroundColor Green
        return $BackendJob
    } else {
        Write-Host "Error: Backend no responde en puerto 3000" -ForegroundColor Red
        Stop-Job $BackendJob -ErrorAction SilentlyContinue
        Remove-Job $BackendJob -ErrorAction SilentlyContinue
        return $null
    }
}

function Start-Frontend {
    Write-Host "Iniciando Frontend MVP (Puerto 8080)..." -ForegroundColor Green
    
    $FrontendJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        node frontend-mvp-server.js
    }
    
    # Esperar a que el frontend esté listo
    $Timeout = 20
    $Timer = 0
    
    do {
        Start-Sleep -Seconds 2
        $Timer += 2
        $FrontendReady = Test-Port -Port 8080
        Write-Host "Esperando frontend... ($Timer/$Timeout)" -ForegroundColor Yellow
    } while (-not $FrontendReady -and $Timer -lt $Timeout)
    
    if ($FrontendReady) {
        Write-Host "Frontend MVP iniciado correctamente!" -ForegroundColor Green
        return $FrontendJob
    } else {
        Write-Host "Error: Frontend no responde en puerto 8080" -ForegroundColor Red
        Stop-Job $FrontendJob -ErrorAction SilentlyContinue
        Remove-Job $FrontendJob -ErrorAction SilentlyContinue
        return $null
    }
}

function Open-Browser {
    Write-Host "Abriendo navegador..." -ForegroundColor Green
    Start-Sleep -Seconds 3
    Start-Process "http://localhost:8080"
}

function Show-SystemStatus {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "ESTADO DEL SISTEMA MVP" -ForegroundColor White
    Write-Host "========================================" -ForegroundColor Cyan
    
    $BackendStatus = if (Test-Port -Port 3000) { "ACTIVO" } else { "INACTIVO" }
    $FrontendStatus = if (Test-Port -Port 8080) { "ACTIVO" } else { "INACTIVO" }
    
    Write-Host "Backend (3000):  $BackendStatus" -ForegroundColor $(if ($BackendStatus -eq "ACTIVO") { "Green" } else { "Red" })
    Write-Host "Frontend (8080): $FrontendStatus" -ForegroundColor $(if ($FrontendStatus -eq "ACTIVO") { "Green" } else { "Red" })
    
    if ($BackendStatus -eq "ACTIVO" -and $FrontendStatus -eq "ACTIVO") {
        Write-Host ""
        Write-Host "URL de Acceso: http://localhost:8080" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "USUARIOS DE PRUEBA:" -ForegroundColor Cyan
        Write-Host "Admin:     admin / admin123" -ForegroundColor White
        Write-Host "Seguridad: security / security123" -ForegroundColor White
        Write-Host "Operador:  operator / operator123" -ForegroundColor White
        Write-Host "Empleado:  employee / employee123" -ForegroundColor White
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
}

# INICIO DEL SCRIPT PRINCIPAL
try {
    # Limpiar procesos existentes si está forzado
    if ($Force) {
        Stop-ExistingProcesses
    }
    
    # Verificar archivos necesarios
    $RequiredFiles = @("backend-mvp.js", "frontend-mvp-server.js", "frontend\index-mvp.html", "frontend\js\app-mvp.js")
    $MissingFiles = @()
    
    foreach ($File in $RequiredFiles) {
        if (-not (Test-Path $File)) {
            $MissingFiles += $File
        }
    }
    
    if ($MissingFiles.Count -gt 0) {
        Write-Host "Error: Archivos faltantes:" -ForegroundColor Red
        $MissingFiles | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
        exit 1
    }
    
    # Verificar si los puertos están ocupados
    if ((Test-Port -Port 3000) -or (Test-Port -Port 8080)) {
        if (-not $Force) {
            Write-Host "Advertencia: Algunos puertos están ocupados." -ForegroundColor Yellow
            Write-Host "Use -Force para detener procesos existentes." -ForegroundColor Yellow
            Show-SystemStatus
            exit 0
        }
    }
    
    # Iniciar servicios
    Write-Host "Iniciando sistema UnionTech MVP..." -ForegroundColor Cyan
    Write-Host ""
    
    # 1. Iniciar Backend
    $BackendJob = Start-Backend
    if (-not $BackendJob) {
        Write-Host "Error critico: No se pudo iniciar el backend" -ForegroundColor Red
        exit 1
    }
    
    # 2. Iniciar Frontend
    $FrontendJob = Start-Frontend
    if (-not $FrontendJob) {
        Write-Host "Error critico: No se pudo iniciar el frontend" -ForegroundColor Red
        # Limpiar backend
        Stop-Job $BackendJob -ErrorAction SilentlyContinue
        Remove-Job $BackendJob -ErrorAction SilentlyContinue
        exit 1
    }
    
    # 3. Mostrar estado y abrir navegador
    Show-SystemStatus
    Open-Browser
    
    # 4. Monitoreo del sistema
    Write-Host "Presione Ctrl+C para detener el sistema..." -ForegroundColor Yellow
    Write-Host ""
    
    try {
        while ($true) {
            Start-Sleep -Seconds 5
            
            # Verificar que ambos servicios sigan activos
            $BackendAlive = Test-Port -Port 3000
            $FrontendAlive = Test-Port -Port 8080
            
            if (-not $BackendAlive -or -not $FrontendAlive) {
                Write-Host "Error: Algunos servicios han fallado" -ForegroundColor Red
                break
            }
            
            # Mostrar estado cada 30 segundos
            $Timestamp = Get-Date -Format "HH:mm:ss"
            Write-Host "[$Timestamp] Sistema funcionando..." -ForegroundColor Green
        }
    } catch [System.Management.Automation.PipelineStoppedException] {
        Write-Host ""
        Write-Host "Deteniendo sistema..." -ForegroundColor Yellow
    }
    
} catch {
    Write-Host ""
    Write-Host "Error inesperado: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    # Limpiar trabajos
    Write-Host ""
    Write-Host "Limpiando procesos..." -ForegroundColor Yellow
    
    Get-Job | Stop-Job -ErrorAction SilentlyContinue
    Get-Job | Remove-Job -ErrorAction SilentlyContinue
    
    # Detener procesos Node.js
    Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force -ErrorAction SilentlyContinue
    
    Write-Host "Sistema detenido." -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Cyan
}
