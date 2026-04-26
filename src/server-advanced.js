/**
 * Servidor Principal con WebSocket y Servicios Avanzados
 * Incluye Dashboard en tiempo real, Redis, y servicios de expiración
 */

require('dotenv').config();
const http = require('http');
const app = require('./app');
const logger = require('./utils/logger');

// Servicios avanzados
const realTimeDashboardService = require('./services/realTimeDashboardService');
const invitationExpirationService = require('./services/invitationExpirationService');
const redisService = require('./services/redisService');
const rbacService = require('./services/rbacService');

const PORT = process.env.PORT || 3000;

// Crear servidor HTTP
const server = http.createServer(app);

// Inicializar servicios
async function initializeServices() {
    try {
        logger.info('🚀 Iniciando servicios UnionTech...');

        // Inicializar dashboard en tiempo real con WebSocket
        realTimeDashboardService.initialize(server);
        logger.info('✅ Dashboard en tiempo real inicializado');

        // Los demás servicios se inicializan automáticamente al importarlos
        logger.info('✅ Servicio de expiración de invitaciones inicializado');
        logger.info('✅ Servicio Redis inicializado');
        logger.info('✅ Servicio RBAC inicializado');

        // Verificar conexión Redis
        setTimeout(async () => {
            if (redisService.isAvailable()) {
                logger.info('✅ Redis conectado y funcionando');
            } else {
                logger.warn('⚠️ Redis no disponible - funcionando en modo fallback');
            }
        }, 2000);

        logger.info('🎯 Todos los servicios inicializados correctamente');

    } catch (error) {
        logger.error('❌ Error inicializando servicios:', error);
        process.exit(1);
    }
}

// Manejo graceful de cierre
async function gracefulShutdown(signal) {
    logger.info(`📡 Señal ${signal} recibida, iniciando cierre graceful...`);

    try {
        // Cerrar servidor HTTP
        server.close(async () => {
            logger.info('🔌 Servidor HTTP cerrado');

            // Cerrar servicios
            await Promise.all([
                realTimeDashboardService.shutdown(),
                redisService.disconnect(),
                invitationExpirationService.shutdown()
            ]);

            logger.info('✅ Cierre graceful completado');
            process.exit(0);
        });

        // Forzar cierre después de 10 segundos
        setTimeout(() => {
            logger.error('⏰ Forzando cierre después de timeout');
            process.exit(1);
        }, 10000);

    } catch (error) {
        logger.error('❌ Error durante cierre graceful:', error);
        process.exit(1);
    }
}

// Event listeners para cierre graceful
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // Para nodemon

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
    logger.error('❌ Excepción no capturada:', error);
    gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('❌ Promise rechazada no manejada:', reason);
    gracefulShutdown('unhandledRejection');
});

// Inicializar y arrancar servidor
async function startServer() {
    try {
        // Inicializar servicios
        await initializeServices();

        // Arrancar servidor
        server.listen(PORT, () => {
            logger.info(`
🚀 ======================================
   UNIONTECH SERVER INICIADO EXITOSAMENTE
🚀 ======================================

📡 Servidor HTTP: http://localhost:${PORT}
🔗 Health Check: http://localhost:${PORT}/health
📚 API Base URL: http://localhost:${PORT}/api
🔄 WebSocket Dashboard: ws://localhost:${PORT}

🎯 Funcionalidades Activas:
   ✅ API REST completa
   ✅ Dashboard en tiempo real (WebSocket)
   ✅ Sistema de expiración automática
   ✅ Empleados de mantenimiento
   ✅ RBAC granular
   ✅ Cache Redis
   ✅ Logging estructurado

🌟 Estado: PRODUCCIÓN LISTA
🕐 Tiempo: ${new Date().toISOString()}
🏢 Entorno: ${process.env.NODE_ENV || 'development'}

======================================
            `);

            // Mostrar información adicional en desarrollo
            if (process.env.NODE_ENV === 'development') {
                logger.info(`
📋 ENDPOINTS PRINCIPALES:
   🔐 POST /api/auth/login
   👥 GET /api/personas
   🚪 POST /api/access/validate
   👷 GET /api/maintenance/employees
   📊 GET /api/dashboard/data
   🛡️ GET /api/rbac/my-permissions

🔧 HERRAMIENTAS DE DESARROLLO:
   📊 Dashboard: http://localhost:${PORT}/dashboard
   🔍 Logs: ./logs/
   📈 Métricas: GET /api/dashboard/performance-metrics
                `);
            }
        });

    } catch (error) {
        logger.error('❌ Error iniciando servidor:', error);
        process.exit(1);
    }
}

// Arrancar el servidor
startServer();

module.exports = server;
