/**
 * 🔐 Servicio de Verificación Biométrica - UnionTech Security
 * Sistema de dos fases: Verificación completa + Reconocimiento rápido
 * Similar a MercadoLibre KYC + acceso rápido
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class BiometricService {
    constructor() {
        this.facesDir = path.join(process.cwd(), 'data', 'faces');
        this.documentsDir = path.join(process.cwd(), 'data', 'documents');
        this.verifiedUsersFile = path.join(process.cwd(), 'data', 'verified-users.json');
        
        this.initializeDirectories();
    }

    async initializeDirectories() {
        try {
            await fs.mkdir(this.facesDir, { recursive: true });
            await fs.mkdir(this.documentsDir, { recursive: true });
            
            // Crear archivo de usuarios verificados si no existe
            try {
                await fs.access(this.verifiedUsersFile);
            } catch {
                await fs.writeFile(this.verifiedUsersFile, JSON.stringify([], null, 2));
            }
        } catch (error) {
            console.error('❌ Error inicializando directorios biométricos:', error);
        }
    }

    /**
     * 📋 FASE 1: VERIFICACIÓN COMPLETA (Como MercadoLibre)
     * El usuario debe registrar su identidad completa una sola vez
     */
    async registerBiometricIdentity(userData) {
        try {
            console.log('🔍 Iniciando verificación biométrica completa...');
            
            const {
                userId,
                dni,
                faceImage,
                documentImage,
                personalInfo
            } = userData;

            // 1. Validar DNI con documento
            const dniValidation = await this.validateDNIWithDocument(dni, documentImage);
            if (!dniValidation.isValid) {
                return {
                    success: false,
                    step: 'dni_validation',
                    message: 'DNI no coincide con el documento presentado',
                    details: dniValidation.details
                };
            }

            // 2. Procesar y validar imagen facial
            const faceValidation = await this.processFaceImage(faceImage, userId);
            if (!faceValidation.isValid) {
                return {
                    success: false,
                    step: 'face_validation',
                    message: 'La imagen facial no cumple con los estándares de calidad',
                    details: faceValidation.details
                };
            }

            // 3. Verificar que el rostro coincide con la foto del DNI
            const faceDocumentMatch = await this.compareFaceWithDNI(faceImage, documentImage);
            if (!faceDocumentMatch.isMatch) {
                return {
                    success: false,
                    step: 'face_document_match',
                    message: 'El rostro no coincide con la foto del documento',
                    confidence: faceDocumentMatch.confidence
                };
            }

            // 4. Generar hash biométrico único
            const biometricHash = await this.generateBiometricHash(faceImage, dni);

            // 5. Guardar datos verificados
            const verificationRecord = {
                userId,
                dni,
                biometricHash,
                faceFeatures: faceValidation.features,
                documentHash: this.generateDocumentHash(documentImage),
                personalInfo: {
                    firstName: personalInfo.firstName,
                    lastName: personalInfo.lastName,
                    birthDate: personalInfo.birthDate
                },
                verificationDate: new Date().toISOString(),
                status: 'verified',
                verificationLevel: 'complete', // complete | partial
                accessLevel: personalInfo.accessLevel || 'visitor'
            };

            // 6. Guardar en base de datos de usuarios verificados
            await this.saveVerifiedUser(verificationRecord);

            // 7. Guardar archivos biométricos encriptados
            await this.saveBiometricFiles(userId, faceImage, documentImage);

            console.log('✅ Verificación biométrica completa exitosa');
            
            return {
                success: true,
                userId,
                biometricHash,
                message: 'Identidad verificada completamente. Ahora puede usar reconocimiento rápido.',
                verificationLevel: 'complete'
            };

        } catch (error) {
            console.error('❌ Error en verificación biométrica:', error);
            return {
                success: false,
                message: 'Error interno en la verificación biométrica',
                error: error.message
            };
        }
    }

    /**
     * ⚡ FASE 2: RECONOCIMIENTO RÁPIDO (Para admin/seguridad)
     * Solo escaneo y reconocimiento instantáneo
     */
    async quickBiometricRecognition(scanData) {
        try {
            console.log('⚡ Iniciando reconocimiento biométrico rápido...');
            
            const { image, scanType } = scanData; // scanType: 'face' | 'document' | 'both'
            
            // 1. Obtener usuarios verificados
            const verifiedUsers = await this.getVerifiedUsers();
            
            let recognitionResults = [];

            if (scanType === 'face' || scanType === 'both') {
                // Reconocimiento facial
                const faceResults = await this.recognizeFace(image, verifiedUsers);
                recognitionResults.push(...faceResults);
            }

            if (scanType === 'document' || scanType === 'both') {
                // Reconocimiento de documento
                const docResults = await this.recognizeDocument(image, verifiedUsers);
                recognitionResults.push(...docResults);
            }

            // 2. Filtrar y ordenar por confianza
            const matches = recognitionResults
                .filter(result => result.confidence > 0.8) // Umbral mínimo de confianza
                .sort((a, b) => b.confidence - a.confidence);

            if (matches.length === 0) {
                return {
                    success: false,
                    message: 'No se encontraron coincidencias biométricas',
                    confidence: 0,
                    accessGranted: false
                };
            }

            const bestMatch = matches[0];
            
            // 3. Validar nivel de acceso
            const accessValidation = await this.validateAccessLevel(bestMatch.userId, scanData.requestedAccess);
            
            // 4. Registrar evento de acceso
            await this.logAccessEvent({
                userId: bestMatch.userId,
                scanType,
                confidence: bestMatch.confidence,
                accessGranted: accessValidation.granted,
                timestamp: new Date().toISOString(),
                location: scanData.location || 'unknown'
            });

            console.log(`✅ Reconocimiento completado - Usuario: ${bestMatch.userId}, Confianza: ${bestMatch.confidence}%`);

            return {
                success: true,
                userId: bestMatch.userId,
                userInfo: bestMatch.userInfo,
                confidence: bestMatch.confidence,
                accessGranted: accessValidation.granted,
                accessLevel: bestMatch.accessLevel,
                message: accessValidation.granted ? 'Acceso autorizado' : 'Acceso denegado - Permisos insuficientes',
                scanType: bestMatch.scanType
            };

        } catch (error) {
            console.error('❌ Error en reconocimiento rápido:', error);
            return {
                success: false,
                message: 'Error en el reconocimiento biométrico',
                error: error.message,
                accessGranted: false
            };
        }
    }

    /**
     * 🔍 Validar DNI con documento físico/digital
     */
    async validateDNIWithDocument(dni, documentImage) {
        try {
            // Simular validación de DNI (en producción usar OCR real)
            const extractedDNI = await this.extractDNIFromDocument(documentImage);
            
            return {
                isValid: extractedDNI === dni,
                extractedDNI,
                confidence: 0.95,
                details: {
                    ocrSuccess: true,
                    documentType: 'DNI',
                    quality: 'high'
                }
            };
        } catch (error) {
            return {
                isValid: false,
                details: { error: error.message }
            };
        }
    }

    /**
     * 🖼️ Procesar imagen facial y extraer características
     */
    async processFaceImage(faceImage, userId) {
        try {
            // Simular procesamiento facial (en producción usar Face API real)
            const features = await this.extractFaceFeatures(faceImage);
            
            return {
                isValid: features.faceDetected,
                features: features.encodings,
                quality: features.quality,
                details: {
                    faceCount: features.faceCount,
                    quality: features.quality,
                    landmarks: features.landmarks
                }
            };
        } catch (error) {
            return {
                isValid: false,
                details: { error: error.message }
            };
        }
    }

    /**
     * 👥 Comparar rostro con foto del DNI
     */
    async compareFaceWithDNI(faceImage, documentImage) {
        try {
            // Simular comparación facial (en producción usar algoritmo real)
            const similarity = Math.random() * 0.3 + 0.7; // Simular alta similitud
            
            return {
                isMatch: similarity > 0.75,
                confidence: similarity,
                threshold: 0.75
            };
        } catch (error) {
            return {
                isMatch: false,
                confidence: 0,
                error: error.message
            };
        }
    }

    /**
     * 🔑 Generar hash biométrico único
     */
    async generateBiometricHash(faceImage, dni) {
        const data = `${faceImage.substring(0, 100)}${dni}${Date.now()}`;
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    /**
     * 📄 Generar hash del documento
     */
    generateDocumentHash(documentImage) {
        return crypto.createHash('md5').update(documentImage).digest('hex');
    }

    /**
     * 💾 Guardar usuario verificado
     */
    async saveVerifiedUser(verificationRecord) {
        try {
            const verifiedUsers = await this.getVerifiedUsers();
            
            // Verificar si ya existe
            const existingIndex = verifiedUsers.findIndex(u => u.userId === verificationRecord.userId);
            
            if (existingIndex >= 0) {
                verifiedUsers[existingIndex] = verificationRecord;
            } else {
                verifiedUsers.push(verificationRecord);
            }
            
            await fs.writeFile(this.verifiedUsersFile, JSON.stringify(verifiedUsers, null, 2));
        } catch (error) {
            console.error('❌ Error guardando usuario verificado:', error);
            throw error;
        }
    }

    /**
     * 📁 Guardar archivos biométricos encriptados
     */
    async saveBiometricFiles(userId, faceImage, documentImage) {
        try {
            const faceFileName = `${userId}_face_${Date.now()}.enc`;
            const docFileName = `${userId}_doc_${Date.now()}.enc`;
            
            // Encriptar y guardar (simulado)
            await fs.writeFile(
                path.join(this.facesDir, faceFileName),
                Buffer.from(faceImage, 'base64')
            );
            
            await fs.writeFile(
                path.join(this.documentsDir, docFileName),
                Buffer.from(documentImage, 'base64')
            );
            
        } catch (error) {
            console.error('❌ Error guardando archivos biométricos:', error);
            throw error;
        }
    }

    /**
     * 👤 Obtener usuarios verificados
     */
    async getVerifiedUsers() {
        try {
            const data = await fs.readFile(this.verifiedUsersFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return [];
        }
    }

    /**
     * 🔍 Reconocer rostro en imagen
     */
    async recognizeFace(image, verifiedUsers) {
        try {
            const results = [];
            
            for (const user of verifiedUsers) {
                // Simular reconocimiento facial
                const similarity = Math.random() * 0.4 + 0.6; // Simular similitud variable
                
                if (similarity > 0.8) {
                    results.push({
                        userId: user.userId,
                        userInfo: {
                            firstName: user.personalInfo.firstName,
                            lastName: user.personalInfo.lastName,
                            dni: user.dni
                        },
                        confidence: similarity,
                        scanType: 'face',
                        accessLevel: user.accessLevel
                    });
                }
            }
            
            return results;
        } catch (error) {
            console.error('❌ Error en reconocimiento facial:', error);
            return [];
        }
    }

    /**
     * 📄 Reconocer documento en imagen
     */
    async recognizeDocument(image, verifiedUsers) {
        try {
            const results = [];
            const extractedDNI = await this.extractDNIFromDocument(image);
            
            for (const user of verifiedUsers) {
                if (user.dni === extractedDNI) {
                    results.push({
                        userId: user.userId,
                        userInfo: {
                            firstName: user.personalInfo.firstName,
                            lastName: user.personalInfo.lastName,
                            dni: user.dni
                        },
                        confidence: 0.95,
                        scanType: 'document',
                        accessLevel: user.accessLevel
                    });
                }
            }
            
            return results;
        } catch (error) {
            console.error('❌ Error en reconocimiento de documento:', error);
            return [];
        }
    }

    /**
     * 🔐 Validar nivel de acceso
     */
    async validateAccessLevel(userId, requestedAccess) {
        try {
            const verifiedUsers = await this.getVerifiedUsers();
            const user = verifiedUsers.find(u => u.userId === userId);
            
            if (!user) {
                return { granted: false, reason: 'Usuario no encontrado' };
            }

            const accessLevels = {
                'visitor': 1,
                'employee': 2,
                'security': 3,
                'admin': 4
            };

            const userLevel = accessLevels[user.accessLevel] || 0;
            const requiredLevel = accessLevels[requestedAccess] || 1;

            return {
                granted: userLevel >= requiredLevel,
                userLevel: user.accessLevel,
                requiredLevel: requestedAccess,
                reason: userLevel >= requiredLevel ? 'Acceso autorizado' : 'Nivel de acceso insuficiente'
            };
        } catch (error) {
            return { granted: false, reason: 'Error validando acceso' };
        }
    }

    /**
     * 📊 Registrar evento de acceso
     */
    async logAccessEvent(eventData) {
        try {
            const logFile = path.join(process.cwd(), 'logs', `biometric-access-${new Date().toISOString().split('T')[0]}.log`);
            const logEntry = `${new Date().toISOString()} - ${JSON.stringify(eventData)}\n`;
            
            await fs.appendFile(logFile, logEntry);
        } catch (error) {
            console.error('❌ Error registrando evento de acceso:', error);
        }
    }

    /**
     * 🔍 Extraer DNI del documento (simulado)
     */
    async extractDNIFromDocument(documentImage) {
        // Simular OCR del DNI
        const sampleDNIs = ['12345678', '87654321', '11111111', '22222222'];
        return sampleDNIs[Math.floor(Math.random() * sampleDNIs.length)];
    }

    /**
     * 🖼️ Extraer características faciales (simulado)
     */
    async extractFaceFeatures(faceImage) {
        return {
            faceDetected: true,
            faceCount: 1,
            quality: 'high',
            encodings: Array.from({length: 128}, () => Math.random()), // Simular encoding facial
            landmarks: {
                eyes: [[100, 120], [150, 120]],
                nose: [125, 140],
                mouth: [125, 160]
            }
        };
    }

    /**
     * 📈 Obtener estadísticas biométricas
     */
    async getBiometricStats() {
        try {
            const verifiedUsers = await this.getVerifiedUsers();
            
            return {
                totalVerifiedUsers: verifiedUsers.length,
                verificationsByLevel: {
                    visitor: verifiedUsers.filter(u => u.accessLevel === 'visitor').length,
                    employee: verifiedUsers.filter(u => u.accessLevel === 'employee').length,
                    security: verifiedUsers.filter(u => u.accessLevel === 'security').length,
                    admin: verifiedUsers.filter(u => u.accessLevel === 'admin').length
                },
                recentVerifications: verifiedUsers
                    .filter(u => new Date(u.verificationDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
                    .length
            };
        } catch (error) {
            console.error('❌ Error obteniendo estadísticas:', error);
            return {};
        }
    }
}

module.exports = new BiometricService();
