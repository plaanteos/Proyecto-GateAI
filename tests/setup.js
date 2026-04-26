// Setup global para todos los tests
const { PrismaClient } = require('@prisma/client');

// Variables globales para testing
global.prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.TEST_DATABASE_URL
    }
  }
});

// Configurar variables de entorno para testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.BCRYPT_ROUNDS = '4'; // Menos rounds para tests más rápidos

// Timeout global para tests
jest.setTimeout(30000);

// Cleanup después de cada test
afterEach(async () => {
  // Limpiar cache si existe
  if (global.redisClient) {
    await global.redisClient.flushall();
  }
});

// Cleanup final
afterAll(async () => {
  if (global.prisma) {
    await global.prisma.$disconnect();
  }
  
  if (global.redisClient) {
    await global.redisClient.quit();
  }
});

// Mock console en producción para tests más limpios
if (process.env.NODE_ENV === 'test') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  };
}
