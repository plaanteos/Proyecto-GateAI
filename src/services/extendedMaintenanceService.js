/**
 * Extensión del Servicio de Empleados de Mantenimiento
 * Funcionalidades adicionales para completar la implementación
 */

const MaintenanceEmployeeService = require('./maintenanceEmployeeService');
const logger = require('../config/logger');

class ExtendedMaintenanceService extends MaintenanceEmployeeService {

    /**
     * Registro rápido con configuraciones predefinidas por tipo
     */
    async registroRapidoEmpleado(tipoEmpleado, datosBasicos, usuarioCreador) {
        try {
            logger.info(`🔧 Iniciando registro rápido: ${tipoEmpleado}`);

            const configuracionPorTipo = this.obtenerConfiguracionPorTipo(tipoEmpleado);
            
            const datosCompletos = {
                ...datosBasicos,
                ...configuracionPorTipo,
                tipo_empleado: tipoEmpleado.toUpperCase()
            };

            const resultado = await this.registerMaintenanceEmployee(datosCompletos, usuarioCreador);

            // Generar informe de registro
            const informe = await this.generarInformeRegistro(resultado.maintenanceEmployee, resultado.credential);

            return {
                success: true,
                empleado: resultado.maintenanceEmployee,
                credencial: resultado.credential,
                informe,
                configuracion_aplicada: configuracionPorTipo
            };

        } catch (error) {
            logger.error('❌ Error en registro rápido:', error);
            throw error;
        }
    }

    /**
     * Configuraciones predefinidas por tipo de empleado
     */
    obtenerConfiguracionPorTipo(tipo) {
        const configuraciones = {
            TEMPORAL: {
                especialidad: 'MANTENIMIENTO_GENERAL',
                fecha_inicio: new Date(),
                fecha_fin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
                zonas_permitidas: ['ZONA_COMUN', 'SERVICIOS'],
                horario_permitido: {
                    lunes: { inicio: '09:00', fin: '17:00', activo: true },
                    martes: { inicio: '09:00', fin: '17:00', activo: true },
                    miercoles: { inicio: '09:00', fin: '17:00', activo: true },
                    jueves: { inicio: '09:00', fin: '17:00', activo: true },
                    viernes: { inicio: '09:00', fin: '17:00', activo: true },
                    sabado: { inicio: '09:00', fin: '13:00', activo: true },
                    domingo: { inicio: '00:00', fin: '00:00', activo: false }
                },
                documentos_verificacion: ['IDENTIFICACION', 'CERTIFICACION']
            },
            RECURRENTE: {
                especialidad: 'LIMPIEZA',
                fecha_inicio: new Date(),
                fecha_fin: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 días
                zonas_permitidas: ['ZONA_COMUN', 'OFICINAS', 'SERVICIOS'],
                horario_permitido: {
                    lunes: { inicio: '06:00', fin: '14:00', activo: true },
                    martes: { inicio: '06:00', fin: '14:00', activo: true },
                    miercoles: { inicio: '06:00', fin: '14:00', activo: true },
                    jueves: { inicio: '06:00', fin: '14:00', activo: true },
                    viernes: { inicio: '06:00', fin: '14:00', activo: true },
                    sabado: { inicio: '06:00', fin: '12:00', activo: true },
                    domingo: { inicio: '00:00', fin: '00:00', activo: false }
                },
                documentos_verificacion: ['IDENTIFICACION', 'CONTRATO', 'SEGURO']
            },
            PERMANENTE: {
                especialidad: 'SEGURIDAD',
                fecha_inicio: new Date(),
                fecha_fin: null, // Sin fecha de fin
                zonas_permitidas: ['TODAS_LAS_ZONAS'],
                horario_permitido: {
                    lunes: { inicio: '00:00', fin: '23:59', activo: true },
                    martes: { inicio: '00:00', fin: '23:59', activo: true },
                    miercoles: { inicio: '00:00', fin: '23:59', activo: true },
                    jueves: { inicio: '00:00', fin: '23:59', activo: true },
                    viernes: { inicio: '00:00', fin: '23:59', activo: true },
                    sabado: { inicio: '00:00', fin: '23:59', activo: true },
                    domingo: { inicio: '00:00', fin: '23:59', activo: true }
                },
                documentos_verificacion: ['IDENTIFICACION', 'CONTRATO', 'SEGURO', 'CERTIFICACION']
            }
        };

        return configuraciones[tipo.toUpperCase()] || configuraciones.TEMPORAL;
    }

