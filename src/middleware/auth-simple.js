/**
 * Middleware de autenticación unificado
 * Reemplaza la versión anterior con mockData — ahora solo usa JWT real
 */
const jwt = require('jsonwebtoken');

// Middleware de autenticación principal
const auth = (req, res, next) => {
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ success: false, message: 'JWT_SECRET no configurado en el servidor' });
  }
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Normalizar estructura de req.user para todo el sistema
    req.user = {
      id: decoded.id || decoded.userId,
      username: decoded.username,
      role: decoded.role || decoded.rol || decoded.rolNombre || 'user',
      persona_id: decoded.persona_id
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expirado' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Token inválido' });
    }
    return res.status(500).json({ success: false, message: 'Error verificando token' });
  }
};

// Middleware de autenticación opcional
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = {
        id: decoded.id || decoded.userId,
        username: decoded.username,
        role: decoded.role || decoded.rol || decoded.rolNombre || 'user',
        persona_id: decoded.persona_id
      };
    }
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

// Middleware para requerir rol específico
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Autenticación requerida' });
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Permisos insuficientes',
        requiredRoles: allowedRoles,
        userRole: req.user.role
      });
    }

    next();
  };
};

const requireAdmin = requireRole(['admin', 'super_admin']);
const requireSecurity = requireRole(['admin', 'super_admin', 'security']);

module.exports = {
  auth,
  optionalAuth,
  requireRole,
  requireAdmin,
  requireSecurity
};
