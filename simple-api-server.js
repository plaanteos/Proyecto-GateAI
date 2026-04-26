require('dotenv').config();
const http = require('http');
const url = require('url');
const querystring = require('querystring');

const PORT = process.env.PORT || 3000;

// Datos mock
const MOCK_DATA = {
  estadisticas: {
    total_personas: 150,
    visitantes_hoy: 12,
    accesos_hoy: 45,
    edificios: 3
  },
  usuarios: [
    { id: 1, email: 'admin@uniontech.com', password: 'admin123', nombre: 'Administrador', rol: 'admin' }
  ],
  visitantes: [
    {
      id: 1,
      nombre: 'Carlos Rodríguez',
      empresa: 'TechCorp',
      email: 'carlos@techcorp.com',
      telefono: '+1234567890',
      anfitrion: 'Ana Martín',
      fecha_visita: new Date().toISOString(),
      estado: 'pendiente',
      motivo: 'Reunión comercial'
    },
    {
      id: 2,
      nombre: 'Laura Sánchez',
      empresa: 'InnoSoft',
      email: 'laura@innosoft.com',
      telefono: '+0987654321',
      anfitrion: 'Pedro López',
      fecha_visita: new Date().toISOString(),
      estado: 'autorizado',
      motivo: 'Presentación técnica'
    }
  ],
  accesos: [
    {
      id: 1,
      persona: 'Juan Pérez',
      edificio: 'Torre Central',
      hora: new Date().toISOString(),
      estado: 'autorizado'
    },
    {
      id: 2,
      persona: 'María García',
      edificio: 'Edificio Norte',
      hora: new Date(Date.now() - 15 * 60000).toISOString(),
      estado: 'autorizado'
    }
  ]
};

// Función para parsear el body de las peticiones POST
function parseBody(req, callback) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  req.on('end', () => {
    try {
      const parsed = JSON.parse(body);
      callback(null, parsed);
    } catch (error) {
      callback(error, null);
    }
  });
}

// Función para enviar respuesta JSON
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data, null, 2));
}

