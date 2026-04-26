/**
 * Servicio de Gestión de Empleados de Mantenimiento
 * Maneja credenciales temporales, recurrentes y por zonas
 */

const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');
const QRService = require('./qrService');

class MaintenanceEmployeeService {
    constructor() {
        this.prisma = new PrismaClient();
        this.qrService = QRService;
    }

    /**
     * Registra un nuevo empleado de mantenimiento
     */
    async registerMaintenanceEmployee(employeeData, createdBy) {
        try {
            const {
                documento_identidad,
                nombre,
                apellido,
                telefono,
                email,
                empresa_mantenimiento,
                tipo_empleado, // 'TEMPORAL', 'RECURRENTE', 'PERMANENTE'
                especialidad, // 'JARDINERIA', 'PLOMERIA', 'ELECTRICIDAD', 'LIMPIEZA', 'SEGURIDAD'
                zonas_permitidas, // Array de IDs de zonas
                horario_permitido, // JSON con horarios
                fecha_inicio,
                fecha_fin, // Opcional para temporales
                documentos_verificacion // Array de documentos
            } = employeeData;

            // Verificar si ya existe
            const existingEmployee = await this.prisma.personas.findUnique({
                where: { documento_identidad }
            });

            let persona;
            if (existingEmployee) {
                // Actualizar datos si ya existe
                persona = await this.prisma.personas.update({
                    where: { id: existingEmployee.id },
                    data: {
                        nombre,
                        apellido,
                        telefono,
                        email,
                        updated_at: new Date()
                    }
                });
            } else {
                // Crear nueva persona
                persona = await this.prisma.personas.create({
                    data: {
                        documento_identidad,
                        nombre,
                        apellido,
                        telefono,
                        email,
                        activo: true
                    }
                });
            }

            // Crear registro de empleado de mantenimiento
            const maintenanceEmployee = await this.prisma.empleados_mantenimiento.create({
                data: {
                    persona_id: persona.id,
                    empresa_mantenimiento,
                    tipo_empleado,
                    especialidad,
                    estado: 'ACTIVO',
                    fecha_inicio: new Date(fecha_inicio),
                    fecha_fin: fecha_fin ? new Date(fecha_fin) : null,
                    horario_permitido: horario_permitido || this.getDefaultSchedule(),
                    zonas_permitidas: zonas_permitidas || [],
                    documentos_verificacion: documentos_verificacion || [],
                    created_by: createdBy,
                    metadata: {
                        registration_date: new Date().toISOString(),
                        registration_method: 'MANUAL'
                    }
                }
            });

            // Crear credencial de acceso
            const credential = await this.createMaintenanceCredential(
                maintenanceEmployee.id,
                tipo_empleado,
                zonas_permitidas,
                horario_permitido
            );

            // Registrar auditoría
            await this.prisma.auditoria.create({
                data: {
                    usuario_id: createdBy,
                    accion: 'CREATE_MAINTENANCE_EMPLOYEE',
                    tabla_afectada: 'EmpleadosMantenimiento',
                    registro_id: maintenanceEmployee.id,
                    valores_nuevos: maintenanceEmployee,
                    ip_address: '127.0.0.1',
                    user_agent: 'System'
                }
            });

            logger.info(`✅ Empleado de mantenimiento registrado: ${persona.nombre} ${persona.apellido} (${documento_identidad})`);

            return {
                success: true,
                employee: {
                    ...maintenanceEmployee,
                    persona,
                    credential
                },
                message: 'Empleado de mantenimiento registrado exitosamente'
            };

        } catch (error) {
            logger.error('Error registrando empleado de mantenimiento:', error);
            throw error;
        }
    }

