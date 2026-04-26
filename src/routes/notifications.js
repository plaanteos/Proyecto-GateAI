const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth-simple');
const notificationService = require('../services/notificationService');
const { body, validationResult } = require('express-validator');

// Middleware para validación de errores
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: errors.array()
    });
  }
  next();
};

// POST /api/notifications/whatsapp - Enviar WhatsApp directo
router.post('/whatsapp', [
  auth,
  body('telefono').notEmpty().withMessage('El teléfono es requerido'),
  body('mensaje').notEmpty().withMessage('El mensaje es requerido'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { telefono, mensaje } = req.body;
    
    const resultado = await notificationService.enviarWhatsApp(telefono, mensaje);
    
    res.json({
      success: true,
      message: 'WhatsApp procesado',
      data: resultado
    });

  } catch (error) {
    console.error('Error enviando WhatsApp:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// POST /api/notifications/email - Enviar Email directo
router.post('/email', [
  auth,
  body('destinatario').isEmail().withMessage('Email válido requerido'),
  body('asunto').notEmpty().withMessage('El asunto es requerido'),
  body('contenido').notEmpty().withMessage('El contenido es requerido'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { destinatario, asunto, contenido, esHTML = false } = req.body;
    
    const resultado = await notificationService.enviarEmail(
      destinatario, 
      asunto, 
      contenido, 
      esHTML
    );
    
    res.json({
      success: true,
      message: 'Email procesado',
      data: resultado
    });

  } catch (error) {
    console.error('Error enviando email:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// POST /api/notifications/visitante/llegada - Notificar llegada de visitante
router.post('/visitante/llegada', [
  auth,
  body('anfitrionId').isInt().withMessage('ID de anfitrión válido requerido'),
  body('visitante.nombre').notEmpty().withMessage('Nombre del visitante requerido'),
  body('visitante.dni').notEmpty().withMessage('DNI del visitante requerido'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { anfitrionId, visitante } = req.body;
    
    // Aquí normalmente consultarías la base de datos para obtener datos del anfitrión
    // Como ejemplo, simularemos los datos:
    const anfitrion = {
      id: anfitrionId,
      nombre: 'Anfitrión Ejemplo',
      telefono: '+5491123456789', // Deberías obtener esto de la BD
      email: 'anfitrion@ejemplo.com' // Deberías obtener esto de la BD
    };
    
    const resultados = await notificationService.notificarLlegadaVisitante(
      anfitrion, 
      visitante
    );
    
    res.json({
      success: true,
      message: 'Notificaciones de llegada enviadas',
      data: {
        anfitrion: anfitrion.nombre,
        visitante: visitante.nombre,
        notificaciones: resultados
      }
    });

  } catch (error) {
    console.error('Error notificando llegada:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// POST /api/notifications/acceso/resultado - Notificar resultado de acceso
router.post('/acceso/resultado', [
  auth,
  body('destinatario.telefono').optional().isMobilePhone().withMessage('Teléfono válido'),
  body('destinatario.email').optional().isEmail().withMessage('Email válido'),
  body('autorizado').isBoolean().withMessage('Estado de autorización requerido'),
  body('motivo').optional().isString(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { destinatario, autorizado, motivo } = req.body;
    
    const resultados = await notificationService.notificarResultadoAcceso(
      destinatario, 
      autorizado, 
      motivo
    );
    
    res.json({
      success: true,
      message: 'Notificación de resultado enviada',
      data: {
        autorizado,
        motivo,
        notificaciones: resultados
      }
    });

  } catch (error) {
    console.error('Error notificando resultado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// POST /api/notifications/codigo-acceso - Enviar código QR de acceso
router.post('/codigo-acceso', [
  auth,
  body('destinatario.telefono').optional().isMobilePhone().withMessage('Teléfono válido'),
  body('destinatario.email').optional().isEmail().withMessage('Email válido'),
  body('codigoQR').notEmpty().withMessage('Código QR requerido'),
  body('validoHasta').isISO8601().withMessage('Fecha válida requerida'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { destinatario, codigoQR, validoHasta } = req.body;
    
    const fechaValidez = new Date(validoHasta);
    
    const resultados = await notificationService.enviarCodigoAcceso(
      destinatario, 
      codigoQR, 
      fechaValidez
    );
    
    res.json({
      success: true,
      message: 'Código de acceso enviado',
      data: {
        codigoQR,
        validoHasta: fechaValidez,
        notificaciones: resultados
      }
    });

  } catch (error) {
    console.error('Error enviando código:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// POST /api/notifications/alerta-seguridad - Enviar alerta de seguridad
router.post('/alerta-seguridad', [
  auth,
  body('personalIds').isArray().withMessage('Lista de personal requerida'),
  body('tipo').notEmpty().withMessage('Tipo de alerta requerido'),
  body('descripcion').notEmpty().withMessage('Descripción requerida'),
  body('ubicacion').notEmpty().withMessage('Ubicación requerida'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { personalIds, tipo, descripcion, ubicacion } = req.body;
    
    // Aquí normalmente consultarías la base de datos para obtener el personal
    // Como ejemplo, simularemos los datos:
    const personal = personalIds.map(id => ({
      id,
      nombre: `Personal ${id}`,
      telefono: '+5491123456789', // Deberías obtener esto de la BD
      email: `personal${id}@uniontech.com` // Deberías obtener esto de la BD
    }));
    
    const resultados = await notificationService.enviarAlertaSeguridad(
      personal, 
      tipo, 
      descripcion, 
      ubicacion
    );
    
    res.json({
      success: true,
      message: 'Alerta de seguridad enviada',
      data: {
        tipo,
        descripcion,
        ubicacion,
        personalNotificado: personal.length,
        notificaciones: resultados
      }
    });

  } catch (error) {
    console.error('Error enviando alerta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/notifications/test - Endpoint de prueba
router.get('/test', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Servicio de notificaciones funcionando',
      servicios: {
        whatsapp: 'Twilio configurado',
        email: 'SendGrid configurado'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error en el servicio de notificaciones',
      error: error.message
    });
  }
});

module.exports = router;
