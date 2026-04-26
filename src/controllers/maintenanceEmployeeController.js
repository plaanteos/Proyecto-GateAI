/**
 * Controlador de Empleados de Mantenimiento
 * Maneja todas las operaciones CRUD y gestión de credenciales
 */

const MaintenanceEmployeeService = require('../services/maintenanceEmployeeService');
const maintenanceService = new MaintenanceEmployeeService();
const logger = require('../utils/logger');
const { body, validationResult } = require('express-validator');

class MaintenanceEmployeeController {
    
    /**
     * Obtiene empleados de mantenimiento con filtros
     */
    async getMaintenanceEmployees(req, res) {
        try {
            const filters = {
                tipo_empleado: req.query.tipo_empleado,
                especialidad: req.query.especialidad,
                estado: req.query.estado,
                empresa: req.query.empresa,
                activo_desde: req.query.activo_desde,
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 20
            };

            const result = await maintenanceService.getMaintenanceEmployees(filters);

            res.json({
                success: true,
                data: result.employees,
                pagination: result.pagination,
                message: 'Empleados obtenidos exitosamente'
            });

        } catch (error) {
            logger.error('Error obteniendo empleados de mantenimiento:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Registra nuevo empleado de mantenimiento
     */
    async registerEmployee(req, res) {
        try {
            // Validar entrada
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos de entrada inválidos',
                    errors: errors.array()
                });
            }

            const employeeData = {
                documento_identidad: req.body.documento_identidad,
                nombre: req.body.nombre,
                apellido: req.body.apellido,
                telefono: req.body.telefono,
                email: req.body.email,
                empresa_mantenimiento: req.body.empresa_mantenimiento,
                tipo_empleado: req.body.tipo_empleado,
                especialidad: req.body.especialidad,
                zonas_permitidas: req.body.zonas_permitidas || [],
                horario_permitido: req.body.horario_permitido,
                fecha_inicio: req.body.fecha_inicio,
                fecha_fin: req.body.fecha_fin,
                documentos_verificacion: req.body.documentos_verificacion || []
            };

            const result = await maintenanceService.registerMaintenanceEmployee(
                employeeData,
                req.user.id
            );

            res.status(201).json(result);

        } catch (error) {
            logger.error('Error registrando empleado:', error);
            res.status(500).json({
                success: false,
                message: 'Error registrando empleado de mantenimiento',
                error: error.message
            });
        }
    }

    /**
     * Valida acceso de empleado de mantenimiento
     */
    async validateAccess(req, res) {
        try {
            const { qr_code, puerta_id } = req.body;

            if (!qr_code || !puerta_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Código QR y puerta requeridos'
                });
            }

            const validationData = {
                metodo: 'QR',
                ip: req.ip,
                dispositivo: req.get('User-Agent'),
                coordenadas: req.body.coordenadas,
                foto: req.body.foto,
                observaciones: req.body.observaciones,
                additionalData: req.body.additionalData
            };

            const result = await maintenanceService.validateMaintenanceAccess(
                qr_code,
                puerta_id,
                validationData
            );

