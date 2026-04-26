/**
 * Rutas para Dashboard en Tiempo Real
 * Endpoints REST para el dashboard y WebSocket
 */

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { auth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

// Aplicar autenticación a todas las rutas
router.use(auth);

/**
 * @route GET /api/dashboard/data
 * @desc Obtener datos completos del dashboard
 * @access Requiere permiso: dashboard.view
 */
router.get('/data',
    requirePermission('dashboard.view'),
    dashboardController.getDashboardData
);

/**
 * @route GET /api/dashboard/quick-stats
 * @desc Obtener estadísticas rápidas
 * @access Requiere permiso: dashboard.view
 */
router.get('/quick-stats',
    requirePermission('dashboard.view'),
    dashboardController.getQuickStats
);

/**
 * @route GET /api/dashboard/access-statistics
 * @desc Obtener estadísticas de acceso con filtros
 * @access Requiere permiso: dashboard.view
 */
router.get('/access-statistics',
    requirePermission('dashboard.view'),
    dashboardController.getAccessStatistics
);

/**
 * @route GET /api/dashboard/connected-clients
 * @desc Obtener clientes conectados al WebSocket
 * @access Requiere permiso: dashboard.admin
 */
router.get('/connected-clients',
    requirePermission('dashboard.admin'),
    dashboardController.getConnectedClients
);

/**
 * @route GET /api/dashboard/system-status
 * @desc Obtener estado del sistema
 * @access Requiere permiso: dashboard.view
 */
router.get('/system-status',
    requirePermission('dashboard.view'),
    dashboardController.getSystemStatus
);

/**
 * @route GET /api/dashboard/alerts
 * @desc Obtener alertas activas
 * @access Requiere permiso: dashboard.view
 */
router.get('/alerts',
    requirePermission('dashboard.view'),
    dashboardController.getActiveAlerts
);

/**
 * @route DELETE /api/dashboard/cache
 * @desc Limpiar cache del dashboard
 * @access Requiere permiso: dashboard.admin
 */
router.delete('/cache',
    requirePermission('dashboard.admin'),
    dashboardController.clearDashboardCache
);

/**
 * @route POST /api/dashboard/broadcast-notification
 * @desc Enviar notificación broadcast a todos los clientes
 * @access Requiere permiso: dashboard.admin
 */
router.post('/broadcast-notification',
    requirePermission('dashboard.admin'),
    dashboardController.sendBroadcastNotification
);

/**
 * @route GET /api/dashboard/performance-metrics
 * @desc Obtener métricas de rendimiento del sistema
 * @access Requiere permiso: dashboard.admin
 */
router.get('/performance-metrics',
    requirePermission('dashboard.admin'),
    dashboardController.getPerformanceMetrics
);

module.exports = router;
