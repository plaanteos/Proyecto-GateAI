/**
 * Rutas para RBAC (Role-Based Access Control)
 * Gestión de roles y permisos
 */

const express = require('express');
const router = express.Router();
const { getRBACInstance } = require('../services/rbacService');
const { auth } = require('../middleware/auth');
const { requirePermission, requireAdmin } = require('../middleware/rbac');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');
const rbacController = require('../controllers/rbacController');

// Aplicar autenticación a todas las rutas
router.use(auth);

/**
 * @route GET /api/rbac/roles
 * @desc Obtener todos los roles disponibles
 * @access Requiere permiso: users.manage_roles
 */
router.get('/roles', 
    requirePermission('users.manage_roles'),
    rbacController.getRoles
);

/**
 * @route GET /api/rbac/permissions
 * @desc Obtener todos los permisos disponibles
 * @access Requiere permiso: users.manage_roles
 */
router.get('/permissions',
    requirePermission('users.manage_roles'),
    rbacController.getPermissions
);

/**
 * @route GET /api/rbac/roles/:roleId/permissions
 * @desc Obtener permisos de un rol específico
 * @access Requiere permiso: users.manage_roles
 */
router.get('/roles/:roleId/permissions',
    requirePermission('users.manage_roles'),
    rbacController.getRolePermissions
);

/**
 * @route POST /api/rbac/check-permission
 * @desc Verificar si un usuario tiene un permiso específico
 * @access Requiere autenticación
 */
router.post('/check-permission',
    [
        body('permission').notEmpty().withMessage('Permiso es requerido')
    ],
    rbacController.checkUserPermission
);

/**
 * @route GET /api/rbac/stats
 * @desc Obtener estadísticas del sistema RBAC
 * @access Requiere permiso: system.view_stats
 */
router.get('/stats',
    requirePermission('system.view_stats'),
    rbacController.getRBACStats
);

/**
 * @route GET /api/rbac/users/:userId/permissions
 * @desc Obtener permisos de un usuario específico
 * @access Requiere permiso: users.read
 */
router.get('/users/:userId/permissions',
    rbacService.requirePermission('users.read'),
    async (req, res) => {
        try {
            const userId = parseInt(req.params.userId);
            
            if (isNaN(userId)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de usuario inválido'
                });
            }

            const permissionSummary = await rbacService.getUserPermissionSummary(userId);
            
            if (!permissionSummary) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            res.json({
                success: true,
                data: permissionSummary,
                message: 'Permisos de usuario obtenidos exitosamente'
            });

        } catch (error) {
            logger.error('Error obteniendo permisos de usuario:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }
);

/**
 * @route POST /api/rbac/users/:userId/grant-permission
 * @desc Otorgar permiso adicional a un usuario
 * @access Requiere permiso: users.manage_roles
 */
router.post('/users/:userId/grant-permission',
    rbacService.requirePermission('users.manage_roles'),
    [
        body('permission_name')
            .notEmpty()
            .withMessage('Nombre del permiso requerido')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos de entrada inválidos',
                    errors: errors.array()
                });
            }

            const userId = parseInt(req.params.userId);
            const { permission_name } = req.body;

            if (isNaN(userId)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de usuario inválido'
                });
            }

            const result = await rbacService.grantUserPermission(
                userId,
                permission_name,
                req.user.id
            );

            res.json(result);

        } catch (error) {
            logger.error('Error otorgando permiso:', error);
            res.status(500).json({
                success: false,
                message: 'Error otorgando permiso',
                error: error.message
            });
        }
    }
);

/**
 * @route DELETE /api/rbac/users/:userId/revoke-permission
 * @desc Revocar permiso de un usuario
 * @access Requiere permiso: users.manage_roles
 */
