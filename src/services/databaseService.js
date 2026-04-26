/**
 * UnionTech Database Service
 * Servicio unificado para manejo de datos con Prisma y fallback a datos mock
 * Version: 1.0.0
 */

const { PrismaClient } = require('@prisma/client');

class DatabaseService {
  constructor() {
    this.prisma = null;
    this.isConnected = false;
    this.mockData = this.initializeMockData();
    
    this.initializePrisma();
  }

  async initializePrisma() {
    try {
      this.prisma = new PrismaClient();
      await this.prisma.$connect();
      this.isConnected = true;
      console.log('✅ Base de datos conectada (Prisma + SQL Server)');
    } catch (error) {
      console.warn('⚠️ Prisma no disponible, usando datos mock:', error.message);
      this.isConnected = false;
      this.prisma = null;
    }
  }

  initializeMockData() {
    return {
      personas: [
        {
          id: 1,
          documento_identidad: '12345678',
          nombre: 'Juan',
          apellido: 'Pérez',
          telefono: '+5491123456789',
          email: 'juan.perez@empresa.com',
          activo: true,
          fecha_registro: new Date(),
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 2,
          documento_identidad: '87654321',
          nombre: 'María',
          apellido: 'García',
          telefono: '+5491987654321',
          email: 'maria.garcia@empresa.com',
          activo: true,
          fecha_registro: new Date(),
          created_at: new Date(),
          updated_at: new Date()
        }
      ],
      usuarios: [
        {
          id: 1,
          persona_id: 1,
          username: 'admin',
          email: 'admin@uniontech.com',
          password_hash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBNj1MKAql.OuW',
          activo: true,
          fecha_registro: new Date(),
          ultimo_acceso: null
        }
      ],
      edificios: [
        {
          id: 1,
          nombre: 'Torre Central',
          direccion: 'Av. Principal 1234',
          descripcion: 'Edificio principal de oficinas',
          activo: true,
          fecha_registro: new Date()
        },
        {
          id: 2,
          nombre: 'Edificio Norte',
          direccion: 'Av. Norte 567',
          descripcion: 'Edificio de laboratorios',
          activo: true,
          fecha_registro: new Date()
        }
      ],
      invitaciones: [],
      registros_acceso: [],
      credenciales: [],
      puertas: [
        {
          id: 1,
          edificio_id: 1,
          nombre: 'Entrada Principal',
          ubicacion: 'Planta Baja',
          activo: true
        },
        {
          id: 2,
          edificio_id: 1,
          nombre: 'Acceso Parking',
          ubicacion: 'Subsuelo',
          activo: true
        }
      ]
    };
  }

  // Métodos unificados para personas
  async findPersonas(filter = {}) {
    if (this.isConnected && this.prisma) {
      try {
        return await this.prisma.personas.findMany({
          where: filter,
          include: {
            usuarios: true,
            credenciales: true,
            invitaciones: true
          }
        });
      } catch (error) {
        console.error('Error en Prisma, usando mock:', error.message);
      }
    }
    
    // Fallback a datos mock
    let personas = [...this.mockData.personas];
    
    if (filter.activo !== undefined) {
      personas = personas.filter(p => p.activo === filter.activo);
    }
    
    if (filter.documento_identidad) {
      personas = personas.filter(p => 
        p.documento_identidad.includes(filter.documento_identidad)
      );
    }
    
    return personas;
  }

  async createPersona(data) {
    if (this.isConnected && this.prisma) {
      try {
        return await this.prisma.personas.create({
          data: {
            ...data,
            fecha_registro: new Date(),
            created_at: new Date(),
            updated_at: new Date()
          }
        });
      } catch (error) {
        console.error('Error en Prisma, usando mock:', error.message);
      }
    }
    
    // Fallback a datos mock
    const newPersona = {
      id: this.mockData.personas.length + 1,
      ...data,
      fecha_registro: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    };
    
    this.mockData.personas.push(newPersona);
    return newPersona;
  }

  // Métodos unificados para invitaciones/visitantes
  async findInvitaciones(filter = {}) {
    if (this.isConnected && this.prisma) {
      try {
        return await this.prisma.invitaciones.findMany({
          where: filter,
          include: {
            persona: true
          },
          orderBy: { fecha_invitacion: 'desc' }
        });
      } catch (error) {
        console.error('Error en Prisma, usando mock:', error.message);
      }
    }
    
    // Fallback a datos mock
    let invitaciones = [...this.mockData.invitaciones];
    
    if (filter.estado) {
      invitaciones = invitaciones.filter(i => i.estado === filter.estado);
    }
    
    if (filter.tipo_invitacion) {
      invitaciones = invitaciones.filter(i => i.tipo_invitacion === filter.tipo_invitacion);
    }
    
    return invitaciones.sort((a, b) => new Date(b.fecha_invitacion) - new Date(a.fecha_invitacion));
  }

