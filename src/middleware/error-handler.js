/**
 * Middleware Global de Manejo de Errores
 */

const logger = require('../config/logger');

/**
 * Middleware global de manejo de errores
 */
const errorHandler = (error, req, res, next) => {
    // Log del error
    logger.logError(error, {
        path: req.path,
        method: req.method,
        ip: req.ip,
        userId: req.user?.id,
        userAgent: req.get('User-Agent')
    });

    // Error de validación de Prisma
    if (error.code === 'P2002') {
        return res.status(409).json({
            error: 'El recurso ya existe',
            code: 'DUPLICATE_RESOURCE',
            field: error.meta?.target?.[0]
        });
    }

    // Error de registro no encontrado de Prisma
    if (error.code === 'P2025') {
        return res.status(404).json({
            error: 'Recurso no encontrado',
            code: 'NOT_FOUND'
        });
    }

    // Error de conexión de base de datos
    if (error.code === 'P1001' || error.code === 'ENOTFOUND') {
        return res.status(503).json({
            error: 'Servicio temporalmente no disponible',
            code: 'SERVICE_UNAVAILABLE'
        });
    }

    // Error de JWT
    if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: 'Token inválido',
            code: 'INVALID_TOKEN'
        });
    }

    // Error de JWT expirado
    if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
            error: 'Token expirado',
            code: 'TOKEN_EXPIRED'
        });
    }

    // Error de validación
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Datos de entrada inválidos',
            code: 'VALIDATION_ERROR',
            details: error.details
        });
    }

    // Error personalizado con status
    if (error.status) {
        return res.status(error.status).json({
            error: error.message || 'Error en la petición',
            code: error.code || 'REQUEST_ERROR'
        });
    }

    // Error interno del servidor
    return res.status(500).json({
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
        ...(process.env.NODE_ENV !== 'production' && {
            stack: error.stack,
            message: error.message
        })
    });
};

/**
 * Middleware para capturar errores async
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Clase para errores personalizados
 */
class AppError extends Error {
    constructor(message, statusCode = 500, code = 'APP_ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.status = statusCode;
        this.code = code;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = errorHandler;
module.exports.asyncHandler = asyncHandler;
module.exports.AppError = AppError;
