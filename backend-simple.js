const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware CORS manual
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'UnionTech Backend API funcionando correctamente',
        timestamp: new Date().toISOString()
    });
});

// Ruta de login demo
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
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
        
        res.json({
            success: true,
            token: token,
            user: user,
            message: 'Login exitoso'
        });
    } else {
        res.status(401).json({
            success: false,
            error: 'Credenciales inválidas. Prueba: admin/admin123 o demo/demo'
        });
    }
});

// Verificar token
app.get('/api/auth/verify', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token && token.startsWith('demo-token-')) {
        res.json({
            success: true,
            user: {
                id: 1,
                name: 'Usuario Demo',
                email: 'demo@uniontech.com',
                role: 'user'
            }
        });
    } else {
        res.status(401).json({
            success: false,
            error: 'Token inválido'
        });
    }
});

// Endpoints de validación multimodal
app.post('/api/validation/generate-qr', (req, res) => {
    const { personaId, edificioId, qrType = 'access', expiresIn = '1h' } = req.body;
    
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
    
    res.json({
        success: true,
        data: {
            qrCode: qrCodeSVG,
            qrId: qrId,
            qrType: qrType,
            expiresAt: expiresAt.toISOString(),
            personaId,
            edificioId
        }
    });
});

app.post('/api/validation/qr', (req, res) => {
    const { qrData, edificioId } = req.body;
    
    try {
        const data = JSON.parse(qrData);
        const now = new Date();
        const expiresAt = new Date(data.expiresAt);
        
        if (now > expiresAt) {
            return res.json({
                success: false,
                error: 'Código QR expirado'
            });
        }
        
        res.json({
            success: true,
            data: {
                valid: true,
                personaId: data.personaId,
                edificioId: data.edificioId,
                accessGranted: true,
                message: 'Acceso autorizado'
            }
        });
    } catch (error) {
        res.json({
            success: false,
            error: 'Código QR inválido'
        });
    }
});

app.post('/api/validation/facial', (req, res) => {
    const { imageData, personaId } = req.body;
    
    // Simular validación facial
    const confidence = 0.85 + Math.random() * 0.15; // 85-100%
    
    res.json({
        success: true,
        data: {
            valid: true,
            confidence: confidence,
            personaId: personaId || 'PERSON_' + Math.random().toString(36).substr(2, 6),
            matchFound: true,
            processingTime: Math.random() * 2 + 0.5 // 0.5-2.5 segundos
        }
    });
});

app.post('/api/validation/document', (req, res) => {
    const { imageData, documentType, personaId } = req.body;
    
    // Simular validación de documento
    const confidence = 0.90 + Math.random() * 0.10; // 90-100%
    
    res.json({
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
    });
});

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

// Iniciar servidor
app.listen(PORT, () => {
    console.log('===================================');
    console.log('🚀 UnionTech Backend API');
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
