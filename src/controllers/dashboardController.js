/**
 * Controlador para Dashboard en Tiempo Real
 * Maneja endpoints REST para el dashboard
 */

const RealTimeDashboardService = require('../services/realTimeDashboardService');
const redisService = require('../services/redisService');
const logger = require('../utils/logger');

class DashboardController {

    /**
     * Obtiene datos completos del dashboard
     */
    async getDashboardData(req, res) {
        try {
            const [
                accessStats,
                recentAccesses,
                activeInvitations,
                systemStatus,
                alerts
            ] = await Promise.all([
                RealTimeDashboardService.getAccessStatistics(),
                RealTimeDashboardService.getRecentAccesses(20),
                RealTimeDashboardService.getActiveInvitations(),
                RealTimeDashboardService.getSystemStatus(),
                RealTimeDashboardService.getActiveAlerts()
            ]);

            res.json({
                success: true,
                data: {
                    accessStats,
                    recentAccesses,
                    activeInvitations,
                    systemStatus,
                    alerts,
                    connectedUsers: RealTimeDashboardService.getConnectedClients().length,
                    timestamp: new Date().toISOString()
                },
                message: 'Datos del dashboard obtenidos exitosamente'
            });

        } catch (error) {
            logger.error('Error obteniendo datos del dashboard:', error);
            res.status(500).json({
                success: false,
                message: 'Error obteniendo datos del dashboard',
                error: error.message
            });
        }
    }

    /**
     * Obtiene estadísticas rápidas
     */
    async getQuickStats(req, res) {
        try {
            const quickStats = await RealTimeDashboardService.getQuickStats();

            res.json({
                success: true,
                data: quickStats,
                message: 'Estadísticas rápidas obtenidas exitosamente'
            });

        } catch (error) {
            logger.error('Error obteniendo estadísticas rápidas:', error);
            res.status(500).json({
                success: false,
                message: 'Error obteniendo estadísticas',
                error: error.message
            });
        }
    }

    /**
     * Obtiene estadísticas de acceso con filtros
     */
    async getAccessStatistics(req, res) {
        try {
            const { 
                fecha_desde, 
                fecha_hasta, 
                puerta_id, 
                edificio_id 
            } = req.query;

            const filters = {};
            
            if (fecha_desde || fecha_hasta) {
                filters.fecha_acceso = {};
                if (fecha_desde) filters.fecha_acceso.gte = new Date(fecha_desde);
                if (fecha_hasta) filters.fecha_acceso.lte = new Date(fecha_hasta);
            }

            if (puerta_id) filters.puerta_acceso_id = parseInt(puerta_id);
            if (edificio_id) {
                filters.puerta_acceso = {
                    edificio_id: parseInt(edificio_id)
                };
            }

            // Obtener estadísticas personalizadas
            const stats = await this.calculateCustomStats(filters);

            res.json({
                success: true,
                data: stats,
                message: 'Estadísticas obtenidas exitosamente'
            });

        } catch (error) {
            logger.error('Error obteniendo estadísticas de acceso:', error);
            res.status(500).json({
                success: false,
                message: 'Error obteniendo estadísticas',
                error: error.message
            });
        }
    }

    /**
     * Obtiene clientes conectados al WebSocket
     */
    async getConnectedClients(req, res) {
        try {
            const clients = RealTimeDashboardService.getConnectedClients();

            const clientSummary = clients.map(client => ({
                userId: client.userId,
                username: client.username,
                role: client.role,
                connectedAt: client.connectedAt,
                lastActivity: client.lastActivity,
                sessionDuration: Math.round((new Date() - client.connectedAt) / 1000 / 60) // minutos
            }));

            res.json({
                success: true,
                data: {
                    total: clients.length,
                    clients: clientSummary
                },
                message: 'Clientes conectados obtenidos exitosamente'
            });

        } catch (error) {
            logger.error('Error obteniendo clientes conectados:', error);
            res.status(500).json({
                success: false,
                message: 'Error obteniendo clientes conectados',
                error: error.message
            });
        }
    }

    /**
     * Obtiene estado del sistema
     */
    async getSystemStatus(req, res) {
        try {
            const systemStatus = await RealTimeDashboardService.getSystemStatus();

            res.json({
                success: true,
                data: systemStatus,
                message: 'Estado del sistema obtenido exitosamente'
            });

        } catch (error) {
            logger.error('Error obteniendo estado del sistema:', error);
            res.status(500).json({
                success: false,
                message: 'Error obteniendo estado del sistema',
                error: error.message
            });
        }
    }

    /**
     * Obtiene alertas activas
     */
    async getActiveAlerts(req, res) {
        try {
            const alerts = await RealTimeDashboardService.getActiveAlerts();

            res.json({
                success: true,
                data: {
                    total: alerts.length,
                    alerts: alerts
                },
                message: 'Alertas obtenidas exitosamente'
            });

        } catch (error) {
            logger.error('Error obteniendo alertas:', error);
            res.status(500).json({
                success: false,
                message: 'Error obteniendo alertas',
                error: error.message
            });
        }
    }

    /**
     * Limpia cache del dashboard
     */
    async clearDashboardCache(req, res) {
        try {
            const patterns = [
                'dashboard:*',
                'invitations:active',
                'maintenance:employees:active'
            ];

            let totalCleared = 0;
            for (const pattern of patterns) {
                const cleared = await redisService.clearPattern(pattern);
                totalCleared += cleared;
            }

            res.json({
                success: true,
                data: {
                    clearedKeys: totalCleared
                },
                message: 'Cache del dashboard limpiado exitosamente'
            });

        } catch (error) {
            logger.error('Error limpiando cache:', error);
            res.status(500).json({
                success: false,
                message: 'Error limpiando cache',
                error: error.message
            });
        }
    }

