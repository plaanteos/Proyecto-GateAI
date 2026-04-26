/**
 * Rutas para Gestión de Documentos de Invitaciones
 * Implementa las funcionalidades requeridas en "nuevos problemas.txt"
 */

const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const documentoInvitacionService = require('../services/documentoInvitacionService');
const path = require('path');
const fs = require('fs').promises;

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

// Configurar multer para subida de archivos
const upload = documentoInvitacionService.getMulterConfig();

/**
 * POST /api/documentos-invitacion/:invitacionId/subir
 * Subir documento a una invitación
 */
router.post('/:invitacionId/subir',
    auth,
    requirePermission('GESTIONAR_INVITACIONES'),
    param('invitacionId').isInt().withMessage('ID de invitación debe ser un número'),
    body('tipo_documento')
        .isIn(['IDENTIFICACION', 'CONTRATO', 'SEGURO', 'CERTIFICACION', 'AUTORIZACION'])
        .withMessage('Tipo de documento no válido'),
    handleValidationErrors,
    (req, res, next) => {
        upload.single('documento')(req, res, (err) => {
            if (err) {
                return res.status(400).json({
                    success: false,
                    message: 'Error en la subida del archivo',
                    error: err.message
                });
            }
            next();
        });
    },
    async (req, res) => {
        try {
            const { invitacionId } = req.params;
            const { tipo_documento } = req.body;

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No se proporcionó ningún archivo'
                });
            }

            // Agregar metadata adicional al archivo
            req.file.ip = req.ip;

            const resultado = await documentoInvitacionService.subirDocumento(
                invitacionId,
                req.file,
                tipo_documento,
                req.user.id
            );

            res.status(201).json(resultado);

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }
);

/**
 * GET /api/documentos-invitacion/:invitacionId
 * Obtener documentos de una invitación
 */
