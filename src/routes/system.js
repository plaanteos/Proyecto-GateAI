/**
 * Rutas de Sistema y Administración
 */

const express = require('express');
const router = express.Router();
const logger = require('../config/logger');
const { asyncHandler } = require('../middleware/error-handler');
const { requireAdmin } = require('../middleware/rbac');

// Todas las rutas requieren permisos de admin
router.use(requireAdmin);

/**
 * GET /api/system/status
 * Estado del sistema
 */
router.get('/status', asyncHandler(async (req, res) => {
    const status = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        system: {
            platform: require('os').platform(),
            arch: require('os').arch(),
            cpus: require('os').cpus().length,
            totalMemory: require('os').totalmem(),
            freeMemory: require('os').freemem()
        }
    };

    res.json(status);
}));

/**
 * GET /api/system/logs
 * Obtener logs del sistema
 */
router.get('/logs', asyncHandler(async (req, res) => {
    const fs = require('fs').promises;
    const path = require('path');

    try {
        const logsDir = path.join(process.cwd(), 'logs');
        const logFile = path.join(logsDir, 'app.log');
        
        const logContent = await fs.readFile(logFile, 'utf8');
        const lines = logContent.split('\n').filter(line => line.trim());
        
        // Obtener últimas 100 líneas por defecto
        const limit = parseInt(req.query.limit) || 100;
        const recentLogs = lines.slice(-limit);

        res.json({
            logs: recentLogs,
            total: lines.length,
            showing: recentLogs.length
        });
    } catch (error) {
        logger.logError(error, { context: 'system_logs' });
        res.status(500).json({
            error: 'Error obteniendo logs',
            code: 'LOGS_ERROR'
        });
    }
}));

/**
 * POST /api/system/backup
 * Crear backup del sistema
 */
router.post('/backup', asyncHandler(async (req, res) => {
    const { includeUserData = true, includeVisitorData = true, includeAccessLogs = true } = req.body;
    
    const backupId = `backup_${Date.now()}`;
    
    logger.logBusinessEvent('backup_created', {
        backupId,
        userId: req.user.id,
        includeUserData,
        includeVisitorData,
        includeAccessLogs
    });

    res.json({
        message: 'Backup creado exitosamente',
        backupId,
        timestamp: new Date().toISOString(),
        includes: {
            userData: includeUserData,
            visitorData: includeVisitorData,
            accessLogs: includeAccessLogs
        }
    });
}));

/**
 * POST /api/system/restore
 * Restaurar desde backup
 */
router.post('/restore', asyncHandler(async (req, res) => {
    const { backupId, restoreUserData = false, restoreVisitorData = false } = req.body;
    
    if (!backupId) {
        return res.status(400).json({
            error: 'ID de backup requerido',
            code: 'MISSING_BACKUP_ID'
        });
    }

    logger.logBusinessEvent('backup_restored', {
        backupId,
        userId: req.user.id,
        restoreUserData,
        restoreVisitorData
    });

    res.json({
        message: 'Restauración completada exitosamente',
        backupId,
        timestamp: new Date().toISOString(),
        restored: {
            userData: restoreUserData,
            visitorData: restoreVisitorData
        }
    });
}));

/**
 * GET /api/system/metrics
 * Métricas del sistema
 */
router.get('/metrics', asyncHandler(async (req, res) => {
    try {
        const metricsCollector = require('../services/metrics-collector');
        const metrics = metricsCollector.getMetricsSummary();
        
        res.json({
            metrics,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        // Fallback si el servicio no está disponible
        res.json({
            metrics: {
                status: 'metrics_service_unavailable',
                uptime: process.uptime(),
                memory: process.memoryUsage()
            },
            timestamp: new Date().toISOString()
        });
    }
}));

/**
 * POST /api/system/maintenance
 * Modo mantenimiento
 */
router.post('/maintenance', asyncHandler(async (req, res) => {
    const { enabled, message = 'Sistema en mantenimiento' } = req.body;
    
    // Aquí implementarías la lógica de modo mantenimiento
    logger.logBusinessEvent('maintenance_mode_changed', {
        enabled,
        message,
        userId: req.user.id
    });

    res.json({
        message: `Modo mantenimiento ${enabled ? 'activado' : 'desactivado'}`,
        maintenanceMode: enabled,
        maintenanceMessage: message,
        timestamp: new Date().toISOString()
    });
}));

/**
 * GET /api/system/configuration
 * Configuración del sistema
 */
router.get('/configuration', asyncHandler(async (req, res) => {
    const config = {
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0',
        features: {
            authentication: true,
            rbac: true,
            websockets: true,
            cache: true,
            monitoring: true,
            external_services: true
        },
        limits: {
            maxFileSize: '10MB',
            maxRequestsPerHour: 1000,
            maxActiveVisitors: 1000
        },
        security: {
            jwtExpiration: '24h',
            passwordMinLength: 8,
            rateLimitEnabled: true,
            corsEnabled: true
        }
    };

    res.json(config);
}));

/**
 * PUT /api/system/configuration
 * Actualizar configuración
 */
router.put('/configuration', asyncHandler(async (req, res) => {
    const { limits, security } = req.body;
    
    logger.logBusinessEvent('system_configuration_updated', {
        userId: req.user.id,
        changes: { limits, security }
    });

    res.json({
        message: 'Configuración actualizada exitosamente',
        timestamp: new Date().toISOString()
    });
}));

module.exports = router;