    /**
     * Envía notificación manual a todos los clientes
     */
    async sendBroadcastNotification(req, res) {
        try {
            const { type, message, priority = 'normal', data = {} } = req.body;

            if (!type || !message) {
                return res.status(400).json({
                    success: false,
                    message: 'Tipo y mensaje requeridos'
                });
            }

            // Enviar notificación via WebSocket
            RealTimeDashboardService.io.emit('broadcast_notification', {
                type,
                message,
                priority,
                data,
                timestamp: new Date().toISOString(),
                sentBy: req.user.username
            });

            // Registrar en auditoría
            logger.info(`📢 Notificación broadcast enviada por ${req.user.username}: ${message}`);

            res.json({
                success: true,
                message: 'Notificación enviada exitosamente'
            });

        } catch (error) {
            logger.error('Error enviando notificación broadcast:', error);
            res.status(500).json({
                success: false,
                message: 'Error enviando notificación',
                error: error.message
            });
        }
    }

    /**
     * Obtiene métricas de rendimiento
     */
    async getPerformanceMetrics(req, res) {
        try {
            const metrics = {
                server: {
                    uptime: process.uptime(),
                    memory: process.memoryUsage(),
                    cpu: process.cpuUsage(),
                    platform: process.platform,
                    nodeVersion: process.version
                },
                websocket: {
                    connectedClients: RealTimeDashboardService.getConnectedClients().length,
                    totalRooms: RealTimeDashboardService.dashboardRooms.size
                },
                redis: await redisService.getCacheStats(),
                timestamp: new Date().toISOString()
            };

            res.json({
                success: true,
                data: metrics,
                message: 'Métricas de rendimiento obtenidas exitosamente'
            });

        } catch (error) {
            logger.error('Error obteniendo métricas:', error);
            res.status(500).json({
                success: false,
                message: 'Error obteniendo métricas',
                error: error.message
            });
        }
    }

    /**
     * Calcula estadísticas personalizadas
     */
    async calculateCustomStats(filters) {
        try {
            const { PrismaClient } = require('@prisma/client');
            const prisma = new PrismaClient();

            const [
                totalAccesses,
                uniqueVisitors,
                averageAccessesPerDay,
                topBuildings,
                accessesByHour
            ] = await Promise.all([
                // Total de accesos
                prisma.accesos.count({ where: filters }),
                
                // Visitantes únicos
                prisma.accesos.findMany({
                    where: filters,
                    select: { persona_id: true },
                    distinct: ['persona_id']
                }).then(result => result.length),

                // Promedio de accesos por día
                this.calculateDailyAverage(filters, prisma),

                // Edificios con más accesos
                this.getTopBuildings(filters, prisma),

                // Accesos por hora del día
                this.getAccessesByHour(filters, prisma)
            ]);

            await prisma.$disconnect();

            return {
                totalAccesses,
                uniqueVisitors,
                averageAccessesPerDay,
                topBuildings,
                accessesByHour,
                calculatedAt: new Date().toISOString()
            };

        } catch (error) {
            logger.error('Error calculando estadísticas personalizadas:', error);
            throw error;
        }
    }

    /**
     * Calcula promedio diario de accesos
     */
    async calculateDailyAverage(filters, prisma) {
        try {
            if (!filters.fecha_acceso) {
                return 0;
            }

            const startDate = filters.fecha_acceso.gte || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const endDate = filters.fecha_acceso.lte || new Date();
            
            const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
            const totalAccesses = await prisma.accesos.count({ where: filters });

            return daysDiff > 0 ? Math.round(totalAccesses / daysDiff * 100) / 100 : 0;

        } catch (error) {
            logger.error('Error calculando promedio diario:', error);
            return 0;
        }
    }

    /**
     * Obtiene edificios con más accesos
     */
    async getTopBuildings(filters, prisma) {
        try {
            const result = await prisma.accesos.groupBy({
                by: ['puerta_acceso_id'],
                _count: {
                    puerta_acceso_id: true
                },
                where: filters,
                orderBy: {
                    _count: {
                        puerta_acceso_id: 'desc'
                    }
                },
                take: 5
            });

            // Obtener información de los edificios
            const buildingsData = await Promise.all(
                result.map(async (item) => {
                    const puerta = await prisma.puertas_Acceso.findUnique({
                        where: { id: item.puerta_acceso_id },
                        include: { edificio: true }
                    });

                    return {
                        edificio: puerta?.edificio?.nombre || 'Desconocido',
                        puerta: puerta?.nombre || 'Desconocida',
                        accesos: item._count.puerta_acceso_id
                    };
                })
            );

            return buildingsData;

        } catch (error) {
            logger.error('Error obteniendo top edificios:', error);
            return [];
        }
    }

    /**
     * Obtiene accesos por hora del día
     */
    async getAccessesByHour(filters, prisma) {
        try {
            // Aquí implementarías la lógica específica para SQL Server
            // Por simplicidad, retornaremos un array de ejemplo
            const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
                hour,
                accesses: Math.floor(Math.random() * 50) // Datos de ejemplo
            }));

            return hourlyData;

        } catch (error) {
            logger.error('Error obteniendo accesos por hora:', error);
            return [];
        }
    }
}

module.exports = new DashboardController();
