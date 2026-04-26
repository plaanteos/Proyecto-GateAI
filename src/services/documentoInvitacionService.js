/**
 * Servicio de Gestión de Documentos de Invitaciones
 * Implementa la funcionalidad requerida en "nuevos problemas.txt"
 * Maneja subida, validación y verificación de documentos
 */

const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const logger = require('../config/logger');

class DocumentoInvitacionService {
    constructor() {
        this.prisma = new PrismaClient();
        this.uploadPath = path.join(process.cwd(), 'uploads', 'documentos-invitaciones');
        this.allowedMimeTypes = [
            'application/pdf',
            'image/jpeg',
            'image/jpg', 
            'image/png',
            'image/webp',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        this.initializeUploadDirectory();
    }

    /**
     * Inicializar directorio de uploads
     */
    async initializeUploadDirectory() {
        try {
            await fs.mkdir(this.uploadPath, { recursive: true });
            logger.info(`📁 Directorio de documentos inicializado: ${this.uploadPath}`);
        } catch (error) {
            logger.error('❌ Error inicializando directorio de documentos:', error);
        }
    }

    /**
     * Configurar Multer para subida de archivos
     */
    getMulterConfig() {
        const storage = multer.diskStorage({
            destination: async (req, file, cb) => {
                const invitacionId = req.params.invitacionId || req.body.invitacionId;
                const uploadDir = path.join(this.uploadPath, `invitacion-${invitacionId}`);
                
                try {
                    await fs.mkdir(uploadDir, { recursive: true });
                    cb(null, uploadDir);
                } catch (error) {
                    cb(error);
                }
            },
            filename: (req, file, cb) => {
                const timestamp = Date.now();
                const tipoDocumento = req.body.tipo_documento || 'documento';
                const ext = path.extname(file.originalname);
                const filename = `${tipoDocumento}-${timestamp}${ext}`;
                cb(null, filename);
            }
        });

        const fileFilter = (req, file, cb) => {
            if (this.allowedMimeTypes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`), false);
            }
        };

        return multer({
            storage,
            fileFilter,
            limits: {
                fileSize: this.maxFileSize,
                files: 5 // Máximo 5 archivos por invitación
            }
        });
    }

    /**
     * Calcular hash SHA-256 de un archivo
     */
    async calculateFileHash(filePath) {
        try {
            const fileBuffer = await fs.readFile(filePath);
            return crypto.createHash('sha256').update(fileBuffer).digest('hex');
        } catch (error) {
            logger.error('❌ Error calculando hash del archivo:', error);
            throw error;
        }
    }

    /**
     * Subir documento a una invitación
     */
    async subirDocumento(invitacionId, fileData, tipoDocumento, usuarioId) {
        try {
            logger.info(`📎 Subiendo documento para invitación ${invitacionId}`);

            // Verificar que la invitación existe
            const invitacion = await this.prisma.invitaciones.findUnique({
                where: { id: parseInt(invitacionId) },
                include: { persona: true }
            });

            if (!invitacion) {
                throw new Error('Invitación no encontrada');
            }

            // Calcular hash del archivo
            const hashArchivo = await this.calculateFileHash(fileData.path);

            // Verificar si ya existe un archivo con el mismo hash
            const duplicado = await this.prisma.documentos_Invitacion.findFirst({
                where: {
                    invitacion_id: parseInt(invitacionId),
                    hash_archivo: hashArchivo
                }
            });

            if (duplicado) {
                // Eliminar archivo duplicado
                await fs.unlink(fileData.path);
                throw new Error('Este documento ya fue subido anteriormente');
            }

            // Crear registro en base de datos
            const documento = await this.prisma.documentos_Invitacion.create({
                data: {
                    invitacion_id: parseInt(invitacionId),
                    tipo_documento: tipoDocumento.toUpperCase(),
                    nombre_archivo: fileData.originalname,
                    ruta_archivo: fileData.path,
                    mime_type: fileData.mimetype,
                    tamanio_bytes: fileData.size,
                    hash_archivo: hashArchivo,
                    estado: 'PENDIENTE',
                    metadata: {
                        upload_user_id: usuarioId,
                        upload_timestamp: new Date().toISOString(),
                        original_filename: fileData.originalname,
                        upload_ip: fileData.ip || 'unknown'
                    }
                }
            });

            // Actualizar estado de documentos en la invitación
            await this.actualizarEstadoDocumentosInvitacion(invitacionId);

            // Crear log de auditoría
            await this.prisma.auditoria.create({
                data: {
                    usuario_id: usuarioId,
                    accion: 'SUBIR_DOCUMENTO_INVITACION',
                    descripcion: `Documento ${tipoDocumento} subido para invitación ${invitacionId}`,
                    tabla_afectada: 'DocumentosInvitacion',
                    registro_id: documento.id,
                    valores_nuevos: {
                        documento_id: documento.id,
                        tipo_documento: tipoDocumento,
                        nombre_archivo: fileData.originalname,
                        invitacion_id: invitacionId
                    }
                }
            });

            logger.info(`✅ Documento subido exitosamente: ${documento.id}`);
            
            return {
                success: true,
                documento,
                message: 'Documento subido exitosamente'
            };

        } catch (error) {
            logger.error('❌ Error subiendo documento:', error);
            
            // Limpiar archivo si hubo error
            if (fileData && fileData.path) {
                try {
                    await fs.unlink(fileData.path);
                } catch (unlinkError) {
                    logger.error('❌ Error eliminando archivo tras fallo:', unlinkError);
                }
            }

            throw error;
        }
    }

    /**
     * Actualizar estado de documentos de una invitación
     */
    async actualizarEstadoDocumentosInvitacion(invitacionId) {
        try {
            const invitacion = await this.prisma.invitaciones.findUnique({
                where: { id: parseInt(invitacionId) },
                include: { documentos: true }
            });

            if (!invitacion) {
                throw new Error('Invitación no encontrada');
            }

            const documentosRequeridos = invitacion.documentos_requeridos 
                ? JSON.parse(invitacion.documentos_requeridos)
                : ['IDENTIFICACION']; // Por defecto requerir identificación

            const documentosSubidos = invitacion.documentos.filter(doc => doc.deleted_at === null);
            const tiposSubidos = documentosSubidos.map(doc => doc.tipo_documento);
            
            const documentosCompletos = documentosRequeridos.every(tipo => 
                tiposSubidos.includes(tipo)
            );

            let estadoDocumentos = 'PENDIENTE';
            if (documentosSubidos.length === 0) {
                estadoDocumentos = 'PENDIENTE';
            } else if (documentosCompletos) {
                const todosVerificados = documentosSubidos.every(doc => doc.estado === 'VERIFICADO');
                estadoDocumentos = todosVerificados ? 'VERIFICADO' : 'COMPLETO';
            } else {
                estadoDocumentos = 'PARCIAL';
            }

            await this.prisma.invitaciones.update({
                where: { id: parseInt(invitacionId) },
                data: {
                    documentos_completados: documentosCompletos,
                    estado_documentos: estadoDocumentos,
                    updated_at: new Date()
                }
            });

            return {
                documentos_completos: documentosCompletos,
                estado_documentos: estadoDocumentos,
                documentos_subidos: documentosSubidos.length,
                documentos_requeridos: documentosRequeridos.length
            };

        } catch (error) {
            logger.error('❌ Error actualizando estado de documentos:', error);
            throw error;
        }
    }

    /**
     * Verificar documento por parte del administrador
     */
    async verificarDocumento(documentoId, estado, observaciones, usuarioVerificadorId) {
        try {
            const documento = await this.prisma.documentos_Invitacion.findUnique({
                where: { id: parseInt(documentoId) },
                include: { invitacion: true }
            });

            if (!documento) {
                throw new Error('Documento no encontrado');
            }

            const documentoActualizado = await this.prisma.documentos_Invitacion.update({
                where: { id: parseInt(documentoId) },
                data: {
                    estado: estado.toUpperCase(),
                    verificado_por: usuarioVerificadorId,
                    fecha_verificacion: new Date(),
                    observaciones: observaciones || null,
                    updated_at: new Date()
                }
            });

            // Actualizar estado general de documentos de la invitación
            await this.actualizarEstadoDocumentosInvitacion(documento.invitacion_id);

            // Auditoría
            await this.prisma.auditoria.create({
                data: {
                    usuario_id: usuarioVerificadorId,
                    accion: 'VERIFICAR_DOCUMENTO_INVITACION',
                    descripcion: `Documento ${documento.tipo_documento} ${estado.toLowerCase()} para invitación ${documento.invitacion_id}`,
                    tabla_afectada: 'DocumentosInvitacion',
                    registro_id: documento.id,
                    valores_anteriores: { estado: documento.estado },
                    valores_nuevos: { 
                        estado: estado.toUpperCase(),
                        verificado_por: usuarioVerificadorId,
                        observaciones 
                    }
                }
            });

            logger.info(`✅ Documento ${documentoId} verificado como ${estado}`);
            
            return {
                success: true,
                documento: documentoActualizado,
                message: `Documento ${estado.toLowerCase()} exitosamente`
            };

        } catch (error) {
            logger.error('❌ Error verificando documento:', error);
            throw error;
        }
    }

    /**
     * Obtener documentos de una invitación
     */
    async obtenerDocumentosInvitacion(invitacionId) {
        try {
            const invitacion = await this.prisma.invitaciones.findUnique({
                where: { id: parseInt(invitacionId) },
                include: {
                    documentos: {
                        where: { deleted_at: null },
                        include: { verificador: { select: { username: true } } },
                        orderBy: { created_at: 'desc' }
                    },
                    persona: { 
                        select: { 
                            nombre: true, 
                            apellido: true, 
                            documento_identidad: true 
                        } 
                    }
                }
            });

            if (!invitacion) {
                throw new Error('Invitación no encontrada');
            }

            const documentosRequeridos = invitacion.documentos_requeridos 
                ? JSON.parse(invitacion.documentos_requeridos)
                : ['IDENTIFICACION'];

            return {
                success: true,
                invitacion: {
                    id: invitacion.id,
                    persona: invitacion.persona,
                    estado: invitacion.estado,
                    estado_documentos: invitacion.estado_documentos,
                    documentos_completados: invitacion.documentos_completados,
                    documentos_requeridos: documentosRequeridos
                },
                documentos: invitacion.documentos.map(doc => ({
                    id: doc.id,
                    tipo_documento: doc.tipo_documento,
                    nombre_archivo: doc.nombre_archivo,
                    mime_type: doc.mime_type,
                    tamanio_bytes: doc.tamanio_bytes,
                    estado: doc.estado,
                    fecha_subida: doc.created_at,
                    fecha_verificacion: doc.fecha_verificacion,
                    verificado_por: doc.verificador?.username,
                    observaciones: doc.observaciones
                }))
            };

        } catch (error) {
            logger.error('❌ Error obteniendo documentos de invitación:', error);
            throw error;
        }
    }

    /**
     * Definir documentos requeridos para una invitación
     */
    async definirDocumentosRequeridos(invitacionId, tiposDocumentos, usuarioId) {
        try {
            const invitacion = await this.prisma.invitaciones.update({
                where: { id: parseInt(invitacionId) },
                data: {
                    documentos_requeridos: JSON.stringify(tiposDocumentos),
                    updated_at: new Date()
                }
            });

            // Actualizar estado de documentos
            await this.actualizarEstadoDocumentosInvitacion(invitacionId);

            // Auditoría
            await this.prisma.auditoria.create({
                data: {
                    usuario_id: usuarioId,
                    accion: 'DEFINIR_DOCUMENTOS_REQUERIDOS',
                    descripcion: `Documentos requeridos definidos para invitación ${invitacionId}`,
                    tabla_afectada: 'Invitaciones',
                    registro_id: invitacionId,
                    valores_nuevos: { documentos_requeridos: tiposDocumentos }
                }
            });

            return {
                success: true,
                documentos_requeridos: tiposDocumentos,
                message: 'Documentos requeridos definidos exitosamente'
            };

        } catch (error) {
            logger.error('❌ Error definiendo documentos requeridos:', error);
            throw error;
        }
    }

    /**
     * Eliminar documento
     */
    async eliminarDocumento(documentoId, usuarioId, motivo = '') {
        try {
            const documento = await this.prisma.documentos_Invitacion.findUnique({
                where: { id: parseInt(documentoId) }
            });

            if (!documento) {
                throw new Error('Documento no encontrado');
            }

            // Soft delete
            const documentoEliminado = await this.prisma.documentos_Invitacion.update({
                where: { id: parseInt(documentoId) },
                data: {
                    deleted_at: new Date(),
                    observaciones: `${documento.observaciones || ''}\nEliminado: ${motivo}`.trim()
                }
            });

            // Actualizar estado de documentos de la invitación
            await this.actualizarEstadoDocumentosInvitacion(documento.invitacion_id);

            // Auditoría
            await this.prisma.auditoria.create({
                data: {
                    usuario_id: usuarioId,
                    accion: 'ELIMINAR_DOCUMENTO_INVITACION',
                    descripcion: `Documento ${documento.tipo_documento} eliminado. Motivo: ${motivo}`,
                    tabla_afectada: 'DocumentosInvitacion',
                    registro_id: documento.id,
                    valores_anteriores: { deleted_at: null },
                    valores_nuevos: { deleted_at: new Date(), motivo }
                }
            });

            // Eliminar archivo físico (opcional, por seguridad mantener)
            // await fs.unlink(documento.ruta_archivo);

            logger.info(`🗑️ Documento ${documentoId} eliminado por usuario ${usuarioId}`);
            
            return {
                success: true,
                message: 'Documento eliminado exitosamente'
            };

        } catch (error) {
            logger.error('❌ Error eliminando documento:', error);
            throw error;
        }
    }

    /**
     * Obtener estadísticas de documentos
     */
    async obtenerEstadisticasDocumentos() {
        try {
            const stats = await this.prisma.documentos_Invitacion.groupBy({
                by: ['estado', 'tipo_documento'],
                _count: { id: true },
                where: { deleted_at: null }
            });

            const estadisticas = {
                por_estado: {},
                por_tipo: {},
                total: 0
            };

            stats.forEach(stat => {
                // Por estado
                if (!estadisticas.por_estado[stat.estado]) {
                    estadisticas.por_estado[stat.estado] = 0;
                }
                estadisticas.por_estado[stat.estado] += stat._count.id;

                // Por tipo
                if (!estadisticas.por_tipo[stat.tipo_documento]) {
                    estadisticas.por_tipo[stat.tipo_documento] = 0;
                }
                estadisticas.por_tipo[stat.tipo_documento] += stat._count.id;

                estadisticas.total += stat._count.id;
            });

            return {
                success: true,
                estadisticas
            };

        } catch (error) {
            logger.error('❌ Error obteniendo estadísticas de documentos:', error);
            throw error;
        }
    }
}

module.exports = new DocumentoInvitacionService();