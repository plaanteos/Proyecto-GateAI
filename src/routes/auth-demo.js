const express = require('express');
const authController = require('../controllers/authController-demo');
const { authValidation, handleValidationErrors } = require('../middleware/validation');
const { auth } = require('../middleware/auth-demo');

const router = express.Router();

// POST /api/auth/login
router.post('/login', 
  authValidation.login,
  handleValidationErrors,
  authController.login
);

// POST /api/auth/register
router.post('/register',
  authValidation.register,
  handleValidationErrors,
  authController.register
);

// GET /api/auth/verify - Verificar token válido
router.get('/verify',
  auth,
  authController.verifyToken
);

// PUT /api/auth/change-password
router.put('/change-password',
  auth,
  authValidation.changePassword,
  handleValidationErrors,
  authController.changePassword
);

// POST /api/auth/request-reset - Solicitar reset de contraseña
router.post('/request-reset',
  authController.requestPasswordReset
);

// GET /api/auth/verify-reset/:token - Verificar token de reset
router.get('/verify-reset/:token',
  authController.verifyResetToken
);

// POST /api/auth/reset-password - Restablecer contraseña
router.post('/reset-password',
  authController.resetPassword
);

// GET /api/auth/users - Obtener usuarios (solo admin)
router.get('/users',
  auth,
  authController.getUsers
);

// POST /api/auth/logout
router.post('/logout',
  authController.logout
);

// Ruta de demo para mostrar usuarios disponibles
router.get('/demo-users', (req, res) => {
  res.json({
    success: true,
    message: 'Usuarios de demostración disponibles',
    users: [
      { username: 'admin', password: 'admin123', role: 'admin' },
      { username: 'user', password: 'user123', role: 'user' },
      { username: 'security', password: 'security123', role: 'security' }
    ]
  });
});

console.log('✅ Auth routes (demo) initialized successfully');

module.exports = router;
