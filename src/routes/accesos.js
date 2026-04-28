const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

// Aplicar autenticación a todas las rutas
router.use(auth);

// GET /api/accesos - Listar registros de acceso
router.get('/', requirePermission('access.read'), async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, puerta_id, tipo_evento } = req.query;
    
    const where = {};
    if (fecha_desde && fecha_hasta) {
      where.fecha_hora = {
        gte: new Date(fecha_desde),
        lte: new Date(fecha_hasta)
      };
    }
    if (puerta_id) where.puerta_id = parseInt(puerta_id);
    if (tipo_evento) where.tipo_evento = tipo_evento;

    const registros = await req.prisma.registros_Acceso.findMany({
      where,
      include: {
        credencial: {
          include: {
            persona: true
          }
        },
        puerta: {
          include: {
            edificio: true
          }
        }
      },
      orderBy: { fecha_hora: 'desc' }
    });

    res.json(registros);
  } catch (error) {
    console.error('Error obteniendo registros de acceso:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/accesos - Registrar nuevo acceso
router.post('/', requirePermission('access.validate'), async (req, res) => {
  try {
    const { credencial_id, puerta_id, tipo_evento, metodo_validacion, motivo_denegacion } = req.body;
    
    const nuevoRegistro = await req.prisma.registros_Acceso.create({
      data: {
        credencial_id,
        puerta_id,
        fecha_hora: new Date(),
        tipo_evento,
        metodo_validacion,
        motivo_denegacion
      }
    });
    
    res.status(201).json(nuevoRegistro);
  } catch (error) {
    console.error('Error registrando acceso:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
