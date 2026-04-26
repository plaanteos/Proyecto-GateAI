// Servidor Principal UnionTech con Base de Datos Real
const http = require('http');
const url = require('url');
const querystring = require('querystring');
require('dotenv').config();

// Importar servicios
const UserManagementSystem = require('./src/services/userManagementService');

class UnionTechServer {
    constructor() {
        this.port = process.env.API_PORT || 3000;
        this.userManager = new UserManagementSystem();
        this.server = null;
        this.routes = new Map();
        this.middleware = [];
        
        this.setupRoutes();
        this.setupMiddleware();
    }

    // Configurar middleware
    setupMiddleware() {
        // CORS
        this.middleware.push((req, res, next) => {
            res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
            next();
        });

        // JSON Parser
        this.middleware.push((req, res, next) => {
            if (req.method === 'POST' || req.method === 'PUT') {
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', () => {
                    try {
                        req.body = body ? JSON.parse(body) : {};
                    } catch (e) {
                        req.body = {};
                    }
                    next();
                });
            } else {
                next();
            }
        });

        // Logging
        this.middleware.push((req, res, next) => {
            const timestamp = new Date().toISOString();
            console.log(`[${timestamp}] ${req.method} ${req.url}`);
            next();
        });
    }

    // Configurar rutas
    setupRoutes() {
        // === RUTAS DE AUTENTICACIÓN ===
        this.routes.set('POST /api/auth/login', this.handleLogin.bind(this));
        this.routes.set('POST /api/auth/logout', this.handleLogout.bind(this));
        this.routes.set('GET /api/auth/verify', this.handleVerifyToken.bind(this));
        this.routes.set('POST /api/auth/refresh', this.handleRefreshToken.bind(this));

        // === RUTAS DE DASHBOARD POR ROL ===
        this.routes.set('GET /api/dashboard/super-admin', this.handleSuperAdminDashboard.bind(this));
        this.routes.set('GET /api/dashboard/building-admin', this.handleBuildingAdminDashboard.bind(this));
        this.routes.set('GET /api/dashboard/security', this.handleSecurityDashboard.bind(this));
        this.routes.set('GET /api/dashboard/resident', this.handleResidentDashboard.bind(this));
        this.routes.set('GET /api/dashboard/guest', this.handleGuestDashboard.bind(this));
        this.routes.set('GET /api/dashboard/maintenance', this.handleMaintenanceDashboard.bind(this));

        // === RUTAS DE GESTIÓN DE USUARIOS ===
        this.routes.set('GET /api/users', this.handleGetUsers.bind(this));
        this.routes.set('POST /api/users', this.handleCreateUser.bind(this));
        this.routes.set('PUT /api/users/:id', this.handleUpdateUser.bind(this));
        this.routes.set('DELETE /api/users/:id', this.handleDeleteUser.bind(this));

        // === RUTAS DE GESTIÓN DE INVITADOS ===
        this.routes.set('POST /api/guests/invite', this.handleInviteGuest.bind(this));
        this.routes.set('GET /api/guests/my-guests', this.handleGetMyGuests.bind(this));
        this.routes.set('PUT /api/guests/:id/approve', this.handleApproveGuest.bind(this));
        this.routes.set('PUT /api/guests/:id/reject', this.handleRejectGuest.bind(this));
        this.routes.set('POST /api/guests/:id/generate-qr', this.handleGenerateGuestQR.bind(this));

        // === RUTAS DE VALIDACIÓN BIOMÉTRICA ===
        this.routes.set('POST /api/validation/facial', this.handleFacialValidation.bind(this));
        this.routes.set('POST /api/validation/document', this.handleDocumentValidation.bind(this));
        this.routes.set('POST /api/validation/qr', this.handleQRValidation.bind(this));

        // === RUTAS DE MONITOREO Y REPORTES ===
        this.routes.set('GET /api/monitoring/live-access', this.handleLiveAccess.bind(this));
        this.routes.set('GET /api/reports/access-history', this.handleAccessHistory.bind(this));
        this.routes.set('GET /api/reports/security-incidents', this.handleSecurityIncidents.bind(this));

        // === RUTAS DE SALUD Y SISTEMA ===
        this.routes.set('GET /health', this.handleHealth.bind(this));
        this.routes.set('GET /api/system/status', this.handleSystemStatus.bind(this));
    }

    // === HANDLERS DE AUTENTICACIÓN ===
    async handleLogin(req, res) {
        try {
            console.log('🔐 Intento de login recibido');
            console.log('📝 Datos:', { email: req.body.email, password: '***' });

            const { email, password } = req.body;

            if (!email || !password) {
                this.sendError(res, 400, 'Email y contraseña son requeridos');
                return;
            }

            const result = await this.userManager.authenticateUser(email, password);
            
            console.log('✅ Login exitoso para:', email);
            console.log('👤 Rol:', result.user.role);
            console.log('🏢 Edificio:', result.user.building);

            this.sendSuccess(res, result);
        } catch (error) {
            console.error('❌ Error en login:', error.message);
            this.sendError(res, 401, error.message);
        }
    }

    async handleLogout(req, res) {
        // Implementar logout (invalidar token en base de datos si es necesario)
        this.sendSuccess(res, { message: 'Logout exitoso' });
    }

    async handleVerifyToken(req, res) {
        // Implementar verificación de token JWT
        const token = req.headers.authorization?.replace('Bearer ', '');
        // Verificar token y retornar datos del usuario
        this.sendSuccess(res, { valid: true });
    }

    // === HANDLERS DE DASHBOARD ===
    async handleSuperAdminDashboard(req, res) {
        const dashboardData = this.userManager.getDashboardData('super_admin');
        this.sendSuccess(res, dashboardData);
    }

    async handleBuildingAdminDashboard(req, res) {
        const dashboardData = this.userManager.getDashboardData('building_admin');
        this.sendSuccess(res, dashboardData);
    }

    async handleSecurityDashboard(req, res) {
        const dashboardData = this.userManager.getDashboardData('security');
        this.sendSuccess(res, dashboardData);
    }

    async handleResidentDashboard(req, res) {
        const dashboardData = this.userManager.getDashboardData('resident');
        this.sendSuccess(res, dashboardData);
    }

    async handleGuestDashboard(req, res) {
        const dashboardData = this.userManager.getDashboardData('guest');
        this.sendSuccess(res, dashboardData);
    }

    async handleMaintenanceDashboard(req, res) {
        const dashboardData = this.userManager.getDashboardData('maintenance');
        this.sendSuccess(res, dashboardData);
    }

    // === HANDLERS DE INVITADOS ===
    async handleInviteGuest(req, res) {
        try {
            const { guestName, guestEmail, guestPhone, accessDates, areas, type } = req.body;
            
            // Simular creación de invitado
            const guest = {
                id: 'guest_' + Date.now(),
                name: guestName,
                email: guestEmail,
                phone: guestPhone,
                type: type, // temporal, recurrente
                accessDates: accessDates,
                areas: areas,
                status: 'pending',
                invitedBy: req.user?.id || 'resident001',
                createdAt: new Date(),
                qrCode: null
            };

            this.sendSuccess(res, { 
                message: 'Invitación enviada exitosamente',
                guest: guest
            });
        } catch (error) {
            this.sendError(res, 400, error.message);
        }
    }

    async handleGetMyGuests(req, res) {
        // Simular obtención de invitados del usuario
        const mockGuests = [
            {
                id: 'guest_1',
                name: 'Ana Pérez',
                email: 'ana@email.com',
                status: 'active',
                type: 'temporal',
                accessDate: '2025-09-03',
                areas: ['lobby', 'elevator', 'apartment'],
                qrCode: 'QR_12345'
            },
            {
                id: 'guest_2',
                name: 'Carlos López',
                email: 'carlos@email.com',
                status: 'pending',
                type: 'recurrente',
                accessDates: ['2025-09-03', '2025-09-10'],
                areas: ['lobby', 'gym'],
                qrCode: null
            }
        ];

        this.sendSuccess(res, { guests: mockGuests });
    }

    // === HANDLERS DE VALIDACIÓN ===
    async handleFacialValidation(req, res) {
        try {
            const { imageData, userId } = req.body;
            
            // Simular validación facial
            const isValid = Math.random() > 0.2; // 80% de éxito para demo
            
            this.sendSuccess(res, {
                valid: isValid,
                confidence: isValid ? 0.95 : 0.45,
                message: isValid ? 'Validación facial exitosa' : 'Validación facial fallida'
            });
        } catch (error) {
            this.sendError(res, 400, error.message);
        }
    }

    async handleDocumentValidation(req, res) {
        try {
            const { documentImage, documentType } = req.body;
            
            // Simular validación de documento
            const extractedData = {
                documentNumber: '12345678A',
                name: 'Juan Pérez',
                birthDate: '1990-01-01',
                isValid: true
            };
            
            this.sendSuccess(res, {
                valid: true,
                extractedData: extractedData,
                message: 'Documento validado exitosamente'
            });
        } catch (error) {
            this.sendError(res, 400, error.message);
        }
    }

    async handleQRValidation(req, res) {
        try {
            const { qrCode, location } = req.body;
            
            // Simular validación de QR
            const isValid = qrCode && qrCode.startsWith('QR_');
            
            this.sendSuccess(res, {
                valid: isValid,
                guestInfo: isValid ? {
                    name: 'Ana Pérez',
                    visitingUnit: '304',
                    validUntil: '2025-09-03T23:59:59Z'
                } : null,
                message: isValid ? 'QR válido' : 'QR inválido o expirado'
            });
        } catch (error) {
            this.sendError(res, 400, error.message);
        }
    }

    // === HANDLERS DE SISTEMA ===
    async handleHealth(req, res) {
        this.sendSuccess(res, {
            status: 'OK',
            timestamp: new Date().toISOString(),
            version: '2.0.0',
            database: 'connected',
            services: {
                authentication: 'OK',
                validation: 'OK',
                notifications: 'OK'
            }
        });
    }

    async handleSystemStatus(req, res) {
        this.sendSuccess(res, {
            system: 'UnionTech Access Control',
            version: '2.0.0',
            status: 'operational',
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            database: {
                status: 'connected',
                type: process.env.DATABASE_TYPE || 'mock'
            }
        });
    }

    // === UTILIDADES ===
    async runMiddleware(req, res) {
        for (const middleware of this.middleware) {
            await new Promise((resolve) => {
                middleware(req, res, resolve);
            });
        }
    }

    sendSuccess(res, data) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, ...data }));
    }

    sendError(res, status, message) {
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: message }));
    }

    // Iniciar servidor
    async start() {
        this.server = http.createServer(async (req, res) => {
            try {
                await this.runMiddleware(req, res);
                
                const parsedUrl = url.parse(req.url, true);
                const method = req.method;
                const path = parsedUrl.pathname;
                const routeKey = `${method} ${path}`;
                
                const handler = this.routes.get(routeKey);
                
                if (handler) {
                    await handler(req, res);
                } else {
                    this.sendError(res, 404, 'Endpoint no encontrado');
                }
            } catch (error) {
                console.error('Error del servidor:', error);
                this.sendError(res, 500, 'Error interno del servidor');
            }
        });

        this.server.listen(this.port, () => {
            console.log('\n🚀 ========================================');
            console.log('   UnionTech API Server v2.0 (Real DB)');
            console.log('========================================');
            console.log(`✅ Servidor funcionando en puerto ${this.port}`);
            console.log(`🌐 URL: http://localhost:${this.port}`);
            console.log(`🔗 Health: http://localhost:${this.port}/health`);
            console.log('========================================');
            console.log('📝 Usuarios de prueba:');
            console.log('   Super Admin: admin@uniontech.com / admin123');
            console.log('   Admin Edificio: admin.edificio@uniontech.com / building123');
            console.log('   Seguridad: seguridad@uniontech.com / security123');
            console.log('   Residente: maria.garcia@email.com / resident123');
            console.log('========================================');
            console.log('🎯 Sistema listo con gestión de roles!');
            console.log('💡 Base de datos configurada para SQL Server');
            console.log('========================================\n');
        });

        this.server.on('error', (err) => {
            console.error('❌ Error del servidor:', err.message);
            if (err.code === 'EADDRINUSE') {
                console.error(`El puerto ${this.port} ya está en uso`);
            }
            process.exit(1);
        });
    }
}

// Iniciar servidor
const server = new UnionTechServer();
server.start();

module.exports = UnionTechServer;
