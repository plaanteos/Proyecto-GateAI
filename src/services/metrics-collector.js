/**
 * Sistema de Métricas y Monitoreo
 * APM (Application Performance Monitoring) personalizado
 */

const os = require('os');
const EventEmitter = require('events');
const logger = require('../config/logger');

class MetricsCollector extends EventEmitter {
    constructor() {
        super();
        this.metrics = new Map();
        this.alerts = new Map();
        this.thresholds = {
            responseTime: 2000, // 2 segundos
            errorRate: 0.05,    // 5%
            memoryUsage: 0.8,   // 80%
            cpuUsage: 0.8,      // 80%
            diskUsage: 0.9      // 90%
        };
        
        this.startCollection();
    }

    /**
     * Iniciar recolección automática de métricas
     */
    startCollection() {
        // Métricas cada 30 segundos
        setInterval(() => {
            this.collectSystemMetrics();
        }, 30000);

        // Análisis y alertas cada minuto
        setInterval(() => {
            this.analyzeMetrics();
            this.checkAlerts();
        }, 60000);

        // Limpiar métricas antiguas cada hora
        setInterval(() => {
            this.cleanOldMetrics();
        }, 3600000);

        logger.info('📊 Sistema de métricas iniciado');
    }

    /**
     * Recopilar métricas del sistema
     */
    collectSystemMetrics() {
        const timestamp = Date.now();
        const cpus = os.cpus();
        
        // Métricas del sistema operativo
        const systemMetrics = {
            timestamp,
            memory: {
                total: os.totalmem(),
                free: os.freemem(),
                used: os.totalmem() - os.freemem(),
                usage: (os.totalmem() - os.freemem()) / os.totalmem()
            },
            cpu: {
                count: cpus.length,
                loadAvg: os.loadavg(),
                usage: this.calculateCPUUsage()
            },
            process: {
                uptime: process.uptime(),
                memoryUsage: process.memoryUsage(),
                cpuUsage: process.cpuUsage()
            },
            system: {
                platform: os.platform(),
                arch: os.arch(),
                uptime: os.uptime(),
                hostname: os.hostname()
            }
        };

        this.storeMetric('system', systemMetrics);
        this.emit('metricsCollected', systemMetrics);
    }

    /**
     * Calcular uso promedio de CPU
     */
    calculateCPUUsage() {
        const cpus = os.cpus();
        let totalIdle = 0;
        let totalTick = 0;

        cpus.forEach(cpu => {
            for (const type in cpu.times) {
                totalTick += cpu.times[type];
            }
            totalIdle += cpu.times.idle;
        });

        return 1 - (totalIdle / totalTick);
    }

    /**
     * Almacenar métrica
     */
    storeMetric(category, data) {
        if (!this.metrics.has(category)) {
            this.metrics.set(category, []);
        }

        const categoryMetrics = this.metrics.get(category);
        categoryMetrics.push(data);

        // Mantener solo las últimas 1000 métricas por categoría
        if (categoryMetrics.length > 1000) {
            categoryMetrics.splice(0, categoryMetrics.length - 1000);
        }
    }

    /**
     * Registrar métrica de request HTTP
     */
    recordHttpRequest(req, res, responseTime) {
        const metric = {
            timestamp: Date.now(),
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            responseTime,
            userAgent: req.get('User-Agent'),
            ip: req.ip,
            userId: req.user?.id
        };

        this.storeMetric('http', metric);
        this.updateHttpStats(metric);
    }

    /**
     * Actualizar estadísticas HTTP agregadas
     */
    updateHttpStats(metric) {
        const now = Date.now();
        const minute = Math.floor(now / 60000) * 60000; // Redondear a minuto

        if (!this.metrics.has('httpStats')) {
            this.metrics.set('httpStats', new Map());
        }

        const httpStats = this.metrics.get('httpStats');
        if (!httpStats.has(minute)) {
            httpStats.set(minute, {
                timestamp: minute,
                totalRequests: 0,
                errorRequests: 0,
                totalResponseTime: 0,
                maxResponseTime: 0,
                minResponseTime: Infinity,
                statusCodes: {}
            });
        }

        const stats = httpStats.get(minute);
        stats.totalRequests++;
        stats.totalResponseTime += metric.responseTime;
        stats.maxResponseTime = Math.max(stats.maxResponseTime, metric.responseTime);
        stats.minResponseTime = Math.min(stats.minResponseTime, metric.responseTime);

        if (metric.statusCode >= 400) {
            stats.errorRequests++;
        }

        stats.statusCodes[metric.statusCode] = (stats.statusCodes[metric.statusCode] || 0) + 1;
    }