    /**
     * Crea credencial de acceso para empleado de mantenimiento
     */
    async createMaintenanceCredential(employeeId, tipo, zonas, horario) {
        try {
            const expirationDate = this.calculateCredentialExpiration(tipo);
            
            // Generar código QR único
            const qrCode = await this.qrService.generateMaintenanceQR({
                employeeId,
                tipo,
                expirationDate,
                zonas,
                horario
            });

            const credential = await this.prisma.credenciales_mantenimiento.create({
                data: {
                    empleado_id: employeeId,
                    codigo_qr: qrCode.qrString,
                    qr_data: qrCode.qrData,
                    tipo_credencial: tipo,
                    estado: 'ACTIVA',
                    fecha_expiracion: expirationDate,
                    zonas_permitidas: zonas,
                    horario_permitido: horario,
                    usos_permitidos: this.getUsesLimit(tipo),
                    usos_realizados: 0,
                    metadata: {
                        generated_at: new Date().toISOString(),
                        qr_version: '2.0'
                    }
                }
            });

            logger.info(`🔑 Credencial creada para empleado ${employeeId}: ${credential.codigo_qr}`);

            return credential;

        } catch (error) {
            logger.error('Error creando credencial:', error);
            throw error;
        }
    }

    /**
     * Valida acceso de empleado de mantenimiento
     */
    async validateMaintenanceAccess(qrCode, puertaId, validationData = {}) {
        try {
            // Buscar credencial
            const credential = await this.prisma.credenciales_mantenimiento.findUnique({
                where: { codigo_qr: qrCode },
                include: {
                    empleado: {
                        include: {
                            persona: true
                        }
                    }
                }
            });

            if (!credential) {
                return {
                    valid: false,
                    reason: 'CREDENTIAL_NOT_FOUND',
                    message: 'Credencial no encontrada'
                };
            }

            // Verificar estado de la credencial
            if (credential.estado !== 'ACTIVA') {
                return {
                    valid: false,
                    reason: 'CREDENTIAL_INACTIVE',
                    message: `Credencial ${credential.estado.toLowerCase()}`
                };
            }

            // Verificar estado del empleado
            if (credential.empleado.estado !== 'ACTIVO') {
                return {
                    valid: false,
                    reason: 'EMPLOYEE_INACTIVE',
                    message: 'Empleado inactivo'
                };
            }

            // Verificar expiración
            if (credential.fecha_expiracion && new Date() > credential.fecha_expiracion) {
                await this.expireCredential(credential.id, 'EXPIRED');
                return {
                    valid: false,
                    reason: 'CREDENTIAL_EXPIRED',
                    message: 'Credencial vencida'
                };
            }

            // Verificar zona permitida
            const puerta = await this.prisma.puertas_Acceso.findUnique({
                where: { id: puertaId },
                include: { edificio: true }
            });

            if (!this.isZoneAllowed(credential.zonas_permitidas, puerta)) {
                return {
                    valid: false,
                    reason: 'ZONE_NOT_ALLOWED',
                    message: 'Zona no permitida para este empleado'
                };
            }

            // Verificar horario
            if (!this.isTimeAllowed(credential.horario_permitido)) {
                return {
                    valid: false,
                    reason: 'TIME_NOT_ALLOWED',
                    message: 'Acceso fuera del horario permitido'
                };
            }

            // Verificar límite de usos
            if (credential.usos_permitidos > 0 && credential.usos_realizados >= credential.usos_permitidos) {
                return {
                    valid: false,
                    reason: 'USAGE_LIMIT_EXCEEDED',
                    message: 'Límite de usos excedido'
                };
            }

            // Registrar el acceso
            const accessLog = await this.registerMaintenanceAccess(
                credential.id,
                puertaId,
                validationData
            );

            // Actualizar contador de usos
            await this.prisma.credenciales_mantenimiento.update({
                where: { id: credential.id },
                data: {
                    usos_realizados: credential.usos_realizados + 1,
                    ultimo_acceso: new Date()
                }
            });

            logger.info(`✅ Acceso autorizado para empleado ${credential.empleado.persona.nombre} ${credential.empleado.persona.apellido}`);

            return {
                valid: true,
                employee: credential.empleado,
                accessLog,
                message: 'Acceso autorizado',
                remainingUses: credential.usos_permitidos > 0 ? 
                    credential.usos_permitidos - credential.usos_realizados - 1 : null
            };

        } catch (error) {
            logger.error('Error validando acceso de mantenimiento:', error);
            return {
                valid: false,
                reason: 'VALIDATION_ERROR',
                message: 'Error interno de validación'
            };
        }
    }

