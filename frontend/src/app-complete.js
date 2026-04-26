// UnionTech Frontend con Roles y Vistas Diferenciadas
class UnionTechApp {
    constructor() {
        this.apiBaseUrl = 'http://localhost:3000/api';
        this.currentUser = null;
        this.currentRole = null;
        this.dashboardData = null;
        
        this.init();
    }

    async init() {
        console.log('🚀 Iniciando UnionTech App v2.0');
        
        // Verificar si hay una sesión activa
        const token = localStorage.getItem('uniontech_token');
        if (token) {
            try {
                await this.verifyToken(token);
                this.showRoleDashboard();
                return;
            } catch (error) {
                localStorage.removeItem('uniontech_token');
            }
        }
        
        this.showLogin();
    }

    // === SISTEMA DE AUTENTICACIÓN ===
    showLogin() {
        document.body.innerHTML = `
            <div class="login-container">
                <div class="login-card">
                    <div class="login-header">
                        <i class="fas fa-building login-icon"></i>
                        <h1>UnionTech</h1>
                        <p>Sistema de Control de Acceso</p>
                    </div>
                    
                    <form id="login-form" class="login-form">
                        <div class="form-group">
                            <label for="email">Usuario</label>
                            <input type="email" id="email" class="form-control" 
                                   placeholder="correo@ejemplo.com" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="password">Contraseña</label>
                            <input type="password" id="password" class="form-control" 
                                   placeholder="••••••••" required>
                        </div>
                        
                        <button type="submit" class="btn btn-primary btn-block">
                            <i class="fas fa-sign-in-alt me-2"></i>Iniciar Sesión
                        </button>
                    </form>
                    
                    <div id="login-error"></div>
                    
                    <div class="login-footer">
                        <div class="demo-accounts">
                            <h6>Cuentas de Demostración:</h6>
                            <div class="demo-grid">
                                <div class="demo-account" data-role="super_admin">
                                    <strong>Super Admin</strong><br>
                                    admin@uniontech.com<br>
                                    <small>admin123</small>
                                </div>
                                <div class="demo-account" data-role="building_admin">
                                    <strong>Admin Edificio</strong><br>
                                    admin.edificio@uniontech.com<br>
                                    <small>building123</small>
                                </div>
                                <div class="demo-account" data-role="security">
                                    <strong>Seguridad</strong><br>
                                    seguridad@uniontech.com<br>
                                    <small>security123</small>
                                </div>
                                <div class="demo-account" data-role="resident">
                                    <strong>Residente</strong><br>
                                    maria.garcia@email.com<br>
                                    <small>resident123</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <style>
                .login-container {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 20px;
                }
                
                .login-card {
                    background: white;
                    border-radius: 20px;
                    padding: 40px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                    max-width: 500px;
                    width: 100%;
                }
                
                .login-header {
                    text-align: center;
                    margin-bottom: 30px;
                }
                
                .login-icon {
                    font-size: 3rem;
                    color: #667eea;
                    margin-bottom: 15px;
                }
                
                .login-header h1 {
                    margin: 0;
                    color: #333;
                    font-weight: 700;
                }
                
                .login-header p {
                    color: #666;
                    margin: 5px 0 0 0;
                }
                
                .form-group {
                    margin-bottom: 20px;
                }
                
                .form-group label {
                    display: block;
                    margin-bottom: 5px;
                    color: #333;
                    font-weight: 500;
                }
                
                .form-control {
                    width: 100%;
                    padding: 12px 15px;
                    border: 2px solid #e1e5e9;
                    border-radius: 10px;
                    font-size: 16px;
                    transition: border-color 0.3s;
                    box-sizing: border-box;
                }
                
                .form-control:focus {
                    outline: none;
                    border-color: #667eea;
                }
                
                .btn {
                    padding: 12px 20px;
                    border: none;
                    border-radius: 10px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                
                .btn-primary {
                    background: #667eea;
                    color: white;
                }
                
                .btn-primary:hover {
                    background: #5a6fd8;
                    transform: translateY(-2px);
                }
                
                .btn-block {
                    width: 100%;
                }
                
                .demo-accounts {
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #e1e5e9;
                    text-align: center;
                }
                
                .demo-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                    margin-top: 15px;
                }
                
                .demo-account {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 10px;
                    cursor: pointer;
                    transition: background 0.3s;
                    font-size: 12px;
                }
                
                .demo-account:hover {
                    background: #e9ecef;
                }
                
                .alert {
                    padding: 15px;
                    border-radius: 10px;
                    margin-top: 20px;
                }
                
                .alert-danger {
                    background: #f8d7da;
                    border: 1px solid #f5c6cb;
                    color: #721c24;
                }
                
                .me-2 { margin-right: 8px; }
            </style>
        `;

        // Event listeners
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Demo account clicks
        document.querySelectorAll('.demo-account').forEach(account => {
            account.addEventListener('click', () => {
                const email = account.textContent.match(/[\w\.-]+@[\w\.-]+\.\w+/)[0];
                const password = account.querySelector('small').textContent;
                
                document.getElementById('email').value = email;
                document.getElementById('password').value = password;
            });
        });
    }

