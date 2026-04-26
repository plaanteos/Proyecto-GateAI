const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');

class PersonasController {
  constructor() {
    this.prisma = new PrismaClient();
  }

  // Obtener todas las personas
  async getAll(req, res) {
    try {
      const { page = 1, limit = 10, activo, search } = req.query;
      const offset = (page - 1) * limit;

      const where = {};
      
      if (activo !== undefined) {
        where.activo = activo === 'true';
      }

      if (search) {
        where.OR = [
          { nombre: { contains: search, mode: 'insensitive' } },
          { apellido: { contains: search, mode: 'insensitive' } },
          { documento_identidad: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ];
      }

      const [personas, total] = await Promise.all([
        this.prisma.personas.findMany({
          where,
          skip: parseInt(offset),
          take: parseInt(limit),
          orderBy: { created_at: 'desc' }
        }),
        this.prisma.personas.count({ where })
      ]);

      res.json({
        success: true,
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
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obtener persona por ID
  async getById(req, res) {
    try {
      const { id } = req.params;

      const persona = await this.prisma.personas.findUnique({
        where: { id: parseInt(id) },
        include: {
          usuario: {
            select: {
              id: true,
              username: true,
              activo: true,
              rol: {
                select: {
                  nombre: true
                }
              }
            }
          },
          accesos: {
            take: 10,
            orderBy: { fecha_hora: 'desc' },
            include: {
              edificio: {
                select: {
                  nombre: true
                }
              }
            }
          }
        }
      });

      if (!persona) {
        return res.status(404).json({
          success: false,
          message: 'Persona no encontrada'
        });
      }

      res.json({
        success: true,
        data: persona
      });

    } catch (error) {
      console.error('Error obteniendo persona:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Crear nueva persona
  async create(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
      }

      const {
        documento_identidad,
        nombre,
        apellido,
        fecha_nacimiento,
        telefono,
        email
      } = req.body;

      // Verificar si ya existe una persona con ese documento
      const existingPersona = await this.prisma.personas.findUnique({
        where: { documento_identidad }
      });

      if (existingPersona) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe una persona con ese documento de identidad'
        });
      }

      const newPersona = await this.prisma.personas.create({
        data: {
          documento_identidad,
          nombre,
          apellido,
          fecha_nacimiento: fecha_nacimiento ? new Date(fecha_nacimiento) : null,
          telefono,
          email,
          activo: true
        }
      });

      res.status(201).json({
        success: true,
        message: 'Persona creada exitosamente',
        data: newPersona
      });

    } catch (error) {
      console.error('Error creando persona:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Actualizar persona
  async update(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
      }

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

      // Verificar si la persona existe
      const existingPersona = await this.prisma.personas.findUnique({
        where: { id: parseInt(id) }
      });

      if (!existingPersona) {
        return res.status(404).json({
          success: false,
          message: 'Persona no encontrada'
        });
      }

      // Verificar si el documento ya existe en otra persona
      if (documento_identidad && documento_identidad !== existingPersona.documento_identidad) {
        const duplicateDoc = await this.prisma.personas.findUnique({
          where: { documento_identidad }
        });

        if (duplicateDoc) {
          return res.status(400).json({
            success: false,
            message: 'Ya existe otra persona con ese documento de identidad'
          });
        }
      }

      const updatedPersona = await this.prisma.personas.update({
        where: { id: parseInt(id) },
        data: {
          documento_identidad,
          nombre,
          apellido,
          fecha_nacimiento: fecha_nacimiento ? new Date(fecha_nacimiento) : undefined,
          telefono,
          email,
          activo,
          updated_at: new Date()
        }
      });

      res.json({
        success: true,
        message: 'Persona actualizada exitosamente',
        data: updatedPersona
      });

    } catch (error) {
      console.error('Error actualizando persona:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Eliminar persona (soft delete)
  async delete(req, res) {
    try {
      const { id } = req.params;

      const persona = await this.prisma.personas.findUnique({
        where: { id: parseInt(id) }
      });

      if (!persona) {
        return res.status(404).json({
          success: false,
          message: 'Persona no encontrada'
        });
      }

      await this.prisma.personas.update({
        where: { id: parseInt(id) },
        data: {
          activo: false,
          deleted_at: new Date()
        }
      });

      res.json({
        success: true,
        message: 'Persona eliminada exitosamente'
      });

    } catch (error) {
      console.error('Error eliminando persona:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener estadísticas de personas
  async getStats(req, res) {
    try {
      const [total, activas, inactivas, conUsuario] = await Promise.all([
        this.prisma.personas.count(),
        this.prisma.personas.count({ where: { activo: true } }),
        this.prisma.personas.count({ where: { activo: false } }),
        this.prisma.personas.count({
          where: {
            usuario: {
              isNot: null
            }
          }
        })
      ]);

      res.json({
        success: true,
        data: {
          total,
          activas,
          inactivas,
          conUsuario,
          sinUsuario: total - conUsuario
        }
      });

    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}

module.exports = new PersonasController();
