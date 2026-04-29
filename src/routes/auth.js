const express = require('express');
const authController = require('../controllers/authController');
const { authValidation, handleValidationErrors } = require('../middleware/validation');
const { auth } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', 
  authValidation.login,
  handleValidationErrors,
  (req, res) => authController.login(req, res)
);

// POST /api/auth/register
router.post('/register',
  authValidation.register,
  handleValidationErrors,
  (req, res) => authController.register(req, res)
);

// GET /api/auth/verify - Verificar token válido
router.get('/verify',
  auth,
  (req, res) => authController.verifyToken(req, res)
);

// PUT /api/auth/change-password
router.put('/change-password',
  auth,
  authValidation.changePassword,
  handleValidationErrors,
  (req, res) => authController.changePassword(req, res)
);

// POST /api/auth/request-reset - Solicitar reset de contraseña
router.post('/request-reset',
  (req, res) => authController.requestPasswordReset(req, res)
);

// GET /api/auth/verify-reset/:token - Verificar token de reset
router.get('/verify-reset/:token',
  (req, res) => authController.verifyResetToken(req, res)
);

// POST /api/auth/reset-password - Restablecer contraseña
router.post('/reset-password',
  (req, res) => authController.resetPassword(req, res)
);

// POST /api/auth/logout
router.post('/logout',
  auth,
  (req, res) => authController.logout(req, res)
);

module.exports = router;
