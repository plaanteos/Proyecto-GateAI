const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const logger = require('../utils/logger');

class DocumentScannerService {
  constructor() {
    this.documentsDir = path.join(__dirname, '../../data/documents');
    this.ensureDocumentsDirectory();
    this.supportedDocuments = ['dni', 'passport', 'license', 'cedula'];
  }

  ensureDocumentsDirectory() {
    if (!fs.existsSync(this.documentsDir)) {
      fs.mkdirSync(this.documentsDir, { recursive: true });
    }
  }

  // Escanear y procesar documento (DNI, Pasaporte, etc.)
  async scanDocument(documentImageBase64, documentType = 'dni', personaId = null) {
    try {
      if (!documentImageBase64) {
        throw new Error('Imagen del documento es requerida');
      }

      if (!this.supportedDocuments.includes(documentType.toLowerCase())) {
        throw new Error(`Tipo de documento no soportado: ${documentType}`);
      }

      // Procesar imagen
      const imageBuffer = Buffer.from(documentImageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      const imageHash = crypto.createHash('sha256').update(imageBuffer).digest('hex');

      // Extraer texto del documento (OCR simulado)
      const extractedData = await this.performOCR(imageBuffer, documentType);

      // Validar formato y datos extraídos
      const validationResult = this.validateDocumentData(extractedData, documentType);

      // Verificar en base de datos si ya existe
      const duplicateCheck = await this.checkForDuplicates(extractedData);

      const result = {
        success: true,
        documentType: documentType.toUpperCase(),
        imageHash: imageHash.substring(0, 12),
        extractedData,
        validation: validationResult,
        duplicateCheck,
        scanTimestamp: new Date().toISOString(),
        imageSize: imageBuffer.length,
        confidence: extractedData.confidence || 0.85
      };

      // Guardar documento escaneado si es válido
      if (validationResult.isValid && !duplicateCheck.isDuplicate) {
        await this.saveScannedDocument(result, imageBuffer, personaId);
      }

      // Log de auditoría
      logger.audit('DOCUMENT_SCAN', personaId, 'document_scanner', {
        documentType,
        isValid: validationResult.isValid,
        isDuplicate: duplicateCheck.isDuplicate,
        documentNumber: extractedData.documentNumber,
        confidence: result.confidence
      });

      return result;

    } catch (error) {
      logger.error('Error escaneando documento', error, { documentType, personaId });
      return {
        success: false,
        error: error.message,
        scanTimestamp: new Date().toISOString()
      };
    }
  }

  // Simular OCR (Optical Character Recognition)
  async performOCR(imageBuffer, documentType) {
    // En un sistema real, aquí usarías bibliotecas como Tesseract.js, Google Vision API, etc.
    
    // Simulación de datos extraídos según el tipo de documento
    const simulatedData = this.generateSimulatedOCRData(documentType);
    
    // Simular confianza basada en "calidad" de la imagen
    const confidence = this.calculateImageQuality(imageBuffer);
    
    return {
      ...simulatedData,
      confidence,
      processingTime: Math.random() * 2000 + 500, // 0.5-2.5 segundos
      ocrEngine: 'UnionTech OCR v1.0'
    };
  }

  // Generar datos simulados de OCR según tipo de documento
  generateSimulatedOCRData(documentType) {
    const baseData = {
      rawText: '',
      structuredData: {}
    };

    switch (documentType.toLowerCase()) {
      case 'dni':
        return {
          ...baseData,
          documentNumber: this.generateRandomDNI(),
          firstName: 'JUAN CARLOS',
          lastName: 'GARCIA RODRIGUEZ',
          birthDate: '1985-03-15',
          gender: 'M',
          nationality: 'ARGENTINA',
          issuedDate: '2020-01-15',
          expiryDate: '2030-01-15',
          issuingAuthority: 'RENAPER',
          documentType: 'DNI',
          rawText: 'REPUBLICA ARGENTINA\nDNI\nJUAN CARLOS\nGARCIA RODRIGUEZ\n...'
        };

      case 'passport':
        return {
          ...baseData,
          documentNumber: this.generateRandomPassport(),
          firstName: 'MARIA ELENA',
          lastName: 'FERNANDEZ LOPEZ',
          birthDate: '1990-07-22',
          gender: 'F',
          nationality: 'ARG',
          issuedDate: '2019-05-10',
          expiryDate: '2029-05-10',
          issuingAuthority: 'MINISTERIO DEL INTERIOR',
          documentType: 'PASSPORT',
          passportType: 'P',
          countryCode: 'ARG'
        };

      case 'license':
        return {
          ...baseData,
          documentNumber: this.generateRandomLicense(),
          firstName: 'CARLOS ALBERTO',
          lastName: 'MARTINEZ SILVA',
          birthDate: '1988-12-03',
          licenseClass: 'B1',
          issuedDate: '2021-08-20',
          expiryDate: '2026-08-20',
          issuingAuthority: 'MUNICIPALIDAD',
          documentType: 'LICENSE'
        };

      default:
        return {
          ...baseData,
          documentNumber: 'UNKNOWN',
          documentType: documentType.toUpperCase()
        };
    }
  }

  // Validar datos extraídos del documento
  validateDocumentData(extractedData, documentType) {
    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      score: 100
    };

    // Validaciones generales
    if (!extractedData.documentNumber || extractedData.documentNumber === 'UNKNOWN') {
      validation.errors.push('Número de documento no detectado');
      validation.score -= 30;
    }

    if (!extractedData.firstName || !extractedData.lastName) {
      validation.errors.push('Nombre completo no detectado correctamente');
      validation.score -= 25;
    }

    if (!extractedData.birthDate || !this.isValidDate(extractedData.birthDate)) {
      validation.errors.push('Fecha de nacimiento inválida');
      validation.score -= 20;
    }

    // Validaciones específicas por tipo de documento
    switch (documentType.toLowerCase()) {
      case 'dni':
        if (!this.isValidDNI(extractedData.documentNumber)) {
          validation.errors.push('Formato de DNI inválido');
          validation.score -= 25;
        }
        break;

      case 'passport':
        if (!this.isValidPassport(extractedData.documentNumber)) {
          validation.errors.push('Formato de pasaporte inválido');
          validation.score -= 25;
        }
        break;
    }

    // Validar fechas de vencimiento
    if (extractedData.expiryDate && new Date(extractedData.expiryDate) < new Date()) {
      validation.warnings.push('Documento vencido');
      validation.score -= 10;
    }

    // Evaluar confianza
    if (extractedData.confidence < 0.7) {
      validation.warnings.push('Baja confianza en el reconocimiento');
      validation.score -= 15;
    }

    validation.isValid = validation.errors.length === 0 && validation.score >= 60;
    validation.finalScore = Math.max(0, validation.score);

    return validation;
  }

