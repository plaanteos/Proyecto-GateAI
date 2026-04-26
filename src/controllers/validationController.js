const facialRecognitionService = require('../services/facialRecognitionService');
const documentScannerService = require('../services/documentScannerService');
const enhancedQRService = require('../services/enhancedQRService');
const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

class ValidationController {
  
  // Validación facial
  async validateFacialRecognition(req, res) {
    try {
      const { imageData, personaId, confidence = 0.8 } = req.body;

      if (!imageData) {
        return res.status(400).json({
          success: false,
          error: 'Imagen requerida para validación facial'
        });
      }

      // Procesar imagen facial
      const faceResult = await facialRecognitionService.processImage(imageData);
      
      if (!faceResult.success) {
        return res.status(400).json({
          success: false,
          error: 'No se pudo procesar la imagen facial',
          details: faceResult.error
        });
      }

      let validationResult;

      if (personaId) {
        // Verificar contra persona específica
        validationResult = await facialRecognitionService.verifyIdentity(imageData, personaId, confidence);
      } else {
        // Identificar persona desde la base de datos
        validationResult = await facialRecognitionService.identifyPerson(imageData, confidence);
      }

      // Log de auditoría
      logger.audit('FACIAL_VALIDATION', personaId, req.ip, {
        success: validationResult.success,
        confidence: validationResult.confidence,
        matchedPersonaId: validationResult.personaId,
        processingTime: validationResult.processingTime
      });

      res.json({
        success: validationResult.success,
        data: {
          isVerified: validationResult.success,
          personaId: validationResult.personaId,
          confidence: validationResult.confidence,
          faceFeatures: validationResult.features,
          processingTime: validationResult.processingTime
        },
        metadata: {
          timestamp: new Date().toISOString(),
          method: 'facial_recognition',
          version: '2.0'
        }
      });

    } catch (error) {
      logger.error('Error en validación facial', error, { personaId: req.body.personaId });
      res.status(500).json({
        success: false,
        error: 'Error interno en validación facial'
      });
    }
  }

  // Escaneo y validación de documentos
  async validateDocument(req, res) {
    try {
      const { imageData, documentType = 'dni', personaId } = req.body;

      if (!imageData) {
        return res.status(400).json({
          success: false,
          error: 'Imagen del documento requerida'
        });
      }

      // Procesar documento
      const scanResult = await documentScannerService.scanDocument(imageData, documentType);
      
      if (!scanResult.success) {
        return res.status(400).json({
          success: false,
          error: 'No se pudo procesar el documento',
          details: scanResult.error
        });
      }

      let validationResult;

      if (personaId) {
        // Validar contra persona específica
        validationResult = await documentScannerService.validateAgainstPerson(
          scanResult.extractedData, 
          personaId
        );
      } else {
        // Buscar persona por datos del documento
        validationResult = await documentScannerService.findPersonByDocument(
          scanResult.extractedData,
          documentType
        );
      }

      // Log de auditoría
      logger.audit('DOCUMENT_VALIDATION', personaId, req.ip, {
        documentType,
        success: validationResult.success,
        extractedData: scanResult.extractedData,
        matchedPersonaId: validationResult.personaId,
        confidence: validationResult.confidence
      });

      res.json({
        success: validationResult.success,
        data: {
          isValid: validationResult.success,
          documentType,
          extractedData: scanResult.extractedData,
          personaId: validationResult.personaId,
          confidence: validationResult.confidence,
          validationDetails: validationResult.details
        },
        metadata: {
          timestamp: new Date().toISOString(),
          method: 'document_scanning',
          version: '2.0'
        }
      });

    } catch (error) {
      logger.error('Error en validación de documento', error, { documentType: req.body.documentType });
      res.status(500).json({
        success: false,
        error: 'Error interno en validación de documento'
      });
    }
  }

