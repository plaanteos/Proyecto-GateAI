const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

/**
 * Servicio de Validación Multimodal
 * Maneja validación por QR, reconocimiento facial y documentos
 */
class ValidationService {
  constructor() {
    this.qrSecret = process.env.QR_SECRET || 'uniontech_qr_secret_2024';
    this.uploadsDir = path.join(__dirname, '../../uploads');
    this.facialThreshold = 0.85; // Umbral de confianza para reconocimiento facial
    this.documentTypes = ['cedula', 'pasaporte', 'licencia', 'carnet_empresarial'];
    
    this.ensureUploadsDir();
  }

  async ensureUploadsDir() {
    try {
      await fs.mkdir(this.uploadsDir, { recursive: true });
      await fs.mkdir(path.join(this.uploadsDir, 'faces'), { recursive: true });
      await fs.mkdir(path.join(this.uploadsDir, 'documents'), { recursive: true });
      await fs.mkdir(path.join(this.uploadsDir, 'temp'), { recursive: true });
    } catch (error) {
      console.warn('⚠️ Error creando directorios de uploads:', error.message);
    }
  }

  // =================== VALIDACIÓN QR ===================
  
  /**
   * Generar código QR para acceso
   */
  generateQRCode(personaId, edificioId, options = {}) {
    const timestamp = Date.now();
    const expiry = timestamp + (options.expiryHours || 24) * 60 * 60 * 1000;
    
    const qrData = {
      pid: personaId,
      eid: edificioId,
      ts: timestamp,
      exp: expiry,
      type: options.type || 'access',
      level: options.level || 'standard',
      areas: options.allowedAreas || ['general'],
      temp: options.isTemporary || false
    };

    // Crear firma digital
    const dataString = JSON.stringify(qrData);
    const signature = crypto
      .createHmac('sha256', this.qrSecret)
      .update(dataString)
      .digest('hex');

    const qrPayload = {
      data: qrData,
      sig: signature,
      v: '2.0' // versión del QR
    };

    return {
      qrCode: Buffer.from(JSON.stringify(qrPayload)).toString('base64'),
      qrData: qrData,
      expiresAt: new Date(expiry)
    };
  }

  /**
   * Validar código QR
   */
  validateQRCode(qrCode, edificioId) {
    try {
      const qrPayload = JSON.parse(Buffer.from(qrCode, 'base64').toString());
      const { data, sig, v } = qrPayload;

      // Verificar versión
      if (v !== '2.0') {
        return { valid: false, error: 'Versión de QR no compatible' };
      }

      // Verificar firma
      const dataString = JSON.stringify(data);
      const expectedSig = crypto
        .createHmac('sha256', this.qrSecret)
        .update(dataString)
        .digest('hex');

      if (sig !== expectedSig) {
        return { valid: false, error: 'QR inválido o modificado' };
      }

      // Verificar expiración
      if (Date.now() > data.exp) {
        return { valid: false, error: 'QR expirado' };
      }

      // Verificar edificio (si se especifica)
      if (edificioId && data.eid !== edificioId) {
        return { valid: false, error: 'QR no válido para este edificio' };
      }

      return {
        valid: true,
        data: {
          personaId: data.pid,
          edificioId: data.eid,
          accessLevel: data.level,
          allowedAreas: data.areas,
          isTemporary: data.temp,
          validUntil: new Date(data.exp)
        }
      };

    } catch (error) {
      return { valid: false, error: 'QR malformado' };
    }
  }

  // =================== RECONOCIMIENTO FACIAL ===================

