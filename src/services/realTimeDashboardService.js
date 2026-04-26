/**
 * Dashboard en Tiempo Real con WebSockets
 * Proporciona actualizaciones en vivo del sistema
 */

const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');
const redisService = require('./redisService');

class RealTimeDashboardService {
    constructor() {
        this.io = null;
        // Inicializar Prisma solo si la base de datos está disponible
        try {
            if (!process.env.SKIP_DB_CONNECTION) {
                this.prisma = new PrismaClient();
            } else {
                this.prisma = null;
                logger.info('📊 Dashboard en modo fallback (sin base de datos)');
            }
        } catch (error) {
            this.prisma = null;
            logger.warn('📊 Dashboard iniciado en modo fallback:', error.message);
        }
        
        this.connectedClients = new Map();
        this.dashboardRooms = new Set();
        this.updateInterval = null;
        this.statsCache = new Map();
        
        this.initializeEventListeners();
    }

    /**
     * Inicializa el servidor WebSocket
     */
    initialize(server) {
        this.io = socketIo(server, {
            cors: {
                origin: process.env.CORS_ORIGINS?.split(',') || '*',
                methods: ['GET', 'POST'],
                credentials: true
            },
            transports: ['websocket', 'polling']
        });

        this.setupSocketHandlers();
        this.startPeriodicUpdates();
        
        logger.info('🔄 Dashboard en tiempo real inicializado');
    }

    /**
     * Configura los manejadores de Socket.IO
     */
    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            logger.debug(`🔌 Cliente conectado: ${socket.id}`);

            // Autenticación del socket
            socket.on('authenticate', async (data) => {
                try {
                    const { token } = data;
                    const decoded = jwt.verify(token, process.env.JWT_SECRET);
                    
                    const user = await this.prisma.usuarios.findUnique({
                        where: { id: decoded.userId },
                        include: {
                            persona: true,
                            rol: true
                        }
                    });

                    if (!user) {
                        socket.emit('auth_error', { message: 'Usuario no válido' });
                        return;
                    }

                    // Guardar información del cliente
                    this.connectedClients.set(socket.id, {
                        userId: user.id,
                        username: user.username,
                        role: user.rol.nombre,
                        connectedAt: new Date(),
                        lastActivity: new Date()
                    });

                    socket.userId = user.id;
                    socket.userRole = user.rol.nombre;
                    socket.emit('authenticated', { 
                        message: 'Autenticado correctamente',
                        user: {
                            id: user.id,
                            username: user.username,
                            role: user.rol.nombre
                        }
                    });

                    // Enviar estadísticas iniciales
                    await this.sendInitialDashboardData(socket);

                } catch (error) {
                    logger.error('Error en autenticación de socket:', error);
                    socket.emit('auth_error', { message: 'Token inválido' });
                }
            });

            // Unirse a sala del dashboard
            socket.on('join_dashboard', async (data) => {
                if (!socket.userId) {
                    socket.emit('error', { message: 'No autenticado' });
                    return;
                }

                const { dashboardType = 'main' } = data;
                const roomName = `dashboard_${dashboardType}`;
                
                socket.join(roomName);
                this.dashboardRooms.add(roomName);
                
                logger.debug(`👤 Usuario ${socket.userId} se unió al dashboard ${dashboardType}`);
                
                // Enviar estadísticas actuales
                await this.sendDashboardUpdate(roomName);
            });

            // Solicitar datos específicos
            socket.on('request_data', async (data) => {
                if (!socket.userId) return;

                const { type, filters } = data;
                await this.handleDataRequest(socket, type, filters);
            });

            // Actualizar filtros del usuario
            socket.on('update_filters', (filters) => {
                if (!socket.userId) return;

                const client = this.connectedClients.get(socket.id);
                if (client) {
                    client.filters = filters;
                    client.lastActivity = new Date();
                }
            });

            // Desconexión
            socket.on('disconnect', () => {
                this.connectedClients.delete(socket.id);
                logger.debug(`🔌 Cliente desconectado: ${socket.id}`);
            });

