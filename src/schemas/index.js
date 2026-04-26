/**
 * Schemas de validación con Joi
 * Validación centralizada para todas las entidades del sistema
 */

const Joi = require('joi');

// ─── Schemas de Autenticación ──────────────────────────────────────────────

const authSchemas = {
  login: Joi.object({
    username: Joi.string().min(3).max(100).required().messages({
      'string.min': 'El usuario debe tener al menos 3 caracteres',
      'string.max': 'El usuario no puede superar 100 caracteres',
      'any.required': 'El nombre de usuario es requerido'
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'La contraseña debe tener al menos 6 caracteres',
      'any.required': 'La contraseña es requerida'
    })
  }),

  register: Joi.object({
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(50)
      .required()
      .messages({
        'string.alphanum': 'El usuario solo puede contener letras y números',
        'any.required': 'El nombre de usuario es requerido'
      }),
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required()
      .messages({
        'string.min': 'La contraseña debe tener al menos 8 caracteres',
        'string.pattern.base': 'La contraseña debe contener mayúscula, minúscula y número',
        'any.required': 'La contraseña es requerida'
      }),
    persona_id: Joi.number().integer().min(1).required().messages({
      'any.required': 'El ID de persona es requerido'
    }),
    rol_id: Joi.number().integer().min(1).optional()
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required().messages({
      'any.required': 'La contraseña actual es requerida'
    }),
    newPassword: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required()
      .messages({
        'string.min': 'La nueva contraseña debe tener al menos 8 caracteres',
        'string.pattern.base': 'La nueva contraseña debe tener mayúscula, minúscula y número',
        'any.required': 'La nueva contraseña es requerida'
      })
  })
};

// ─── Schemas de Personas ───────────────────────────────────────────────────

const personasSchemas = {
  create: Joi.object({
    documento_identidad: Joi.string()
      .min(7)
      .max(20)
      .pattern(/^[0-9A-Za-z-]+$/)
      .required()
      .messages({
        'string.pattern.base': 'El documento contiene caracteres inválidos',
        'any.required': 'El documento de identidad es requerido'
      }),
    nombre: Joi.string()
      .min(2)
      .max(100)
      .pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
      .required()
      .messages({
        'string.pattern.base': 'El nombre solo puede contener letras y espacios',
        'any.required': 'El nombre es requerido'
      }),
    apellido: Joi.string()
      .min(2)
      .max(100)
      .pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
      .required()
      .messages({
        'string.pattern.base': 'El apellido solo puede contener letras y espacios',
        'any.required': 'El apellido es requerido'
      }),
    email: Joi.string().email().max(100).optional().messages({
      'string.email': 'El email no tiene un formato válido'
    }),
    telefono: Joi.string()
      .pattern(/^[\d\s\+\-\(\)]+$/)
      .min(7)
      .max(20)
      .optional()
      .messages({
        'string.pattern.base': 'El teléfono contiene caracteres inválidos'
      }),
    fecha_nacimiento: Joi.date().max('now').optional().messages({
      'date.max': 'La fecha de nacimiento no puede ser en el futuro'
    }),
    tipo_persona: Joi.string()
      .valid('empleado', 'visitante', 'residente', 'contratista', 'mantenimiento')
      .optional()
  }),

  update: Joi.object({
    nombre: Joi.string().min(2).max(100).optional(),
    apellido: Joi.string().min(2).max(100).optional(),
    email: Joi.string().email().max(100).optional(),
    telefono: Joi.string().pattern(/^[\d\s\+\-\(\)]+$/).optional(),
    tipo_persona: Joi.string()
      .valid('empleado', 'visitante', 'residente', 'contratista', 'mantenimiento')
      .optional()
  }).min(1).messages({
    'object.min': 'Debe proporcionar al menos un campo para actualizar'
  })
};

// ─── Schemas de Visitantes / Invitaciones ─────────────────────────────────

const visitantesSchemas = {
  create: Joi.object({
    nombre: Joi.string().min(2).max(100).required().messages({
      'any.required': 'El nombre del visitante es requerido'
    }),
    documento_identidad: Joi.string().min(7).max(20).required().messages({
      'any.required': 'El documento de identidad es requerido'
    }),
    telefono: Joi.string().pattern(/^[\d\s\+\-\(\)]+$/).optional(),
    email: Joi.string().email().optional(),
    empresa: Joi.string().max(100).optional(),
    motivo_visita: Joi.string().min(5).max(500).required().messages({
      'string.min': 'El motivo debe tener al menos 5 caracteres',
      'any.required': 'El motivo de visita es requerido'
    }),
    anfitrion_id: Joi.number().integer().min(1).required().messages({
      'any.required': 'El ID del anfitrión es requerido'
    }),
    edificio_id: Joi.number().integer().min(1).optional(),
    fecha_visita: Joi.date().min('now').required().messages({
      'date.min': 'La fecha de visita no puede ser en el pasado',
      'any.required': 'La fecha de visita es requerida'
    }),
    duracion_horas: Joi.number().min(0.5).max(24).default(2).messages({
      'number.min': 'La duración mínima es 30 minutos',
      'number.max': 'La duración máxima es 24 horas'
    })
  }),

  bulk: Joi.object({
    visitantes: Joi.array()
      .items(Joi.object({
        nombre: Joi.string().min(2).max(100).required(),
        documento_identidad: Joi.string().min(7).max(20).required(),
        telefono: Joi.string().optional(),
        email: Joi.string().email().optional(),
        empresa: Joi.string().max(100).optional()
      }))
      .min(1)
      .max(50)
      .required()
      .messages({
        'array.min': 'Debe proporcionar al menos un visitante',
        'array.max': 'No se pueden registrar más de 50 visitantes a la vez'
      }),
    anfitrion_id: Joi.number().integer().min(1).required(),
    fecha_visita: Joi.date().min('now').required(),
    motivo_visita: Joi.string().min(5).max(500).required()
  })
};

