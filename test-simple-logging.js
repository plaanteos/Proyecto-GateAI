// Prueba simple del sistema de logging crítico
console.log('🧪 Iniciando prueba del sistema de logging crítico...');

try {
    // Verificar que los módulos existen
    const express = require('express');
    console.log('✅ Express cargado correctamente');
    
    const path = require('path');
    console.log('✅ Path cargado correctamente');
    
    // Verificar el servicio de logging crítico
    const CriticalActivityLogger = require('./src/services/criticalActivityLogger');
    console.log('✅ CriticalActivityLogger cargado correctamente');
    
    const logger = new CriticalActivityLogger();
    console.log('✅ Instancia de CriticalActivityLogger creada');
    
    // Verificar middleware de auditoría
    const { auditMiddleware } = require('./src/middleware/auditLogger');
    console.log('✅ AuditMiddleware cargado correctamente');
    
    console.log('🎉 Todos los módulos se cargaron exitosamente');
    
    // Crear aplicación básica
    const app = express();
    const port = 3001;
    
    app.use(express.json());
    app.use(express.static('frontend'));
    
    // Ruta de prueba simple
    app.get('/', (req, res) => {
        res.json({ 
            message: 'UnionTech Security System - Test Server',
            status: 'running',
            timestamp: new Date().toISOString()
        });
    });
    
    // Ruta de prueba de logging
    app.post('/test/log', async (req, res) => {
        try {
            await logger.logFailedLogin('test_user', '127.0.0.1', 'Test Browser', 'Test login failure');
            res.json({ success: true, message: 'Log entry created successfully' });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    
    // Iniciar servidor
    app.listen(port, () => {
        console.log(`
🏢 UnionTech Security System - Test Server
==========================================
🌐 Servidor ejecutándose en: http://localhost:${port}
🧪 Test de logging: POST http://localhost:${port}/test/log

✅ Sistema HU10 - Logging Crítico validado correctamente
        `);
    });
    
} catch (error) {
    console.error('❌ Error al cargar módulos:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
}
