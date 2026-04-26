/**
 * Servicio Redis Simplificado para Desarrollo
 * Fallback a memoria cuando Redis no está disponible
 */

const logger = require('../utils/logger');

// Cache en memoria como fallback
const memoryCache = new Map();

class RedisService {
    constructor() {
        this.isConnected = false;
        this.useMemoryFallback = true;
        this.maxReconnectAttempts = 5;
        this.reconnectAttempts = 0;
        this.client = null;
        logger.info('🔴 Redis Service iniciado en modo fallback (memoria)');
    }

    async connect() {
        try {
            // Intentar conectar a Redis si está disponible
            // Por ahora usar fallback de memoria
            this.isConnected = false;
            this.useMemoryFallback = true;
            logger.info('⚠️ Usando cache en memoria (Redis no disponible)');
            return true;
        } catch (error) {
            logger.warn('Redis no disponible, usando cache en memoria:', error.message);
            this.useMemoryFallback = true;
            return false;
        }
    }

    async set(key, value, ttl = 3600) {
        try {
            if (this.useMemoryFallback) {
                memoryCache.set(key, {
                    value: JSON.stringify(value),
                    expires: Date.now() + (ttl * 1000)
                });
                return true;
            }
        } catch (error) {
            logger.error('Error setting cache:', error);
            return false;
        }
    }

    async get(key) {
        try {
            if (this.useMemoryFallback) {
                const item = memoryCache.get(key);
                if (item) {
                    if (Date.now() > item.expires) {
                        memoryCache.delete(key);
                        return null;
                    }
                    return JSON.parse(item.value);
                }
                return null;
            }
        } catch (error) {
            logger.error('Error getting cache:', error);
            return null;
        }
    }

    async del(key) {
        try {
            if (this.useMemoryFallback) {
                memoryCache.delete(key);
                return true;
            }
        } catch (error) {
            logger.error('Error deleting cache:', error);
            return false;
        }
    }

    async setUserSession(userId, sessionData, ttl = 3600) {
        const key = `session:${userId}`;
        return await this.set(key, sessionData, ttl);
    }

    async getUserSession(userId) {
        const key = `session:${userId}`;
        return await this.get(key);
    }

    async deleteUserSession(userId) {
        const key = `session:${userId}`;
        return await this.del(key);
    }

    async checkRateLimit(identifier, limit = 100, window = 3600) {
        try {
            const key = `rate_limit:${identifier}`;
            const current = await this.get(key) || 0;
            
            if (current >= limit) {
                return {
                    allowed: false,
                    remaining: 0,
                    resetTime: Date.now() + (window * 1000)
                };
            }

            await this.set(key, current + 1, window);
            
            return {
                allowed: true,
                remaining: limit - current - 1,
                resetTime: Date.now() + (window * 1000)
            };
        } catch (error) {
            logger.error('Error checking rate limit:', error);
            return { allowed: true, remaining: limit - 1 };
        }
    }

    async disconnect() {
        if (this.useMemoryFallback) {
            memoryCache.clear();
            logger.info('🔴 Cache en memoria limpiado');
        }
    }

// Métodos de información
async getStats() {
    return {
        connected: this.isConnected,
        mode: this.useMemoryFallback ? 'memory' : 'redis',
        cacheSize: memoryCache.size
    };
}

async initializeRedis() {
    try {
        const redis = require('redis');
        const redisConfig = {
                host: process.env.REDIS_HOST || 'localhost',
                port: process.env.REDIS_PORT || 6379,
                password: process.env.REDIS_PASSWORD || undefined,
                db: process.env.REDIS_DB || 0,
                retryDelayOnFailover: 100,
                enableReadyCheck: true,
                maxRetriesPerRequest: 3,
                lazyConnect: true
            };

            this.client = redis.createClient(redisConfig);

            // Event handlers
            this.client.on('connect', () => {
                logger.info('🔴 Conectando a Redis...');
            });

            this.client.on('ready', () => {
                this.isConnected = true;
                this.reconnectAttempts = 0;
                logger.info('✅ Redis conectado y listo');
            });

            this.client.on('error', (error) => {
                this.isConnected = false;
                logger.error('❌ Error en Redis:', error.message);
                this.handleReconnection();
            });

            this.client.on('end', () => {
                this.isConnected = false;
                logger.warn('🔌 Conexión Redis terminada');
            });

            // Conectar
            await this.client.connect();

            // Test connection
            await this.client.ping();
            logger.info('🔴 Redis inicializado correctamente');

        } catch (error) {
            logger.error('❌ Error inicializando Redis:', error);
            this.handleFallback();
        }
    }

