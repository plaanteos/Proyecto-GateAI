const jwt = require('jsonwebtoken');
const EnhancedUserManagementService = require('../services/enhancedUserManagementService');

/**
 * HU1 - Middleware de autenticación mejorado
 * Soporte completo para validación de tokens, sesiones y permisos
 */

class EnhancedAuthMiddleware {
    constructor() {
        this.userService = new EnhancedUserManagementService();
        this.jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key_change_in_production';
    }

    /**
     * Middleware principal de autenticación
     * Valida token JWT y sesión si está disponible
     */
    authMiddleware = async (req, res, next) => {
        try {
            // Extraer token del header Authorization
            const authHeader = req.header('Authorization');
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({
                    success: false,
                    message: 'Token de acceso requerido',
                    code: 'NO_TOKEN'
                });
            }

            const token = authHeader.replace('Bearer ', '');
            
            // Validar token JWT
            let decoded;
            try {
                decoded = jwt.verify(token, this.jwtSecret);
            } catch (jwtError) {
                if (jwtError.name === 'TokenExpiredError') {
                    return res.status(401).json({
                        success: false,
                        message: 'Token expirado',
                        code: 'TOKEN_EXPIRED'
                    });
                }
                return res.status(401).json({
                    success: false,
                    message: 'Token inválido',
                    code: 'INVALID_TOKEN'
                });
            }

            // Buscar usuario en el sistema
            const user = this.userService.findUserById(decoded.userId);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no encontrado',
                    code: 'USER_NOT_FOUND'
                });
            }

            // Verificar que el usuario esté activo
            if (!user.active) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario inactivo',
                    code: 'USER_INACTIVE'
                });
            }

            // Verificar sesión si está disponible
            const sessionId = req.cookies?.sessionId;
            if (sessionId) {
                const session = this.userService.sessions.get(sessionId);
                if (!session || !session.active || session.userId !== user.id) {
                    return res.status(401).json({
                        success: false,
                        message: 'Sesión inválida',
                        code: 'INVALID_SESSION'
                    });
                }

                // Actualizar actividad de la sesión
                session.lastActivity = new Date();
            }

            // Obtener rol y permisos
            const role = this.userService.roles.get(user.roleId);
            const permissions = this.userService.getUserPermissions(user.roleId);

            // Agregar información del usuario a la request
            req.user = {
                id: user.id,
                username: user.username,
                email: user.email,
                roleId: user.roleId,
                role: role,
                permissions: permissions,
                profile: user.profile,
                settings: user.settings
            };

            req.session = sessionId ? this.userService.sessions.get(sessionId) : null;

            next();

        } catch (error) {
            console.error('Error en middleware de autenticación:', error);
            return res.status(500).json({
                success: false,
                message: 'Error interno de autenticación',
                code: 'AUTH_ERROR'
            });
        }
    };

    /**
     * Middleware para verificar permisos específicos
     * @param {string|string[]} requiredPermissions - Permisos requeridos
     * @param {string} operator - 'AND' (todos) o 'OR' (al menos uno)
     */
    requirePermissions = (requiredPermissions, operator = 'AND') => {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Autenticación requerida',
                    code: 'AUTH_REQUIRED'
                });
            }

            const userPermissions = req.user.permissions || [];
            const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];

            let hasPermission = false;

            if (operator === 'OR') {
                // Al menos uno de los permisos
                hasPermission = permissions.some(permission => userPermissions.includes(permission));
            } else {
                // Todos los permisos (AND)
                hasPermission = permissions.every(permission => userPermissions.includes(permission));
            }

            if (!hasPermission) {
                return res.status(403).json({
                    success: false,
                    message: 'Permisos insuficientes',
                    code: 'INSUFFICIENT_PERMISSIONS',
                    required: permissions,
                    current: userPermissions
                });
            }

            next();
        };
    };

    /**
     * Middleware para verificar roles específicos
     * @param {string|string[]} allowedRoles - Roles permitidos
     */
    requireRoles = (allowedRoles) => {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Autenticación requerida',
                    code: 'AUTH_REQUIRED'
                });
            }

            const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
            
            if (!roles.includes(req.user.roleId)) {
                return res.status(403).json({
                    success: false,
                    message: 'Rol insuficiente',
                    code: 'INSUFFICIENT_ROLE',
                    required: roles,
                    current: req.user.roleId
                });
            }

            next();
        };
    };

    /**
     * Middleware para verificar nivel de rol mínimo
     * @param {number} minLevel - Nivel mínimo requerido
     */
    requireMinLevel = (minLevel) => {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Autenticación requerida',
                    code: 'AUTH_REQUIRED'
                });
            }

            const userLevel = req.user.role?.level || 999;
            
            if (userLevel > minLevel) {
                return res.status(403).json({
                    success: false,
                    message: 'Nivel de acceso insuficiente',
                    code: 'INSUFFICIENT_LEVEL',
                    required: minLevel,
                    current: userLevel
                });
            }

            next();
        };
    };

    /**
     * Middleware para verificar acceso a edificio específico
     * @param {string} buildingParam - Nombre del parámetro que contiene el edificio
     */
    requireBuildingAccess = (buildingParam = 'building') => {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Autenticación requerida',
                    code: 'AUTH_REQUIRED'
                });
            }

            // Super admins tienen acceso a todos los edificios
            if (req.user.roleId === 'super_admin') {
                return next();
            }

            const requestedBuilding = req.params[buildingParam] || req.body[buildingParam] || req.query[buildingParam];
            const userBuilding = req.user.profile?.building;

            if (requestedBuilding && userBuilding && requestedBuilding !== userBuilding) {
                return res.status(403).json({
                    success: false,
                    message: 'Acceso denegado al edificio solicitado',
                    code: 'BUILDING_ACCESS_DENIED',
                    requested: requestedBuilding,
                    allowed: userBuilding
                });
            }

            next();
        };
    };

    /**
     * Middleware para verificar que el usuario puede acceder a recursos propios o ajenos
     * @param {string} userIdParam - Nombre del parámetro que contiene el ID del usuario
     */
    requireOwnershipOrPermission = (userIdParam = 'userId', permission = 'user_management') => {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Autenticación requerida',
                    code: 'AUTH_REQUIRED'
                });
            }

            const targetUserId = req.params[userIdParam];
            const currentUserId = req.user.id;
            const hasManagementPermission = req.user.permissions.includes(permission);

            // Puede acceder si es su propio recurso o tiene permisos de gestión
            if (targetUserId === currentUserId || hasManagementPermission) {
                return next();
            }

            return res.status(403).json({
                success: false,
                message: 'Acceso denegado: recurso no disponible',
                code: 'RESOURCE_ACCESS_DENIED'
            });
        };
    };

    /**
     * Middleware opcional de autenticación
     * No falla si no hay token, pero agrega información si está disponible
     */
    optionalAuth = async (req, res, next) => {
        try {
            const authHeader = req.header('Authorization');
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return next(); // Continúa sin autenticación
            }

            const token = authHeader.replace('Bearer ', '');
            
            try {
                const decoded = jwt.verify(token, this.jwtSecret);
                const user = this.userService.findUserById(decoded.userId);
                
                if (user && user.active) {
                    const role = this.userService.roles.get(user.roleId);
                    const permissions = this.userService.getUserPermissions(user.roleId);

                    req.user = {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        roleId: user.roleId,
                        role: role,
                        permissions: permissions,
                        profile: user.profile,
                        settings: user.settings
                    };
                }
            } catch (jwtError) {
                // Token inválido, pero continuamos sin autenticación
            }

            next();

        } catch (error) {
            console.error('Error en autenticación opcional:', error);
            next(); // Continúa sin autenticación en caso de error
        }
    };

    /**
     * Middleware para rate limiting por usuario
     * @param {number} maxRequests - Máximo número de requests
     * @param {number} windowMs - Ventana de tiempo en millisegundos
     */
    rateLimitByUser = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
        const userRequests = new Map();

        return (req, res, next) => {
            const userId = req.user?.id || req.ip;
            const now = Date.now();
            
            if (!userRequests.has(userId)) {
                userRequests.set(userId, []);
            }

            const userRequestList = userRequests.get(userId);
            
            // Limpiar requests antiguos
            const validRequests = userRequestList.filter(timestamp => now - timestamp < windowMs);
            userRequests.set(userId, validRequests);

            if (validRequests.length >= maxRequests) {
                return res.status(429).json({
                    success: false,
                    message: 'Demasiadas solicitudes',
                    code: 'RATE_LIMIT_EXCEEDED',
                    retryAfter: Math.ceil(windowMs / 1000)
                });
            }

            validRequests.push(now);
            next();
        };
    };
}

// Crear instancia única del middleware
const authMiddlewareInstance = new EnhancedAuthMiddleware();

module.exports = {
    authMiddleware: authMiddlewareInstance.authMiddleware,
    requirePermissions: authMiddlewareInstance.requirePermissions,
    requireRoles: authMiddlewareInstance.requireRoles,
    requireMinLevel: authMiddlewareInstance.requireMinLevel,
    requireBuildingAccess: authMiddlewareInstance.requireBuildingAccess,
    requireOwnershipOrPermission: authMiddlewareInstance.requireOwnershipOrPermission,
    optionalAuth: authMiddlewareInstance.optionalAuth,
    rateLimitByUser: authMiddlewareInstance.rateLimitByUser,
    EnhancedAuthMiddleware
};
