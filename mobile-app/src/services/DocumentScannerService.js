import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { Alert, PermissionsAndroid, Platform } from 'react-native';
import RNFS from 'react-native-fs';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';

/**
 * Servicio para escaneo y procesamiento de documentos
 */
class DocumentScannerService {

  /**
   * Opciones por defecto para la cámara
   */
  static defaultCameraOptions = {
    mediaType: 'photo',
    quality: 0.8,
    maxWidth: 1200,
    maxHeight: 1600,
    includeBase64: false,
    saveToPhotos: false,
  };

  /**
   * Opciones por defecto para OCR
   */
  static defaultOCROptions = {
    detectText: true,
    detectDocument: true,
    enhanceImage: true,
    extractData: {
      dni: true,
      passport: true,
      drivingLicense: true,
    },
  };

  /**
   * Solicitar permisos de cámara
   */
  static async requestCameraPermissions() {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Permiso de Cámara',
            message: 'UnionTech necesita acceso a la cámara para escanear documentos',
            buttonNeutral: 'Preguntar después',
            buttonNegative: 'Cancelar',
            buttonPositive: 'Permitir',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const result = await request(PERMISSIONS.IOS.CAMERA);
        return result === RESULTS.GRANTED;
      }
    } catch (error) {
      console.error('Error solicitando permisos de cámara:', error);
      return false;
    }
  }

  /**
   * Escanear documento usando la cámara
   */
  static async scanDocument(options = {}) {
    try {
      // Verificar permisos
      const hasPermission = await this.requestCameraPermissions();
      if (!hasPermission) {
        throw new Error('Permisos de cámara denegados');
      }

      const cameraOptions = { ...this.defaultCameraOptions, ...options.camera };

      return new Promise((resolve, reject) => {
        launchCamera(cameraOptions, (response) => {
          if (response.didCancel) {
            reject(new Error('Escaneo cancelado por el usuario'));
          } else if (response.errorMessage) {
            reject(new Error(`Error de cámara: ${response.errorMessage}`));
          } else if (response.assets && response.assets[0]) {
            const image = response.assets[0];
            this.processDocumentImage(image, options.processing)
              .then(resolve)
              .catch(reject);
          } else {
            reject(new Error('No se pudo capturar la imagen'));
          }
        });
      });
    } catch (error) {
      console.error('Error escaneando documento:', error);
      throw error;
    }
  }

  /**
   * Seleccionar documento desde galería
   */
  static async selectFromGallery(options = {}) {
    try {
      const libraryOptions = { ...this.defaultCameraOptions, ...options.camera };

      return new Promise((resolve, reject) => {
        launchImageLibrary(libraryOptions, (response) => {
          if (response.didCancel) {
            reject(new Error('Selección cancelada por el usuario'));
          } else if (response.errorMessage) {
            reject(new Error(`Error de galería: ${response.errorMessage}`));
          } else if (response.assets && response.assets[0]) {
            const image = response.assets[0];
            this.processDocumentImage(image, options.processing)
              .then(resolve)
              .catch(reject);
          } else {
            reject(new Error('No se pudo seleccionar la imagen'));
          }
        });
      });
    } catch (error) {
      console.error('Error seleccionando desde galería:', error);
      throw error;
    }
  }

  /**
   * Procesar imagen de documento
   */
  static async processDocumentImage(image, processingOptions = {}) {
    try {
      const options = { ...this.defaultOCROptions, ...processingOptions };

      // Información básica de la imagen
      const imageInfo = {
        uri: image.uri,
        fileName: image.fileName || `document_${Date.now()}.jpg`,
        fileSize: image.fileSize,
        width: image.width,
        height: image.height,
        type: image.type,
      };

      let result = {
        image: imageInfo,
        processed: false,
        text: null,
        documentData: null,
        confidence: 0,
      };

      // Mejorar imagen si está habilitado
      if (options.enhanceImage) {
        result.image = await this.enhanceImage(imageInfo);
      }

      // Detectar texto si está habilitado
      if (options.detectText) {
        result.text = await this.extractText(result.image);
        result.processed = true;
      }

      // Extraer datos específicos del documento
      if (options.extractData && result.text) {
        result.documentData = await this.extractDocumentData(result.text, options.extractData);
      }

      return result;
    } catch (error) {
      console.error('Error procesando imagen de documento:', error);
      throw error;
    }
  }

  /**
   * Mejorar calidad de imagen
   */
  static async enhanceImage(imageInfo) {
    try {
      // Aquí implementarías mejoras de imagen como:
      // - Ajuste de contraste
      // - Corrección de perspectiva
      // - Reducción de ruido
      // - Mejora de nitidez
      
      // Por ahora, retornamos la imagen original
      // En un proyecto real, usarías librerías como OpenCV o servicios cloud
      return imageInfo;
    } catch (error) {
      console.error('Error mejorando imagen:', error);
      return imageInfo;
    }
  }

  /**
   * Extraer texto de la imagen usando OCR
   */
  static async extractText(imageInfo) {
    try {
      // Simulación de OCR - En un proyecto real usarías:
      // - Google Vision API
      // - AWS Textract
      // - Azure Computer Vision
      // - Tesseract.js
      
      // Ejemplo de texto simulado para demostración
      const simulatedText = this.getSimulatedOCRText();
      
      return {
        fullText: simulatedText,
        confidence: 0.85,
        blocks: this.parseTextBlocks(simulatedText),
      };
    } catch (error) {
      console.error('Error extrayendo texto:', error);
      return null;
    }
  }

  /**
   * Extraer datos específicos del documento
   */
  static async extractDocumentData(textData, extractOptions) {
    try {
      const documentData = {};

      if (extractOptions.dni) {
        documentData.dni = this.extractDNIData(textData.fullText);
      }

      if (extractOptions.passport) {
        documentData.passport = this.extractPassportData(textData.fullText);
      }

      if (extractOptions.drivingLicense) {
        documentData.drivingLicense = this.extractDrivingLicenseData(textData.fullText);
      }

      // Determinar tipo de documento
      documentData.documentType = this.detectDocumentType(textData.fullText);
      documentData.confidence = this.calculateConfidence(documentData);

      return documentData;
    } catch (error) {
      console.error('Error extrayendo datos del documento:', error);
      return null;
    }
  }

  /**
   * Extraer datos de DNI
   */
  static extractDNIData(text) {
    try {
      const dniData = {};

      // Buscar número de DNI (8 dígitos)
      const dniPattern = /\b\d{8}\b/g;
      const dniMatch = text.match(dniPattern);
      if (dniMatch) {
        dniData.number = dniMatch[0];
      }

      // Buscar nombres (patrones comunes)
      const namePatterns = [
        /NOMBRES?\s*[:\-]?\s*([A-ZÁÉÍÓÚÑ\s]+)/i,
        /APELLIDOS?\s*[:\-]?\s*([A-ZÁÉÍÓÚÑ\s]+)/i,
      ];

      namePatterns.forEach(pattern => {
        const match = text.match(pattern);
        if (match) {
          if (pattern.source.includes('NOMBRE')) {
            dniData.firstName = match[1].trim();
          } else {
            dniData.lastName = match[1].trim();
          }
        }
      });

      // Buscar fecha de nacimiento
      const birthDatePattern = /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/g;
      const birthMatch = text.match(birthDatePattern);
      if (birthMatch) {
        dniData.birthDate = birthMatch[0];
      }

      // Buscar sexo
      const genderPattern = /(MASCULINO|FEMENINO|M|F)/i;
      const genderMatch = text.match(genderPattern);
      if (genderMatch) {
        dniData.gender = genderMatch[1];
      }

      return dniData;
    } catch (error) {
      console.error('Error extrayendo datos de DNI:', error);
      return {};
    }
  }

  /**
   * Extraer datos de pasaporte
   */
  static extractPassportData(text) {
    try {
      const passportData = {};

      // Buscar número de pasaporte
      const passportPattern = /[A-Z]{1,2}\d{6,9}/g;
      const passportMatch = text.match(passportPattern);
      if (passportMatch) {
        passportData.number = passportMatch[0];
      }

      // Buscar código de país
      const countryPattern = /[A-Z]{3}/g;
      const countryMatch = text.match(countryPattern);
      if (countryMatch) {
        passportData.countryCode = countryMatch[0];
      }

      // Buscar fecha de expiración
      const expiryPattern = /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/g;
      const expiryMatch = text.match(expiryPattern);
      if (expiryMatch && expiryMatch.length > 1) {
        passportData.expiryDate = expiryMatch[1]; // Segunda fecha suele ser expiración
      }

      return passportData;
    } catch (error) {
      console.error('Error extrayendo datos de pasaporte:', error);
      return {};
    }
  }

  /**
   * Extraer datos de licencia de conducir
   */
  static extractDrivingLicenseData(text) {
    try {
      const licenseData = {};

      // Buscar número de licencia
      const licensePattern = /[A-Z]\d{8,10}/g;
      const licenseMatch = text.match(licensePattern);
      if (licenseMatch) {
        licenseData.number = licenseMatch[0];
      }

      // Buscar clase de licencia
      const classPattern = /(CLASE\s*[A-Z]|CLASS\s*[A-Z])/i;
      const classMatch = text.match(classPattern);
      if (classMatch) {
        licenseData.class = classMatch[1];
      }

      return licenseData;
    } catch (error) {
      console.error('Error extrayendo datos de licencia:', error);
      return {};
    }
  }

  /**
   * Detectar tipo de documento
   */
  static detectDocumentType(text) {
    const dniKeywords = ['DNI', 'DOCUMENTO NACIONAL', 'IDENTIDAD'];
    const passportKeywords = ['PASSPORT', 'PASAPORTE'];
    const licenseKeywords = ['LICENCIA', 'LICENSE', 'CONDUCIR'];

    const textUpper = text.toUpperCase();

    if (dniKeywords.some(keyword => textUpper.includes(keyword))) {
      return 'DNI';
    } else if (passportKeywords.some(keyword => textUpper.includes(keyword))) {
      return 'PASSPORT';
    } else if (licenseKeywords.some(keyword => textUpper.includes(keyword))) {
      return 'DRIVING_LICENSE';
    }

    return 'UNKNOWN';
  }

  /**
   * Calcular confianza en la extracción
   */
  static calculateConfidence(documentData) {
    let confidence = 0;
    let totalFields = 0;

    Object.values(documentData).forEach(value => {
      if (typeof value === 'object' && value !== null) {
        Object.values(value).forEach(fieldValue => {
          totalFields++;
          if (fieldValue && fieldValue.toString().trim() !== '') {
            confidence++;
          }
        });
      }
    });

    return totalFields > 0 ? confidence / totalFields : 0;
  }

  /**
   * Parsear bloques de texto
   */
  static parseTextBlocks(text) {
    return text.split('\n').map((line, index) => ({
      id: index,
      text: line.trim(),
      confidence: Math.random() * 0.3 + 0.7, // Simulado
    })).filter(block => block.text.length > 0);
  }

  /**
   * Texto simulado para demostración
   */
  static getSimulatedOCRText() {
    return `REPÚBLICA DEL PERÚ
DOCUMENTO NACIONAL DE IDENTIDAD
DNI: 12345678
NOMBRES: JUAN CARLOS
APELLIDOS: PÉREZ GARCÍA
FECHA NACIMIENTO: 15/05/1990
SEXO: MASCULINO
ESTADO CIVIL: SOLTERO
DIRECCIÓN: AV. LIMA 123, LIMA`;
  }

  /**
   * Validar documento escaneado
   */
  static validateScannedDocument(documentData) {
    const validation = {
      isValid: false,
      errors: [],
      warnings: [],
    };

    if (!documentData.documentType || documentData.documentType === 'UNKNOWN') {
      validation.errors.push('No se pudo determinar el tipo de documento');
    }

    if (documentData.confidence < 0.5) {
      validation.warnings.push('La calidad del escaneo es baja, intenta nuevamente');
    }

    // Validaciones específicas por tipo de documento
    if (documentData.documentType === 'DNI' && documentData.dni) {
      if (!documentData.dni.number || documentData.dni.number.length !== 8) {
        validation.errors.push('Número de DNI inválido');
      }
      
      if (!documentData.dni.firstName || !documentData.dni.lastName) {
        validation.errors.push('Nombre o apellido no detectado');
      }
    }

    validation.isValid = validation.errors.length === 0;
    return validation;
  }

  /**
   * Mostrar opciones de escaneo al usuario
   */
  static showScanOptions() {
    return new Promise((resolve, reject) => {
      Alert.alert(
        'Escanear Documento',
        'Selecciona una opción para escanear el documento',
        [
          { text: 'Cancelar', style: 'cancel', onPress: () => reject(new Error('Cancelado')) },
          { 
            text: 'Cámara', 
            onPress: () => this.scanDocument().then(resolve).catch(reject)
          },
          { 
            text: 'Galería', 
            onPress: () => this.selectFromGallery().then(resolve).catch(reject)
          },
        ]
      );
    });
  }

  /**
   * Guardar imagen escaneada
   */
  static async saveScannedImage(imageInfo, filename = null) {
    try {
      const fileName = filename || `scanned_${Date.now()}.jpg`;
      const destPath = `${RNFS.DocumentDirectoryPath}/scanned_documents/${fileName}`;
      
      // Crear directorio si no existe
      await RNFS.mkdir(`${RNFS.DocumentDirectoryPath}/scanned_documents`);
      
      // Copiar imagen
      await RNFS.copyFile(imageInfo.uri, destPath);
      
      return {
        success: true,
        path: destPath,
        filename: fileName,
      };
    } catch (error) {
      console.error('Error guardando imagen escaneada:', error);
      throw error;
    }
  }
}

export default DocumentScannerService;
