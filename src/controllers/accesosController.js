const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');
const crypto = require('crypto');
const QRCode = require('qrcode');

class AccesosController {
  constructor() {
    this.prisma = new PrismaClient();
  }

  // Generar código QR para acceso
  async generateQR(req, res) {
    try {
      const { persona_id, edificio_id, validez_minutos = 60 } = req.body;

      if (!persona_id || !edificio_id) {
        return res.status(400).json({
          success: false,
          message: 'persona_id y edificio_id son requeridos'
        });
      }

      // Verificar que la persona y edificio existan
      const [persona, edificio] = await Promise.all([
        this.prisma.personas.findUnique({ where: { id: persona_id } }),
        this.prisma.edificios.findUnique({ where: { id: edificio_id } })
      ]);

      if (!persona || !edificio) {
        return res.status(404).json({
          success: false,
          message: 'Persona o edificio no encontrado'
        });
      }

      // Generar código único
      const codigoUnico = crypto.randomUUID();
      const fechaExpiracion = new Date(Date.now() + validez_minutos * 60 * 1000);

      // Crear registro de acceso
      const nuevoAcceso = await this.prisma.accesos.create({
        data: {
          persona_id,
          edificio_id,
          codigo_qr: codigoUnico,
          fecha_expiracion: fechaExpiracion,
          estado: 'pendiente',
          tipo_acceso: 'qr',
          generado_por: req.user.id
        },
        include: {
          persona: {
            select: {
              nombre: true,
              apellido: true,
              documento_identidad: true
            }
          },
          edificio: {
            select: {
              nombre: true,
              direccion: true
            }
          }
        }
      });

      // Generar QR
      const qrData = {
        codigo: codigoUnico,
        persona_id,
        edificio_id,
        expira: fechaExpiracion.toISOString()
      };

      const qrString = await QRCode.toDataURL(JSON.stringify(qrData));

      res.json({
        success: true,
        message: 'Código QR generado exitosamente',
        data: {
          acceso: nuevoAcceso,
          qr_code: qrString,
          expira_en: `${validez_minutos} minutos`
        }
      });

    } catch (error) {
      console.error('Error generando QR:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Validar acceso por QR
  async validateQR(req, res) {
    try {
      const { codigo } = req.body;

      if (!codigo) {
        return res.status(400).json({
          success: false,
          message: 'Código QR es requerido'
        });
      }

      // Buscar acceso por código
      const acceso = await this.prisma.accesos.findUnique({
        where: { codigo_qr: codigo },
        include: {
          persona: true,
          edificio: true
        }
      });

      if (!acceso) {
        return res.status(404).json({
          success: false,
          message: 'Código QR no válido'
        });
      }

      // Verificar si ya fue usado
      if (acceso.estado === 'usado') {
        return res.status(400).json({
          success: false,
          message: 'Código QR ya fue utilizado'
        });
      }

      // Verificar expiración
      if (new Date() > acceso.fecha_expiracion) {
        await this.prisma.accesos.update({
          where: { id: acceso.id },
          data: { estado: 'expirado' }
        });

        return res.status(400).json({
          success: false,
          message: 'Código QR expirado'
        });
      }

      // Marcar como usado
      const accesoUsado = await this.prisma.accesos.update({
        where: { id: acceso.id },
        data: {
          estado: 'usado',
          fecha_acceso_real: new Date(),
          validado_por: req.user?.id
        },
        include: {
          persona: true,
          edificio: true
        }
      });

      res.json({
        success: true,
        message: 'Acceso autorizado',
        data: {
          acceso: accesoUsado,
          persona: accesoUsado.persona,
          edificio: accesoUsado.edificio
        }
      });

    } catch (error) {
      console.error('Error validando QR:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener historial de accesos
  async getHistory(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        persona_id,
        edificio_id,
        estado,
        fecha_desde,
        fecha_hasta
      } = req.query;

      const offset = (page - 1) * limit;
      const where = {};

      if (persona_id) where.persona_id = parseInt(persona_id);
      if (edificio_id) where.edificio_id = parseInt(edificio_id);
      if (estado) where.estado = estado;

      if (fecha_desde || fecha_hasta) {
        where.fecha_hora = {};
        if (fecha_desde) where.fecha_hora.gte = new Date(fecha_desde);
        if (fecha_hasta) where.fecha_hora.lte = new Date(fecha_hasta);
      }

      const [accesos, total] = await Promise.all([
        this.prisma.accesos.findMany({
          where,
          skip: parseInt(offset),
          take: parseInt(limit),
          orderBy: { fecha_hora: 'desc' },
          include: {
            persona: {
              select: {
                nombre: true,
                apellido: true,
                documento_identidad: true
              }
            },
            edificio: {
              select: {
                nombre: true
              }
            }
          }
        }),
        this.prisma.accesos.count({ where })
      ]);

      res.json({
        success: true,
        data: accesos,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      console.error('Error obteniendo historial:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Registrar acceso manual
  async registerManual(req, res) {
    try {
      const { persona_id, edificio_id, observaciones } = req.body;

      if (!persona_id || !edificio_id) {
        return res.status(400).json({
          success: false,
          message: 'persona_id y edificio_id son requeridos'
        });
      }

      // Verificar que la persona y edificio existan
      const [persona, edificio] = await Promise.all([
        this.prisma.personas.findUnique({ where: { id: persona_id } }),
        this.prisma.edificios.findUnique({ where: { id: edificio_id } })
      ]);

      if (!persona || !edificio) {
        return res.status(404).json({
          success: false,
          message: 'Persona o edificio no encontrado'
        });
      }

      const accesoManual = await this.prisma.accesos.create({
        data: {
          persona_id,
          edificio_id,
          tipo_acceso: 'manual',
          estado: 'usado',
          fecha_acceso_real: new Date(),
          validado_por: req.user.id,
          observaciones
        },
        include: {
          persona: {
            select: {
              nombre: true,
              apellido: true,
              documento_identidad: true
            }
          },
          edificio: {
            select: {
              nombre: true
            }
          }
        }
      });

      res.json({
        success: true,
        message: 'Acceso manual registrado exitosamente',
        data: accesoManual
      });

    } catch (error) {
      console.error('Error registrando acceso manual:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener estadísticas de accesos
  async getStats(req, res) {
    try {
      const { edificio_id, fecha_desde, fecha_hasta } = req.query;

      const where = {};
      if (edificio_id) where.edificio_id = parseInt(edificio_id);

      if (fecha_desde || fecha_hasta) {
        where.fecha_hora = {};
        if (fecha_desde) where.fecha_hora.gte = new Date(fecha_desde);
        if (fecha_hasta) where.fecha_hora.lte = new Date(fecha_hasta);
      }

      const [
        totalAccesos,
        accesosUsados,
        accesosPendientes,
        accesosExpirados,
        accesosPorTipo
      ] = await Promise.all([
        this.prisma.accesos.count({ where }),
        this.prisma.accesos.count({ where: { ...where, estado: 'usado' } }),
        this.prisma.accesos.count({ where: { ...where, estado: 'pendiente' } }),
        this.prisma.accesos.count({ where: { ...where, estado: 'expirado' } }),
        this.prisma.accesos.groupBy({
          by: ['tipo_acceso'],
          where,
          _count: {
            id: true
          }
        })
      ]);

      res.json({
        success: true,
        data: {
          total: totalAccesos,
          estados: {
            usados: accesosUsados,
            pendientes: accesosPendientes,
            expirados: accesosExpirados
          },
          porTipo: accesosPorTipo.reduce((acc, item) => {
            acc[item.tipo_acceso] = item._count.id;
            return acc;
          }, {})
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

  // Revocar acceso
  async revokeAccess(req, res) {
    try {
      const { id } = req.params;
      const { motivo } = req.body;

      const acceso = await this.prisma.accesos.findUnique({
        where: { id: parseInt(id) }
      });

      if (!acceso) {
        return res.status(404).json({
          success: false,
          message: 'Acceso no encontrado'
        });
      }

      if (acceso.estado === 'usado') {
        return res.status(400).json({
          success: false,
          message: 'No se puede revocar un acceso ya utilizado'
        });
      }

      await this.prisma.accesos.update({
        where: { id: parseInt(id) },
        data: {
          estado: 'revocado',
          observaciones: motivo || 'Acceso revocado',
          updated_at: new Date()
        }
      });

      res.json({
        success: true,
        message: 'Acceso revocado exitosamente'
      });

    } catch (error) {
      console.error('Error revocando acceso:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}

module.exports = new AccesosController();
