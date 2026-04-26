/**
 * Aplicación Express Simplificada para Diagnóstico
 */

// Configuración básica
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

console.log('📦 Módulos básicos cargados');

// Crear app Express
const app = express();

console.log('🚀 App Express creado');

// Middleware de seguridad
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

console.log('🛡️ Helmet configurado');

// CORS
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
    credentials: true
}));

console.log('🔄 CORS configurado');

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 1000, // más permisivo para desarrollo
    message: {
        success: false,
        message: 'Demasiadas solicitudes, intenta de nuevo más tarde'
    }
});
app.use(limiter);

console.log('⏱️ Rate limiting configurado');

// Middleware básico
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

console.log('📄 Middleware básico configurado');

// Rutas básicas solamente
try {
    const authRoutes = require('./routes/auth');
    app.use('/api/auth', authRoutes);
    console.log('✅ Rutas de auth cargadas');
} catch (error) {
    console.log('⚠️ Error cargando rutas auth:', error.message);
}

try {
    const visitantesRoutes = require('./routes/visitantes');
    app.use('/api/visitantes', visitantesRoutes);
    console.log('✅ Rutas de visitantes cargadas');
} catch (error) {
    console.log('⚠️ Error cargando rutas visitantes:', error.message);
}

// Health check simple
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '2.0.0-debug',
        message: 'UnionTech Debug Server Running'
    });
});

console.log('💚 Health check configurado');

// API info
app.get('/api/system/info', (req, res) => {
    res.json({
        success: true,
        data: {
            name: 'UnionTech Debug Server',
            version: '2.0.0-debug',
            mode: 'debug',
            timestamp: new Date().toISOString(),
            features: ['basic_auth', 'visitor_management'],
            status: 'running'
        }
    });
});

console.log('📊 System info configurado');

// Manejo de errores
app.use((err, req, res, next) => {
    console.error('Error capturado:', err);
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
        path: req.originalUrl
    });
});

console.log('🔧 Error handlers configurados');

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('📝 Cerrando servidor debug...');
    process.exit(0);
});

process.on('uncaughtException', (error) => {
    console.error('💥 Excepción no capturada:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Rechazo no manejado en:', promise, 'razón:', reason);
    process.exit(1);
});

console.log('🎯 App configurado completamente');

module.exports = app;