// ─── Schemas de Edificios ─────────────────────────────────────────────────

const edificiosSchemas = {
  create: Joi.object({
    nombre: Joi.string().min(2).max(100).required().messages({
      'any.required': 'El nombre del edificio es requerido'
    }),
    direccion: Joi.string().min(5).max(255).required().messages({
      'any.required': 'La dirección es requerida'
    }),
    ciudad: Joi.string().max(100).optional(),
    pais: Joi.string().max(100).optional(),
    descripcion: Joi.string().max(500).optional(),
    activo: Joi.boolean().default(true)
  }),

  update: Joi.object({
    nombre: Joi.string().min(2).max(100).optional(),
    direccion: Joi.string().min(5).max(255).optional(),
    ciudad: Joi.string().max(100).optional(),
    descripcion: Joi.string().max(500).optional(),
    activo: Joi.boolean().optional()
  }).min(1)
};

// ─── Schemas de Accesos ───────────────────────────────────────────────────

const accesosSchemas = {
  registrar: Joi.object({
    persona_id: Joi.number().integer().min(1).optional(),
    credencial_id: Joi.number().integer().min(1).optional(),
    puerta_id: Joi.number().integer().min(1).required().messages({
      'any.required': 'El ID de la puerta es requerido'
    }),
    tipo_acceso: Joi.string().valid('entrada', 'salida').required().messages({
      'any.required': 'El tipo de acceso (entrada/salida) es requerido',
      'any.only': 'El tipo debe ser "entrada" o "salida"'
    }),
    metodo: Joi.string()
      .valid('qr', 'tarjeta', 'biometrico', 'manual', 'pin')
      .required()
      .messages({
        'any.required': 'El método de acceso es requerido'
      }),
    notas: Joi.string().max(500).optional()
  }),

  validarQR: Joi.object({
    codigo_qr: Joi.string().min(10).required().messages({
      'any.required': 'El código QR es requerido',
      'string.min': 'El código QR no es válido'
    }),
    puerta_id: Joi.number().integer().min(1).required().messages({
      'any.required': 'El ID de la puerta es requerido'
    })
  })
};

// ─── Schemas de Códigos QR ────────────────────────────────────────────────

const qrSchemas = {
  generar: Joi.object({
    visitante_data: Joi.object({
      nombre: Joi.string().required(),
      dni: Joi.string().required(),
      telefono: Joi.string().optional()
    }).required(),
    valido_hasta: Joi.date().min('now').required().messages({
      'date.min': 'La fecha de vencimiento debe ser en el futuro',
      'any.required': 'La fecha de vencimiento es requerida'
    }),
    ubicacion: Joi.string().max(100).optional(),
    uso_unico: Joi.boolean().default(true)
  })
};

// ─── Schemas de Roles y Permisos ─────────────────────────────────────────

const rbacSchemas = {
  asignarRol: Joi.object({
    usuario_id: Joi.number().integer().min(1).required().messages({
      'any.required': 'El ID de usuario es requerido'
    }),
    rol_id: Joi.number().integer().min(1).required().messages({
      'any.required': 'El ID de rol es requerido'
    })
  }),

  crearRol: Joi.object({
    nombre: Joi.string()
      .min(3)
      .max(50)
      .pattern(/^[a-z_]+$/)
      .required()
      .messages({
        'string.pattern.base': 'El nombre del rol solo puede tener letras minúsculas y guiones bajos',
        'any.required': 'El nombre del rol es requerido'
      }),
    descripcion: Joi.string().max(255).required(),
    permisos: Joi.array().items(Joi.string()).min(1).required()
  }),

  verificarPermiso: Joi.object({
    permission: Joi.string().required().messages({
      'any.required': 'El permiso a verificar es requerido'
    })
  })
};

// ─── Schemas de Mantenimiento ─────────────────────────────────────────────

const mantenimientoSchemas = {
  crearEmpleado: Joi.object({
    nombre: Joi.string().min(2).max(100).required(),
    apellido: Joi.string().min(2).max(100).required(),
    documento: Joi.string().min(7).max(20).required(),
    empresa_contratista: Joi.string().max(100).required().messages({
      'any.required': 'La empresa contratista es requerida'
    }),
    telefono: Joi.string().pattern(/^[\d\s\+\-\(\)]+$/).optional(),
    email: Joi.string().email().optional(),
    areas_acceso: Joi.array().items(Joi.string()).min(1).required().messages({
      'any.required': 'Debe especificar al menos un área de acceso'
    }),
    fecha_inicio: Joi.date().required(),
    fecha_fin: Joi.date().greater(Joi.ref('fecha_inicio')).required().messages({
      'date.greater': 'La fecha de fin debe ser posterior a la fecha de inicio'
    })
  })
};

// ─── Schemas de Paginación (Reutilizables) ────────────────────────────────

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().max(100).optional(),
  sortBy: Joi.string().max(50).optional(),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

module.exports = {
  authSchemas,
  personasSchemas,
  visitantesSchemas,
  edificiosSchemas,
  accesosSchemas,
  qrSchemas,
  rbacSchemas,
  mantenimientoSchemas,
  paginationSchema
};
