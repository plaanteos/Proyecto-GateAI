/**
 * Rutas de Gestión de Usuarios
 * CRUD completo de usuarios con roles y permisos
 */

const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const { requirePermission, requireAdmin } = require('../middleware/rbac');
const enhancedUserService = require('../services/enhancedUserManagementService');
const logger = require('../config/logger');

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

/**
 * GET /api/users
 * Obtener lista de usuarios con filtros y paginación
 */
router.get('/',
    auth,
    requirePermission('user_management'),
    [
        query('page').optional().isInt({ min: 1 }).withMessage('Página debe ser un número positivo'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Límite debe estar entre 1 y 100'),
        query('role').optional().isString().withMessage('Rol debe ser una cadena'),
        query('active').optional().isBoolean().withMessage('Activo debe ser un booleano'),
        query('search').optional().isString().withMessage('Búsqueda debe ser una cadena')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const filters = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 20,
                role: req.query.role,
                active: req.query.active !== undefined ? req.query.active === 'true' : undefined,
                search: req.query.search
            };

            const users = await enhancedUserService.getUsers(filters);

            res.json({
                success: true,
                data: users,
                message: 'Usuarios obtenidos exitosamente'
            });

        } catch (error) {
            logger.error('Error obteniendo usuarios:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }
);

/**
 * GET /api/users/:id
 * Obtener usuario específico por ID
 */
router.get('/:id',
    auth,
    requirePermission('user_management'),
    param('id').isString().notEmpty().withMessage('ID de usuario requerido'),
    handleValidationErrors,
    async (req, res) => {
        try {
            const { id } = req.params;

            const user = await enhancedUserService.getUserById(id);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            res.json({
                success: true,
                data: user,
                message: 'Usuario obtenido exitosamente'
            });

        } catch (error) {
            logger.error('Error obteniendo usuario:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }
);

/**
 * POST /api/users
 * Crear nuevo usuario
 */
router.post('/',
    auth,
    requirePermission('user_management'),
    [
        body('username')
            .isLength({ min: 3, max: 50 })
            .withMessage('Username debe tener entre 3 y 50 caracteres')
            .matches(/^[a-zA-Z0-9_]+$/)
            .withMessage('Username solo puede contener letras, números y guiones bajos'),
        body('email')
            .isEmail()
            .withMessage('Email debe ser válido'),
        body('password')
            .isLength({ min: 6 })
            .withMessage('Contraseña debe tener al menos 6 caracteres'),
        body('firstName')
            .notEmpty()
            .withMessage('Nombre es requerido'),
        body('lastName')
            .notEmpty()
            .withMessage('Apellido es requerido'),
        body('role')
            .isIn(['super_admin', 'building_admin', 'security', 'resident', 'manager'])
            .withMessage('Rol no válido'),
        body('phone')
            .optional()
            .isMobilePhone()
            .withMessage('Teléfono debe ser válido'),
        body('buildingId')
            .optional()
            .isString()
            .withMessage('ID de edificio debe ser una cadena')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const userData = {
                username: req.body.username,
                email: req.body.email,
                password: req.body.password,
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                role: req.body.role,
                phone: req.body.phone,
                buildingId: req.body.buildingId,
                createdBy: req.user.id
            };

            const result = await enhancedUserService.createUser(userData);

            if (!result.success) {
                return res.status(400).json(result);
            }

            res.status(201).json({
                success: true,
                data: result.user,
                message: 'Usuario creado exitosamente'
            });

        } catch (error) {
            logger.error('Error creando usuario:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }
);

/**
 * PUT /api/users/:id
 * Actualizar usuario existente
 */
router.put('/:id',
    auth,
    requirePermission('user_management'),
    [
        param('id').isString().notEmpty().withMessage('ID de usuario requerido'),
        body('username')
            .optional()
            .isLength({ min: 3, max: 50 })
            .withMessage('Username debe tener entre 3 y 50 caracteres'),
        body('email')
            .optional()
            .isEmail()
            .withMessage('Email debe ser válido'),
        body('firstName')
            .optional()
            .notEmpty()
            .withMessage('Nombre no puede estar vacío'),
        body('lastName')
            .optional()
            .notEmpty()
            .withMessage('Apellido no puede estar vacío'),
        body('role')
            .optional()
            .isIn(['super_admin', 'building_admin', 'security', 'resident', 'manager'])
            .withMessage('Rol no válido'),
        body('active')
            .optional()
            .isBoolean()
            .withMessage('Activo debe ser un booleano'),
        body('phone')
            .optional()
            .isMobilePhone()
            .withMessage('Teléfono debe ser válido')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { id } = req.params;
            const updateData = req.body;

            const result = await enhancedUserService.updateUser(id, updateData, req.user.id);

            if (!result.success) {
                return res.status(400).json(result);
            }

            res.json({
                success: true,
                data: result.user,
                message: 'Usuario actualizado exitosamente'
            });

        } catch (error) {
            logger.error('Error actualizando usuario:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }
);

/**
 * DELETE /api/users/:id
 * Eliminar usuario (soft delete)
 */
router.delete('/:id',
    auth,
    requireAdmin(), // Solo admins pueden eliminar usuarios
    param('id').isString().notEmpty().withMessage('ID de usuario requerido'),
    handleValidationErrors,
    async (req, res) => {
        try {
            const { id } = req.params;

            // Verificar que no se auto-elimine
            if (id === req.user.id) {
                return res.status(400).json({
                    success: false,
                    message: 'No puedes eliminar tu propia cuenta'
                });
            }

            const result = await enhancedUserService.deleteUser(id, req.user.id);

            if (!result.success) {
                return res.status(400).json(result);
            }

            res.json({
                success: true,
                message: 'Usuario eliminado exitosamente'
            });

        } catch (error) {
            logger.error('Error eliminando usuario:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }
);

/**
 * PUT /api/users/:id/password
 * Cambiar contraseña de usuario
 */
router.put('/:id/password',
    auth,
    [
        param('id').isString().notEmpty().withMessage('ID de usuario requerido'),
        body('currentPassword')
            .notEmpty()
            .withMessage('Contraseña actual es requerida'),
        body('newPassword')
            .isLength({ min: 6 })
            .withMessage('Nueva contraseña debe tener al menos 6 caracteres'),
        body('confirmPassword')
            .custom((value, { req }) => {
                if (value !== req.body.newPassword) {
                    throw new Error('Confirmación de contraseña no coincide');
                }
                return true;
            })
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { id } = req.params;
            const { currentPassword, newPassword } = req.body;

            // Solo el usuario puede cambiar su propia contraseña o un admin
            if (id !== req.user.id && !req.user.permissions.includes('user_management')) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para cambiar esta contraseña'
                });
            }

            const result = await enhancedUserService.changePassword(id, currentPassword, newPassword);

            if (!result.success) {
                return res.status(400).json(result);
            }

            res.json({
                success: true,
                message: 'Contraseña cambiada exitosamente'
            });

        } catch (error) {
            logger.error('Error cambiando contraseña:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }
);

/**
 * PUT /api/users/:id/role
 * Cambiar rol de usuario
 */
router.put('/:id/role',
    auth,
    requireAdmin(),
    [
        param('id').isString().notEmpty().withMessage('ID de usuario requerido'),
        body('role')
            .isIn(['super_admin', 'building_admin', 'security', 'resident', 'manager'])
            .withMessage('Rol no válido'),
        body('reason')
            .optional()
            .isString()
            .withMessage('Razón debe ser una cadena')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { id } = req.params;
            const { role, reason } = req.body;

            const result = await enhancedUserService.changeUserRole(id, role, req.user.id, reason);

            if (!result.success) {
                return res.status(400).json(result);
            }

            res.json({
                success: true,
                data: result.user,
                message: 'Rol de usuario cambiado exitosamente'
            });

        } catch (error) {
            logger.error('Error cambiando rol de usuario:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }
);

/**
 * GET /api/users/roles/available
 * Obtener roles disponibles
 */
router.get('/roles/available',
    auth,
    requirePermission('user_management'),
    async (req, res) => {
        try {
            const roles = await enhancedUserService.getAvailableRoles();

            res.json({
                success: true,
                data: roles,
                message: 'Roles obtenidos exitosamente'
            });

        } catch (error) {
            logger.error('Error obteniendo roles:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }
);

/**
 * GET /api/users/:id/permissions
 * Obtener permisos de usuario
 */
router.get('/:id/permissions',
    auth,
    requirePermission('user_management'),
    param('id').isString().notEmpty().withMessage('ID de usuario requerido'),
    handleValidationErrors,
    async (req, res) => {
        try {
            const { id } = req.params;

            const permissions = await enhancedUserService.getUserPermissions(id);

            res.json({
                success: true,
                data: permissions,
                message: 'Permisos obtenidos exitosamente'
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
 * GET /api/users/statistics
 * Obtener estadísticas de usuarios
 */
router.get('/statistics',
    auth,
    requirePermission('user_management'),
    async (req, res) => {
        try {
            const stats = await enhancedUserService.getUserStatistics();

            res.json({
                success: true,
                data: stats,
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
);

/**
 * POST /api/users/:id/activate
 * Activar usuario
 */
router.post('/:id/activate',
    auth,
    requirePermission('user_management'),
    param('id').isString().notEmpty().withMessage('ID de usuario requerido'),
    handleValidationErrors,
    async (req, res) => {
        try {
            const { id } = req.params;

            const result = await enhancedUserService.activateUser(id, req.user.id);

            if (!result.success) {
                return res.status(400).json(result);
            }

            res.json({
                success: true,
                data: result.user,
                message: 'Usuario activado exitosamente'
            });

        } catch (error) {
            logger.error('Error activando usuario:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }
);

/**
 * POST /api/users/:id/deactivate
 * Desactivar usuario
 */
router.post('/:id/deactivate',
    auth,
    requirePermission('user_management'),
    [
        param('id').isString().notEmpty().withMessage('ID de usuario requerido'),
        body('reason')
            .optional()
            .isString()
            .withMessage('Razón debe ser una cadena')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { id } = req.params;
            const { reason } = req.body;

            // Verificar que no se auto-desactive
            if (id === req.user.id) {
                return res.status(400).json({
                    success: false,
                    message: 'No puedes desactivar tu propia cuenta'
                });
            }

            const result = await enhancedUserService.deactivateUser(id, req.user.id, reason);

            if (!result.success) {
                return res.status(400).json(result);
            }

            res.json({
                success: true,
                data: result.user,
                message: 'Usuario desactivado exitosamente'
            });

        } catch (error) {
            logger.error('Error desactivando usuario:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }
);

module.exports = router;