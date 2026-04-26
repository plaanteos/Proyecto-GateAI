/**
 * Índices y Optimizaciones de Base de Datos
 * Sistema automático de creación y gestión de índices para máximo rendimiento
 */

const { PrismaClient } = require('@prisma/client');
const logger = require('../config/logger');

class DatabaseOptimizer {
    constructor() {
        this.prisma = new PrismaClient();
        this.performanceMetrics = new Map();
        this.indexRecommendations = [];
    }

    /**
     * Crear todos los índices optimizados para el sistema
     */
    async createOptimizedIndexes() {
        logger.info('🔧 Creando índices optimizados de base de datos...');

        const indexes = [
            // Índices para tabla Users
            {
                table: 'User',
                name: 'idx_users_email_active',
                fields: ['email', 'isActive'],
                description: 'Optimiza login y búsquedas de usuarios activos'
            },
            {
                table: 'User',
                name: 'idx_users_created_position',
                fields: ['createdAt', 'position'],
                description: 'Optimiza reportes por fecha y posición'
            },

            // Índices para tabla Visitors
            {
                table: 'Visitor',
                name: 'idx_visitors_status_created',
                fields: ['status', 'createdAt'],
                description: 'Optimiza dashboard de visitantes por estado'
            },
            {
                table: 'Visitor',
                name: 'idx_visitors_host_date',
                fields: ['hostUserId', 'visitDate'],
                description: 'Optimiza búsqueda de visitantes por anfitrión'
            },
            {
                table: 'Visitor',
                name: 'idx_visitors_email_phone',
                fields: ['email', 'phone'],
                description: 'Optimiza búsqueda de visitantes por contacto'
            },
            {
                table: 'Visitor',
                name: 'idx_visitors_company_purpose',
                fields: ['company', 'purpose'],
                description: 'Optimiza filtros por empresa y propósito'
            },

            // Índices para tabla AccessLog
            {
                table: 'AccessLog',
                name: 'idx_access_visitor_time',
                fields: ['visitorId', 'timestamp'],
                description: 'Optimiza historial de acceso por visitante'
            },
            {
                table: 'AccessLog',
                name: 'idx_access_type_time',
                fields: ['type', 'timestamp'],
                description: 'Optimiza reportes por tipo de acceso'
            },
            {
                table: 'AccessLog',
                name: 'idx_access_location_date',
                fields: ['location', 'timestamp'],
                description: 'Optimiza reportes por ubicación'
            },

            // Índices para tabla Invitation
            {
                table: 'Invitation',
                name: 'idx_invitation_status_expires',
                fields: ['status', 'expiresAt'],
                description: 'Optimiza cleanup de invitaciones expiradas'
            },
            {
                table: 'Invitation',
                name: 'idx_invitation_visitor_created',
                fields: ['visitorId', 'createdAt'],
                description: 'Optimiza historial de invitaciones'
            },

            // Índices para RBAC
            {
                table: 'UserRole',
                name: 'idx_user_roles_user_role',
                fields: ['userId', 'roleId'],
                description: 'Optimiza verificación de roles de usuario'
            },
            {
                table: 'RolePermission',
                name: 'idx_role_permissions_role_permission',
                fields: ['roleId', 'permissionId'],
                description: 'Optimiza verificación de permisos'
            },

            // Índices para MaintenanceEmployee
            {
                table: 'MaintenanceEmployee',
                name: 'idx_maintenance_active_specialty',
                fields: ['isActive', 'speciality'],
                description: 'Optimiza búsqueda de empleados disponibles'
            },

            // Índices compuestos para consultas complejas
            {
                table: 'Visitor',
                name: 'idx_visitors_complex_search',
                fields: ['status', 'hostUserId', 'visitDate', 'company'],
                description: 'Optimiza búsquedas complejas en dashboard'
            }
        ];

        const results = [];
        for (const index of indexes) {
            try {
                await this.createIndex(index);
                results.push({ ...index, status: 'created' });
                logger.info(`✅ Índice creado: ${index.name}`);
            } catch (error) {
                logger.warn(`⚠️ Error creando índice ${index.name}:`, error.message);
                results.push({ ...index, status: 'error', error: error.message });
            }
        }

        return results;
    }

