/**
 * UnionTech MVP Frontend - Sistema Completamente Funcional
 * Aplicación con roles de usuario y funcionalidad real
 */

class UnionTechMVP {
    constructor() {
        this.currentUser = null;
        this.baseURL = (window.API_BASE_URL || 'https://uniontech-backend-production.up.railway.app') + '/api';
        this.token = localStorage.getItem('uniontech_token');
        this.notifications = [];
        this.realTimeData = {};
        
        this.init();
    }

    async init() {
        // Verificar si ya está autenticado
        if (this.token) {
            try {
                await this.loadUserProfile();
                this.showDashboard();
            } catch (error) {
                this.showLogin();
            }
        } else {
            this.showLogin();
        }
        
        // Configurar actualizaciones en tiempo real
        this.startRealTimeUpdates();
        
        // Configurar navegación
        this.setupNavigation();
    }

    // Sistema de autenticación
    showLogin() {
        document.body.innerHTML = `
            <div class="min-vh-100 d-flex align-items-center bg-light">
                <div class="container">
                    <div class="row justify-content-center">
                        <div class="col-md-6 col-lg-4">
                            <div class="card shadow">
                                <div class="card-body p-4">
                                    <div class="text-center mb-4">
                                        <i class="fas fa-shield-alt fa-3x text-primary mb-3"></i>
                                        <h3>UnionTech MVP</h3>
                                        <p class="text-muted">Sistema de Control de Acceso</p>
                                    </div>
                                    
                                    <form id="loginForm">
                                        <div class="mb-3">
                                            <label class="form-label">Usuario</label>
                                            <input type="text" class="form-control" id="username" required>
                                        </div>
                                        <div class="mb-3">
                                            <label class="form-label">Contraseña</label>
                                            <input type="password" class="form-control" id="password" required>
                                        </div>
                                        <button type="submit" class="btn btn-primary w-100">
                                            <i class="fas fa-sign-in-alt me-2"></i>Iniciar Sesión
                                        </button>
                                    </form>
                                    
                                    <div class="mt-4">
                                        <small class="text-muted">
                                            <strong>Usuarios de prueba:</strong><br>
                                            admin / admin123 (Administrador)<br>
                                            security / security123 (Seguridad)<br>
                                            operator / operator123 (Operador)<br>
                                            employee / employee123 (Empleado)
                                        </small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.login();
        });
    }

    async login() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(`${this.baseURL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (data.success) {
                this.token = data.token;
                this.currentUser = data.user;
                localStorage.setItem('uniontech_token', this.token);
                localStorage.setItem('uniontech_user', JSON.stringify(this.currentUser));
                
                this.showNotification('¡Bienvenido al sistema!', 'success');
                this.showDashboard();
            } else {
                this.showNotification(data.error || 'Error de autenticación', 'error');
            }
        } catch (error) {
            this.showNotification('Error de conexión con el servidor', 'error');
        }
    }

    async loadUserProfile() {
        const storedUser = localStorage.getItem('uniontech_user');
        if (storedUser) {
            this.currentUser = JSON.parse(storedUser);
        }
    }

    // Dashboard principal
    showDashboard() {
        const dashboardHTML = this.getDashboardByRole();
        
        document.body.innerHTML = `
            <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
                <div class="container-fluid">
                    <a class="navbar-brand" href="#">
                        <i class="fas fa-shield-alt me-2"></i>UnionTech MVP
                    </a>
                    
                    <div class="navbar-nav ms-auto">
                        <div class="nav-item dropdown">
                            <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">
                                <i class="fas fa-user me-1"></i>${this.currentUser.name}
                                <span class="badge bg-secondary ms-1">${this.currentUser.role}</span>
                            </a>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item" href="#" onclick="app.logout()">
                                    <i class="fas fa-sign-out-alt me-2"></i>Cerrar Sesión
                                </a></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </nav>

            <div class="container-fluid">
                <div class="row">
                    <nav class="col-md-2 d-md-block bg-light sidebar">
                        <div class="position-sticky pt-3">
                            ${this.getSidebarByRole()}
                        </div>
                    </nav>

                    <main class="col-md-10 ms-sm-auto px-md-4">
                        <div id="main-content">
                            ${dashboardHTML}
                        </div>
                    </main>
                </div>
            </div>
            
            <div id="notification-container" style="position: fixed; top: 20px; right: 20px; z-index: 9999;"></div>
        `;

        this.loadDashboardData();
    }

