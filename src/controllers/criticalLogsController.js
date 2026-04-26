// Controlador de Logs de Actividad Crítica - HU10
// API REST para consulta y gestión de logs de seguridad

const CriticalActivityLogger = require('../services/criticalActivityLogger');

class CriticalLogsController {
    constructor() {
        this.logger = new CriticalActivityLogger();
    }

    // GET /api/security/logs - Obtener logs críticos con filtros
    async getLogs(req, res) {
        try {
            const {
                startDate,
                endDate,
                category,
                level,
                userId,
                limit = 50,
                page = 1
            } = req.query;

            const options = {
                limit: Math.min(parseInt(limit), 500), // Máximo 500 logs por solicitud
                category,
                level,
                userId
            };

            // Parsear fechas si se proporcionan
            if (startDate) {
                options.startDate = new Date(startDate);
            }
            if (endDate) {
                options.endDate = new Date(endDate);
            }

            const logs = await this.logger.getCriticalLogs(options);

            // Paginación simple
            const startIndex = (page - 1) * options.limit;
            const endIndex = startIndex + options.limit;
            const paginatedLogs = logs.slice(startIndex, endIndex);

            res.json({
                success: true,
                data: {
                    logs: paginatedLogs,
                    pagination: {
                        page: parseInt(page),
                        limit: options.limit,
                        total: logs.length,
                        hasMore: endIndex < logs.length
                    }
                }
            });

        } catch (error) {
            console.error('Error obteniendo logs críticos:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    // GET /api/security/summary - Resumen de actividad de seguridad
    async getSecuritySummary(req, res) {
        try {
            const { hours = 24 } = req.query;
            const summary = await this.logger.getSecuritySummary(parseInt(hours));

            if (!summary) {
                return res.status(500).json({
                    success: false,
                    message: 'Error generando resumen de seguridad'
                });
            }

            res.json({
                success: true,
                data: summary
            });

        } catch (error) {
            console.error('Error obteniendo resumen de seguridad:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    // POST /api/security/logs - Registrar evento crítico manual
    async logCriticalEvent(req, res) {
        try {
            const {
                category,
                action,
                level = 'INFO',
                details,
                userId,
                ipAddress
            } = req.body;

            // Validaciones básicas
            if (!category || !action) {
                return res.status(400).json({
                    success: false,
                    message: 'Categoría y acción son requeridas'
                });
            }

            const event = {
                category,
                action,
                level,
                details,
                userId: userId || req.user?.id,
                ipAddress: ipAddress || req.ip || req.connection.remoteAddress,
                userAgent: req.get('User-Agent')
            };

            const logEntry = await this.logger.logCriticalActivity(event);

            res.status(201).json({
                success: true,
                data: {
                    eventId: logEntry.id,
                    timestamp: logEntry.timestamp,
                    severity: logEntry.severity
                },
                message: 'Evento crítico registrado exitosamente'
            });

        } catch (error) {
            console.error('Error registrando evento crítico:', error);
            res.status(500).json({
                success: false,
                message: 'Error registrando evento',
                error: error.message
            });
        }
    }

    // GET /api/security/alerts - Obtener alertas activas
    async getActiveAlerts(req, res) {
        try {
            const { hours = 24 } = req.query;
            const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);
            
            const alerts = await this.logger.getCriticalLogs({
                startDate,
                category: 'SECURITY',
                level: 'CRITICAL',
                limit: 100
            });

            // Agrupar alertas similares
            const groupedAlerts = this.groupSimilarAlerts(alerts);

            res.json({
                success: true,
                data: {
                    active_alerts: groupedAlerts,
                    total_count: alerts.length,
                    critical_count: alerts.filter(a => a.severity >= 4).length
                }
            });

        } catch (error) {
            console.error('Error obteniendo alertas activas:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    // GET /api/security/dashboard - Dashboard de seguridad
    async getSecurityDashboard(req, res) {
        try {
            const [summary24h, summary7d, recentAlerts] = await Promise.all([
                this.logger.getSecuritySummary(24),
                this.logger.getSecuritySummary(24 * 7),
                this.logger.getCriticalLogs({
                    startDate: new Date(Date.now() - 60 * 60 * 1000), // Última hora
                    level: 'CRITICAL',
                    limit: 10
                })
            ]);

            const dashboard = {
                current_status: this.calculateSecurityStatus(summary24h),
                summary_24h: summary24h,
                summary_7d: summary7d,
                recent_critical_alerts: recentAlerts,
                trends: this.calculateSecurityTrends(summary24h, summary7d),
                recommendations: this.generateSecurityRecommendations(summary24h)
            };

            res.json({
                success: true,
                data: dashboard
            });

        } catch (error) {
            console.error('Error obteniendo dashboard de seguridad:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    // DELETE /api/security/logs/cleanup - Limpiar logs antiguos
    async cleanupLogs(req, res) {
        try {
            const { daysToKeep = 30 } = req.body;
            
            // Solo administradores pueden limpiar logs
            if (!req.user || req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Acceso denegado: se requieren permisos de administrador'
                });
            }

            await this.logger.cleanupOldLogs(parseInt(daysToKeep));

            // Registrar la limpieza como evento crítico
            await this.logger.logCriticalActivity({
                category: 'SYSTEM',
                action: 'LOG_CLEANUP',
                level: 'INFO',
                userId: req.user.id,
                ipAddress: req.ip,
                details: {
                    days_kept: daysToKeep,
                    performed_by: req.user.id,
                    timestamp: new Date().toISOString()
                }
            });

            res.json({
                success: true,
                message: `Logs anteriores a ${daysToKeep} días han sido eliminados`
            });

        } catch (error) {
            console.error('Error limpiando logs:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    // Métodos auxiliares
    groupSimilarAlerts(alerts) {
        const grouped = {};
        
        alerts.forEach(alert => {
            const key = `${alert.action}_${alert.userId}`;
            if (!grouped[key]) {
                grouped[key] = {
                    type: alert.action,
                    user_id: alert.userId,
                    count: 0,
                    first_occurrence: alert.timestamp,
                    last_occurrence: alert.timestamp,
                    severity: alert.severity,
                    details: alert.details
                };
            }
            
            grouped[key].count++;
            if (new Date(alert.timestamp) > new Date(grouped[key].last_occurrence)) {
                grouped[key].last_occurrence = alert.timestamp;
            }
        });

        return Object.values(grouped).sort((a, b) => 
            new Date(b.last_occurrence) - new Date(a.last_occurrence)
        );
    }

    calculateSecurityStatus(summary) {
        if (!summary) return 'UNKNOWN';

        const criticalEvents = summary.critical_events || 0;
        const avgRiskScore = summary.average_risk_score || 0;

        if (criticalEvents > 5 || avgRiskScore > 70) {
            return 'HIGH_RISK';
        } else if (criticalEvents > 2 || avgRiskScore > 40) {
            return 'MEDIUM_RISK';
        } else {
            return 'LOW_RISK';
        }
    }

    calculateSecurityTrends(current, previous) {
        if (!current || !previous) return {};

        const criticalTrend = this.calculateTrend(
            current.critical_events,
            previous.critical_events / 7 * 1 // Normalizar a 24h
        );

        const riskTrend = this.calculateTrend(
            current.average_risk_score,
            previous.average_risk_score
        );

        return {
            critical_events_trend: criticalTrend,
            risk_score_trend: riskTrend,
            overall_trend: (criticalTrend + riskTrend) / 2
        };
    }

    calculateTrend(current, previous) {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
    }

    generateSecurityRecommendations(summary) {
        const recommendations = [];

        if (summary.critical_events > 3) {
            recommendations.push({
                priority: 'HIGH',
                category: 'SECURITY',
                message: 'Alto número de eventos críticos detectados. Revisar logs inmediatamente.',
                action: 'review_critical_logs'
            });
        }

        if (summary.average_risk_score > 50) {
            recommendations.push({
                priority: 'MEDIUM',
                category: 'RISK_MANAGEMENT',
                message: 'Score de riesgo elevado. Considerar medidas adicionales de seguridad.',
                action: 'enhance_security_measures'
            });
        }

        const failedLogins = summary.by_category?.AUTHENTICATION || 0;
        if (failedLogins > 10) {
            recommendations.push({
                priority: 'MEDIUM',
                category: 'AUTHENTICATION',
                message: 'Múltiples intentos de login fallidos. Verificar intentos de acceso no autorizado.',
                action: 'review_failed_logins'
            });
        }

        return recommendations;
    }
}

module.exports = CriticalLogsController;