    /**
     * Registrar métrica de base de datos
     */
    recordDatabaseQuery(query, duration, success = true) {
        const metric = {
            timestamp: Date.now(),
            query: query.substring(0, 200), // Limitar longitud
            duration,
            success,
            type: this.extractQueryType(query)
        };

        this.storeMetric('database', metric);
    }

    /**
     * Extraer tipo de query SQL
     */
    extractQueryType(query) {
        const normalizedQuery = query.trim().toLowerCase();
        if (normalizedQuery.startsWith('select')) return 'SELECT';
        if (normalizedQuery.startsWith('insert')) return 'INSERT';
        if (normalizedQuery.startsWith('update')) return 'UPDATE';
        if (normalizedQuery.startsWith('delete')) return 'DELETE';
        if (normalizedQuery.startsWith('create')) return 'CREATE';
        if (normalizedQuery.startsWith('alter')) return 'ALTER';
        return 'OTHER';
    }

    /**
     * Registrar evento de negocio
     */
    recordBusinessEvent(eventType, data = {}) {
        const metric = {
            timestamp: Date.now(),
            eventType,
            data,
            category: 'business'
        };

        this.storeMetric('business', metric);
        this.emit('businessEvent', metric);
    }

    /**
     * Analizar métricas y detectar problemas
     */
    analyzeMetrics() {
        this.analyzeResponseTimes();
        this.analyzeErrorRates();
        this.analyzeResourceUsage();
        this.analyzeBusinessMetrics();
    }

    /**
     * Analizar tiempos de respuesta
     */
    analyzeResponseTimes() {
        const httpStats = this.metrics.get('httpStats');
        if (!httpStats) return;

        const recentStats = Array.from(httpStats.values())
            .filter(stat => Date.now() - stat.timestamp < 300000) // Últimos 5 minutos
            .filter(stat => stat.totalRequests > 0);

        if (recentStats.length === 0) return;

        const avgResponseTime = recentStats.reduce((sum, stat) => 
            sum + (stat.totalResponseTime / stat.totalRequests), 0
        ) / recentStats.length;

        if (avgResponseTime > this.thresholds.responseTime) {
            this.triggerAlert('HIGH_RESPONSE_TIME', {
                current: avgResponseTime,
                threshold: this.thresholds.responseTime,
                severity: 'WARNING'
            });
        }
    }

    /**
     * Analizar tasa de errores
     */
    analyzeErrorRates() {
        const httpStats = this.metrics.get('httpStats');
        if (!httpStats) return;

        const recentStats = Array.from(httpStats.values())
            .filter(stat => Date.now() - stat.timestamp < 300000)
            .filter(stat => stat.totalRequests > 0);

        if (recentStats.length === 0) return;

        const totalRequests = recentStats.reduce((sum, stat) => sum + stat.totalRequests, 0);
        const totalErrors = recentStats.reduce((sum, stat) => sum + stat.errorRequests, 0);
        const errorRate = totalErrors / totalRequests;

        if (errorRate > this.thresholds.errorRate) {
            this.triggerAlert('HIGH_ERROR_RATE', {
                current: errorRate,
                threshold: this.thresholds.errorRate,
                severity: 'CRITICAL'
            });
        }
    }

    /**
     * Analizar uso de recursos
     */
    analyzeResourceUsage() {
        const systemMetrics = this.metrics.get('system');
        if (!systemMetrics || systemMetrics.length === 0) return;

        const latest = systemMetrics[systemMetrics.length - 1];

        // Verificar memoria
        if (latest.memory.usage > this.thresholds.memoryUsage) {
            this.triggerAlert('HIGH_MEMORY_USAGE', {
                current: latest.memory.usage,
                threshold: this.thresholds.memoryUsage,
                severity: 'WARNING'
            });
        }

        // Verificar CPU
        if (latest.cpu.usage > this.thresholds.cpuUsage) {
            this.triggerAlert('HIGH_CPU_USAGE', {
                current: latest.cpu.usage,
                threshold: this.thresholds.cpuUsage,
                severity: 'WARNING'
            });
        }
    }

