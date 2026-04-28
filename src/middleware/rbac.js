/**
 * Middleware RBAC - Control de Acceso Basado en Roles
 * Verifica permisos reales según el rol del usuario autenticado
 */

const logger = require('../utils/logger');

/**
 * Mapa de permisos por rol.
 * Cada rol hereda los permisos de roles de menor jerarquía.
 */
const ROLE_PERMISSIONS = {
    super_admin: ['*'], // Acceso total
    admin: [
        'users.read', 'users.create', 'users.update', 'users.delete',
        'maintenance.read', 'maintenance.create', 'maintenance.update', 'maintenance.delete',
        'access.read', 'access.validate', 'access.manage',
        'reports.read', 'reports.export',
        'security.read', 'security.manage',
        'rbac.read', 'rbac.manage',
        'dashboard.read', 'dashboard.realtime',
        'visitors.read', 'visitors.create', 'visitors.update', 'visitors.delete',
        'buildings.read', 'buildings.create', 'buildings.update', 'buildings.delete',
        'notifications.send', 'notifications.read',
        'qr.generate', 'qr.validate'
    ],
    security: [
        'access.read', 'access.validate',
        'visitors.read', 'visitors.create', 'visitors.update',
        'maintenance.read',
        'dashboard.read', 'dashboard.realtime',
        'reports.read',
        'security.read',
        'qr.validate'
    ],
    receptionist: [
        'visitors.read', 'visitors.create', 'visitors.update',
        'access.read', 'access.validate',
        'dashboard.read',
        'qr.validate'
    ],
    maintenance: [
        'access.read',
        'dashboard.read'
    ],
    user: [
        'access.read',
        'visitors.read'
    ]
};

/**
 * Verifica si un rol tiene un permiso específico
 */
function hasPermission(role, permission) {
    const rolePerms = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS['user'];
    // super_admin tiene acceso total
    if (rolePerms.includes('*')) return true;
    return rolePerms.includes(permission);
}

/**
 * Middleware para verificar permiso específico
 */
function requirePermission(permission) {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Autenticación requerida'
                });
            }

            const userRole = req.user.role || 'user';

            if (!hasPermission(userRole, permission)) {
                logger.warn(`⛔ Acceso denegado: usuario ${req.user.username} (rol: ${userRole}) intentó acceder a permiso: ${permission}`);
                return res.status(403).json({
                    success: false,
                    message: 'Acceso denegado - Permisos insuficientes',
                    required_permission: permission,
                    user_role: userRole
                });
            }

            logger.info(`✅ Acceso permitido: ${req.user.username} (${userRole}) → ${permission}`);
            next();
        } catch (error) {
            logger.error('Error en middleware RBAC:', error);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    };
}

/**
 * Middleware para verificar si el usuario es administrador
 */
function requireAdmin() {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Autenticación requerida'
                });
            }

            const adminRoles = ['admin', 'super_admin'];
            if (!adminRoles.includes(req.user.role)) {
                logger.warn(`⛔ Acceso admin denegado para usuario ${req.user.username} (rol: ${req.user.role})`);
                return res.status(403).json({
                    success: false,
                    message: 'Acceso denegado - Se requieren privilegios de administrador'
                });
            }

            next();
        } catch (error) {
            logger.error('Error en middleware admin:', error);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    };
}

/**
 * Middleware para verificar al menos uno de los permisos requeridos
 */
function requireAnyPermission(permissions) {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Autenticación requerida'
                });
            }

            const userRole = req.user.role || 'user';
            const granted = permissions.some(p => hasPermission(userRole, p));

            if (!granted) {
                logger.warn(`⛔ Acceso denegado: ${req.user.username} (${userRole}) necesita alguno de: ${permissions.join(', ')}`);
                return res.status(403).json({
                    success: false,
                    message: 'Acceso denegado - Permisos insuficientes',
                    required_permissions: permissions,
                    user_role: userRole
                });
            }

            next();
        } catch (error) {
            logger.error('Error en middleware RBAC múltiple:', error);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    };
}

/**
 * Devuelve los permisos disponibles para un rol (útil para el frontend)
 */
function getPermissionsForRole(role) {
    return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS['user'];
}

module.exports = {
    requirePermission,
    requireAdmin,
    requireAnyPermission,
    getPermissionsForRole,
    ROLE_PERMISSIONS
};