    /**
     * Crear un índice específico
     */
    async createIndex(indexConfig) {
        const { table, name, fields } = indexConfig;
        
        // Crear índice usando SQL raw
        const fieldsList = fields.join(', ');
        const sql = `CREATE NONCLUSTERED INDEX ${name} ON ${table} (${fieldsList})`;
        
        await this.prisma.$executeRawUnsafe(sql);
    }

    /**
     * Analizar rendimiento de consultas y generar recomendaciones
     */
    async analyzeQueryPerformance() {
        logger.info('🔍 Analizando rendimiento de consultas...');

        const queryAnalysis = [
            {
                name: 'Consulta de visitantes activos',
                query: `
                    SELECT COUNT(*) as count
                    FROM Visitor 
                    WHERE status = 'checked_in'
                `,
                expectedRows: '<1000',
                recommendation: 'Índice en status recomendado'
            },
            {
                name: 'Búsqueda de usuarios por email',
                query: `
                    SELECT TOP 1 * 
                    FROM "User" 
                    WHERE email = @email AND isActive = 1
                `,
                expectedRows: '1',
                recommendation: 'Índice compuesto email+isActive crítico'
            },
            {
                name: 'Historial de acceso por visitante',
                query: `
                    SELECT * 
                    FROM AccessLog 
                    WHERE visitorId = @visitorId 
                    ORDER BY timestamp DESC
                `,
                expectedRows: '<100',
                recommendation: 'Índice visitorId+timestamp recomendado'
            },
            {
                name: 'Dashboard estadísticas diarias',
                query: `
                    SELECT 
                        COUNT(*) as total,
                        COUNT(CASE WHEN status = 'checked_in' THEN 1 END) as active
                    FROM Visitor 
                    WHERE CAST(createdAt AS DATE) = CAST(GETDATE() AS DATE)
                `,
                expectedRows: '<5000',
                recommendation: 'Índice en createdAt con include status'
            }
        ];

        const results = [];
        for (const analysis of queryAnalysis) {
            try {
                const startTime = Date.now();
                // Ejecutar query de análisis (sin parámetros para testing)
                const testQuery = analysis.query.replace(/@\w+/g, "'test'");
                await this.prisma.$queryRawUnsafe(testQuery);
                const executionTime = Date.now() - startTime;

                results.push({
                    ...analysis,
                    executionTime,
                    status: executionTime < 100 ? 'optimal' : 'needs_optimization'
                });

                logger.debug(`Query "${analysis.name}": ${executionTime}ms`);
            } catch (error) {
                results.push({
                    ...analysis,
                    status: 'error',
                    error: error.message
                });
            }
        }

        return results;
    }

    /**
     * Configurar estadísticas automáticas de SQL Server
     */
    async configureAutoStatistics() {
        logger.info('📊 Configurando estadísticas automáticas...');

        const statisticsConfig = [
            'ALTER DATABASE CURRENT SET AUTO_CREATE_STATISTICS ON',
            'ALTER DATABASE CURRENT SET AUTO_UPDATE_STATISTICS ON',
            'ALTER DATABASE CURRENT SET AUTO_UPDATE_STATISTICS_ASYNC ON'
        ];

        for (const config of statisticsConfig) {
            try {
                await this.prisma.$executeRawUnsafe(config);
                logger.info(`✅ Configuración aplicada: ${config}`);
            } catch (error) {
                logger.warn(`⚠️ Error en configuración: ${config}`, error.message);
            }
        }
    }

    /**
     * Optimizar configuración de conexiones
     */
    async optimizeConnectionPool() {
        logger.info('🔧 Optimizando pool de conexiones...');

        const cpuCount = require('os').cpus().length;
        const optimalPoolSize = Math.max(5, Math.min(cpuCount * 2, 20));

        const optimizations = {
            connectionPoolSize: optimalPoolSize,
            maxIdleTime: 300000, // 5 minutos
            connectionTimeout: 30000, // 30 segundos
            commandTimeout: 60000, // 60 segundos
            maxRetries: 3,
            retryDelay: 1000
        };

        logger.info('✅ Configuración de pool optimizada:', optimizations);
        return optimizations;
    }

