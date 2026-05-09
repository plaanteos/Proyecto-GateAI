const fs = require('fs').promises;
const path = require('path');
const CriticalActivityLogger = require('../services/criticalActivityLogger');

class AuditLogger {
  constructor() {
    this.logDir = path.join(__dirname, '../../logs');
    this.criticalLogger = new CriticalActivityLogger();
    this.ensureLogDirectory();
  }

  async ensureLogDirectory() {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
    } catch (error) {
      console.error('Error creando directorio de logs:', error);
    }
  }

  // Middleware para logging de auditoría
  auditMiddleware() {
    return async (req, res, next) => {
      const startTime = Date.now();
      const timestamp = new Date().toISOString();
      
      // Capturar información de la request
      const auditData = {
        timestamp,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id || null,
        userEmail: req.user?.email || null,
        body: this.sanitizeBody(req.body),
        params: req.params,
        query: req.query
      };

      // Interceptar la respuesta
      const self = this;
      const originalSend = res.send.bind(res);
      res.send = function(body) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        auditData.statusCode = res.statusCode;
        auditData.duration = duration;
        auditData.responseSize = body ? Buffer.byteLength(String(body)) : 0;
        
        // Solo loggear el cuerpo de respuesta si es un error o acción crítica
        if (res.statusCode >= 400 || auditData.url.includes('/access/') || auditData.url.includes('/auth/')) {
          try {
            const responseBody = typeof body === 'string' ? JSON.parse(body) : body;
            auditData.responseBody = responseBody;
          } catch (e) {
            auditData.responseBody = { error: 'No se pudo parsear la respuesta' };
          }
        }

        // Escribir log de auditoría
        self.writeAuditLog(auditData);
        
        return originalSend(body);
      };

      next();
    };
  }

  // Sanitizar datos sensibles del body
  sanitizeBody(body) {
    if (!body || typeof body !== 'object') return body;
    
    const sensitiveFields = ['password', 'token', 'auth', 'secret', 'key'];
    const sanitized = { ...body };
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }

  // Escribir log de auditoría a archivo
  async writeAuditLog(auditData) {
    try {
      const date = new Date().toISOString().split('T')[0];
      const logFile = path.join(this.logDir, `audit-${date}.log`);
      
      const logEntry = {
        ...auditData,
        level: this.getLogLevel(auditData),
        category: this.getLogCategory(auditData.url)
      };
      
      const logLine = JSON.stringify(logEntry) + '\n';
      await fs.appendFile(logFile, logLine);

      // HU10: Integrar con sistema de logs críticos
      await this.processCriticalEvents(auditData);
      
      // Detectar intentos sospechosos
      if (this.isSuspiciousActivity(auditData)) {
        await this.logSuspiciousActivity(auditData);
      }
      
      // También loggear eventos críticos en consola
      if (logEntry.level === 'CRITICAL' || auditData.statusCode >= 500) {
        console.error('🚨 EVENTO CRÍTICO:', logEntry);
      }
      
    } catch (error) {
      console.error('Error escribiendo log de auditoría:', error);
    }
  }

  // Determinar nivel del log
  getLogLevel(auditData) {
    if (auditData.statusCode >= 500) return 'CRITICAL';
    if (auditData.statusCode >= 400) return 'ERROR';
    if (auditData.url.includes('/access/') || auditData.url.includes('/auth/')) return 'SECURITY';
    if (auditData.url.includes('/notifications/')) return 'NOTIFICATION';
    return 'INFO';
  }

  // Categorizar por URL
  getLogCategory(url) {
    if (url.includes('/auth/')) return 'AUTHENTICATION';
    if (url.includes('/access/')) return 'ACCESS_CONTROL';
    if (url.includes('/notifications/')) return 'NOTIFICATIONS';
    if (url.includes('/visitantes/')) return 'VISITORS';
    if (url.includes('/personas/')) return 'PERSONNEL';
    if (url.includes('/edificios/')) return 'BUILDINGS';
    if (url.includes('/reportes/')) return 'REPORTS';
    return 'GENERAL';
  }

  // Log manual para eventos específicos
  async logEvent(category, level, message, data = {}) {
    const auditData = {
      timestamp: new Date().toISOString(),
      category: category.toUpperCase(),
      level: level.toUpperCase(),
      message,
      data,
      source: 'MANUAL_LOG'
    };
    
    await this.writeAuditLog(auditData);
  }

  // Log para accesos exitosos
  async logAccessGranted(visitante, ubicacion, metodo = 'QR') {
    await this.logEvent('ACCESS_CONTROL', 'SECURITY', 'Acceso autorizado', {
      visitante: visitante.nombre,
      dni: visitante.dni,
      ubicacion,
      metodo,
      timestamp: new Date().toISOString()
    });
  }

  // Log para accesos denegados
  async logAccessDenied(visitante, ubicacion, motivo, metodo = 'QR') {
    await this.logEvent('ACCESS_CONTROL', 'SECURITY', 'Acceso denegado', {
      visitante: visitante?.nombre || 'Desconocido',
      dni: visitante?.dni || 'N/A',
      ubicacion,
      motivo,
      metodo,
      timestamp: new Date().toISOString()
    });
  }

  // Log para alertas de seguridad
  async logSecurityAlert(tipo, descripcion, ubicacion, personalNotificado) {
    await this.logEvent('SECURITY', 'CRITICAL', 'Alerta de seguridad generada', {
      tipo,
      descripcion,
      ubicacion,
      personalNotificado,
      timestamp: new Date().toISOString()
    });
  }

  // Log para generación de QR
  async logQRGenerated(visitante, validoHasta, generadoPor) {
    await this.logEvent('ACCESS_CONTROL', 'INFO', 'Código QR generado', {
      visitante: visitante.nombre,
      dni: visitante.dni,
      validoHasta: validoHasta.toISOString(),
      generadoPor,
      timestamp: new Date().toISOString()
    });
  }

  // Log para notificaciones enviadas
  async logNotificationSent(tipo, destinatario, canal, exito) {
    await this.logEvent('NOTIFICATIONS', exito ? 'INFO' : 'ERROR', 
      `Notificación ${exito ? 'enviada' : 'fallida'}`, {
        tipo,
        destinatario,
        canal,
        exito,
        timestamp: new Date().toISOString()
      });
  }

  // Obtener logs de auditoría por fecha
  async getAuditLogs(fecha = null) {
    try {
      const targetDate = fecha || new Date().toISOString().split('T')[0];
      const logFile = path.join(this.logDir, `audit-${targetDate}.log`);
      
      const content = await fs.readFile(logFile, 'utf8');
      const logs = content.trim().split('\n')
        .filter(line => line.length > 0)
        .map(line => JSON.parse(line));
      
      return {
        fecha: targetDate,
        total: logs.length,
        logs: logs
      };
      
    } catch (error) {
      return {
        fecha: fecha || new Date().toISOString().split('T')[0],
        total: 0,
        logs: [],
        error: 'Archivo de log no encontrado o vacío'
      };
    }
  }

  // Obtener estadísticas de auditoría
  async getAuditStats(fecha = null) {
    try {
      const auditData = await this.getAuditLogs(fecha);
      const logs = auditData.logs;
      
      const stats = {
        fecha: auditData.fecha,
        total: logs.length,
        porCategoria: {},
        porNivel: {},
        errores: logs.filter(log => log.statusCode >= 400).length,
        accesosExitosos: logs.filter(log => 
          log.category === 'ACCESS_CONTROL' && 
          log.level === 'SECURITY' && 
          log.message.includes('autorizado')
        ).length,
        accesosDenegados: logs.filter(log => 
          log.category === 'ACCESS_CONTROL' && 
          log.level === 'SECURITY' && 
          log.message.includes('denegado')
        ).length,
        alertasSeguridad: logs.filter(log => log.level === 'CRITICAL').length
      };
      
      // Contar por categoría
      logs.forEach(log => {
        const categoria = log.category || 'UNKNOWN';
        stats.porCategoria[categoria] = (stats.porCategoria[categoria] || 0) + 1;
      });
      
      // Contar por nivel
      logs.forEach(log => {
        const nivel = log.level || 'UNKNOWN';
        stats.porNivel[nivel] = (stats.porNivel[nivel] || 0) + 1;
      });
      
      return stats;
      
    } catch (error) {
      return {
        fecha: fecha || new Date().toISOString().split('T')[0],
        error: 'Error obteniendo estadísticas'
      };
    }
  }

  // HU10: Procesar eventos críticos
  async processCriticalEvents(auditData) {
    try {
      // Fallos de autenticación
      if (auditData.url && auditData.url.includes('/auth/login') && auditData.statusCode === 401) {
        await this.criticalLogger.logFailedLogin(
          auditData.body?.username || 'unknown',
          auditData.ip,
          auditData.userAgent,
          'Invalid credentials'
        );
      }

      // Accesos no autorizados
      if (auditData.statusCode === 403) {
        await this.criticalLogger.logUnauthorizedAccess(
          auditData.userId || 'anonymous',
          auditData.url,
          auditData.ip,
          auditData.method
        );
      }

      // Errores del sistema
      if (auditData.statusCode >= 500) {
        await this.criticalLogger.logSystemError(
          'HTTP_ERROR',
          `${auditData.statusCode} error on ${auditData.url}`,
          auditData.responseBody?.stack || '',
          auditData.userId,
          {
            url: auditData.url,
            method: auditData.method,
            duration: auditData.duration
          }
        );
      }

      // Acceso a datos sensibles (solo si fue exitoso y con usuario autenticado)
      if (
        auditData.userId && auditData.userId !== 'anonymous' &&
        auditData.statusCode >= 200 && auditData.statusCode < 300 &&
        auditData.url && (auditData.url.includes('/reports/') || auditData.url.includes('/security/'))
      ) {
        await this.criticalLogger.logDataAccess(
          auditData.userId,
          'SECURITY_LOGS',
          auditData.method,
          1,
          auditData.ip
        );
      }

    } catch (error) {
      console.error('Error procesando eventos críticos:', error);
    }
  }

  // Detectar actividad sospechosa
  isSuspiciousActivity(auditData) {
    const suspiciousPatterns = [
      // Múltiples requests rápidos
      auditData.duration < 50 && auditData.method === 'POST',
      
      // Intentos de acceso a rutas administrativas sin autenticación
      auditData.url && auditData.url.includes('/admin') && !auditData.userId,
      
      // Requests con User-Agent sospechoso
      !auditData.userAgent || auditData.userAgent.includes('bot') || auditData.userAgent.includes('script'),
      
      // Intentos de inyección SQL básicos
      JSON.stringify(auditData.query || {}).includes("'") || JSON.stringify(auditData.body || {}).includes("'"),
      
      // Requests desde IPs problemáticas
      auditData.ip && (auditData.ip.startsWith('127.0.0') === false && auditData.ip.includes('::1') === false && auditData.statusCode >= 400)
    ];

    return suspiciousPatterns.some(pattern => pattern);
  }

  async logSuspiciousActivity(auditData) {
    try {
      await this.criticalLogger.logSecurityViolation(
        'SUSPICIOUS_REQUEST_PATTERN',
        `Actividad sospechosa detectada en ${auditData.url}`,
        auditData.userId || 'anonymous',
        auditData.ip,
        {
          method: auditData.method,
          url: auditData.url,
          statusCode: auditData.statusCode,
          userAgent: auditData.userAgent,
          duration: auditData.duration,
          body: auditData.body,
          query: auditData.query
        }
      );
    } catch (error) {
      console.error('Error registrando actividad sospechosa:', error);
    }
  }
}

const auditLogger = new AuditLogger();

module.exports = {
  auditMiddleware: auditLogger.auditMiddleware.bind(auditLogger),
  logEvent: auditLogger.logEvent.bind(auditLogger),
  logAccessGranted: auditLogger.logAccessGranted.bind(auditLogger),
  logAccessDenied: auditLogger.logAccessDenied.bind(auditLogger),
  logSecurityAlert: auditLogger.logSecurityAlert.bind(auditLogger),
  logQRGenerated: auditLogger.logQRGenerated.bind(auditLogger),
  logNotificationSent: auditLogger.logNotificationSent.bind(auditLogger),
  getAuditLogs: auditLogger.getAuditLogs.bind(auditLogger),
  getAuditStats: auditLogger.getAuditStats.bind(auditLogger)
};