router.get('/:invitacionId',
    auth,
    requirePermission('VER_INVITACIONES'),
    param('invitacionId').isInt().withMessage('ID de invitación debe ser un número'),
    handleValidationErrors,
    async (req, res) => {
        try {
            const { invitacionId } = req.params;

            const resultado = await documentoInvitacionService.obtenerDocumentosInvitacion(invitacionId);

            res.json(resultado);

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }
);

/**
 * PUT /api/documentos-invitacion/:documentoId/verificar
 * Verificar documento (aprobar/rechazar)
 */
router.put('/:documentoId/verificar',
    auth,
    requirePermission('VERIFICAR_DOCUMENTOS'),
    param('documentoId').isInt().withMessage('ID de documento debe ser un número'),
    body('estado')
        .isIn(['VERIFICADO', 'RECHAZADO'])
        .withMessage('Estado debe ser VERIFICADO o RECHAZADO'),
    body('observaciones')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Observaciones no pueden exceder 500 caracteres'),
    handleValidationErrors,
    async (req, res) => {
        try {
            const { documentoId } = req.params;
            const { estado, observaciones } = req.body;

            const resultado = await documentoInvitacionService.verificarDocumento(
                documentoId,
                estado,
                observaciones,
                req.user.id
            );

            res.json(resultado);

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }
);

/**
 * PUT /api/documentos-invitacion/:invitacionId/requisitos
 * Definir documentos requeridos para una invitación
 */
router.put('/:invitacionId/requisitos',
    auth,
    requirePermission('GESTIONAR_INVITACIONES'),
    param('invitacionId').isInt().withMessage('ID de invitación debe ser un número'),
    body('documentos_requeridos')
        .isArray({ min: 1 })
        .withMessage('Debe especificar al menos un documento requerido'),
    body('documentos_requeridos.*')
        .isIn(['IDENTIFICACION', 'CONTRATO', 'SEGURO', 'CERTIFICACION', 'AUTORIZACION'])
        .withMessage('Tipo de documento no válido'),
    handleValidationErrors,
    async (req, res) => {
        try {
            const { invitacionId } = req.params;
            const { documentos_requeridos } = req.body;

            const resultado = await documentoInvitacionService.definirDocumentosRequeridos(
                invitacionId,
                documentos_requeridos,
                req.user.id
            );

            res.json(resultado);

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }
);

/**
 * DELETE /api/documentos-invitacion/:documentoId
 * Eliminar documento
 */
router.delete('/:documentoId',
    auth,
    requirePermission('GESTIONAR_INVITACIONES'),
    param('documentoId').isInt().withMessage('ID de documento debe ser un número'),
    body('motivo')
        .optional()
        .isLength({ max: 200 })
        .withMessage('Motivo no puede exceder 200 caracteres'),
    handleValidationErrors,
    async (req, res) => {
        try {
            const { documentoId } = req.params;
            const { motivo } = req.body;

            const resultado = await documentoInvitacionService.eliminarDocumento(
                documentoId,
                req.user.id,
                motivo
            );

            res.json(resultado);

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }
);

/**
 * GET /api/documentos-invitacion/:documentoId/descargar
 * Descargar archivo de documento
 */
router.get('/:documentoId/descargar',
    auth,
    requirePermission('VER_INVITACIONES'),
    param('documentoId').isInt().withMessage('ID de documento debe ser un número'),
    handleValidationErrors,
    async (req, res) => {
        try {
            const { documentoId } = req.params;

            // Buscar el documento en la base de datos
            const documento = await documentoInvitacionService.prisma.documentos_Invitacion.findUnique({
                where: { 
                    id: parseInt(documentoId),
                    deleted_at: null 
                },
                include: { invitacion: { include: { persona: true } } }
            });

            if (!documento) {
                return res.status(404).json({
                    success: false,
                    message: 'Documento no encontrado'
                });
            }

            // Verificar que el archivo existe
            try {
                await fs.access(documento.ruta_archivo);
            } catch (error) {
                return res.status(404).json({
                    success: false,
                    message: 'Archivo no encontrado en el sistema'
                });
            }

            // Registrar descarga en auditoría
            await documentoInvitacionService.prisma.auditoria.create({
                data: {
                    usuario_id: req.user.id,
                    accion: 'DESCARGAR_DOCUMENTO_INVITACION',
                    descripcion: `Descarga de documento ${documento.tipo_documento} de invitación ${documento.invitacion_id}`,
                    tabla_afectada: 'DocumentosInvitacion',
                    registro_id: documento.id
                }
            });

            // Configurar headers para descarga
            res.setHeader('Content-Type', documento.mime_type);
            res.setHeader('Content-Disposition', `attachment; filename="${documento.nombre_archivo}"`);
            res.setHeader('Content-Length', documento.tamanio_bytes);

            // Enviar archivo
            res.sendFile(path.resolve(documento.ruta_archivo));

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }
);

/**
 * GET /api/documentos-invitacion/estadisticas
 * Obtener estadísticas de documentos
 */
router.get('/estadisticas',
    auth,
    requirePermission('VER_REPORTES'),
    async (req, res) => {
        try {
            const resultado = await documentoInvitacionService.obtenerEstadisticasDocumentos();

            res.json(resultado);

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }
);

/**
 * GET /api/documentos-invitacion/tipos-permitidos
 * Obtener tipos de documentos permitidos
 */
router.get('/tipos-permitidos',
    auth,
    async (req, res) => {
        try {
            const tiposPermitidos = [
                {
                    codigo: 'IDENTIFICACION',
                    nombre: 'Documento de Identificación',
                    descripcion: 'Cédula, Pasaporte, Licencia de Conducir',
                    requerido: true
                },
                {
                    codigo: 'CONTRATO',
                    nombre: 'Contrato o Carta de Invitación',
                    descripcion: 'Documento que justifica la visita',
                    requerido: false
                },
                {
                    codigo: 'SEGURO',
                    nombre: 'Póliza de Seguro',
                    descripcion: 'Seguro de responsabilidad civil',
                    requerido: false
                },
                {
                    codigo: 'CERTIFICACION',
                    nombre: 'Certificación Profesional',
                    descripcion: 'Certificados, licencias profesionales',
                    requerido: false
                },
                {
                    codigo: 'AUTORIZACION',
                    nombre: 'Autorización Especial',
                    descripcion: 'Permisos especiales o autorizaciones',
                    requerido: false
                }
            ];

            res.json({
                success: true,
                tipos_permitidos: tiposPermitidos
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }
);

module.exports = router;