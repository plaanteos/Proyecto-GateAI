const http = require('http');
const url = require('url');

const PORT = 3000;

// Función para manejar CORS
function setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('Content-Type', 'application/json');
}

// Función para parsear JSON del body
function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (error) {
                reject(error);
            }
        });
    });
}

// Función para generar QR SVG simple
function generateQRSVG(data) {
    const size = 200;
    const modules = 25;
    const moduleSize = size / modules;
    
    // Generar patrón simple basado en los datos
    const pattern = [];
    for (let i = 0; i < modules; i++) {
        pattern[i] = [];
        for (let j = 0; j < modules; j++) {
            const seed = data.charCodeAt((i * modules + j) % data.length);
            pattern[i][j] = seed % 2 === 0;
        }
    }
    
    let svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<rect width="${size}" height="${size}" fill="white"/>`;
    
    for (let i = 0; i < modules; i++) {
        for (let j = 0; j < modules; j++) {
            if (pattern[i][j]) {
                const x = j * moduleSize;
                const y = i * moduleSize;
                svg += `<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}" fill="black"/>`;
            }
        }
    }
    
    svg += '</svg>';
    
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const method = req.method;
    const pathname = parsedUrl.pathname;

    setCorsHeaders(res);

    // Manejar OPTIONS para CORS
    if (method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    console.log(`${method} ${pathname}`);

    try {
        // Health check
        if (method === 'GET' && pathname === '/health') {
            res.writeHead(200);
            res.end(JSON.stringify({
                status: 'ok',
                message: 'UnionTech Backend API funcionando correctamente',
                timestamp: new Date().toISOString()
            }));
            return;
        }

        // Login
        if (method === 'POST' && pathname === '/api/auth/login') {
            const body = await parseBody(req);
            const { email, password } = body;
            
            console.log('🔐 Intento de login:', { email, password: '***' });
            
            // Credenciales demo
            const validCredentials = [
                { email: 'admin', password: 'admin123' },
                { email: 'admin@uniontech.com', password: 'admin123' },
                { email: 'usuario', password: '123456' },
                { email: 'demo', password: 'demo' }
            ];
            
            const isValid = validCredentials.some(cred => 
                cred.email === email && cred.password === password
            );
            
            if (isValid) {
                const token = 'demo-token-' + Date.now();
                const user = {
                    id: 1,
                    name: email === 'admin' || email === 'admin@uniontech.com' ? 'Administrador' : 'Usuario Demo',
                    email: email,
                    role: email.includes('admin') ? 'admin' : 'user'
                };
                
                res.writeHead(200);
                res.end(JSON.stringify({
                    success: true,
                    token: token,
                    user: user,
                    message: 'Login exitoso'
                }));
            } else {
                res.writeHead(401);
                res.end(JSON.stringify({
                    success: false,
                    error: 'Credenciales inválidas. Prueba: admin/admin123 o demo/demo'
                }));
            }
            return;
        }

        // Verificar token
        if (method === 'GET' && pathname === '/api/auth/verify') {
            const authHeader = req.headers.authorization;
            const token = authHeader ? authHeader.replace('Bearer ', '') : null;
            
            if (token && token.startsWith('demo-token-')) {
                res.writeHead(200);
                res.end(JSON.stringify({
                    success: true,
                    user: {
                        id: 1,
                        name: 'Usuario Demo',
                        email: 'demo@uniontech.com',
                        role: 'user'
                    }
                }));
            } else {
                res.writeHead(401);
                res.end(JSON.stringify({
                    success: false,
                    error: 'Token inválido'
                }));
            }
            return;
        }

        // Generar QR
        if (method === 'POST' && pathname === '/api/validation/generate-qr') {
            const body = await parseBody(req);
            const { personaId, edificioId, qrType = 'access', expiresIn = '1h' } = body;
            
            const qrId = 'QR-' + Math.random().toString(36).substr(2, 9).toUpperCase();
            const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
            
            // Simular generación de QR
            const qrCodeData = {
                qrId,
                personaId,
                edificioId,
                type: qrType,
                expiresAt: expiresAt.toISOString(),
                issued: new Date().toISOString()
            };
            
            const qrCodeSVG = generateQRSVG(JSON.stringify(qrCodeData));
            
            res.writeHead(200);
            res.end(JSON.stringify({
                success: true,
                data: {
                    qrCode: qrCodeSVG,
                    qrId: qrId,
                    qrType: qrType,
                    expiresAt: expiresAt.toISOString(),
                    personaId,
                    edificioId
                }
            }));
            return;
        }

        // Validar QR
        if (method === 'POST' && pathname === '/api/validation/qr') {
            const body = await parseBody(req);
            const { qrData, edificioId } = body;
            
            try {
                const data = JSON.parse(qrData);
                const now = new Date();
                const expiresAt = new Date(data.expiresAt);
                
                if (now > expiresAt) {
                    res.writeHead(200);
                    res.end(JSON.stringify({
                        success: false,
                        error: 'Código QR expirado'
                    }));
                    return;
                }
                
                res.writeHead(200);
                res.end(JSON.stringify({
                    success: true,
                    data: {
                        valid: true,
                        personaId: data.personaId,
                        edificioId: data.edificioId,
                        accessGranted: true,
                        message: 'Acceso autorizado'
                    }
                }));
            } catch (error) {
                res.writeHead(200);
                res.end(JSON.stringify({
                    success: false,
                    error: 'Código QR inválido'
                }));
            }
            return;
        }

        // Validación facial
        if (method === 'POST' && pathname === '/api/validation/facial') {
            const body = await parseBody(req);
            const { imageData, personaId } = body;
            
            // Simular validación facial
            const confidence = 0.85 + Math.random() * 0.15; // 85-100%
            
            res.writeHead(200);
            res.end(JSON.stringify({
                success: true,
                data: {
                    valid: true,
                    confidence: confidence,
                    personaId: personaId || 'PERSON_' + Math.random().toString(36).substr(2, 6),
                    matchFound: true,
                    processingTime: Math.random() * 2 + 0.5 // 0.5-2.5 segundos
                }
            }));
            return;
        }

        // Validación de documento
        if (method === 'POST' && pathname === '/api/validation/document') {
            const body = await parseBody(req);
            const { imageData, documentType, personaId } = body;
            
            // Simular validación de documento
            const confidence = 0.90 + Math.random() * 0.10; // 90-100%
            
            res.writeHead(200);
            res.end(JSON.stringify({
                success: true,
                data: {
                    valid: true,
                    confidence: confidence,
                    documentType: documentType || 'dni',
                    extractedData: {
                        name: 'Juan Pérez',
                        documentNumber: '12345678',
                        dateOfBirth: '1990-05-15',
                        issueDate: '2020-01-15',
                        expiryDate: '2030-01-15'
                    },
                    personaId: personaId || 'PERSON_' + Math.random().toString(36).substr(2, 6)
                }
            }));
            return;
        }

        // 404 para todas las demás rutas
        res.writeHead(404);
        res.end(JSON.stringify({
            success: false,
            error: 'Endpoint no encontrado',
            path: pathname
        }));

    } catch (error) {
        console.error('Error del servidor:', error);
        res.writeHead(500);
        res.end(JSON.stringify({
            success: false,
            error: 'Error interno del servidor'
        }));
    }
});

server.listen(PORT, () => {
    console.log('===================================');
    console.log('🚀 UnionTech Backend API (Nativo)');
    console.log('===================================');
    console.log(`🌐 Puerto: ${PORT}`);
    console.log(`🔗 Health: http://localhost:${PORT}/health`);
    console.log(`🔐 Login: POST /api/auth/login`);
    console.log(`🛡️ Validación: /api/validation/*`);
    console.log('===================================');
    console.log('📋 Credenciales demo:');
    console.log('   admin / admin123');
    console.log('   demo / demo');
    console.log('===================================');
    console.log('✅ Servidor listo para recibir conexiones');
});