  // Validación de código QR
  async validateQR(req, res) {
    try {
      const { qrData, edificioId, zoneId } = req.body;

      if (!qrData) {
        return res.status(400).json({
          success: false,
          error: 'Datos del código QR requeridos'
        });
      }

      // Contexto de validación
      const validationContext = {
        edificioId,
        zoneId,
        timestamp: new Date().toISOString(),
        userAgent: req.get('User-Agent'),
        ip: req.ip
      };

      // Validar QR
      const validationResult = await enhancedQRService.validateQR(qrData, validationContext);

      // Log de auditoría
      logger.audit('QR_VALIDATION', validationResult.personaId, req.ip, {
        qrType: validationResult.qrType,
        qrId: validationResult.qrId,
        success: validationResult.isValid,
        errors: validationResult.errors,
        context: validationContext
      });

      res.json({
        success: validationResult.isValid,
        data: {
          isValid: validationResult.isValid,
          qrType: validationResult.qrType,
          qrId: validationResult.qrId,
          personaId: validationResult.personaId,
          edificioId: validationResult.edificioId,
          accessLevel: validationResult.accessLevel,
          allowedZones: validationResult.allowedZones,
          errors: validationResult.errors,
          warnings: validationResult.warnings
        },
        metadata: {
          timestamp: new Date().toISOString(),
          method: 'qr_code',
          version: '2.0'
        }
      });

    } catch (error) {
      logger.error('Error en validación QR', error, { qrData: req.body.qrData });
      res.status(500).json({
        success: false,
        error: 'Error interno en validación QR'
      });
    }
  }

