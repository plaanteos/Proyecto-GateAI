require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('@prisma/client');

// Importar middlewares
const { auditMiddleware } = require('./middleware/auditLogger');
const { ErrorHandler, gracefulShutdown } = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Importar rutas
const authRoutes = require('./routes/auth');
const personasRoutes = require('./routes/personas');
const edificiosRoutes = require('./routes/edificios');
const accesosRoutes = require('./routes/accesos');
const visitantesRoutes = require('./routes/visitantes');
const reportesRoutes = require('./routes/reportes');
const reportsRoutes = require('./routes/reports'); // Nueva ruta para sistema de reportes avanzado
const securityRoutes = require('./routes/security'); // Sistema de logs críticos (HU10)
const notificationsRoutes = require('./routes/notifications');
const accessRoutes = require('./routes/access');
const validationRoutes = require('./routes/validation');
const maintenanceRoutes = require('./routes/maintenance'); // Empleados de mantenimiento
const rbacRoutes = require('./routes/rbac-simple'); // Control de acceso basado en roles
const dashboardRoutes = require('./routes/dashboard'); // Dashboard en tiempo real

// Inicializar Prisma
let prisma;
try {
  prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  });
  logger.info('Prisma Client inicializado correctamente');
} catch (error) {
  logger.error('Error inicializando Prisma', error);
  prisma = null;
}

// Crear app Express
const app = express();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Límite de 100 requests por ventana por IP
  message: {
    success: false,
    message: 'Demasiadas peticiones desde esta IP, intenta de nuevo más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middlewares de seguridad y configuración
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || '*',
  credentials: true,
}));

app.use(limiter);

// Custom Morgan format with logger
morgan.token('user-id', (req) => req.user?.id || 'anonymous');
const morganFormat = ':remote-addr - :user-id [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms';

app.use(morgan(morganFormat, {
  stream: {
    write: (message) => {
      const parts = message.trim().split(' ');
      const statusCode = parseInt(parts[6]);
      const responseTime = parseFloat(parts[parts.length - 2]);
      
      logger.access(
        parts[5].replace(/"/g, ''), // method
        parts[6].replace(/"/g, ''), // url
        statusCode,
        responseTime,
        parts[2] !== 'anonymous' ? parts[2] : null, // userId
        parts[0] // ip
      );
    }
  }
}));

app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true }));

// Middleware de auditoría
app.use(auditMiddleware());

// Hacer Prisma disponible en todas las rutas
app.use((req, res, next) => {
  req.prisma = prisma;
  next();
});

// Configuración de rutas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/visitors', require('./routes/visitantes'));
app.use('/api/maintenance', require('./routes/maintenance'));
app.use('/api/documentos-invitacion', require('./routes/documentos-invitacion'));
app.use('/api/rbac', rbacRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const databaseService = require('./services/databaseService');
    const dbHealth = await databaseService.healthCheck();
    
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: dbHealth,
      services: {
        twilio: {
          configured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
          status: 'unknown'
        },
        sendgrid: {
          configured: !!process.env.SENDGRID_API_KEY,
          status: 'unknown'
        }
      }
    };
    
    res.status(200).json(health);
    
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Endpoint de información del sistema
app.get('/api/system/info', async (req, res) => {
  try {
    const packageJson = require('../package.json');
    
    const systemInfo = {
      name: packageJson.name,
      version: packageJson.version,
      description: packageJson.description,
      node_version: process.version,
      platform: process.platform,
      environment: process.env.NODE_ENV || 'development',
      components: {
        backend: 'active',
        chatbot: 'active',
        notifications: 'active',
        analytics: 'active',
        database: 'active'
      },
      features: {
        qr_access_control: true,
        whatsapp_notifications: !!(process.env.TWILIO_ACCOUNT_SID),
        email_notifications: !!(process.env.SENDGRID_API_KEY),
        visitor_management: true,
        advanced_analytics: true,
        real_time_dashboard: true
      }
    };
    
    res.json({
      success: true,
      data: systemInfo
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo información del sistema',
      error: error.message
    });
  }
});

// Ruta de salud del servidor
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'API UnionTech funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Middlewares de manejo de errores (deben ir al final)
app.use(ErrorHandler.notFound);
app.use(ErrorHandler.handle);

// Inicializar graceful shutdown
gracefulShutdown();

// Cleanup de logs cada 24 horas (solo en producción)
if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    logger.cleanupOldLogs();
  }, 24 * 60 * 60 * 1000);
}

module.exports = app;
