const express = require('express');
const authController = require('../controllers/authController-demo');
const { authValidation, handleValidationErrors } = require('../middleware/validation');
const { auth } = require('../middleware/auth-demo');
const { ErrorHandler } = require('../middleware/errorHandler');

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

// POST /api/auth/logout
router.post('/logout',
  auth,
  ErrorHandler.asyncHandler(authController.logout)
);

module.exports = router;
