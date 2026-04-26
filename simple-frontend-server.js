const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const FRONTEND_DIR = path.join(__dirname, 'frontend');

console.log('===================================');
console.log('🌐 UnionTech Frontend Server');
console.log('===================================');
console.log(`📁 Sirviendo desde: ${FRONTEND_DIR}`);
console.log(`🌐 Puerto: ${PORT}`);

const mimeTypes = {
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
    '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
    console.log(`📥 ${req.method} ${req.url}`);
    
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    let filePath = req.url === '/' ? '/index.html' : req.url;
    filePath = path.join(FRONTEND_DIR, filePath);
    
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'text/plain';
    
    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                console.log(`❌ 404: ${filePath}`);
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>404 - No encontrado</title>
                        <meta charset="utf-8">
                        <style>
                            body { 
                                font-family: Arial, sans-serif; 
                                text-align: center; 
                                padding: 50px; 
                                background: #f8f9fa;
                            }
                            .error { color: #dc3545; }
                            .info { color: #6c757d; margin-top: 20px; }
                        </style>
                    </head>
                    <body>
                        <h1 class="error">404 - Archivo no encontrado</h1>
                        <p>El archivo solicitado no existe: <code>${req.url}</code></p>
                        <div class="info">
                            <p>Ruta completa: <code>${filePath}</code></p>
                            <p><a href="/">Volver al inicio</a></p>
                        </div>
                    </body>
                    </html>
                `);
            } else {
                console.log(`❌ Error del servidor: ${err.message}`);
                res.writeHead(500);
                res.end('Error interno del servidor');
            }
        } else {
            console.log(`✅ 200: ${filePath}`);
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

server.listen(PORT, () => {
    console.log('===================================');
    console.log(`✅ Servidor iniciado exitosamente!`);
    console.log(`🌐 http://localhost:${PORT}`);
    console.log('===================================');
});

server.on('error', (err) => {
    console.error('❌ Error del servidor:', err.message);
    if (err.code === 'EADDRINUSE') {
        console.error(`El puerto ${PORT} ya está en uso`);
    }
    process.exit(1);
});

module.exports = server;
