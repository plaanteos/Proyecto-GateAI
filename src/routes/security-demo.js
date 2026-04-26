// Rutas para Logs de Actividad Crítica - HU10 (Versión Demo)
const express = require('express');
const CriticalLogsController = require('../controllers/criticalLogsController');

const router = express.Router();

try {
    const criticalLogsController = new CriticalLogsController();

    // GET /api/security/logs - Obtener logs de seguridad
    router.get('/logs', async (req, res) => {
        try {
            const result = await criticalLogsController.getLogs(req, res);
            if (!res.headersSent) {
                res.json(result);
            }
        } catch (error) {
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    error: 'Error obteniendo logs de seguridad',
                    details: error.message
                });
            }
        }
    });

    // GET /api/security/summary - Resumen de actividad crítica
    router.get('/summary', async (req, res) => {
        try {
            const result = await criticalLogsController.getSummary(req, res);
            if (!res.headersSent) {
                res.json(result);
            }
        } catch (error) {
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    error: 'Error obteniendo resumen de seguridad',
                    details: error.message
                });
            }
        }
    });

    // GET /api/security/dashboard - Datos para dashboard de seguridad
    router.get('/dashboard', async (req, res) => {
        try {
            const result = await criticalLogsController.getDashboardData(req, res);
            if (!res.headersSent) {
                res.json(result);
            }
        } catch (error) {
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    error: 'Error obteniendo datos del dashboard',
                    details: error.message
                });
            }
        }
    });

    // GET /api/security/export - Exportar logs de seguridad
    router.get('/export', async (req, res) => {
        try {
            const result = await criticalLogsController.exportLogs(req, res);
            if (!res.headersSent) {
                res.json(result);
            }
        } catch (error) {
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    error: 'Error exportando logs',
                    details: error.message
                });
            }
        }
    });

    // DELETE /api/security/cleanup - Limpiar logs antiguos
    router.delete('/cleanup', async (req, res) => {
        try {
            const result = await criticalLogsController.cleanupLogs(req, res);
            if (!res.headersSent) {
                res.json(result);
            }
        } catch (error) {
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    error: 'Error limpiando logs',
                    details: error.message
                });
            }
        }
    });

    // Ruta de prueba para generar eventos de seguridad
    router.post('/test/event', async (req, res) => {
        try {
            const { type, severity, message } = req.body;
            
            // Crear evento de prueba
            const event = {
                type: type || 'TEST_EVENT',
                severity: severity || 'MEDIUM',
                message: message || 'Evento de prueba generado',
                timestamp: new Date(),
                user: 'test_user',
                ip: req.ip || '127.0.0.1'
            };

            res.json({
                success: true,
                message: 'Evento de prueba creado',
                event: event
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Error creando evento de prueba',
                details: error.message
            });
        }
    });

    console.log('✅ Security routes (demo version) initialized successfully');

} catch (error) {
    console.log('⚠️ Error initializing security routes:', error.message);
    
    // Rutas de fallback básicas
    router.get('/logs', (req, res) => {
        res.json({
            success: true,
            message: 'Security logs service (fallback)',
            data: { logs: [], total: 0 }
        });
    });

    router.get('/summary', (req, res) => {
        res.json({
            success: true,
            message: 'Security summary service (fallback)',
            data: {
                critical: 0,
                warnings: 0,
                info: 0,
                riskScore: 0
            }
        });
    });

    router.get('/dashboard', (req, res) => {
        res.json({
            success: true,
            message: 'Security dashboard service (fallback)',
            data: {
                stats: {
                    critical: 0,
                    failedLogins: 0,
                    violations: 0,
                    systemErrors: 0,
                    riskScore: 0,
                    activeThreats: 0
                },
                recentLogs: []
            }
        });
    });
}

module.exports = router;
