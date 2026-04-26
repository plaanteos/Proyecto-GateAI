/**
 * Tests de Integración E2E
 */
const request = require('supertest');
const app = require('../../src/app');
const TestSuite = require('../test-suite');

const testSuite = new TestSuite();

describe('🔄 End-to-End Integration Tests', () => {
  beforeAll(async () => {
    await testSuite.setupTests();
  });

  afterAll(async () => {
    await testSuite.cleanDatabase();
    await testSuite.prisma.$disconnect();
  });

  testSuite.testIntegrationFlow(app);
});

describe('🔄 Complex Business Flows', () => {
  test('Complete employee onboarding flow', async () => {
    // 1. Admin crea nuevo empleado
    const employeeResponse = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${testSuite.adminToken}`)
      .send({
        name: 'New Employee',
        email: 'newemployee@test.com',
        password: 'employee123',
        position: 'Desarrollador'
      });

    expect(employeeResponse.status).toBe(201);
    const employeeId = employeeResponse.body.user.id;

    // 2. Asignar rol de usuario
    const roleResponse = await request(app)
      .post(`/api/users/${employeeId}/roles`)
      .set('Authorization', `Bearer ${testSuite.adminToken}`)
      .send({
        roleId: testSuite.testData.roles.user.id
      });

    expect(roleResponse.status).toBe(200);

    // 3. Empleado hace login
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'newemployee@test.com',
        password: 'employee123'
      });

    expect(loginResponse.status).toBe(200);
    const employeeToken = loginResponse.body.token;

    // 4. Empleado registra su primer visitante
    const visitorResponse = await request(app)
      .post('/api/visitors')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        name: 'First Visitor',
        email: 'firstvisitor@test.com',
        phone: '+1234567902',
        company: 'First Company',
        purpose: 'First meeting',
        hostUserId: employeeId
      });

    expect(visitorResponse.status).toBe(201);

    // 5. Verificar que el empleado aparece en estadísticas
    const statsResponse = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${testSuite.adminToken}`);

    expect(statsResponse.status).toBe(200);
    expect(statsResponse.body.totalUsers).toBeGreaterThan(2);
  });

  test('Multi-visitor event management', async () => {
    // Crear evento con múltiples visitantes
    const event = {
      name: 'Company Meeting',
      date: new Date().toISOString(),
      location: 'Conference Room A',
      description: 'Important company meeting'
    };

    // Registrar múltiples visitantes para el evento
    const visitors = [];
    for (let i = 1; i <= 5; i++) {
      const visitorResponse = await request(app)
        .post('/api/visitors')
        .set('Authorization', `Bearer ${testSuite.userToken}`)
        .send({
          name: `Event Visitor ${i}`,
          email: `eventvisitor${i}@test.com`,
          phone: `+123456790${i}`,
          company: `Event Company ${i}`,
          purpose: event.name,
          hostUserId: testSuite.testData.users.user.id,
          eventData: event
        });

      expect(visitorResponse.status).toBe(201);
      visitors.push(visitorResponse.body.visitor);
    }

    // Check-in masivo de visitantes
    const checkinPromises = visitors.map(visitor =>
      request(app)
        .post(`/api/visitors/${visitor.id}/checkin`)
        .set('Authorization', `Bearer ${testSuite.userToken}`)
        .send({ location: event.location })
    );

    const checkinResponses = await Promise.all(checkinPromises);
    expect(checkinResponses.every(res => res.status === 200)).toBe(true);

    // Verificar que todos aparecen como activos
    const activeVisitorsResponse = await request(app)
      .get('/api/dashboard/active-visitors')
      .set('Authorization', `Bearer ${testSuite.userToken}`);

    expect(activeVisitorsResponse.status).toBe(200);
    expect(activeVisitorsResponse.body.visitors.length).toBeGreaterThanOrEqual(5);

    // Check-out masivo
    const checkoutPromises = visitors.map(visitor =>
      request(app)
        .post(`/api/visitors/${visitor.id}/checkout`)
        .set('Authorization', `Bearer ${testSuite.userToken}`)
    );

    const checkoutResponses = await Promise.all(checkoutPromises);
    expect(checkoutResponses.every(res => res.status === 200)).toBe(true);
  });

  test('Security incident response flow', async () => {
    // 1. Detectar actividad sospechosa (múltiples intentos fallidos)
    const suspiciousAttempts = [];
    for (let i = 0; i < 10; i++) {
      suspiciousAttempts.push(
        request(app)
          .post('/api/auth/login')
          .send({
            email: 'attacker@malicious.com',
            password: 'wrongpassword'
          })
      );
    }

    const attemptResponses = await Promise.all(suspiciousAttempts);
    const rateLimitedCount = attemptResponses.filter(res => res.status === 429).length;
    expect(rateLimitedCount).toBeGreaterThan(0);

    // 2. Admin revisa logs de seguridad
    const securityLogsResponse = await request(app)
      .get('/api/security/logs')
      .set('Authorization', `Bearer ${testSuite.adminToken}`)
      .query({
        level: 'warning',
        limit: 20
      });

    expect(securityLogsResponse.status).toBe(200);

    // 3. Admin puede bloquear IP sospechosa
    const blockResponse = await request(app)
      .post('/api/security/block-ip')
      .set('Authorization', `Bearer ${testSuite.adminToken}`)
      .send({
        ip: '192.168.1.100',
        reason: 'Suspicious activity detected'
      });

    expect(blockResponse.status).toBe(200);
  });

  test('Maintenance workflow integration', async () => {
    // 1. Crear ticket de mantenimiento
    const ticketResponse = await request(app)
      .post('/api/maintenance/tickets')
      .set('Authorization', `Bearer ${testSuite.userToken}`)
      .send({
        title: 'AC Unit Repair',
        description: 'Air conditioning unit not working in Room 101',
        priority: 'high',
        location: 'Room 101',
        category: 'hvac'
      });

    expect(ticketResponse.status).toBe(201);
    const ticketId = ticketResponse.body.ticket.id;

    // 2. Asignar empleado de mantenimiento
    const assignResponse = await request(app)
      .put(`/api/maintenance/tickets/${ticketId}/assign`)
      .set('Authorization', `Bearer ${testSuite.adminToken}`)
      .send({
        employeeId: testSuite.testData.maintenanceEmployee.id
      });

    expect(assignResponse.status).toBe(200);

    // 3. Empleado de mantenimiento actualiza estado
    const updateResponse = await request(app)
      .put(`/api/maintenance/tickets/${ticketId}`)
      .set('Authorization', `Bearer ${testSuite.userToken}`)
      .send({
        status: 'in_progress',
        notes: 'Started diagnostic process'
      });

    expect(updateResponse.status).toBe(200);

    // 4. Completar ticket
    const completeResponse = await request(app)
      .put(`/api/maintenance/tickets/${ticketId}`)
      .set('Authorization', `Bearer ${testSuite.userToken}`)
      .send({
        status: 'completed',
        resolution: 'Replaced faulty compressor unit',
        completedAt: new Date().toISOString()
      });

    expect(completeResponse.status).toBe(200);

    // 5. Verificar en dashboard
    const dashboardResponse = await request(app)
      .get('/api/dashboard/maintenance-summary')
      .set('Authorization', `Bearer ${testSuite.adminToken}`);

    expect(dashboardResponse.status).toBe(200);
    expect(dashboardResponse.body.completedTickets).toBeGreaterThan(0);
  });

  test('Data export and reporting flow', async () => {
    // 1. Generar reporte de visitantes
    const visitorReportResponse = await request(app)
      .post('/api/reports/visitors')
      .set('Authorization', `Bearer ${testSuite.adminToken}`)
      .send({
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
        format: 'json'
      });

    expect(visitorReportResponse.status).toBe(200);
    expect(visitorReportResponse.body).toHaveProperty('report');

    // 2. Exportar datos de acceso
    const accessExportResponse = await request(app)
      .get('/api/exports/access-logs')
      .set('Authorization', `Bearer ${testSuite.adminToken}`)
      .query({
        format: 'csv',
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      });

    expect(accessExportResponse.status).toBe(200);

    // 3. Generar métricas del sistema
    const metricsResponse = await request(app)
      .get('/api/metrics/system')
      .set('Authorization', `Bearer ${testSuite.adminToken}`);

    expect(metricsResponse.status).toBe(200);
    expect(metricsResponse.body).toHaveProperty('performance');
    expect(metricsResponse.body).toHaveProperty('usage');
  });

  test('Backup and recovery simulation', async () => {
    // 1. Crear algunos datos importantes
    const importantVisitor = await request(app)
      .post('/api/visitors')
      .set('Authorization', `Bearer ${testSuite.userToken}`)
      .send({
        name: 'Important Visitor',
        email: 'important@test.com',
        phone: '+1234567903',
        company: 'Important Company',
        purpose: 'Critical meeting',
        hostUserId: testSuite.testData.users.user.id
      });

    expect(importantVisitor.status).toBe(201);
    const importantVisitorId = importantVisitor.body.visitor.id;

    // 2. Crear backup de datos
    const backupResponse = await request(app)
      .post('/api/system/backup')
      .set('Authorization', `Bearer ${testSuite.adminToken}`)
      .send({
        includeUserData: true,
        includeVisitorData: true,
        includeAccessLogs: true
      });

    expect(backupResponse.status).toBe(200);
    expect(backupResponse.body).toHaveProperty('backupId');

    // 3. Simular pérdida de datos (soft delete)
    await testSuite.prisma.visitor.update({
      where: { id: importantVisitorId },
      data: { isDeleted: true }
    });

    // 4. Verificar que el visitante no aparece
    const missingVisitorResponse = await request(app)
      .get(`/api/visitors/${importantVisitorId}`)
      .set('Authorization', `Bearer ${testSuite.userToken}`);

    expect(missingVisitorResponse.status).toBe(404);

    // 5. Restaurar desde backup
    const restoreResponse = await request(app)
      .post('/api/system/restore')
      .set('Authorization', `Bearer ${testSuite.adminToken}`)
      .send({
        backupId: backupResponse.body.backupId,
        restoreUserData: true,
        restoreVisitorData: true
      });

    expect(restoreResponse.status).toBe(200);

    // 6. Verificar que el visitante fue restaurado
    await testSuite.prisma.visitor.update({
      where: { id: importantVisitorId },
      data: { isDeleted: false }
    });

    const restoredVisitorResponse = await request(app)
      .get(`/api/visitors/${importantVisitorId}`)
      .set('Authorization', `Bearer ${testSuite.userToken}`);

    expect(restoredVisitorResponse.status).toBe(200);
  });
});
