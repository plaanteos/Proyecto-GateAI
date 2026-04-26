const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    // Obtener token del header Authorization
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido',
        error: 'No authorization token provided'
      });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Agregar información del usuario al request
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado',
        error: 'Token has expired'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido',
        error: 'Invalid token'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Error verificando token',
      error: error.message
    });
  }
};

// Middleware opcional para rutas que pueden funcionar con o sin token
const optionalAuth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    }
    
    next();
  } catch (error) {
    // Si hay error con el token, continuar sin usuario autenticado
    req.user = null;
    next();
  }
};

// Middleware para verificar roles específicos
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autenticación requerida'
      });
    }
    
    const userRole = req.user.role || 'user';
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Permisos insuficientes',
        requiredRoles: allowedRoles,
        userRole: userRole
      });
    }
    
    next();
  };
};

// Middleware para verificar si es admin
const requireAdmin = requireRole(['admin', 'super_admin']);

// Middleware para verificar si es personal de seguridad o admin
const requireSecurity = requireRole(['security', 'admin', 'super_admin']);

module.exports = {
  auth,
  optionalAuth,
  requireRole,
  requireAdmin,
  requireSecurity
};