  /**
   * Registrar rostro de referencia para una persona
   */
  async registerFace(personaId, faceImageBase64, metadata = {}) {
    try {
      // Simular procesamiento de imagen facial
      const faceDescriptor = this.simulateFaceDescriptor(faceImageBase64);
      
      const faceData = {
        personaId,
        descriptor: faceDescriptor,
        registeredAt: new Date().toISOString(),
        quality: this.assessImageQuality(faceImageBase64),
        metadata: {
          ...metadata,
          imageSize: faceImageBase64.length,
          algorithm: 'UnionTech-FaceNet-v2.1'
        }
      };

      // Guardar datos faciales
      const facePath = path.join(this.uploadsDir, 'faces', `${personaId}.json`);
      await fs.writeFile(facePath, JSON.stringify(faceData, null, 2));

      // Guardar imagen de referencia
      const imageBuffer = Buffer.from(faceImageBase64.split(',')[1] || faceImageBase64, 'base64');
      const imagePath = path.join(this.uploadsDir, 'faces', `${personaId}.jpg`);
      await fs.writeFile(imagePath, imageBuffer);

      return {
        success: true,
        faceId: `face_${personaId}_${Date.now()}`,
        quality: faceData.quality,
        message: 'Rostro registrado exitosamente'
      };

    } catch (error) {
      return {
        success: false,
        error: 'Error procesando imagen facial',
        details: error.message
      };
    }
  }

  /**
   * Validar acceso por reconocimiento facial
   */
  async validateFacialRecognition(personaId, capturedFaceBase64) {
    try {
      // Obtener rostro de referencia
      const facePath = path.join(this.uploadsDir, 'faces', `${personaId}.json`);
      
      try {
        const faceDataStr = await fs.readFile(facePath, 'utf8');
        const referenceFace = JSON.parse(faceDataStr);
        
        // Procesar imagen capturada
        const capturedDescriptor = this.simulateFaceDescriptor(capturedFaceBase64);
        const imageQuality = this.assessImageQuality(capturedFaceBase64);
        
        // Calcular similitud
        const similarity = this.calculateFaceSimilarity(
          referenceFace.descriptor,
          capturedDescriptor
        );

        const isMatch = similarity >= this.facialThreshold && imageQuality.score >= 0.7;

        // Registrar intento de validación
        const validationLog = {
          personaId,
          timestamp: new Date().toISOString(),
          similarity,
          threshold: this.facialThreshold,
          imageQuality: imageQuality.score,
          result: isMatch ? 'match' : 'no_match',
          confidence: similarity
        };

        return {
          valid: isMatch,
          confidence: similarity,
          imageQuality: imageQuality.score,
          threshold: this.facialThreshold,
          details: validationLog,
          message: isMatch 
            ? 'Acceso autorizado por reconocimiento facial'
            : `Reconocimiento fallido (similitud: ${(similarity * 100).toFixed(1)}%)`
        };

      } catch (fileError) {
        return {
          valid: false,
          error: 'No hay rostro registrado para esta persona',
          recommendation: 'Registre primero el rostro de referencia'
        };
      }

    } catch (error) {
      return {
        valid: false,
        error: 'Error en validación facial',
        details: error.message
      };
    }
  }

  // =================== VALIDACIÓN DE DOCUMENTOS ===================

  /**
   * Validar documento de identidad
   */
  async validateDocument(personaId, documentImageBase64, documentType, expectedData = {}) {
    try {
      // Simular OCR y extracción de datos
      const extractedData = await this.simulateOCR(documentImageBase64, documentType);
      
      // Validar integridad del documento
      const integrityCheck = this.validateDocumentIntegrity(extractedData, documentType);
      
      // Comparar con datos esperados
      const dataMatch = this.compareDocumentData(extractedData, expectedData);
      
      // Detectar posibles falsificaciones
      const antiCounterfeit = this.detectCounterfeit(documentImageBase64, documentType);

      const isValid = integrityCheck.valid && dataMatch.valid && antiCounterfeit.valid;

      const validationResult = {
        valid: isValid,
        documentType,
        extractedData: extractedData.sanitized,
        checks: {
          integrity: integrityCheck,
          dataMatch: dataMatch,
          antiCounterfeit: antiCounterfeit
        },
        confidence: (integrityCheck.confidence + dataMatch.confidence + antiCounterfeit.confidence) / 3,
        timestamp: new Date().toISOString()
      };

      // Guardar registro de validación
      await this.saveDocumentValidation(personaId, validationResult);

      return validationResult;

    } catch (error) {
      return {
        valid: false,
        error: 'Error procesando documento',
        details: error.message
      };
    }
  }

