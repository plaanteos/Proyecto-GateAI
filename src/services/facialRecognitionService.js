const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const logger = require('../utils/logger');

class FacialRecognitionService {
  constructor() {
    this.faceDataDir = path.join(__dirname, '../../data/faces');
    this.ensureFaceDirectory();
    this.confidence_threshold = 0.8; // Umbral de confianza
  }

  ensureFaceDirectory() {
    if (!fs.existsSync(this.faceDataDir)) {
      fs.mkdirSync(this.faceDataDir, { recursive: true });
    }
  }

  // Registrar datos faciales de una persona
  async registerFaceData(personaId, faceImageBase64, metadata = {}) {
    try {
      if (!faceImageBase64 || !personaId) {
        throw new Error('Datos de imagen facial y persona ID son requeridos');
      }

      // Procesar imagen base64
      const imageBuffer = Buffer.from(faceImageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      
      // Generar hash único para la imagen
      const imageHash = crypto.createHash('sha256').update(imageBuffer).digest('hex');
      
      // Crear estructura de datos faciales
      const faceData = {
        personaId: personaId,
        imageHash: imageHash,
        registeredAt: new Date().toISOString(),
        metadata: {
          imageSize: imageBuffer.length,
          format: 'base64',
          ...metadata
        },
        // En un sistema real, aquí irían los vectores faciales extraídos
        faceFeatures: this.extractFaceFeatures(imageBuffer),
        active: true
      };

      // Guardar datos faciales
      const faceFilePath = path.join(this.faceDataDir, `face_${personaId}_${imageHash.substring(0, 8)}.json`);
      fs.writeFileSync(faceFilePath, JSON.stringify(faceData, null, 2));

      // Guardar imagen procesada
      const imageFilePath = path.join(this.faceDataDir, `face_${personaId}_${imageHash.substring(0, 8)}.jpg`);
      fs.writeFileSync(imageFilePath, imageBuffer);

      logger.info(`Datos faciales registrados para persona ${personaId}`, {
        personaId,
        imageHash: imageHash.substring(0, 8),
        imageSize: imageBuffer.length
      });

      return {
        success: true,
        faceId: imageHash.substring(0, 8),
        message: 'Datos faciales registrados exitosamente'
      };

    } catch (error) {
      logger.error('Error registrando datos faciales', error, { personaId });
      throw error;
    }
  }

  // Validar reconocimiento facial
  async validateFace(faceImageBase64, personaId = null) {
    try {
      if (!faceImageBase64) {
        throw new Error('Imagen facial es requerida');
      }

      // Procesar imagen de entrada
      const inputImageBuffer = Buffer.from(faceImageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      const inputFeatures = this.extractFaceFeatures(inputImageBuffer);

      let matchResults = [];

      if (personaId) {
        // Validación específica para una persona
        matchResults = await this.compareWithPersonFaces(inputFeatures, personaId);
      } else {
        // Búsqueda en toda la base de datos facial
        matchResults = await this.searchInFaceDatabase(inputFeatures);
      }

      // Evaluar resultados
      const bestMatch = matchResults.length > 0 ? matchResults[0] : null;
      const isValid = bestMatch && bestMatch.confidence >= this.confidence_threshold;

      const result = {
        success: true,
        isValid,
        confidence: bestMatch?.confidence || 0,
        personaId: bestMatch?.personaId || null,
        matches: matchResults.slice(0, 3), // Top 3 matches
        timestamp: new Date().toISOString(),
        validationType: 'facial_recognition'
      };

      // Log del resultado
      logger.audit('FACIAL_VALIDATION', null, 'facial_recognition', {
        success: isValid,
        confidence: result.confidence,
        personaId: result.personaId,
        totalMatches: matchResults.length
      });

      return result;

    } catch (error) {
      logger.error('Error en validación facial', error);
      return {
        success: false,
        isValid: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Extraer características faciales (simulación - en producción usar TensorFlow/OpenCV)
  extractFaceFeatures(imageBuffer) {
    // Simulación de extracción de características faciales
    // En un sistema real usarías bibliotecas como face-api.js, OpenCV, etc.
    
    const hash = crypto.createHash('sha256').update(imageBuffer).digest('hex');
    
    // Simular vector de características faciales (128 dimensiones típicas)
    const features = [];
    for (let i = 0; i < 128; i++) {
      features.push(parseFloat((Math.sin(parseInt(hash.substring(i % hash.length, (i % hash.length) + 2), 16) / 256 * Math.PI * 2) * 1000).toFixed(6)));
    }
    
    return features;
  }

  // Comparar con caras registradas de una persona específica
  async compareWithPersonFaces(inputFeatures, personaId) {
    const matches = [];
    
    try {
      const faceFiles = fs.readdirSync(this.faceDataDir)
        .filter(file => file.startsWith(`face_${personaId}_`) && file.endsWith('.json'));

      for (const faceFile of faceFiles) {
        const faceDataPath = path.join(this.faceDataDir, faceFile);
        const faceData = JSON.parse(fs.readFileSync(faceDataPath, 'utf8'));
        
        if (faceData.active) {
          const confidence = this.calculateSimilarity(inputFeatures, faceData.faceFeatures);
          
          matches.push({
            personaId: faceData.personaId,
            confidence,
            faceId: faceData.imageHash.substring(0, 8),
            registeredAt: faceData.registeredAt
          });
        }
      }

      return matches.sort((a, b) => b.confidence - a.confidence);

    } catch (error) {
      logger.error('Error comparando con caras de persona', error, { personaId });
      return [];
    }
  }

  // Buscar en toda la base de datos facial
  async searchInFaceDatabase(inputFeatures) {
    const matches = [];
    
    try {
      const faceFiles = fs.readdirSync(this.faceDataDir)
        .filter(file => file.startsWith('face_') && file.endsWith('.json'));

      for (const faceFile of faceFiles) {
        const faceDataPath = path.join(this.faceDataDir, faceFile);
        const faceData = JSON.parse(fs.readFileSync(faceDataPath, 'utf8'));
        
        if (faceData.active) {
          const confidence = this.calculateSimilarity(inputFeatures, faceData.faceFeatures);
          
          if (confidence >= 0.3) { // Umbral mínimo para considerar
            matches.push({
              personaId: faceData.personaId,
              confidence,
              faceId: faceData.imageHash.substring(0, 8),
              registeredAt: faceData.registeredAt
            });
          }
        }
      }

      return matches.sort((a, b) => b.confidence - a.confidence);

    } catch (error) {
      logger.error('Error buscando en base de datos facial', error);
      return [];
    }
  }

  // Calcular similitud entre vectores de características
  calculateSimilarity(features1, features2) {
    if (!features1 || !features2 || features1.length !== features2.length) {
      return 0;
    }

    // Calcular distancia euclidiana
    let sumSquaredDiff = 0;
    for (let i = 0; i < features1.length; i++) {
      const diff = features1[i] - features2[i];
      sumSquaredDiff += diff * diff;
    }
    
    const euclideanDistance = Math.sqrt(sumSquaredDiff);
    
    // Convertir distancia a similitud (0-1)
    const maxDistance = Math.sqrt(features1.length * 4); // Máxima distancia teórica
    const similarity = Math.max(0, 1 - (euclideanDistance / maxDistance));
    
    return similarity;
  }

  // Eliminar datos faciales de una persona
  async deleteFaceData(personaId, faceId = null) {
    try {
      let deletedCount = 0;
      const faceFiles = fs.readdirSync(this.faceDataDir);

      for (const file of faceFiles) {
        if (file.startsWith(`face_${personaId}_`)) {
          if (faceId && !file.includes(faceId)) {
            continue;
          }

          const filePath = path.join(this.faceDataDir, file);
          fs.unlinkSync(filePath);
          deletedCount++;

          // También eliminar imagen asociada
          const imageFile = file.replace('.json', '.jpg');
          const imagePath = path.join(this.faceDataDir, imageFile);
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        }
      }

      logger.info(`Datos faciales eliminados para persona ${personaId}`, {
        personaId,
        faceId,
        deletedCount
      });

      return {
        success: true,
        deletedCount,
        message: `${deletedCount} registros faciales eliminados`
      };

    } catch (error) {
      logger.error('Error eliminando datos faciales', error, { personaId, faceId });
      throw error;
    }
  }

  // Obtener estadísticas del sistema facial
  async getFaceStats() {
    try {
      const faceFiles = fs.readdirSync(this.faceDataDir)
        .filter(file => file.startsWith('face_') && file.endsWith('.json'));

      const stats = {
        totalFaces: faceFiles.length,
        activePersons: new Set(),
        totalSize: 0,
        oldestRegistration: null,
        newestRegistration: null
      };

      for (const faceFile of faceFiles) {
        const faceDataPath = path.join(this.faceDataDir, faceFile);
        const faceData = JSON.parse(fs.readFileSync(faceDataPath, 'utf8'));
        const fileStats = fs.statSync(faceDataPath);

        stats.activePersons.add(faceData.personaId);
        stats.totalSize += fileStats.size;

        const registrationDate = new Date(faceData.registeredAt);
        if (!stats.oldestRegistration || registrationDate < stats.oldestRegistration) {
          stats.oldestRegistration = registrationDate;
        }
        if (!stats.newestRegistration || registrationDate > stats.newestRegistration) {
          stats.newestRegistration = registrationDate;
        }
      }

      stats.uniquePersons = stats.activePersons.size;
      stats.averageFacesPerPerson = stats.uniquePersons > 0 ? (stats.totalFaces / stats.uniquePersons).toFixed(2) : 0;
      stats.totalSizeFormatted = this.formatBytes(stats.totalSize);

      return stats;

    } catch (error) {
      logger.error('Error obteniendo estadísticas faciales', error);
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

module.exports = new FacialRecognitionService();