    /**
     * Maneja la reconexión automática
     */
    async handleReconnection() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            logger.error('🔴 Máximo número de intentos de reconexión alcanzado');
            this.handleFallback();
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff

        logger.info(`🔄 Reintentando conexión Redis en ${delay}ms (intento ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        setTimeout(async () => {
            try {
                await this.initializeRedis();
            } catch (error) {
                logger.error('Error en reconexión:', error);
            }
        }, delay);
    }

    /**
     * Maneja el modo fallback (sin Redis)
     */
    handleFallback() {
        logger.warn('🚨 Redis no disponible, funcionando en modo fallback (sin cache)');
        this.isConnected = false;
        this.client = null;
    }

    /**
     * Verifica si Redis está disponible
     */
    isAvailable() {
        return this.isConnected && this.client;
    }

    // ===== OPERACIONES DE SESIÓN =====

    /**
     * Almacena sesión de usuario
     */
    async setUserSession(userId, sessionData, ttl = 86400) { // 24 horas por defecto
        try {
            if (!this.isAvailable()) return false;

            const sessionKey = `session:user:${userId}`;
            const sessionString = JSON.stringify({
                ...sessionData,
                createdAt: new Date().toISOString(),
                lastActivity: new Date().toISOString()
            });

            await this.client.setEx(sessionKey, ttl, sessionString);
            logger.debug(`📝 Sesión almacenada para usuario ${userId}`);
            return true;

        } catch (error) {
            logger.error('Error almacenando sesión:', error);
            return false;
        }
    }

    /**
     * Obtiene sesión de usuario
     */
    async getUserSession(userId) {
        try {
            if (!this.isAvailable()) return null;

            const sessionKey = `session:user:${userId}`;
            const sessionString = await this.client.get(sessionKey);
            
            if (!sessionString) return null;

            const sessionData = JSON.parse(sessionString);
            
            // Actualizar última actividad
            sessionData.lastActivity = new Date().toISOString();
            await this.client.setEx(sessionKey, 86400, JSON.stringify(sessionData));

            return sessionData;

        } catch (error) {
            logger.error('Error obteniendo sesión:', error);
            return null;
        }
    }

    /**
     * Elimina sesión de usuario
     */
    async deleteUserSession(userId) {
        try {
            if (!this.isAvailable()) return false;

            const sessionKey = `session:user:${userId}`;
            await this.client.del(sessionKey);
            logger.debug(`🗑️ Sesión eliminada para usuario ${userId}`);
            return true;

        } catch (error) {
            logger.error('Error eliminando sesión:', error);
            return false;
        }
    }

    /**
     * Obtiene todas las sesiones activas
     */
    async getActiveSessions() {
        try {
            if (!this.isAvailable()) return [];

            const sessionKeys = await this.client.keys('session:user:*');
            const sessions = [];

            for (const key of sessionKeys) {
                const sessionString = await this.client.get(key);
                if (sessionString) {
                    const userId = key.split(':')[2];
                    const sessionData = JSON.parse(sessionString);
                    sessions.push({
                        userId,
                        ...sessionData
                    });
                }
            }

            return sessions;

        } catch (error) {
            logger.error('Error obteniendo sesiones activas:', error);
            return [];
        }
    }

    // ===== OPERACIONES DE CACHE =====

    /**
     * Almacena datos en cache
     */
    async set(key, data, ttl = null) {
        try {
            if (!this.isAvailable()) return false;

            const dataString = JSON.stringify(data);
            
            if (ttl) {
                await this.client.setEx(key, ttl, dataString);
            } else {
                await this.client.set(key, dataString);
            }

            logger.debug(`💾 Cache almacenado: ${key}`);
            return true;

        } catch (error) {
            logger.error(`Error almacenando en cache (${key}):`, error);
            return false;
        }
    }

    /**
     * Obtiene datos del cache
     */
    async get(key) {
        try {
            if (!this.isAvailable()) return null;

            const dataString = await this.client.get(key);
            if (!dataString) return null;

            return JSON.parse(dataString);

        } catch (error) {
            logger.error(`Error obteniendo del cache (${key}):`, error);
            return null;
        }
    }

    /**
     * Elimina datos del cache
     */
    async del(key) {
        try {
            if (!this.isAvailable()) return false;

            await this.client.del(key);
            logger.debug(`🗑️ Cache eliminado: ${key}`);
            return true;

        } catch (error) {
            logger.error(`Error eliminando del cache (${key}):`, error);
            return false;
        }
    }

    /**
     * Verifica si existe una clave en el cache
     */
    async exists(key) {
        try {
            if (!this.isAvailable()) return false;

            const result = await this.client.exists(key);
            return result === 1;

        } catch (error) {
            logger.error(`Error verificando existencia (${key}):`, error);
            return false;
        }
    }

    // ===== OPERACIONES ESPECÍFICAS DEL SISTEMA =====

    /**
     * Cache de invitaciones activas
     */
    async cacheActiveInvitations(invitations) {
        const key = 'invitations:active';
        return await this.set(key, invitations, 300); // 5 minutos
    }

    async getActiveInvitations() {
        const key = 'invitations:active';
        return await this.get(key);
    }

    /**
     * Cache de empleados de mantenimiento activos
     */
    async cacheMaintenanceEmployees(employees) {
        const key = 'maintenance:employees:active';
        return await this.set(key, employees, 600); // 10 minutos
    }

    async getMaintenanceEmployees() {
        const key = 'maintenance:employees:active';
        return await this.get(key);
    }

    /**
     * Cache de estadísticas del dashboard
     */
    async cacheDashboardStats(stats) {
        const key = 'dashboard:stats';
        return await this.set(key, stats, 180); // 3 minutos
    }

    async getDashboardStats() {
        const key = 'dashboard:stats';
        return await this.get(key);
    }

    /**
     * Cache de configuración del sistema
     */
    async cacheSystemConfig(config) {
        const key = 'system:config';
        return await this.set(key, config, 3600); // 1 hora
    }

    async getSystemConfig() {
        const key = 'system:config';
        return await this.get(key);
    }

    // ===== RATE LIMITING =====

    /**
     * Implementa rate limiting
     */
    async checkRateLimit(identifier, maxRequests = 100, windowSeconds = 3600) {
        try {
            if (!this.isAvailable()) return { allowed: true, remaining: maxRequests };

            const key = `ratelimit:${identifier}`;
            const current = await this.client.incr(key);

            if (current === 1) {
                await this.client.expire(key, windowSeconds);
            }

            const remaining = Math.max(0, maxRequests - current);
            const allowed = current <= maxRequests;

            return {
                allowed,
                remaining,
                current,
                resetTime: new Date(Date.now() + windowSeconds * 1000)
            };

        } catch (error) {
            logger.error('Error en rate limiting:', error);
            return { allowed: true, remaining: maxRequests }; // Fallback permisivo
        }
    }

    // ===== OPERACIONES DE LISTA =====

    /**
     * Añade elemento a una lista
     */
    async listPush(key, value, maxLength = null) {
        try {
            if (!this.isAvailable()) return false;

            await this.client.lPush(key, JSON.stringify(value));
            
            if (maxLength) {
                await this.client.lTrim(key, 0, maxLength - 1);
            }

            return true;

        } catch (error) {
            logger.error(`Error añadiendo a lista (${key}):`, error);
            return false;
        }
    }

    /**
     * Obtiene elementos de una lista
     */
    async listRange(key, start = 0, end = -1) {
        try {
            if (!this.isAvailable()) return [];

            const items = await this.client.lRange(key, start, end);
            return items.map(item => JSON.parse(item));

        } catch (error) {
            logger.error(`Error obteniendo lista (${key}):`, error);
            return [];
        }
    }

    // ===== OPERACIONES DE SET =====

    /**
     * Añade elementos a un conjunto
     */
    async setAdd(key, ...values) {
        try {
            if (!this.isAvailable()) return false;

            await this.client.sAdd(key, ...values);
            return true;

        } catch (error) {
            logger.error(`Error añadiendo a conjunto (${key}):`, error);
            return false;
        }
    }

    /**
     * Verifica si un elemento está en el conjunto
     */
    async setIsMember(key, value) {
        try {
            if (!this.isAvailable()) return false;

            const result = await this.client.sIsMember(key, value);
            return result;

        } catch (error) {
            logger.error(`Error verificando membresía (${key}):`, error);
            return false;
        }
    }

    // ===== UTILIDADES =====

    /**
     * Obtiene información del servidor Redis
     */
    async getServerInfo() {
        try {
            if (!this.isAvailable()) {
                return {
                    connected: false,
                    message: 'Redis no disponible'
                };
            }

            const info = await this.client.info();
            const memory = await this.client.info('memory');
            
            return {
                connected: true,
                info,
                memory,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            logger.error('Error obteniendo info del servidor:', error);
            return {
                connected: false,
                error: error.message
            };
        }
    }

    /**
     * Limpia cache por patrón
     */
    async clearPattern(pattern) {
        try {
            if (!this.isAvailable()) return 0;

            const keys = await this.client.keys(pattern);
            if (keys.length === 0) return 0;

            await this.client.del(keys);
            logger.info(`🧹 ${keys.length} claves eliminadas con patrón: ${pattern}`);
            return keys.length;

        } catch (error) {
            logger.error(`Error limpiando patrón (${pattern}):`, error);
            return 0;
        }
    }

    /**
     * Obtiene estadísticas del cache
     */
    async getCacheStats() {
        try {
            if (!this.isAvailable()) {
                return {
                    available: false,
                    message: 'Redis no disponible'
                };
            }

            const info = await this.client.info('stats');
            const keyspace = await this.client.info('keyspace');
            
            // Contar claves por tipo
            const sessionKeys = await this.client.keys('session:*');
            const cacheKeys = await this.client.keys('cache:*');
            const rateLimitKeys = await this.client.keys('ratelimit:*');

            return {
                available: true,
                connected: this.isConnected,
                stats: {
                    totalKeys: sessionKeys.length + cacheKeys.length + rateLimitKeys.length,
                    sessionKeys: sessionKeys.length,
                    cacheKeys: cacheKeys.length,
                    rateLimitKeys: rateLimitKeys.length
                },
                serverInfo: info,
                keyspace,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            logger.error('Error obteniendo estadísticas:', error);
            return {
                available: false,
                error: error.message
            };
        }
    }

    /**
     * Cierra la conexión Redis
     */
    async disconnect() {
        try {
            if (this.client) {
                await this.client.quit();
                logger.info('🔌 Redis desconectado correctamente');
            }
        } catch (error) {
            logger.error('Error desconectando Redis:', error);
        }
    }
}

// Exportar instancia única (singleton)
module.exports = new RedisService();
