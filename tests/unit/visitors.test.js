/**
 * Tests de Gestión de Visitantes
 */
const request = require('supertest');
const app = require('../../src/app');
const TestSuite = require('../test-suite');

const testSuite = new TestSuite();

describe('🏢 Visitor Management Module', () => {
  beforeAll(async () => {
    await testSuite.setupTests();
  });

  afterAll(async () => {
    await testSuite.cleanDatabase();
    await testSuite.prisma.$disconnect();
  });

  testSuite.testVisitorManagement(app);
});

describe('🏢 Visitor Management Advanced', () => {
  test('Visitor registration with photo upload', async () => {
    const response = await request(app)
      .post('/api/visitors')
      .set('Authorization', `Bearer ${testSuite.userToken}`)
      .field('name', 'Visitor with Photo')
      .field('email', 'photvisitor@test.com')
      .field('phone', '+1234567895')
      .field('company', 'Photo Company')
      .field('purpose', 'Photo meeting')
      .field('hostUserId', testSuite.testData.users.user.id)
      .attach('photo', Buffer.from('fake-image-data'), 'visitor.jpg');

    expect(response.status).toBe(201);
    expect(response.body.visitor).toHaveProperty('photoUrl');
  });

  test('Bulk visitor registration', async () => {
    const visitors = [
      {
        name: 'Bulk Visitor 1',
        email: 'bulk1@test.com',
        phone: '+1234567896',
        company: 'Bulk Company 1',
        purpose: 'Bulk meeting 1'
      },
      {
        name: 'Bulk Visitor 2',
        email: 'bulk2@test.com',
        phone: '+1234567897',
        company: 'Bulk Company 2',
        purpose: 'Bulk meeting 2'
      }
    ];

    const response = await request(app)
      .post('/api/visitors/bulk')
      .set('Authorization', `Bearer ${testSuite.userToken}`)
      .send({
        visitors,
        hostUserId: testSuite.testData.users.user.id
      });

    expect(response.status).toBe(201);
    expect(response.body.visitors).toHaveLength(2);
  });

  test('Visitor search and filtering', async () => {
    // Crear algunos visitantes para buscar
    await request(app)
      .post('/api/visitors')
      .set('Authorization', `Bearer ${testSuite.userToken}`)
      .send({
        name: 'Search Test Visitor',
        email: 'searchtest@test.com',
        phone: '+1234567898',
        company: 'Search Test Company',
        purpose: 'Search test meeting',
        hostUserId: testSuite.testData.users.user.id
      });

    // Buscar por nombre
    const searchResponse = await request(app)
      .get('/api/visitors/search')
      .set('Authorization', `Bearer ${testSuite.userToken}`)
      .query({ q: 'Search Test' });

    expect(searchResponse.status).toBe(200);
    expect(searchResponse.body.visitors.length).toBeGreaterThan(0);

    // Filtrar por empresa
    const filterResponse = await request(app)
      .get('/api/visitors')
      .set('Authorization', `Bearer ${testSuite.userToken}`)
      .query({ company: 'Search Test Company' });

    expect(filterResponse.status).toBe(200);
    expect(filterResponse.body.visitors.length).toBeGreaterThan(0);
  });

  test('Visitor check-in with QR code', async () => {
    const visitor = await request(app)
      .post('/api/visitors')
      .set('Authorization', `Bearer ${testSuite.userToken}`)
      .send({
        name: 'QR Test Visitor',
        email: 'qrtest@test.com',
        phone: '+1234567899',
        company: 'QR Test Company',
        purpose: 'QR test meeting',
        hostUserId: testSuite.testData.users.user.id
      });

    const qrCode = visitor.body.visitor.qrCode;

    const response = await request(app)
      .post('/api/visitors/checkin-qr')
      .set('Authorization', `Bearer ${testSuite.userToken}`)
      .send({
        qrCode,
        location: 'QR Lobby'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('accessLog');
  });

  test('Visitor status transitions', async () => {
    const visitor = await request(app)
      .post('/api/visitors')
      .set('Authorization', `Bearer ${testSuite.userToken}`)
      .send({
        name: 'Status Test Visitor',
        email: 'statustest@test.com',
        phone: '+1234567900',
        company: 'Status Test Company',
        purpose: 'Status test meeting',
        hostUserId: testSuite.testData.users.user.id
      });

    const visitorId = visitor.body.visitor.id;

    // Verificar estado inicial
    let statusResponse = await request(app)
      .get(`/api/visitors/${visitorId}`)
      .set('Authorization', `Bearer ${testSuite.userToken}`);

    expect(statusResponse.body.visitor.status).toBe('registered');

    // Check-in
    await request(app)
      .post(`/api/visitors/${visitorId}/checkin`)
      .set('Authorization', `Bearer ${testSuite.userToken}`)
      .send({ location: 'Status Lobby' });

    statusResponse = await request(app)
      .get(`/api/visitors/${visitorId}`)
      .set('Authorization', `Bearer ${testSuite.userToken}`);

    expect(statusResponse.body.visitor.status).toBe('checked_in');

    // Check-out
    await request(app)
      .post(`/api/visitors/${visitorId}/checkout`)
      .set('Authorization', `Bearer ${testSuite.userToken}`);

    statusResponse = await request(app)
      .get(`/api/visitors/${visitorId}`)
      .set('Authorization', `Bearer ${testSuite.userToken}`);

    expect(statusResponse.body.visitor.status).toBe('checked_out');
  });

  test('Visitor access history', async () => {
    const visitor = await request(app)
      .post('/api/visitors')
      .set('Authorization', `Bearer ${testSuite.userToken}`)
      .send({
        name: 'History Test Visitor',
        email: 'historytest@test.com',
        phone: '+1234567901',
        company: 'History Test Company',
        purpose: 'History test meeting',
        hostUserId: testSuite.testData.users.user.id
      });

    const visitorId = visitor.body.visitor.id;

    // Realizar varios check-ins y check-outs
    await request(app)
      .post(`/api/visitors/${visitorId}/checkin`)
      .set('Authorization', `Bearer ${testSuite.userToken}`)
      .send({ location: 'History Lobby 1' });

    await request(app)
      .post(`/api/visitors/${visitorId}/checkout`)
      .set('Authorization', `Bearer ${testSuite.userToken}`);

    await request(app)
      .post(`/api/visitors/${visitorId}/checkin`)
      .set('Authorization', `Bearer ${testSuite.userToken}`)
      .send({ location: 'History Lobby 2' });

    const historyResponse = await request(app)
      .get(`/api/visitors/${visitorId}/history`)
      .set('Authorization', `Bearer ${testSuite.userToken}`);

    expect(historyResponse.status).toBe(200);
    expect(historyResponse.body.history.length).toBeGreaterThanOrEqual(2);
  });
});