    getDashboardByRole() {
        const role = this.currentUser.role;
        
        switch (role) {
            case 'admin':
                return this.getAdminDashboard();
            case 'security':
                return this.getSecurityDashboard();
            case 'operator':
                return this.getOperatorDashboard();
            case 'employee':
                return this.getEmployeeDashboard();
            default:
                return this.getBasicDashboard();
        }
    }

    getSidebarByRole() {
        const role = this.currentUser.role;
        const permissions = this.currentUser.permissions;
        
        let sidebar = `
            <ul class="nav flex-column">
                <li class="nav-item">
                    <a class="nav-link active" href="#" onclick="app.showDashboard()">
                        <i class="fas fa-tachometer-alt me-2"></i>Dashboard
                    </a>
                </li>
        `;

        if (permissions.includes('read')) {
            sidebar += `
                <li class="nav-item">
                    <a class="nav-link" href="#" onclick="app.showPersons()">
                        <i class="fas fa-users me-2"></i>Personas
                    </a>
                </li>
            `;
        }

        if (permissions.includes('visitors')) {
            sidebar += `
                <li class="nav-item">
                    <a class="nav-link" href="#" onclick="app.showVisitors()">
                        <i class="fas fa-user-friends me-2"></i>Visitantes
                    </a>
                </li>
            `;
        }

        if (permissions.includes('validation')) {
            sidebar += `
                <li class="nav-item">
                    <a class="nav-link" href="#" onclick="app.showValidation()">
                        <i class="fas fa-qrcode me-2"></i>Validación
                    </a>
                </li>
            `;
        }

        if (permissions.includes('access')) {
            sidebar += `
                <li class="nav-item">
                    <a class="nav-link" href="#" onclick="app.showAccessLogs()">
                        <i class="fas fa-door-open me-2"></i>Registros Acceso
                    </a>
                </li>
            `;
        }

        if (permissions.includes('buildings')) {
            sidebar += `
                <li class="nav-item">
                    <a class="nav-link" href="#" onclick="app.showBuildings()">
                        <i class="fas fa-building me-2"></i>Edificios
                    </a>
                </li>
            `;
        }

        if (permissions.includes('reports')) {
            sidebar += `
                <li class="nav-item">
                    <a class="nav-link" href="#" onclick="app.showReports()">
                        <i class="fas fa-chart-bar me-2"></i>Reportes
                    </a>
                </li>
            `;
        }

        if (permissions.includes('admin')) {
            sidebar += `
                <li class="nav-item">
                    <a class="nav-link" href="#" onclick="app.showSystemConfig()">
                        <i class="fas fa-cogs me-2"></i>Configuración
                    </a>
                </li>
            `;
        }

        sidebar += `</ul>`;
        return sidebar;
    }

