const jwt = require('jsonwebtoken');
const { findUserById } = require('../data/mockData');

const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_super_segura';

// Middleware de autenticación principal
const auth = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Buscar usuario en datos hardcodeados
    const user = findUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    req.user = {
      id: decoded.userId,
      username: decoded.username,
      rolId: decoded.rolId,
      rolNombre: decoded.rolNombre
    };
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

// Middleware de autenticación opcional
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = findUserById(decoded.userId);
      
      if (user) {
        req.user = {
          id: decoded.userId,
          username: decoded.username,
          rolId: decoded.rolId,
          rolNombre: decoded.rolNombre
        };
      }
    }
    next();
  } catch (error) {
    // Si hay error en el token, continúa sin usuario
    next();
  }
};

// Middleware para requerir rol específico
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticación requerida' });
    }

    const userRoles = Array.isArray(roles) ? roles : [roles];
    if (!userRoles.includes(req.user.rolNombre)) {
      return res.status(403).json({ error: 'Permisos insuficientes' });
    }

    next();
  };
};

// Middlewares específicos por rol
const requireAdmin = requireRole('admin');
const requireSecurity = requireRole(['admin', 'security']);

module.exports = {
  auth,
  optionalAuth,
  requireRole,
  requireAdmin,
  requireSecurity
};
