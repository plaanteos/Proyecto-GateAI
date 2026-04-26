/**
 * 🔐 Rutas de Verificación Biométrica - UnionTech Security
 * Sistema de dos fases: Verificación completa + Reconocimiento rápido
 */

const express = require('express');
const { body, param } = require('express-validator');
const biometricController = require('../controllers/biometricController');
const authMiddleware = require('../middleware/auth-demo');

const router = express.Router();

// Middleware de autenticación para todas las rutas
router.use(authMiddleware.auth());

/**
 * 📋 FASE 1: Registro y verificación biométrica completa
 * Similar al proceso KYC de MercadoLibre
 */
router.post('/register', [
    body('userId')
        .notEmpty()
        .withMessage('ID de usuario es requerido')
        .isLength({ min: 3, max: 50 })
        .withMessage('ID de usuario debe tener entre 3 y 50 caracteres'),
    
    body('dni')
        .notEmpty()
        .withMessage('DNI es requerido')
        .isLength({ min: 7, max: 8 })
        .withMessage('DNI debe tener 7 u 8 dígitos')
        .isNumeric()
        .withMessage('DNI debe ser numérico'),
    
    body('faceImage')
        .notEmpty()
        .withMessage('Imagen facial es requerida')
        .custom((value) => {
            if (!value.startsWith('data:image/')) {
                throw new Error('Formato de imagen facial inválido (debe ser base64)');
            }
            return true;
        }),
    
    body('documentImage')
        .notEmpty()
        .withMessage('Imagen del documento es requerida')
        .custom((value) => {
            if (!value.startsWith('data:image/')) {
                throw new Error('Formato de imagen del documento inválido (debe ser base64)');
            }
            return true;
        }),
    
    body('personalInfo.firstName')
        .notEmpty()
        .withMessage('Nombre es requerido')
        .isLength({ min: 2, max: 50 })
        .withMessage('Nombre debe tener entre 2 y 50 caracteres'),
    
    body('personalInfo.lastName')
        .notEmpty()
        .withMessage('Apellido es requerido')
        .isLength({ min: 2, max: 50 })
        .withMessage('Apellido debe tener entre 2 y 50 caracteres'),
    
    body('personalInfo.birthDate')
        .optional()
        .isISO8601()
        .withMessage('Fecha de nacimiento debe estar en formato ISO8601'),
    
    body('personalInfo.accessLevel')
        .optional()
        .isIn(['visitor', 'employee', 'security', 'admin'])
        .withMessage('Nivel de acceso debe ser: visitor, employee, security o admin')
], biometricController.registerBiometric);

/**
 * ⚡ FASE 2: Reconocimiento biométrico rápido
 * Para uso por personal de seguridad y administradores
 */
router.post('/recognize', [
    authMiddleware.requireRole(['security', 'admin']),
    
    body('image')
        .notEmpty()
        .withMessage('Imagen es requerida para reconocimiento')
        .custom((value) => {
            if (!value.startsWith('data:image/')) {
                throw new Error('Formato de imagen inválido (debe ser base64)');
            }
            return true;
        }),
    
    body('scanType')
        .notEmpty()
        .withMessage('Tipo de escaneo es requerido')
        .isIn(['face', 'document', 'both'])
        .withMessage('Tipo de escaneo debe ser: face, document o both'),
    
    body('requestedAccess')
        .optional()
        .isIn(['visitor', 'employee', 'security', 'admin'])
        .withMessage('Nivel de acceso solicitado debe ser: visitor, employee, security o admin'),
    
    body('location')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('Ubicación debe tener entre 2 y 100 caracteres')
], biometricController.quickRecognition);

/**
 * 📊 Obtener estadísticas biométricas (solo admin)
 */
router.get('/stats', [
    authMiddleware.requireRole(['admin'])
], biometricController.getBiometricStats);

/**
 * 👤 Obtener información de usuario verificado
 */
router.get('/user/:userId', [
    param('userId')
        .notEmpty()
        .withMessage('ID de usuario es requerido')
        .isLength({ min: 3, max: 50 })
        .withMessage('ID de usuario debe tener entre 3 y 50 caracteres')
], biometricController.getVerifiedUser);

/**
 * 🗑️ Eliminar datos biométricos (solo admin)
 */
router.delete('/user/:userId', [
    authMiddleware.requireRole(['admin']),
    
    param('userId')
        .notEmpty()
        .withMessage('ID de usuario es requerido')
        .isLength({ min: 3, max: 50 })
        .withMessage('ID de usuario debe tener entre 3 y 50 caracteres')
], biometricController.deleteBiometricData);

/**
 * 🔍 Verificar estado de verificación biométrica
 */
router.get('/status/:userId', [
    param('userId')
        .notEmpty()
        .withMessage('ID de usuario es requerido')
], async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Verificar permisos
        if (req.user.id !== userId && !['security', 'admin'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para ver este estado'
            });
        }

        const biometricService = require('../services/biometricService');
        const verifiedUsers = await biometricService.getVerifiedUsers();
        const user = verifiedUsers.find(u => u.userId === userId);

        return res.status(200).json({
            success: true,
            data: {
                userId,
                isVerified: !!user,
                verificationLevel: user?.verificationLevel || 'none',
                accessLevel: user?.accessLevel || 'none',
                verificationDate: user?.verificationDate || null,
                canUseQuickRecognition: !!user
            }
        });

    } catch (error) {
        console.error('❌ Error verificando estado biométrico:', error);
        return res.status(500).json({
            success: false,
            message: 'Error verificando estado biométrico'
        });
    }
});

/**
 * 🧪 Endpoint de prueba para validar funcionamiento
 */
router.get('/test', [
    authMiddleware.requireRole(['admin'])
], async (req, res) => {
    try {
        const biometricService = require('../services/biometricService');
        
        // Datos de prueba
        const testData = {
            userId: 'test_user_' + Date.now(),
            dni: '12345678',
            faceImage: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
            documentImage: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
            personalInfo: {
                firstName: 'Test',
                lastName: 'User',
                birthDate: '1990-01-01',
                accessLevel: 'visitor'
            }
        };

        const stats = await biometricService.getBiometricStats();

        return res.status(200).json({
            success: true,
            message: 'Sistema biométrico funcionando correctamente',
            data: {
                systemStatus: 'operational',
                testData: {
                    sampleRegistration: testData,
                    sampleRecognition: {
                        image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/...',
                        scanType: 'both',
                        requestedAccess: 'visitor',
                        location: 'Entrada principal'
                    }
                },
                currentStats: stats,
                endpoints: {
                    register: 'POST /api/biometric/register',
                    recognize: 'POST /api/biometric/recognize',
                    stats: 'GET /api/biometric/stats',
                    userInfo: 'GET /api/biometric/user/:userId',
                    deleteUser: 'DELETE /api/biometric/user/:userId',
                    status: 'GET /api/biometric/status/:userId'
                }
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error en prueba del sistema biométrico',
            error: error.message
        });
    }
});

module.exports = router;
