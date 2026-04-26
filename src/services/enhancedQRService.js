const QRCode = require('qrcode');
const crypto = require('crypto');
const logger = require('../utils/logger');

class EnhancedQRService {
  constructor() {
    this.encryptionKey = process.env.QR_ENCRYPTION_KEY || 'uniontech-default-key-2025';
    this.algorithm = 'aes-256-gcm';
    this.qrDefaultOptions = {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    };
  }

  // Generar código QR para acceso con diferentes tipos
  async generateAccessQR(data, qrType = 'access', options = {}) {
    try {
      const qrData = await this.prepareQRData(data, qrType);
      const qrOptions = { ...this.qrDefaultOptions, ...options };

      // Generar el QR code
      const qrString = await QRCode.toDataURL(JSON.stringify(qrData), qrOptions);

      const result = {
        success: true,
        qrCode: qrString,
        qrData: qrData,
        qrType,
        metadata: {
          generatedAt: new Date().toISOString(),
          expiresAt: qrData.expiresAt,
          size: qrString.length,
          options: qrOptions
        }
      };

      // Log de auditoría
      logger.audit('QR_GENERATED', data.userId || null, 'qr_service', {
        qrType,
        qrId: qrData.qrId,
        personaId: data.personaId,
        edificioId: data.edificioId,
        expiresAt: qrData.expiresAt
      });

      return result;

    } catch (error) {
      logger.error('Error generando código QR', error, { qrType, data });
      throw error;
    }
  }

  // Preparar datos para el QR según el tipo
  async prepareQRData(data, qrType) {
    const baseData = {
      qrId: crypto.randomUUID(),
      type: qrType,
      version: '2.0',
      generatedAt: new Date().toISOString(),
      issuer: 'UnionTech'
    };

    switch (qrType) {
      case 'access':
        return {
          ...baseData,
          personaId: data.personaId,
          edificioId: data.edificioId,
          validFrom: data.validFrom || new Date().toISOString(),
          expiresAt: data.expiresAt || new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hora por defecto
          accessLevel: data.accessLevel || 'basic',
          zones: data.zones || ['entrance'],
          encrypted: await this.encryptData({
            pid: data.personaId,
            eid: data.edificioId,
            exp: data.expiresAt
          })
        };

      case 'visitor':
        return {
          ...baseData,
          visitorName: data.visitorName,
          hostPersonaId: data.hostPersonaId,
          edificioId: data.edificioId,
          visitPurpose: data.visitPurpose || 'visit',
          validFrom: data.validFrom || new Date().toISOString(),
          expiresAt: data.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
          visitorPhone: data.visitorPhone,
          accessLevel: 'visitor',
          zones: data.zones || ['entrance', 'lobby'],
          encrypted: await this.encryptData({
            vn: data.visitorName,
            hp: data.hostPersonaId,
            eid: data.edificioId,
            exp: data.expiresAt
          })
        };

      case 'temporary':
        return {
          ...baseData,
          tempId: crypto.randomBytes(16).toString('hex'),
          edificioId: data.edificioId,
          purpose: data.purpose || 'temporary_access',
          validFrom: data.validFrom || new Date().toISOString(),
          expiresAt: data.expiresAt || new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 horas
          accessLevel: 'temporary',
          zones: data.zones || ['entrance'],
          createdBy: data.createdBy,
          encrypted: await this.encryptData({
            tid: baseData.tempId,
            eid: data.edificioId,
            exp: data.expiresAt
          })
        };

      case 'group':
        return {
          ...baseData,
          groupId: data.groupId || crypto.randomUUID(),
          groupName: data.groupName,
          edificioId: data.edificioId,
          maxUses: data.maxUses || 10,
          currentUses: 0,
          validFrom: data.validFrom || new Date().toISOString(),
          expiresAt: data.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 días
          accessLevel: 'group',
          zones: data.zones || ['entrance'],
          createdBy: data.createdBy,
          encrypted: await this.encryptData({
            gid: data.groupId,
            eid: data.edificioId,
            mu: data.maxUses,
            exp: data.expiresAt
          })
        };

      case 'maintenance':
        return {
          ...baseData,
          maintenanceId: data.maintenanceId || crypto.randomUUID(),
          technicianName: data.technicianName,
          company: data.company,
          edificioId: data.edificioId,
          workOrder: data.workOrder,
          validFrom: data.validFrom || new Date().toISOString(),
          expiresAt: data.expiresAt || new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 horas
          accessLevel: 'maintenance',
          zones: data.zones || ['entrance', 'service_areas'],
          emergencyAccess: data.emergencyAccess || false,
          encrypted: await this.encryptData({
            mid: data.maintenanceId,
            tn: data.technicianName,
            eid: data.edificioId,
            exp: data.expiresAt
          })
        };

      default:
        throw new Error(`Tipo de QR no soportado: ${qrType}`);
    }
  }