    /**
     * Analizar métricas de negocio
     */
    analyzeBusinessMetrics() {
        const businessMetrics = this.metrics.get('business');
        if (!businessMetrics) return;

        const lastHour = Date.now() - 3600000;
        const recentEvents = businessMetrics.filter(event => event.timestamp > lastHour);

        // Analizar patrones de uso
        const eventCounts = {};
        recentEvents.forEach(event => {
            eventCounts[event.eventType] = (eventCounts[event.eventType] || 0) + 1;
        });

        // Detectar anomalías en eventos de negocio
        Object.entries(eventCounts).forEach(([eventType, count]) => {
            if (this.isAnomalousCount(eventType, count)) {
                this.triggerAlert('BUSINESS_ANOMALY', {
                    eventType,
                    count,
                    severity: 'INFO'
                });
            }
        });
    }

    /**
     * Verificar si un conteo es anómalo
     */
    isAnomalousCount(eventType, count) {
        // Lógica simple: más de 100 eventos del mismo tipo en una hora
        const thresholds = {
            'user_login': 1000,
            'visitor_checkin': 500,
            'visitor_checkout': 500,
            'error_occurred': 10
        };

        return count > (thresholds[eventType] || 100);
    }

    /**
     * Disparar alerta
     */
    triggerAlert(type, data) {
        const alertKey = `${type}_${Date.now()}`;
        const alert = {
            id: alertKey,
            type,
            timestamp: Date.now(),
            ...data
        };

        this.alerts.set(alertKey, alert);
        this.emit('alert', alert);

        logger.warn('🚨 Alerta de métrica disparada:', alert);

        // Limpiar alertas antiguas (más de 24 horas)
        const oneDayAgo = Date.now() - 86400000;
        for (const [key, alert] of this.alerts) {
            if (alert.timestamp < oneDayAgo) {
                this.alerts.delete(key);
            }
        }
    }

    /**
     * Verificar alertas activas
     */
    checkAlerts() {
        const activeAlerts = Array.from(this.alerts.values())
            .filter(alert => Date.now() - alert.timestamp < 3600000); // Últimas horas

        if (activeAlerts.length > 0) {
            this.emit('activeAlerts', activeAlerts);
        }
    }

    /**
     * Limpiar métricas antiguas
     */
    cleanOldMetrics() {
        const retentionPeriod = 7 * 24 * 60 * 60 * 1000; // 7 días
        const cutoff = Date.now() - retentionPeriod;

        for (const [category, metrics] of this.metrics) {
            if (Array.isArray(metrics)) {
                const filtered = metrics.filter(metric => metric.timestamp > cutoff);
                this.metrics.set(category, filtered);
            }
        }

        logger.debug('🧹 Métricas antiguas limpiadas');
    }

    /**
     * Obtener resumen de métricas
     */
    getMetricsSummary(timeRange = 3600000) { // 1 hora por defecto
        const cutoff = Date.now() - timeRange;
        const summary = {};

        // Métricas HTTP
        const httpStats = this.metrics.get('httpStats');
        if (httpStats) {
            const recentStats = Array.from(httpStats.values())
                .filter(stat => stat.timestamp > cutoff);

            if (recentStats.length > 0) {
                summary.http = {
                    totalRequests: recentStats.reduce((sum, stat) => sum + stat.totalRequests, 0),
                    errorRequests: recentStats.reduce((sum, stat) => sum + stat.errorRequests, 0),
                    avgResponseTime: recentStats.reduce((sum, stat) => 
                        sum + (stat.totalResponseTime / stat.totalRequests), 0
                    ) / recentStats.length,
                    errorRate: recentStats.reduce((sum, stat) => sum + stat.errorRequests, 0) /
                              recentStats.reduce((sum, stat) => sum + stat.totalRequests, 0)
                };
            }
        }

        // Métricas del sistema
        const systemMetrics = this.metrics.get('system');
        if (systemMetrics && systemMetrics.length > 0) {
            const latest = systemMetrics[systemMetrics.length - 1];
            summary.system = {
                memoryUsage: latest.memory.usage,
                cpuUsage: latest.cpu.usage,
                uptime: latest.process.uptime,
                loadAvg: latest.cpu.loadAvg[0]
            };
        }

        // Métricas de base de datos
        const dbMetrics = this.metrics.get('database');
        if (dbMetrics) {
            const recentQueries = dbMetrics.filter(query => query.timestamp > cutoff);
            if (recentQueries.length > 0) {
                summary.database = {
                    totalQueries: recentQueries.length,
                    failedQueries: recentQueries.filter(q => !q.success).length,
                    avgQueryTime: recentQueries.reduce((sum, q) => sum + q.duration, 0) / recentQueries.length
                };
            }
        }

        // Alertas activas
        summary.alerts = Array.from(this.alerts.values())
            .filter(alert => alert.timestamp > cutoff);

        return summary;
    }

