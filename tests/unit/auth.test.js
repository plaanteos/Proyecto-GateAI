/**
 * Tests de Autenticación
 */
const request = require('supertest');
const app = require('../../src/app');
const TestSuite = require('../test-suite');

const testSuite = new TestSuite();

describe('🔐 Authentication Module', () => {
  beforeAll(async () => {
    await testSuite.setupTests();
  });

  afterAll(async () => {
    await testSuite.cleanDatabase();
    await testSuite.prisma.$disconnect();
  });

  testSuite.testAuthentication(app);
});

describe('🔐 Authentication Edge Cases', () => {
  test('Login with empty credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  test('Login with invalid email format', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'invalid-email',
        password: 'test123'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('email');
  });

  test('Register with duplicate email', async () => {
    const userData = {
      name: 'Test User',
      email: 'admin@test.com', // Email que ya existe
      password: 'test123',
      position: 'Empleado'
    };

    const response = await request(app)
      .post('/api/auth/register')
      .set('Authorization', `Bearer ${testSuite.adminToken}`)
      .send(userData);

    expect(response.status).toBe(409);
    expect(response.body.error).toContain('email');
  });

  test('Password validation requirements', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .set('Authorization', `Bearer ${testSuite.adminToken}`)
      .send({
        name: 'Test User',
        email: 'weakpass@test.com',
        password: '123', // Password muy corto
        position: 'Empleado'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('password');
  });

  test('Token expiration handling', async () => {
    // Crear token expirado
    const jwt = require('jsonwebtoken');
    const expiredToken = jwt.sign(
      { userId: 'test' },
      process.env.JWT_SECRET,
      { expiresIn: '-1h' }
    );

    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(response.status).toBe(401);
    expect(response.body.error).toContain('expired');
  });

  test('Malformed JWT token', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer malformed.token.here');

    expect(response.status).toBe(401);
    expect(response.body.error).toContain('invalid');
  });
});
