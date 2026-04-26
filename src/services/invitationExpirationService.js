/**
 * Servicio de Expiración Automática de Invitaciones
 * Maneja la limpieza automática y validación de invitaciones vencidas
 */

const { PrismaClient } = require('@prisma/client');
const cron = require('node-cron');
const logger = require('../utils/logger');

class InvitationExpirationService {
    constructor() {
        this.prisma = new PrismaClient();
        this.isRunning = false;
        this.initializeCronJobs();
    }

    /**
     * Inicializa los trabajos cron para limpieza automática
     */
    initializeCronJobs() {
        // Ejecutar cada hora para limpiar invitaciones vencidas
        cron.schedule('0 * * * *', async () => {
            await this.cleanupExpiredInvitations();
        });

        // Ejecutar cada 30 minutos para notificar invitaciones próximas a vencer
        cron.schedule('*/30 * * * *', async () => {
            await this.notifyExpiringInvitations();
        });

        // Ejecutar diariamente a las 2:00 AM para limpieza profunda
        cron.schedule('0 2 * * *', async () => {
            await this.deepCleanupDatabase();
        });

        logger.info('✅ Servicios de expiración de invitaciones inicializados');
    }

    /**
     * Limpia invitaciones vencidas
     */
    async cleanupExpiredInvitations() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        const startTime = Date.now();

        try {
            logger.info('🧹 Iniciando limpieza de invitaciones vencidas...');

            // Obtener invitaciones vencidas
            const expiredInvitations = await this.prisma.invitaciones.findMany({
                where: {
                    OR: [
                        {
                            fecha_expiracion: {
                                lt: new Date()
                            },
                            estado: {
                                in: ['PENDIENTE', 'CONFIRMADA']
                            }
                        },
                        {
                            tipo_invitacion: 'TEMPORAL',
                            created_at: {
                                lt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 horas
                            },
                            estado: 'PENDIENTE'
                        }
                    ]
                },
                include: {
                    persona: true,
                    puerta_acceso: {
                        include: {
                            edificio: true
                        }
                    }
                }
            });

            let cleanedCount = 0;
            let notifiedCount = 0;

            for (const invitation of expiredInvitations) {
                try {
                    // Marcar como vencida
                    await this.prisma.invitaciones.update({
                        where: { id: invitation.id },
                        data: {
                            estado: 'VENCIDA',
                            fecha_vencimiento_real: new Date(),
                            observaciones: `Auto-expirada: ${new Date().toISOString()}`
                        }
                    });

                    // Revocar accesos QR asociados
                    await this.prisma.accesos.updateMany({
                        where: {
                            invitacion_id: invitation.id,
                            estado: 'ACTIVO'
                        },
                        data: {
                            estado: 'REVOCADO',
                            fecha_revocacion: new Date(),
                            motivo_revocacion: 'INVITACION_VENCIDA'
                        }
                    });

                    // Notificar al host si es necesario
                    await this.notifyExpirationToHost(invitation);

                    cleanedCount++;

                } catch (error) {
                    logger.error(`Error procesando invitación ${invitation.id}:`, error);
                }
            }

            const duration = Date.now() - startTime;
            logger.info(`✅ Limpieza completada: ${cleanedCount} invitaciones procesadas en ${duration}ms`);

            // Registrar estadísticas
            await this.recordCleanupStats(cleanedCount, duration);

            return {
                success: true,
                cleanedCount,
                duration,
                message: `${cleanedCount} invitaciones procesadas exitosamente`
            };

        } catch (error) {
            logger.error('❌ Error en limpieza de invitaciones:', error);
            throw error;
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Notifica invitaciones próximas a vencer (en las próximas 2 horas)
     */
    async notifyExpiringInvitations() {
        try {
            const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);
            
            const expiringInvitations = await this.prisma.invitaciones.findMany({
                where: {
                    fecha_expiracion: {
                        lte: twoHoursFromNow,
                        gt: new Date()
                    },
                    estado: {
                        in: ['PENDIENTE', 'CONFIRMADA']
                    },
                    notificacion_expiracion_enviada: false
                },
                include: {
                    persona: true,
                    puerta_acceso: {
                        include: {
                            edificio: true
                        }
                    }
                }
            });

            for (const invitation of expiringInvitations) {
                await this.sendExpirationWarning(invitation);
                
                // Marcar notificación como enviada
                await this.prisma.invitaciones.update({
                    where: { id: invitation.id },
                    data: { notificacion_expiracion_enviada: true }
                });
            }

            logger.info(`📧 ${expiringInvitations.length} notificaciones de expiración enviadas`);

        } catch (error) {
            logger.error('Error enviando notificaciones de expiración:', error);
        }
    }