    /**
     * Generar reporte detallado
     */
    generateDetailedReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: this.getMetricsSummary(),
            trends: this.calculateTrends(),
            recommendations: this.generateRecommendations(),
            systemHealth: this.assessSystemHealth()
        };

        logger.info('📋 Reporte de métricas generado');
        return report;
    }

    /**
     * Calcular tendencias
     */
    calculateTrends() {
        // Comparar últimas 2 horas vs 2 horas anteriores
        const now = Date.now();
        const twoHoursAgo = now - 7200000;
        const fourHoursAgo = now - 14400000;

        const recent = this.getMetricsSummary(7200000); // Últimas 2 horas
        const previous = this.getMetricsSummary(7200000, fourHoursAgo); // 2-4 horas atrás

        return {
            requestVolume: this.calculateTrend(recent.http?.totalRequests, previous.http?.totalRequests),
            responseTime: this.calculateTrend(recent.http?.avgResponseTime, previous.http?.avgResponseTime),
            errorRate: this.calculateTrend(recent.http?.errorRate, previous.http?.errorRate),
            memoryUsage: this.calculateTrend(recent.system?.memoryUsage, previous.system?.memoryUsage)
        };
    }

    /**
     * Calcular tendencia individual
     */
    calculateTrend(current, previous) {
        if (!current || !previous || previous === 0) return null;
        
        const change = ((current - previous) / previous) * 100;
        return {
            current,
            previous,
            change: Math.round(change * 100) / 100,
            direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
        };
    }

    /**
     * Generar recomendaciones
     */
    generateRecommendations() {
        const recommendations = [];
        const summary = this.getMetricsSummary();

        if (summary.http?.errorRate > 0.02) {
            recommendations.push({
                type: 'ERROR_RATE',
                priority: 'HIGH',
                message: 'Alta tasa de errores detectada. Revisar logs de aplicación.',
                impact: 'Afecta experiencia de usuario'
            });
        }

        if (summary.http?.avgResponseTime > 1000) {
            recommendations.push({
                type: 'PERFORMANCE',
                priority: 'MEDIUM',
                message: 'Tiempo de respuesta elevado. Considerar optimización de queries.',
                impact: 'Reduce satisfacción de usuario'
            });
        }

        if (summary.system?.memoryUsage > 0.8) {
            recommendations.push({
                type: 'MEMORY',
                priority: 'HIGH',
                message: 'Alto uso de memoria. Considerar escalado vertical.',
                impact: 'Riesgo de inestabilidad del sistema'
            });
        }

        return recommendations;
    }

    /**
     * Evaluar salud del sistema
     */
    assessSystemHealth() {
        const summary = this.getMetricsSummary();
        let score = 100;
        const issues = [];

        // Penalizar por problemas
        if (summary.http?.errorRate > 0.05) {
            score -= 30;
            issues.push('Alta tasa de errores HTTP');
        }

        if (summary.http?.avgResponseTime > 2000) {
            score -= 20;
            issues.push('Tiempo de respuesta lento');
        }

        if (summary.system?.memoryUsage > 0.9) {
            score -= 25;
            issues.push('Memoria crítica');
        }

        if (summary.system?.cpuUsage > 0.8) {
            score -= 15;
            issues.push('CPU sobrecargado');
        }

        return {
            score: Math.max(0, score),
            status: score >= 90 ? 'excellent' : score >= 70 ? 'good' : score >= 50 ? 'warning' : 'critical',
            issues
        };
    }

    /**
     * Middleware para Express
     */
    createMetricsMiddleware() {
        return (req, res, next) => {
            const startTime = Date.now();

            res.on('finish', () => {
                const responseTime = Date.now() - startTime;
                this.recordHttpRequest(req, res, responseTime);
            });

            next();
        };
    }
}

// Singleton
const metricsCollector = new MetricsCollector();

module.exports = metricsCollector;
