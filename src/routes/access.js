const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth-simple');
const { generateQRId, generateAccessId, QR_CODES_DB, ACCESSES_DB } = require('../data/mockData');
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

// POST /api/access/generate - Generar código QR de acceso
router.post('/generate', [
  auth,
  body('visitorName').notEmpty().withMessage('Nombre del visitante es requerido'),
  body('building').notEmpty().withMessage('Edificio es requerido')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: errors.array()
    });
  }

  try {
    const { visitorName, building, expiryDate, accessType = 'visitor' } = req.body;
    
    // Generar nuevo código QR
    const qrId = generateQRId();
    const accessId = generateAccessId();
    
    const newQR = {
      id: qrId,
      visitor: visitorName,
      building: building,
      created: new Date(),
      expiry: expiryDate ? new Date(expiryDate) : new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas por defecto
      status: 'active',
      type: accessType,
      accessId: accessId
    };

    // Agregar a la "base de datos" simulada
    QR_CODES_DB.push(newQR);

    console.log(`✅ QR generado: ${qrId} para ${visitorName}`);

    res.json({
      success: true,
      message: 'Código QR generado exitosamente',
      data: {
        qrId: qrId,
        accessId: accessId,
        visitor: visitorName,
        building: building,
        expiry: newQR.expiry,
        qrData: JSON.stringify({
          id: qrId,
          visitor: visitorName,
          building: building,
          created: newQR.created,
          expiry: newQR.expiry
        })
      }
    });

  } catch (error) {
    console.error('Error generando QR:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/access/validate-qr - Validar acceso por código QR
router.post('/validate-qr', [
  auth,
  body('codigoQR').notEmpty().withMessage('Código QR requerido'),
  body('ubicacion').notEmpty().withMessage('Ubicación requerida'),
  body('dispositivoId').optional().isString(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { codigoQR, ubicacion, dispositivoId } = req.body;
    
    const resultado = await accessValidationService.validarAccesoQR(
      codigoQR, 
      ubicacion, 
      dispositivoId
    );

    // Determinar código de respuesta HTTP según el resultado
    let statusCode = 200;
    if (resultado.acceso === 'denegado') {
      statusCode = resultado.motivo.includes('bloqueo') ? 429 : 403;
    }

    res.status(statusCode).json({
      success: resultado.acceso === 'autorizado',
      acceso: resultado.acceso,
      data: resultado
    });

  } catch (error) {
    console.error('Error validando QR:', error);
    res.status(500).json({
      success: false,
      message: 'Error validando acceso',
      error: error.message
    });
  }
});

// POST /api/access/validate-manual - Validar acceso manual
router.post('/validate-manual', [
  auth,
  body('visitante.nombre').notEmpty().withMessage('Nombre del visitante requerido'),
  body('visitante.dni').notEmpty().withMessage('DNI del visitante requerido'),
  body('visitante.telefono').optional().isMobilePhone().withMessage('Teléfono válido'),
  body('anfitrionId').isInt().withMessage('ID de anfitrión válido requerido'),
  body('ubicacion').notEmpty().withMessage('Ubicación requerida'),
  body('personalId').isInt().withMessage('ID de personal requerido'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { visitante, anfitrionId, ubicacion, personalId } = req.body;
    
    const resultado = await accessValidationService.validarAccesoManual(
      visitante,
      anfitrionId,
      ubicacion,
      personalId
    );

    res.json({
      success: resultado.acceso !== 'denegado',
      data: resultado
    });

  } catch (error) {
    console.error('Error validando acceso manual:', error);
    res.status(500).json({
      success: false,
      message: 'Error validando acceso manual',
      error: error.message
    });
  }
});

// POST /api/access/authorize - Autorizar/Denegar acceso pendiente
router.post('/authorize', [
  auth,
  body('accesoId').notEmpty().withMessage('ID de acceso requerido'),
  body('autorizado').isBoolean().withMessage('Decisión de autorización requerida'),
  body('motivo').optional().isString(),
  body('anfitrionId').isInt().withMessage('ID de anfitrión requerido'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { accesoId, autorizado, motivo, anfitrionId } = req.body;
    
    const resultado = await accessValidationService.responderAutorizacion(
      accesoId,
      autorizado,
      motivo,
      anfitrionId
    );

    res.json({
      success: resultado.success,
      message: resultado.success ? 
        `Acceso ${autorizado ? 'autorizado' : 'denegado'} exitosamente` :
        'Error procesando autorización',
      data: resultado
    });

  } catch (error) {
    console.error('Error autorizando acceso:', error);
    res.status(500).json({
      success: false,
      message: 'Error procesando autorización',
      error: error.message
    });
  }
});

// GET /api/access/status/:accesoId - Obtener estado de acceso
router.get('/status/:accesoId', auth, async (req, res) => {
  try {
    const { accesoId } = req.params;
    
    const estado = accessValidationService.obtenerEstadoAcceso(accesoId);
    
    if (!estado.encontrado) {
      return res.status(404).json({
        success: false,
        message: 'Acceso no encontrado',
        data: estado
      });
    }

    res.json({
      success: true,
      data: estado
    });

  } catch (error) {
    console.error('Error obteniendo estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estado del acceso',
      error: error.message
    });
  }
});

// GET /api/access/pending/:anfitrionId - Obtener accesos pendientes para anfitrión
router.get('/pending/:anfitrionId', auth, async (req, res) => {
  try {
    const { anfitrionId } = req.params;
    
    const accesosPendientes = accessValidationService.obtenerAccesosPendientes(
      parseInt(anfitrionId)
    );

    res.json({
      success: true,
      message: `${accesosPendientes.length} accesos pendientes`,
      data: {
        anfitrionId: parseInt(anfitrionId),
        total: accesosPendientes.length,
        accesos: accesosPendientes
      }
    });

  } catch (error) {
    console.error('Error obteniendo accesos pendientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo accesos pendientes',
      error: error.message
    });
  }
});

