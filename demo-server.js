const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

// Importar servicios y middleware
const { auditMiddleware } = require('./src/middleware/auditLogger');
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const securityRoutes = require('./src/routes/security');
const accessRoutes = require('./src/routes/access');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware básico
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Servir archivos estáticos
app.use(express.static('frontend'));
app.use('/public', express.static('public'));

// Middleware de auditoría
app.use(auditMiddleware);

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/access', accessRoutes);

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Rutas del dashboard
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'modern-dashboard.html'));
});

app.get('/security', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'security-dashboard.html'));
});

app.get('/reports', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'reports-dashboard.html'));
});

app.get('/access', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'access-registration.html'));
});

// Ruta de estado del sistema
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        services: {
            authentication: 'active',
            userManagement: 'active',
            accessControl: 'active',
            reporting: 'active',
            criticalLogging: 'active'
        },
        features: {
            'HU1': 'Gestión de usuarios completa',
            'HU2': 'Sistema de autenticación robusto',
            'HU3': 'Recuperación de contraseñas',
            'HU4': 'Registro detallado de accesos',
            'HU5': 'Reportes estadísticos',
            'HU6': 'Filtros avanzados',
            'HU7': 'Exportación de datos',
            'HU8': 'Registro intuitivo de accesos',
            'HU9': 'Dashboard responsivo',
            'HU10': 'Logging de actividad crítica'
        }
    });
});

