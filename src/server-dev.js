/**
 * Servidor de Desarrollo Simplificado
 * Solo funcionalidades básicas para desarrollo
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Middleware básico
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
    credentials: true
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting básico
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 1000 // límite de requests por ventana
});
app.use(limiter);

// Importar solo rutas esenciales
const authRoutes = require('./routes/auth');
const visitantesRoutes = require('./routes/visitantes');
const biometricRoutes = require('./routes/biometric');

// Usar rutas básicas
app.use('/api/auth', authRoutes);
app.use('/api/visitantes', visitantesRoutes);
app.use('/api/biometric', biometricRoutes);

// Health check simplificado
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '2.0.0-dev',
        mode: 'development',
        message: 'UnionTech Development Server Running'
    });
});

// API info
app.get('/api/system/info', (req, res) => {
    res.json({
        success: true,
        data: {
            name: 'UnionTech Development Server',
            version: '2.0.0-dev',
            mode: 'development',
            features: [
                'basic_auth',
                'visitor_management', 
                'biometric_validation'
            ],
            endpoints: [
                'GET /health',
                'GET /api/system/info',
                'POST /api/auth/login',
                'GET /api/visitantes',
                'POST /api/biometric/verify'
            ]
        }
    });
});

// Manejo de errores básico
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint no encontrado',
        available_endpoints: [
            'GET /health',
            'GET /api/system/info',
            'POST /api/auth/login',
            'GET /api/visitantes'
        ]
    });
});

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
    console.log(`🚀 UnionTech Development Server funcionando en puerto ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`📚 API Base URL: http://localhost:${PORT}/api`);
    console.log(`🛠️ Modo: Desarrollo Simplificado`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('📝 Cerrando servidor...');
    server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        process.exit(0);
    });
});

module.exports = app;