// POST /api/access/security-alert - Generar alerta de seguridad
router.post('/security-alert', [
  auth,
  body('tipo').notEmpty().withMessage('Tipo de alerta requerido'),
  body('descripcion').notEmpty().withMessage('Descripción requerida'),
  body('ubicacion').notEmpty().withMessage('Ubicación requerida'),
  body('personalIds').isArray().withMessage('Lista de personal requerida'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { tipo, descripcion, ubicacion, personalIds } = req.body;
    
    const resultado = await accessValidationService.generarAlertaSeguridad(
      tipo,
      descripcion,
      ubicacion,
      personalIds
    );

    res.json({
      success: resultado.success,
      message: resultado.success ? 
        'Alerta de seguridad enviada' : 
        'Error enviando alerta',
      data: resultado
    });

  } catch (error) {
    console.error('Error generando alerta:', error);
    res.status(500).json({
      success: false,
      message: 'Error generando alerta de seguridad',
      error: error.message
    });
  }
});

// POST /api/access/generate-bulk-qr - Generar códigos QR grupales
router.post('/generate-bulk-qr', [
  auth,
  body('visitantes').isArray().withMessage('Lista de visitantes requerida'),
  body('validoHasta').isISO8601().withMessage('Fecha de validez requerida'),
  body('evento').optional().isString(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { visitantes, validoHasta, evento } = req.body;
    
    const fechaValidez = new Date(validoHasta);
    
    if (fechaValidez <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'La fecha de validez debe ser futura'
      });
    }

    const resultado = await qrService.generarCodigosGrupales(
      visitantes,
      fechaValidez,
      evento
    );

    res.json({
      success: true,
      message: `${resultado.exitosos} códigos QR generados exitosamente`,
      data: resultado
    });

  } catch (error) {
    console.error('Error generando códigos grupales:', error);
    res.status(500).json({
      success: false,
      message: 'Error generando códigos QR grupales',
      error: error.message
    });
  }
});

// GET /api/access/validate-code - Validar código por URL (para QR scan)
router.get('/validate-code', async (req, res) => {
  try {
    const { codigo } = req.query;
    
    if (!codigo) {
      return res.status(400).json({
        success: false,
        message: 'Código requerido'
      });
    }

    const validacion = qrService.validarCodigo(codigo);
    
    res.json({
      success: validacion.valido,
      message: validacion.valido ? 'Código válido' : 'Código inválido',
      data: validacion
    });

  } catch (error) {
    console.error('Error validando código:', error);
    res.status(500).json({
      success: false,
      message: 'Error validando código',
      error: error.message
    });
  }
});

// GET /api/access/active - Obtener códigos QR activos
router.get('/active', auth, async (req, res) => {
  try {
    // Filtrar QRs activos (no expirados)
    const now = new Date();
    const activeQRs = QR_CODES_DB.filter(qr => 
      qr.status === 'active' && new Date(qr.expiry) > now
    );

    res.json({
      success: true,
      data: activeQRs,
      total: activeQRs.length
    });

  } catch (error) {
    console.error('Error obteniendo QRs activos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
