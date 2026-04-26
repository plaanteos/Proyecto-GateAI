/**
 * UnionTech MVP Frontend Server
 * Servidor optimizado para el MVP con todas las funcionalidades
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const FRONTEND_DIR = path.join(__dirname, 'frontend');

console.log('===================================');
console.log('🌐 UnionTech MVP Frontend Server');
console.log('===================================');
console.log(`📁 Sirviendo desde: ${FRONTEND_DIR}`);
console.log(`🌐 Puerto: ${PORT}`);

const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.json': 'application/json',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'font/otf'
};

const server = http.createServer((req, res) => {
    console.log(`📥 ${req.method} ${req.url}`);
    
    // CORS headers para desarrollo
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // Determinar el archivo a servir
    let filePath = req.url === '/' ? '/index-mvp.html' : req.url;
    
    // Limpiar query parameters
    if (filePath.includes('?')) {
        filePath = filePath.split('?')[0];
    }
    
    // Construir ruta completa
    filePath = path.join(FRONTEND_DIR, filePath);
    
    // Obtener extensión
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'text/plain';
    
    // Verificar si el archivo existe
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            // Archivo no encontrado - servir index para SPA routing
            if (ext === '' || ext === '.html') {
                const indexPath = path.join(FRONTEND_DIR, 'index-mvp.html');
                serveFile(indexPath, 'text/html; charset=utf-8', res);
            } else {
                // Recurso no encontrado
                console.log(`❌ Archivo no encontrado: ${filePath}`);
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>404 - No Encontrado</title>
                        <style>
                            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                            .error { color: #dc3545; }
                        </style>
                    </head>
                    <body>
                        <h1 class="error">404 - Recurso No Encontrado</h1>
                        <p>El archivo <code>${req.url}</code> no existe.</p>
                        <a href="/">Volver al inicio</a>
                    </body>
                    </html>
                `);
            }
            return;
        }
        
        // Archivo existe - servirlo
        serveFile(filePath, contentType, res);
    });
});

function serveFile(filePath, contentType, res) {
    fs.readFile(filePath, (err, content) => {
        if (err) {
            console.error(`❌ Error leyendo archivo ${filePath}:`, err);
            res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>500 - Error del Servidor</title>
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                        .error { color: #dc3545; }
                    </style>
                </head>
                <body>
                    <h1 class="error">500 - Error del Servidor</h1>
                    <p>Error interno del servidor.</p>
                    <a href="/">Volver al inicio</a>
                </body>
                </html>
            `);
            return;
        }
        
        // Configurar headers de cache para recursos estáticos
        const ext = path.extname(filePath).toLowerCase();
        if (['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf'].includes(ext)) {
            res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 horas
        } else {
            res.setHeader('Cache-Control', 'no-cache'); // No cache para HTML
        }
        
        // Configurar headers de seguridad
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        
        // Servir contenido
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
        
        console.log(`✅ Servido: ${filePath} (${contentType})`);
    });
}

// Manejar errores del servidor
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Error: El puerto ${PORT} ya está en uso`);
        console.log('💡 Sugerencias:');
        console.log(`   1. Verificar si hay otro servidor en el puerto ${PORT}`);
        console.log(`   2. Usar otro puerto: PORT=8081 node frontend-mvp-server.js`);
        console.log('   3. Terminar procesos existentes');
        process.exit(1);
    } else {
        console.error('❌ Error del servidor:', err);
        process.exit(1);
    }
});

// Iniciar servidor
server.listen(PORT, () => {
    console.log('===================================');
    console.log('✅ Servidor MVP iniciado exitosamente');
    console.log('===================================');
    console.log(`🔗 URL: http://localhost:${PORT}`);
    console.log(`🚀 MVP: http://localhost:${PORT}/index-mvp.html`);
    console.log('===================================');
    console.log('📋 Credenciales de prueba:');
    console.log('   admin / admin123 (Administrador)');
    console.log('   security / security123 (Seguridad)');
    console.log('   operator / operator123 (Operador)');
    console.log('   employee / employee123 (Empleado)');
    console.log('===================================');
    console.log('🎯 Sistema MVP - 100% Funcional');
    console.log('🔄 Actualizaciones en tiempo real');
    console.log('👥 Múltiples roles de usuario');
    console.log('📱 Interfaz responsive');
});

// Manejar cierre graceful
process.on('SIGINT', () => {
    console.log('\n📴 Deteniendo servidor frontend...');
    server.close(() => {
        console.log('✅ Servidor frontend detenido');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n📴 Recibida señal de terminación...');
    server.close(() => {
        console.log('✅ Servidor frontend detenido');
        process.exit(0);
    });
});
