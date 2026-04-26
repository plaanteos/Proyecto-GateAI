const express = require('express');
const router = express.Router();
const EnhancedAuthController = require('../controllers/enhancedAuthController');
const { authMiddleware } = require('../middleware/auth');

/**
 * HU1 y HU2 - Rutas mejoradas para autenticación y gestión de usuarios
 * Incluye endpoints completos para login, registro, CRUD de usuarios y gestión de roles
 */

const authController = new EnhancedAuthController();

// =====================================
// RUTAS DE AUTENTICACIÓN (HU1)
// =====================================

/**
 * @route POST /api/auth/login
 * @desc Login de usuario con gestión de sesiones
 * @access Public
 */
router.post('/login', authController.login.bind(authController));

/**
 * @route POST /api/auth/validate
 * @desc Validar token y sesión
 * @access Private
 */
router.post('/validate', authController.validateToken.bind(authController));

/**
 * @route POST /api/auth/logout
 * @desc Logout de usuario
 * @access Private
 */
router.post('/logout', authController.logout.bind(authController));

/**
 * @route GET /api/auth/profile
 * @desc Obtener perfil del usuario actual
 * @access Private
 */
router.get('/profile', authMiddleware, authController.getProfile.bind(authController));

/**
 * @route PUT /api/auth/profile
 * @desc Actualizar perfil del usuario actual
 * @access Private
 */
router.put('/profile', authMiddleware, authController.updateProfile.bind(authController));

/**
 * @route POST /api/auth/change-password
 * @desc Cambiar contraseña del usuario actual
 * @access Private
 */
router.post('/change-password', authMiddleware, authController.changePassword.bind(authController));

/**
 * @route GET /api/auth/sessions
 * @desc Obtener sesiones activas del usuario
 * @access Private
 */
router.get('/sessions', authMiddleware, authController.getActiveSessions.bind(authController));

/**
 * @route DELETE /api/auth/sessions/:sessionId
 * @desc Invalidar sesión específica
 * @access Private
 */
router.delete('/sessions/:sessionId', authMiddleware, authController.invalidateSession.bind(authController));

// =====================================
// RUTAS DE GESTIÓN DE USUARIOS (HU2)
// =====================================

/**
 * @route GET /api/auth/users
 * @desc Listar usuarios con filtros y paginación
 * @access Private (requiere permisos)
 */
router.get('/users', authMiddleware, authController.listUsers.bind(authController));

/**
 * @route POST /api/auth/users
 * @desc Crear nuevo usuario
 * @access Private (requiere permisos)
 */
router.post('/users', authMiddleware, authController.createUser.bind(authController));

/**
 * @route GET /api/auth/users/stats
 * @desc Obtener estadísticas del sistema de usuarios
 * @access Private (requiere permisos)
 */
router.get('/users/stats', authMiddleware, authController.getUserStats.bind(authController));

/**
 * @route GET /api/auth/users/:userId
 * @desc Obtener usuario por ID
 * @access Private (requiere permisos)
 */
router.get('/users/:userId', authMiddleware, authController.getUserById.bind(authController));

/**
 * @route PUT /api/auth/users/:userId
 * @desc Actualizar usuario
 * @access Private (requiere permisos)
 */
router.put('/users/:userId', authMiddleware, authController.updateUser.bind(authController));

/**
 * @route DELETE /api/auth/users/:userId
 * @desc Eliminar usuario (soft delete)
 * @access Private (requiere permisos)
 */
router.delete('/users/:userId', authMiddleware, authController.deleteUser.bind(authController));

/**
 * @route PATCH /api/auth/users/:userId/status
 * @desc Activar/Desactivar usuario
 * @access Private (requiere permisos)
 */
router.patch('/users/:userId/status', authMiddleware, authController.toggleUserStatus.bind(authController));

/**
 * @route PATCH /api/auth/users/:userId/role
 * @desc Cambiar rol de usuario
 * @access Private (requiere permisos)
 */
router.patch('/users/:userId/role', authMiddleware, authController.changeUserRole.bind(authController));

// =====================================
// RUTAS DE ROLES Y PERMISOS (HU2)
// =====================================

/**
 * @route GET /api/auth/roles
 * @desc Obtener todos los roles disponibles
 * @access Private (requiere permisos)
 */
router.get('/roles', authMiddleware, authController.getRoles.bind(authController));

/**
 * @route GET /api/auth/permissions
 * @desc Obtener todos los permisos disponibles
 * @access Private (requiere permisos)
 */
router.get('/permissions', authMiddleware, authController.getPermissions.bind(authController));

// =====================================
// MIDDLEWARE DE VALIDACIÓN
// =====================================

