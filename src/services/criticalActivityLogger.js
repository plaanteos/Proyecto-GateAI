// Sistema de Logs de Actividad Crítica - HU10
// Registro y monitoreo de eventos importantes del sistema

const fs = require('fs').promises;
const path = require('path');

class CriticalActivityLogger {
    constructor() {
        this.logDir = path.join(process.cwd(), 'logs');
        this.logFile = path.join(this.logDir, 'critical-activity.log');
        this.alertThresholds = {
            failedLogins: 5, // 5 intentos fallidos en 10 minutos
            unauthorizedAccess: 3, // 3 accesos no autorizados en 5 minutos
            systemErrors: 10, // 10 errores del sistema en 1 hora
            securityViolations: 1 // Cualquier violación de seguridad
        };
        this.recentEvents = new Map(); // Cache para detección de patrones
        this.init();
    }

    async init() {
        try {
            await this.ensureLogDirectory();
            console.log('Sistema de logs críticos inicializado');
        } catch (error) {
            console.error('Error inicializando logger crítico:', error);
        }
    }

    async ensureLogDirectory() {
        try {
            await fs.access(this.logDir);
        } catch {
            await fs.mkdir(this.logDir, { recursive: true });
        }
    }

    // HU10: Registro de actividades críticas
    async logCriticalActivity(event) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            id: this.generateEventId(),
            level: event.level || 'INFO',
            category: event.category,
            action: event.action,
            userId: event.userId,
            userAgent: event.userAgent,
            ipAddress: event.ipAddress,
            details: event.details,
            severity: this.calculateSeverity(event),
            risk_score: this.calculateRiskScore(event)
        };

        try {
            // Escribir al archivo de log
            await this.writeToLogFile(logEntry);
            
            // Detectar patrones sospechosos
            await this.detectSuspiciousPatterns(logEntry);
            
            // Enviar alertas si es necesario
            if (logEntry.severity >= 3) {
                await this.sendSecurityAlert(logEntry);
            }

            return logEntry;
        } catch (error) {
            console.error('Error registrando actividad crítica:', error);
            throw error;
        }
    }

    // Categorías de eventos críticos
    async logFailedLogin(userId, ipAddress, userAgent, reason) {
        return await this.logCriticalActivity({
            category: 'AUTHENTICATION',
            action: 'FAILED_LOGIN',
            level: 'WARNING',
            userId,
            ipAddress,
            userAgent,
            details: {
                reason,
                timestamp: new Date().toISOString()
            }
        });
    }

    async logUnauthorizedAccess(userId, resource, ipAddress, method) {
        return await this.logCriticalActivity({
            category: 'ACCESS_CONTROL',
            action: 'UNAUTHORIZED_ACCESS',
            level: 'ERROR',
            userId,
            ipAddress,
            details: {
                resource,
                method,
                attempted_at: new Date().toISOString()
            }
        });
    }

    async logSecurityViolation(type, description, userId, ipAddress, evidence) {
        return await this.logCriticalActivity({
            category: 'SECURITY',
            action: 'SECURITY_VIOLATION',
            level: 'CRITICAL',
            userId,
            ipAddress,
            details: {
                violation_type: type,
                description,
                evidence,
                requires_immediate_attention: true
            }
        });
    }

    async logPrivilegeEscalation(userId, fromRole, toRole, authorizedBy, ipAddress) {
        return await this.logCriticalActivity({
            category: 'AUTHORIZATION',
            action: 'PRIVILEGE_ESCALATION',
            level: 'WARNING',
            userId,
            ipAddress,
            details: {
                from_role: fromRole,
                to_role: toRole,
                authorized_by: authorizedBy,
                timestamp: new Date().toISOString()
            }
        });
    }

    async logDataAccess(userId, dataType, operation, recordCount, ipAddress) {
        return await this.logCriticalActivity({
            category: 'DATA_ACCESS',
            action: 'SENSITIVE_DATA_ACCESS',
            level: recordCount > 100 ? 'WARNING' : 'INFO',
            userId,
            ipAddress,
            details: {
                data_type: dataType,
                operation,
                record_count: recordCount,
                timestamp: new Date().toISOString()
            }
        });
    }

    async logSystemError(errorType, message, stack, userId, context) {
        return await this.logCriticalActivity({
            category: 'SYSTEM',
            action: 'SYSTEM_ERROR',
            level: 'ERROR',
            userId,
            details: {
                error_type: errorType,
                message,
                stack_trace: stack,
                context,
                timestamp: new Date().toISOString()
            }
        });
    }

    async logConfigurationChange(userId, setting, oldValue, newValue, ipAddress) {
        return await this.logCriticalActivity({
            category: 'CONFIGURATION',
            action: 'CONFIG_CHANGE',
            level: 'WARNING',
            userId,
            ipAddress,
            details: {
                setting,
                old_value: oldValue,
                new_value: newValue,
                timestamp: new Date().toISOString()
            }
        });
    }

    // Cálculo de severidad y riesgo
    calculateSeverity(event) {
        const severityMap = {
            'FAILED_LOGIN': 2,
            'UNAUTHORIZED_ACCESS': 3,
            'SECURITY_VIOLATION': 5,
            'PRIVILEGE_ESCALATION': 4,
            'SENSITIVE_DATA_ACCESS': 3,
            'SYSTEM_ERROR': 2,
            'CONFIG_CHANGE': 3
        };

        let baseSeverity = severityMap[event.action] || 1;

        // Incrementar severidad basado en patrones
        if (this.hasRecentSimilarEvents(event)) {
            baseSeverity += 1;
        }

        return Math.min(baseSeverity, 5);
    }

    calculateRiskScore(event) {
        let riskScore = 0;

        // Factores de riesgo
        const riskFactors = {
            'SECURITY_VIOLATION': 50,
            'UNAUTHORIZED_ACCESS': 35,
            'PRIVILEGE_ESCALATION': 30,
            'FAILED_LOGIN': 15,
            'SENSITIVE_DATA_ACCESS': 25,
            'CONFIG_CHANGE': 20,
            'SYSTEM_ERROR': 10
        };

        riskScore += riskFactors[event.action] || 5;

        // Incrementar por eventos repetidos
        if (this.hasRecentSimilarEvents(event)) {
            riskScore += 20;
        }

        // Incrementar por horario fuera de oficina
        const hour = new Date().getHours();
        if (hour < 7 || hour > 19) {
            riskScore += 15;
        }

        return Math.min(riskScore, 100);
    }

    // Detección de patrones sospechosos
    async detectSuspiciousPatterns(event) {
        const eventKey = `${event.action}_${event.userId}_${event.ipAddress}`;
        const timeWindow = 10 * 60 * 1000; // 10 minutos
        const now = Date.now();

        // Limpiar eventos antiguos
        this.cleanOldEvents(now, timeWindow);

        // Registrar evento actual
        if (!this.recentEvents.has(eventKey)) {
            this.recentEvents.set(eventKey, []);
        }
        this.recentEvents.get(eventKey).push({
            timestamp: now,
            event
        });

        // Verificar umbrales
        const eventCount = this.recentEvents.get(eventKey).length;
        const threshold = this.alertThresholds[this.getThresholdKey(event.action)] || 5;

        if (eventCount >= threshold) {
            await this.triggerSecurityAlert(event, eventCount);
        }
    }

    getThresholdKey(action) {
        const mapping = {
            'FAILED_LOGIN': 'failedLogins',
            'UNAUTHORIZED_ACCESS': 'unauthorizedAccess',
            'SYSTEM_ERROR': 'systemErrors',
            'SECURITY_VIOLATION': 'securityViolations'
        };
        return mapping[action] || 'default';
    }

    hasRecentSimilarEvents(event) {
        const eventKey = `${event.action}_${event.userId}`;
        const recentEvents = this.recentEvents.get(eventKey);
        return recentEvents && recentEvents.length > 1;
    }

    cleanOldEvents(now, timeWindow) {
        for (const [key, events] of this.recentEvents) {
            const validEvents = events.filter(e => (now - e.timestamp) < timeWindow);
            if (validEvents.length === 0) {
                this.recentEvents.delete(key);
            } else {
                this.recentEvents.set(key, validEvents);
            }
        }
    }

    // Escritura de logs
    async writeToLogFile(logEntry) {
        const logLine = JSON.stringify(logEntry) + '\n';
        await fs.appendFile(this.logFile, logLine, 'utf8');
    }

    // Sistema de alertas
    async sendSecurityAlert(logEntry) {
        try {
            // Notificación inmediata para violaciones críticas
            if (logEntry.severity >= 4) {
                await this.sendImmediateAlert(logEntry);
            }

            // Log de alerta
            console.warn(`🚨 ALERTA DE SEGURIDAD: ${logEntry.action}`, {
                severity: logEntry.severity,
                userId: logEntry.userId,
                details: logEntry.details
            });

        } catch (error) {
            console.error('Error enviando alerta de seguridad:', error);
        }
    }

    async triggerSecurityAlert(event, eventCount) {
        const alertEntry = {
            timestamp: new Date().toISOString(),
            type: 'SUSPICIOUS_PATTERN_DETECTED',
            action: event.action,
            user_id: event.userId,
            ip_address: event.ipAddress,
            event_count: eventCount,
            time_window: '10 minutes',
            threat_level: 'HIGH'
        };

        await this.logCriticalActivity({
            category: 'SECURITY',
            action: 'SUSPICIOUS_PATTERN_DETECTED',
            level: 'CRITICAL',
            userId: event.userId,
            ipAddress: event.ipAddress,
            details: alertEntry
        });
    }

    async sendImmediateAlert(logEntry) {
        // Aquí se integrarían servicios de notificación (email, SMS, Slack, etc.)
        console.error(`🔴 ALERTA CRÍTICA INMEDIATA:`, {
            action: logEntry.action,
            severity: logEntry.severity,
            risk_score: logEntry.risk_score,
            timestamp: logEntry.timestamp,
            details: logEntry.details
        });
    }

    // Consulta de logs
    async getCriticalLogs(options = {}) {
        try {
            const {
                startDate = new Date(Date.now() - 24 * 60 * 60 * 1000), // Últimas 24 horas
                endDate = new Date(),
                category = null,
                level = null,
                userId = null,
                limit = 100
            } = options;

            const logContent = await fs.readFile(this.logFile, 'utf8');
            const lines = logContent.trim().split('\n').filter(line => line);
            
            let logs = lines.map(line => {
                try {
                    return JSON.parse(line);
                } catch {
                    return null;
                }
            }).filter(log => log !== null);

            // Filtrar por criterios
            logs = logs.filter(log => {
                const logDate = new Date(log.timestamp);
                if (logDate < startDate || logDate > endDate) return false;
                if (category && log.category !== category) return false;
                if (level && log.level !== level) return false;
                if (userId && log.userId !== userId) return false;
                return true;
            });

            // Ordenar por timestamp descendente
            logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            return logs.slice(0, limit);
        } catch (error) {
            console.error('Error leyendo logs críticos:', error);
            return [];
        }
    }

    async getSecuritySummary(hours = 24) {
        try {
            const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);
            const logs = await this.getCriticalLogs({ startDate, limit: 1000 });

            const summary = {
                total_events: logs.length,
                by_category: {},
                by_level: {},
                by_hour: {},
                top_users: {},
                top_ips: {},
                critical_events: logs.filter(log => log.severity >= 4).length,
                average_risk_score: 0
            };

            logs.forEach(log => {
                // Por categoría
                summary.by_category[log.category] = (summary.by_category[log.category] || 0) + 1;
                
                // Por nivel
                summary.by_level[log.level] = (summary.by_level[log.level] || 0) + 1;
                
                // Por hora
                const hour = new Date(log.timestamp).getHours();
                summary.by_hour[hour] = (summary.by_hour[hour] || 0) + 1;
                
                // Top usuarios
                if (log.userId) {
                    summary.top_users[log.userId] = (summary.top_users[log.userId] || 0) + 1;
                }
                
                // Top IPs
                if (log.ipAddress) {
                    summary.top_ips[log.ipAddress] = (summary.top_ips[log.ipAddress] || 0) + 1;
                }
            });

            // Calcular risk score promedio
            const totalRiskScore = logs.reduce((sum, log) => sum + (log.risk_score || 0), 0);
            summary.average_risk_score = logs.length > 0 ? Math.round(totalRiskScore / logs.length) : 0;

            return summary;
        } catch (error) {
            console.error('Error generando resumen de seguridad:', error);
            return null;
        }
    }

    // Utilidades
    generateEventId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Limpieza de logs antiguos
    async cleanupOldLogs(daysToKeep = 30) {
        try {
            const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
            const logContent = await fs.readFile(this.logFile, 'utf8');
            const lines = logContent.trim().split('\n').filter(line => line);
            
            const validLines = lines.filter(line => {
                try {
                    const log = JSON.parse(line);
                    return new Date(log.timestamp) >= cutoffDate;
                } catch {
                    return false;
                }
            });

            await fs.writeFile(this.logFile, validLines.join('\n') + '\n', 'utf8');
            console.log(`Logs limpiados: mantenidos ${validLines.length} de ${lines.length} registros`);
        } catch (error) {
            console.error('Error limpiando logs antiguos:', error);
        }
    }
}

module.exports = CriticalActivityLogger;
