// Servidor de pruebas mejorado para validar HU1, HU2, HU4 y HU10
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');

// Importar servicios mejorados
const EnhancedUserManagementService = require('./src/services/enhancedUserManagementService');
const AccessControlService = require('./src/services/accessControlService');
const CriticalActivityLogger = require('./src/services/criticalActivityLogger');

// Importar rutas
const enhancedAuthRoutes = require('./src/routes/enhancedAuth');
const securityRoutes = require('./src/routes/security');

// Importar middleware
const { auditMiddleware } = require('./src/middleware/auditLogger');

const app = express();
const port = 3002;

// Configuración de middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('frontend'));

// Middleware de auditoría
app.use(auditMiddleware);

// Crear instancias de servicios
const userService = new EnhancedUserManagementService();
const accessService = new AccessControlService();
const criticalLogger = new CriticalActivityLogger();

// Rutas principales
app.use('/api/auth', enhancedAuthRoutes);
app.use('/api/security', securityRoutes);

// =====================================
// RUTAS DE CONTROL DE ACCESO (HU4)
// =====================================

// Registrar visitante
app.post('/api/access/visitors', async (req, res) => {
    try {
        const result = await accessService.registerVisitor(req.body, req.user || { id: 'demo' });
        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Generar código QR
app.post('/api/access/qr/generate', async (req, res) => {
    try {
        const result = await accessService.generateQRCode(req.body, req.user || { id: 'demo' });
        res.json(result);
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Validar código QR
app.post('/api/access/qr/validate', async (req, res) => {
    try {
        const { qrData, location } = req.body;
        const result = await accessService.validateQRCode(qrData, location);
        res.json(result);
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Registrar acceso
app.post('/api/access/record', async (req, res) => {
    try {
        const result = await accessService.recordAccess(req.body, req.user || { id: 'demo' });
        res.json(result);
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Obtener histórico de accesos
app.get('/api/access/history', async (req, res) => {
    try {
        const result = await accessService.getAccessHistory(req.query);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Obtener estadísticas de accesos
app.get('/api/access/statistics', async (req, res) => {
    try {
        const result = await accessService.getAccessStatistics(req.query);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// =====================================
// RUTAS DE DEMOSTRACIÓN
// =====================================

// Página principal con resumen de implementación
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>UnionTech - Sistema Completo de Accesos</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; color: #333; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: rgba(255,255,255,0.95); border-radius: 20px; padding: 30px; margin-bottom: 30px; text-align: center; box-shadow: 0 8px 32px rgba(0,0,0,0.1); }
        .header h1 { color: #2c3e50; font-size: 2.5rem; margin-bottom: 10px; }
        .header p { color: #7f8c8d; font-size: 1.2rem; }
        .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 25px; margin-bottom: 30px; }
        .feature-card { background: rgba(255,255,255,0.95); border-radius: 15px; padding: 25px; box-shadow: 0 4px 16px rgba(0,0,0,0.1); transition: transform 0.3s ease; }
        .feature-card:hover { transform: translateY(-5px); }
        .feature-icon { font-size: 3rem; margin-bottom: 15px; }
        .feature-title { font-size: 1.3rem; font-weight: 600; color: #2c3e50; margin-bottom: 10px; }
        .feature-desc { color: #7f8c8d; margin-bottom: 15px; }
        .feature-list { list-style: none; }
        .feature-list li { color: #27ae60; margin: 5px 0; }
        .feature-list li:before { content: "✅ "; }
        .demo-buttons { background: rgba(255,255,255,0.95); border-radius: 15px; padding: 25px; text-align: center; }
        .btn { display: inline-block; margin: 10px; padding: 15px 30px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; text-decoration: none; border-radius: 25px; font-weight: 500; transition: all 0.3s ease; }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.2); }
        .status-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 20px; }
        .status-item { background: #27ae60; color: white; padding: 15px; border-radius: 10px; text-align: center; }
        .status-item.complete { background: #27ae60; }
        .status-item.partial { background: #f39c12; }
        .status-item.new { background: #3498db; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏢 UnionTech</h1>
            <p>Sistema Completo de Control de Accesos Empresariales</p>
            <div class="status-grid">
                <div class="status-item complete">HU1: Autenticación ✅</div>
                <div class="status-item complete">HU2: Gestión Usuarios ✅</div>
                <div class="status-item complete">HU4: Control Accesos ✅</div>
                <div class="status-item complete">HU10: Logging Crítico ✅</div>
            </div>
        </div>

        <div class="features-grid">
            <div class="feature-card">
                <div class="feature-icon">🔐</div>
                <div class="feature-title">HU1 - Sistema de Autenticación</div>
                <div class="feature-desc">Sistema completo de login con gestión avanzada de sesiones</div>
                <ul class="feature-list">
                    <li>Login/Logout con JWT</li>
                    <li>Gestión de sesiones múltiples</li>
                    <li>Bloqueo automático de cuentas</li>
                    <li>Validación de tokens en tiempo real</li>
                    <li>Cambio de contraseñas seguro</li>
                    <li>Rate limiting por usuario</li>
                </ul>
            </div>

            <div class="feature-card">
                <div class="feature-icon">👥</div>
                <div class="feature-title">HU2 - Gestión de Usuarios</div>
                <div class="feature-desc">CRUD completo con sistema de roles y permisos granulares</div>
                <ul class="feature-list">
                    <li>6 roles predefinidos con permisos</li>
                    <li>CRUD completo de usuarios</li>
                    <li>Sistema de permisos granular</li>
                    <li>Filtros y búsquedas avanzadas</li>
                    <li>Estadísticas del sistema</li>
                    <li>Gestión de edificios/unidades</li>
                </ul>
            </div>

            <div class="feature-card">
                <div class="feature-icon">🎫</div>
                <div class="feature-title">HU4 - Control de Accesos</div>
                <div class="feature-desc">Sistema completo de generación QR, validación y registro</div>
                <ul class="feature-list">
                    <li>Registro de visitantes</li>
                    <li>Generación de códigos QR</li>
                    <li>Validación con seguridad</li>
                    <li>Registro de accesos/salidas</li>
                    <li>Histórico con filtros</li>
                    <li>Estadísticas y reportes</li>
                </ul>
            </div>

            <div class="feature-card">
                <div class="feature-icon">🛡️</div>
                <div class="feature-title">HU10 - Logging Crítico</div>
                <div class="feature-desc">Monitoreo avanzado de seguridad con alertas automáticas</div>
                <ul class="feature-list">
                    <li>Detección de eventos críticos</li>
                    <li>Puntuación de riesgo automática</li>
                    <li>Dashboard de seguridad</li>
                    <li>Alertas en tiempo real</li>
                    <li>Exportación de logs</li>
                    <li>Análisis de patrones sospechosos</li>
                </ul>
            </div>
        </div>

        <div class="demo-buttons">
            <h3 style="margin-bottom: 20px;">🚀 Demostraciones Disponibles</h3>
            <a href="/demo/auth" class="btn">Demo Autenticación</a>
            <a href="/demo/users" class="btn">Demo Gestión Usuarios</a>
            <a href="/demo/access" class="btn">Demo Control Accesos</a>
            <a href="/security-dashboard.html" class="btn">Dashboard Seguridad</a>
            <a href="/api/auth/docs" class="btn">Documentación API</a>
        </div>
    </div>
</body>
</html>
    `);
});

// Demo de autenticación
app.get('/demo/auth', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Demo - Sistema de Autenticación</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
        .demo-section { background: white; padding: 20px; margin: 20px 0; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .form-group { margin: 15px 0; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input, select { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
        button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 5px; }
        button:hover { background: #0056b3; }
        .result { margin-top: 15px; padding: 10px; border-radius: 5px; }
        .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
        .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
        .info { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; }
        pre { background: #f8f9fa; padding: 10px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>🔐 Demo - Sistema de Autenticación (HU1)</h1>
    
    <div class="demo-section">
        <h3>1. Login de Usuario</h3>
        <div class="form-group">
            <label>Usuario (prueba: admin, edificio.admin, seguridad)</label>
            <input type="text" id="loginUsername" value="admin" placeholder="Username">
        </div>
        <div class="form-group">
            <label>Contraseña</label>
            <input type="password" id="loginPassword" value="admin123" placeholder="Password">
        </div>
        <button onclick="testLogin()">Iniciar Sesión</button>
        <div id="loginResult" class="result" style="display: none;"></div>
    </div>

    <div class="demo-section">
        <h3>2. Validar Token</h3>
        <button onclick="testValidateToken()">Validar Token Actual</button>
        <div id="validateResult" class="result" style="display: none;"></div>
    </div>

    <div class="demo-section">
        <h3>3. Obtener Perfil</h3>
        <button onclick="testGetProfile()">Obtener Mi Perfil</button>
        <div id="profileResult" class="result" style="display: none;"></div>
    </div>

    <div class="demo-section">
        <h3>4. Sesiones Activas</h3>
        <button onclick="testGetSessions()">Ver Sesiones Activas</button>
        <div id="sessionsResult" class="result" style="display: none;"></div>
    </div>

    <div class="demo-section">
        <h3>5. Logout</h3>
        <button onclick="testLogout()">Cerrar Sesión</button>
        <div id="logoutResult" class="result" style="display: none;"></div>
    </div>

    <script>
        let currentToken = null;

        async function makeRequest(url, options = {}) {
            try {
                const headers = { 'Content-Type': 'application/json' };
                if (currentToken) {
                    headers['Authorization'] = 'Bearer ' + currentToken;
                }

                const response = await fetch(url, {
                    headers,
                    credentials: 'include',
                    ...options
                });
                
                return await response.json();
            } catch (error) {
                return { success: false, error: error.message };
            }
        }

        function showResult(elementId, result, isSuccess = true) {
            const element = document.getElementById(elementId);
            element.style.display = 'block';
            element.className = 'result ' + (isSuccess ? 'success' : 'error');
            element.innerHTML = '<pre>' + JSON.stringify(result, null, 2) + '</pre>';
        }

        async function testLogin() {
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;
            
            const result = await makeRequest('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });
            
            if (result.success) {
                currentToken = result.data.token;
                showResult('loginResult', result, true);
            } else {
                showResult('loginResult', result, false);
            }
        }

        async function testValidateToken() {
            if (!currentToken) {
                showResult('validateResult', { error: 'No hay token activo' }, false);
                return;
            }
            
            const result = await makeRequest('/api/auth/validate', {
                method: 'POST'
            });
            
            showResult('validateResult', result, result.success);
        }

        async function testGetProfile() {
            const result = await makeRequest('/api/auth/profile');
            showResult('profileResult', result, result.success);
        }

        async function testGetSessions() {
            const result = await makeRequest('/api/auth/sessions');
            showResult('sessionsResult', result, result.success);
        }

        async function testLogout() {
            const result = await makeRequest('/api/auth/logout', {
                method: 'POST'
            });
            
            if (result.success) {
                currentToken = null;
            }
            
            showResult('logoutResult', result, result.success);
        }
    </script>
</body>
</html>
    `);
});

// Demo de control de accesos
app.get('/demo/access', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Demo - Control de Accesos</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 1000px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
        .demo-section { background: white; padding: 20px; margin: 20px 0; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .form-group { margin: 15px 0; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input, select, textarea { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
        button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 5px; }
        button:hover { background: #0056b3; }
        .result { margin-top: 15px; padding: 10px; border-radius: 5px; }
        .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
        .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
        pre { background: #f8f9fa; padding: 10px; border-radius: 5px; overflow-x: auto; max-height: 300px; }
        .qr-display { text-align: center; margin: 20px 0; }
        .qr-display img { max-width: 200px; border: 2px solid #ddd; border-radius: 10px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    </style>
</head>
<body>
    <h1>🎫 Demo - Control de Accesos (HU4)</h1>
    
    <div class="grid">
        <div class="demo-section">
            <h3>1. Registrar Visitante</h3>
            <div class="form-group">
                <label>Nombre</label>
                <input type="text" id="visitorFirstName" value="Juan" placeholder="Nombre">
            </div>
            <div class="form-group">
                <label>Apellido</label>
                <input type="text" id="visitorLastName" value="Pérez" placeholder="Apellido">
            </div>
            <div class="form-group">
                <label>Documento</label>
                <input type="text" id="visitorDocument" value="12345678" placeholder="DNI/Documento">
            </div>
            <div class="form-group">
                <label>Email</label>
                <input type="email" id="visitorEmail" value="juan.perez@email.com" placeholder="Email">
            </div>
            <div class="form-group">
                <label>Teléfono</label>
                <input type="text" id="visitorPhone" value="+1234567890" placeholder="Teléfono">
            </div>
            <div class="form-group">
                <label>Empresa</label>
                <input type="text" id="visitorCompany" value="Empresa ABC" placeholder="Empresa">
            </div>
            <div class="form-group">
                <label>Propósito</label>
                <input type="text" id="visitorPurpose" value="Reunión de negocios" placeholder="Propósito de la visita">
            </div>
            <button onclick="registerVisitor()">Registrar Visitante</button>
            <div id="visitorResult" class="result" style="display: none;"></div>
        </div>

        <div class="demo-section">
            <h3>2. Generar Código QR</h3>
            <div class="form-group">
                <label>ID del Visitante</label>
                <input type="text" id="qrVisitorId" placeholder="Se llena automáticamente">
            </div>
            <div class="form-group">
                <label>Edificio</label>
                <select id="qrBuilding">
                    <option value="torre_a">Torre A</option>
                    <option value="torre_b">Torre B</option>
                </select>
            </div>
            <div class="form-group">
                <label>Áreas Permitidas</label>
                <select id="qrAreas" multiple>
                    <option value="lobby" selected>Lobby</option>
                    <option value="parking">Parking</option>
                    <option value="office_1">Oficina 1</option>
                    <option value="office_2">Oficina 2</option>
                </select>
            </div>
            <div class="form-group">
                <label>Válido por (horas)</label>
                <input type="number" id="qrValidHours" value="24" min="1" max="168">
            </div>
            <div class="form-group">
                <label>Anfitrión</label>
                <input type="text" id="qrHost" value="María García" placeholder="Nombre del anfitrión">
            </div>
            <button onclick="generateQR()">Generar QR</button>
            <div id="qrResult" class="result" style="display: none;"></div>
            <div id="qrDisplay" class="qr-display" style="display: none;"></div>
        </div>
    </div>

    <div class="grid">
        <div class="demo-section">
            <h3>3. Validar y Registrar Acceso</h3>
            <div class="form-group">
                <label>Datos del QR</label>
                <textarea id="accessQrData" placeholder="Datos del QR (se llena automáticamente)" rows="3"></textarea>
            </div>
            <div class="form-group">
                <label>Tipo de Acceso</label>
                <select id="accessType">
                    <option value="entry">Entrada</option>
                    <option value="exit">Salida</option>
                    <option value="area_access">Acceso a Área</option>
                </select>
            </div>
            <div class="form-group">
                <label>Área/Puerta</label>
                <select id="accessArea">
                    <option value="main_entrance">Entrada Principal</option>
                    <option value="lobby">Lobby</option>
                    <option value="parking">Parking</option>
                    <option value="office_1">Oficina 1</option>
                </select>
            </div>
            <button onclick="validateAndRecord()">Validar y Registrar</button>
            <div id="accessResult" class="result" style="display: none;"></div>
        </div>

        <div class="demo-section">
            <h3>4. Consultar Histórico</h3>
            <div class="form-group">
                <label>Fecha Inicio</label>
                <input type="date" id="historyStartDate">
            </div>
            <div class="form-group">
                <label>Fecha Fin</label>
                <input type="date" id="historyEndDate">
            </div>
            <div class="form-group">
                <label>Edificio</label>
                <select id="historyBuilding">
                    <option value="">Todos</option>
                    <option value="torre_a">Torre A</option>
                    <option value="torre_b">Torre B</option>
                </select>
            </div>
            <div class="form-group">
                <label>Estado</label>
                <select id="historyStatus">
                    <option value="">Todos</option>
                    <option value="granted">Aprobado</option>
                    <option value="denied">Denegado</option>
                </select>
            </div>
            <button onclick="getHistory()">Consultar Histórico</button>
            <button onclick="getStatistics()">Obtener Estadísticas</button>
            <div id="historyResult" class="result" style="display: none;"></div>
        </div>
    </div>

    <script>
        let currentVisitorId = null;
        let currentQrData = null;

        async function makeRequest(url, options = {}) {
            try {
                const response = await fetch(url, {
                    headers: { 'Content-Type': 'application/json' },
                    ...options
                });
                return await response.json();
            } catch (error) {
                return { success: false, error: error.message };
            }
        }

        function showResult(elementId, result, isSuccess = true) {
            const element = document.getElementById(elementId);
            element.style.display = 'block';
            element.className = 'result ' + (isSuccess ? 'success' : 'error');
            element.innerHTML = '<pre>' + JSON.stringify(result, null, 2) + '</pre>';
        }

        async function registerVisitor() {
            const visitorData = {
                firstName: document.getElementById('visitorFirstName').value,
                lastName: document.getElementById('visitorLastName').value,
                document: document.getElementById('visitorDocument').value,
                email: document.getElementById('visitorEmail').value,
                phone: document.getElementById('visitorPhone').value,
                company: document.getElementById('visitorCompany').value,
                purpose: document.getElementById('visitorPurpose').value
            };
            
            const result = await makeRequest('/api/access/visitors', {
                method: 'POST',
                body: JSON.stringify(visitorData)
            });
            
            if (result.success) {
                currentVisitorId = result.visitor.id;
                document.getElementById('qrVisitorId').value = currentVisitorId;
                showResult('visitorResult', result, true);
            } else {
                showResult('visitorResult', result, false);
            }
        }

        async function generateQR() {
            const qrData = {
                visitorId: currentVisitorId || document.getElementById('qrVisitorId').value,
                building: document.getElementById('qrBuilding').value,
                areas: Array.from(document.getElementById('qrAreas').selectedOptions).map(opt => opt.value),
                validHours: parseInt(document.getElementById('qrValidHours').value),
                host: document.getElementById('qrHost').value,
                purpose: document.getElementById('visitorPurpose').value
            };
            
            const result = await makeRequest('/api/access/qr/generate', {
                method: 'POST',
                body: JSON.stringify(qrData)
            });
            
            if (result.success) {
                currentQrData = result.qrCode.qrData;
                document.getElementById('accessQrData').value = currentQrData;
                
                // Mostrar código QR
                const qrDisplay = document.getElementById('qrDisplay');
                qrDisplay.style.display = 'block';
                qrDisplay.innerHTML = '<h4>Código QR Generado:</h4><img src="' + result.qrCode.qrCode + '" alt="QR Code">';
                
                showResult('qrResult', result, true);
            } else {
                showResult('qrResult', result, false);
            }
        }

        async function validateAndRecord() {
            const qrData = document.getElementById('accessQrData').value;
            if (!qrData) {
                showResult('accessResult', { error: 'Datos del QR requeridos' }, false);
                return;
            }

            // Primero validar el QR
            const validation = await makeRequest('/api/access/qr/validate', {
                method: 'POST',
                body: JSON.stringify({
                    qrData: qrData,
                    location: {
                        building: document.getElementById('qrBuilding').value
                    }
                })
            });

            if (!validation.valid) {
                showResult('accessResult', validation, false);
                return;
            }

            // Si es válido, registrar el acceso
            const accessData = {
                qrData: qrData,
                type: document.getElementById('accessType').value,
                building: document.getElementById('qrBuilding').value,
                area: document.getElementById('accessArea').value,
                method: 'qr'
            };

            const result = await makeRequest('/api/access/record', {
                method: 'POST',
                body: JSON.stringify(accessData)
            });

            showResult('accessResult', { validation, access: result }, result.success);
        }

        async function getHistory() {
            const params = new URLSearchParams();
            
            if (document.getElementById('historyStartDate').value) {
                params.append('startDate', document.getElementById('historyStartDate').value);
            }
            if (document.getElementById('historyEndDate').value) {
                params.append('endDate', document.getElementById('historyEndDate').value);
            }
            if (document.getElementById('historyBuilding').value) {
                params.append('building', document.getElementById('historyBuilding').value);
            }
            if (document.getElementById('historyStatus').value) {
                params.append('status', document.getElementById('historyStatus').value);
            }

            const result = await makeRequest('/api/access/history?' + params);
            showResult('historyResult', result, result.success);
        }

        async function getStatistics() {
            const params = new URLSearchParams();
            
            if (document.getElementById('historyStartDate').value) {
                params.append('startDate', document.getElementById('historyStartDate').value);
            }
            if (document.getElementById('historyEndDate').value) {
                params.append('endDate', document.getElementById('historyEndDate').value);
            }

            const result = await makeRequest('/api/access/statistics?' + params);
            showResult('historyResult', result, result.success);
        }

        // Establecer fechas por defecto
        const today = new Date();
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        document.getElementById('historyStartDate').value = weekAgo.toISOString().split('T')[0];
        document.getElementById('historyEndDate').value = today.toISOString().split('T')[0];
    </script>
</body>
</html>
    `);
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
            userManagement: 'active',
            accessControl: 'active',
            criticalLogging: 'active',
            audit: 'active'
        },
        implementation: {
            'HU1': 'Sistema de Autenticación - COMPLETADO',
            'HU2': 'Gestión de Usuarios - COMPLETADO',
            'HU4': 'Control de Accesos - COMPLETADO',
            'HU10': 'Logging Crítico - COMPLETADO'
        }
    });
});

// Error handler global
app.use((error, req, res, next) => {
    console.error('🚨 Error global:', error);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`
🏢 UnionTech - Sistema Completo de Control de Accesos
====================================================
🌐 Servidor ejecutándose en: http://localhost:${port}

✅ IMPLEMENTACIONES COMPLETADAS:

📍 HU1 - Sistema de Autenticación:
  🔐 Login/Logout con JWT y gestión de sesiones
  🛡️ Bloqueo automático tras intentos fallidos
  ⏰ Validación de tokens en tiempo real
  🔑 Cambio de contraseñas seguro
  📊 Rate limiting por usuario

📍 HU2 - Gestión de Usuarios:
  👥 CRUD completo con 6 roles predefinidos
  🎭 Sistema de permisos granular (40+ permisos)
  🏢 Gestión por edificios y unidades
  📈 Estadísticas y reportes de usuarios
  🔍 Filtros y búsquedas avanzadas

📍 HU4 - Control de Accesos:
  🎫 Registro de visitantes completo
  📱 Generación de códigos QR seguros
  ✅ Validación con hash de seguridad
  📊 Registro de accesos/salidas
  📈 Histórico con filtros avanzados
  📊 Estadísticas y reportes detallados

📍 HU10 - Logging de Actividad Crítica:
  🚨 Detección automática de eventos críticos
  🎯 Puntuación de riesgo automatizada
  📊 Dashboard de seguridad en tiempo real
  🔔 Alertas automáticas de seguridad
  📁 Exportación de logs (CSV/JSON)

🚀 ENDPOINTS DISPONIBLES:
  GET  /                     - Página principal
  GET  /demo/auth           - Demo autenticación
  GET  /demo/access         - Demo control accesos
  GET  /security-dashboard.html - Dashboard seguridad
  GET  /health              - Estado del sistema
  
  📡 API Autenticación:    /api/auth/*
  📡 API Control Accesos:  /api/access/*
  📡 API Seguridad:        /api/security/*

💾 PERSISTENCIA:
  - Usuarios: data/users.json
  - Roles: data/roles.json
  - Visitantes: data/visitors.json
  - Códigos QR: data/qr-codes.json
  - Registros Accesos: data/access-records.json
  - Logs Críticos: logs/critical-*.log
  - Logs Auditoría: logs/audit-*.log

🔧 TECNOLOGÍAS:
  - Node.js + Express
  - JWT para autenticación
  - QRCode para códigos QR
  - Bcrypt para hash de contraseñas
  - Sistema de archivos JSON
    `);
});

module.exports = app;