// Middleware para validar datos de creación de usuario
const validateUserCreation = (req, res, next) => {
    const { username, email, password, firstName, lastName, roleId } = req.body;
    
    const errors = [];
    
    if (!username || username.length < 3) {
        errors.push('El nombre de usuario debe tener al menos 3 caracteres');
    }
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('Email inválido');
    }
    
    if (!password || password.length < 8) {
        errors.push('La contraseña debe tener al menos 8 caracteres');
    }
    
    if (!firstName || firstName.trim().length < 2) {
        errors.push('El nombre debe tener al menos 2 caracteres');
    }
    
    if (!lastName || lastName.trim().length < 2) {
        errors.push('El apellido debe tener al menos 2 caracteres');
    }
    
    if (!roleId) {
        errors.push('El rol es requerido');
    }
    
    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Datos de validación incorrectos',
            errors
        });
    }
    
    next();
};

// Aplicar middleware de validación a la ruta de creación
router.post('/users', authMiddleware, validateUserCreation, authController.createUser.bind(authController));

// Middleware para validar datos de actualización de usuario
const validateUserUpdate = (req, res, next) => {
    const { email, firstName, lastName } = req.body;
    
    const errors = [];
    
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('Email inválido');
    }
    
    if (firstName && firstName.trim().length < 2) {
        errors.push('El nombre debe tener al menos 2 caracteres');
    }
    
    if (lastName && lastName.trim().length < 2) {
        errors.push('El apellido debe tener al menos 2 caracteres');
    }
    
    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Datos de validación incorrectos',
            errors
        });
    }
    
    next();
};

// Aplicar middleware de validación a la ruta de actualización
router.put('/users/:userId', authMiddleware, validateUserUpdate, authController.updateUser.bind(authController));

// Middleware para validar cambio de contraseña
const validatePasswordChange = (req, res, next) => {
    const { currentPassword, newPassword } = req.body;
    
    const errors = [];
    
    if (!currentPassword) {
        errors.push('La contraseña actual es requerida');
    }
    
    if (!newPassword || newPassword.length < 8) {
        errors.push('La nueva contraseña debe tener al menos 8 caracteres');
    }
    
    if (newPassword && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
        errors.push('La nueva contraseña debe contener al menos una minúscula, una mayúscula y un número');
    }
    
    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Datos de validación incorrectos',
            errors
        });
    }
    
    next();
};

// Aplicar middleware de validación al cambio de contraseña
router.post('/change-password', authMiddleware, validatePasswordChange, authController.changePassword.bind(authController));

// =====================================
// DOCUMENTACIÓN DE LA API
// =====================================

/**
 * @route GET /api/auth/docs
 * @desc Obtener documentación de la API de autenticación
 * @access Public
 */
router.get('/docs', (req, res) => {
    res.json({
        title: 'UnionTech Authentication API',
        version: '1.0.0',
        description: 'API completa para autenticación y gestión de usuarios en UnionTech',
        endpoints: {
            authentication: {
                'POST /login': 'Iniciar sesión',
                'POST /validate': 'Validar token',
                'POST /logout': 'Cerrar sesión',
                'GET /profile': 'Obtener perfil',
                'PUT /profile': 'Actualizar perfil',
                'POST /change-password': 'Cambiar contraseña',
                'GET /sessions': 'Sesiones activas',
                'DELETE /sessions/:id': 'Invalidar sesión'
            },
            users: {
                'GET /users': 'Listar usuarios',
                'POST /users': 'Crear usuario',
                'GET /users/stats': 'Estadísticas de usuarios',
                'GET /users/:id': 'Obtener usuario',
                'PUT /users/:id': 'Actualizar usuario',
                'DELETE /users/:id': 'Eliminar usuario',
                'PATCH /users/:id/status': 'Cambiar estado',
                'PATCH /users/:id/role': 'Cambiar rol'
            },
            roles: {
                'GET /roles': 'Listar roles',
                'GET /permissions': 'Listar permisos'
            }
        },
        features: {
            'HU1': 'Sistema completo de autenticación con gestión de sesiones',
            'HU2': 'Gestión completa de usuarios y roles con permisos granulares',
            'Security': 'Bloqueo automático de cuentas, hash de contraseñas, validación de tokens',
            'Audit': 'Logging completo de acciones de usuarios y eventos de seguridad'
        }
    });
});

// =====================================
// MANEJO DE ERRORES
// =====================================

// Error handler específico para rutas de autenticación
router.use((error, req, res, next) => {
    console.error('Error en rutas de autenticación:', error);
    
    // Error de JWT
    if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Token inválido',
            code: 'INVALID_TOKEN'
        });
    }
    
    // Error de token expirado
    if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token expirado',
            code: 'TOKEN_EXPIRED'
        });
    }
    
    // Error de validación
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Error de validación',
            errors: error.errors,
            code: 'VALIDATION_ERROR'
        });
    }
    
    // Error genérico
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR'
    });
});

module.exports = router;