  // Validación multimodal (combina varios métodos)
  async validateMultimodal(req, res) {
    try {
      const { 
        faceImage, 
        documentImage, 
        qrData, 
        personaId, 
        edificioId,
        requiredMethods = ['face'], // Métodos requeridos
        confidenceThreshold = 0.8 
      } = req.body;

      const validationResults = {
        success: false,
        methods: {},
        overallConfidence: 0,
        personaId: null,
        errors: [],
        warnings: []
      };

      let totalConfidence = 0;
      let validMethods = 0;

      // Validación facial (si se proporciona)
      if (faceImage && (requiredMethods.includes('face') || requiredMethods.includes('facial'))) {
        try {
          const faceResult = personaId 
            ? await facialRecognitionService.verifyIdentity(faceImage, personaId, confidenceThreshold)
            : await facialRecognitionService.identifyPerson(faceImage, confidenceThreshold);

          validationResults.methods.facial = {
            success: faceResult.success,
            confidence: faceResult.confidence,
            personaId: faceResult.personaId,
            processingTime: faceResult.processingTime
          };

          if (faceResult.success) {
            totalConfidence += faceResult.confidence;
            validMethods++;
            if (!validationResults.personaId) {
              validationResults.personaId = faceResult.personaId;
            }
          } else {
            validationResults.errors.push('Validación facial fallida');
          }
        } catch (error) {
          validationResults.methods.facial = { success: false, error: error.message };
          validationResults.errors.push('Error en validación facial');
        }
      }

      // Validación de documento (si se proporciona)
      if (documentImage && (requiredMethods.includes('document') || requiredMethods.includes('dni'))) {
        try {
          const docScanResult = await documentScannerService.scanDocument(documentImage, 'dni');
          
          if (docScanResult.success) {
            const docValidation = personaId
              ? await documentScannerService.validateAgainstPerson(docScanResult.extractedData, personaId)
              : await documentScannerService.findPersonByDocument(docScanResult.extractedData, 'dni');

            validationResults.methods.document = {
              success: docValidation.success,
              confidence: docValidation.confidence,
              personaId: docValidation.personaId,
              extractedData: docScanResult.extractedData
            };

            if (docValidation.success) {
              totalConfidence += docValidation.confidence;
              validMethods++;
              if (!validationResults.personaId) {
                validationResults.personaId = docValidation.personaId;
              }
            } else {
              validationResults.errors.push('Validación de documento fallida');
            }
          } else {
            validationResults.methods.document = { success: false, error: docScanResult.error };
            validationResults.errors.push('Error procesando documento');
          }
        } catch (error) {
          validationResults.methods.document = { success: false, error: error.message };
          validationResults.errors.push('Error en validación de documento');
        }
      }

      // Validación QR (si se proporciona)
      if (qrData && (requiredMethods.includes('qr') || requiredMethods.includes('qrcode'))) {
        try {
          const qrValidation = await enhancedQRService.validateQR(qrData, { edificioId });

          validationResults.methods.qr = {
            success: qrValidation.isValid,
            qrType: qrValidation.qrType,
            qrId: qrValidation.qrId,
            personaId: qrValidation.personaId,
            accessLevel: qrValidation.accessLevel,
            errors: qrValidation.errors
          };

          if (qrValidation.isValid) {
            totalConfidence += 0.9; // QR válido tiene alta confianza
            validMethods++;
            if (!validationResults.personaId) {
              validationResults.personaId = qrValidation.personaId;
            }
          } else {
            validationResults.errors.push('Validación QR fallida');
          }
        } catch (error) {
          validationResults.methods.qr = { success: false, error: error.message };
          validationResults.errors.push('Error en validación QR');
        }
      }

      // Calcular confianza general y determinar éxito
      if (validMethods > 0) {
        validationResults.overallConfidence = totalConfidence / validMethods;
        validationResults.success = validationResults.overallConfidence >= confidenceThreshold;
      }

      // Verificar consistencia entre métodos
      if (validMethods > 1) {
        const personaIds = Object.values(validationResults.methods)
          .filter(method => method.success && method.personaId)
          .map(method => method.personaId);
        
        const uniquePersonaIds = [...new Set(personaIds)];
        if (uniquePersonaIds.length > 1) {
          validationResults.warnings.push('Inconsistencia entre métodos de validación');
          validationResults.success = false;
        }
      }

      // Log de auditoría completa
      logger.audit('MULTIMODAL_VALIDATION', validationResults.personaId, req.ip, {
        requiredMethods,
        success: validationResults.success,
        overallConfidence: validationResults.overallConfidence,
        validMethods,
        methods: Object.keys(validationResults.methods),
        errors: validationResults.errors,
        warnings: validationResults.warnings
      });

      res.json({
        success: validationResults.success,
        data: validationResults,
        metadata: {
          timestamp: new Date().toISOString(),
          method: 'multimodal_validation',
          version: '2.0'
        }
      });

    } catch (error) {
      logger.error('Error en validación multimodal', error, { personaId: req.body.personaId });
      res.status(500).json({
        success: false,
        error: 'Error interno en validación multimodal'
      });
    }
  }

  // Generar código QR
  async generateQR(req, res) {
    try {
      const { 
        personaId, 
        edificioId, 
        qrType = 'access', 
        expiresIn = '1h',
        accessLevel = 'basic',
        zones = ['entrance']
      } = req.body;

      if (!personaId || !edificioId) {
        return res.status(400).json({
          success: false,
          error: 'PersonaId y EdificioId son requeridos'
        });
      }

      // Calcular fecha de expiración
      const now = new Date();
      let expiresAt;
      
      switch (expiresIn) {
        case '15m':
          expiresAt = new Date(now.getTime() + 15 * 60 * 1000);
          break;
        case '30m':
          expiresAt = new Date(now.getTime() + 30 * 60 * 1000);
          break;
        case '1h':
          expiresAt = new Date(now.getTime() + 60 * 60 * 1000);
          break;
        case '4h':
          expiresAt = new Date(now.getTime() + 4 * 60 * 60 * 1000);
          break;
        case '24h':
          expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          break;
        default:
          expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hora por defecto
      }

      const qrData = {
        personaId,
        edificioId,
        expiresAt: expiresAt.toISOString(),
        accessLevel,
        zones,
        userId: req.user?.id
      };

      const qrResult = await enhancedQRService.generateAccessQR(qrData, qrType);

      // Log de auditoría
      logger.audit('QR_GENERATED', personaId, req.ip, {
        qrType,
        qrId: qrResult.qrData.qrId,
        edificioId,
        expiresAt: expiresAt.toISOString(),
        accessLevel,
        zones
      });

      res.json({
        success: true,
        data: {
          qrCode: qrResult.qrCode,
          qrId: qrResult.qrData.qrId,
          qrType,
          expiresAt: expiresAt.toISOString(),
          accessLevel,
          zones,
          metadata: qrResult.metadata
        }
      });

    } catch (error) {
      logger.error('Error generando código QR', error, { personaId: req.body.personaId });
      res.status(500).json({
        success: false,
        error: 'Error interno generando código QR'
      });
    }
  }