  // Verificar duplicados en la base de datos
  async checkForDuplicates(extractedData) {
    try {
      const scanFiles = fs.readdirSync(this.documentsDir)
        .filter(file => file.endsWith('.json'));

      for (const scanFile of scanFiles) {
        const scanDataPath = path.join(this.documentsDir, scanFile);
        const existingData = JSON.parse(fs.readFileSync(scanDataPath, 'utf8'));

        if (existingData.extractedData.documentNumber === extractedData.documentNumber &&
            existingData.documentType === extractedData.documentType) {
          return {
            isDuplicate: true,
            existingRecord: {
              scanDate: existingData.scanTimestamp,
              personaId: existingData.personaId,
              imageHash: existingData.imageHash
            }
          };
        }
      }

      return { isDuplicate: false };

    } catch (error) {
      logger.error('Error verificando duplicados de documento', error);
      return { isDuplicate: false, error: error.message };
    }
  }

  // Guardar documento escaneado
  async saveScannedDocument(scanResult, imageBuffer, personaId) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `scan_${scanResult.documentType}_${personaId || 'unknown'}_${timestamp}`;

      // Guardar datos JSON
      const jsonPath = path.join(this.documentsDir, `${filename}.json`);
      const documentData = {
        ...scanResult,
        personaId,
        savedAt: new Date().toISOString()
      };
      fs.writeFileSync(jsonPath, JSON.stringify(documentData, null, 2));

      // Guardar imagen
      const imagePath = path.join(this.documentsDir, `${filename}.jpg`);
      fs.writeFileSync(imagePath, imageBuffer);

