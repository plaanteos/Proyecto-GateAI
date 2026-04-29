/**
 * Logger unificado - re-exporta el logger Winston de config/logger.js
 * para mantener compatibilidad con todos los módulos que importan desde utils/logger.js
 */

// Intentar usar el logger Winston principal
let logger;
try {
  logger = require('../config/logger');
} catch (_) {
  // Fallback mínimo si Winston no está disponible
  logger = {
    info: (msg, meta) => console.log('[INFO]', msg, meta || ''),
    warn: (msg, meta) => console.warn('[WARN]', msg, meta || ''),
    error: (msg, meta) => console.error('[ERROR]', msg, meta || ''),
    debug: (msg, meta) => process.env.NODE_ENV !== 'production' && console.debug('[DEBUG]', msg, meta || ''),
    audit: (action, userId, resource) => console.log('[AUDIT]', action, 'user:', userId, 'resource:', resource),
    access: (method, url, status, time, userId, ip) => console.log('[ACCESS]', method, url, status, time + 'ms'),
    security: (msg, meta) => console.warn('[SECURITY]', msg, meta || '')
  };
}

module.exports = logger;

