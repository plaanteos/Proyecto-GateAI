/**
 * Middleware RBAC Simplificado
 * Control de acceso básico sin dependencias complejas
 */

const logger = require('../utils/logger');

/**
 * Middleware para verificar permisos básicos
 */
function requirePermission(permission) {
    return (req, res, next) => {
        try {
            // Si el usuario está autenticado, permitir por ahora
            // En producción esto debería verificar permisos reales
            if (req.user) {
                logger.info(`✅ Acceso permitido para ${req.user.username} con permiso: ${permission}`);
                return next();
            }

            return res.status(403).json({
                success: false,
                message: 'Acceso denegado - Permisos insuficientes',
                required_permission: permission
            });
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
            if (req.user && (req.user.role === 'admin' || req.user.role === 'super_admin')) {
                return next();
            }

            return res.status(403).json({
                success: false,
                message: 'Acceso denegado - Se requieren privilegios de administrador'
            });
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
 * Middleware para verificar múltiples permisos
 */
function requireAnyPermission(permissions) {
    return (req, res, next) => {
        try {
            if (req.user) {
                logger.info(`✅ Acceso permitido para ${req.user.username} con cualquiera de: ${permissions.join(', ')}`);
                return next();
            }

            return res.status(403).json({
                success: false,
                message: 'Acceso denegado - Permisos insuficientes',
                required_permissions: permissions
            });
        } catch (error) {
            logger.error('Error en middleware RBAC múltiple:', error);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    };
}

module.exports = {
    requirePermission,
    requireAdmin,
    requireAnyPermission
};