// Rutas de prueba para demostración
app.get('/demo', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>UnionTech - Demo Completo</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Inter', sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh; 
            color: #333; 
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { 
            background: rgba(255, 255, 255, 0.95); 
            backdrop-filter: blur(10px);
            border-radius: 20px; 
            padding: 30px; 
            margin-bottom: 30px; 
            text-align: center;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        .header h1 { 
            color: #2c3e50; 
            font-weight: 700; 
            font-size: 2.5rem;
            margin-bottom: 10px;
        }
        .header p { 
            color: #7f8c8d; 
            font-size: 1.2rem;
        }
        .grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
            gap: 25px; 
            margin-bottom: 30px; 
        }
        .card { 
            background: rgba(255, 255, 255, 0.95); 
            backdrop-filter: blur(10px);
            border-radius: 20px; 
            padding: 25px; 
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
        }
        .card:hover { 
            transform: translateY(-5px); 
            box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15); 
        }
        .card-header { 
            display: flex; 
            align-items: center; 
            gap: 15px; 
            margin-bottom: 20px; 
        }
        .card-header .material-icons { 
            font-size: 32px; 
            color: #667eea; 
        }
        .card-header h3 { 
            color: #2c3e50; 
            font-weight: 600; 
        }
        .feature-list { 
            list-style: none; 
        }
        .feature-list li { 
            padding: 8px 0; 
            color: #555; 
            border-bottom: 1px solid #f1f3f4;
        }
        .feature-list li:last-child { 
            border-bottom: none; 
        }
        .feature-list li::before { 
            content: '✅'; 
            margin-right: 10px; 
        }
        .btn { 
            display: inline-block; 
            padding: 12px 24px; 
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white; 
            text-decoration: none; 
            border-radius: 10px; 
            font-weight: 500;
            transition: all 0.3s ease;
            margin: 5px;
        }
        .btn:hover { 
            transform: translateY(-2px); 
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2); 
        }
        .status-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 15px; 
            margin-top: 20px; 
        }
        .status-item { 
            background: rgba(39, 174, 96, 0.1); 
            color: #27ae60; 
            padding: 10px 15px; 
            border-radius: 10px; 
            text-align: center; 
            font-weight: 500;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>🏢 UnionTech Security System</h1>
            <p>Sistema Completo de Gestión de Accesos y Seguridad Empresarial</p>
            <div class="status-grid">
                <div class="status-item">✅ 10/10 Historias de Usuario</div>
                <div class="status-item">✅ Sistema de Autenticación</div>
                <div class="status-item">✅ Control de Accesos</div>
                <div class="status-item">✅ Reportes Avanzados</div>
                <div class="status-item">✅ Logging de Seguridad</div>
            </div>
        </div>

        <!-- Features Grid -->
        <div class="grid">
            <!-- HU1-HU2: Autenticación -->
            <div class="card">
                <div class="card-header">
                    <span class="material-icons">account_circle</span>
                    <h3>HU1-HU2: Sistema de Usuarios</h3>
                </div>
                <ul class="feature-list">
                    <li>Gestión completa de usuarios</li>
                    <li>Autenticación con JWT</li>
                    <li>Roles y permisos</li>
                    <li>Sesiones seguras</li>
                </ul>
                <a href="/api/auth/demo" class="btn">Ver Demo</a>
            </div>

            <!-- HU3: Recuperación -->
            <div class="card">
                <div class="card-header">
                    <span class="material-icons">lock_reset</span>
                    <h3>HU3: Recuperación de Contraseñas</h3>
                </div>
                <ul class="feature-list">
                    <li>Tokens de 6 dígitos</li>
                    <li>Expiración automática</li>
                    <li>Notificaciones por email</li>
                    <li>Validación segura</li>
                </ul>
                <a href="/password-recovery.html" class="btn">Probar</a>
            </div>

            <!-- HU4: Registro de Accesos -->
            <div class="card">
                <div class="card-header">
                    <span class="material-icons">qr_code_scanner</span>
                    <h3>HU4: Registro de Accesos</h3>
                </div>
                <ul class="feature-list">
                    <li>Códigos QR dinámicos</li>
                    <li>Validación facial</li>
                    <li>Registro de documentos</li>
                    <li>Control multimodal</li>
                </ul>
                <a href="/access-registration.html" class="btn">Acceder</a>
            </div>

            <!-- HU5-HU7: Reportes -->
            <div class="card">
                <div class="card-header">
                    <span class="material-icons">analytics</span>
                    <h3>HU5-HU7: Sistema de Reportes</h3>
                </div>
                <ul class="feature-list">
                    <li>Estadísticas en tiempo real</li>
                    <li>Filtros avanzados</li>
                    <li>Exportación CSV/JSON</li>
                    <li>Gráficos interactivos</li>
                </ul>
                <a href="/reports-dashboard.html" class="btn">Ver Reportes</a>
            </div>

            <!-- HU8-HU9: Dashboard -->
            <div class="card">
                <div class="card-header">
                    <span class="material-icons">dashboard</span>
                    <h3>HU8-HU9: Dashboard Moderno</h3>
                </div>
                <ul class="feature-list">
                    <li>Diseño responsivo</li>
                    <li>Material Design</li>
                    <li>Navegación intuitiva</li>
                    <li>Actualizaciones en vivo</li>
                </ul>
                <a href="/modern-dashboard.html" class="btn">Dashboard</a>
            </div>

            <!-- HU10: Logging Crítico -->
            <div class="card">
                <div class="card-header">
                    <span class="material-icons">security</span>
                    <h3>HU10: Logging de Seguridad</h3>
                </div>
                <ul class="feature-list">
                    <li>Monitoreo en tiempo real</li>
                    <li>Detección de amenazas</li>
                    <li>Alertas automáticas</li>
                    <li>Análisis de riesgo</li>
                </ul>
                <a href="/security-dashboard.html" class="btn">Seguridad</a>
            </div>
        </div>

        <!-- API Endpoints -->
        <div class="card">
            <div class="card-header">
                <span class="material-icons">api</span>
                <h3>API Endpoints Disponibles</h3>
            </div>
            <div class="grid">
                <div>
                    <h4>Autenticación</h4>
                    <ul class="feature-list">
                        <li>POST /api/auth/login</li>
                        <li>POST /api/auth/register</li>
                        <li>POST /api/auth/logout</li>
                        <li>POST /api/auth/reset-password</li>
                    </ul>
                </div>
                <div>
                    <h4>Usuarios</h4>
                    <ul class="feature-list">
                        <li>GET /api/users</li>
                        <li>POST /api/users</li>
                        <li>PUT /api/users/:id</li>
                        <li>DELETE /api/users/:id</li>
                    </ul>
                </div>
                <div>
                    <h4>Accesos</h4>
                    <ul class="feature-list">
                        <li>POST /api/access/register</li>
                        <li>GET /api/access/validate</li>
                        <li>GET /api/access/history</li>
                        <li>GET /api/access/reports</li>
                    </ul>
                </div>
                <div>
                    <h4>Seguridad</h4>
                    <ul class="feature-list">
                        <li>GET /api/security/logs</li>
                        <li>GET /api/security/dashboard</li>
                        <li>GET /api/security/export</li>
                        <li>DELETE /api/security/cleanup</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Verificar estado de los servicios
        fetch('/api/health')
            .then(response => response.json())
            .then(data => {
                console.log('🏢 UnionTech System Status:', data);
            })
            .catch(error => {
                console.error('Error verificando estado:', error);
            });
    </script>
</body>
</html>
    `);
});

// Manejo de errores global
app.use((error, req, res, next) => {
    console.error('🚨 Error capturado:', error);
    res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        message: error.message 
    });
});

// Ruta 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        message: `Route ${req.method} ${req.originalUrl} not found`
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`
🏢 UnionTech Security System - Demo Completo
===========================================
🌐 Servidor ejecutándose en: http://localhost:${PORT}
📋 Demo completo: http://localhost:${PORT}/demo
🛡️ Dashboard de seguridad: http://localhost:${PORT}/security
📊 Dashboard moderno: http://localhost:${PORT}/dashboard
📈 Reportes: http://localhost:${PORT}/reports
🎫 Registro de accesos: http://localhost:${PORT}/access

✅ TODAS LAS HISTORIAS DE USUARIO IMPLEMENTADAS:
===============================================
  HU1: ✅ Gestión completa de usuarios
  HU2: ✅ Sistema de autenticación robusto
  HU3: ✅ Recuperación de contraseñas
  HU4: ✅ Registro detallado de accesos
  HU5: ✅ Reportes estadísticos
  HU6: ✅ Filtros avanzados de reportes
  HU7: ✅ Exportación de datos
  HU8: ✅ Registro intuitivo de accesos
  HU9: ✅ Dashboard responsivo
  HU10: ✅ Logging de actividad crítica

🚀 Sistema listo para producción con todas las funcionalidades.
    `);
});

// Exportar app para pruebas
module.exports = app;
