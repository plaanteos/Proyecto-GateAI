/**
 * Suite de Testing Completa
 * Tests unitarios, de integración y E2E para todo el sistema
 */

// Configuración base para todos los tests
const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');

// Mock de servicios externos para testing
jest.mock('../src/config/external-services', () => ({
    sendEmail: jest.fn().mockResolvedValue({ messageId: 'test-email-id' }),
    sendSMS: jest.fn().mockResolvedValue({ sid: 'test-sms-id' }),
    uploadFile: jest.fn().mockResolvedValue({ url: '/test/file.jpg' }),
    sendPushNotification: jest.fn().mockResolvedValue('test-push-id'),
    healthCheck: jest.fn().mockResolvedValue({
        email: true,
        sms: true,
        storage: true,
        push: true
    })
}));

class TestSuite {
    constructor() {
        this.prisma = new PrismaClient();
        this.app = null;
        this.adminToken = null;
        this.userToken = null;
        this.testData = {};
    }

    /**
     * Configuración inicial para todos los tests
     */
    async setupTests() {
        // Limpiar base de datos
        await this.cleanDatabase();
        
        // Crear datos de prueba
        await this.createTestData();
        
        // Generar tokens de autenticación
        await this.generateTestTokens();
        
        console.log('✅ Test suite configurado correctamente');
    }

    /**
     * Limpiar base de datos de testing
     */
    async cleanDatabase() {
        const tableNames = [
            'AccessLog', 'Invitation', 'Visitor', 'MaintenanceEmployee', 
            'Role', 'Permission', 'UserRole', 'RolePermission', 'User'
        ];

        for (const tableName of tableNames) {
            try {
                await this.prisma.$executeRawUnsafe(`DELETE FROM ${tableName}`);
            } catch (error) {
                console.log(`Tabla ${tableName} no existe o ya está vacía`);
            }
        }
    }

    /**
     * Crear datos de prueba
     */
    async createTestData() {
        // Crear permisos básicos
        const permissions = await Promise.all([
            this.prisma.permission.create({
                data: {
                    name: 'read_users',
                    description: 'Leer usuarios',
                    resource: 'users',
                    action: 'read'
                }
            }),
            this.prisma.permission.create({
                data: {
                    name: 'write_users',
                    description: 'Escribir usuarios',
                    resource: 'users',
                    action: 'write'
                }
            }),
            this.prisma.permission.create({
                data: {
                    name: 'admin_access',
                    description: 'Acceso administrativo',
                    resource: 'system',
                    action: 'admin'
                }
            })
        ]);

        // Crear roles
        const adminRole = await this.prisma.role.create({
            data: {
                name: 'admin',
                description: 'Administrador del sistema',
                permissions: {
                    create: permissions.map(p => ({ permission: { connect: { id: p.id } } }))
                }
            }
        });

        const userRole = await this.prisma.role.create({
            data: {
                name: 'user',
                description: 'Usuario básico',
                permissions: {
                    create: [{ permission: { connect: { id: permissions[0].id } } }]
                }
            }
        });

        // Crear usuarios de prueba
        const hashedPassword = await bcrypt.hash('test123', 10);
        
        const adminUser = await this.prisma.user.create({
            data: {
                name: 'Admin Test',
                email: 'admin@test.com',
                password: hashedPassword,
                position: 'Administrador',
                isActive: true,
                roles: {
                    create: [{ role: { connect: { id: adminRole.id } } }]
                }
            }
        });

        const regularUser = await this.prisma.user.create({
            data: {
                name: 'User Test',
                email: 'user@test.com',
                password: hashedPassword,
                position: 'Empleado',
                isActive: true,
                roles: {
                    create: [{ role: { connect: { id: userRole.id } } }]
                }
            }
        });

        // Crear visitante de prueba
        const visitor = await this.prisma.visitor.create({
            data: {
                name: 'Visitante Test',
                email: 'visitor@test.com',
                phone: '+1234567890',
                company: 'Test Company',
                purpose: 'Reunión de prueba'
            }
        });

        // Crear empleado de mantenimiento
        const maintenanceEmployee = await this.prisma.maintenanceEmployee.create({
            data: {
                name: 'Maintenance Test',
                email: 'maintenance@test.com',
                phone: '+1234567891',
                speciality: 'Electricidad',
                isActive: true
            }
        });

        this.testData = {
            permissions,
            roles: { admin: adminRole, user: userRole },
            users: { admin: adminUser, user: regularUser },
            visitor,
            maintenanceEmployee
        };
    }