            // Ping para mantener conexión activa
            socket.on('ping', () => {
                const client = this.connectedClients.get(socket.id);
                if (client) {
                    client.lastActivity = new Date();
                }
                socket.emit('pong');
            });
        });
    }

    /**
     * Envía datos iniciales del dashboard
     */
    async sendInitialDashboardData(socket) {
        try {
            const [
                accessStats,
                recentAccesses,
                activeInvitations,
                systemStatus,
                alerts
            ] = await Promise.all([
                this.getAccessStatistics(),
                this.getRecentAccesses(),
                this.getActiveInvitations(),
                this.getSystemStatus(),
                this.getActiveAlerts()
            ]);

            socket.emit('dashboard_data', {
                type: 'initial',
                timestamp: new Date().toISOString(),
                data: {
                    accessStats,
                    recentAccesses,
                    activeInvitations,
                    systemStatus,
                    alerts,
                    connectedUsers: this.connectedClients.size
                }
            });

        } catch (error) {
            logger.error('Error enviando datos iniciales:', error);
            socket.emit('error', { message: 'Error cargando datos del dashboard' });
        }
    }

    /**
     * Inicia actualizaciones periódicas
     */
    startPeriodicUpdates() {
        // Actualizar cada 30 segundos
        this.updateInterval = setInterval(async () => {
            await this.broadcastDashboardUpdates();
        }, 30000);

        // Actualizar estadísticas rápidas cada 5 segundos
        setInterval(async () => {
            await this.broadcastQuickStats();
        }, 5000);

        logger.info('⏱️ Actualizaciones periódicas del dashboard iniciadas');
    }

    /**
     * Transmite actualizaciones a todos los dashboards
     */
    async broadcastDashboardUpdates() {
        try {
            for (const roomName of this.dashboardRooms) {
                await this.sendDashboardUpdate(roomName);
            }
        } catch (error) {
            logger.error('Error en broadcast de actualizaciones:', error);
        }
    }

    /**
     * Envía actualización a una sala específica
     */
    async sendDashboardUpdate(roomName) {
        try {
            const [
                accessStats,
                recentAccesses,
                activeInvitations,
                systemStatus
            ] = await Promise.all([
                this.getAccessStatistics(),
                this.getRecentAccesses(10),
                this.getActiveInvitations(),
                this.getSystemStatus()
            ]);

            this.io.to(roomName).emit('dashboard_update', {
                type: 'periodic',
                timestamp: new Date().toISOString(),
                data: {
                    accessStats,
                    recentAccesses,
                    activeInvitations,
                    systemStatus,
                    connectedUsers: this.connectedClients.size
                }
            });

        } catch (error) {
            logger.error(`Error enviando actualización a ${roomName}:`, error);
        }
    }

    /**
     * Transmite estadísticas rápidas
     */
    async broadcastQuickStats() {
        try {
            const quickStats = await this.getQuickStats();
            
            this.io.emit('quick_stats', {
                timestamp: new Date().toISOString(),
                data: quickStats
            });

        } catch (error) {
            logger.error('Error en estadísticas rápidas:', error);
        }
    }

    /**
     * Maneja solicitudes específicas de datos
     */
    async handleDataRequest(socket, type, filters = {}) {
        try {
            let data = null;

            switch (type) {
                case 'access_history':
                    data = await this.getAccessHistory(filters);
                    break;
                case 'invitation_details':
                    data = await this.getInvitationDetails(filters.invitationId);
                    break;
                case 'maintenance_employees':
                    data = await this.getMaintenanceEmployees(filters);
                    break;
                case 'system_logs':
                    data = await this.getSystemLogs(filters);
                    break;
                case 'analytics':
                    data = await this.getAnalytics(filters);
                    break;
                default:
                    socket.emit('error', { message: `Tipo de datos no válido: ${type}` });
                    return;
            }

            socket.emit('data_response', {
                type,
                timestamp: new Date().toISOString(),
                data
            });

        } catch (error) {
            logger.error(`Error manejando solicitud de datos ${type}:`, error);
            socket.emit('error', { message: 'Error obteniendo datos solicitados' });
        }
    }

    // ===== MÉTODOS DE DATOS =====

    /**
     * Obtiene estadísticas de acceso
     */
    async getAccessStatistics() {
        try {
            // Intentar obtener del cache primero
            let stats = await redisService.getDashboardStats();
            
            if (!stats) {
                const today = new Date();
                const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                const startOfWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

                stats = {
                    today: await this.prisma.accesos.count({
                        where: {
                            fecha_acceso: { gte: startOfDay }
                        }
                    }),
                    thisWeek: await this.prisma.accesos.count({
                        where: {
                            fecha_acceso: { gte: startOfWeek }
                        }
                    }),
                    totalActive: await this.prisma.invitaciones.count({
                        where: {
                            estado: { in: ['PENDIENTE', 'CONFIRMADA', 'ACTIVA'] }
                        }
                    }),
                    maintenanceActive: await this.prisma.empleados_mantenimiento.count({
                        where: { estado: 'ACTIVO' }
                    })
                };

                // Cachear por 3 minutos
                await redisService.cacheDashboardStats(stats);
            }

            return stats;

        } catch (error) {
            logger.error('Error obteniendo estadísticas de acceso:', error);
            return {
                today: 0,
                thisWeek: 0,
                totalActive: 0,
                maintenanceActive: 0
            };
        }
    }

    /**
     * Obtiene accesos recientes
     */
    async getRecentAccesses(limit = 20) {
        try {
            return await this.prisma.accesos.findMany({
                take: limit,
                orderBy: { fecha_acceso: 'desc' },
                include: {
                    persona: true,
                    puerta_acceso: {
                        include: { edificio: true }
                    },
                    invitacion: true
                }
            });

        } catch (error) {
            logger.error('Error obteniendo accesos recientes:', error);
            return [];
        }
    }

    /**
     * Obtiene invitaciones activas
     */
    async getActiveInvitations() {
        try {
            // Intentar obtener del cache
            let invitations = await redisService.getActiveInvitations();
            
            if (!invitations) {
                invitations = await this.prisma.invitaciones.findMany({
                    where: {
                        estado: { in: ['PENDIENTE', 'CONFIRMADA', 'ACTIVA'] },
                        fecha_expiracion: { gt: new Date() }
                    },
                    include: {
                        persona: true,
                        puerta_acceso: {
                            include: { edificio: true }
                        }
                    },
                    orderBy: { created_at: 'desc' },
                    take: 50
                });

                // Cachear por 5 minutos
                await redisService.cacheActiveInvitations(invitations);
            }

            return invitations;

        } catch (error) {
            logger.error('Error obteniendo invitaciones activas:', error);
            return [];
        }
    }

    /**
     * Obtiene estado del sistema
     */
    async getSystemStatus() {
        try {
            const [
                databaseStatus,
                redisStatus,
                uptime
            ] = await Promise.all([
                this.checkDatabaseHealth(),
                redisService.getCacheStats(),
                process.uptime()
            ]);

            return {
                database: databaseStatus,
                redis: redisStatus,
                uptime,
                memory: process.memoryUsage(),
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            logger.error('Error obteniendo estado del sistema:', error);
            return {
                database: { status: 'unknown' },
                redis: { available: false },
                uptime: 0,
                memory: {},
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Obtiene alertas activas
     */
    async getActiveAlerts() {
        try {
            const alerts = [];

            // Verificar invitaciones por vencer (próximas 2 horas)
            const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);
            const expiringInvitations = await this.prisma.invitaciones.count({
                where: {
                    fecha_expiracion: {
                        lte: twoHoursFromNow,
                        gt: new Date()
                    },
                    estado: { in: ['PENDIENTE', 'CONFIRMADA', 'ACTIVA'] }
                }
            });

            if (expiringInvitations > 0) {
                alerts.push({
                    type: 'warning',
                    category: 'invitations',
                    message: `${expiringInvitations} invitaciones vencerán en las próximas 2 horas`,
                    count: expiringInvitations,
                    timestamp: new Date().toISOString()
                });
            }

            // Verificar conexión Redis
            if (!redisService.isAvailable()) {
                alerts.push({
                    type: 'error',
                    category: 'system',
                    message: 'Redis no disponible - Cache deshabilitado',
                    timestamp: new Date().toISOString()
                });
            }

            return alerts;

        } catch (error) {
            logger.error('Error obteniendo alertas:', error);
            return [];
        }
    }

    /**
     * Obtiene estadísticas rápidas
     */
    async getQuickStats() {
        try {
            // Si no hay base de datos, devolver estadísticas mock
            if (!this.prisma) {
                return {
                    accessesLastHour: Math.floor(Math.random() * 50), // Datos simulados
                    connectedUsers: this.connectedClients.size,
                    systemLoad: process.cpuUsage(),
                    memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
                    timestamp: new Date().toISOString()
                };
            }

            const now = new Date();
            const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

            return {
                accessesLastHour: await this.prisma.accesos.count({
                    where: {
                        fecha_acceso: { gte: oneHourAgo }
                    }
                }),
                connectedUsers: this.connectedClients.size,
                systemLoad: process.cpuUsage(),
                memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            logger.error('Error obteniendo estadísticas rápidas:', error);
            return {
                accessesLastHour: 0,
                connectedUsers: 0,
                systemLoad: {},
                memoryUsage: 0,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Verifica salud de la base de datos
     */
    async checkDatabaseHealth() {
        try {
            if (!this.prisma) {
                return {
                    status: 'fallback',
                    message: 'Base de datos deshabilitada - modo fallback activo',
                    timestamp: new Date().toISOString()
                };
            }

            await this.prisma.$queryRaw`SELECT 1`;
            return {
                status: 'healthy',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'error',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    // ===== EVENTOS ESPECÍFICOS =====

    /**
     * Notifica nuevo acceso en tiempo real
     */
    async notifyNewAccess(accessData) {
        try {
            this.io.emit('new_access', {
                timestamp: new Date().toISOString(),
                data: accessData
            });

            // Actualizar estadísticas rápidas
            await this.broadcastQuickStats();

        } catch (error) {
            logger.error('Error notificando nuevo acceso:', error);
        }
    }

    /**
     * Notifica nueva invitación
     */
    async notifyNewInvitation(invitationData) {
        try {
            this.io.emit('new_invitation', {
                timestamp: new Date().toISOString(),
                data: invitationData
            });

            // Limpiar cache de invitaciones activas
            await redisService.del('invitations:active');

        } catch (error) {
            logger.error('Error notificando nueva invitación:', error);
        }
    }

    /**
     * Notifica alerta de seguridad
     */
    async notifySecurityAlert(alertData) {
        try {
            this.io.emit('security_alert', {
                timestamp: new Date().toISOString(),
                priority: 'high',
                data: alertData
            });

        } catch (error) {
            logger.error('Error notificando alerta de seguridad:', error);
        }
    }

    /**
     * Obtiene clientes conectados
     */
    getConnectedClients() {
        return Array.from(this.connectedClients.values());
    }

    /**
     * Cierra el servicio
     */
    async shutdown() {
        try {
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
            }

            if (this.io) {
                this.io.close();
            }

            if (this.prisma) {
                await this.prisma.$disconnect();
            }
            
            logger.info('🔌 Dashboard en tiempo real desconectado');

        } catch (error) {
            logger.error('Error cerrando dashboard:', error);
        }
    }

    /**
     * Inicializa listeners de eventos del sistema
     */
    initializeEventListeners() {
        // Aquí podrías agregar listeners para eventos específicos
        // del sistema que requieran actualizaciones en tiempo real
        
        process.on('SIGTERM', () => {
            this.shutdown();
        });

        process.on('SIGINT', () => {
            this.shutdown();
        });
    }
}

module.exports = new RealTimeDashboardService();
