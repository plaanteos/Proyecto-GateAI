/**
 * Rutas para Empleados de Mantenimiento
 * Gestión completa de personal de mantenimiento
 */

const express = require('express');
const router = express.Router();
const { MaintenanceEmployeeController, validateEmployeeRegistration } = require('../controllers/maintenanceEmployeeController');
const { auth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const extendedMaintenanceService = require('../services/extendedMaintenanceService');
const { body, validationResult } = require('express-validator');

// Aplicar autenticación a todas las rutas
router.use(auth);

/**
 * @route GET /api/maintenance/employees
 * @desc Obtener empleados de mantenimiento con filtros
 * @access Requiere permiso: maintenance.read
 */
router.get('/employees', 
    requirePermission('maintenance.read'),
    MaintenanceEmployeeController.getMaintenanceEmployees
);

/**
 * @route POST /api/maintenance/employees
 * @desc Registrar nuevo empleado de mantenimiento
 * @access Requiere permiso: maintenance.create
 */
router.post('/employees',
    requirePermission('maintenance.create'),
    validateEmployeeRegistration,
    MaintenanceEmployeeController.registerEmployee
);

/**
 * @route PUT /api/maintenance/employees/:id
 * @desc Actualizar empleado de mantenimiento
 * @access Requiere permiso: maintenance.update
 */
router.put('/employees/:id',
    requirePermission('maintenance.update'),
    MaintenanceEmployeeController.updateEmployee
);

/**
 * @route DELETE /api/maintenance/employees/:id
 * @desc Eliminar empleado de mantenimiento
 * @access Requiere permiso: maintenance.delete
 */
router.delete('/employees/:id',
    requirePermission('maintenance.delete'),
    MaintenanceEmployeeController.deleteEmployee
);

/**
 * @route POST /api/maintenance/validate-access
 * @desc Validar acceso de empleado de mantenimiento
 * @access Requiere permiso: access.validate
 */
router.post('/validate-access',
    requirePermission('access.validate'),
    MaintenanceEmployeeController.validateAccess
);

/**
 * @route POST /api/maintenance/generate-qr/:id
 * @desc Generar código QR para empleado
 * @access Requiere permiso: access.validate
 */
/* TEMPORAL: Comentado hasta implementar método
router.post('/generate-qr/:id',
    requirePermission('access.validate'),
    MaintenanceEmployeeController.generateQR
);
*/

/**
 * @route PUT /api/maintenance/renew-credential/:id
 * @desc Renovar credencial de empleado
 * @access Requiere permiso: access.manage
 */
/* TEMPORAL: Comentado hasta implementar método
router.put('/renew-credential/:id',
    requirePermission('access.manage'),
    MaintenanceEmployeeController.renewCredential
);
*/

/**
 * @route GET /api/maintenance/access-logs/:id
 * @desc Obtener registros de acceso de empleado
 * @access Requiere permiso: access.read
 */
/* TEMPORAL: Comentado hasta implementar método
router.get('/access-logs/:id',
    requirePermission('access.read'),
    MaintenanceEmployeeController.getAccessLogs
);
*/

/**
 * @route GET /api/maintenance/stats
 * @desc Obtener estadísticas del sistema de mantenimiento
 * @access Requiere permiso: maintenance.read
 */
/* TEMPORAL: Comentado hasta implementar método
router.get('/stats',
    requirePermission('maintenance.read'),
    MaintenanceEmployeeController.getMaintenanceStats
);
*/

/**
 * @route PUT /api/maintenance/employees/:employeeId
 * @desc Actualizar empleado de mantenimiento
 * @access Requiere permiso: maintenance.update
 */
router.put('/employees/:employeeId',
    requirePermission('maintenance.update'),
    MaintenanceEmployeeController.updateEmployee
);

/**
 * @route DELETE /api/maintenance/employees/:employeeId
 * @desc Desactivar empleado de mantenimiento
 * @access Requiere permiso: maintenance.delete
 */
router.delete('/employees/:employeeId',
    requirePermission('maintenance.delete'),
    MaintenanceEmployeeController.deactivateEmployee
);

/**
 * @route POST /api/maintenance/validate-access
 * @desc Validar acceso de empleado de mantenimiento
 * @access Requiere permiso: access.validate
 */
router.post('/validate-access',
    requirePermission('access.validate'),
    MaintenanceEmployeeController.validateAccess
);

/**
 * @route POST /api/maintenance/register-exit
 * @desc Registrar salida de empleado
 * @access Requiere permiso: access.validate
 */
router.post('/register-exit',
    requirePermission('access.validate'),
    MaintenanceEmployeeController.registerExit
);

/**
 * @route PUT /api/maintenance/employees/:employeeId/renew-credential
 * @desc Renovar credencial temporal
 * @access Requiere permiso: maintenance.manage_credentials
 */
router.put('/employees/:employeeId/renew-credential',
    requirePermission('maintenance.manage_credentials'),
    MaintenanceEmployeeController.renewCredential
);

/**
 * @route GET /api/maintenance/employee-history/:id
 * @desc Obtener historial específico de empleado
 * @access Requiere permiso: access.read
 */
/* TEMPORAL: Comentado hasta implementar método
router.get('/employee-history/:id',
    requirePermission('access.read'),
    MaintenanceEmployeeController.getEmployeeAccessHistory
);
*/

/**
 * @route GET /api/maintenance/statistics
 * @desc Obtener estadísticas de empleados de mantenimiento
 * @access Requiere permiso: access.read
 */
/* TEMPORAL: Comentado hasta implementar método
router.get('/statistics',
    requirePermission('access.read'),
    MaintenanceEmployeeController.getStatistics
);
*/

/**
 * @route POST /api/maintenance/registro-rapido
 * @desc Registro rápido de empleado con configuración predefinida
 * @access Requiere permiso: maintenance.create
 */
router.post('/registro-rapido',
    requirePermission('maintenance.create'),
    [
        body('tipo_empleado')
            .isIn(['TEMPORAL', 'RECURRENTE', 'PERMANENTE'])
            .withMessage('Tipo de empleado debe ser TEMPORAL, RECURRENTE o PERMANENTE'),
        body('documento_identidad')
            .notEmpty()
            .withMessage('Documento de identidad es requerido'),
        body('nombre')
            .notEmpty()
            .withMessage('Nombre es requerido'),
        body('apellido')
            .notEmpty()
            .withMessage('Apellido es requerido'),
        body('empresa_mantenimiento')
            .notEmpty()
            .withMessage('Empresa de mantenimiento es requerida')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Errores de validación',
                    errors: errors.array()
                });
            }

            const { tipo_empleado, ...datosBasicos } = req.body;
            
            const resultado = await extendedMaintenanceService.registroRapidoEmpleado(
                tipo_empleado,
                datosBasicos,
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
 * @route GET /api/maintenance/estadisticas-por-tipo
 * @desc Obtener estadísticas detalladas por tipo de empleado
 * @access Requiere permiso: maintenance.read
 */
router.get('/estadisticas-por-tipo',
    requirePermission('maintenance.read'),
    async (req, res) => {
        try {
            const resultado = await extendedMaintenanceService.obtenerEstadisticasPorTipo();
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
 * @route POST /api/maintenance/credenciales-masivas
 * @desc Generar credenciales masivas para múltiples empleados
 * @access Requiere permiso: maintenance.manage_credentials
 */
router.post('/credenciales-masivas',
    requirePermission('maintenance.manage_credentials'),
    [
        body('empleados_ids')
            .isArray({ min: 1 })
            .withMessage('Se requiere al menos un ID de empleado'),
        body('empleados_ids.*')
            .isInt()
            .withMessage('Los IDs de empleados deben ser números enteros')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Errores de validación',
                    errors: errors.array()
                });
            }

            const { empleados_ids, configuracion = {} } = req.body;
            
            const resultado = await extendedMaintenanceService.generarCredencialesMasivas(
                empleados_ids,
                configuracion
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
 * @route GET /api/maintenance/tipos-configuracion
 * @desc Obtener configuraciones predefinidas por tipo de empleado
 * @access Requiere permiso: maintenance.read
 */
router.get('/tipos-configuracion',
    requirePermission('maintenance.read'),
    async (req, res) => {
        try {
            const configuraciones = {
                TEMPORAL: extendedMaintenanceService.obtenerConfiguracionPorTipo('TEMPORAL'),
                RECURRENTE: extendedMaintenanceService.obtenerConfiguracionPorTipo('RECURRENTE'),
                PERMANENTE: extendedMaintenanceService.obtenerConfiguracionPorTipo('PERMANENTE')
            };

            res.json({
                success: true,
                configuraciones,
                descripcion: {
                    TEMPORAL: 'Para trabajos puntuales de 1-7 días',
                    RECURRENTE: 'Para empleados que regresan periódicamente',
                    PERMANENTE: 'Para empleados con acceso continuo'
                }
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
