// Rutas para Logs de Actividad Crítica - HU10
// API endpoints para gestión de logs de seguridad

const express = require('express');
const CriticalLogsController = require('../controllers/criticalLogsController');
const { auth } = require('../middleware/auth');

const router = express.Router();
const criticalLogsController = new CriticalLogsController();

// Middleware de autenticación para todas las rutas
router.use(auth);

// Middleware para verificar permisos de seguridad
const requireSecurityPermissions = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Usuario no autenticado'
        });
    }

    // Solo usuarios con rol admin o security pueden acceder a logs críticos
    const allowedRoles = ['admin', 'security', 'supervisor'];
    if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: 'Permisos insuficientes para acceder a logs de seguridad'
        });
    }

    next();
};

// Aplicar middleware de permisos a todas las rutas
router.use(requireSecurityPermissions);

/**
 * @route GET /api/security/logs
 * @desc Obtener logs críticos con filtros opcionales
 * @access Private (Admin/Security)
 * @query {string} startDate - Fecha de inicio (ISO string)
 * @query {string} endDate - Fecha de fin (ISO string)
 * @query {string} category - Categoría del evento (AUTHENTICATION, ACCESS_CONTROL, etc.)
 * @query {string} level - Nivel del log (INFO, WARNING, ERROR, CRITICAL)
 * @query {string} userId - ID del usuario
 * @query {number} limit - Límite de resultados (máximo 500)
 * @query {number} page - Página de resultados
 */
router.get('/logs', async (req, res) => {
    await criticalLogsController.getLogs(req, res);
});

/**
 * @route GET /api/security/summary
 * @desc Obtener resumen de actividad de seguridad
 * @access Private (Admin/Security)
 * @query {number} hours - Horas hacia atrás para el resumen (default: 24)
 */
router.get('/summary', async (req, res) => {
    await criticalLogsController.getSecuritySummary(req, res);
});

/**
 * @route POST /api/security/logs
 * @desc Registrar un evento crítico manualmente
 * @access Private (Admin/Security)
 * @body {string} category - Categoría del evento
 * @body {string} action - Acción realizada
 * @body {string} level - Nivel de severidad
 * @body {object} details - Detalles adicionales del evento
 * @body {string} userId - ID del usuario (opcional)
 * @body {string} ipAddress - Dirección IP (opcional)
 */
router.post('/logs', async (req, res) => {
    await criticalLogsController.logCriticalEvent(req, res);
});

/**
 * @route GET /api/security/alerts
 * @desc Obtener alertas de seguridad activas
 * @access Private (Admin/Security)
 * @query {number} hours - Horas hacia atrás para buscar alertas (default: 24)
 */
router.get('/alerts', async (req, res) => {
    await criticalLogsController.getActiveAlerts(req, res);
});

/**
 * @route GET /api/security/dashboard
 * @desc Obtener dashboard completo de seguridad
 * @access Private (Admin/Security)
 */
router.get('/dashboard', async (req, res) => {
    await criticalLogsController.getSecurityDashboard(req, res);
});

/**
 * @route DELETE /api/security/logs/cleanup
 * @desc Limpiar logs antiguos (solo administradores)
 * @access Private (Admin only)
 * @body {number} daysToKeep - Días de logs a mantener (default: 30)
 */
router.delete('/logs/cleanup', async (req, res) => {
    // Verificar que solo administradores puedan limpiar logs
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Solo administradores pueden limpiar logs'
        });
    }
    
    await criticalLogsController.cleanupLogs(req, res);
});

/**
 * @route GET /api/security/logs/categories
 * @desc Obtener lista de categorías disponibles
 * @access Private (Admin/Security)
 */
router.get('/logs/categories', (req, res) => {
    const categories = [
        {
            name: 'AUTHENTICATION',
            description: 'Eventos de autenticación',
            actions: ['LOGIN', 'LOGOUT', 'FAILED_LOGIN', 'PASSWORD_CHANGE']
        },
        {
            name: 'ACCESS_CONTROL',
            description: 'Control de acceso a recursos',
            actions: ['UNAUTHORIZED_ACCESS', 'PERMISSION_DENIED', 'ACCESS_GRANTED']
        },
        {
            name: 'SECURITY',
            description: 'Eventos de seguridad críticos',
            actions: ['SECURITY_VIOLATION', 'SUSPICIOUS_PATTERN_DETECTED', 'INTRUSION_ATTEMPT']
        },
        {
            name: 'AUTHORIZATION',
            description: 'Cambios de permisos y roles',
            actions: ['PRIVILEGE_ESCALATION', 'ROLE_CHANGE', 'PERMISSION_GRANTED']
        },
        {
            name: 'DATA_ACCESS',
            description: 'Acceso a datos sensibles',
            actions: ['SENSITIVE_DATA_ACCESS', 'DATA_EXPORT', 'BULK_DATA_ACCESS']
        },
        {
            name: 'SYSTEM',
            description: 'Eventos del sistema',
            actions: ['SYSTEM_ERROR', 'SERVICE_RESTART', 'LOG_CLEANUP']
        },
        {
            name: 'CONFIGURATION',
            description: 'Cambios de configuración',
            actions: ['CONFIG_CHANGE', 'SECURITY_SETTING_CHANGE', 'SYSTEM_SETTING_CHANGE']
        }
    ];

    res.json({
        success: true,
        data: categories
    });
});

/**
 * @route GET /api/security/logs/export
 * @desc Exportar logs en formato CSV
 * @access Private (Admin/Security)
 * @query {string} format - Formato de exportación (csv, json)
 * @query {string} startDate - Fecha de inicio
 * @query {string} endDate - Fecha de fin
 */
router.get('/logs/export', async (req, res) => {
    try {
        const { format = 'csv', startDate, endDate, category, level } = req.query;
        
        const options = {
            limit: 10000, // Límite alto para exportación
            category,
            level
        };

        if (startDate) options.startDate = new Date(startDate);
        if (endDate) options.endDate = new Date(endDate);

        const logs = await criticalLogsController.logger.getCriticalLogs(options);

        if (format === 'csv') {
            // Generar CSV
            const csvHeader = 'Timestamp,ID,Level,Category,Action,User ID,IP Address,Severity,Risk Score,Details\n';
            const csvRows = logs.map(log => {
                const details = JSON.stringify(log.details || {}).replace(/"/g, '""');
                return `"${log.timestamp}","${log.id}","${log.level}","${log.category}","${log.action}","${log.userId || ''}","${log.ipAddress || ''}","${log.severity}","${log.risk_score}","${details}"`;
            }).join('\n');

            const csv = csvHeader + csvRows;
            const filename = `security_logs_${new Date().toISOString().split('T')[0]}.csv`;

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.send(csv);
        } else {
            // Exportar como JSON
            const filename = `security_logs_${new Date().toISOString().split('T')[0]}.json`;
            
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.json({
                export_date: new Date().toISOString(),
                total_records: logs.length,
                filters: options,
                data: logs
            });
        }

        // Registrar la exportación como evento crítico
        await criticalLogsController.logger.logCriticalActivity({
            category: 'DATA_ACCESS',
            action: 'LOG_EXPORT',
            level: 'INFO',
            userId: req.user.id,
            ipAddress: req.ip,
            details: {
                format,
                record_count: logs.length,
                filters: options,
                exported_by: req.user.id
            }
        });

    } catch (error) {
        console.error('Error exportando logs:', error);
        res.status(500).json({
            success: false,
            message: 'Error exportando logs',
            error: error.message
        });
    }
});

module.exports = router;
