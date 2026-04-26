/**
 * Configuración de Logger Avanzado
 * Sistema de logging con Winston para desarrollo y producción
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Crear directorio de logs si no existe
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Formato personalizado para logs
const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
        
        if (Object.keys(meta).length > 0) {
            log += ` ${JSON.stringify(meta)}`;
        }
        
        if (stack) {
            log += `\n${stack}`;
        }
        
        return log;
    })
);

// Configurar transportes según el entorno
const transports = [];

// Siempre log a consola en desarrollo
if (process.env.NODE_ENV !== 'production') {
    transports.push(
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                logFormat
            )
        })
    );
}

// Log a archivos
transports.push(
    // Todos los logs
    new winston.transports.File({
        filename: path.join(logsDir, 'app.log'),
        format: logFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5
    }),
    
    // Solo errores
    new winston.transports.File({
        filename: path.join(logsDir, 'error.log'),
        level: 'error',
        format: logFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5
    })
);

// En producción, también log a consola pero sin colores
if (process.env.NODE_ENV === 'production') {
    transports.push(
        new winston.transports.Console({
            format: logFormat
        })
    );
}

// Crear logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    format: logFormat,
    transports,
    // No salir en errores no manejados
    exitOnError: false
});

// Interceptar console.log en desarrollo para debugging
if (process.env.NODE_ENV !== 'production') {
    const originalLog = console.log;
    console.log = (...args) => {
        logger.debug(args.join(' '));
        originalLog.apply(console, args);
    };
    
    const originalError = console.error;
    console.error = (...args) => {
        logger.error(args.join(' '));
        originalError.apply(console, args);
    };
}

// Función helper para logging estructurado
logger.logRequest = (req, res, duration) => {
    const logData = {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    };
    
    if (req.user) {
        logData.userId = req.user.id;
        logData.userEmail = req.user.email;
    }
    
    const level = res.statusCode >= 400 ? 'warn' : 'info';
    logger[level]('HTTP Request', logData);
};

// Función helper para logging de errores
logger.logError = (error, context = {}) => {
    logger.error('Application Error', {
        message: error.message,
        stack: error.stack,
        code: error.code,
        ...context
    });
};

// Función helper para logging de eventos de negocio
logger.logBusinessEvent = (event, data = {}) => {
    logger.info('Business Event', {
        event,
        timestamp: new Date().toISOString(),
        ...data
    });
};

// Función helper para logging de seguridad
logger.logSecurityEvent = (event, data = {}) => {
    logger.warn('Security Event', {
        event,
        timestamp: new Date().toISOString(),
        severity: 'security',
        ...data
    });
};

module.exports = logger;