    /**
     * Registra acceso de empleado de mantenimiento
     */
    async registerMaintenanceAccess(credentialId, puertaId, validationData) {
        try {
            const accessLog = await this.prisma.accesos_mantenimiento.create({
                data: {
                    credencial_id: credentialId,
                    puerta_id: puertaId,
                    tipo_acceso: 'ENTRADA',
                    fecha_acceso: new Date(),
                    metodo_validacion: validationData.metodo || 'QR',
                    ip_address: validationData.ip || '127.0.0.1',
                    dispositivo: validationData.dispositivo || 'Sistema',
                    coordenadas: validationData.coordenadas,
                    foto_acceso: validationData.foto,
                    observaciones: validationData.observaciones,
                    metadata: {
                        validation_time: new Date().toISOString(),
                        additional_data: validationData.additionalData || {}
                    }
                }
            });

            return accessLog;

        } catch (error) {
            logger.error('Error registrando acceso:', error);
            throw error;
        }
    }

    /**
     * Gestiona la salida de empleado de mantenimiento
     */
    async registerMaintenanceExit(credentialId, puertaId, exitData = {}) {
        try {
            // Buscar el último acceso de entrada
            const lastEntry = await this.prisma.accesos_mantenimiento.findFirst({
                where: {
                    credencial_id: credentialId,
                    tipo_acceso: 'ENTRADA',
                    fecha_salida: null
                },
                orderBy: {
                    fecha_acceso: 'desc'
                }
            });

            if (lastEntry) {
                // Actualizar con fecha de salida
                await this.prisma.accesos_mantenimiento.update({
                    where: { id: lastEntry.id },
                    data: {
                        fecha_salida: new Date(),
                        duracion_visita: this.calculateDuration(lastEntry.fecha_acceso, new Date()),
                        observaciones_salida: exitData.observaciones
                    }
                });
            }

            // Crear nuevo registro de salida
            const exitLog = await this.prisma.accesos_mantenimiento.create({
                data: {
                    credencial_id: credentialId,
                    puerta_id: puertaId,
                    tipo_acceso: 'SALIDA',
                    fecha_acceso: new Date(),
                    metodo_validacion: exitData.metodo || 'QR',
                    observaciones: exitData.observaciones,
                    metadata: {
                        exit_time: new Date().toISOString()
                    }
                }
            });

            logger.info(`🚪 Salida registrada para credencial ${credentialId}`);

            return {
                success: true,
                exitLog,
                entryLog: lastEntry,
                message: 'Salida registrada exitosamente'
            };

        } catch (error) {
            logger.error('Error registrando salida:', error);
            throw error;
        }
    }

    /**
     * Renueva credencial de empleado temporal
     */
    async renewTemporaryCredential(employeeId, newExpirationDate, renewedBy) {
        try {
            const employee = await this.prisma.empleados_mantenimiento.findUnique({
                where: { id: employeeId },
                include: {
                    credenciales: {
                        where: { estado: 'ACTIVA' }
                    }
                }
            });

            if (!employee || employee.tipo_empleado !== 'TEMPORAL') {
                throw new Error('Solo se pueden renovar empleados temporales');
            }

            // Expirar credencial actual
            if (employee.credenciales.length > 0) {
                await Promise.all(employee.credenciales.map(cred => 
                    this.expireCredential(cred.id, 'RENEWED')
                ));
            }

            // Crear nueva credencial
            const newCredential = await this.createMaintenanceCredential(
                employeeId,
                employee.tipo_empleado,
                employee.zonas_permitidas,
                employee.horario_permitido
            );

            // Actualizar empleado
            await this.prisma.empleados_mantenimiento.update({
                where: { id: employeeId },
                data: {
                    fecha_fin: new Date(newExpirationDate),
                    updated_at: new Date()
                }
            });

            // Registrar auditoría
            await this.prisma.auditoria.create({
                data: {
                    usuario_id: renewedBy,
                    accion: 'RENEW_MAINTENANCE_CREDENTIAL',
                    tabla_afectada: 'EmpleadosMantenimiento',
                    registro_id: employeeId,
                    valores_nuevos: { fecha_fin: newExpirationDate },
                    ip_address: '127.0.0.1',
                    user_agent: 'System'
                }
            });

            logger.info(`🔄 Credencial renovada para empleado ${employeeId} hasta ${newExpirationDate}`);

            return {
                success: true,
                newCredential,
                message: 'Credencial renovada exitosamente'
            };

        } catch (error) {
            logger.error('Error renovando credencial:', error);
            throw error;
        }
    }

