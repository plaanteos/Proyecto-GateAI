/**
 * 🔐 Controlador de Verificación Biométrica - UnionTech Security
 * Sistema de dos fases: Registro completo + Reconocimiento rápido
 */

const biometricService = require('../services/biometricService');
const { validationResult } = require('express-validator');

class BiometricController {
    /**
     * 📋 FASE 1: Registro y verificación biométrica completa
     * POST /api/biometric/register
     */
    async registerBiometric(req, res) {
        try {
            // Validar errores de entrada
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos de entrada inválidos',
                    errors: errors.array()
                });
            }

            const {
                userId,
                dni,
                faceImage,
                documentImage,
                personalInfo
            } = req.body;

            console.log(`🔍 [BIOMETRIC] Iniciando registro biométrico para usuario: ${userId}`);

            // Verificar que el usuario esté autenticado
            if (req.user && req.user.id !== userId && req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para registrar esta identidad biométrica'
                });
            }

            // Procesar registro biométrico
            const result = await biometricService.registerBiometricIdentity({
                userId,
                dni,
                faceImage,
                documentImage,
                personalInfo
            });

            if (result.success) {
                console.log(`✅ [BIOMETRIC] Registro exitoso para usuario: ${userId}`);
                
                // Log de auditoría
                req.auditLog?.({
                    action: 'biometric_registration',
                    userId: userId,
                    details: {
                        step: 'complete',
                        biometricHash: result.biometricHash,
                        verificationLevel: result.verificationLevel
                    },
                    ip: req.ip,
                    userAgent: req.get('User-Agent')
                });

                return res.status(201).json({
                    success: true,
                    message: 'Identidad biométrica registrada exitosamente',
                    data: {
                        userId: result.userId,
                        biometricHash: result.biometricHash,
                        verificationLevel: result.verificationLevel,
                        nextStep: 'Ahora puedes usar reconocimiento rápido para accesos'
                    }
                });
            } else {
                console.log(`❌ [BIOMETRIC] Error en registro - ${result.step}: ${result.message}`);
                
                return res.status(400).json({
                    success: false,
                    message: result.message,
                    step: result.step,
                    details: result.details
                });
            }

        } catch (error) {
            console.error('❌ [BIOMETRIC] Error en registerBiometric:', error);
            
            return res.status(500).json({
                success: false,
                message: 'Error interno en el registro biométrico',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * ⚡ FASE 2: Reconocimiento biométrico rápido (para seguridad/admin)
     * POST /api/biometric/recognize
     */
    async quickRecognition(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos de entrada inválidos',
                    errors: errors.array()
                });
            }

            const {
                image,
                scanType, // 'face' | 'document' | 'both'
                requestedAccess, // 'visitor' | 'employee' | 'security' | 'admin'
                location
            } = req.body;

            console.log(`⚡ [BIOMETRIC] Reconocimiento rápido - Tipo: ${scanType}, Ubicación: ${location}`);

            // Verificar permisos (solo security y admin pueden hacer reconocimiento)
            if (!req.user || !['security', 'admin'].includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Solo personal de seguridad y administradores pueden realizar reconocimiento biométrico'
                });
            }

            // Procesar reconocimiento
            const result = await biometricService.quickBiometricRecognition({
                image,
                scanType,
                requestedAccess: requestedAccess || 'visitor',
                location: location || 'unknown',
                operatorId: req.user.id
            });

            if (result.success) {
                console.log(`✅ [BIOMETRIC] Reconocimiento exitoso - Usuario: ${result.userId}, Confianza: ${(result.confidence * 100).toFixed(2)}%`);
                
                // Log de auditoría crítica
                req.auditLog?.({
                    action: 'biometric_recognition',
                    userId: result.userId,
                    operatorId: req.user.id,
                    details: {
                        scanType: result.scanType,
                        confidence: result.confidence,
                        accessGranted: result.accessGranted,
                        accessLevel: result.accessLevel,
                        location: location
                    },
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    critical: true
                });

                return res.status(200).json({
                    success: true,
                    message: result.message,
                    data: {
                        userId: result.userId,
                        userInfo: result.userInfo,
                        confidence: Math.round(result.confidence * 100), // Porcentaje
                        accessGranted: result.accessGranted,
                        accessLevel: result.accessLevel,
                        scanType: result.scanType,
                        timestamp: new Date().toISOString()
                    }
                });
            } else {
                console.log(`❌ [BIOMETRIC] Reconocimiento fallido: ${result.message}`);
                
                // Log de intento fallido
                req.auditLog?.({
                    action: 'biometric_recognition_failed',
                    operatorId: req.user.id,
                    details: {
                        scanType: scanType,
                        confidence: result.confidence || 0,
                        reason: result.message,
                        location: location
                    },
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    critical: true
                });

                return res.status(200).json({
                    success: false,
                    message: result.message,
                    data: {
                        accessGranted: false,
                        confidence: Math.round((result.confidence || 0) * 100),
                        scanType: scanType,
                        timestamp: new Date().toISOString()
                    }
                });
            }

        } catch (error) {
            console.error('❌ [BIOMETRIC] Error en quickRecognition:', error);
            
            return res.status(500).json({
                success: false,
                message: 'Error interno en el reconocimiento biométrico',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * 📊 Obtener estadísticas biométricas
     * GET /api/biometric/stats
     */
    async getBiometricStats(req, res) {
        try {
            // Solo admin puede ver estadísticas completas
            if (!req.user || req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Solo administradores pueden ver estadísticas biométricas'
                });
            }

            const stats = await biometricService.getBiometricStats();

            return res.status(200).json({
                success: true,
                message: 'Estadísticas biométricas obtenidas',
                data: {
                    ...stats,
                    lastUpdate: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('❌ [BIOMETRIC] Error obteniendo estadísticas:', error);
            
            return res.status(500).json({
                success: false,
                message: 'Error obteniendo estadísticas biométricas',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * 👤 Obtener información de usuario verificado
     * GET /api/biometric/user/:userId
     */
    async getVerifiedUser(req, res) {
        try {
            const { userId } = req.params;

            // Verificar permisos
            if (!req.user || (req.user.id !== userId && !['security', 'admin'].includes(req.user.role))) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para ver esta información'
                });
            }

            const verifiedUsers = await biometricService.getVerifiedUsers();
            const user = verifiedUsers.find(u => u.userId === userId);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado en la base de datos biométrica'
                });
            }

            // Datos seguros (sin hash biométrico)
            const safeUserData = {
                userId: user.userId,
                dni: user.dni,
                personalInfo: user.personalInfo,
                verificationDate: user.verificationDate,
                status: user.status,
                verificationLevel: user.verificationLevel,
                accessLevel: user.accessLevel
            };

            return res.status(200).json({
                success: true,
                message: 'Usuario verificado encontrado',
                data: safeUserData
            });

        } catch (error) {
            console.error('❌ [BIOMETRIC] Error obteniendo usuario:', error);
            
            return res.status(500).json({
                success: false,
                message: 'Error obteniendo información del usuario',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * 🗑️ Eliminar datos biométricos (solo admin)
     * DELETE /api/biometric/user/:userId
     */
    async deleteBiometricData(req, res) {
        try {
            const { userId } = req.params;

            // Solo admin puede eliminar datos biométricos
            if (!req.user || req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Solo administradores pueden eliminar datos biométricos'
                });
            }

            const verifiedUsers = await biometricService.getVerifiedUsers();
            const userIndex = verifiedUsers.findIndex(u => u.userId === userId);

            if (userIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado en la base de datos biométrica'
                });
            }

            // Eliminar usuario de la lista
            const deletedUser = verifiedUsers.splice(userIndex, 1)[0];

            // Guardar lista actualizada
            biometricService.saveVerifiedUser = async function(updatedList) {
                const fs = require('fs').promises;
                const path = require('path');
                const verifiedUsersFile = path.join(process.cwd(), 'data', 'verified-users.json');
                await fs.writeFile(verifiedUsersFile, JSON.stringify(updatedList, null, 2));
            };
            
            await biometricService.saveVerifiedUser(verifiedUsers);

            // Log de auditoría crítica
            req.auditLog?.({
                action: 'biometric_data_deletion',
                targetUserId: userId,
                operatorId: req.user.id,
                details: {
                    deletedUserInfo: {
                        dni: deletedUser.dni,
                        verificationDate: deletedUser.verificationDate,
                        accessLevel: deletedUser.accessLevel
                    }
                },
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                critical: true
            });

            console.log(`🗑️ [BIOMETRIC] Datos biométricos eliminados para usuario: ${userId}`);

            return res.status(200).json({
                success: true,
                message: 'Datos biométricos eliminados exitosamente',
                data: {
                    deletedUserId: userId,
                    deletionDate: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('❌ [BIOMETRIC] Error eliminando datos:', error);
            
            return res.status(500).json({
                success: false,
                message: 'Error eliminando datos biométricos',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
}

module.exports = new BiometricController();
