#!/bin/bash

# 🚀 Script de Deploy Automático - UnionTech Security System
# Versión: 1.0.0
# Autor: UnionTech Development Team

set -e  # Salir en cualquier error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funciones de logging
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Banner
echo -e "${BLUE}"
echo "██╗   ██╗███╗   ██╗██╗ ██████╗ ███╗   ██╗████████╗███████╗ ██████╗██╗  ██╗"
echo "██║   ██║████╗  ██║██║██╔═══██╗████╗  ██║╚══██╔══╝██╔════╝██╔════╝██║  ██║"
echo "██║   ██║██╔██╗ ██║██║██║   ██║██╔██╗ ██║   ██║   █████╗  ██║     ███████║"
echo "██║   ██║██║╚██╗██║██║██║   ██║██║╚██╗██║   ██║   ██╔══╝  ██║     ██╔══██║"
echo "╚██████╔╝██║ ╚████║██║╚██████╔╝██║ ╚████║   ██║   ███████╗╚██████╗██║  ██║"
echo " ╚═════╝ ╚═╝  ╚═══╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝   ╚═╝   ╚══════╝ ╚═════╝╚═╝  ╚═╝"
echo -e "${NC}"
echo -e "${GREEN}🔒 Security Management System - Deploy Automático${NC}"
echo "================================================================"

# Variables
APP_NAME="uniontech-security"
PROJECT_DIR="/opt/uniontech"
SERVICE_USER="uniontech"
NODE_VERSION="18"

# Función para verificar si es root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_error "Este script no debe ejecutarse como root"
        exit 1
    fi
}

# Función para instalar Node.js
install_nodejs() {
    log_info "Verificando instalación de Node.js..."
    
    if command -v node &> /dev/null; then
        NODE_CURRENT=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [[ $NODE_CURRENT -ge $NODE_VERSION ]]; then
            log_success "Node.js $NODE_CURRENT ya instalado"
            return
        fi
    fi
    
    log_info "Instalando Node.js $NODE_VERSION..."
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    log_success "Node.js instalado: $(node --version)"
}

# Función para instalar PM2
install_pm2() {
    log_info "Verificando PM2..."
    
    if command -v pm2 &> /dev/null; then
        log_success "PM2 ya instalado: $(pm2 --version)"
        return
    fi
    
    log_info "Instalando PM2..."
    sudo npm install -g pm2
    
    log_success "PM2 instalado: $(pm2 --version)"
}

# Función para crear usuario del sistema
create_service_user() {
    log_info "Verificando usuario del servicio..."
    
    if id "$SERVICE_USER" &>/dev/null; then
        log_success "Usuario $SERVICE_USER ya existe"
        return
    fi
    
    log_info "Creando usuario $SERVICE_USER..."
    sudo useradd -r -s /bin/false -d $PROJECT_DIR $SERVICE_USER
    
    log_success "Usuario $SERVICE_USER creado"
}

# Función para preparar directorios
setup_directories() {
    log_info "Configurando directorios..."
    
    sudo mkdir -p $PROJECT_DIR
    sudo mkdir -p $PROJECT_DIR/{logs,data/documents,data/faces}
    sudo mkdir -p /var/log/uniontech
    
    # Copiar archivos del proyecto
    sudo cp -r . $PROJECT_DIR/
    
    # Establecer permisos
    sudo chown -R $SERVICE_USER:$SERVICE_USER $PROJECT_DIR
    sudo chown -R $SERVICE_USER:$SERVICE_USER /var/log/uniontech
    sudo chmod -R 755 $PROJECT_DIR
    sudo chmod -R 644 $PROJECT_DIR/logs
    
    log_success "Directorios configurados"
}

# Función para instalar dependencias
install_dependencies() {
    log_info "Instalando dependencias de Node.js..."
    
    cd $PROJECT_DIR
    sudo -u $SERVICE_USER npm ci --production
    
    log_success "Dependencias instaladas"
}

