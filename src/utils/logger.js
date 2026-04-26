const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../../logs');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...meta,
      pid: process.pid,
      env: process.env.NODE_ENV || 'development'
    };
    return JSON.stringify(logEntry);
  }

  writeToFile(filename, content) {
    const filePath = path.join(this.logDir, filename);
    fs.appendFileSync(filePath, content + '\n');
  }

  info(message, meta = {}) {
    const logMessage = this.formatMessage('info', message, meta);
    console.log(`📝 INFO: ${message}`, meta);
    this.writeToFile('app-info.log', logMessage);
  }

  error(message, error = null, meta = {}) {
    const errorMeta = {
      ...meta,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : null
    };
    
    const logMessage = this.formatMessage('error', message, errorMeta);
    console.error(`❌ ERROR: ${message}`, errorMeta);
    this.writeToFile('app-error.log', logMessage);
  }

  warn(message, meta = {}) {
    const logMessage = this.formatMessage('warn', message, meta);
    console.warn(`⚠️ WARN: ${message}`, meta);
    this.writeToFile('app-warn.log', logMessage);
  }

  debug(message, meta = {}) {
    if (process.env.NODE_ENV === 'development') {
      const logMessage = this.formatMessage('debug', message, meta);
      console.debug(`🐛 DEBUG: ${message}`, meta);
      this.writeToFile('app-debug.log', logMessage);
    }
  }

  audit(action, userId, resource, details = {}) {
    const auditData = {
      action,
      userId,
      resource,
      details,
      ip: details.ip || 'unknown',
      userAgent: details.userAgent || 'unknown'
    };
    
    const logMessage = this.formatMessage('audit', `${action} on ${resource}`, auditData);
    console.log(`🔍 AUDIT: ${action} on ${resource} by user ${userId}`);
    this.writeToFile('audit.log', logMessage);
  }

  security(event, details = {}) {
    const securityData = {
      event,
      details,
      severity: details.severity || 'medium'
    };
    
    const logMessage = this.formatMessage('security', event, securityData);
    console.warn(`🔒 SECURITY: ${event}`, securityData);
    this.writeToFile('security.log', logMessage);
  }

  access(method, url, statusCode, responseTime, userId = null, ip = 'unknown') {
    const accessData = {
      method,
      url,
      statusCode,
      responseTime,
      userId,
      ip
    };
    
    const logMessage = this.formatMessage('access', `${method} ${url} ${statusCode}`, accessData);
    this.writeToFile('access.log', logMessage);
  }

  // Cleanup old logs (keep last 30 days)
  cleanupOldLogs() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const logFiles = fs.readdirSync(this.logDir);
    
    logFiles.forEach(file => {
      const filePath = path.join(this.logDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtime < thirtyDaysAgo) {
        fs.unlinkSync(filePath);
        this.info(`Deleted old log file: ${file}`);
      }
    });
  }
}

module.exports = new Logger();
