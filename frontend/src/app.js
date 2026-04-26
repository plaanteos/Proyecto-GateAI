// UnionTech - Aplicación Principal
class UnionTechApp {
    constructor() {
        this.currentUser = null;
        this.currentPage = 'dashboard';
        this.apiBaseUrl = 'http://localhost:3000/api';
        
        // Inicializar extensión de validación solo si está disponible
        if (typeof ValidationExtension !== 'undefined') {
            this.validation = new ValidationExtension(this);
        }
        
        this.init();
    }

    async init() {
        // Verificar si hay token guardado
        const token = localStorage.getItem('uniontech_token');
        if (token) {
            try {
                const user = await this.verifyToken(token);
                this.currentUser = user;
                this.showDashboard();
            } catch (error) {
                // Token inválido, mostrar login
                localStorage.removeItem('uniontech_token');
                this.showLogin();
            }
        } else {
            this.showLogin();
        }
    }

    async verifyToken(token) {
        const response = await fetch(`${this.apiBaseUrl}/auth/verify`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Token inválido');
        }
        
        return await response.json();
    }

    setupEventListeners() {
        // Event listeners para navegación
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-page]')) {
                e.preventDefault();
                const page = e.target.getAttribute('data-page');
                this.navigateTo(page);
            }
        });

        // Event listener para logout
        document.addEventListener('click', (e) => {
            if (e.target.matches('#logout-btn')) {
                e.preventDefault();
                this.logout();
            }
        });

        // Event listeners para formularios
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }
    }

    showLogin() {
        document.body.innerHTML = `
            <div class="container-fluid h-100">
                <div class="row h-100 justify-content-center align-items-center">
                    <div class="col-md-6 col-lg-4">
                        <div class="card shadow">
                            <div class="card-header bg-primary text-white text-center">
                                <h3><i class="fas fa-building me-2"></i>UnionTech</h3>
                                <p class="mb-0">Sistema de Control de Acceso</p>
                            </div>
                            <div class="card-body">
                                <form id="login-form">
                                    <div class="mb-3">
                                        <label for="username" class="form-label">Usuario</label>
                                        <input type="text" class="form-control" id="username" required>
                                    </div>
                                    <div class="mb-3">
                                        <label for="password" class="form-label">Contraseña</label>
                                        <input type="password" class="form-control" id="password" required>
                                    </div>
                                    <button type="submit" class="btn btn-primary w-100">
                                        <i class="fas fa-sign-in-alt me-1"></i>Iniciar Sesión
                                    </button>
                                </form>
                                <div id="login-error" class="mt-3"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        this.setupEventListeners();
    }

    async handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('login-error');

        if (!username || !password) {
            errorDiv.innerHTML = '<div class="alert alert-danger">Todos los campos son requeridos</div>';
            return;
        }

        const loginUrl = `${this.apiBaseUrl}/auth/login`;
        console.log('🔍 URL de login:', loginUrl);
        console.log('📝 Datos:', { email: username, password: '***' });

        try {
            console.log('📡 Enviando petición de login...');
            const response = await fetch(loginUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username: username, password })
            });

            console.log('📊 Status de respuesta:', response.status);
            console.log('🌐 URL completa:', response.url);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('❌ Error de respuesta:', errorData);
                throw new Error(errorData.error || `Error HTTP ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                localStorage.setItem('uniontech_token', data.token);
                this.currentUser = data.user;
                this.showDashboard();
            } else {
                throw new Error(data.error || 'Error de autenticación');
            }
        } catch (error) {
            console.error('Error de login:', error);
            errorDiv.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
        }
    }

    showDashboard() {
        const userName = this.currentUser?.name || 'Usuario';
        
        document.body.innerHTML = `
            <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
                <div class="container-fluid">
                    <a class="navbar-brand" href="#"><i class="fas fa-building me-2"></i>UnionTech</a>
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                    <div class="collapse navbar-collapse" id="navbarNav">
                        <ul class="navbar-nav me-auto">
                            <li class="nav-item">
                                <a class="nav-link active" data-page="dashboard" href="#"><i class="fas fa-home me-1"></i>Dashboard</a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" data-page="access-control" href="#"><i class="fas fa-key me-1"></i>Control Acceso</a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" data-page="personas" href="#"><i class="fas fa-users me-1"></i>Personas</a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" data-page="edificios" href="#"><i class="fas fa-building me-1"></i>Edificios</a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" data-page="visitantes" href="#"><i class="fas fa-user-friends me-1"></i>Visitantes</a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" data-page="notifications" href="#"><i class="fas fa-bell me-1"></i>Notificaciones</a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" data-page="validation" href="#"><i class="fas fa-shield-alt me-1"></i>Validación Multimodal</a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" data-page="chatbot" href="#"><i class="fas fa-robot me-1"></i>ChatBot</a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" data-page="reportes" href="#"><i class="fas fa-chart-bar me-1"></i>Reportes</a>
                            </li>
                        </ul>
                        <div class="navbar-nav">
                            <span class="navbar-text me-3">
                                <i class="fas fa-user me-1"></i>${userName}
                            </span>
                            <button class="btn btn-outline-light btn-sm" id="logout-btn">
                                <i class="fas fa-sign-out-alt me-1"></i>Salir
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main id="main-content" class="container-fluid mt-4">
                <div class="row">
                    <div class="col-12">
                        <h1><i class="fas fa-tachometer-alt me-2"></i>Dashboard</h1>
                        <p class="text-muted">Bienvenido al sistema de control de acceso UnionTech</p>
                    </div>
                </div>

                <div class="row mt-4">
                    <div class="col-md-3">
                        <div class="card bg-primary text-white">
                            <div class="card-body">
                                <div class="d-flex justify-content-between">
                                    <div>
                                        <h4>150</h4>
                                        <p class="mb-0">Personas Activas</p>
                                    </div>
                                    <div class="align-self-center">
                                        <i class="fas fa-users fa-2x"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-success text-white">
                            <div class="card-body">
                                <div class="d-flex justify-content-between">
                                    <div>
                                        <h4>12</h4>
                                        <p class="mb-0">Accesos Hoy</p>
                                    </div>
                                    <div class="align-self-center">
                                        <i class="fas fa-key fa-2x"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-warning text-white">
                            <div class="card-body">
                                <div class="d-flex justify-content-between">
                                    <div>
                                        <h4>5</h4>
                                        <p class="mb-0">Visitantes</p>
                                    </div>
                                    <div class="align-self-center">
                                        <i class="fas fa-user-friends fa-2x"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-info text-white">
                            <div class="card-body">
                                <div class="d-flex justify-content-between">
                                    <div>
                                        <h4>3</h4>
                                        <p class="mb-0">Edificios</p>
                                    </div>
                                    <div class="align-self-center">
                                        <i class="fas fa-building fa-2x"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row mt-4">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h5><i class="fas fa-chart-line me-2"></i>Accesos Recientes</h5>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-striped">
                                        <thead>
                                            <tr>
                                                <th>Persona</th>
                                                <th>Edificio</th>
                                                <th>Hora</th>
                                                <th>Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>Juan Pérez</td>
                                                <td>Torre Central</td>
                                                <td>09:15</td>
                                                <td><span class="badge bg-success">Autorizado</span></td>
                                            </tr>
                                            <tr>
                                                <td>María García</td>
                                                <td>Edificio Norte</td>
                                                <td>09:10</td>
                                                <td><span class="badge bg-success">Autorizado</span></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h5><i class="fas fa-shield-alt me-2"></i>Validaciones del Día</h5>
                            </div>
                            <div class="card-body">
                                <div class="row text-center">
                                    <div class="col-4">
                                        <h3 class="text-primary">8</h3>
                                        <p class="mb-0">QR</p>
                                    </div>
                                    <div class="col-4">
                                        <h3 class="text-success">3</h3>
                                        <p class="mb-0">Facial</p>
                                    </div>
                                    <div class="col-4">
                                        <h3 class="text-warning">1</h3>
                                        <p class="mb-0">Documento</p>
                                    </div>
                                </div>
                                <hr>
                                <div class="text-center">
                                    <button class="btn btn-primary" data-page="validation">
                                        <i class="fas fa-shield-alt me-1"></i>Ir a Validación
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        `;
        
        this.setupEventListeners();
    }

    navigateTo(page) {
        // Actualizar navegación activa
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-page="${page}"]`)?.classList.add('active');

        // Mostrar contenido de la página
        switch(page) {
            case 'dashboard':
                this.showDashboard();
                break;
            case 'validation':
                this.showValidationPage();
                break;
            case 'access-control':
                this.showAccessControlPage();
                break;
            case 'personas':
                this.showPersonasPage();
                break;
            case 'edificios':
                this.showEdificiosPage();
                break;
            case 'visitantes':
                this.showVisitantesPage();
                break;
            case 'notifications':
                this.showNotificationsPage();
                break;
            case 'chatbot':
                this.showChatBotPage();
                break;
            case 'reportes':
                this.showReportesPage();
                break;
            case 'reports':
                this.showReportsPage();
                break;
            default:
                console.warn('Página no encontrada:', page);
        }
    }

    // Método delegado para mostrar la página de validación
    showValidationPage() {
        if (this.validation) {
            this.validation.showValidationPage();
        } else {
            // Fallback si la extensión no está disponible
            document.getElementById('main-content').innerHTML = `
                <div class="alert alert-warning">
                    <h4>Validación Multimodal</h4>
                    <p>La extensión de validación no está disponible. Por favor, verifica que el archivo app-validation.js esté cargado correctamente.</p>
                </div>
            `;
        }
    }

    showAccessControlPage() {
        document.getElementById('main-content').innerHTML = `
            <h2><i class="fas fa-key me-2"></i>Control de Acceso</h2>
            <p class="text-muted">Gestión de permisos y accesos al sistema</p>
            
            <div class="row">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header bg-primary text-white">
                            <h5><i class="fas fa-qrcode me-2"></i>Generar Acceso QR</h5>
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <label class="form-label">ID Persona</label>
                                <input type="text" class="form-control" id="access-persona-id" placeholder="Ej: 12345">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Edificio</label>
                                <select class="form-control" id="access-edificio-id">
                                    <option value="1">Torre Central</option>
                                    <option value="2">Edificio Norte</option>
                                    <option value="3">Edificio Sur</option>
                                </select>
                            </div>
                            <button class="btn btn-primary" onclick="generateQuickAccess()">
                                <i class="fas fa-plus me-1"></i>Generar Acceso
                            </button>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header bg-success text-white">
                            <h5><i class="fas fa-list me-2"></i>Accesos Activos</h5>
                        </div>
                        <div class="card-body">
                            <div class="list-group" id="active-access-list">
                                <div class="list-group-item d-flex justify-content-between">
                                    <div>
                                        <strong>Usuario 12345</strong><br>
                                        <small class="text-muted">Torre Central - Expira: 18:30</small>
                                    </div>
                                    <span class="badge bg-success">Activo</span>
                                </div>
                                <div class="list-group-item d-flex justify-content-between">
                                    <div>
                                        <strong>Usuario 67890</strong><br>
                                        <small class="text-muted">Edificio Norte - Expira: 19:00</small>
                                    </div>
                                    <span class="badge bg-warning">Por expirar</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    showPersonasPage() {
        document.getElementById('main-content').innerHTML = `
            <h2><i class="fas fa-users me-2"></i>Gestión de Personas</h2>
            <p class="text-muted">Administración de usuarios del sistema</p>
            
            <div class="row">
                <div class="col-md-8">
                    <div class="card">
                        <div class="card-header">
                            <h5><i class="fas fa-table me-2"></i>Lista de Personas</h5>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Nombre</th>
                                            <th>Email</th>
                                            <th>Estado</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>12345</td>
                                            <td>Juan Pérez</td>
                                            <td>juan.perez@empresa.com</td>
                                            <td><span class="badge bg-success">Activo</span></td>
                                            <td>
                                                <button class="btn btn-sm btn-primary">Editar</button>
                                                <button class="btn btn-sm btn-secondary">QR</button>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>67890</td>
                                            <td>María González</td>
                                            <td>maria.gonzalez@empresa.com</td>
                                            <td><span class="badge bg-success">Activo</span></td>
                                            <td>
                                                <button class="btn btn-sm btn-primary">Editar</button>
                                                <button class="btn btn-sm btn-secondary">QR</button>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>11111</td>
                                            <td>Carlos Rodríguez</td>
                                            <td>carlos.rodriguez@empresa.com</td>
                                            <td><span class="badge bg-warning">Pendiente</span></td>
                                            <td>
                                                <button class="btn btn-sm btn-primary">Editar</button>
                                                <button class="btn btn-sm btn-secondary">QR</button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header bg-primary text-white">
                            <h5><i class="fas fa-plus me-2"></i>Agregar Persona</h5>
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <label class="form-label">Nombre Completo</label>
                                <input type="text" class="form-control" placeholder="Ej: Juan Pérez">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Email</label>
                                <input type="email" class="form-control" placeholder="email@empresa.com">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Documento</label>
                                <input type="text" class="form-control" placeholder="Ej: 12345678">
                            </div>
                            <button class="btn btn-primary w-100">
                                <i class="fas fa-save me-1"></i>Guardar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    showEdificiosPage() {
        document.getElementById('main-content').innerHTML = `
            <h2><i class="fas fa-building me-2"></i>Gestión de Edificios</h2>
            <p class="text-muted">Administración de edificios y ubicaciones</p>
            
            <div class="row">
                <div class="col-md-8">
                    <div class="card">
                        <div class="card-header">
                            <h5><i class="fas fa-map me-2"></i>Edificios Registrados</h5>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-4 mb-3">
                                    <div class="card border-primary">
                                        <div class="card-header bg-primary text-white">
                                            <h6><i class="fas fa-building"></i> Torre Central</h6>
                                        </div>
                                        <div class="card-body">
                                            <p><strong>ID:</strong> 1</p>
                                            <p><strong>Pisos:</strong> 25</p>
                                            <p><strong>Capacidad:</strong> 500 personas</p>
                                            <p><strong>Estado:</strong> <span class="badge bg-success">Activo</span></p>
                                            <div class="d-grid gap-2">
                                                <button class="btn btn-sm btn-outline-primary">Ver Detalles</button>
                                                <button class="btn btn-sm btn-outline-secondary">Generar QR</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-4 mb-3">
                                    <div class="card border-info">
                                        <div class="card-header bg-info text-white">
                                            <h6><i class="fas fa-building"></i> Edificio Norte</h6>
                                        </div>
                                        <div class="card-body">
                                            <p><strong>ID:</strong> 2</p>
                                            <p><strong>Pisos:</strong> 15</p>
                                            <p><strong>Capacidad:</strong> 300 personas</p>
                                            <p><strong>Estado:</strong> <span class="badge bg-success">Activo</span></p>
                                            <div class="d-grid gap-2">
                                                <button class="btn btn-sm btn-outline-info">Ver Detalles</button>
                                                <button class="btn btn-sm btn-outline-secondary">Generar QR</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-4 mb-3">
                                    <div class="card border-warning">
                                        <div class="card-header bg-warning text-dark">
                                            <h6><i class="fas fa-building"></i> Edificio Sur</h6>
                                        </div>
                                        <div class="card-body">
                                            <p><strong>ID:</strong> 3</p>
                                            <p><strong>Pisos:</strong> 12</p>
                                            <p><strong>Capacidad:</strong> 250 personas</p>
                                            <p><strong>Estado:</strong> <span class="badge bg-warning">Mantenimiento</span></p>
                                            <div class="d-grid gap-2">
                                                <button class="btn btn-sm btn-outline-warning">Ver Detalles</button>
                                                <button class="btn btn-sm btn-outline-secondary" disabled>Generar QR</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header bg-success text-white">
                            <h5><i class="fas fa-plus me-2"></i>Agregar Edificio</h5>
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <label class="form-label">Nombre del Edificio</label>
                                <input type="text" class="form-control" placeholder="Ej: Torre Este">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Dirección</label>
                                <input type="text" class="form-control" placeholder="Calle, Número, Ciudad">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Número de Pisos</label>
                                <input type="number" class="form-control" placeholder="Ej: 10">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Capacidad Total</label>
                                <input type="number" class="form-control" placeholder="Ej: 200">
                            </div>
                            <button class="btn btn-success w-100">
                                <i class="fas fa-save me-1"></i>Registrar Edificio
                            </button>
                        </div>
                    </div>
                    
                    <div class="card mt-3">
                        <div class="card-header bg-info text-white">
                            <h6><i class="fas fa-chart-pie me-2"></i>Estadísticas</h6>
                        </div>
                        <div class="card-body">
                            <div class="text-center mb-2">
                                <strong>Ocupación Actual</strong>
                            </div>
                            <div class="progress mb-2">
                                <div class="progress-bar bg-success" style="width: 65%">Torre Central 65%</div>
                            </div>
                            <div class="progress mb-2">
                                <div class="progress-bar bg-info" style="width: 45%">Edificio Norte 45%</div>
                            </div>
                            <div class="progress mb-3">
                                <div class="progress-bar bg-warning" style="width: 0%">Edificio Sur 0%</div>
                            </div>
                            <small class="text-muted">
                                <strong>Total Personas:</strong> 550<br>
                                <strong>Edificios Activos:</strong> 2/3<br>
                                <strong>Promedio Ocupación:</strong> 55%
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    showVisitantesPage() {
        document.getElementById('main-content').innerHTML = `
            <h2><i class="fas fa-user-friends me-2"></i>Gestión de Visitantes</h2>
            <p class="text-muted">Control de visitantes temporales</p>
            
            <div class="row">
                <div class="col-md-8">
                    <div class="card">
                        <div class="card-header">
                            <h5><i class="fas fa-clock me-2"></i>Visitantes Hoy</h5>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>Nombre</th>
                                            <th>Empresa</th>
                                            <th>Anfitrión</th>
                                            <th>Hora Entrada</th>
                                            <th>Estado</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>Ana Silva</td>
                                            <td>TechCorp</td>
                                            <td>Juan Pérez</td>
                                            <td>09:30</td>
                                            <td><span class="badge bg-success">En edificio</span></td>
                                            <td>
                                                <button class="btn btn-sm btn-warning">Checkout</button>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Roberto Díaz</td>
                                            <td>Consultores ABC</td>
                                            <td>María González</td>
                                            <td>14:15</td>
                                            <td><span class="badge bg-success">En edificio</span></td>
                                            <td>
                                                <button class="btn btn-sm btn-warning">Checkout</button>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Laura Martín</td>
                                            <td>Diseño Plus</td>
                                            <td>Carlos Rodríguez</td>
                                            <td>10:00</td>
                                            <td><span class="badge bg-secondary">Salió</span></td>
                                            <td>
                                                <span class="text-muted">Completado</span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header bg-success text-white">
                            <h5><i class="fas fa-user-plus me-2"></i>Registrar Visitante</h5>
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <label class="form-label">Nombre del Visitante</label>
                                <input type="text" class="form-control" placeholder="Ej: Ana Silva">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Empresa</label>
                                <input type="text" class="form-control" placeholder="Ej: TechCorp">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Anfitrión (ID)</label>
                                <input type="text" class="form-control" placeholder="Ej: 12345">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Motivo de Visita</label>
                                <select class="form-control">
                                    <option>Reunión de negocios</option>
                                    <option>Consultoría</option>
                                    <option>Entrega</option>
                                    <option>Mantenimiento</option>
                                    <option>Otro</option>
                                </select>
                            </div>
                            <button class="btn btn-success w-100">
                                <i class="fas fa-id-badge me-1"></i>Registrar y Generar QR
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    showNotificationsPage() {
        document.getElementById('main-content').innerHTML = `
            <h2><i class="fas fa-bell me-2"></i>Centro de Notificaciones</h2>
            <p class="text-muted">Alertas y notificaciones del sistema en tiempo real</p>
            
            <div class="row">
                <div class="col-md-8">
                    <div class="card">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5><i class="fas fa-list me-2"></i>Notificaciones Recientes</h5>
                            <div>
                                <button class="btn btn-sm btn-outline-primary me-2">
                                    <i class="fas fa-check-double"></i> Marcar todas como leídas
                                </button>
                                <button class="btn btn-sm btn-outline-danger">
                                    <i class="fas fa-trash"></i> Limpiar
                                </button>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="list-group">
                                <div class="list-group-item list-group-item-action border-start border-danger border-4">
                                    <div class="d-flex w-100 justify-content-between">
                                        <h6 class="mb-1">
                                            <i class="fas fa-exclamation-triangle text-danger me-2"></i>
                                            Intento de acceso denegado
                                        </h6>
                                        <small class="text-danger">Hace 5 min</small>
                                    </div>
                                    <p class="mb-1">Usuario no autorizado intentó acceder a Torre Central, Piso 20</p>
                                    <small class="text-muted">ID: Unknown-User | Método: QR inválido</small>
                                </div>
                                
                                <div class="list-group-item list-group-item-action border-start border-success border-4">
                                    <div class="d-flex w-100 justify-content-between">
                                        <h6 class="mb-1">
                                            <i class="fas fa-check-circle text-success me-2"></i>
                                            Acceso autorizado exitoso
                                        </h6>
                                        <small class="text-success">Hace 12 min</small>
                                    </div>
                                    <p class="mb-1">Juan Pérez (ID: 12345) accedió a Torre Central</p>
                                    <small class="text-muted">Método: Validación multimodal | Confianza: 96.8%</small>
                                </div>
                                
                                <div class="list-group-item list-group-item-action border-start border-warning border-4">
                                    <div class="d-flex w-100 justify-content-between">
                                        <h6 class="mb-1">
                                            <i class="fas fa-clock text-warning me-2"></i>
                                            QR próximo a expirar
                                        </h6>
                                        <small class="text-warning">Hace 20 min</small>
                                    </div>
                                    <p class="mb-1">El código QR de María González expira en 15 minutos</p>
                                    <small class="text-muted">ID: QR-ABC123DEF | Ubicación: Edificio Norte</small>
                                </div>
                                
                                <div class="list-group-item list-group-item-action border-start border-info border-4">
                                    <div class="d-flex w-100 justify-content-between">
                                        <h6 class="mb-1">
                                            <i class="fas fa-user-plus text-info me-2"></i>
                                            Nuevo visitante registrado
                                        </h6>
                                        <small class="text-info">Hace 35 min</small>
                                    </div>
                                    <p class="mb-1">Ana Silva de TechCorp registrada como visitante</p>
                                    <small class="text-muted">Anfitrión: Carlos Rodríguez | Duración: 2 horas</small>
                                </div>
                                
                                <div class="list-group-item list-group-item-action border-start border-secondary border-4">
                                    <div class="d-flex w-100 justify-content-between">
                                        <h6 class="mb-1">
                                            <i class="fas fa-sync text-secondary me-2"></i>
                                            Sistema actualizado
                                        </h6>
                                        <small class="text-muted">Hace 2 horas</small>
                                    </div>
                                    <p class="mb-1">Sistema de validación facial actualizado a v2.1</p>
                                    <small class="text-muted">Mejoras en precisión y velocidad de procesamiento</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header bg-primary text-white">
                            <h5><i class="fas fa-chart-line me-2"></i>Resumen de Alertas</h5>
                        </div>
                        <div class="card-body">
                            <div class="row text-center">
                                <div class="col-6 mb-3">
                                    <div class="border rounded p-3">
                                        <h3 class="text-danger">3</h3>
                                        <small class="text-muted">Críticas</small>
                                    </div>
                                </div>
                                <div class="col-6 mb-3">
                                    <div class="border rounded p-3">
                                        <h3 class="text-warning">7</h3>
                                        <small class="text-muted">Advertencias</small>
                                    </div>
                                </div>
                                <div class="col-6 mb-3">
                                    <div class="border rounded p-3">
                                        <h3 class="text-success">24</h3>
                                        <small class="text-muted">Exitosas</small>
                                    </div>
                                </div>
                                <div class="col-6 mb-3">
                                    <div class="border rounded p-3">
                                        <h3 class="text-info">12</h3>
                                        <small class="text-muted">Informativas</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card mt-3">
                        <div class="card-header bg-warning text-dark">
                            <h6><i class="fas fa-cog me-2"></i>Configuración de Alertas</h6>
                        </div>
                        <div class="card-body">
                            <div class="form-check form-switch mb-2">
                                <input class="form-check-input" type="checkbox" id="emailAlerts" checked>
                                <label class="form-check-label" for="emailAlerts">
                                    Alertas por Email
                                </label>
                            </div>
                            <div class="form-check form-switch mb-2">
                                <input class="form-check-input" type="checkbox" id="smsAlerts">
                                <label class="form-check-label" for="smsAlerts">
                                    Alertas por SMS
                                </label>
                            </div>
                            <div class="form-check form-switch mb-2">
                                <input class="form-check-input" type="checkbox" id="pushAlerts" checked>
                                <label class="form-check-label" for="pushAlerts">
                                    Notificaciones Push
                                </label>
                            </div>
                            <div class="form-check form-switch mb-3">
                                <input class="form-check-input" type="checkbox" id="criticalOnly">
                                <label class="form-check-label" for="criticalOnly">
                                    Solo Críticas
                                </label>
                            </div>
                            <button class="btn btn-warning btn-sm w-100">
                                <i class="fas fa-save me-1"></i>Guardar Configuración
                            </button>
                        </div>
                    </div>
                    
                    <div class="card mt-3">
                        <div class="card-header bg-success text-white">
                            <h6><i class="fas fa-plus me-2"></i>Nueva Notificación</h6>
                        </div>
                        <div class="card-body">
                            <div class="mb-2">
                                <select class="form-control form-control-sm mb-2">
                                    <option>Tipo de Notificación</option>
                                    <option>Información</option>
                                    <option>Advertencia</option>
                                    <option>Crítica</option>
                                </select>
                            </div>
                            <div class="mb-2">
                                <textarea class="form-control form-control-sm" rows="3" placeholder="Mensaje de la notificación..."></textarea>
                            </div>
                            <button class="btn btn-success btn-sm w-100">
                                <i class="fas fa-paper-plane me-1"></i>Enviar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    showChatBotPage() {
        document.getElementById('main-content').innerHTML = `
            <h2><i class="fas fa-robot me-2"></i>ChatBot Asistente</h2>
            <p class="text-muted">Asistente virtual inteligente para el sistema UnionTech</p>
            
            <div class="row">
                <div class="col-md-8">
                    <div class="card">
                        <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                            <h5><i class="fas fa-comments me-2"></i>Conversación</h5>
                            <div>
                                <span class="badge bg-success">
                                    <i class="fas fa-circle me-1"></i>En línea
                                </span>
                            </div>
                        </div>
                        <div class="card-body p-0">
                            <div id="chatMessages" style="height: 400px; overflow-y: auto; padding: 15px; background-color: #f8f9fa;">
                                <div class="mb-3">
                                    <div class="d-flex align-items-start">
                                        <div class="bg-primary rounded-circle p-2 me-3">
                                            <i class="fas fa-robot text-white"></i>
                                        </div>
                                        <div class="bg-white rounded p-3 shadow-sm">
                                            <small class="text-muted">UnionTech Assistant</small>
                                            <p class="mb-1">¡Hola! Soy el asistente virtual de UnionTech. ¿En qué puedo ayudarte hoy?</p>
                                            <small class="text-muted">09:30 AM</small>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <div class="d-flex align-items-start justify-content-end">
                                        <div class="bg-primary text-white rounded p-3 shadow-sm">
                                            <p class="mb-1">¿Cómo puedo generar un código QR para un visitante?</p>
                                            <small class="opacity-75">09:32 AM</small>
                                        </div>
                                        <div class="bg-secondary rounded-circle p-2 ms-3">
                                            <i class="fas fa-user text-white"></i>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <div class="d-flex align-items-start">
                                        <div class="bg-primary rounded-circle p-2 me-3">
                                            <i class="fas fa-robot text-white"></i>
                                        </div>
                                        <div class="bg-white rounded p-3 shadow-sm">
                                            <small class="text-muted">UnionTech Assistant</small>
                                            <p class="mb-1">Para generar un código QR para visitantes:</p>
                                            <ol class="mb-1">
                                                <li>Ve a "Gestión de Visitantes"</li>
                                                <li>Haz clic en "Nuevo Visitante"</li>
                                                <li>Completa los datos del visitante</li>
                                                <li>El sistema generará automáticamente un QR único</li>
                                                <li>Puedes descargar o imprimir el código</li>
                                            </ol>
                                            <small class="text-muted">09:32 AM</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="p-3 border-top">
                                <div class="input-group">
                                    <input type="text" class="form-control" placeholder="Escribe tu pregunta aquí..." id="chatInput">
                                    <button class="btn btn-primary" type="button" onclick="sendChatMessage()">
                                        <i class="fas fa-paper-plane"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header bg-info text-white">
                            <h6><i class="fas fa-question-circle me-2"></i>Preguntas Frecuentes</h6>
                        </div>
                        <div class="card-body">
                            <div class="list-group list-group-flush">
                                <a href="#" class="list-group-item list-group-item-action" onclick="askPredefinedQuestion('¿Cómo validar un acceso?')">
                                    <i class="fas fa-key me-2"></i>¿Cómo validar un acceso?
                                </a>
                                <a href="#" class="list-group-item list-group-item-action" onclick="askPredefinedQuestion('¿Cómo registrar una persona?')">
                                    <i class="fas fa-user-plus me-2"></i>¿Cómo registrar una persona?
                                </a>
                                <a href="#" class="list-group-item list-group-item-action" onclick="askPredefinedQuestion('¿Cómo usar el reconocimiento facial?')">
                                    <i class="fas fa-camera me-2"></i>¿Cómo usar reconocimiento facial?
                                </a>
                                <a href="#" class="list-group-item list-group-item-action" onclick="askPredefinedQuestion('¿Cómo generar reportes?')">
                                    <i class="fas fa-chart-bar me-2"></i>¿Cómo generar reportes?
                                </a>
                                <a href="#" class="list-group-item list-group-item-action" onclick="askPredefinedQuestion('¿Cómo configurar notificaciones?')">
                                    <i class="fas fa-bell me-2"></i>¿Configurar notificaciones?
                                </a>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card mt-3">
                        <div class="card-header bg-success text-white">
                            <h6><i class="fas fa-lightbulb me-2"></i>Acciones Rápidas</h6>
                        </div>
                        <div class="card-body">
                            <button class="btn btn-outline-primary btn-sm w-100 mb-2" onclick="quickAction('newVisitor')">
                                <i class="fas fa-user-plus me-2"></i>Nuevo Visitante
                            </button>
                            <button class="btn btn-outline-success btn-sm w-100 mb-2" onclick="quickAction('generateQR')">
                                <i class="fas fa-qrcode me-2"></i>Generar QR
                            </button>
                            <button class="btn btn-outline-info btn-sm w-100 mb-2" onclick="quickAction('validateAccess')">
                                <i class="fas fa-shield-alt me-2"></i>Validar Acceso
                            </button>
                            <button class="btn btn-outline-warning btn-sm w-100" onclick="quickAction('viewReports')">
                                <i class="fas fa-chart-line me-2"></i>Ver Reportes
                            </button>
                        </div>
                    </div>
                    
                    <div class="card mt-3">
                        <div class="card-header bg-dark text-white">
                            <h6><i class="fas fa-cog me-2"></i>Configuración del Chat</h6>
                        </div>
                        <div class="card-body">
                            <div class="form-check form-switch mb-2">
                                <input class="form-check-input" type="checkbox" id="chatSounds" checked>
                                <label class="form-check-label" for="chatSounds">
                                    Sonidos de notificación
                                </label>
                            </div>
                            <div class="form-check form-switch mb-2">
                                <input class="form-check-input" type="checkbox" id="autoResponses" checked>
                                <label class="form-check-label" for="autoResponses">
                                    Respuestas automáticas
                                </label>
                            </div>
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="contextualHelp">
                                <label class="form-check-label" for="contextualHelp">
                                    Ayuda contextual
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Configurar el listener del Enter después de renderizar
        setTimeout(() => {
            const chatInput = document.getElementById('chatInput');
            if (chatInput) {
                chatInput.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        sendChatMessage();
                    }
                });
            }
        }, 100);
    }

    showReportesPage() {
        document.getElementById('main-content').innerHTML = `
            <h2><i class="fas fa-chart-bar me-2"></i>Reportes y Analytics</h2>
            <p class="text-muted">Análisis completo y reportes detallados del sistema</p>
            
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card bg-primary text-white">
                        <div class="card-body">
                            <div class="d-flex align-items-center">
                                <div>
                                    <h4>1,247</h4>
                                    <p class="mb-0">Accesos Hoy</p>
                                </div>
                                <i class="fas fa-door-open fa-2x ms-auto"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-success text-white">
                        <div class="card-body">
                            <div class="d-flex align-items-center">
                                <div>
                                    <h4>342</h4>
                                    <p class="mb-0">Visitantes</p>
                                </div>
                                <i class="fas fa-users fa-2x ms-auto"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-warning text-white">
                        <div class="card-body">
                            <div class="d-flex align-items-center">
                                <div>
                                    <h4>98.5%</h4>
                                    <p class="mb-0">Precisión</p>
                                </div>
                                <i class="fas fa-bullseye fa-2x ms-auto"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-info text-white">
                        <div class="card-body">
                            <div class="d-flex align-items-center">
                                <div>
                                    <h4>847</h4>
                                    <p class="mb-0">QR Activos</p>
                                </div>
                                <i class="fas fa-qrcode fa-2x ms-auto"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5><i class="fas fa-chart-line me-2"></i>Accesos por Hora</h5>
                            <select class="form-select form-select-sm" style="width: auto;">
                                <option>Hoy</option>
                                <option>Ayer</option>
                                <option>Esta Semana</option>
                            </select>
                        </div>
                        <div class="card-body">
                            <canvas id="accessChart" style="max-height: 300px;"></canvas>
                            <div class="mt-3">
                                <div class="row text-center">
                                    <div class="col-4">
                                        <h6 class="text-primary">06:00-12:00</h6>
                                        <p class="mb-0">423 accesos</p>
                                    </div>
                                    <div class="col-4">
                                        <h6 class="text-success">12:00-18:00</h6>
                                        <p class="mb-0">589 accesos</p>
                                    </div>
                                    <div class="col-4">
                                        <h6 class="text-warning">18:00-24:00</h6>
                                        <p class="mb-0">235 accesos</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5><i class="fas fa-pie-chart me-2"></i>Métodos de Validación</h5>
                        </div>
                        <div class="card-body">
                            <canvas id="validationChart" style="max-height: 300px;"></canvas>
                            <div class="mt-3">
                                <div class="row">
                                    <div class="col-6">
                                        <div class="d-flex align-items-center mb-2">
                                            <div class="bg-primary rounded me-2" style="width: 15px; height: 15px;"></div>
                                            <span>QR Code (45%)</span>
                                        </div>
                                        <div class="d-flex align-items-center mb-2">
                                            <div class="bg-success rounded me-2" style="width: 15px; height: 15px;"></div>
                                            <span>Facial (35%)</span>
                                        </div>
                                    </div>
                                    <div class="col-6">
                                        <div class="d-flex align-items-center mb-2">
                                            <div class="bg-warning rounded me-2" style="width: 15px; height: 15px;"></div>
                                            <span>Documento (15%)</span>
                                        </div>
                                        <div class="d-flex align-items-center mb-2">
                                            <div class="bg-info rounded me-2" style="width: 15px; height: 15px;"></div>
                                            <span>Multimodal (5%)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row mt-4">
                <div class="col-md-8">
                    <div class="card">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5><i class="fas fa-table me-2"></i>Últimos Accesos</h5>
                            <button class="btn btn-sm btn-primary">
                                <i class="fas fa-download me-1"></i>Exportar
                            </button>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Hora</th>
                                            <th>Usuario</th>
                                            <th>Método</th>
                                            <th>Ubicación</th>
                                            <th>Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>14:32</td>
                                            <td>Juan Pérez</td>
                                            <td><span class="badge bg-primary">QR</span></td>
                                            <td>Torre Central</td>
                                            <td><span class="badge bg-success">Autorizado</span></td>
                                        </tr>
                                        <tr>
                                            <td>14:30</td>
                                            <td>María García</td>
                                            <td><span class="badge bg-success">Facial</span></td>
                                            <td>Edificio Norte</td>
                                            <td><span class="badge bg-success">Autorizado</span></td>
                                        </tr>
                                        <tr>
                                            <td>14:28</td>
                                            <td>Usuario Desconocido</td>
                                            <td><span class="badge bg-danger">QR Inválido</span></td>
                                            <td>Torre Central</td>
                                            <td><span class="badge bg-danger">Denegado</span></td>
                                        </tr>
                                        <tr>
                                            <td>14:25</td>
                                            <td>Carlos Rodríguez</td>
                                            <td><span class="badge bg-warning">Documento</span></td>
                                            <td>Edificio Sur</td>
                                            <td><span class="badge bg-success">Autorizado</span></td>
                                        </tr>
                                        <tr>
                                            <td>14:22</td>
                                            <td>Ana Silva</td>
                                            <td><span class="badge bg-info">Multimodal</span></td>
                                            <td>Torre Central</td>
                                            <td><span class="badge bg-success">Autorizado</span></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header bg-dark text-white">
                            <h6><i class="fas fa-filter me-2"></i>Filtros de Reporte</h6>
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <label class="form-label">Período</label>
                                <select class="form-control">
                                    <option>Hoy</option>
                                    <option>Esta semana</option>
                                    <option>Este mes</option>
                                    <option>Personalizado</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Edificio</label>
                                <select class="form-control">
                                    <option>Todos</option>
                                    <option>Torre Central</option>
                                    <option>Edificio Norte</option>
                                    <option>Edificio Sur</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Tipo de Usuario</label>
                                <select class="form-control">
                                    <option>Todos</option>
                                    <option>Empleados</option>
                                    <option>Visitantes</option>
                                    <option>Administradores</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Estado</label>
                                <select class="form-control">
                                    <option>Todos</option>
                                    <option>Autorizados</option>
                                    <option>Denegados</option>
                                    <option>Pendientes</option>
                                </select>
                            </div>
                            <button class="btn btn-primary w-100 mb-2">
                                <i class="fas fa-search me-1"></i>Aplicar Filtros
                            </button>
                            <button class="btn btn-outline-secondary w-100">
                                <i class="fas fa-undo me-1"></i>Limpiar
                            </button>
                        </div>
                    </div>
                    
                    <div class="card mt-3">
                        <div class="card-header bg-success text-white">
                            <h6><i class="fas fa-file-export me-2"></i>Exportar Reportes</h6>
                        </div>
                        <div class="card-body">
                            <button class="btn btn-outline-success btn-sm w-100 mb-2">
                                <i class="fas fa-file-pdf me-1"></i>Exportar PDF
                            </button>
                            <button class="btn btn-outline-success btn-sm w-100 mb-2">
                                <i class="fas fa-file-excel me-1"></i>Exportar Excel
                            </button>
                            <button class="btn btn-outline-success btn-sm w-100">
                                <i class="fas fa-file-csv me-1"></i>Exportar CSV
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Ejecutar gráficos después de renderizar
        setTimeout(() => {
            drawAccessChart();
            drawValidationChart();
        }, 100);
    }

    logout() {
        localStorage.removeItem('uniontech_token');
        this.currentUser = null;
        this.showLogin();
    }

    showAlert(message, type = 'info') {
        const alertHtml = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        // Agregar alerta al comienzo del contenido principal
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.insertAdjacentHTML('afterbegin', alertHtml);
            
            // Auto-remover después de 5 segundos
            setTimeout(() => {
                const alert = mainContent.querySelector('.alert');
                if (alert) {
                    alert.remove();
                }
            }, 5000);
        }
    }

    showReportsPage() {
        // Cargar la página de reportes avanzados en iframe
        document.getElementById('main-content').innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2><i class="fas fa-chart-line me-2"></i>Dashboard de Reportes Avanzado</h2>
                    <p class="text-muted">Sistema completo de estadísticas, análisis y exportación de datos</p>
                </div>
                <div>
                    <a href="reports-dashboard.html" target="_blank" class="btn btn-primary">
                        <i class="fas fa-external-link-alt me-1"></i>Abrir en Nueva Ventana
                    </a>
                </div>
            </div>
            
            <div class="card">
                <div class="card-body p-0">
                    <iframe 
                        src="reports-dashboard.html" 
                        style="width: 100%; height: 800px; border: none;"
                        title="Dashboard de Reportes UnionTech">
                    </iframe>
                </div>
            </div>
        `;
    }
}

// Inicializar aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.app = new UnionTechApp();
});

// Funciones globales del ChatBot
window.sendChatMessage = function() {
    const input = document.getElementById('chatInput');
    if (!input) return;
    
    const message = input.value.trim();
    if (message) {
        addUserMessage(message);
        input.value = '';
        setTimeout(() => {
            generateBotResponse(message);
        }, 1000);
    }
};

window.addUserMessage = function(message) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const time = new Date().toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'});
    const messageDiv = document.createElement('div');
    messageDiv.className = 'mb-3';
    messageDiv.innerHTML = `
        <div class="d-flex align-items-start justify-content-end">
            <div class="bg-primary text-white rounded p-3 shadow-sm">
                <p class="mb-1">${message}</p>
                <small class="opacity-75">${time}</small>
            </div>
            <div class="bg-secondary rounded-circle p-2 ms-3">
                <i class="fas fa-user text-white"></i>
            </div>
        </div>
    `;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
};

window.generateBotResponse = function(userMessage) {
    const responses = {
        'acceso': 'Para validar un acceso, ve a "Gestión de Accesos" y utiliza el escáner QR o la validación facial.',
        'qr': 'Los códigos QR se generan automáticamente al registrar visitantes. Cada código tiene una validez limitada y encriptación de seguridad.',
        'facial': 'El reconocimiento facial utiliza IA avanzada. Asegúrate de que la iluminación sea adecuada y mira directamente a la cámara.',
        'visitante': 'Para registrar un visitante, completa el formulario con sus datos, foto y duración de la visita. El sistema generará un QR automáticamente.',
        'reporte': 'Los reportes están disponibles en la sección correspondiente. Puedes filtrar por fechas, tipos de acceso y edificios.',
        'default': 'Gracias por tu pregunta. Para obtener ayuda específica, puedes usar las preguntas frecuentes o contactar al administrador del sistema.'
    };
    
    let response = responses.default;
    const lowerMessage = userMessage.toLowerCase();
    
    for (const [key, value] of Object.entries(responses)) {
        if (lowerMessage.includes(key)) {
            response = value;
            break;
        }
    }
    
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const time = new Date().toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'});
    const messageDiv = document.createElement('div');
    messageDiv.className = 'mb-3';
    messageDiv.innerHTML = `
        <div class="d-flex align-items-start">
            <div class="bg-primary rounded-circle p-2 me-3">
                <i class="fas fa-robot text-white"></i>
            </div>
            <div class="bg-white rounded p-3 shadow-sm">
                <small class="text-muted">UnionTech Assistant</small>
                <p class="mb-1">${response}</p>
                <small class="text-muted">${time}</small>
            </div>
        </div>
    `;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
};

window.askPredefinedQuestion = function(question) {
    const input = document.getElementById('chatInput');
    if (input) {
        input.value = question;
        sendChatMessage();
    }
};

window.quickAction = function(action) {
    const actions = {
        'newVisitor': '¿Cómo registrar un nuevo visitante?',
        'generateQR': '¿Cómo generar un código QR?',
        'validateAccess': '¿Cómo validar un acceso?',
        'viewReports': '¿Cómo ver los reportes del sistema?'
    };
    
    if (actions[action]) {
        askPredefinedQuestion(actions[action]);
    }
};

// Funciones globales para los gráficos de reportes
window.drawAccessChart = function() {
    const canvas = document.getElementById('accessChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = 300;
    
    // Datos de ejemplo
    const hours = ['06', '08', '10', '12', '14', '16', '18', '20'];
    const values = [45, 78, 120, 156, 189, 145, 98, 67];
    
    // Configuración
    const padding = 40;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;
    const maxValue = Math.max(...values);
    
    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar ejes
    ctx.strokeStyle = '#dee2e6';
    ctx.lineWidth = 1;
    
    // Eje Y
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.stroke();
    
    // Eje X
    ctx.beginPath();
    ctx.moveTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();
    
    // Dibujar barras
    const barWidth = chartWidth / hours.length * 0.6;
    const barSpacing = chartWidth / hours.length;
    
    hours.forEach((hour, index) => {
        const barHeight = (values[index] / maxValue) * chartHeight;
        const x = padding + index * barSpacing + barSpacing * 0.2;
        const y = canvas.height - padding - barHeight;
        
        // Barra
        ctx.fillStyle = '#0d6efd';
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // Etiqueta X
        ctx.fillStyle = '#6c757d';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(hour + ':00', x + barWidth / 2, canvas.height - padding + 20);
        
        // Valor
        ctx.fillStyle = '#212529';
        ctx.font = 'bold 10px Arial';
        ctx.fillText(values[index], x + barWidth / 2, y - 5);
    });
};

window.drawValidationChart = function() {
    const canvas = document.getElementById('validationChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = 300;
    
    const data = [
        { label: 'QR Code', value: 45, color: '#0d6efd' },
        { label: 'Facial', value: 35, color: '#198754' },
        { label: 'Documento', value: 15, color: '#ffc107' },
        { label: 'Multimodal', value: 5, color: '#0dcaf0' }
    ];
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;
    
    let currentAngle = -Math.PI / 2;
    
    data.forEach(item => {
        const sliceAngle = (item.value / 100) * 2 * Math.PI;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.lineTo(centerX, centerY);
        ctx.fillStyle = item.color;
        ctx.fill();
        
        currentAngle += sliceAngle;
    });
};

// Manejar errores globales
window.addEventListener('error', (event) => {
    console.error('Error global:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Promise rejection no manejada:', event.reason);
});
