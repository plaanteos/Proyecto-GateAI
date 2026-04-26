/**
 * Configuración de desarrollo temporal
 * Desactiva servicios complejos para depuración
 */

const devConfig = {
    // Servicios habilitados/deshabilitados
    services: {
        redis: false,           // Desactivar Redis temporalmente
        rbac: false,           // Desactivar RBAC complejo temporalmente
        websockets: false,     // Desactivar WebSockets temporalmente
        database: false        // Usar solo datos mock
    },
    
    // Configuración de puertos
    server: {
        port: 3001,
        corsOrigin: 'http://localhost:8080'
    },
    
    // Modo de desarrollo
    development: {
        useMouseData: true,     // Usar datos mock
        skipMigrations: true,   // Saltar migraciones
        allowUnsecure: true     // Permitir conexiones no seguras
    }
};

module.exports = devConfig;
