/**
 * Rutas RBAC Simplificadas - Temporal
 * Rutas básicas de RBAC para que el servidor pueda iniciarse
 */

const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { requirePermission, requireAdmin } = require('../middleware/rbac');
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

module.exports = router;