  // Validar código QR escaneado
  async validateQR(qrData, validationContext = {}) {
    try {
      if (typeof qrData === 'string') {
        qrData = JSON.parse(qrData);
      }

      const validation = {
        isValid: false,
        qrType: qrData.type,
        qrId: qrData.qrId,
        errors: [],
        warnings: [],
        validatedAt: new Date().toISOString(),
        context: validationContext
      };

      // Validaciones básicas
      if (!qrData.qrId || !qrData.type) {
        validation.errors.push('Código QR inválido o corrupto');
        return validation;
      }

      // Verificar expiración
      if (qrData.expiresAt && new Date() > new Date(qrData.expiresAt)) {
        validation.errors.push('Código QR expirado');
        return validation;
      }

      // Verificar periodo de validez
      if (qrData.validFrom && new Date() < new Date(qrData.validFrom)) {
        validation.errors.push('Código QR aún no válido');
        return validation;
      }

      // Verificar encriptación
      try {
        const decryptedData = await this.decryptData(qrData.encrypted);
        qrData.decryptedData = decryptedData;
      } catch (error) {
        validation.errors.push('Error de verificación de seguridad');
        return validation;
      }

      // Validaciones específicas por tipo
      const typeValidation = await this.validateByType(qrData, validationContext);
      validation.errors.push(...typeValidation.errors);
      validation.warnings.push(...typeValidation.warnings);

      // Determinar validez final
      validation.isValid = validation.errors.length === 0;

      if (validation.isValid) {
        validation.accessGranted = true;
        validation.personaId = this.extractPersonaId(qrData);
        validation.edificioId = qrData.edificioId;
        validation.accessLevel = qrData.accessLevel;
        validation.allowedZones = qrData.zones || [];
      }

      // Log de auditoría
      logger.audit('QR_VALIDATED', validation.personaId, 'qr_service', {
        qrType: qrData.type,
        qrId: qrData.qrId,
        isValid: validation.isValid,
        errors: validation.errors,
        context: validationContext
      });

      return validation;

    } catch (error) {
      logger.error('Error validando código QR', error, { qrData, validationContext });
      return {
        isValid: false,
        error: error.message,
        validatedAt: new Date().toISOString()
      };
    }
  }

  // Validaciones específicas por tipo de QR
  async validateByType(qrData, context) {
    const validation = { errors: [], warnings: [] };

    switch (qrData.type) {
      case 'access':
        if (!qrData.personaId || !qrData.edificioId) {
          validation.errors.push('Datos de acceso incompletos');
        }
        break;

      case 'visitor':
        if (!qrData.visitorName || !qrData.hostPersonaId) {
          validation.errors.push('Datos de visitante incompletos');
        }
        if (context.edificioId && qrData.edificioId !== context.edificioId) {
          validation.errors.push('Código QR no válido para este edificio');
        }
        break;

      case 'group':
        if (qrData.currentUses >= qrData.maxUses) {
          validation.errors.push('Código QR grupal ha alcanzado el límite de usos');
        }
        break;

      case 'maintenance':
        if (!qrData.technicianName || !qrData.workOrder) {
          validation.errors.push('Datos de mantenimiento incompletos');
        }
        if (!qrData.emergencyAccess && context.afterHours) {
          validation.warnings.push('Acceso fuera del horario laboral');
        }
        break;
    }

    return validation;
  }

