const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth-simple');
const { body, validationResult } = require('express-validator');
const notificationService = require('../services/notificationService');
const qrService = require('../services/qrService');
const databaseService = require('../services/databaseService');

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

// Simulación de base de datos de visitantes (temporal hasta integración con Prisma)
let VISITANTES_DB = [
  {
    id: 1,
    nombre: 'Juan Pérez',
    dni: '12345678',
    telefono: '+5491123456789',
    email: 'juan.perez@email.com',
    empresa: 'TechCorp',
    anfitrion_id: 1,
    anfitrion_nombre: 'María García',
    edificio: 'Torre Central',
    fecha_visita: new Date(),
    hora_estimada: '14:00',
    motivo: 'Reunión de negocios',
    estado: 'pendiente', // pendiente, autorizado, rechazado, en_curso, finalizado
    codigo_qr: null,
    fecha_creacion: new Date(),
    fecha_autorizacion: null,
    observaciones: ''
  }
];

let visitanteIdCounter = 2;

// GET /api/visitantes - Listar visitantes con filtros avanzados
router.get('/', auth, async (req, res) => {
  try {
    const { 
      estado, 
      edificio, 
      fecha_desde, 
      fecha_hasta, 
      anfitrion_id,
      search,
      page = 1,
      limit = 20
    } = req.query;
    
    // Construir filtros para base de datos
    const filter = {};
    
    if (estado) {
      filter.estado = estado;
    }
    
    if (fecha_desde || fecha_hasta) {
      filter.fecha_visita = {};
      if (fecha_desde) filter.fecha_visita.gte = new Date(fecha_desde);
      if (fecha_hasta) filter.fecha_visita.lte = new Date(fecha_hasta);
    }
    
    // Obtener invitaciones de la base de datos
    let invitaciones = await databaseService.findInvitaciones(filter);
    
    // Si está vacío, usar datos mock de visitantes
    if (invitaciones.length === 0) {
      invitaciones = [...VISITANTES_DB];
    }
    
    // Aplicar filtros adicionales (búsqueda, edificio, etc.)
    if (edificio) {
      invitaciones = invitaciones.filter(i => 
        (i.edificio && i.edificio.toLowerCase().includes(edificio.toLowerCase())) ||
        (i.restricciones && i.restricciones.toLowerCase().includes(edificio.toLowerCase()))
      );
    }
    
    if (anfitrion_id) {
      invitaciones = invitaciones.filter(i => 
        i.anfitrion_id == anfitrion_id
      );
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      invitaciones = invitaciones.filter(i => {
        const nombre = i.nombre || (i.persona && i.persona.nombre) || '';
        const apellido = i.apellido || (i.persona && i.persona.apellido) || '';
        const documento = i.dni || (i.persona && i.persona.documento_identidad) || '';
        
        return nombre.toLowerCase().includes(searchLower) ||
               apellido.toLowerCase().includes(searchLower) ||
               documento.includes(search);
      });
    }
    
    // Paginación
    const offset = (page - 1) * limit;
    const invitacionesPaginadas = invitaciones.slice(offset, offset + parseInt(limit));
    
    // Estadísticas
    const estadisticas = {
      pendientes: invitaciones.filter(i => i.estado === 'pendiente').length,
      autorizados: invitaciones.filter(i => i.estado === 'autorizado').length,
      en_curso: invitaciones.filter(i => i.estado === 'en_curso').length,
      finalizados: invitaciones.filter(i => i.estado === 'finalizado').length
    };
    
    res.json({
      success: true,
      data: {
        visitantes: invitacionesPaginadas,
        total: invitaciones.length,
        page: parseInt(page),
        pages: Math.ceil(invitaciones.length / limit),
        estadisticas,
        database_status: await databaseService.healthCheck()
      }
    });

  } catch (error) {
    console.error('Error obteniendo visitantes:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// POST /api/visitantes - Crear nueva visita/invitación
router.post('/', [
  auth,
  body('nombre').notEmpty().withMessage('Nombre del visitante es requerido'),
  body('dni').notEmpty().withMessage('DNI del visitante es requerido'),
  body('telefono').optional().isMobilePhone().withMessage('Teléfono debe ser válido'),
  body('email').optional().isEmail().withMessage('Email debe ser válido'),
  body('anfitrion_id').isInt().withMessage('ID de anfitrión válido requerido'),
  body('edificio').notEmpty().withMessage('Edificio es requerido'),
  body('motivo').notEmpty().withMessage('Motivo de la visita es requerido'),
  body('documentos_requeridos').optional().isArray().withMessage('Documentos requeridos debe ser un array'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { 
      nombre, 
      dni, 
      telefono, 
      email, 
      empresa,
      anfitrion_id,
      anfitrion_nombre,
      edificio,
      fecha_visita,
      hora_estimada,
      motivo,
      observaciones = '',
      documentos_requeridos = ['IDENTIFICACION'] // Por defecto requiere identificación
    } = req.body;
    
    // Verificar que no exista visitante duplicado para el mismo día
    const fechaVisita = fecha_visita ? new Date(fecha_visita) : new Date();
    const visitanteExistente = VISITANTES_DB.find(v => 
      v.dni === dni && 
      new Date(v.fecha_visita).toDateString() === fechaVisita.toDateString() &&
      ['pendiente', 'autorizado', 'en_curso'].includes(v.estado)
    );
    
    if (visitanteExistente) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una visita activa para este visitante en la fecha seleccionada'
      });
    }
    
    const nuevoVisitante = {
      id: visitanteIdCounter++,
      nombre,
      dni,
      telefono: telefono || null,
      email: email || null,
      empresa: empresa || null,
      anfitrion_id,
      anfitrion_nombre: anfitrion_nombre || 'Anfitrión',
      edificio,
      fecha_visita: fechaVisita,
      hora_estimada: hora_estimada || '09:00',
      motivo,
      estado: 'pendiente',
      codigo_qr: null,
      fecha_creacion: new Date(),
      fecha_autorizacion: null,
      observaciones,
      documentos_requeridos: JSON.stringify(documentos_requeridos),
      documentos_completados: false,
      estado_documentos: 'PENDIENTE'
    };
    
    VISITANTES_DB.push(nuevoVisitante);
    
    // Enviar notificación al anfitrión
    try {
      const documentosTexto = documentos_requeridos.length > 0 
        ? `\n📋 *Documentos requeridos:* ${documentos_requeridos.join(', ')}`
        : '';

      const mensajeAnfitrion = `🏢 *UnionTech - Nueva Solicitud de Visita*

👤 *Visitante:* ${nombre}
🆔 *DNI:* ${dni}
🏢 *Empresa:* ${empresa || 'No especificada'}
📅 *Fecha:* ${fechaVisita.toLocaleDateString()}
⏰ *Hora estimada:* ${hora_estimada}
🎯 *Motivo:* ${motivo}${documentosTexto}

⚠️ *Importante:* El visitante debe subir los documentos requeridos antes del acceso.

Para autorizar esta visita, responde:
✅ *AUTORIZAR* - Para permitir el acceso
❌ *RECHAZAR* - Para denegar el acceso

_ID de solicitud: ${nuevoVisitante.id}_`;

      // En un sistema real, obtendrías el teléfono del anfitrión de la BD
      const telefonoAnfitrion = '+5491123456789'; // Temporal
      
      await notificationService.enviarWhatsApp(telefonoAnfitrion, mensajeAnfitrion);
      
    } catch (notificationError) {
      console.error('Error enviando notificación:', notificationError);
      // No fallar la creación por error de notificación
    }
    
    res.status(201).json({
      success: true,
      message: 'Visitante registrado exitosamente. Notificación enviada al anfitrión.',
      data: nuevoVisitante,
      documentos_info: {
        requeridos: documentos_requeridos,
        completados: false,
        estado: 'PENDIENTE',
        mensaje: 'El visitante debe subir los documentos requeridos para completar el registro'
      }
    });
    
  } catch (error) {
    console.error('Error creando visitante:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// GET /api/visitantes/:id - Obtener visitante específico
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const visitante = VISITANTES_DB.find(v => v.id == id);
    
    if (!visitante) {
      return res.status(404).json({
        success: false,
        message: 'Visitante no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: visitante
    });
    
  } catch (error) {
    console.error('Error obteniendo visitante:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// PUT /api/visitantes/:id/autorizar - Autorizar visita
router.put('/:id/autorizar', [
  auth,
  body('autorizado').isBoolean().withMessage('El campo autorizado debe ser true o false'),
  body('observaciones').optional().isString(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { id } = req.params;
    const { autorizado, observaciones = '' } = req.body;
    
    const visitanteIndex = VISITANTES_DB.findIndex(v => v.id == id);
    
    if (visitanteIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Visitante no encontrado'
      });
    }
    
    const visitante = VISITANTES_DB[visitanteIndex];
    
    if (visitante.estado !== 'pendiente') {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden autorizar visitas pendientes'
      });
    }
    
    // Actualizar estado
    VISITANTES_DB[visitanteIndex] = {
      ...visitante,
      estado: autorizado ? 'autorizado' : 'rechazado',
      fecha_autorizacion: new Date(),
      observaciones: observaciones
    };
    
    // Si fue autorizado, generar código QR
    if (autorizado) {
      try {
        const qrData = {
          visitanteId: visitante.id,
          nombre: visitante.nombre,
          dni: visitante.dni,
          edificio: visitante.edificio,
          fechaVisita: visitante.fecha_visita,
          tipo: 'visitante'
        };
        
        const codigoQR = await qrService.generarQR(qrData);
        VISITANTES_DB[visitanteIndex].codigo_qr = codigoQR;
        
        // Enviar código QR al visitante
        if (visitante.telefono) {
          const mensajeVisitante = `🎉 *Acceso Autorizado - UnionTech*

¡Hola ${visitante.nombre}!

Tu visita ha sido autorizada:
🏢 *Edificio:* ${visitante.edificio}
📅 *Fecha:* ${new Date(visitante.fecha_visita).toLocaleDateString()}
⏰ *Hora:* ${visitante.hora_estimada}
👤 *Anfitrión:* ${visitante.anfitrion_nombre}

📱 *Código QR:* ${codigoQR.id}

Presenta este mensaje en recepción para obtener acceso.

_¡Te esperamos!_`;

          await notificationService.enviarWhatsApp(visitante.telefono, mensajeVisitante);
        }
        
        if (visitante.email) {
          const asuntoEmail = `Acceso Autorizado - ${visitante.edificio}`;
          const contenidoEmail = `
            <h2>🎉 Acceso Autorizado - UnionTech</h2>
            <p>¡Hola ${visitante.nombre}!</p>
            <p>Tu visita ha sido autorizada:</p>
            <ul>
              <li><strong>Edificio:</strong> ${visitante.edificio}</li>
              <li><strong>Fecha:</strong> ${new Date(visitante.fecha_visita).toLocaleDateString()}</li>
              <li><strong>Hora:</strong> ${visitante.hora_estimada}</li>
              <li><strong>Anfitrión:</strong> ${visitante.anfitrion_nombre}</li>
            </ul>
            <p><strong>Código QR:</strong> ${codigoQR.id}</p>
            <p>Presenta este email en recepción para obtener acceso.</p>
            <p>¡Te esperamos!</p>
          `;
          
          await notificationService.enviarEmail(
            visitante.email, 
            asuntoEmail, 
            contenidoEmail, 
            true
          );
        }
        
      } catch (qrError) {
        console.error('Error generando QR:', qrError);
        // No fallar la autorización por error en QR
      }
    } else {
      // Notificar rechazo
      if (visitante.telefono) {
        const mensajeRechazo = `❌ *Acceso Denegado - UnionTech*

Hola ${visitante.nombre},

Lamentamos informarte que tu solicitud de visita ha sido denegada.

📅 *Fecha solicitada:* ${new Date(visitante.fecha_visita).toLocaleDateString()}
🏢 *Edificio:* ${visitante.edificio}

${observaciones ? `*Motivo:* ${observaciones}` : ''}

Para más información, contacta a tu anfitrión.`;

        await notificationService.enviarWhatsApp(visitante.telefono, mensajeRechazo);
      }
    }
    
    res.json({
      success: true,
      message: autorizado ? 'Visita autorizada exitosamente' : 'Visita rechazada',
      data: VISITANTES_DB[visitanteIndex]
    });
    
  } catch (error) {
    console.error('Error autorizando visitante:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// PUT /api/visitantes/:id/checkin - Registrar llegada
router.put('/:id/checkin', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const visitanteIndex = VISITANTES_DB.findIndex(v => v.id == id);
    
    if (visitanteIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Visitante no encontrado'
      });
    }
    
    const visitante = VISITANTES_DB[visitanteIndex];
    
    if (visitante.estado !== 'autorizado') {
      return res.status(400).json({
        success: false,
        message: 'Solo se puede hacer check-in de visitas autorizadas'
      });
    }
    
    VISITANTES_DB[visitanteIndex] = {
      ...visitante,
      estado: 'en_curso',
      hora_llegada: new Date()
    };
    
    res.json({
      success: true,
      message: 'Check-in realizado exitosamente',
      data: VISITANTES_DB[visitanteIndex]
    });
    
  } catch (error) {
    console.error('Error en check-in:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// PUT /api/visitantes/:id/checkout - Registrar salida
router.put('/:id/checkout', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const visitanteIndex = VISITANTES_DB.findIndex(v => v.id == id);
    
    if (visitanteIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Visitante no encontrado'
      });
    }
    
    const visitante = VISITANTES_DB[visitanteIndex];
    
    if (visitante.estado !== 'en_curso') {
      return res.status(400).json({
        success: false,
        message: 'Solo se puede hacer check-out de visitas en curso'
      });
    }
    
    VISITANTES_DB[visitanteIndex] = {
      ...visitante,
      estado: 'finalizado',
      hora_salida: new Date()
    };
    
    res.json({
      success: true,
      message: 'Check-out realizado exitosamente',
      data: VISITANTES_DB[visitanteIndex]
    });
    
  } catch (error) {
    console.error('Error en check-out:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// DELETE /api/visitantes/:id - Cancelar visita
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const visitanteIndex = VISITANTES_DB.findIndex(v => v.id == id);
    
    if (visitanteIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Visitante no encontrado'
      });
    }
    
    const visitante = VISITANTES_DB[visitanteIndex];
    
    if (['en_curso', 'finalizado'].includes(visitante.estado)) {
      return res.status(400).json({
        success: false,
        message: 'No se pueden cancelar visitas en curso o finalizadas'
      });
    }
    
    VISITANTES_DB.splice(visitanteIndex, 1);
    
    res.json({
      success: true,
      message: 'Visita cancelada exitosamente'
    });
    
  } catch (error) {
    console.error('Error cancelando visita:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// GET /api/visitantes/estadisticas/resumen - Estadísticas de visitantes
router.get('/estadisticas/resumen', auth, async (req, res) => {
  try {
    const { periodo = '7d' } = req.query;
    
    // Calcular fecha de inicio según período
    let fechaInicio = new Date();
    switch (periodo) {
      case '1d':
        fechaInicio.setDate(fechaInicio.getDate() - 1);
        break;
      case '7d':
        fechaInicio.setDate(fechaInicio.getDate() - 7);
        break;
      case '30d':
        fechaInicio.setDate(fechaInicio.getDate() - 30);
        break;
      case '90d':
        fechaInicio.setDate(fechaInicio.getDate() - 90);
        break;
      default:
        fechaInicio.setDate(fechaInicio.getDate() - 7);
    }
    
    const visitantesPeriodo = VISITANTES_DB.filter(v => 
      new Date(v.fecha_creacion) >= fechaInicio
    );
    
    const estadisticas = {
      periodo,
      total_visitantes: visitantesPeriodo.length,
      por_estado: {
        pendientes: visitantesPeriodo.filter(v => v.estado === 'pendiente').length,
        autorizados: visitantesPeriodo.filter(v => v.estado === 'autorizado').length,
        rechazados: visitantesPeriodo.filter(v => v.estado === 'rechazado').length,
        en_curso: visitantesPeriodo.filter(v => v.estado === 'en_curso').length,
        finalizados: visitantesPeriodo.filter(v => v.estado === 'finalizado').length
      },
      por_edificio: {},
      tasa_autorizacion: 0
    };
    
    // Estadísticas por edificio
    visitantesPeriodo.forEach(v => {
      if (!estadisticas.por_edificio[v.edificio]) {
        estadisticas.por_edificio[v.edificio] = 0;
      }
      estadisticas.por_edificio[v.edificio]++;
    });
    
    // Calcular tasa de autorización
    const totalProcesados = estadisticas.por_estado.autorizados + estadisticas.por_estado.rechazados;
    if (totalProcesados > 0) {
      estadisticas.tasa_autorizacion = Math.round(
        (estadisticas.por_estado.autorizados / totalProcesados) * 100
      );
    }
    
    res.json({
      success: true,
      data: estadisticas
    });
    
  } catch (error) {
    console.error('Error generando estadísticas:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

module.exports = router;
