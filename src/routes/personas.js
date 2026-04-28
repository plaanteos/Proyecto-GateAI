const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

// Aplicar autenticación a todas las rutas
router.use(auth);

// GET /api/personas - Listar todas las personas
router.get('/', requirePermission('users.read'), async (req, res) => {
  try {
    const { page = 1, limit = 10, activo } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (activo !== undefined) {
      where.activo = activo === 'true';
    }

    const personas = await req.prisma.personas.findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
      include: {
        credenciales: true,
        fotos: true,
        niveles_acceso: {
          include: {
            nivel: true
          }
        }
      }
    });

    const total = await req.prisma.personas.count({ where });

    res.json({
      data: personas,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error obteniendo personas:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/personas/:id - Obtener persona por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const persona = await req.prisma.personas.findUnique({
      where: { id: parseInt(id) },
      include: {
        credenciales: true,
        fotos: true,
        niveles_acceso: {
          include: {
            nivel: true
          }
        },
        invitaciones: true
      }
    });

    if (!persona) {
      return res.status(404).json({
        error: 'Persona no encontrada'
      });
    }

    res.json(persona);

  } catch (error) {
    console.error('Error obteniendo persona:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/personas - Crear nueva persona
router.post('/', async (req, res) => {
  try {
    const {
      documento_identidad,
      nombre,
      apellido,
      fecha_nacimiento,
      telefono,
      email
    } = req.body;

    if (!documento_identidad || !nombre || !apellido) {
      return res.status(400).json({
        error: 'Documento de identidad, nombre y apellido son requeridos'
      });
    }

    const nuevaPersona = await req.prisma.personas.create({
      data: {
        documento_identidad,
        nombre,
        apellido,
        fecha_nacimiento: fecha_nacimiento ? new Date(fecha_nacimiento) : null,
        telefono,
        email
      }
    });

    // Registrar en auditoría
    await req.prisma.auditoria.create({
      data: {
        accion: 'CREAR_PERSONA',
        descripcion: `Persona creada: ${nombre} ${apellido} (${documento_identidad})`
      }
    });

    res.status(201).json(nuevaPersona);

  } catch (error) {
    console.error('Error creando persona:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({
        error: 'Ya existe una persona con ese documento de identidad'
      });
    }
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// PUT /api/personas/:id - Actualizar persona
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      documento_identidad,
      nombre,
      apellido,
      fecha_nacimiento,
      telefono,
      email,
      activo
    } = req.body;

    const personaActualizada = await req.prisma.personas.update({
      where: { id: parseInt(id) },
      data: {
        documento_identidad,
        nombre,
        apellido,
        fecha_nacimiento: fecha_nacimiento ? new Date(fecha_nacimiento) : null,
        telefono,
        email,
        activo,
        updated_at: new Date()
      }
    });

    // Registrar en auditoría
    await req.prisma.auditoria.create({
      data: {
        accion: 'ACTUALIZAR_PERSONA',
        descripcion: `Persona actualizada: ${nombre} ${apellido} (ID: ${id})`
      }
    });

    res.json(personaActualizada);

  } catch (error) {
    console.error('Error actualizando persona:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'Persona no encontrada'
      });
    }
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// DELETE /api/personas/:id - Eliminar (soft delete) persona
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const personaEliminada = await req.prisma.personas.update({
      where: { id: parseInt(id) },
      data: {
        activo: false,
        deleted_at: new Date()
      }
    });

    // Registrar en auditoría
    await req.prisma.auditoria.create({
      data: {
        accion: 'ELIMINAR_PERSONA',
        descripcion: `Persona eliminada: ID ${id}`
      }
    });

    res.json({
      message: 'Persona eliminada exitosamente',
      persona: personaEliminada
    });

  } catch (error) {
    console.error('Error eliminando persona:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'Persona no encontrada'
      });
    }
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;