  // Extraer persona ID según el tipo de QR
  extractPersonaId(qrData) {
    switch (qrData.type) {
      case 'access':
        return qrData.personaId;
      case 'visitor':
        return qrData.hostPersonaId;
      case 'maintenance':
        return null; // Los técnicos pueden no estar en el sistema
      default:
        return null;
    }
  }

  // Encriptar datos sensibles
  async encryptData(data) {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
      
      let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return {
        data: encrypted,
        iv: iv.toString('hex'),
        algorithm: 'aes-256-cbc'
      };
    } catch (error) {
      logger.error('Error encriptando datos QR', error);
      throw error;
    }
  }

  // Desencriptar datos
  async decryptData(encryptedObj) {
    try {
      const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
      
      let decrypted = decipher.update(encryptedObj.data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
    } catch (error) {
      throw new Error('Datos encriptados inválidos');
    }
  }

  // Generar QR con logo personalizado
  async generateQRWithLogo(data, qrType, logoPath = null) {
    try {
      const qrResult = await this.generateAccessQR(data, qrType);
      
      if (logoPath) {
        // En un sistema real, aquí combinarías el QR con el logo
        // usando bibliotecas como sharp o canvas
        qrResult.hasLogo = true;
        qrResult.logoPath = logoPath;
      }

      return qrResult;
    } catch (error) {
      logger.error('Error generando QR con logo', error);
      throw error;
    }
  }

  // Generar QR batch (múltiples QRs)
  async generateBatchQRs(dataArray, qrType) {
    try {
      const results = [];
      
      for (const data of dataArray) {
        try {
          const qrResult = await this.generateAccessQR(data, qrType);
          results.push(qrResult);
        } catch (error) {
          results.push({
            success: false,
            error: error.message,
            data
          });
        }
      }

      logger.info(`Batch QR generation completed`, {
        total: dataArray.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      });

      return {
        success: true,
        total: dataArray.length,
        results
      };

    } catch (error) {
      logger.error('Error en generación batch de QRs', error);
      throw error;
    }
  }

  // Obtener estadísticas de uso de QRs
  async getQRStats(timeframe = '24h') {
    try {
      // En un sistema real, esto consultaría la base de datos
      const stats = {
        timeframe,
        generated: Math.floor(Math.random() * 100 + 50),
        validated: Math.floor(Math.random() * 80 + 30),
        expired: Math.floor(Math.random() * 20 + 5),
        invalid: Math.floor(Math.random() * 10 + 2),
        byType: {
          access: Math.floor(Math.random() * 40 + 20),
          visitor: Math.floor(Math.random() * 30 + 15),
          temporary: Math.floor(Math.random() * 20 + 10),
          group: Math.floor(Math.random() * 10 + 5),
          maintenance: Math.floor(Math.random() * 5 + 2)
        },
        successRate: 0
      };

      stats.successRate = ((stats.validated / (stats.validated + stats.invalid)) * 100).toFixed(1);

      return stats;
    } catch (error) {
      logger.error('Error obteniendo estadísticas de QR', error);
      return null;
    }
  }

  // Revocar un QR específico
  async revokeQR(qrId, reason = 'Manual revocation') {
    try {
      // En un sistema real, esto marcaría el QR como revocado en la base de datos
      
      logger.audit('QR_REVOKED', null, 'qr_service', {
        qrId,
        reason,
        revokedAt: new Date().toISOString()
      });

      return {
        success: true,
        qrId,
        revokedAt: new Date().toISOString(),
        reason
      };
    } catch (error) {
      logger.error('Error revocando QR', error, { qrId, reason });
      throw error;
    }
  }
}

module.exports = new EnhancedQRService();