    /**
     * Obtiene empleados de mantenimiento con filtros
     */
    async getMaintenanceEmployees(filters = {}) {
        try {
            const {
                tipo_empleado,
                especialidad,
                estado,
                empresa,
                activo_desde,
                page = 1,
                limit = 20
            } = filters;

            const where = {};

            if (tipo_empleado) where.tipo_empleado = tipo_empleado;
            if (especialidad) where.especialidad = especialidad;
            if (estado) where.estado = estado;
            if (empresa) where.empresa_mantenimiento = { contains: empresa };
            if (activo_desde) where.fecha_inicio = { gte: new Date(activo_desde) };

            const [employees, total] = await Promise.all([
                this.prisma.empleados_mantenimiento.findMany({
                    where,
                    include: {
                        persona: true,
                        credenciales: {
                            where: { estado: 'ACTIVA' }
                        },
                        accesos: {
                            orderBy: { fecha_acceso: 'desc' },
                            take: 5
                        }
                    },
                    skip: (page - 1) * limit,
                    take: limit,
                    orderBy: { created_at: 'desc' }
                }),
                this.prisma.empleados_mantenimiento.count({ where })
            ]);

            return {
                success: true,
                employees,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            };

        } catch (error) {
            logger.error('Error obteniendo empleados:', error);
            throw error;
        }
    }

    /**
     * Calcula expiración de credencial según tipo
     */
    calculateCredentialExpiration(tipo) {
        const now = new Date();
        
        switch (tipo) {
            case 'TEMPORAL':
                return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 días
            case 'RECURRENTE':
                return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 días
            case 'PERMANENTE':
                return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 año
            default:
                return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 horas
        }
    }

    /**
     * Obtiene límite de usos según tipo
     */
    getUsesLimit(tipo) {
        switch (tipo) {
            case 'TEMPORAL': return 20; // 20 usos
            case 'RECURRENTE': return 100; // 100 usos
            case 'PERMANENTE': return -1; // Ilimitado
            default: return 10;
        }
    }

    /**
     * Horario por defecto
     */
    getDefaultSchedule() {
        return {
            lunes: { inicio: '08:00', fin: '18:00', activo: true },
            martes: { inicio: '08:00', fin: '18:00', activo: true },
            miercoles: { inicio: '08:00', fin: '18:00', activo: true },
            jueves: { inicio: '08:00', fin: '18:00', activo: true },
            viernes: { inicio: '08:00', fin: '18:00', activo: true },
            sabado: { inicio: '08:00', fin: '14:00', activo: true },
            domingo: { inicio: '00:00', fin: '00:00', activo: false }
        };
    }

    /**
     * Verifica si la zona está permitida
     */
    isZoneAllowed(zonasPermitidas, puerta) {
        if (!zonasPermitidas || zonasPermitidas.length === 0) return true;
        return zonasPermitidas.includes(puerta.edificio_id) || 
               zonasPermitidas.includes(puerta.id);
    }

    /**
     * Verifica si el horario está permitido
     */
    isTimeAllowed(horarioPermitido) {
        if (!horarioPermitido) return true;

        const now = new Date();
        const currentDay = now.toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();
        const currentTime = now.toTimeString().slice(0, 5);

        const daySchedule = horarioPermitido[currentDay];
        if (!daySchedule || !daySchedule.activo) return false;

        return currentTime >= daySchedule.inicio && currentTime <= daySchedule.fin;
    }

    /**
     * Calcula duración en minutos
     */
    calculateDuration(start, end) {
        return Math.round((end - start) / (1000 * 60)); // minutos
    }

    /**
     * Expira credencial
     */
    async expireCredential(credentialId, reason) {
        await this.prisma.credenciales_mantenimiento.update({
            where: { id: credentialId },
            data: {
                estado: 'VENCIDA',
                fecha_vencimiento_real: new Date(),
                motivo_vencimiento: reason
            }
        });
    }
}

module.exports = MaintenanceEmployeeService;
