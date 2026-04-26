/**
 * Middleware de validación con Joi
 * Valida body, params y query usando schemas centralizados
 */

const logger = require('../utils/logger');

/**
 * Genera un middleware que valida `req.body` con el schema Joi dado.
 * @param {import('joi').Schema} schema
 * @returns {import('express').RequestHandler}
 */
function validateBody(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errors = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message.replace(/['"]/g, '')
      }));

      logger.warn('Validación Joi fallida (body)', { path: req.path, errors });

      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors
      });
    }

    // Reemplazar body con el valor limpio y convertido
    req.body = value;
    next();
  };
}

/**
 * Genera un middleware que valida `req.params` con el schema Joi dado.
 * @param {import('joi').Schema} schema
 * @returns {import('express').RequestHandler}
 */
function validateParams(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      convert: true
    });

    if (error) {
      const errors = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message.replace(/['"]/g, '')
      }));

      logger.warn('Validación Joi fallida (params)', { path: req.path, errors });

      return res.status(400).json({
        success: false,
        message: 'Parámetros de ruta inválidos',
        errors
      });
    }

    req.params = value;
    next();
  };
}

/**
 * Genera un middleware que valida `req.query` con el schema Joi dado.
 * @param {import('joi').Schema} schema
 * @returns {import('express').RequestHandler}
 */
function validateQuery(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errors = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message.replace(/['"]/g, '')
      }));

      logger.warn('Validación Joi fallida (query)', { path: req.path, errors });

      return res.status(400).json({
        success: false,
        message: 'Parámetros de consulta inválidos',
        errors
      });
    }

    req.query = value;
    next();
  };
}

/**
 * Schema Joi para IDs numéricos en params (reutilizable)
 */
const Joi = require('joi');
const idParamSchema = Joi.object({
  id: Joi.number().integer().min(1).required().messages({
    'number.base': 'El ID debe ser un número',
    'number.integer': 'El ID debe ser un número entero',
    'number.min': 'El ID debe ser mayor que 0',
    'any.required': 'El ID es requerido'
  })
});

const validateIdParam = validateParams(idParamSchema);

module.exports = {
  validateBody,
  validateParams,
  validateQuery,
  validateIdParam
};
