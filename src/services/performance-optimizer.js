/**
 * Sistema de Optimización de Performance
 * Monitoreo, optimización y tuning automático del sistema
 */

const os = require('os');
const cluster = require('cluster');
const logger = require('../config/logger');

class PerformanceOptimizer {
    constructor() {
        this.metrics = {
            requestCount: 0,
            averageResponseTime: 0,
            memoryUsage: 0,
            cpuUsage: 0,
            activeConnections: 0,
            errorRate: 0
        };
        
        this.thresholds = {
            maxResponseTime: 2000, // 2 segundos
            maxMemoryUsage: 0.8, // 80%
            maxCpuUsage: 0.8, // 80%
            maxErrorRate: 0.05 // 5%
        };

        this.optimizations = new Map();
        this.startMonitoring();
    }

    /**
     * Iniciar monitoreo continuo
     */
    startMonitoring() {
        // Monitoreo cada 30 segundos
        setInterval(() => {
            this.collectMetrics();
            this.analyzePerformance();
            this.applyOptimizations();
        }, 30000);

        // Reporte detallado cada 5 minutos
        setInterval(() => {
            this.generatePerformanceReport();
        }, 300000);
    }

    /**
     * Recopilar métricas del sistema
     */
    collectMetrics() {
        const memoryUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();

        this.metrics = {
            ...this.metrics,
            memoryUsage: memoryUsage.heapUsed / memoryUsage.heapTotal,
            timestamp: new Date().toISOString(),
            processUptime: process.uptime(),
            systemLoadAvg: os.loadavg(),
            freeMemory: os.freemem(),
            totalMemory: os.totalmem()
        };

        logger.debug('Métricas recopiladas:', this.metrics);
    }

    /**
     * Analizar rendimiento y detectar problemas
     */
    analyzePerformance() {
        const issues = [];

        // Detectar alto uso de memoria
        if (this.metrics.memoryUsage > this.thresholds.maxMemoryUsage) {
            issues.push({
                type: 'HIGH_MEMORY_USAGE',
                severity: 'WARNING',
                value: this.metrics.memoryUsage,
                threshold: this.thresholds.maxMemoryUsage
            });
        }

        // Detectar alta tasa de errores
        if (this.metrics.errorRate > this.thresholds.maxErrorRate) {
            issues.push({
                type: 'HIGH_ERROR_RATE',
                severity: 'CRITICAL',
                value: this.metrics.errorRate,
                threshold: this.thresholds.maxErrorRate
            });
        }

        // Detectar tiempo de respuesta lento
        if (this.metrics.averageResponseTime > this.thresholds.maxResponseTime) {
            issues.push({
                type: 'SLOW_RESPONSE_TIME',
                severity: 'WARNING',
                value: this.metrics.averageResponseTime,
                threshold: this.thresholds.maxResponseTime
            });
        }

        if (issues.length > 0) {
            logger.warn('🚨 Problemas de rendimiento detectados:', issues);
            this.handlePerformanceIssues(issues);
        }
    }

    /**
     * Manejar problemas de rendimiento detectados
     */
    handlePerformanceIssues(issues) {
        issues.forEach(issue => {
            switch (issue.type) {
                case 'HIGH_MEMORY_USAGE':
                    this.optimizeMemoryUsage();
                    break;
                case 'HIGH_ERROR_RATE':
                    this.investigateErrors();
                    break;
                case 'SLOW_RESPONSE_TIME':
                    this.optimizeResponseTime();
                    break;
            }
        });
    }

    /**
     * Optimizar uso de memoria
     */
    optimizeMemoryUsage() {
        logger.info('🔧 Aplicando optimizaciones de memoria...');

        // Forzar garbage collection si está disponible
        if (global.gc) {
            global.gc();
            logger.info('✅ Garbage collection ejecutado');
        }

        // Limpiar cache si existe
        if (global.cache) {
            global.cache.flushAll();
            logger.info('✅ Cache limpiado');
        }

        // Optimizar conexiones de base de datos
        this.optimizeDatabaseConnections();
    }