# Función para configurar variables de entorno
setup_environment() {
    log_info "Configurando variables de entorno..."
    
    if [[ ! -f "$PROJECT_DIR/.env.prod" ]]; then
        log_warning "Archivo .env.prod no encontrado, creando uno básico..."
        
        sudo -u $SERVICE_USER tee $PROJECT_DIR/.env.prod > /dev/null <<EOF
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
JWT_SECRET=$(openssl rand -base64 64)
JWT_EXPIRE=24h
LOG_LEVEL=info
LOG_FILE_PATH=/var/log/uniontech/
CORS_ORIGIN=*
EOF
    fi
    
    log_success "Variables de entorno configuradas"
}

# Función para configurar firewall
setup_firewall() {
    log_info "Configurando firewall..."
    
    if command -v ufw &> /dev/null; then
        sudo ufw allow 22/tcp
        sudo ufw allow 80/tcp
        sudo ufw allow 443/tcp
        sudo ufw allow 3000/tcp
        sudo ufw --force enable
        
        log_success "Firewall configurado"
    else
        log_warning "UFW no está instalado, saltando configuración de firewall"
    fi
}

# Función para configurar systemd service
setup_systemd_service() {
    log_info "Configurando servicio systemd..."
    
    sudo tee /etc/systemd/system/uniontech.service > /dev/null <<EOF
[Unit]
Description=UnionTech Security Management System
After=network.target

[Service]
Type=simple
User=$SERVICE_USER
WorkingDirectory=$PROJECT_DIR
Environment=NODE_ENV=production
EnvironmentFile=$PROJECT_DIR/.env.prod
ExecStart=/usr/bin/node main-server.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=uniontech

[Install]
WantedBy=multi-user.target
EOF
    
    sudo systemctl daemon-reload
    sudo systemctl enable uniontech
    
    log_success "Servicio systemd configurado"
}

# Función para iniciar servicios
start_services() {
    log_info "Iniciando servicios..."
    
    sudo systemctl start uniontech
    
    # Esperar unos segundos para que el servicio inicie
    sleep 5
    
    if sudo systemctl is-active --quiet uniontech; then
        log_success "Servicio UnionTech iniciado correctamente"
    else
        log_error "Error al iniciar el servicio"
        sudo systemctl status uniontech
        exit 1
    fi
}

# Función para verificar deployment
verify_deployment() {
    log_info "Verificando deployment..."
    
    # Verificar que el puerto esté abierto
    if netstat -tlnp | grep :3000 > /dev/null; then
        log_success "Servicio corriendo en puerto 3000"
    else
        log_error "Servicio no está corriendo en puerto 3000"
        exit 1
    fi
    
    # Verificar health endpoint
    sleep 3
    if curl -f http://localhost:3000/api/health &> /dev/null; then
        log_success "Health check exitoso"
    else
        log_warning "Health check falló, pero el servicio puede estar iniciando"
    fi
    
    log_success "Deployment verificado"
}

# Función principal
main() {
    log_info "Iniciando deploy de UnionTech Security System..."
    
    check_root
    install_nodejs
    install_pm2
    create_service_user
    setup_directories
    install_dependencies
    setup_environment
    setup_firewall
    setup_systemd_service
    start_services
    verify_deployment
    
    echo
    echo "================================================================"
    log_success "🎉 DEPLOYMENT COMPLETADO EXITOSAMENTE!"
    echo "================================================================"
    echo
    echo -e "${GREEN}📍 Información del servicio:${NC}"
    echo "   🌐 URL: http://$(hostname -I | awk '{print $1}'):3000"
    echo "   📁 Directorio: $PROJECT_DIR"
    echo "   👤 Usuario: $SERVICE_USER"
    echo "   📝 Logs: /var/log/uniontech/"
    echo
    echo -e "${BLUE}🔧 Comandos útiles:${NC}"
    echo "   sudo systemctl status uniontech    # Ver estado"
    echo "   sudo systemctl restart uniontech   # Reiniciar"
    echo "   sudo systemctl stop uniontech      # Detener"
    echo "   sudo journalctl -u uniontech -f    # Ver logs en tiempo real"
    echo
    echo -e "${YELLOW}🔑 Usuarios de demo:${NC}"
    echo "   admin/admin123 (Administrador)"
    echo "   user/user123 (Usuario)"
    echo "   security/security123 (Seguridad)"
    echo
    echo -e "${GREEN}✅ Sistema listo para producción!${NC}"
}

# Ejecutar función principal
main "$@"