    /**
     * Limpieza profunda diaria
     */
    async deepCleanupDatabase() {
        try {
            logger.info('🗑️ Iniciando limpieza profunda de base de datos...');

            // Limpiar invitaciones muy antiguas (más de 30 días vencidas)
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            
            const oldInvitations = await this.prisma.invitaciones.deleteMany({
                where: {
                    estado: 'VENCIDA',
                    fecha_vencimiento_real: {
                        lt: thirtyDaysAgo
                    }
                }
            });

            // Limpiar logs de acceso antiguos (más de 90 días)
            const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
            
            const oldLogs = await this.prisma.logs_acceso.deleteMany({
                where: {
                    fecha_acceso: {
                        lt: ninetyDaysAgo
                    }
                }
            });

            // Optimizar base de datos
            await this.optimizeDatabase();

            logger.info(`✅ Limpieza profunda completada: ${oldInvitations.count} invitaciones antiguas eliminadas, ${oldLogs.count} logs antiguos eliminados`);

        } catch (error) {
            logger.error('Error en limpieza profunda:', error);
        }
    }

    /**
     * Valida si una invitación está vigente
     */
    async validateInvitationStatus(invitationId) {
        try {
            const invitation = await this.prisma.invitaciones.findUnique({
                where: { id: invitationId },
                include: {
                    persona: true
                }
            });

            if (!invitation) {
                return {
                    valid: false,
                    reason: 'INVITATION_NOT_FOUND',
                    message: 'Invitación no encontrada'
                };
            }

            // Verificar si está vencida
            if (invitation.fecha_expiracion && new Date() > invitation.fecha_expiracion) {
                // Auto-expirar si no está marcada
                if (invitation.estado !== 'VENCIDA') {
                    await this.prisma.invitaciones.update({
                        where: { id: invitationId },
                        data: {
                            estado: 'VENCIDA',
                            fecha_vencimiento_real: new Date()
                        }
                    });
                }

                return {
                    valid: false,
                    reason: 'INVITATION_EXPIRED',
                    message: 'Invitación vencida',
                    expiredAt: invitation.fecha_expiracion
                };
            }

            // Verificar estado
            if (!['PENDIENTE', 'CONFIRMADA', 'ACTIVA'].includes(invitation.estado)) {
                return {
                    valid: false,
                    reason: 'INVALID_STATUS',
                    message: `Estado inválido: ${invitation.estado}`
                };
            }

            return {
                valid: true,
                invitation,
                message: 'Invitación válida'
            };

        } catch (error) {
            logger.error('Error validando invitación:', error);
            return {
                valid: false,
                reason: 'VALIDATION_ERROR',
                message: 'Error interno de validación'
            };
        }
    }

    /**
     * Extiende la vigencia de una invitación
     */
    async extendInvitation(invitationId, newExpirationDate, userId) {
        try {
            const invitation = await this.prisma.invitaciones.findUnique({
                where: { id: invitationId }
            });

            if (!invitation) {
                throw new Error('Invitación no encontrada');
            }

            if (new Date(newExpirationDate) <= new Date()) {
                throw new Error('La nueva fecha de expiración debe ser futura');
            }

            const updatedInvitation = await this.prisma.invitaciones.update({
                where: { id: invitationId },
                data: {
                    fecha_expiracion: new Date(newExpirationDate),
                    estado: invitation.estado === 'VENCIDA' ? 'ACTIVA' : invitation.estado,
                    observaciones: `${invitation.observaciones || ''}\nExtendida hasta ${newExpirationDate} por usuario ${userId}`,
                    notificacion_expiracion_enviada: false
                }
            });

            // Registrar la extensión
            await this.prisma.auditoria.create({
                data: {
                    usuario_id: userId,
                    accion: 'EXTEND_INVITATION',
                    tabla_afectada: 'Invitaciones',
                    registro_id: invitationId,
                    valores_anteriores: { fecha_expiracion: invitation.fecha_expiracion },
                    valores_nuevos: { fecha_expiracion: newExpirationDate },
                    ip_address: '127.0.0.1',
                    user_agent: 'System'
                }
            });

            logger.info(`📅 Invitación ${invitationId} extendida hasta ${newExpirationDate}`);

            return {
                success: true,
                invitation: updatedInvitation,
                message: 'Invitación extendida exitosamente'
            };

        } catch (error) {
            logger.error('Error extendiendo invitación:', error);
            throw error;
        }
    }

