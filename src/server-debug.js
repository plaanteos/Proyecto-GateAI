/**
 * Servidor de Debug UnionTech
 */

console.log('🚀 Iniciando servidor debug...');

const app = require('./app-debug');

const PORT = process.env.PORT || 3001;

console.log(`🔌 Intentando escuchar en puerto ${PORT}...`);

const server = app.listen(PORT, () => {
    console.log(`🎉 ¡Servidor Debug funcionando!`);
    console.log(`🚀 Servidor UnionTech Debug en puerto ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`📚 API Base URL: http://localhost:${PORT}/api`);
    console.log(`🧪 System info: http://localhost:${PORT}/api/system/info`);
});

server.on('error', (error) => {
    console.error('❌ Error del servidor:', error);
});

console.log('✅ Configuración del servidor completada');