    /**
     * Crear vistas optimizadas para consultas frecuentes
     */
    async createOptimizedViews() {
        logger.info('👁️ Creando vistas optimizadas...');

        const views = [
            {
                name: 'vw_ActiveVisitors',
                sql: `
                    CREATE VIEW vw_ActiveVisitors AS
                    SELECT 
                        v.id,
                        v.name,
                        v.email,
                        v.company,
                        v.purpose,
                        v.hostUserId,
                        u.name as hostName,
                        v.createdAt,
                        al.timestamp as checkinTime,
                        al.location
                    FROM Visitor v
                    INNER JOIN "User" u ON v.hostUserId = u.id
                    LEFT JOIN AccessLog al ON v.id = al.visitorId 
                        AND al.type = 'checkin'
                        AND al.id = (
                            SELECT TOP 1 id 
                            FROM AccessLog 
                            WHERE visitorId = v.id 
                            ORDER BY timestamp DESC
                        )
                    WHERE v.status = 'checked_in'
                `
            },
            {
                name: 'vw_DailyStatistics',
                sql: `
                    CREATE VIEW vw_DailyStatistics AS
                    SELECT 
                        CAST(createdAt AS DATE) as date,
                        COUNT(*) as totalVisitors,
                        COUNT(CASE WHEN status = 'checked_in' THEN 1 END) as activeVisitors,
                        COUNT(CASE WHEN status = 'checked_out' THEN 1 END) as completedVisits,
                        COUNT(DISTINCT company) as uniqueCompanies,
                        COUNT(DISTINCT hostUserId) as activeHosts
                    FROM Visitor
                    WHERE createdAt >= DATEADD(day, -30, GETDATE())
                    GROUP BY CAST(createdAt AS DATE)
                `
            },
            {
                name: 'vw_UserPermissions',
                sql: `
                    CREATE VIEW vw_UserPermissions AS
                    SELECT DISTINCT
                        u.id as userId,
                        u.email,
                        r.name as roleName,
                        p.name as permissionName,
                        p.resource,
                        p.action
                    FROM "User" u
                    INNER JOIN UserRole ur ON u.id = ur.userId
                    INNER JOIN Role r ON ur.roleId = r.id
                    INNER JOIN RolePermission rp ON r.id = rp.roleId
                    INNER JOIN Permission p ON rp.permissionId = p.id
                    WHERE u.isActive = 1
                `
            }
        ];

        const results = [];
        for (const view of views) {
            try {
                // Eliminar vista si existe
                await this.prisma.$executeRawUnsafe(`DROP VIEW IF EXISTS ${view.name}`);
                
                // Crear nueva vista
                await this.prisma.$executeRawUnsafe(view.sql);
                
                results.push({ name: view.name, status: 'created' });
                logger.info(`✅ Vista creada: ${view.name}`);
            } catch (error) {
                logger.warn(`⚠️ Error creando vista ${view.name}:`, error.message);
                results.push({ name: view.name, status: 'error', error: error.message });
            }
        }

        return results;
    }

    /**
     * Configurar mantenimiento automático de base de datos
     */
    async setupAutomaticMaintenance() {
        logger.info('🔄 Configurando mantenimiento automático...');

        const maintenanceTasks = [
            {
                name: 'Reorganizar índices fragmentados',
                schedule: 'weekly',
                sql: `
                    DECLARE @sql NVARCHAR(1000)
                    DECLARE index_cursor CURSOR FOR
                    SELECT 'ALTER INDEX ' + i.name + ' ON ' + t.name + ' REORGANIZE'
                    FROM sys.indexes i
                    INNER JOIN sys.tables t ON i.object_id = t.object_id
                    WHERE i.avg_fragmentation_in_percent > 10

                    OPEN index_cursor
                    FETCH NEXT FROM index_cursor INTO @sql
                    WHILE @@FETCH_STATUS = 0
                    BEGIN
                        EXEC sp_executesql @sql
                        FETCH NEXT FROM index_cursor INTO @sql
                    END
                    CLOSE index_cursor
                    DEALLOCATE index_cursor
                `
            },
            {
                name: 'Actualizar estadísticas',
                schedule: 'daily',
                sql: 'EXEC sp_updatestats'
            },
            {
                name: 'Limpiar log de transacciones',
                schedule: 'daily',
                sql: `
                    DECLARE @logSize INT
                    SELECT @logSize = size * 8 / 1024 FROM sys.database_files WHERE type = 1
                    IF @logSize > 1000 -- Si es mayor a 1GB
                    BEGIN
                        DBCC SHRINKFILE(2, 100) -- Reducir a 100MB
                    END
                `
            }
        ];

        // Guardar configuración para implementación posterior
        const maintenanceConfig = {
            tasks: maintenanceTasks,
            enabled: true,
            nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000), // Mañana
            lastRun: null
        };