      logger.info(`Documento guardado exitosamente`, {
        documentType: scanResult.documentType,
        personaId,
        filename,
        imageSize: imageBuffer.length
      });

      return {
        success: true,
        filename,
        savedPath: jsonPath
      };

    } catch (error) {
      logger.error('Error guardando documento escaneado', error);
      throw error;
    }
  }

  // Validar formato de DNI argentino
  isValidDNI(dni) {
    if (!dni) return false;
    const dniRegex = /^[0-9]{7,8}$/;
    return dniRegex.test(dni.toString().replace(/\D/g, ''));
  }

  // Validar formato de pasaporte
  isValidPassport(passport) {
    if (!passport) return false;
    const passportRegex = /^[A-Z]{2}[0-9]{6,7}$/;
    return passportRegex.test(passport.toString().replace(/\s/g, ''));
  }

  // Validar fecha
  isValidDate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  }

  // Calcular calidad de imagen (simulado)
  calculateImageQuality(imageBuffer) {
    // Simulación basada en tamaño y "entropia" de la imagen
    const size = imageBuffer.length;
    const entropy = this.calculateEntropy(imageBuffer);
    
    let quality = 0.5;
    
    // Penalizar imágenes muy pequeñas o muy grandes
    if (size < 50000) quality -= 0.2;
    if (size > 5000000) quality -= 0.1;
    if (size >= 100000 && size <= 2000000) quality += 0.2;
    
    // Factor de entropía (más entropía = más detalles)
    quality += Math.min(0.3, entropy / 8);
    
    return Math.max(0.1, Math.min(0.98, quality));
  }

  // Calcular entropía simple de un buffer
  calculateEntropy(buffer) {
    const frequencies = new Array(256).fill(0);
    
    for (let i = 0; i < Math.min(buffer.length, 10000); i++) {
      frequencies[buffer[i]]++;
    }
    
    let entropy = 0;
    const length = Math.min(buffer.length, 10000);
    
    for (let freq of frequencies) {
      if (freq > 0) {
        const probability = freq / length;
        entropy -= probability * Math.log2(probability);
      }
    }
    
    return entropy;
  }

  // Generar DNI aleatorio válido
  generateRandomDNI() {
    return Math.floor(Math.random() * (99999999 - 10000000) + 10000000).toString();
  }

  // Generar pasaporte aleatorio válido
  generateRandomPassport() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const prefix = letters[Math.floor(Math.random() * letters.length)] + 
                   letters[Math.floor(Math.random() * letters.length)];
    const numbers = Math.floor(Math.random() * (9999999 - 1000000) + 1000000);
    return `${prefix}${numbers}`;
  }

  // Generar licencia aleatoria válida
  generateRandomLicense() {
    return Math.floor(Math.random() * (99999999 - 10000000) + 10000000).toString();
  }

  // Obtener estadísticas de documentos escaneados
  async getDocumentStats() {
    try {
      const scanFiles = fs.readdirSync(this.documentsDir)
        .filter(file => file.endsWith('.json'));

      const stats = {
        totalScans: scanFiles.length,
        byDocumentType: {},
        validDocuments: 0,
        invalidDocuments: 0,
        totalSize: 0,
        averageConfidence: 0
      };

      let totalConfidence = 0;

      for (const scanFile of scanFiles) {
        const scanDataPath = path.join(this.documentsDir, scanFile);
        const scanData = JSON.parse(fs.readFileSync(scanDataPath, 'utf8'));
        const fileStats = fs.statSync(scanDataPath);

        const docType = scanData.documentType || 'UNKNOWN';
        stats.byDocumentType[docType] = (stats.byDocumentType[docType] || 0) + 1;

        if (scanData.validation?.isValid) {
          stats.validDocuments++;
        } else {
          stats.invalidDocuments++;
        }

        stats.totalSize += fileStats.size;
        totalConfidence += scanData.confidence || 0;
      }

      stats.averageConfidence = stats.totalScans > 0 ? 
        (totalConfidence / stats.totalScans).toFixed(3) : 0;
      stats.totalSizeFormatted = this.formatBytes(stats.totalSize);

      return stats;

    } catch (error) {
      logger.error('Error obteniendo estadísticas de documentos', error);
      return null;
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

module.exports = new DocumentScannerService();