  async createInvitacion(data) {
    if (this.isConnected && this.prisma) {
      try {
        return await this.prisma.invitaciones.create({
          data: {
            ...data,
            fecha_invitacion: new Date(),
            fecha_expiracion: data.fecha_expiracion ? new Date(data.fecha_expiracion) : null
          }
        });
      } catch (error) {
        console.error('Error en Prisma, usando mock:', error.message);
      }
    }
    
    // Fallback a datos mock
    const newInvitacion = {
      id: this.mockData.invitaciones.length + 1,
      ...data,
      fecha_invitacion: new Date(),
      fecha_expiracion: data.fecha_expiracion ? new Date(data.fecha_expiracion) : null
    };
    
    this.mockData.invitaciones.push(newInvitacion);
    return newInvitacion;
  }

  // Métodos unificados para registros de acceso
  async findRegistrosAcceso(filter = {}) {
    if (this.isConnected && this.prisma) {
      try {
        return await this.prisma.registros_Acceso.findMany({
          where: filter,
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
      } catch (error) {
        console.error('Error en Prisma, usando mock:', error.message);
      }
    }
    
    // Fallback a datos mock (generar algunos registros si está vacío)
    if (this.mockData.registros_acceso.length === 0) {
      this.generateMockAccessRecords();
    }
    
    let registros = [...this.mockData.registros_acceso];
    
    if (filter.fecha_hora) {
      const { gte, lte } = filter.fecha_hora;
      if (gte) registros = registros.filter(r => new Date(r.fecha_hora) >= gte);
      if (lte) registros = registros.filter(r => new Date(r.fecha_hora) <= lte);
    }
    
    return registros.sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora));
  }

  async createRegistroAcceso(data) {
    if (this.isConnected && this.prisma) {
      try {
        return await this.prisma.registros_Acceso.create({
          data: {
            ...data,
            fecha_hora: new Date()
          }
        });
      } catch (error) {
        console.error('Error en Prisma, usando mock:', error.message);
      }
    }
    
    // Fallback a datos mock
    const newRegistro = {
      id: this.mockData.registros_acceso.length + 1,
      ...data,
      fecha_hora: new Date()
    };
    
    this.mockData.registros_acceso.push(newRegistro);
    return newRegistro;
  }

  // Métodos unificados para edificios
  async findEdificios(filter = {}) {
    if (this.isConnected && this.prisma) {
      try {
        return await this.prisma.edificios.findMany({
          where: filter,
          include: {
            puertas: true
          }
        });
      } catch (error) {
        console.error('Error en Prisma, usando mock:', error.message);
      }
    }
    
    // Fallback a datos mock
    let edificios = [...this.mockData.edificios];
    
    if (filter.activo !== undefined) {
      edificios = edificios.filter(e => e.activo === filter.activo);
    }
    
    return edificios;
  }

  // Métodos de utilidad
  generateMockAccessRecords() {
    const records = [];
    const now = new Date();
    
    for (let i = 0; i < 50; i++) {
      const date = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
      records.push({
        id: i + 1,
        credencial_id: Math.floor(Math.random() * 2) + 1,
        puerta_id: Math.floor(Math.random() * 2) + 1,
        fecha_hora: date,
        tipo_acceso: ['entrada', 'salida'][Math.floor(Math.random() * 2)],
        resultado: Math.random() > 0.1 ? 'autorizado' : 'denegado',
        metodo_validacion: ['qr', 'tarjeta', 'biometrico'][Math.floor(Math.random() * 3)]
      });
    }
    
    this.mockData.registros_acceso = records;
  }

  // Método para contar registros
  async countRecords(table, filter = {}) {
    if (this.isConnected && this.prisma) {
      try {
        switch (table) {
          case 'personas':
            return await this.prisma.personas.count({ where: filter });
          case 'invitaciones':
            return await this.prisma.invitaciones.count({ where: filter });
          case 'registros_acceso':
            return await this.prisma.registros_Acceso.count({ where: filter });
          case 'edificios':
            return await this.prisma.edificios.count({ where: filter });
          default:
            return 0;
        }
      } catch (error) {
        console.error('Error en Prisma count, usando mock:', error.message);
      }
    }
    
    // Fallback a datos mock
    switch (table) {
      case 'personas':
        return this.mockData.personas.filter(p => !filter.activo || p.activo === filter.activo).length;
      case 'invitaciones':
        return this.mockData.invitaciones.filter(i => !filter.estado || i.estado === filter.estado).length;
      case 'registros_acceso':
        if (this.mockData.registros_acceso.length === 0) {
          this.generateMockAccessRecords();
        }
        return this.mockData.registros_acceso.length;
      case 'edificios':
        return this.mockData.edificios.filter(e => !filter.activo || e.activo === filter.activo).length;
      default:
        return 0;
    }
  }

  // Método para verificar conectividad
  async healthCheck() {
    if (this.isConnected && this.prisma) {
      try {
        await this.prisma.$queryRaw`SELECT 1`;
        return { status: 'connected', database: 'sql_server' };
      } catch (error) {
        this.isConnected = false;
        return { status: 'disconnected', database: 'mock', error: error.message };
      }
    }
    
    return { status: 'mock_mode', database: 'mock' };
  }

  // Cerrar conexión
  async disconnect() {
    if (this.prisma) {
      await this.prisma.$disconnect();
      console.log('🔌 Conexión a base de datos cerrada');
    }
  }
}

// Exportar instancia singleton
module.exports = new DatabaseService();