  // =================== VALIDACIÓN COMBINADA ===================

  /**
   * Validación multimodal (combina QR + Facial + Documento)
   */
  async multiModalValidation(personaId, validationData) {
    const results = {
      overall: false,
      timestamp: new Date().toISOString(),
      personaId,
      methods: {}
    };

    let validationCount = 0;
    let successCount = 0;

    // Validación QR
    if (validationData.qrCode) {
      validationCount++;
      const qrResult = this.validateQRCode(validationData.qrCode, validationData.edificioId);
      results.methods.qr = qrResult;
      if (qrResult.valid) successCount++;
    }

    // Validación Facial
    if (validationData.faceImage) {
      validationCount++;
      const faceResult = await this.validateFacialRecognition(personaId, validationData.faceImage);
      results.methods.facial = faceResult;
      if (faceResult.valid) successCount++;
    }

    // Validación de Documento
    if (validationData.documentImage) {
      validationCount++;
      const docResult = await this.validateDocument(
        personaId,
        validationData.documentImage,
        validationData.documentType,
        validationData.expectedDocumentData
      );
      results.methods.document = docResult;
      if (docResult.valid) successCount++;
    }

    // Determinar resultado general
    const successRate = successCount / validationCount;
    results.overall = successRate >= 0.6; // Al menos 60% de los métodos deben ser exitosos
    results.successRate = successRate;
    results.methodsUsed = validationCount;
    results.methodsPassed = successCount;

    // Nivel de seguridad alcanzado
    if (successCount === 3) {
      results.securityLevel = 'maximum';
    } else if (successCount === 2) {
      results.securityLevel = 'high';
    } else if (successCount === 1) {
      results.securityLevel = 'standard';
    } else {
      results.securityLevel = 'denied';
    }

    return results;
  }

  // =================== MÉTODOS AUXILIARES ===================

  simulateFaceDescriptor(imageBase64) {
    // Simular extracción de características faciales
    const hash = crypto.createHash('sha256').update(imageBase64).digest('hex');
    const descriptor = [];
    
    for (let i = 0; i < 128; i++) {
      descriptor.push(parseFloat((Math.sin(parseInt(hash.substr(i % 64, 2), 16)) * 0.5).toFixed(6)));
    }
    
    return descriptor;
  }

  assessImageQuality(imageBase64) {
    // Simular evaluación de calidad de imagen
    const size = imageBase64.length;
    const hasGoodResolution = size > 50000; // Tamaño mínimo
    const hasProperFormat = imageBase64.includes('data:image');
    
    let score = 0.5;
    if (hasGoodResolution) score += 0.3;
    if (hasProperFormat) score += 0.2;
    
    return {
      score: Math.min(score, 1.0),
      resolution: hasGoodResolution ? 'adequate' : 'low',
      format: hasProperFormat ? 'valid' : 'invalid'
    };
  }

  calculateFaceSimilarity(descriptor1, descriptor2) {
    if (!descriptor1 || !descriptor2 || descriptor1.length !== descriptor2.length) {
      return 0;
    }

    // Calcular distancia euclidiana
    let sum = 0;
    for (let i = 0; i < descriptor1.length; i++) {
      sum += Math.pow(descriptor1[i] - descriptor2[i], 2);
    }
    
    const distance = Math.sqrt(sum);
    // Convertir distancia a similitud (0-1)
    const similarity = Math.max(0, 1 - (distance / 10));
    
    return Math.min(similarity, 1.0);
  }

