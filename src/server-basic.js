/**
 * Servidor Básico de Prueba
 */

const http = require('http');
const PORT = 3002;

console.log('🚀 Iniciando servidor básico HTTP...');

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    
    const response = {
        message: '🎉 UnionTech Basic Server',
        timestamp: new Date().toISOString(),
        url: req.url,
        method: req.method,
        status: 'running'
    };
    
    res.end(JSON.stringify(response, null, 2));
});

server.listen(PORT, () => {
    console.log(`✅ Servidor básico funcionando en puerto ${PORT}`);
    console.log(`🔗 Test: http://localhost:${PORT}/`);
});

server.on('error', (error) => {
    console.error('❌ Error:', error);
});

console.log('📡 Esperando conexiones...');
