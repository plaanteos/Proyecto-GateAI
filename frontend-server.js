const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuración del servidor
const PORT = 8080;
const FRONTEND_DIR = path.join(__dirname, 'frontend');

// MIME types para diferentes archivos
const MIME_TYPES = {
    '.html': 'text/html',
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
    '.eot': 'application/vnd.ms-fontobject'
};

// Función para obtener el tipo MIME
function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return MIME_TYPES[ext] || 'text/plain';
}

// Función para servir archivos estáticos
function serveStaticFile(res, filePath) {
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>404 - No encontrado</title>
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                        h1 { color: #e74c3c; }
                    </style>
                </head>
                <body>
                    <h1>404 - Archivo no encontrado</h1>
                    <p>El archivo solicitado no existe</p>
                    <a href="/">Volver al inicio</a>
                </body>
                </html>
            `);
            return;
        }

        const mimeType = getMimeType(filePath);
        res.writeHead(200, { 
            'Content-Type': mimeType,
            'Cache-Control': 'public, max-age=3600',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(data);
    });
}

// Crear servidor HTTP
const server = http.createServer((req, res) => {
    // Añadir headers CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Manejar preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    let filePath = req.url;
    
    // Redirigir / a /index.html
    if (filePath === '/' || filePath === '') {
        filePath = '/index.html';
    }

    // Construir la ruta completa del archivo
    const fullPath = path.join(FRONTEND_DIR, filePath);

    // Verificar que el archivo esté dentro del directorio frontend (seguridad)
    if (!fullPath.startsWith(FRONTEND_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/html' });
        res.end('403 - Acceso Denegado');
        return;
    }

    // Servir el archivo
    serveStaticFile(res, fullPath);

    // Log de la petición
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
});

// Iniciar servidor
server.listen(PORT, () => {
    console.log('');
    console.log('===============================================');
    console.log('   UnionTech Frontend Server v2.0');
    console.log('===============================================');
    console.log('');
    console.log(`🌐 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📁 Sirviendo archivos desde: ${FRONTEND_DIR}`);
    console.log('');
    console.log('✅ Frontend listo para servir peticiones!');
    console.log('===============================================');
});

// Manejo de errores del servidor
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Error: El puerto ${PORT} ya está en uso`);
    } else {
        console.error('❌ Error del servidor:', err.message);
    }
    process.exit(1);
});

module.exports = server;