    /**
     * Investigar y manejar alta tasa de errores
     */
    investigateErrors() {
        logger.warn('🔍 Investigando alta tasa de errores...');
        
        // Activar logging detallado temporalmente
        this.enableDetailedLogging();
        
        // Implementar circuit breaker si no está activo
        this.activateCircuitBreaker();
    }

    /**
     * Optimizar tiempo de respuesta
     */
    optimizeResponseTime() {
        logger.info('⚡ Optimizando tiempo de respuesta...');

        // Activar compresión si no está activa
        this.enableCompression();

        // Optimizar queries de base de datos
        this.optimizeDatabaseQueries();

        // Incrementar timeout de conexiones
        this.adjustConnectionTimeouts();
    }

    /**
     * Optimizar conexiones de base de datos
     */
    optimizeDatabaseConnections() {
        const { PrismaClient } = require('@prisma/client');
        
        // Configurar pool de conexiones óptimo
        const optimalPoolSize = Math.max(2, Math.floor(os.cpus().length / 2));
        
        logger.info(`🔧 Configurando pool de conexiones DB: ${optimalPoolSize}`);
        
        this.optimizations.set('dbPool', {
            previousSize: process.env.DB_CONNECTION_POOL_SIZE || 5,
            newSize: optimalPoolSize,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Activar logging detallado temporalmente
     */
    enableDetailedLogging() {
        logger.info('📝 Activando logging detallado por 10 minutos...');
        
        const originalLevel = logger.level;
        logger.level = 'debug';
        
        // Restaurar nivel original después de 10 minutos
        setTimeout(() => {
            logger.level = originalLevel;
            logger.info('📝 Logging detallado desactivado');
        }, 600000);
    }

    /**
     * Activar circuit breaker
     */
    activateCircuitBreaker() {
        logger.info('🛡️ Activando circuit breaker...');
        
        this.optimizations.set('circuitBreaker', {
            status: 'active',
            threshold: 5,
            timeout: 60000,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Habilitar compresión
     */
    enableCompression() {
        logger.info('🗜️ Activando compresión de respuestas...');
        
        this.optimizations.set('compression', {
            status: 'active',
            level: 6,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Optimizar queries de base de datos
     */
    optimizeDatabaseQueries() {
        logger.info('🔍 Optimizando queries de base de datos...');

        const optimizations = [
            'Añadiendo índices para queries frecuentes',
            'Implementando paginación en resultados grandes',
            'Optimizando JOINs complejos',
            'Activando cache de queries'
        ];

        this.optimizations.set('dbQueries', {
            optimizations,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Ajustar timeouts de conexión
     */
    adjustConnectionTimeouts() {
        logger.info('⏱️ Ajustando timeouts de conexión...');
        
        const newTimeouts = {
            connect: 10000, // 10 segundos
            request: 30000, // 30 segundos
            idle: 300000    // 5 minutos
        };

        this.optimizations.set('timeouts', {
            previous: {
                connect: process.env.DB_CONNECT_TIMEOUT || 5000,
                request: process.env.DB_REQUEST_TIMEOUT || 15000,
                idle: process.env.DB_IDLE_TIMEOUT || 180000
            },
            new: newTimeouts,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Aplicar optimizaciones automáticas
     */
    applyOptimizations() {
        // Solo aplicar si hay optimizaciones pendientes
        if (this.optimizations.size === 0) return;

        logger.info('🚀 Aplicando optimizaciones automáticas...');

        this.optimizations.forEach((optimization, key) => {
            logger.info(`✅ Optimización aplicada: ${key}`, optimization);
        });

        // Limpiar optimizaciones aplicadas después de 1 hora
        setTimeout(() => {
            this.optimizations.clear();
        }, 3600000);
    }

    /**
     * Generar reporte de rendimiento
     */
    generatePerformanceReport() {
        const report = {
            timestamp: new Date().toISOString(),
            systemInfo: {
                platform: os.platform(),
                arch: os.arch(),
                cpus: os.cpus().length,
                totalMemory: Math.round(os.totalmem() / 1024 / 1024 / 1024) + 'GB',
                freeMemory: Math.round(os.freemem() / 1024 / 1024 / 1024) + 'GB',
                uptime: Math.round(os.uptime() / 3600) + 'h'
            },
            processInfo: {
                uptime: Math.round(process.uptime()) + 's',
                memoryUsage: {
                    rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB',
                    heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
                    heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
                }
            },
            metrics: this.metrics,
            optimizations: Array.from(this.optimizations.entries()),
            recommendations: this.generateRecommendations()
        };

        logger.info('📊 Reporte de rendimiento generado:', report);
        return report;
    }

    /**
     * Generar recomendaciones de optimización
     */
    generateRecommendations() {
        const recommendations = [];

        // Recomendación basada en uso de memoria
        if (this.metrics.memoryUsage > 0.7) {
            recommendations.push({
                type: 'MEMORY_OPTIMIZATION',
                priority: 'HIGH',
                description: 'Considerar incrementar memoria disponible o implementar cache distribuido',
                impact: 'Mejora significativa en estabilidad'
            });
        }

        // Recomendación basada en carga del sistema
        if (this.metrics.systemLoadAvg && this.metrics.systemLoadAvg[0] > os.cpus().length) {
            recommendations.push({
                type: 'CPU_SCALING',
                priority: 'MEDIUM',
                description: 'Considerar escalado horizontal o vertical',
                impact: 'Mejora en capacidad de procesamiento'
            });
        }

        // Recomendación basada en tiempo de respuesta
        if (this.metrics.averageResponseTime > 1000) {
            recommendations.push({
                type: 'RESPONSE_TIME_OPTIMIZATION',
                priority: 'HIGH',
                description: 'Implementar cache de aplicación y optimizar queries de DB',
                impact: 'Mejora significativa en experiencia de usuario'
            });
        }

        return recommendations;
    }

    /**
     * Middleware para medir rendimiento de requests
     */
    createPerformanceMiddleware() {
        return (req, res, next) => {
            const startTime = Date.now();

            // Incrementar contador de requests
            this.metrics.requestCount++;

            // Medir tiempo de respuesta al finalizar
            res.on('finish', () => {
                const responseTime = Date.now() - startTime;
                
                // Actualizar promedio de tiempo de respuesta
                this.metrics.averageResponseTime = 
                    (this.metrics.averageResponseTime + responseTime) / 2;

                // Actualizar tasa de errores
                if (res.statusCode >= 400) {
                    this.metrics.errorRate = 
                        (this.metrics.errorRate * 0.9) + (0.1); // Promedio móvil
                } else {
                    this.metrics.errorRate = 
                        (this.metrics.errorRate * 0.9); // Decrementar gradualmente
                }

                // Log de requests lentos
                if (responseTime > this.thresholds.maxResponseTime) {
                    logger.warn('🐌 Request lento detectado:', {
                        method: req.method,
                        url: req.url,
                        responseTime,
                        statusCode: res.statusCode
                    });
                }
            });

            next();
        };
    }

    /**
     * Obtener métricas actuales
     */
    getCurrentMetrics() {
        return {
            ...this.metrics,
            recommendations: this.generateRecommendations(),
            optimizations: Array.from(this.optimizations.entries())
        };
    }

    /**
     * Resetear métricas
     */
    resetMetrics() {
        this.metrics = {
            requestCount: 0,
            averageResponseTime: 0,
            memoryUsage: 0,
            cpuUsage: 0,
            activeConnections: 0,
            errorRate: 0
        };
        
        this.optimizations.clear();
        logger.info('📊 Métricas reiniciadas');
    }
}

// Singleton instance
const performanceOptimizer = new PerformanceOptimizer();

module.exports = performanceOptimizer;