router.delete('/users/:userId/revoke-permission',
    rbacService.requirePermission('users.manage_roles'),
    [
        body('permission_name')
            .notEmpty()
            .withMessage('Nombre del permiso requerido')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos de entrada inválidos',
                    errors: errors.array()
                });
            }

            const userId = parseInt(req.params.userId);
            const { permission_name } = req.body;

            if (isNaN(userId)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de usuario inválido'
                });
            }

            const result = await rbacService.revokeUserPermission(
                userId,
                permission_name,
                req.user.id
            );

            res.json(result);

        } catch (error) {
            logger.error('Error revocando permiso:', error);
            res.status(500).json({
                success: false,
                message: 'Error revocando permiso',
                error: error.message
            });
        }
    }
);

/**
 * @route PUT /api/rbac/users/:userId/change-role
 * @desc Cambiar rol de un usuario
 * @access Requiere permiso: users.manage_roles
 */
router.put('/users/:userId/change-role',
    rbacService.requirePermission('users.manage_roles'),
    [
        body('new_role_id')
            .isInt({ min: 1 })
            .withMessage('ID de rol válido requerido')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos de entrada inválidos',
                    errors: errors.array()
                });
            }

            const userId = parseInt(req.params.userId);
            const { new_role_id } = req.body;

            if (isNaN(userId)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de usuario inválido'
                });
            }

            const result = await rbacService.changeUserRole(
                userId,
                new_role_id,
                req.user.id
            );

            res.json(result);

        } catch (error) {
            logger.error('Error cambiando rol:', error);
            res.status(500).json({
                success: false,
                message: 'Error cambiando rol de usuario',
                error: error.message
            });
        }
    }
);

/**
 * @route POST /api/rbac/check-permission
 * @desc Verificar si el usuario actual tiene un permiso específico
 * @access Autenticado
 */
router.post('/check-permission',
    [
        body('permission_name')
            .notEmpty()
            .withMessage('Nombre del permiso requerido')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos de entrada inválidos',
                    errors: errors.array()
                });
            }

            const { permission_name } = req.body;
            const hasPermission = await rbacService.hasPermission(req.user.id, permission_name);

            res.json({
                success: true,
                data: {
                    userId: req.user.id,
                    permission: permission_name,
                    hasPermission
                },
                message: 'Verificación de permiso completada'
            });

        } catch (error) {
            logger.error('Error verificando permiso:', error);
            res.status(500).json({
                success: false,
                message: 'Error verificando permiso',
                error: error.message
            });
        }
    }
);

/**
 * @route POST /api/rbac/check-multiple-permissions
 * @desc Verificar múltiples permisos del usuario actual
 * @access Autenticado
 */
router.post('/check-multiple-permissions',
    [
        body('permissions')
            .isArray({ min: 1 })
            .withMessage('Array de permisos requerido')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos de entrada inválidos',
                    errors: errors.array()
                });
            }

            const { permissions } = req.body;
            const userPermissions = await rbacService.getUserPermissions(req.user.id);

            const permissionResults = permissions.map(permission => ({
                permission,
                hasPermission: userPermissions.includes(permission)
            }));

            res.json({
                success: true,
                data: {
                    userId: req.user.id,
                    results: permissionResults,
                    allUserPermissions: userPermissions
                },
                message: 'Verificación múltiple de permisos completada'
            });

        } catch (error) {
            logger.error('Error verificando múltiples permisos:', error);
            res.status(500).json({
                success: false,
                message: 'Error verificando permisos',
                error: error.message
            });
        }
    }
);

/**
 * @route GET /api/rbac/my-permissions
 * @desc Obtener todos los permisos del usuario actual
 * @access Autenticado
 */
router.get('/my-permissions', async (req, res) => {
    try {
        const permissionSummary = await rbacService.getUserPermissionSummary(req.user.id);
        
        if (!permissionSummary) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            data: permissionSummary,
            message: 'Permisos obtenidos exitosamente'
        });

    } catch (error) {
        logger.error('Error obteniendo mis permisos:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo permisos',
            error: error.message
        });
    }
});

module.exports = router;