    /**
     * Generar informe detallado de registro
     */
    async generarInformeRegistro(empleado, credencial) {
        const tipoConfig = this.obtenerConfiguracionPorTipo(empleado.tipo_empleado);
        
        return {
            empleado_info: {
                id: empleado.id,
                nombre_completo: `${empleado.persona?.nombre} ${empleado.persona?.apellido}`,
                documento: empleado.persona?.documento_identidad,
                tipo: empleado.tipo_empleado,
                especialidad: empleado.especialidad,
                empresa: empleado.empresa_mantenimiento
            },
            credencial_info: {
                codigo_qr: credencial.codigo_qr,
                tipo_credencial: credencial.tipo_credencial,
                estado: credencial.estado,
                fecha_expiracion: credencial.fecha_expiracion,
                usos_permitidos: credencial.usos_permitidos
            },
            acceso_info: {
                zonas_permitidas: credencial.zonas_permitidas,
                horario_permitido: credencial.horario_permitido,
                fecha_inicio: empleado.fecha_inicio,
                fecha_fin: empleado.fecha_fin
            },
            recomendaciones: this.generarRecomendacionesPorTipo(empleado.tipo_empleado)
        };
    }

    /**
     * Recomendaciones específicas por tipo de empleado
     */
    generarRecomendacionesPorTipo(tipo) {
        const recomendaciones = {
            TEMPORAL: [
                'Verificar documentos antes del primer acceso',
                'Coordinar con el supervisor de área',
                'Revisar el estado de la credencial semanalmente',
                'Programar renovación antes del vencimiento'
            ],
            RECURRENTE: [
                'Establecer rutina de verificación mensual',
                'Coordinar horarios con otros empleados',
                'Verificar cumplimiento de protocolos de seguridad',
                'Revisar reportes de actividad mensualmente'
            ],
            PERMANENTE: [
                'Programar revisión anual de accesos',
                'Actualizar documentación de certificaciones',
                'Coordinar con recursos humanos para renovaciones',
                'Establecer protocolo de emergencia'
            ]
        };

        return recomendaciones[tipo] || recomendaciones.TEMPORAL;
    }

    /**
     * Obtener estadísticas por tipo de empleado
     */
    async obtenerEstadisticasPorTipo() {
        try {
            const stats = await this.prisma.empleados_Mantenimiento.groupBy({
                by: ['tipo_empleado', 'especialidad', 'estado'],
                _count: { id: true },
                where: { 
                    fecha_desactivacion: null 
                }
            });

            const estadisticas = {
                por_tipo: {},
                por_especialidad: {},
                por_estado: {},
                total_activos: 0
            };

            stats.forEach(stat => {
                // Por tipo
                if (!estadisticas.por_tipo[stat.tipo_empleado]) {
                    estadisticas.por_tipo[stat.tipo_empleado] = 0;
                }
                estadisticas.por_tipo[stat.tipo_empleado] += stat._count.id;

                // Por especialidad
                if (!estadisticas.por_especialidad[stat.especialidad]) {
                    estadisticas.por_especialidad[stat.especialidad] = 0;
                }
                estadisticas.por_especialidad[stat.especialidad] += stat._count.id;

                // Por estado
                if (!estadisticas.por_estado[stat.estado]) {
                    estadisticas.por_estado[stat.estado] = 0;
                }
                estadisticas.por_estado[stat.estado] += stat._count.id;

                if (stat.estado === 'ACTIVO') {
                    estadisticas.total_activos += stat._count.id;
                }
            });

            return {
                success: true,
                estadisticas,
                fecha_consulta: new Date()
            };

        } catch (error) {
            logger.error('❌ Error obteniendo estadísticas por tipo:', error);
            throw error;
        }
    }

    /**
     * Generar credenciales masivas para un grupo
     */
    async generarCredencialesMasivas(empleadosIds, configuracion) {
        try {
            const resultados = [];
            
            for (const empleadoId of empleadosIds) {
                try {
                    const empleado = await this.prisma.empleados_Mantenimiento.findUnique({
                        where: { id: empleadoId },
                        include: { persona: true }
                    });

                    if (empleado) {
                        const credencial = await this.createMaintenanceCredential(
                            empleadoId,
                            empleado.tipo_empleado,
                            configuracion.zonas_permitidas || empleado.zonas_permitidas,
                            configuracion.horario_permitido || empleado.horario_permitido
                        );

                        resultados.push({
                            empleado_id: empleadoId,
                            success: true,
                            credencial: credencial,
                            empleado_info: {
                                nombre: `${empleado.persona.nombre} ${empleado.persona.apellido}`,
                                documento: empleado.persona.documento_identidad
                            }
                        });
                    }
                } catch (error) {
                    resultados.push({
                        empleado_id: empleadoId,
                        success: false,
                        error: error.message
                    });
                }
            }

            const exitosos = resultados.filter(r => r.success).length;
            const fallidos = resultados.filter(r => !r.success).length;

            logger.info(`📋 Credenciales masivas generadas: ${exitosos} exitosas, ${fallidos} fallidas`);

            return {
                success: true,
                resumen: {
                    total_procesados: empleadosIds.length,
                    exitosos,
                    fallidos
                },
                resultados
            };

        } catch (error) {
            logger.error('❌ Error generando credenciales masivas:', error);
            throw error;
        }
    }
}

module.exports = new ExtendedMaintenanceService();