  // Obtener estadísticas de validación
  async getValidationStats(req, res) {
    try {
      const { timeframe = '24h' } = req.query;

      // Simular estadísticas (en un sistema real vendría de la base de datos)
      const stats = {
        timeframe,
        summary: {
          totalValidations: Math.floor(Math.random() * 500 + 200),
          successfulValidations: Math.floor(Math.random() * 400 + 150),
          failedValidations: Math.floor(Math.random() * 100 + 50),
          averageConfidence: (Math.random() * 0.3 + 0.7).toFixed(3)
        },
        byMethod: {
          facial: {
            total: Math.floor(Math.random() * 200 + 100),
            successful: Math.floor(Math.random() * 180 + 80),
            averageConfidence: (Math.random() * 0.2 + 0.8).toFixed(3)
          },
          document: {
            total: Math.floor(Math.random() * 150 + 75),
            successful: Math.floor(Math.random() * 130 + 60),
            averageConfidence: (Math.random() * 0.2 + 0.75).toFixed(3)
          },
          qr: {
            total: Math.floor(Math.random() * 300 + 150),
            successful: Math.floor(Math.random() * 280 + 140),
            averageConfidence: (Math.random() * 0.1 + 0.9).toFixed(3)
          },
          multimodal: {
            total: Math.floor(Math.random() * 100 + 50),
            successful: Math.floor(Math.random() * 95 + 45),
            averageConfidence: (Math.random() * 0.1 + 0.9).toFixed(3)
          }
        },
        errorTypes: {
          'Imagen borrosa': Math.floor(Math.random() * 20 + 5),
          'QR expirado': Math.floor(Math.random() * 15 + 10),
          'Documento ilegible': Math.floor(Math.random() * 10 + 5),
          'Confianza insuficiente': Math.floor(Math.random() * 25 + 10),
          'Persona no encontrada': Math.floor(Math.random() * 15 + 5)
        }
      };

      // Calcular tasas de éxito
      stats.byMethod.facial.successRate = ((stats.byMethod.facial.successful / stats.byMethod.facial.total) * 100).toFixed(1);
      stats.byMethod.document.successRate = ((stats.byMethod.document.successful / stats.byMethod.document.total) * 100).toFixed(1);
      stats.byMethod.qr.successRate = ((stats.byMethod.qr.successful / stats.byMethod.qr.total) * 100).toFixed(1);
      stats.byMethod.multimodal.successRate = ((stats.byMethod.multimodal.successful / stats.byMethod.multimodal.total) * 100).toFixed(1);
      stats.summary.successRate = ((stats.summary.successfulValidations / stats.summary.totalValidations) * 100).toFixed(1);

      res.json({
        success: true,
        data: stats,
        metadata: {
          timestamp: new Date().toISOString(),
          generatedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('Error obteniendo estadísticas de validación', error);
      res.status(500).json({
        success: false,
        error: 'Error interno obteniendo estadísticas'
      });
    }
  }
}

module.exports = new ValidationController();