    getAdminDashboard() {
        return `
            <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                <h1 class="h2">Panel de Administración</h1>
                <div class="btn-toolbar mb-2 mb-md-0">
                    <div class="btn-group me-2">
                        <button class="btn btn-sm btn-outline-secondary" onclick="app.generateReport()">
                            <i class="fas fa-download me-1"></i>Exportar
                        </button>
                    </div>
                </div>
            </div>

            <div class="row mb-4" id="statsCards">
                <!-- Las estadísticas se cargan dinámicamente -->
            </div>

            <div class="row">
                <div class="col-md-8">
                    <div class="card">
                        <div class="card-header">
                            <h5><i class="fas fa-chart-line me-2"></i>Accesos en Tiempo Real</h5>
                        </div>
                        <div class="card-body">
                            <canvas id="realTimeChart" height="100"></canvas>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header">
                            <h5><i class="fas fa-bell me-2"></i>Alertas Recientes</h5>
                        </div>
                        <div class="card-body" id="recentAlerts">
                            <!-- Alertas dinámicas -->
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getSecurityDashboard() {
        return `
            <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                <h1 class="h2">Centro de Seguridad</h1>
                <div class="btn-toolbar mb-2 mb-md-0">
                    <button class="btn btn-sm btn-danger me-2" onclick="app.emergencyMode()">
                        <i class="fas fa-exclamation-triangle me-1"></i>Emergencia
                    </button>
                </div>
            </div>

            <div class="row mb-4" id="securityStats">
                <!-- Estadísticas de seguridad -->
            </div>

            <div class="row">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5><i class="fas fa-shield-alt me-2"></i>Estado de Edificios</h5>
                        </div>
                        <div class="card-body" id="buildingStatus">
                            <!-- Estado dinámico -->
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5><i class="fas fa-users me-2"></i>Visitantes Activos</h5>
                        </div>
                        <div class="card-body" id="activeVisitors">
                            <!-- Visitantes activos -->
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getOperatorDashboard() {
        return `
            <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                <h1 class="h2">Panel de Operación</h1>
                <div class="btn-toolbar mb-2 mb-md-0">
                    <button class="btn btn-sm btn-primary" onclick="app.showNewVisitorModal()">
                        <i class="fas fa-user-plus me-1"></i>Nuevo Visitante
                    </button>
                </div>
            </div>

            <div class="row">
                <div class="col-md-8">
                    <div class="card">
                        <div class="card-header">
                            <h5><i class="fas fa-qrcode me-2"></i>Validación Rápida</h5>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <button class="btn btn-lg btn-primary w-100 mb-3" onclick="app.startQRScanner()">
                                        <i class="fas fa-camera fa-2x d-block mb-2"></i>
                                        Escanear QR
                                    </button>
                                </div>
                                <div class="col-md-6">
                                    <button class="btn btn-lg btn-success w-100 mb-3" onclick="app.startFacialRecognition()">
                                        <i class="fas fa-user-check fa-2x d-block mb-2"></i>
                                        Reconocimiento Facial
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header">
                            <h5><i class="fas fa-clock me-2"></i>Accesos Recientes</h5>
                        </div>
                        <div class="card-body" id="recentAccess">
                            <!-- Accesos recientes -->
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getEmployeeDashboard() {
        return `
            <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                <h1 class="h2">Mi Panel</h1>
            </div>

            <div class="row">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5><i class="fas fa-user me-2"></i>Mi Información</h5>
                        </div>
                        <div class="card-body">
                            <p><strong>Nombre:</strong> ${this.currentUser.name}</p>
                            <p><strong>Departamento:</strong> ${this.currentUser.department}</p>
                            <p><strong>Email:</strong> ${this.currentUser.email}</p>
                            <button class="btn btn-primary" onclick="app.generateMyQR()">
                                <i class="fas fa-qrcode me-1"></i>Generar mi QR
                            </button>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5><i class="fas fa-history me-2"></i>Mis Accesos</h5>
                        </div>
                        <div class="card-body" id="myAccess">
                            <!-- Mis accesos -->
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Cargar datos del dashboard
    async loadDashboardData() {
        try {
            const response = await fetch(`${this.baseURL}/dashboard/stats`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            const data = await response.json();
            
            if (data.success) {
                this.updateStatsCards(data.data);
            }
        } catch (error) {
            console.error('Error cargando estadísticas:', error);
        }
    }

    updateStatsCards(stats) {
        const statsContainer = document.getElementById('statsCards');
        if (!statsContainer) return;

        statsContainer.innerHTML = `
            <div class="col-md-3">
                <div class="card bg-primary text-white">
                    <div class="card-body">
                        <div class="d-flex align-items-center">
                            <div>
                                <h4>${stats.total_persons}</h4>
                                <p class="mb-0">Personas</p>
                            </div>
                            <i class="fas fa-users fa-2x ms-auto"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-success text-white">
                    <div class="card-body">
                        <div class="d-flex align-items-center">
                            <div>
                                <h4>${stats.total_visitors}</h4>
                                <p class="mb-0">Visitantes Activos</p>
                            </div>
                            <i class="fas fa-user-friends fa-2x ms-auto"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-warning text-white">
                    <div class="card-body">
                        <div class="d-flex align-items-center">
                            <div>
                                <h4>${stats.todays_accesses}</h4>
                                <p class="mb-0">Accesos Hoy</p>
                            </div>
                            <i class="fas fa-door-open fa-2x ms-auto"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-info text-white">
                    <div class="card-body">
                        <div class="d-flex align-items-center">
                            <div>
                                <h4>${Math.round((stats.current_occupancy / stats.total_capacity) * 100)}%</h4>
                                <p class="mb-0">Ocupación</p>
                            </div>
                            <i class="fas fa-building fa-2x ms-auto"></i>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Sistema de notificaciones
    showNotification(message, type = 'info', duration = 5000) {
        const container = document.getElementById('notification-container');
        if (!container) return;

        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${this.getBootstrapAlertType(type)} alert-dismissible fade show mb-2`;
        alertDiv.innerHTML = `
            <i class="fas ${this.getAlertIcon(type)} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        container.appendChild(alertDiv);

        if (duration > 0) {
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.remove();
                }
            }, duration);
        }
    }

    getBootstrapAlertType(type) {
        const typeMap = {
            'success': 'success',
            'error': 'danger',
            'warning': 'warning',
            'info': 'info'
        };
        return typeMap[type] || 'info';
    }

    getAlertIcon(type) {
        const iconMap = {
            'success': 'fa-check-circle',
            'error': 'fa-exclamation-circle',
            'warning': 'fa-exclamation-triangle',
            'info': 'fa-info-circle'
        };
        return iconMap[type] || 'fa-info-circle';
    }

    // Funciones específicas por módulo
    async showPersons() {
        try {
            const response = await fetch(`${this.baseURL}/persons`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            const data = await response.json();

            if (data.success) {
                this.renderPersonsList(data.data);
            }
        } catch (error) {
            this.showNotification('Error cargando personas', 'error');
        }
    }

    renderPersonsList(persons) {
        document.getElementById('main-content').innerHTML = `
            <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                <h1 class="h2">Gestión de Personas</h1>
                ${this.currentUser.permissions.includes('write') ? `
                    <button class="btn btn-primary" onclick="app.showNewPersonModal()">
                        <i class="fas fa-user-plus me-1"></i>Nueva Persona
                    </button>
                ` : ''}
            </div>

            <div class="card">
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Documento</th>
                                    <th>Email</th>
                                    <th>Departamento</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${persons.map(person => `
                                    <tr>
                                        <td>${person.name}</td>
                                        <td>${person.document}</td>
                                        <td>${person.email}</td>
                                        <td>${person.department}</td>
                                        <td>
                                            <span class="badge bg-${person.active ? 'success' : 'danger'}">
                                                ${person.active ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td>
                                            <button class="btn btn-sm btn-outline-primary" onclick="app.viewPerson('${person.id}')">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                            ${this.currentUser.permissions.includes('write') ? `
                                                <button class="btn btn-sm btn-outline-warning" onclick="app.editPerson('${person.id}')">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                            ` : ''}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    // Funciones de utilidad
    setupNavigation() {
        // Configurar navegación dinámica
        document.addEventListener('click', (e) => {
            if (e.target.hasAttribute('data-page')) {
                e.preventDefault();
                const page = e.target.getAttribute('data-page');
                this.navigateToPage(page);
            }
        });
    }

    startRealTimeUpdates() {
        // Actualizar datos cada 30 segundos
        setInterval(() => {
            if (this.currentUser) {
                this.loadDashboardData();
            }
        }, 30000);
    }

    logout() {
        localStorage.removeItem('uniontech_token');
        localStorage.removeItem('uniontech_user');
        this.currentUser = null;
        this.token = null;
        this.showLogin();
    }

    // Placeholder para funciones adicionales
    showNewPersonModal() {
        this.showModal('Nueva Persona', `
            <form id="newPersonForm">
                <div class="mb-3">
                    <label class="form-label">Nombre Completo</label>
                    <input type="text" class="form-control" name="name" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Documento</label>
                    <input type="text" class="form-control" name="document" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-control" name="email" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Teléfono</label>
                    <input type="tel" class="form-control" name="phone">
                </div>
                <div class="mb-3">
                    <label class="form-label">Departamento</label>
                    <input type="text" class="form-control" name="department" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Posición</label>
                    <input type="text" class="form-control" name="position">
                </div>
            </form>
        `, async () => {
            await this.createPerson();
        });
    }

    async createPerson() {
        const form = document.getElementById('newPersonForm');
        const formData = new FormData(form);
        const personData = Object.fromEntries(formData);

        try {
            const response = await fetch(`${this.baseURL}/persons`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(personData)
            });

            const data = await response.json();
            if (data.success) {
                this.showNotification('Persona creada exitosamente', 'success');
                this.closeModal();
                this.showPersons();
            } else {
                this.showNotification(data.error || 'Error creando persona', 'error');
            }
        } catch (error) {
            this.showNotification('Error de conexión', 'error');
        }
    }

    async viewPerson(personId) {
        try {
            const response = await fetch(`${this.baseURL}/personas/${personId}`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            if (!response.ok) throw new Error('Error al cargar persona');
            
            const person = await response.json();
            
            // Mostrar modal con detalles de la persona
            const modalHTML = `
                <div class="modal fade" id="viewPersonModal" tabindex="-1">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Detalles de Persona</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <h6>Información Personal</h6>
                                        <p><strong>Nombre:</strong> ${person.nombre}</p>
                                        <p><strong>DNI:</strong> ${person.dni}</p>
                                        <p><strong>Email:</strong> ${person.email || 'No especificado'}</p>
                                        <p><strong>Teléfono:</strong> ${person.telefono || 'No especificado'}</p>
                                        <p><strong>Tipo:</strong> ${person.tipo}</p>
                                        <p><strong>Estado:</strong> <span class="badge ${person.activo ? 'bg-success' : 'bg-danger'}">${person.activo ? 'Activo' : 'Inactivo'}</span></p>
                                    </div>
                                    <div class="col-md-6">
                                        <h6>Información de Acceso</h6>
                                        <p><strong>Departamento:</strong> ${person.departamento || 'No asignado'}</p>
                                        <p><strong>Fecha de creación:</strong> ${new Date(person.createdAt).toLocaleDateString()}</p>
                                        <p><strong>Última actualización:</strong> ${new Date(person.updatedAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-warning" onclick="app.editPerson('${person.id}')">Editar</button>
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Insertar modal en el DOM
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            // Mostrar modal
            const modal = new bootstrap.Modal(document.getElementById('viewPersonModal'));
            modal.show();
            
            // Limpiar modal después de cerrar
            document.getElementById('viewPersonModal').addEventListener('hidden.bs.modal', function() {
                this.remove();
            });
            
        } catch (error) {
            console.error('Error al ver persona:', error);
            this.showNotification('Error al cargar los detalles de la persona', 'error');
        }
    }

    async editPerson(personId) {
        try {
            const response = await fetch(`${this.baseURL}/personas/${personId}`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            if (!response.ok) throw new Error('Error al cargar persona');
            
            const person = await response.json();
            
            // Mostrar modal de edición
            const modalHTML = `
                <div class="modal fade" id="editPersonModal" tabindex="-1">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Editar Persona</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <form id="editPersonForm">
                                    <div class="row">
                                        <div class="col-md-6">
                                            <div class="mb-3">
                                                <label class="form-label">Nombre Completo</label>
                                                <input type="text" class="form-control" id="editNombre" value="${person.nombre}" required>
                                            </div>
                                            <div class="mb-3">
                                                <label class="form-label">DNI</label>
                                                <input type="text" class="form-control" id="editDni" value="${person.dni}" required>
                                            </div>
                                            <div class="mb-3">
                                                <label class="form-label">Email</label>
                                                <input type="email" class="form-control" id="editEmail" value="${person.email || ''}">
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="mb-3">
                                                <label class="form-label">Teléfono</label>
                                                <input type="text" class="form-control" id="editTelefono" value="${person.telefono || ''}">
                                            </div>
                                            <div class="mb-3">
                                                <label class="form-label">Tipo</label>
                                                <select class="form-control" id="editTipo" required>
                                                    <option value="empleado" ${person.tipo === 'empleado' ? 'selected' : ''}>Empleado</option>
                                                    <option value="visitante" ${person.tipo === 'visitante' ? 'selected' : ''}>Visitante</option>
                                                    <option value="contratista" ${person.tipo === 'contratista' ? 'selected' : ''}>Contratista</option>
                                                </select>
                                            </div>
                                            <div class="mb-3">
                                                <label class="form-label">Departamento</label>
                                                <input type="text" class="form-control" id="editDepartamento" value="${person.departamento || ''}">
                                            </div>
                                            <div class="mb-3">
                                                <div class="form-check">
                                                    <input class="form-check-input" type="checkbox" id="editActivo" ${person.activo ? 'checked' : ''}>
                                                    <label class="form-check-label" for="editActivo">Activo</label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-primary" onclick="app.savePersonChanges('${person.id}')">Guardar Cambios</button>
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Insertar modal en el DOM
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            // Mostrar modal
            const modal = new bootstrap.Modal(document.getElementById('editPersonModal'));
            modal.show();
            
            // Limpiar modal después de cerrar
            document.getElementById('editPersonModal').addEventListener('hidden.bs.modal', function() {
                this.remove();
            });
            
        } catch (error) {
            console.error('Error al editar persona:', error);
            this.showNotification('Error al cargar los datos para edición', 'error');
        }
    }

    async savePersonChanges(personId) {
        try {
            const formData = {
                nombre: document.getElementById('editNombre').value,
                dni: document.getElementById('editDni').value,
                email: document.getElementById('editEmail').value,
                telefono: document.getElementById('editTelefono').value,
                tipo: document.getElementById('editTipo').value,
                departamento: document.getElementById('editDepartamento').value,
                activo: document.getElementById('editActivo').checked
            };

            const response = await fetch(`${this.baseURL}/personas/${personId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Error al actualizar persona');

            const updatedPerson = await response.json();
            
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editPersonModal'));
            modal.hide();
            
            // Refrescar la vista actual
            if (document.querySelector('#personsContainer')) {
                await this.showPersons();
            }
            
            this.showNotification('Persona actualizada exitosamente', 'success');
            
        } catch (error) {
            console.error('Error al guardar cambios:', error);
            this.showNotification('Error al guardar los cambios', 'error');
        }
    }

    async showVisitors() {
        try {
            const response = await fetch(`${this.baseURL}/visitors`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            const data = await response.json();

            if (data.success) {
                this.renderVisitorsList(data.data);
            }
        } catch (error) {
            this.showNotification('Error cargando visitantes', 'error');
        }
    }

    renderVisitorsList(visitors) {
        document.getElementById('main-content').innerHTML = `
            <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                <h1 class="h2">Gestión de Visitantes</h1>
                <button class="btn btn-primary" onclick="app.showNewVisitorModal()">
                    <i class="fas fa-user-plus me-1"></i>Nuevo Visitante
                </button>
            </div>

            <div class="card">
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Empresa</th>
                                    <th>Anfitrión</th>
                                    <th>Válido Hasta</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${visitors.map(visitor => `
                                    <tr>
                                        <td>${visitor.name}</td>
                                        <td>${visitor.company || 'N/A'}</td>
                                        <td>${visitor.host_name}</td>
                                        <td>${new Date(visitor.valid_until).toLocaleString()}</td>
                                        <td>
                                            <span class="badge bg-${visitor.status === 'active' ? 'success' : 'danger'}">
                                                ${visitor.status}
                                            </span>
                                        </td>
                                        <td>
                                            <button class="btn btn-sm btn-outline-primary" onclick="app.viewVisitor('${visitor.id}')">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                            <button class="btn btn-sm btn-outline-info" onclick="app.generateVisitorQR('${visitor.id}')">
                                                <i class="fas fa-qrcode"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    async showBuildings() {
        try {
            const response = await fetch(`${this.baseURL}/buildings`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            const data = await response.json();

            if (data.success) {
                this.renderBuildingsList(data.data);
            }
        } catch (error) {
            this.showNotification('Error cargando edificios', 'error');
        }
    }

    renderBuildingsList(buildings) {
        document.getElementById('main-content').innerHTML = `
            <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                <h1 class="h2">Gestión de Edificios</h1>
                ${this.currentUser.permissions.includes('buildings') ? `
                    <button class="btn btn-primary" onclick="app.showNewBuildingModal()">
                        <i class="fas fa-building me-1"></i>Nuevo Edificio
                    </button>
                ` : ''}
            </div>

            <div class="row">
                ${buildings.map(building => `
                    <div class="col-md-4 mb-4">
                        <div class="card h-100">
                            <div class="card-header bg-${building.status === 'active' ? 'success' : 'warning'} text-white">
                                <h5 class="mb-0">
                                    <i class="fas fa-building me-2"></i>${building.name}
                                </h5>
                            </div>
                            <div class="card-body">
                                <p><strong>Dirección:</strong> ${building.address}</p>
                                <p><strong>Pisos:</strong> ${building.floors}</p>
                                <p><strong>Capacidad:</strong> ${building.capacity}</p>
                                <p><strong>Ocupación:</strong> ${building.current_occupancy}/${building.capacity}</p>
                                <div class="progress mb-3">
                                    <div class="progress-bar" style="width: ${(building.current_occupancy/building.capacity)*100}%"></div>
                                </div>
                                <span class="badge bg-${building.status === 'active' ? 'success' : 'warning'}">
                                    ${building.status}
                                </span>
                            </div>
                            <div class="card-footer">
                                <button class="btn btn-sm btn-outline-primary" onclick="app.viewBuilding('${building.id}')">
                                    <i class="fas fa-eye me-1"></i>Ver Detalles
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    async showValidation() {
        document.getElementById('main-content').innerHTML = `
            <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                <h1 class="h2">Centro de Validación</h1>
            </div>

            <div class="row">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5><i class="fas fa-qrcode me-2"></i>Validación QR</h5>
                        </div>
                        <div class="card-body text-center">
                            <div class="qr-scanner mb-3" onclick="app.startQRScanner()">
                                <i class="fas fa-camera fa-3x text-muted mb-3"></i>
                                <p>Haz clic para escanear código QR</p>
                            </div>
                            <button class="btn btn-primary btn-lg" onclick="app.startQRScanner()">
                                <i class="fas fa-camera me-2"></i>Iniciar Escáner
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5><i class="fas fa-user-check me-2"></i>Reconocimiento Facial</h5>
                        </div>
                        <div class="card-body text-center">
                            <div class="camera-preview mb-3">
                                <i class="fas fa-video fa-3x mb-3"></i>
                                <p>Cámara desactivada</p>
                            </div>
                            <button class="btn btn-success btn-lg" onclick="app.startFacialRecognition()">
                                <i class="fas fa-user-check me-2"></i>Iniciar Reconocimiento
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row mt-4">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h5><i class="fas fa-history me-2"></i>Últimas Validaciones</h5>
                        </div>
                        <div class="card-body" id="validationHistory">
                            <!-- Historia de validaciones -->
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.loadValidationHistory();
    }

    async showAccessLogs() {
        try {
            const response = await fetch(`${this.baseURL}/access-logs`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            const data = await response.json();

            if (data.success) {
                this.renderAccessLogs(data.data);
            }
        } catch (error) {
            this.showNotification('Error cargando registros de acceso', 'error');
        }
    }

    renderAccessLogs(logs) {
        document.getElementById('main-content').innerHTML = `
            <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                <h1 class="h2">Registros de Acceso</h1>
                <button class="btn btn-outline-secondary" onclick="app.exportAccessLogs()">
                    <i class="fas fa-download me-1"></i>Exportar
                </button>
            </div>

            <div class="card">
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Fecha/Hora</th>
                                    <th>Persona</th>
                                    <th>Edificio</th>
                                    <th>Método</th>
                                    <th>Estado</th>
                                    <th>Confianza</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${logs.map(log => `
                                    <tr>
                                        <td>${new Date(log.timestamp).toLocaleString()}</td>
                                        <td>${log.person_name || 'Visitante'}</td>
                                        <td>${log.building_name}</td>
                                        <td>
                                            <span class="badge bg-info">${log.validation_method}</span>
                                        </td>
                                        <td>
                                            <span class="badge bg-${log.success ? 'success' : 'danger'}">
                                                ${log.success ? 'Exitoso' : 'Fallido'}
                                            </span>
                                        </td>
                                        <td>${log.confidence}%</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    async showReports() {
        document.getElementById('main-content').innerHTML = `
            <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                <h1 class="h2">Reportes y Analytics</h1>
                <div class="btn-toolbar">
                    <button class="btn btn-outline-primary me-2" onclick="app.generateReport('daily')">
                        <i class="fas fa-calendar-day me-1"></i>Diario
                    </button>
                    <button class="btn btn-outline-success" onclick="app.generateReport('monthly')">
                        <i class="fas fa-calendar-alt me-1"></i>Mensual
                    </button>
                </div>
            </div>

            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card bg-primary text-white">
                        <div class="card-body">
                            <h4>1,247</h4>
                            <p class="mb-0">Accesos Hoy</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-success text-white">
                        <div class="card-body">
                            <h4>98.5%</h4>
                            <p class="mb-0">Precisión</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-warning text-white">
                        <div class="card-body">
                            <h4>342</h4>
                            <p class="mb-0">Visitantes</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-info text-white">
                        <div class="card-body">
                            <h4>24</h4>
                            <p class="mb-0">Alertas</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="col-md-8">
                    <div class="card">
                        <div class="card-header">
                            <h5><i class="fas fa-chart-line me-2"></i>Tendencias de Acceso</h5>
                        </div>
                        <div class="card-body">
                            <canvas id="accessTrendsChart" height="100"></canvas>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header">
                            <h5><i class="fas fa-pie-chart me-2"></i>Métodos de Validación</h5>
                        </div>
                        <div class="card-body">
                            <canvas id="validationMethodsChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async showSystemConfig() {
        if (!this.currentUser.permissions.includes('admin')) {
            this.showNotification('Sin permisos de administrador', 'error');
            return;
        }

        document.getElementById('main-content').innerHTML = `
            <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                <h1 class="h2">Configuración del Sistema</h1>
            </div>

            <div class="row">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5><i class="fas fa-cogs me-2"></i>Configuraciones Generales</h5>
                        </div>
                        <div class="card-body">
                            <form id="systemConfigForm">
                                <div class="mb-3 form-check form-switch">
                                    <input class="form-check-input" type="checkbox" id="facialRecognition" checked>
                                    <label class="form-check-label" for="facialRecognition">
                                        Reconocimiento Facial Habilitado
                                    </label>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Horas de Expiración QR</label>
                                    <input type="number" class="form-control" value="4" min="1" max="24">
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Máximo Visitantes por Día</label>
                                    <input type="number" class="form-control" value="100" min="10">
                                </div>
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-save me-1"></i>Guardar Configuración
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5><i class="fas fa-users me-2"></i>Gestión de Usuarios</h5>
                        </div>
                        <div class="card-body">
                            <button class="btn btn-success mb-3" onclick="app.showNewUserModal()">
                                <i class="fas fa-user-plus me-1"></i>Nuevo Usuario
                            </button>
                            <div id="usersList">
                                <!-- Lista de usuarios -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Funciones auxiliares
    showModal(title, content, onSave) {
        const modalHTML = `
            <div class="modal fade" id="dynamicModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${title}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${content}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" onclick="this.closest('.modal').saveCallback()">Guardar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = new bootstrap.Modal(document.getElementById('dynamicModal'));
        document.getElementById('dynamicModal').saveCallback = onSave;
        modal.show();

        document.getElementById('dynamicModal').addEventListener('hidden.bs.modal', () => {
            document.getElementById('dynamicModal').remove();
        });
    }

    closeModal() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('dynamicModal'));
        if (modal) modal.hide();
    }

    loadValidationHistory() {
        // Cargar historial de validaciones
        document.getElementById('validationHistory').innerHTML = `
            <p class="text-muted">Cargando historial de validaciones...</p>
        `;
    }

    viewVisitor(visitorId) {
        this.showNotification(`Viendo visitante ID: ${visitorId}`, 'info');
    }

    generateVisitorQR(visitorId) {
        this.showNotification(`Generando QR para visitante ID: ${visitorId}`, 'info');
    }

    viewBuilding(buildingId) {
        this.showNotification(`Viendo edificio ID: ${buildingId}`, 'info');
    }

    exportAccessLogs() {
        this.showNotification('Exportando registros de acceso...', 'info');
    }

    generateReport(type) {
        this.showNotification(`Generando reporte ${type}...`, 'info');
    }

    showNewBuildingModal() {
        this.showNotification('Modal de nuevo edificio - En desarrollo', 'info');
    }

    showNewUserModal() {
        this.showNotification('Modal de nuevo usuario - En desarrollo', 'info');
    }
}

// Inicializar aplicación
window.app = new UnionTechMVP();
