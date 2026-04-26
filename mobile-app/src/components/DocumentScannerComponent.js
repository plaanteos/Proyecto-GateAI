import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DocumentScannerService from '../services/DocumentScannerService';

const DocumentScannerComponent = ({ 
  visible, 
  onClose, 
  onDocumentScanned, 
  title = 'Escanear Documento',
  allowedTypes = ['DNI', 'PASSPORT', 'DRIVING_LICENSE'] 
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedImage, setScannedImage] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [scanStep, setScanStep] = useState('capture'); // 'capture', 'preview', 'confirm'

  const handleScanDocument = async (source = 'camera') => {
    try {
      setIsScanning(true);

      let result;
      if (source === 'camera') {
        result = await DocumentScannerService.scanDocument({
          processing: {
            detectText: true,
            extractData: {
              dni: allowedTypes.includes('DNI'),
              passport: allowedTypes.includes('PASSPORT'),
              drivingLicense: allowedTypes.includes('DRIVING_LICENSE'),
            },
          },
        });
      } else {
        result = await DocumentScannerService.selectFromGallery({
          processing: {
            detectText: true,
            extractData: {
              dni: allowedTypes.includes('DNI'),
              passport: allowedTypes.includes('PASSPORT'),
              drivingLicense: allowedTypes.includes('DRIVING_LICENSE'),
            },
          },
        });
      }

      setScannedImage(result.image);
      setExtractedData(result);
      setScanStep('preview');
    } catch (error) {
      Alert.alert('Error', error.message || 'Error al escanear el documento');
    } finally {
      setIsScanning(false);
    }
  };

  const handleConfirmDocument = () => {
    if (!extractedData) {
      Alert.alert('Error', 'No hay datos extraídos del documento');
      return;
    }

    // Validar documento
    const validation = DocumentScannerService.validateScannedDocument(extractedData.documentData);
    
    if (!validation.isValid) {
      Alert.alert(
        'Documento Inválido',
        `Se encontraron los siguientes errores:\n${validation.errors.join('\n')}`,
        [
          { text: 'Reintentar', onPress: () => setScanStep('capture') },
          { text: 'Continuar Anyway', onPress: () => confirmWithWarnings() },
        ]
      );
      return;
    }

    if (validation.warnings.length > 0) {
      Alert.alert(
        'Advertencias',
        `${validation.warnings.join('\n')}\n\n¿Deseas continuar?`,
        [
          { text: 'Reintentar', style: 'cancel', onPress: () => setScanStep('capture') },
          { text: 'Continuar', onPress: () => confirmWithWarnings() },
        ]
      );
      return;
    }

    confirmWithWarnings();
  };

  const confirmWithWarnings = () => {
    setScanStep('confirm');
    
    // Preparar datos para el callback
    const documentInfo = prepareDocumentInfo();
    
    // Llamar al callback del padre
    onDocumentScanned(documentInfo);
    
    // Cerrar modal
    handleClose();
  };

  const prepareDocumentInfo = () => {
    const { documentData, text, image } = extractedData;
    const docType = documentData?.documentType || 'UNKNOWN';

    let preparedData = {
      documentType: docType,
      image: image,
      confidence: documentData?.confidence || 0,
      rawText: text?.fullText || '',
    };

    // Agregar datos específicos según el tipo de documento
    if (docType === 'DNI' && documentData.dni) {
      preparedData = {
        ...preparedData,
        documentNumber: documentData.dni.number,
        firstName: documentData.dni.firstName,
        lastName: documentData.dni.lastName,
        birthDate: documentData.dni.birthDate,
        gender: documentData.dni.gender,
      };
    } else if (docType === 'PASSPORT' && documentData.passport) {
      preparedData = {
        ...preparedData,
        documentNumber: documentData.passport.number,
        countryCode: documentData.passport.countryCode,
        expiryDate: documentData.passport.expiryDate,
      };
    } else if (docType === 'DRIVING_LICENSE' && documentData.drivingLicense) {
      preparedData = {
        ...preparedData,
        documentNumber: documentData.drivingLicense.number,
        licenseClass: documentData.drivingLicense.class,
      };
    }

    return preparedData;
  };

  const handleClose = () => {
    setScannedImage(null);
    setExtractedData(null);
    setScanStep('capture');
    setIsScanning(false);
    onClose();
  };

  const renderCaptureStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Icon name="document-scanner" size={80} color="#007AFF" />
      </View>
      
      <Text style={styles.stepTitle}>Escanear Documento</Text>
      <Text style={styles.stepDescription}>
        Toma una foto clara del documento o selecciona una imagen de tu galería
      </Text>

      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[styles.optionButton, styles.cameraButton]}
          onPress={() => handleScanDocument('camera')}
          disabled={isScanning}
        >
          <Icon name="camera-alt" size={24} color="#fff" />
          <Text style={styles.optionButtonText}>Usar Cámara</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionButton, styles.galleryButton]}
          onPress={() => handleScanDocument('gallery')}
          disabled={isScanning}
        >
          <Icon name="photo-library" size={24} color="#007AFF" />
          <Text style={[styles.optionButtonText, { color: '#007AFF' }]}>
            Desde Galería
          </Text>
        </TouchableOpacity>
      </View>

      {isScanning && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Procesando documento...</Text>
        </View>
      )}

      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>💡 Consejos para mejor resultado:</Text>
        <Text style={styles.tipText}>• Asegúrate de que haya buena iluminación</Text>
        <Text style={styles.tipText}>• Mantén el documento plano y sin reflejos</Text>
        <Text style={styles.tipText}>• Centra todo el documento en la imagen</Text>
        <Text style={styles.tipText}>• Usa un fondo contrastante</Text>
      </View>
    </View>
  );

  const renderPreviewStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Vista Previa</Text>
      <Text style={styles.stepDescription}>
        Verifica que la información extraída sea correcta
      </Text>

      {scannedImage && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: scannedImage.uri }} style={styles.previewImage} />
        </View>
      )}

      <ScrollView style={styles.dataContainer} showsVerticalScrollIndicator={false}>
        {extractedData?.documentData && (
          <View style={styles.extractedDataContainer}>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Tipo de Documento:</Text>
              <Text style={styles.dataValue}>
                {extractedData.documentData.documentType || 'No detectado'}
              </Text>
            </View>

            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Confianza:</Text>
              <Text style={[
                styles.dataValue,
                { color: extractedData.documentData.confidence > 0.7 ? '#34C759' : '#FF9500' }
              ]}>
                {Math.round((extractedData.documentData.confidence || 0) * 100)}%
              </Text>
            </View>

            {/* Mostrar datos específicos según el tipo */}
            {extractedData.documentData.dni && (
              <>
                <Text style={styles.sectionTitle}>Datos del DNI:</Text>
                {extractedData.documentData.dni.number && (
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Número:</Text>
                    <Text style={styles.dataValue}>{extractedData.documentData.dni.number}</Text>
                  </View>
                )}
                {extractedData.documentData.dni.firstName && (
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Nombres:</Text>
                    <Text style={styles.dataValue}>{extractedData.documentData.dni.firstName}</Text>
                  </View>
                )}
                {extractedData.documentData.dni.lastName && (
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Apellidos:</Text>
                    <Text style={styles.dataValue}>{extractedData.documentData.dni.lastName}</Text>
                  </View>
                )}
                {extractedData.documentData.dni.birthDate && (
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Fecha de Nacimiento:</Text>
                    <Text style={styles.dataValue}>{extractedData.documentData.dni.birthDate}</Text>
                  </View>
                )}
              </>
            )}

            {extractedData.documentData.passport && (
              <>
                <Text style={styles.sectionTitle}>Datos del Pasaporte:</Text>
                {extractedData.documentData.passport.number && (
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Número:</Text>
                    <Text style={styles.dataValue}>{extractedData.documentData.passport.number}</Text>
                  </View>
                )}
                {extractedData.documentData.passport.countryCode && (
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>País:</Text>
                    <Text style={styles.dataValue}>{extractedData.documentData.passport.countryCode}</Text>
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {extractedData?.text && (
          <View style={styles.rawTextContainer}>
            <Text style={styles.sectionTitle}>Texto Detectado:</Text>
            <Text style={styles.rawText}>{extractedData.text.fullText}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.retryButton]}
          onPress={() => setScanStep('capture')}
        >
          <Icon name="refresh" size={20} color="#FF9500" />
          <Text style={[styles.actionButtonText, { color: '#FF9500' }]}>
            Reintentar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.confirmButton]}
          onPress={handleConfirmDocument}
        >
          <Icon name="check" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Confirmar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderConfirmStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Icon name="check-circle" size={80} color="#34C759" />
      </View>
      
      <Text style={styles.stepTitle}>¡Documento Procesado!</Text>
      <Text style={styles.stepDescription}>
        El documento se ha procesado correctamente y los datos han sido extraídos.
      </Text>

      <View style={styles.successContainer}>
        <Text style={styles.successText}>
          Los datos del documento se han agregado automáticamente al formulario.
        </Text>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
          >
            <Icon name="close" size={24} color="#000" />
          </TouchableOpacity>
          
          <Text style={styles.modalTitle}>{title}</Text>
          
          <View style={styles.stepIndicator}>
            <View style={[
              styles.stepDot,
              scanStep === 'capture' && styles.activeStepDot
            ]} />
            <View style={[
              styles.stepDot,
              scanStep === 'preview' && styles.activeStepDot
            ]} />
            <View style={[
              styles.stepDot,
              scanStep === 'confirm' && styles.activeStepDot
            ]} />
          </View>
        </View>

        <View style={styles.modalContent}>
          {scanStep === 'capture' && renderCaptureStep()}
          {scanStep === 'preview' && renderPreviewStep()}
          {scanStep === 'confirm' && renderConfirmStep()}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 4,
  },
  activeStepDot: {
    backgroundColor: '#007AFF',
  },
  modalContent: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    padding: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  optionsContainer: {
    gap: 16,
    marginBottom: 32,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 12,
  },
  cameraButton: {
    backgroundColor: '#007AFF',
  },
  galleryButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  optionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 12,
    marginVertical: 24,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  tipsContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginTop: 'auto',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 4,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  previewImage: {
    width: 200,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  dataContainer: {
    flex: 1,
    marginBottom: 24,
  },
  extractedDataContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
    marginTop: 8,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dataLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  dataValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    flex: 2,
    textAlign: 'right',
  },
  rawTextContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
  },
  rawText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    fontFamily: 'monospace',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  retryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FF9500',
  },
  confirmButton: {
    backgroundColor: '#34C759',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  successContainer: {
    backgroundColor: '#e8f5e8',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  successText: {
    fontSize: 16,
    color: '#34C759',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default DocumentScannerComponent;
