// Middleware de autenticación simplificado para demo
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'uniontech_demo_secret_key_2025';

// Middleware de autenticación
const auth = (req, res, next) => {
  try {
    // Verificar que req existe y tiene el método header
    if (!req || typeof req.header !== 'function') {
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor - request inválido'
      });
    }
    
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado'
      });
    }

    console.error('❌ Error en middleware auth:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Middleware para verificar token (alias)
const authenticateToken = auth;

// Middleware para verificar roles específicos
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Permisos insuficientes'
      });
    }

    next();
  };
};

// Middleware para verificar si es admin
const requireAdmin = requireRole('admin');

// Middleware para verificar si es admin o security
const requireSecurityAccess = requireRole(['admin', 'security']);

module.exports = {
  auth,
  authenticateToken,
  requireRole,
  requireAdmin,
  requireSecurityAccess
};