  async simulateOCR(imageBase64, documentType) {
    // Simular extracción de datos por OCR
    const mockData = {
      cedula: {
        numero: '1234567890',
        nombre: 'Juan Carlos Pérez',
        fechaNacimiento: '1985-03-15',
        sexo: 'M',
        fechaExpedicion: '2020-01-15',
        fechaVencimiento: '2030-01-15'
      },
      pasaporte: {
        numero: 'AB1234567',
        nombre: 'Juan Carlos Pérez',
        nacionalidad: 'Colombiana',
        fechaNacimiento: '1985-03-15',
        fechaExpedicion: '2019-05-20',
        fechaVencimiento: '2029-05-20'
      }
    };

    const baseData = mockData[documentType] || mockData.cedula;
    
    return {
      raw: baseData,
      sanitized: baseData,
      confidence: 0.92,
      processingTime: Math.random() * 2000 + 500
    };
  }

  validateDocumentIntegrity(extractedData, documentType) {
    // Verificar formato y estructura del documento
    const hasRequiredFields = extractedData.raw.numero && extractedData.raw.nombre;
    const hasValidDates = extractedData.raw.fechaExpedicion && extractedData.raw.fechaVencimiento;
    
    return {
      valid: hasRequiredFields && hasValidDates,
      confidence: hasRequiredFields && hasValidDates ? 0.95 : 0.3,
      checks: {
        requiredFields: hasRequiredFields,
        validDates: hasValidDates,
        formatCompliance: true
      }
    };
  }

  compareDocumentData(extractedData, expectedData) {
    if (!expectedData || Object.keys(expectedData).length === 0) {
      return { valid: true, confidence: 0.8, matches: [] };
    }

    const matches = [];
    let matchCount = 0;
    const totalFields = Object.keys(expectedData).length;

    for (const [key, expectedValue] of Object.entries(expectedData)) {
      const extractedValue = extractedData.raw[key];
      const isMatch = String(extractedValue).toLowerCase() === String(expectedValue).toLowerCase();
      
      matches.push({
        field: key,
        expected: expectedValue,
        extracted: extractedValue,
        match: isMatch
      });

      if (isMatch) matchCount++;
    }

    const confidence = matchCount / totalFields;

    return {
      valid: confidence >= 0.7,
      confidence,
      matches,
      matchRate: `${matchCount}/${totalFields}`
    };
  }

  detectCounterfeit(imageBase64, documentType) {
    // Simular detección de falsificaciones
    const imageQuality = this.assessImageQuality(imageBase64);
    const hasWatermarks = Math.random() > 0.3; // Simular detección de marcas de agua
    const hasSecurityFeatures = Math.random() > 0.2;
    
    const confidence = (imageQuality.score + (hasWatermarks ? 0.3 : 0) + (hasSecurityFeatures ? 0.3 : 0));
    
    return {
      valid: confidence >= 0.7,
      confidence: Math.min(confidence, 1.0),
      features: {
        watermarks: hasWatermarks,
        securityFeatures: hasSecurityFeatures,
        imageQuality: imageQuality.score
      }
    };
  }

  async saveDocumentValidation(personaId, validationResult) {
    try {
      const logPath = path.join(this.uploadsDir, 'documents', `validation_${personaId}_${Date.now()}.json`);
      await fs.writeFile(logPath, JSON.stringify(validationResult, null, 2));
    } catch (error) {
      console.warn('⚠️ Error guardando log de validación:', error.message);
    }
  }

  // =================== MÉTODOS DE UTILIDAD ===================

  getSupportedDocumentTypes() {
    return this.documentTypes;
  }

  getValidationStats(personaId) {
    // Retornar estadísticas de validación para una persona
    return {
      qrGenerated: Math.floor(Math.random() * 50),
      faceValidations: Math.floor(Math.random() * 30),
      documentValidations: Math.floor(Math.random() * 10),
      successRate: (Math.random() * 0.3 + 0.7).toFixed(2)
    };
  }
}

module.exports = ValidationService;