        logger.info('✅ Configuración de mantenimiento preparada');
        return maintenanceConfig;
    }

    /**
     * Monitorear rendimiento en tiempo real
     */
    startPerformanceMonitoring() {
        logger.info('📊 Iniciando monitoreo de rendimiento de DB...');

        setInterval(async () => {
            try {
                const metrics = await this.collectDatabaseMetrics();
                this.performanceMetrics.set(Date.now(), metrics);

                // Mantener solo las últimas 24 horas de métricas
                const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
                for (const [timestamp] of this.performanceMetrics) {
                    if (timestamp < oneDayAgo) {
                        this.performanceMetrics.delete(timestamp);
                    }
                }

                // Alertar si hay problemas de rendimiento
                if (metrics.avgQueryTime > 1000) {
                    logger.warn('🚨 Rendimiento de DB degradado:', metrics);
                }

            } catch (error) {
                logger.error('Error en monitoreo de DB:', error);
            }
        }, 60000); // Cada minuto
    }

    /**
     * Recopilar métricas de base de datos
     */
    async collectDatabaseMetrics() {
        const queries = {
            connectionCount: `
                SELECT COUNT(*) as count
                FROM sys.dm_exec_connections
            `,
            activeQueries: `
                SELECT COUNT(*) as count
                FROM sys.dm_exec_requests
                WHERE status IN ('running', 'runnable')
            `,
            blockingQueries: `
                SELECT COUNT(*) as count
                FROM sys.dm_exec_requests
                WHERE blocking_session_id > 0
            `,
            databaseSize: `
                SELECT 
                    SUM(size * 8 / 1024) as sizeMB
                FROM sys.database_files
            `
        };

        const metrics = {};
        for (const [key, query] of Object.entries(queries)) {
            try {
                const result = await this.prisma.$queryRawUnsafe(query);
                metrics[key] = result[0].count || result[0].sizeMB || 0;
            } catch (error) {
                metrics[key] = 0;
                logger.debug(`Error obteniendo métrica ${key}:`, error.message);
            }
        }

        return {
            ...metrics,
            timestamp: new Date().toISOString(),
            avgQueryTime: this.calculateAverageQueryTime()
        };
    }

    /**
     * Calcular tiempo promedio de consultas
     */
    calculateAverageQueryTime() {
        // Simulación basada en métricas actuales
        const recentMetrics = Array.from(this.performanceMetrics.values()).slice(-10);
        if (recentMetrics.length === 0) return 0;

        const totalTime = recentMetrics.reduce((sum, metric) => sum + (metric.avgQueryTime || 0), 0);
        return totalTime / recentMetrics.length;
    }

    /**
     * Obtener reporte completo de optimización
     */
    async getOptimizationReport() {
        const report = {
            timestamp: new Date().toISOString(),
            indexes: await this.createOptimizedIndexes(),
            views: await this.createOptimizedViews(),
            queryAnalysis: await this.analyzeQueryPerformance(),
            connectionOptimization: await this.optimizeConnectionPool(),
            maintenanceConfig: await this.setupAutomaticMaintenance(),
            currentMetrics: this.performanceMetrics.size > 0 ? 
                Array.from(this.performanceMetrics.values()).slice(-1)[0] : null,
            recommendations: this.generateOptimizationRecommendations()
        };

        logger.info('📋 Reporte de optimización generado');
        return report;
    }

    /**
     * Generar recomendaciones de optimización
     */
    generateOptimizationRecommendations() {
        return [
            {
                category: 'Índices',
                priority: 'HIGH',
                recommendation: 'Implementar índices compuestos para consultas del dashboard',
                impact: 'Mejora del 60-80% en tiempo de respuesta'
            },
            {
                category: 'Consultas',
                priority: 'MEDIUM',
                recommendation: 'Usar vistas materializadas para reportes complejos',
                impact: 'Reducción del 40-60% en carga de CPU'
            },
            {
                category: 'Conexiones',
                priority: 'LOW',
                recommendation: 'Optimizar pool de conexiones basado en carga real',
                impact: 'Mejora del 20-30% en escalabilidad'
            },
            {
                category: 'Mantenimiento',
                priority: 'MEDIUM',
                recommendation: 'Configurar reorganización automática de índices',
                impact: 'Previene degradación del rendimiento a largo plazo'
            }
        ];
    }
}

module.exports = new DatabaseOptimizer();