    /**
     * Envía notificación de advertencia de expiración
     */
    async sendExpirationWarning(invitation) {
        try {
            const notificationService = require('./notificationService');
            
            const message = `⚠️ Su invitación para acceder a ${invitation.puerta_acceso.edificio.nombre} expirará en menos de 2 horas. 
            
📅 Fecha de expiración: ${invitation.fecha_expiracion.toLocaleString()}
🏢 Ubicación: ${invitation.puerta_acceso.edificio.direccion}
            
Si necesita extender su invitación, contacte al administrador.`;

            await notificationService.sendNotification({
                type: 'WARNING',
                recipient: invitation.persona.email || invitation.persona.telefono,
                subject: 'Invitación próxima a vencer - UnionTech',
                message,
                priority: 'HIGH'
            });

        } catch (error) {
            logger.error('Error enviando advertencia de expiración:', error);
        }
    }

    /**
     * Notifica al host sobre la expiración
     */
    async notifyExpirationToHost(invitation) {
        try {
            // Aquí implementarías la lógica para notificar al host
            // Por ejemplo, via WhatsApp o email
            logger.info(`📱 Notificando expiración de invitación ${invitation.id} al host`);
        } catch (error) {
            logger.error('Error notificando al host:', error);
        }
    }

    /**
     * Registra estadísticas de limpieza
     */
    async recordCleanupStats(cleanedCount, duration) {
        try {
            await this.prisma.system_stats.create({
                data: {
                    metric_name: 'invitation_cleanup',
                    metric_value: cleanedCount,
                    metadata: {
                        duration_ms: duration,
                        timestamp: new Date().toISOString()
                    }
                }
            });
        } catch (error) {
            // No crítico si falla
            logger.warn('No se pudieron registrar estadísticas:', error.message);
        }
    }

    /**
     * Optimiza la base de datos
     */
    async optimizeDatabase() {
        try {
            // Aquí puedes agregar optimizaciones específicas de SQL Server
            await this.prisma.$executeRaw`EXEC sp_updatestats`;
            logger.info('✅ Base de datos optimizada');
        } catch (error) {
            logger.warn('No se pudo optimizar la base de datos:', error.message);
        }
    }

    /**
     * Obtiene estadísticas de invitaciones
     */
    async getExpirationStats() {
        try {
            const now = new Date();
            const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

            const stats = await this.prisma.invitaciones.groupBy({
                by: ['estado'],
                _count: {
                    estado: true
                }
            });

            const expiringToday = await this.prisma.invitaciones.count({
                where: {
                    fecha_expiracion: {
                        gte: now,
                        lte: tomorrow
                    },
                    estado: {
                        in: ['PENDIENTE', 'CONFIRMADA', 'ACTIVA']
                    }
                }
            });

            return {
                statusCounts: stats.reduce((acc, stat) => {
                    acc[stat.estado] = stat._count.estado;
                    return acc;
                }, {}),
                expiringToday,
                lastCleanup: new Date().toISOString()
            };

        } catch (error) {
            logger.error('Error obteniendo estadísticas:', error);
            throw error;
        }
    }

    /**
     * Cierra el servicio
     */
    async shutdown() {
        try {
            await this.prisma.$disconnect();
            logger.info('🔌 Servicio de expiración de invitaciones desconectado');
        } catch (error) {
            logger.error('Error cerrando servicio:', error);
        }
    }
}

module.exports = new InvitationExpirationService();