// Servidor HTTP
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  console.log(`${method} ${path}`);

  // Manejar CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  // Rutas
  if (path === '/' && method === 'GET') {
    sendJSON(res, 200, {
      message: '🚀 UnionTech - Sistema de Control de Accesos',
      version: '1.0.0',
      status: 'running',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      features: [
        'Control de Accesos',
        'Gestión de Visitantes',
        'Reportes y Analytics',
        'Notificaciones WhatsApp/Email',
        'Dashboard Administrativo'
      ],
      rutas_disponibles: [
        'GET /',
        'GET /health',
        'GET /api/test/datos',
        'POST /api/auth/login',
        'GET /api/visitantes',
        'GET /api/reportes/dashboard'
      ]
    });
  }
  
  else if (path === '/health' && method === 'GET') {
    sendJSON(res, 200, {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: 'mock',
        auth: 'active',
        notifications: 'configured'
      }
    });
  }
  
  else if (path === '/api/test/datos' && method === 'GET') {
    sendJSON(res, 200, {
      success: true,
      data: MOCK_DATA.estadisticas,
      ultimos_accesos: MOCK_DATA.accesos,
      visitantes_pendientes: MOCK_DATA.visitantes.filter(v => v.estado === 'pendiente')
    });
  }
  
  else if (path === '/api/auth/login' && method === 'POST') {
    console.log('🔐 Login attempt received');
    parseBody(req, (err, body) => {
      if (err) {
        console.log('❌ Error parsing body:', err);
        sendJSON(res, 400, { success: false, message: 'Body inválido' });
        return;
      }
      
      console.log('📝 Login data received:', body);
      const { email, password } = body;
      const usuario = MOCK_DATA.usuarios.find(u => u.email === email && u.password === password);
      
      if (usuario) {
        console.log('✅ Login successful for:', email);
        sendJSON(res, 200, {
          success: true,
          message: 'Login exitoso',
          token: 'mock_jwt_token_123456',
          user: {
            id: usuario.id,
            email: usuario.email,
            nombre: usuario.nombre,
            rol: usuario.rol
          }
        });
      } else {
        console.log('❌ Login failed for:', email);
        sendJSON(res, 401, {
          success: false,
          message: 'Credenciales inválidas'
        });
      }
    });
  }
  
  else if (path === '/api/visitantes' && method === 'GET') {
    sendJSON(res, 200, {
      success: true,
      data: MOCK_DATA.visitantes,
      total: MOCK_DATA.visitantes.length
    });
  }
  
  else if (path === '/api/reportes/dashboard' && method === 'GET') {
    sendJSON(res, 200, {
      success: true,
      data: {
        kpis: {
          accesos_hoy: 45,
          visitantes_activos: 8,
          alertas_pendientes: 2,
          ocupacion_actual: 75
        },
        graficos: {
          accesos_por_hora: [
            { hora: '08:00', cantidad: 15 },
            { hora: '09:00', cantidad: 25 },
            { hora: '10:00', cantidad: 18 },
            { hora: '11:00', cantidad: 22 }
          ],
          edificios_mas_visitados: [
            { edificio: 'Torre Central', visitas: 45 },
            { edificio: 'Edificio Norte', visitas: 32 },
            { edificio: 'Edificio Sur', visitas: 28 }
          ]
        }
      }
    });
  }
  
  // Nuevo endpoint para generar QR
  else if (path === '/api/validation/qr/generate' && method === 'POST') {
    parseBody(req, (err, body) => {
      if (err) {
        sendJSON(res, 400, { success: false, message: 'Body inválido' });
        return;
      }
      
      const { personaId, edificioId } = body;
      if (!personaId || !edificioId) {
        sendJSON(res, 400, { success: false, message: 'personaId y edificioId requeridos' });
        return;
      }
      
      // Simular generación de QR
      const qrCode = Buffer.from(JSON.stringify({
        pid: personaId,
        eid: edificioId,
        ts: Date.now(),
        exp: Date.now() + 24 * 60 * 60 * 1000
      })).toString('base64');
      
      sendJSON(res, 200, {
        success: true,
        data: {
          qrCode: qrCode,
          qrImage: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==`,
          personaId: personaId,
          edificioId: edificioId,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        },
        message: 'Código QR generado exitosamente'
      });
    });
  }
  
  // Nuevo endpoint para validar QR
  else if (path === '/api/validation/qr/validate' && method === 'POST') {
    parseBody(req, (err, body) => {
      if (err) {
        sendJSON(res, 400, { success: false, message: 'Body inválido' });
        return;
      }
      
      const { qrCode } = body;
      if (!qrCode) {
        sendJSON(res, 400, { success: false, message: 'Código QR requerido' });
        return;
      }
      
      try {
        const qrData = JSON.parse(Buffer.from(qrCode, 'base64').toString());
        const isValid = qrData.exp > Date.now();
        
        if (isValid) {
          sendJSON(res, 200, {
            success: true,
            data: {
              personaId: qrData.pid,
              edificioId: qrData.eid,
              validUntil: new Date(qrData.exp).toISOString()
            },
            message: 'QR válido - Acceso autorizado'
          });
        } else {
          sendJSON(res, 400, {
            success: false,
            message: 'QR expirado',
            code: 'QR_EXPIRED'
          });
        }
      } catch (error) {
        sendJSON(res, 400, {
          success: false,
          message: 'QR inválido',
          code: 'QR_INVALID'
        });
      }
    });
  }
  
  // Endpoint para simular validación facial
  else if (path === '/api/validation/face/validate' && method === 'POST') {
    parseBody(req, (err, body) => {
      if (err) {
        sendJSON(res, 400, { success: false, message: 'Body inválido' });
        return;
      }
      
      const { personaId, faceImage } = body;
      if (!personaId) {
        sendJSON(res, 400, { success: false, message: 'personaId requerido' });
        return;
      }
      
      // Simular validación facial (85% de éxito)
      const isValid = Math.random() > 0.15;
      const confidence = Math.random() * 0.3 + 0.7;
      
      if (isValid) {
        sendJSON(res, 200, {
          success: true,
          data: {
            personaId: personaId,
            confidence: confidence,
            threshold: 0.85
          },
          message: 'Acceso autorizado por reconocimiento facial'
        });
      } else {
        sendJSON(res, 400, {
          success: false,
          message: `Reconocimiento fallido (similitud: ${(confidence * 100).toFixed(1)}%)`,
          data: {
            confidence: confidence,
            threshold: 0.85
          },
          code: 'FACE_NO_MATCH'
        });
      }
    });
  }
  
  // Endpoint para simular validación de documentos
  else if (path === '/api/validation/document/validate' && method === 'POST') {
    parseBody(req, (err, body) => {
      if (err) {
        sendJSON(res, 400, { success: false, message: 'Body inválido' });
        return;
      }
      
      const { personaId, documentType } = body;
      if (!personaId || !documentType) {
        sendJSON(res, 400, { success: false, message: 'personaId y documentType requeridos' });
        return;
      }
      
      // Simular validación de documento (90% de éxito)
      const isValid = Math.random() > 0.1;
      const confidence = Math.random() * 0.2 + 0.8;
      
      if (isValid) {
        sendJSON(res, 200, {
          success: true,
          data: {
            personaId: personaId,
            documentType: documentType,
            extractedData: {
              numero: '1234567890',
              nombre: 'Juan Pérez',
              fechaVencimiento: '2030-12-31'
            },
            confidence: confidence
          },
          message: 'Documento válido'
        });
      } else {
        sendJSON(res, 400, {
          success: false,
          message: 'Documento inválido o no se pudo procesar',
          data: {
            documentType: documentType,
            confidence: confidence
          },
          code: 'DOCUMENT_INVALID'
        });
      }
    });
  }
  
  else {
    sendJSON(res, 404, {
      success: false,
      message: `Ruta no encontrada: ${path}`,
      method: method,
      rutas_disponibles: [
        'GET /',
        'GET /health',
        'GET /api/test/datos',
        'POST /api/auth/login',
        'GET /api/visitantes',
        'GET /api/reportes/dashboard'
      ]
    });
  }
});

server.listen(PORT, () => {
  console.log(`
🚀 ========================================
   UnionTech API Server (HTTP Puro)
========================================
✅ Servidor funcionando en puerto ${PORT}
🌐 URL: http://localhost:${PORT}
🔗 Health: http://localhost:${PORT}/health
🧪 Test: http://localhost:${PORT}/api/test/datos
📊 Dashboard: http://localhost:${PORT}/api/reportes/dashboard
========================================
📝 Para probar el login:
   POST /api/auth/login
   Body: {"email":"admin@uniontech.com","password":"admin123"}
========================================
🎯 Todas las APIs están funcionando con datos mock
💡 El sistema está listo para pruebas!
========================================
  `);
});

server.on('error', (err) => {
  console.error('❌ Error del servidor:', err);
});

module.exports = server;