    async handleLogin() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('login-error');

        if (!email || !password) {
            errorDiv.innerHTML = '<div class="alert alert-danger">Todos los campos son requeridos</div>';
            return;
        }

        try {
            console.log('🔐 Intentando login con:', { email, password: '***' });
            
            const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            console.log('📊 Status de respuesta:', response.status);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Error HTTP ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                localStorage.setItem('uniontech_token', data.token);
                this.currentUser = data.user;
                this.currentRole = data.user.role;
                
                console.log('✅ Login exitoso! Rol:', this.currentRole);
                
                this.showRoleDashboard();
            } else {
                throw new Error(data.error || 'Error de autenticación');
            }
        } catch (error) {
            console.error('❌ Error de login:', error);
            errorDiv.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
        }
    }

    // === SISTEMA DE DASHBOARDS POR ROL ===
    async showRoleDashboard() {
        try {
            // Obtener datos del dashboard según el rol
            const response = await fetch(`${this.apiBaseUrl}/dashboard/${this.currentRole}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('uniontech_token')}`
                }
            });

            if (response.ok) {
                this.dashboardData = await response.json();
            }

            // Mostrar dashboard según el rol
            switch (this.currentRole) {
                case 'super_admin':
                    this.showSuperAdminDashboard();
                    break;
                case 'building_admin':
                    this.showBuildingAdminDashboard();
                    break;
                case 'security':
                    this.showSecurityDashboard();
                    break;
                case 'resident':
                    this.showResidentDashboard();
                    break;
                case 'guest':
                    this.showGuestDashboard();
                    break;
                case 'maintenance':
                    this.showMaintenanceDashboard();
                    break;
                default:
                    this.showLogin();
            }
        } catch (error) {
            console.error('Error cargando dashboard:', error);
            this.showLogin();
        }
    }

    // === DASHBOARDS ESPECÍFICOS POR ROL ===
    showSuperAdminDashboard() {
        document.body.innerHTML = `
            ${this.getNavbar('Super Administrador')}
            <div class="dashboard-container">
                <div class="dashboard-header">
                    <h1><i class="fas fa-crown me-2"></i>Panel de Super Administrador</h1>
                    <p>Control total del sistema UnionTech</p>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon bg-primary">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="stat-content">
                            <h3>1,248</h3>
                            <p>Usuarios Totales</p>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon bg-success">
                            <i class="fas fa-building"></i>
                        </div>
                        <div class="stat-content">
                            <h3>15</h3>
                            <p>Edificios Activos</p>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon bg-warning">
                            <i class="fas fa-shield-alt"></i>
                        </div>
                        <div class="stat-content">
                            <h3>24</h3>
                            <p>Alertas Pendientes</p>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon bg-info">
                            <i class="fas fa-server"></i>
                        </div>
                        <div class="stat-content">
                            <h3>99.9%</h3>
                            <p>Uptime Sistema</p>
                        </div>
                    </div>
                </div>
                
                <div class="dashboard-grid">
                    <div class="dashboard-card">
                        <div class="card-header">
                            <h3><i class="fas fa-chart-line me-2"></i>Actividad del Sistema</h3>
                        </div>
                        <div class="card-content">
                            <canvas id="system-chart"></canvas>
                        </div>
                    </div>
                    
                    <div class="dashboard-card">
                        <div class="card-header">
                            <h3><i class="fas fa-exclamation-triangle me-2"></i>Alertas Críticas</h3>
                        </div>
                        <div class="card-content">
                            <div class="alert-item">
                                <span class="alert-icon critical"><i class="fas fa-times"></i></span>
                                <span>Falla en servidor Edificio Torre C</span>
                                <span class="alert-time">Hace 5 min</span>
                            </div>
                            <div class="alert-item">
                                <span class="alert-icon warning"><i class="fas fa-exclamation"></i></span>
                                <span>Backup pendiente en Base de Datos</span>
                                <span class="alert-time">Hace 1 hora</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="dashboard-card">
                        <div class="card-header">
                            <h3><i class="fas fa-users-cog me-2"></i>Gestión de Usuarios</h3>
                        </div>
                        <div class="card-content">
                            <button class="btn btn-primary btn-block mb-2">
                                <i class="fas fa-user-plus me-2"></i>Crear Usuario
                            </button>
                            <button class="btn btn-outline-primary btn-block mb-2">
                                <i class="fas fa-users me-2"></i>Ver Todos los Usuarios
                            </button>
                            <button class="btn btn-outline-primary btn-block">
                                <i class="fas fa-user-shield me-2"></i>Gestionar Roles
                            </button>
                        </div>
                    </div>
                    
                    <div class="dashboard-card">
                        <div class="card-header">
                            <h3><i class="fas fa-database me-2"></i>Estado de Base de Datos</h3>
                        </div>
                        <div class="card-content">
                            <div class="db-status">
                                <div class="status-item">
                                    <span class="status-indicator online"></span>
                                    <span>Conexión Principal: Online</span>
                                </div>
                                <div class="status-item">
                                    <span class="status-indicator online"></span>
                                    <span>Backup Server: Online</span>
                                </div>
                                <div class="status-item">
                                    <span class="status-indicator warning"></span>
                                    <span>Último Backup: Hace 3 horas</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.loadDashboardStyles();
    }

    showResidentDashboard() {
        document.body.innerHTML = `
            ${this.getNavbar('Residente')}
            <div class="dashboard-container">
                <div class="dashboard-header">
                    <h1><i class="fas fa-home me-2"></i>Mi Hogar - ${this.currentUser.building} ${this.currentUser.unit}</h1>
                    <p>Gestiona tus invitados y accesos</p>
                </div>
                
                <div class="quick-actions">
                    <button class="quick-action-btn primary" onclick="app.showInviteGuestModal()">
                        <i class="fas fa-user-plus"></i>
                        <span>Invitar Huésped</span>
                    </button>
                    
                    <button class="quick-action-btn secondary" onclick="app.generateQR()">
                        <i class="fas fa-qrcode"></i>
                        <span>Generar QR</span>
                    </button>
                    
                    <button class="quick-action-btn tertiary" onclick="app.showMyHistory()">
                        <i class="fas fa-history"></i>
                        <span>Mi Historial</span>
                    </button>
                    
                    <button class="quick-action-btn quaternary" onclick="app.manageFamily()">
                        <i class="fas fa-users"></i>
                        <span>Mi Familia</span>
                    </button>
                </div>
                
                <div class="dashboard-grid">
                    <div class="dashboard-card">
                        <div class="card-header">
                            <h3><i class="fas fa-user-friends me-2"></i>Mis Invitados Activos</h3>
                            <button class="btn btn-sm btn-primary">Ver Todos</button>
                        </div>
                        <div class="card-content">
                            <div class="guest-list">
                                <div class="guest-item">
                                    <div class="guest-avatar">
                                        <i class="fas fa-user"></i>
                                    </div>
                                    <div class="guest-info">
                                        <h4>Ana Pérez</h4>
                                        <p>Visita temporal</p>
                                        <small>Acceso hasta: 03/09/2025 18:00</small>
                                    </div>
                                    <div class="guest-status">
                                        <span class="status-badge active">Activo</span>
                                    </div>
                                </div>
                                
                                <div class="guest-item">
                                    <div class="guest-avatar">
                                        <i class="fas fa-user"></i>
                                    </div>
                                    <div class="guest-info">
                                        <h4>Carlos López</h4>
                                        <p>Personal de limpieza</p>
                                        <small>Acceso recurrente: Martes y Viernes</small>
                                    </div>
                                    <div class="guest-status">
                                        <span class="status-badge pending">Pendiente</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="dashboard-card">
                        <div class="card-header">
                            <h3><i class="fas fa-clock me-2"></i>Historial Reciente</h3>
                        </div>
                        <div class="card-content">
                            <div class="history-list">
                                <div class="history-item">
                                    <div class="history-icon success">
                                        <i class="fas fa-sign-in-alt"></i>
                                    </div>
                                    <div class="history-info">
                                        <p><strong>María García</strong> ingresó</p>
                                        <small>Hoy 14:30 - Entrada principal</small>
                                    </div>
                                </div>
                                
                                <div class="history-item">
                                    <div class="history-icon info">
                                        <i class="fas fa-user-check"></i>
                                    </div>
                                    <div class="history-info">
                                        <p><strong>Ana Pérez</strong> fue aprobada</p>
                                        <small>Hoy 12:15 - Por administración</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="dashboard-card">
                        <div class="card-header">
                            <h3><i class="fas fa-qrcode me-2"></i>Mis Códigos QR</h3>
                        </div>
                        <div class="card-content">
                            <div class="qr-list">
                                <div class="qr-item">
                                    <div class="qr-code-preview">
                                        <i class="fas fa-qrcode"></i>
                                    </div>
                                    <div class="qr-info">
                                        <h4>QR Personal</h4>
                                        <p>Acceso permanente</p>
                                        <button class="btn btn-sm btn-outline-primary">Mostrar</button>
                                    </div>
                                </div>
                                
                                <div class="qr-item">
                                    <div class="qr-code-preview">
                                        <i class="fas fa-qrcode"></i>
                                    </div>
                                    <div class="qr-info">
                                        <h4>QR Invitado</h4>
                                        <p>Para Ana Pérez</p>
                                        <button class="btn btn-sm btn-outline-secondary">Compartir</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="dashboard-card">
                        <div class="card-header">
                            <h3><i class="fas fa-bell me-2"></i>Notificaciones</h3>
                        </div>
                        <div class="card-content">
                            <div class="notification-list">
                                <div class="notification-item">
                                    <i class="fas fa-info-circle text-info"></i>
                                    <span>Tu invitado Ana Pérez llegó al edificio</span>
                                    <small>Hace 15 min</small>
                                </div>
                                
                                <div class="notification-item">
                                    <i class="fas fa-exclamation-triangle text-warning"></i>
                                    <span>Solicitud de Carlos López pendiente de aprobación</span>
                                    <small>Hace 2 horas</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Modal para Invitar Huésped -->
            <div id="invite-guest-modal" class="modal" style="display: none;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Invitar Nuevo Huésped</h3>
                        <button class="modal-close" onclick="app.closeModal('invite-guest-modal')">&times;</button>
                    </div>
                    <div class="modal-body">
                        ${this.getInviteGuestForm()}
                    </div>
                </div>
            </div>
        `;
        
        this.loadDashboardStyles();
    }

    // === UTILIDADES ===
    getNavbar(roleTitle) {
        return `
            <nav class="navbar">
                <div class="navbar-brand">
                    <i class="fas fa-building me-2"></i>
                    <span>UnionTech</span>
                </div>
                
                <div class="navbar-center">
                    <h4>${roleTitle}</h4>
                </div>
                
                <div class="navbar-end">
                    <div class="user-info">
                        <span class="user-name">${this.currentUser?.name || 'Usuario'}</span>
                        <div class="user-avatar">
                            <i class="fas fa-user"></i>
                        </div>
                    </div>
                    <button class="btn btn-outline-light btn-sm" onclick="app.logout()">
                        <i class="fas fa-sign-out-alt me-1"></i>Salir
                    </button>
                </div>
            </nav>
        `;
    }

    getInviteGuestForm() {
        return `
            <form id="invite-guest-form">
                <div class="form-row">
                    <div class="form-group">
                        <label>Tipo de Invitación</label>
                        <select class="form-control" name="type" required>
                            <option value="temporal">Visita Temporal</option>
                            <option value="recurrente">Acceso Recurrente</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Nombre Completo</label>
                        <input type="text" class="form-control" name="name" required 
                               placeholder="Nombre del invitado">
                    </div>
                    
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" class="form-control" name="email" 
                               placeholder="correo@ejemplo.com">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Teléfono</label>
                        <input type="tel" class="form-control" name="phone" 
                               placeholder="+1234567890">
                    </div>
                    
                    <div class="form-group">
                        <label>Fecha y Hora de Acceso</label>
                        <input type="datetime-local" class="form-control" name="accessDate" required>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Áreas Permitidas</label>
                    <div class="checkbox-group">
                        <label class="checkbox-item">
                            <input type="checkbox" name="areas" value="lobby" checked> Lobby
                        </label>
                        <label class="checkbox-item">
                            <input type="checkbox" name="areas" value="elevator" checked> Ascensor
                        </label>
                        <label class="checkbox-item">
                            <input type="checkbox" name="areas" value="gym"> Gimnasio
                        </label>
                        <label class="checkbox-item">
                            <input type="checkbox" name="areas" value="pool"> Piscina
                        </label>
                        <label class="checkbox-item">
                            <input type="checkbox" name="areas" value="parking"> Estacionamiento
                        </label>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="app.closeModal('invite-guest-modal')">
                        Cancelar
                    </button>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-paper-plane me-2"></i>Enviar Invitación
                    </button>
                </div>
            </form>
        `;
    }

    loadDashboardStyles() {
        if (!document.getElementById('dashboard-styles')) {
            const style = document.createElement('style');
            style.id = 'dashboard-styles';
            style.textContent = `
                * { margin: 0; padding: 0; box-sizing: border-box; }
                
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: #f5f7fa;
                    color: #333;
                }
                
                .navbar {
                    background: #2c3e50;
                    color: white;
                    padding: 1rem 2rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                
                .navbar-brand {
                    display: flex;
                    align-items: center;
                    font-size: 1.5rem;
                    font-weight: 700;
                }
                
                .navbar-center h4 {
                    margin: 0;
                    color: #ecf0f1;
                }
                
                .navbar-end {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
                
                .user-info {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                
                .user-avatar {
                    width: 40px;
                    height: 40px;
                    background: #34495e;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .dashboard-container {
                    padding: 2rem;
                    max-width: 1400px;
                    margin: 0 auto;
                }
                
                .dashboard-header {
                    margin-bottom: 2rem;
                }
                
                .dashboard-header h1 {
                    color: #2c3e50;
                    margin-bottom: 0.5rem;
                }
                
                .dashboard-header p {
                    color: #7f8c8d;
                    font-size: 1.1rem;
                }
                
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                }
                
                .stat-card {
                    background: white;
                    border-radius: 15px;
                    padding: 1.5rem;
                    display: flex;
                    align-items: center;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.08);
                    transition: transform 0.3s;
                }
                
                .stat-card:hover {
                    transform: translateY(-5px);
                }
                
                .stat-icon {
                    width: 60px;
                    height: 60px;
                    border-radius: 15px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 1.5rem;
                    margin-right: 1rem;
                }
                
                .bg-primary { background: #3498db; }
                .bg-success { background: #2ecc71; }
                .bg-warning { background: #f39c12; }
                .bg-info { background: #9b59b6; }
                
                .stat-content h3 {
                    font-size: 2rem;
                    font-weight: 700;
                    color: #2c3e50;
                    margin-bottom: 0.25rem;
                }
                
                .stat-content p {
                    color: #7f8c8d;
                    font-size: 0.9rem;
                }
                
                .quick-actions {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1rem;
                    margin-bottom: 2rem;
                }
                
                .quick-action-btn {
                    background: white;
                    border: none;
                    border-radius: 15px;
                    padding: 1.5rem;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.5rem;
                    cursor: pointer;
                    transition: all 0.3s;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.08);
                }
                
                .quick-action-btn:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
                }
                
                .quick-action-btn i {
                    font-size: 2rem;
                    margin-bottom: 0.5rem;
                }
                
                .quick-action-btn.primary i { color: #3498db; }
                .quick-action-btn.secondary i { color: #2ecc71; }
                .quick-action-btn.tertiary i { color: #f39c12; }
                .quick-action-btn.quaternary i { color: #9b59b6; }
                
                .dashboard-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                    gap: 1.5rem;
                }
                
                .dashboard-card {
                    background: white;
                    border-radius: 15px;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.08);
                    overflow: hidden;
                }
                
                .card-header {
                    padding: 1.5rem;
                    border-bottom: 1px solid #ecf0f1;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .card-header h3 {
                    color: #2c3e50;
                    font-size: 1.1rem;
                    font-weight: 600;
                }
                
                .card-content {
                    padding: 1.5rem;
                }
                
                .guest-list, .history-list, .notification-list, .qr-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                
                .guest-item, .history-item, .qr-item {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1rem;
                    background: #f8f9fa;
                    border-radius: 10px;
                }
                
                .guest-avatar, .qr-code-preview {
                    width: 50px;
                    height: 50px;
                    background: #bdc3c7;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                }
                
                .guest-info, .history-info, .qr-info {
                    flex: 1;
                }
                
                .guest-info h4, .qr-info h4 {
                    margin-bottom: 0.25rem;
                    color: #2c3e50;
                }
                
                .guest-info p, .qr-info p {
                    color: #7f8c8d;
                    font-size: 0.9rem;
                    margin-bottom: 0.25rem;
                }
                
                .guest-info small {
                    color: #95a5a6;
                    font-size: 0.8rem;
                }
                
                .status-badge {
                    padding: 0.25rem 0.75rem;
                    border-radius: 15px;
                    font-size: 0.8rem;
                    font-weight: 600;
                }
                
                .status-badge.active {
                    background: #d5f4e6;
                    color: #27ae60;
                }
                
                .status-badge.pending {
                    background: #fef5e7;
                    color: #f39c12;
                }
                
                .history-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                }
                
                .history-icon.success { background: #2ecc71; }
                .history-icon.info { background: #3498db; }
                
                .notification-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.75rem;
                    background: #f8f9fa;
                    border-radius: 8px;
                }
                
                .btn {
                    padding: 0.5rem 1rem;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.3s;
                    text-decoration: none;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                }
                
                .btn-primary {
                    background: #3498db;
                    color: white;
                }
                
                .btn-primary:hover {
                    background: #2980b9;
                }
                
                .btn-secondary {
                    background: #95a5a6;
                    color: white;
                }
                
                .btn-outline-primary {
                    background: transparent;
                    color: #3498db;
                    border: 2px solid #3498db;
                }
                
                .btn-outline-primary:hover {
                    background: #3498db;
                    color: white;
                }
                
                .btn-outline-light {
                    background: transparent;
                    color: white;
                    border: 2px solid rgba(255,255,255,0.3);
                }
                
                .btn-block {
                    width: 100%;
                }
                
                .btn-sm {
                    padding: 0.375rem 0.75rem;
                    font-size: 0.875rem;
                }
                
                .mb-2 { margin-bottom: 0.5rem; }
                .me-1 { margin-right: 0.25rem; }
                .me-2 { margin-right: 0.5rem; }
                
                .modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.7);
                    z-index: 1000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .modal-content {
                    background: white;
                    border-radius: 15px;
                    max-width: 600px;
                    width: 90%;
                    max-height: 90vh;
                    overflow: auto;
                }
                
                .modal-header {
                    padding: 1.5rem;
                    border-bottom: 1px solid #ecf0f1;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .modal-close {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: #95a5a6;
                }
                
                .modal-body {
                    padding: 1.5rem;
                }
                
                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                    margin-bottom: 1rem;
                }
                
                .form-group {
                    margin-bottom: 1rem;
                }
                
                .form-group label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-weight: 600;
                    color: #2c3e50;
                }
                
                .form-control {
                    width: 100%;
                    padding: 0.75rem;
                    border: 2px solid #ecf0f1;
                    border-radius: 8px;
                    font-size: 1rem;
                    transition: border-color 0.3s;
                }
                
                .form-control:focus {
                    outline: none;
                    border-color: #3498db;
                }
                
                .checkbox-group {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 0.5rem;
                }
                
                .checkbox-item {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem;
                    background: #f8f9fa;
                    border-radius: 6px;
                    cursor: pointer;
                }
                
                .form-actions {
                    display: flex;
                    gap: 1rem;
                    justify-content: flex-end;
                    margin-top: 2rem;
                }
                
                @media (max-width: 768px) {
                    .dashboard-container {
                        padding: 1rem;
                    }
                    
                    .navbar {
                        padding: 1rem;
                        flex-direction: column;
                        gap: 1rem;
                    }
                    
                    .form-row {
                        grid-template-columns: 1fr;
                    }
                    
                    .stats-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .quick-actions {
                        grid-template-columns: 1fr 1fr;
                    }
                    
                    .dashboard-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // === ACCIONES DE RESIDENTE ===
    showInviteGuestModal() {
        document.getElementById('invite-guest-modal').style.display = 'flex';
        
        // Agregar event listener al formulario
        document.getElementById('invite-guest-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleInviteGuest(e);
        });
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    async handleInviteGuest(e) {
        const formData = new FormData(e.target);
        const areas = Array.from(formData.getAll('areas'));
        
        const guestData = {
            guestName: formData.get('name'),
            guestEmail: formData.get('email'),
            guestPhone: formData.get('phone'),
            accessDates: [formData.get('accessDate')],
            areas: areas,
            type: formData.get('type')
        };

        try {
            const response = await fetch(`${this.apiBaseUrl}/guests/invite`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('uniontech_token')}`
                },
                body: JSON.stringify(guestData)
            });

            if (response.ok) {
                const result = await response.json();
                alert('¡Invitación enviada exitosamente!');
                this.closeModal('invite-guest-modal');
                this.showRoleDashboard(); // Recargar dashboard
            } else {
                throw new Error('Error al enviar invitación');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al enviar la invitación');
        }
    }

    generateQR() {
        alert('Funcionalidad de generación QR próximamente...');
    }

    showMyHistory() {
        alert('Mostrando historial de accesos...');
    }

    manageFamily() {
        alert('Gestión de familia próximamente...');
    }

    logout() {
        localStorage.removeItem('uniontech_token');
        this.currentUser = null;
        this.currentRole = null;
        this.showLogin();
    }
}

// Inicializar aplicación
const app = new UnionTechApp();
window.app = app;
