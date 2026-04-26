const logger = require('../utils/logger');

class ErrorHandler {
  static handle(err, req, res, next) {
    let error = { ...err };
    error.message = err.message;

    // Log del error
    logger.error('Error Handler', err, {
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id
    });

    // Prisma Errors
    if (err.code === 'P2002') {
      const message = 'Recurso duplicado - ya existe un registro con esos datos';
      error = new ErrorResponse(message, 400);
    }

    if (err.code === 'P2025') {
      const message = 'Recurso no encontrado';
      error = new ErrorResponse(message, 404);
    }

    // Validation Error
    if (err.name === 'ValidationError') {
      const message = Object.values(err.errors).map(val => val.message);
      error = new ErrorResponse(message, 400);
    }

    // JWT Errors
    if (err.name === 'JsonWebTokenError') {
      const message = 'Token inválido';
      error = new ErrorResponse(message, 401);
    }

    if (err.name === 'TokenExpiredError') {
      const message = 'Token expirado';
      error = new ErrorResponse(message, 401);
    }

    // Cast Error (invalid ObjectId, etc)
    if (err.name === 'CastError') {
      const message = 'Recurso no encontrado';
      error = new ErrorResponse(message, 404);
    }

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error interno del servidor',
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        originalError: err
      })
    });
  }

  static notFound(req, res, next) {
    const message = `Ruta no encontrada - ${req.originalUrl}`;
    logger.warn('Route not found', {
      url: req.originalUrl,
      method: req.method,
      ip: req.ip
    });
    
    res.status(404).json({
      success: false,
      message
    });
  }

  static asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }
}

class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Graceful shutdown handler
const gracefulShutdown = () => {
  logger.info('Iniciando apagado graceful del servidor...');
  
  process.on('SIGTERM', () => {
    logger.info('SIGTERM recibido. Cerrando servidor HTTP...');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT recibido. Cerrando servidor HTTP...');
    process.exit(0);
  });

  process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Promise Rejection', err);
    process.exit(1);
  });

  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception', err);
    process.exit(1);
  });
};

module.exports = {
  ErrorHandler,
  ErrorResponse,
  gracefulShutdown
};