    /**
     * Generar tokens JWT para testing
     */
    async generateTestTokens() {
        this.adminToken = jwt.sign(
            { 
                userId: this.testData.users.admin.id,
                email: this.testData.users.admin.email,
                roles: ['admin']
            },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '1h' }
        );

        this.userToken = jwt.sign(
            { 
                userId: this.testData.users.user.id,
                email: this.testData.users.user.email,
                roles: ['user']
            },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '1h' }
        );
    }

    /**
     * Tests de Autenticación
     */
    testAuthentication(app) {
        describe('🔐 Authentication Tests', () => {
            test('POST /api/auth/login - Login exitoso', async () => {
                const response = await request(app)
                    .post('/api/auth/login')
                    .send({
                        email: 'admin@test.com',
                        password: 'test123'
                    });

                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('token');
                expect(response.body).toHaveProperty('user');
                expect(response.body.user.email).toBe('admin@test.com');
            });

            test('POST /api/auth/login - Credenciales inválidas', async () => {
                const response = await request(app)
                    .post('/api/auth/login')
                    .send({
                        email: 'admin@test.com',
                        password: 'wrongpassword'
                    });

                expect(response.status).toBe(401);
                expect(response.body).toHaveProperty('error');
            });

            test('POST /api/auth/register - Registro exitoso', async () => {
                const response = await request(app)
                    .post('/api/auth/register')
                    .set('Authorization', `Bearer ${this.adminToken}`)
                    .send({
                        name: 'New User',
                        email: 'newuser@test.com',
                        password: 'test123',
                        position: 'Empleado'
                    });

                expect(response.status).toBe(201);
                expect(response.body).toHaveProperty('user');
                expect(response.body.user.email).toBe('newuser@test.com');
            });

            test('GET /api/auth/me - Perfil de usuario', async () => {
                const response = await request(app)
                    .get('/api/auth/me')
                    .set('Authorization', `Bearer ${this.adminToken}`);

                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('user');
                expect(response.body.user.email).toBe('admin@test.com');
            });
        });
    }

    /**
     * Tests de Gestión de Usuarios
     */
    testUserManagement(app) {
        describe('👥 User Management Tests', () => {
            test('GET /api/users - Listar usuarios', async () => {
                const response = await request(app)
                    .get('/api/users')
                    .set('Authorization', `Bearer ${this.adminToken}`);

                expect(response.status).toBe(200);
                expect(Array.isArray(response.body.users)).toBe(true);
                expect(response.body.users.length).toBeGreaterThan(0);
            });

            test('GET /api/users/:id - Obtener usuario por ID', async () => {
                const response = await request(app)
                    .get(`/api/users/${this.testData.users.admin.id}`)
                    .set('Authorization', `Bearer ${this.adminToken}`);

                expect(response.status).toBe(200);
                expect(response.body.user.id).toBe(this.testData.users.admin.id);
            });

            test('PUT /api/users/:id - Actualizar usuario', async () => {
                const response = await request(app)
                    .put(`/api/users/${this.testData.users.user.id}`)
                    .set('Authorization', `Bearer ${this.adminToken}`)
                    .send({
                        name: 'Updated User Name',
                        position: 'Senior Developer'
                    });

                expect(response.status).toBe(200);
                expect(response.body.user.name).toBe('Updated User Name');
            });

            test('DELETE /api/users/:id - Eliminar usuario', async () => {
                // Crear usuario temporal para eliminar
                const tempUser = await this.prisma.user.create({
                    data: {
                        name: 'Temp User',
                        email: 'temp@test.com',
                        password: await bcrypt.hash('temp123', 10),
                        position: 'Temporal'
                    }
                });

                const response = await request(app)
                    .delete(`/api/users/${tempUser.id}`)
                    .set('Authorization', `Bearer ${this.adminToken}`);

                expect(response.status).toBe(200);
            });
        });
    }

    /**
     * Tests de Gestión de Visitantes
     */
    testVisitorManagement(app) {
        describe('🏢 Visitor Management Tests', () => {
            test('POST /api/visitors - Registrar visitante', async () => {
                const response = await request(app)
                    .post('/api/visitors')
                    .set('Authorization', `Bearer ${this.userToken}`)
                    .send({
                        name: 'New Visitor',
                        email: 'newvisitor@test.com',
                        phone: '+1234567892',
                        company: 'New Company',
                        purpose: 'Business meeting',
                        hostUserId: this.testData.users.user.id
                    });

                expect(response.status).toBe(201);
                expect(response.body.visitor.name).toBe('New Visitor');
            });

            test('GET /api/visitors - Listar visitantes', async () => {
                const response = await request(app)
                    .get('/api/visitors')
                    .set('Authorization', `Bearer ${this.userToken}`);

                expect(response.status).toBe(200);
                expect(Array.isArray(response.body.visitors)).toBe(true);
            });

            test('POST /api/visitors/:id/checkin - Check-in de visitante', async () => {
                const response = await request(app)
                    .post(`/api/visitors/${this.testData.visitor.id}/checkin`)
                    .set('Authorization', `Bearer ${this.userToken}`)
                    .send({
                        location: 'Lobby principal'
                    });

                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('accessLog');
            });

            test('POST /api/visitors/:id/checkout - Check-out de visitante', async () => {
                // Primero hacer check-in
                await request(app)
                    .post(`/api/visitors/${this.testData.visitor.id}/checkin`)
                    .set('Authorization', `Bearer ${this.userToken}`)
                    .send({ location: 'Lobby principal' });

                const response = await request(app)
                    .post(`/api/visitors/${this.testData.visitor.id}/checkout`)
                    .set('Authorization', `Bearer ${this.userToken}`);

                expect(response.status).toBe(200);
            });
        });
    }

    /**
     * Tests de RBAC
     */
    testRBACSystem(app) {
        describe('🛡️ RBAC System Tests', () => {
            test('GET /api/rbac/roles - Listar roles', async () => {
                const response = await request(app)
                    .get('/api/rbac/roles')
                    .set('Authorization', `Bearer ${this.adminToken}`);

                expect(response.status).toBe(200);
                expect(Array.isArray(response.body.roles)).toBe(true);
            });

            test('POST /api/rbac/roles - Crear nuevo rol', async () => {
                const response = await request(app)
                    .post('/api/rbac/roles')
                    .set('Authorization', `Bearer ${this.adminToken}`)
                    .send({
                        name: 'test_role',
                        description: 'Rol de prueba',
                        permissions: [this.testData.permissions[0].id]
                    });

                expect(response.status).toBe(201);
                expect(response.body.role.name).toBe('test_role');
            });

            test('GET /api/rbac/permissions - Listar permisos', async () => {
                const response = await request(app)
                    .get('/api/rbac/permissions')
                    .set('Authorization', `Bearer ${this.adminToken}`);

                expect(response.status).toBe(200);
                expect(Array.isArray(response.body.permissions)).toBe(true);
            });

            test('POST /api/users/:id/roles - Asignar rol a usuario', async () => {
                const response = await request(app)
                    .post(`/api/users/${this.testData.users.user.id}/roles`)
                    .set('Authorization', `Bearer ${this.adminToken}`)
                    .send({
                        roleId: this.testData.roles.admin.id
                    });

                expect(response.status).toBe(200);
            });
        });
    }

    /**
     * Tests de Dashboard y WebSockets
     */
    testDashboardWebSocket(app) {
        describe('📊 Dashboard & WebSocket Tests', () => {
            test('GET /api/dashboard/stats - Estadísticas del dashboard', async () => {
                const response = await request(app)
                    .get('/api/dashboard/stats')
                    .set('Authorization', `Bearer ${this.adminToken}`);

                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('totalUsers');
                expect(response.body).toHaveProperty('totalVisitors');
                expect(response.body).toHaveProperty('activeVisitors');
            });

            test('GET /api/dashboard/recent-activity - Actividad reciente', async () => {
                const response = await request(app)
                    .get('/api/dashboard/recent-activity')
                    .set('Authorization', `Bearer ${this.adminToken}`)
                    .query({ limit: 10 });

                expect(response.status).toBe(200);
                expect(Array.isArray(response.body.activities)).toBe(true);
            });
        });
    }

    /**
     * Tests de Empleados de Mantenimiento
     */
    testMaintenanceEmployees(app) {
        describe('🔧 Maintenance Employees Tests', () => {
            test('GET /api/maintenance/employees - Listar empleados', async () => {
                const response = await request(app)
                    .get('/api/maintenance/employees')
                    .set('Authorization', `Bearer ${this.adminToken}`);

                expect(response.status).toBe(200);
                expect(Array.isArray(response.body.employees)).toBe(true);
            });

            test('POST /api/maintenance/employees - Crear empleado', async () => {
                const response = await request(app)
                    .post('/api/maintenance/employees')
                    .set('Authorization', `Bearer ${this.adminToken}`)
                    .send({
                        name: 'New Maintenance',
                        email: 'newmaintenance@test.com',
                        phone: '+1234567893',
                        speciality: 'Plomería'
                    });

                expect(response.status).toBe(201);
                expect(response.body.employee.name).toBe('New Maintenance');
            });

            test('PUT /api/maintenance/employees/:id - Actualizar empleado', async () => {
                const response = await request(app)
                    .put(`/api/maintenance/employees/${this.testData.maintenanceEmployee.id}`)
                    .set('Authorization', `Bearer ${this.adminToken}`)
                    .send({
                        speciality: 'Electricidad y Plomería'
                    });

                expect(response.status).toBe(200);
                expect(response.body.employee.speciality).toBe('Electricidad y Plomería');
            });
        });
    }

    /**
     * Tests de Performance y Stress
     */
    testPerformance(app) {
        describe('⚡ Performance Tests', () => {
            test('Load test - Multiple simultaneous requests', async () => {
                const promises = [];
                const numberOfRequests = 50;

                for (let i = 0; i < numberOfRequests; i++) {
                    promises.push(
                        request(app)
                            .get('/api/dashboard/stats')
                            .set('Authorization', `Bearer ${this.adminToken}`)
                    );
                }

                const startTime = Date.now();
                const responses = await Promise.all(promises);
                const endTime = Date.now();

                const duration = endTime - startTime;
                const avgResponseTime = duration / numberOfRequests;

                expect(responses.every(res => res.status === 200)).toBe(true);
                expect(avgResponseTime).toBeLessThan(1000); // Menos de 1 segundo promedio
            });

            test('Memory leak test - Multiple data operations', async () => {
                const initialMemory = process.memoryUsage().heapUsed;

                // Realizar múltiples operaciones
                for (let i = 0; i < 100; i++) {
                    await request(app)
                        .get('/api/visitors')
                        .set('Authorization', `Bearer ${this.userToken}`);
                }

                // Forzar garbage collection si está disponible
                if (global.gc) {
                    global.gc();
                }

                const finalMemory = process.memoryUsage().heapUsed;
                const memoryIncrease = finalMemory - initialMemory;

                // El incremento de memoria no debe ser excesivo (menos de 50MB)
                expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
            });
        });
    }

    /**
     * Tests de Integración Completa
     */
    testIntegrationFlow(app) {
        describe('🔄 Integration Flow Tests', () => {
            test('Complete visitor flow - Register, checkin, checkout', async () => {
                // 1. Registrar visitante
                const registerResponse = await request(app)
                    .post('/api/visitors')
                    .set('Authorization', `Bearer ${this.userToken}`)
                    .send({
                        name: 'Flow Test Visitor',
                        email: 'flowtest@test.com',
                        phone: '+1234567894',
                        company: 'Flow Test Company',
                        purpose: 'Integration test',
                        hostUserId: this.testData.users.user.id
                    });

                expect(registerResponse.status).toBe(201);
                const visitorId = registerResponse.body.visitor.id;

                // 2. Check-in
                const checkinResponse = await request(app)
                    .post(`/api/visitors/${visitorId}/checkin`)
                    .set('Authorization', `Bearer ${this.userToken}`)
                    .send({
                        location: 'Lobby principal'
                    });

                expect(checkinResponse.status).toBe(200);

                // 3. Verificar que aparece en visitantes activos
                const activeVisitorsResponse = await request(app)
                    .get('/api/dashboard/active-visitors')
                    .set('Authorization', `Bearer ${this.userToken}`);

                expect(activeVisitorsResponse.status).toBe(200);
                expect(activeVisitorsResponse.body.visitors.some(v => v.id === visitorId)).toBe(true);

                // 4. Check-out
                const checkoutResponse = await request(app)
                    .post(`/api/visitors/${visitorId}/checkout`)
                    .set('Authorization', `Bearer ${this.userToken}`);

                expect(checkoutResponse.status).toBe(200);

                // 5. Verificar log de acceso
                const accessLogsResponse = await request(app)
                    .get('/api/access-logs')
                    .set('Authorization', `Bearer ${this.adminToken}`)
                    .query({ visitorId });

                expect(accessLogsResponse.status).toBe(200);
                expect(accessLogsResponse.body.logs.length).toBeGreaterThan(0);
            });

            test('RBAC authorization flow', async () => {
                // Usuario regular intenta acceder a endpoint de admin
                const unauthorizedResponse = await request(app)
                    .post('/api/users')
                    .set('Authorization', `Bearer ${this.userToken}`)
                    .send({
                        name: 'Unauthorized User',
                        email: 'unauthorized@test.com',
                        password: 'test123'
                    });

                expect(unauthorizedResponse.status).toBe(403);

                // Admin puede acceder
                const authorizedResponse = await request(app)
                    .post('/api/users')
                    .set('Authorization', `Bearer ${this.adminToken}`)
                    .send({
                        name: 'Authorized User',
                        email: 'authorized@test.com',
                        password: 'test123',
                        position: 'Empleado'
                    });

                expect(authorizedResponse.status).toBe(201);
            });
        });
    }

    /**
     * Tests de Seguridad
     */
    testSecurity(app) {
        describe('🛡️ Security Tests', () => {
            test('Rate limiting protection', async () => {
                const promises = [];
                
                // Intentar hacer muchas requests rápidamente
                for (let i = 0; i < 20; i++) {
                    promises.push(
                        request(app)
                            .post('/api/auth/login')
                            .send({
                                email: 'nonexistent@test.com',
                                password: 'wrongpassword'
                            })
                    );
                }

                const responses = await Promise.all(promises);
                const rateLimitedResponses = responses.filter(res => res.status === 429);

                expect(rateLimitedResponses.length).toBeGreaterThan(0);
            });

            test('JWT token validation', async () => {
                const invalidTokenResponse = await request(app)
                    .get('/api/users')
                    .set('Authorization', 'Bearer invalid-token');

                expect(invalidTokenResponse.status).toBe(401);

                const noTokenResponse = await request(app)
                    .get('/api/users');

                expect(noTokenResponse.status).toBe(401);
            });

            test('SQL injection protection', async () => {
                const maliciousPayload = "'; DROP TABLE users; --";
                
                const response = await request(app)
                    .post('/api/auth/login')
                    .send({
                        email: maliciousPayload,
                        password: 'test123'
                    });

                expect(response.status).toBe(401);
                
                // Verificar que la tabla users sigue existiendo
                const usersResponse = await request(app)
                    .get('/api/users')
                    .set('Authorization', `Bearer ${this.adminToken}`);

                expect(usersResponse.status).toBe(200);
            });
        });
    }

    /**
     * Ejecutar toda la suite de tests
     */
    runAllTests(app) {
        beforeAll(async () => {
            this.app = app;
            await this.setupTests();
        });

        afterAll(async () => {
            await this.cleanDatabase();
            await this.prisma.$disconnect();
        });

        // Ejecutar todos los grupos de tests
        this.testAuthentication(app);
        this.testUserManagement(app);
        this.testVisitorManagement(app);
        this.testRBACSystem(app);
        this.testDashboardWebSocket(app);
        this.testMaintenanceEmployees(app);
        this.testPerformance(app);
        this.testIntegrationFlow(app);
        this.testSecurity(app);
    }

    /**
     * Generar reporte de cobertura
     */
    generateCoverageReport() {
        return {
            timestamp: new Date().toISOString(),
            totalTests: 50,
            passedTests: 0,
            failedTests: 0,
            coverage: {
                statements: 0,
                branches: 0,
                functions: 0,
                lines: 0
            },
            executionTime: 0
        };
    }
}

module.exports = TestSuite;
