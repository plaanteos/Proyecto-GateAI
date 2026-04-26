const { body, param, query, validationResult } = require('express-validator');

// Validaciones para autenticación
const authValidation = {
  login: [
    body('username')
      .notEmpty()
      .withMessage('El nombre de usuario es requerido')
      .isLength({ min: 3 })
      .withMessage('El nombre de usuario debe tener al menos 3 caracteres'),
    
    body('password')
      .notEmpty()
      .withMessage('La contraseña es requerida')
      .isLength({ min: 6 })
      .withMessage('La contraseña debe tener al menos 6 caracteres')
  ],

  register: [
    body('username')
      .notEmpty()
      .withMessage('El nombre de usuario es requerido')
      .isLength({ min: 3, max: 50 })
      .withMessage('El nombre de usuario debe tener entre 3 y 50 caracteres')
      .matches(/^[a-zA-Z0-9._@-]+$/)
      .withMessage('El nombre de usuario contiene caracteres inválidos'),
    
    body('password')
      .isLength({ min: 8 })
      .withMessage('La contraseña debe tener al menos 8 caracteres')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número'),
    
    body('persona_id')
      .isInt({ min: 1 })
      .withMessage('ID de persona debe ser un número entero válido'),
    
    body('rol_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('ID de rol debe ser un número entero válido')
  ],

  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('La contraseña actual es requerida'),
    
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('La nueva contraseña debe tener al menos 8 caracteres')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('La nueva contraseña debe contener al menos una mayúscula, una minúscula y un número')
  ]
};

// Validaciones para personas
const personasValidation = {
  create: [
    body('documento_identidad')
      .notEmpty()
      .withMessage('El documento de identidad es requerido')
      .isLength({ min: 7, max: 20 })
      .withMessage('El documento debe tener entre 7 y 20 caracteres')
      .matches(/^[0-9A-Za-z-]+$/)
      .withMessage('El documento contiene caracteres inválidos'),
    
    body('nombre')
      .notEmpty()
      .withMessage('El nombre es requerido')
      .isLength({ min: 2, max: 100 })
      .withMessage('El nombre debe tener entre 2 y 100 caracteres')
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
      .withMessage('El nombre solo puede contener letras y espacios'),
    
    body('apellido')
      .notEmpty()
      .withMessage('El apellido es requerido')
      .isLength({ min: 2, max: 100 })
      .withMessage('El apellido debe tener entre 2 y 100 caracteres')
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
      .withMessage('El apellido solo puede contener letras y espacios'),
    
    body('fecha_nacimiento')
      .optional()
      .isISO8601()
      .withMessage('La fecha de nacimiento debe ser una fecha válida')
      .custom((value) => {
        const fechaNacimiento = new Date(value);
        const hoy = new Date();
        const edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
        if (edad < 0 || edad > 120) {
          throw new Error('La fecha de nacimiento no es válida');
        }
        return true;
      }),
    
    body('telefono')
      .optional()
      .matches(/^\+?[1-9]\d{1,14}$/)
      .withMessage('El teléfono debe ser un número válido (formato internacional)'),
    
    body('email')
      .optional()
      .isEmail()
      .withMessage('El email debe ser una dirección válida')
      .normalizeEmail()
  ],

  update: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID debe ser un número entero válido'),
    
    body('documento_identidad')
      .optional()
      .isLength({ min: 7, max: 20 })
      .withMessage('El documento debe tener entre 7 y 20 caracteres')
      .matches(/^[0-9A-Za-z-]+$/)
      .withMessage('El documento contiene caracteres inválidos'),
    
    body('nombre')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('El nombre debe tener entre 2 y 100 caracteres')
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
      .withMessage('El nombre solo puede contener letras y espacios'),
    
    body('apellido')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('El apellido debe tener entre 2 y 100 caracteres')
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
      .withMessage('El apellido solo puede contener letras y espacios'),
    
    body('fecha_nacimiento')
      .optional()
      .isISO8601()
      .withMessage('La fecha de nacimiento debe ser una fecha válida'),
    
    body('telefono')
      .optional()
      .matches(/^\+?[1-9]\d{1,14}$/)
      .withMessage('El teléfono debe ser un número válido'),
    
    body('email')
      .optional()
      .isEmail()
      .withMessage('El email debe ser una dirección válida')
      .normalizeEmail(),
    
    body('activo')
      .optional()
      .isBoolean()
      .withMessage('El campo activo debe ser verdadero o falso')
  ]
};

// Validaciones para accesos
const accesosValidation = {
  generateQR: [
    body('persona_id')
      .isInt({ min: 1 })
      .withMessage('ID de persona debe ser un número entero válido'),
    
    body('edificio_id')
      .isInt({ min: 1 })
      .withMessage('ID de edificio debe ser un número entero válido'),
    
    body('validez_minutos')
      .optional()
      .isInt({ min: 1, max: 1440 })
      .withMessage('La validez debe ser entre 1 y 1440 minutos (24 horas)')
  ],

  validateQR: [
    body('codigo')
      .notEmpty()
      .withMessage('El código QR es requerido')
      .isUUID()
      .withMessage('El código QR debe ser un UUID válido')
  ],

  registerManual: [
    body('persona_id')
      .isInt({ min: 1 })
      .withMessage('ID de persona debe ser un número entero válido'),
    
    body('edificio_id')
      .isInt({ min: 1 })
      .withMessage('ID de edificio debe ser un número entero válido'),
    
    body('observaciones')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Las observaciones no pueden exceder 500 caracteres')
  ],

  revokeAccess: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID debe ser un número entero válido'),
    
    body('motivo')
      .optional()
      .isLength({ max: 255 })
      .withMessage('El motivo no puede exceder 255 caracteres')
  ]
};

// Validaciones para consultas (query parameters)
const queryValidation = {
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('La página debe ser un número entero mayor a 0'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('El límite debe ser entre 1 y 100'),
    
    query('search')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('La búsqueda debe tener entre 2 y 100 caracteres')
      .escape()
  ],

  dateRange: [
    query('fecha_desde')
      .optional()
      .isISO8601()
      .withMessage('La fecha desde debe ser una fecha válida'),
    
    query('fecha_hasta')
      .optional()
      .isISO8601()
      .withMessage('La fecha hasta debe ser una fecha válida')
      .custom((value, { req }) => {
        if (req.query.fecha_desde && value < req.query.fecha_desde) {
          throw new Error('La fecha hasta debe ser posterior a la fecha desde');
        }
        return true;
      })
  ]
};

// Validaciones para edificios
const edificiosValidation = {
  create: [
    body('nombre')
      .notEmpty()
      .withMessage('El nombre del edificio es requerido')
      .isLength({ min: 2, max: 200 })
      .withMessage('El nombre debe tener entre 2 y 200 caracteres'),
    
    body('direccion')
      .notEmpty()
      .withMessage('La dirección es requerida')
      .isLength({ min: 5, max: 300 })
      .withMessage('La dirección debe tener entre 5 y 300 caracteres'),
    
    body('codigo_postal')
      .optional()
      .matches(/^[0-9]{4,10}$/)
      .withMessage('El código postal debe ser numérico y tener entre 4 y 10 dígitos'),
    
    body('telefono')
      .optional()
      .matches(/^\+?[1-9]\d{1,14}$/)
      .withMessage('El teléfono debe ser un número válido')
  ]
};

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
};

module.exports = {
  authValidation,
  personasValidation,
  accesosValidation,
  edificiosValidation,
  queryValidation,
  handleValidationErrors
};