            if (result.valid) {
                res.json({
                    success: true,
                    data: {
                        employee: result.employee,
                        accessLog: result.accessLog,
                        remainingUses: result.remainingUses
                    },
                    message: result.message
                });
            } else {
                res.status(403).json({
                    success: false,
                    reason: result.reason,
                    message: result.message
                });
            }

        } catch (error) {
            logger.error('Error validando acceso:', error);
            res.status(500).json({
                success: false,
                message: 'Error validando acceso',
                error: error.message
            });
        }
    }

    /**
     * Registra salida de empleado
     */
    async registerExit(req, res) {
        try {
            const { qr_code, puerta_id } = req.body;

            if (!qr_code || !puerta_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Código QR y puerta requeridos'
                });
            }

            // Buscar credencial activa
            const credential = await maintenanceService.prisma.credenciales_mantenimiento.findUnique({
                where: { codigo_qr: qr_code }
            });

            if (!credential) {
                return res.status(404).json({
                    success: false,
                    message: 'Credencial no encontrada'
                });
            }

            const exitData = {
                metodo: 'QR',
                observaciones: req.body.observaciones
            };

            const result = await maintenanceService.registerMaintenanceExit(
                credential.id,
                puerta_id,
                exitData
            );

            res.json(result);

        } catch (error) {
            logger.error('Error registrando salida:', error);
            res.status(500).json({
                success: false,
                message: 'Error registrando salida',
                error: error.message
            });
        }
    }

    /**
     * Renueva credencial temporal
     */
    async renewCredential(req, res) {
        try {
            const { employeeId } = req.params;
            const { new_expiration_date } = req.body;

            if (!new_expiration_date) {
                return res.status(400).json({
                    success: false,
                    message: 'Nueva fecha de expiración requerida'
                });
            }

            const result = await maintenanceService.renewTemporaryCredential(
                parseInt(employeeId),
                new_expiration_date,
                req.user.id
            );

            res.json(result);

        } catch (error) {
            logger.error('Error renovando credencial:', error);
            res.status(500).json({
                success: false,
                message: 'Error renovando credencial',
                error: error.message
            });
        }
    }

    /**
     * Actualiza empleado de mantenimiento
     */
    async updateEmployee(req, res) {
        try {
            const { employeeId } = req.params;
            const updateData = req.body;

            const employee = await maintenanceService.prisma.empleados_mantenimiento.update({
                where: { id: parseInt(employeeId) },
                data: {
                    ...updateData,
                    updated_at: new Date()
                },
                include: {
                    persona: true,
                    credenciales: {
                        where: { estado: 'ACTIVA' }
                    }
                }
            });

            // Registrar auditoría
            await maintenanceService.prisma.auditoria.create({
                data: {
                    usuario_id: req.user.id,
                    accion: 'UPDATE_MAINTENANCE_EMPLOYEE',
                    tabla_afectada: 'EmpleadosMantenimiento',
                    registro_id: parseInt(employeeId),
                    valores_nuevos: updateData,
                    ip_address: req.ip,
                    user_agent: req.get('User-Agent')
                }
            });

            res.json({
                success: true,
                data: employee,
                message: 'Empleado actualizado exitosamente'
            });

        } catch (error) {
            logger.error('Error actualizando empleado:', error);
            res.status(500).json({
                success: false,
                message: 'Error actualizando empleado',
                error: error.message
            });
        }
    }

    /**
     * Desactiva empleado de mantenimiento
     */
    async deactivateEmployee(req, res) {
        try {
            const { employeeId } = req.params;
            const { motivo } = req.body;

            // Desactivar empleado
            await maintenanceService.prisma.empleados_mantenimiento.update({
                where: { id: parseInt(employeeId) },
                data: {
                    estado: 'INACTIVO',
                    fecha_desactivacion: new Date(),
                    motivo_desactivacion: motivo,
                    updated_at: new Date()
                }
            });

            // Expirar todas las credenciales activas
            await maintenanceService.prisma.credenciales_mantenimiento.updateMany({
                where: {
                    empleado_id: parseInt(employeeId),
                    estado: 'ACTIVA'
                },
                data: {
                    estado: 'REVOCADA',
                    fecha_vencimiento_real: new Date(),
                    motivo_vencimiento: 'EMPLOYEE_DEACTIVATED'
                }
            });

            // Registrar auditoría
            await maintenanceService.prisma.auditoria.create({
                data: {
                    usuario_id: req.user.id,
                    accion: 'DEACTIVATE_MAINTENANCE_EMPLOYEE',
                    tabla_afectada: 'EmpleadosMantenimiento',
                    registro_id: parseInt(employeeId),
                    valores_nuevos: { estado: 'INACTIVO', motivo },
                    ip_address: req.ip,
                    user_agent: req.get('User-Agent')
                }
            });

            res.json({
                success: true,
                message: 'Empleado desactivado exitosamente'
            });

        } catch (error) {
            logger.error('Error desactivando empleado:', error);
            res.status(500).json({
                success: false,
                message: 'Error desactivando empleado',
                error: error.message
            });
        }
    }

    /**
     * Obtiene historial de accesos de un empleado
     */
    async getEmployeeAccessHistory(req, res) {
        try {
            const { employeeId } = req.params;
            const { page = 1, limit = 20, fecha_desde, fecha_hasta } = req.query;

            const where = {
                credencial: {
                    empleado_id: parseInt(employeeId)
                }
            };

            if (fecha_desde || fecha_hasta) {
                where.fecha_acceso = {};
                if (fecha_desde) where.fecha_acceso.gte = new Date(fecha_desde);
                if (fecha_hasta) where.fecha_acceso.lte = new Date(fecha_hasta);
            }

            const [accesses, total] = await Promise.all([
                maintenanceService.prisma.accesos_mantenimiento.findMany({
                    where,
                    include: {
                        credencial: {
                            include: {
                                empleado: {
                                    include: {
                                        persona: true
                                    }
                                }
                            }
                        },
                        puerta: {
                            include: {
                                edificio: true
                            }
                        }
                    },
                    orderBy: { fecha_acceso: 'desc' },
                    skip: (page - 1) * limit,
                    take: parseInt(limit)
                }),
                maintenanceService.prisma.accesos_mantenimiento.count({ where })
            ]);

            res.json({
                success: true,
                data: accesses,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                },
                message: 'Historial obtenido exitosamente'
            });

        } catch (error) {
            logger.error('Error obteniendo historial:', error);
            res.status(500).json({
                success: false,
                message: 'Error obteniendo historial',
                error: error.message
            });
        }
    }

    /**
     * Obtiene estadísticas de empleados de mantenimiento
     */
    async getStatistics(req, res) {
        try {
            const [
                totalEmployees,
                activeEmployees,
                byType,
                bySpecialty,
                recentAccesses
            ] = await Promise.all([
                maintenanceService.prisma.empleados_mantenimiento.count(),
                maintenanceService.prisma.empleados_mantenimiento.count({
                    where: { estado: 'ACTIVO' }
                }),
                maintenanceService.prisma.empleados_mantenimiento.groupBy({
                    by: ['tipo_empleado'],
                    _count: { tipo_empleado: true }
                }),
                maintenanceService.prisma.empleados_mantenimiento.groupBy({
                    by: ['especialidad'],
                    _count: { especialidad: true }
                }),
                maintenanceService.prisma.accesos_mantenimiento.count({
                    where: {
                        fecha_acceso: {
                            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24 horas
                        }
                    }
                })
            ]);

            res.json({
                success: true,
                data: {
                    total: totalEmployees,
                    active: activeEmployees,
                    inactive: totalEmployees - activeEmployees,
                    byType: byType.reduce((acc, item) => {
                        acc[item.tipo_empleado] = item._count.tipo_empleado;
                        return acc;
                    }, {}),
                    bySpecialty: bySpecialty.reduce((acc, item) => {
                        acc[item.especialidad] = item._count.especialidad;
                        return acc;
                    }, {}),
                    accessesLast24h: recentAccesses
                },
                message: 'Estadísticas obtenidas exitosamente'
            });

        } catch (error) {
            logger.error('Error obteniendo estadísticas:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Elimina empleado de mantenimiento (soft delete)
     */
    async deleteEmployee(req, res) {
        try {
            const { id } = req.params;

            // Primero obtener el empleado para verificar que existe
            const employee = await maintenanceService.prisma.empleados_mantenimiento.findUnique({
                where: { id: parseInt(id) },
                include: { persona: true }
            });

            if (!employee) {
                return res.status(404).json({
                    success: false,
                    message: 'Empleado no encontrado'
                });
            }

            // Desactivar empleado (soft delete)
            await maintenanceService.prisma.empleados_mantenimiento.update({
                where: { id: parseInt(id) },
                data: {
                    estado: 'INACTIVO',
                    fecha_desactivacion: new Date(),
                    motivo_desactivacion: 'Eliminado por administrador',
                    updated_at: new Date()
                }
            });

            // Desactivar todas las credenciales activas
            await maintenanceService.prisma.credenciales_mantenimiento.updateMany({
                where: { 
                    empleado_id: parseInt(id),
                    estado: 'ACTIVA'
                },
                data: {
                    estado: 'DESACTIVADA',
                    fecha_vencimiento_real: new Date(),
                    motivo_vencimiento: 'EMPLOYEE_DELETED'
                }
            });

            // Auditoría
            await maintenanceService.prisma.auditoria.create({
                data: {
                    usuario_id: req.user.id,
                    accion: 'DELETE_MAINTENANCE_EMPLOYEE',
                    tabla_afectada: 'EmpleadosMantenimiento',
                    registro_id: parseInt(id),
                    valores_anteriores: { estado: employee.estado },
                    valores_nuevos: { estado: 'INACTIVO' },
                    ip_address: req.ip,
                    user_agent: req.get('User-Agent')
                }
            });

            logger.info(`🗑️ Empleado de mantenimiento eliminado: ${employee.persona.nombre} ${employee.persona.apellido}`);

            res.json({
                success: true,
                message: 'Empleado eliminado exitosamente'
            });

        } catch (error) {
            logger.error('Error eliminando empleado:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }
}

/**
 * Validaciones para registro de empleado
 */
const validateEmployeeRegistration = [
    body('documento_identidad')
        .notEmpty()
        .withMessage('Documento de identidad requerido')
        .isLength({ min: 5, max: 20 })
        .withMessage('Documento debe tener entre 5 y 20 caracteres'),
    
    body('nombre')
        .notEmpty()
        .withMessage('Nombre requerido')
        .isLength({ min: 2, max: 50 })
        .withMessage('Nombre debe tener entre 2 y 50 caracteres'),
    
    body('apellido')
        .notEmpty()
        .withMessage('Apellido requerido')
        .isLength({ min: 2, max: 50 })
        .withMessage('Apellido debe tener entre 2 y 50 caracteres'),
    
    body('empresa_mantenimiento')
        .notEmpty()
        .withMessage('Empresa de mantenimiento requerida'),
    
    body('tipo_empleado')
        .isIn(['TEMPORAL', 'RECURRENTE', 'PERMANENTE'])
        .withMessage('Tipo de empleado inválido'),
    
    body('especialidad')
        .isIn(['JARDINERIA', 'PLOMERIA', 'ELECTRICIDAD', 'LIMPIEZA', 'SEGURIDAD', 'GENERAL'])
        .withMessage('Especialidad inválida'),
    
    body('fecha_inicio')
        .isISO8601()
        .withMessage('Fecha de inicio inválida'),
    
    body('email')
        .optional()
        .isEmail()
        .withMessage('Email inválido'),
    
    body('telefono')
        .optional()
        .isMobilePhone()
        .withMessage('Teléfono inválido')
];

module.exports = {
    MaintenanceEmployeeController: new MaintenanceEmployeeController(),
    validateEmployeeRegistration
};
