/**
 * Configuración de Servicios Externos
 * Gestión centralizada de todos los servicios externos del sistema
 */

const nodemailer = require('nodemailer');
const twilio = require('twilio');
const { Storage } = require('@google-cloud/storage');
const aws = require('aws-sdk');
const logger = require('./logger');

class ExternalServicesManager {
    constructor() {
        this.services = {
            email: null,
            sms: null,
            storage: null,
            push: null
        };
        this.initializeServices();
    }

    /**
     * Inicializar todos los servicios externos
     */
    async initializeServices() {
        try {
            await Promise.all([
                this.initializeEmailService(),
                this.initializeSMSService(),
                this.initializeStorageService(),
                this.initializePushService()
            ]);
            
            logger.info('✅ Todos los servicios externos inicializados correctamente');
        } catch (error) {
            logger.error('❌ Error inicializando servicios externos:', error);
        }
    }

    /**
     * Configurar servicio de email
     */
    async initializeEmailService() {
        try {
            // Configuración para múltiples proveedores
            const emailConfig = this.getEmailConfig();
            
            this.services.email = nodemailer.createTransporter(emailConfig);
            
            // Verificar conexión
            await this.services.email.verify();
            logger.info('✅ Servicio de email configurado correctamente');
            
            return true;
        } catch (error) {
            logger.warn('⚠️  Email service no disponible, usando modo fallback');
            this.services.email = this.createFallbackEmailService();
            return false;
        }
    }

    /**
     * Obtener configuración de email según el entorno
     */
    getEmailConfig() {
        const provider = process.env.EMAIL_PROVIDER || 'sendgrid';
        
        switch (provider) {
            case 'sendgrid':
                return {
                    host: 'smtp.sendgrid.net',
                    port: 587,
                    secure: false,
                    auth: {
                        user: 'apikey',
                        pass: process.env.SENDGRID_API_KEY
                    }
                };
            
            case 'gmail':
                return {
                    service: 'gmail',
                    auth: {
                        user: process.env.GMAIL_USER,
                        pass: process.env.GMAIL_APP_PASSWORD
                    }
                };
            
            case 'outlook':
                return {
                    host: 'smtp-mail.outlook.com',
                    port: 587,
                    secure: false,
                    auth: {
                        user: process.env.OUTLOOK_USER,
                        pass: process.env.OUTLOOK_PASSWORD
                    }
                };
            
            default:
                return {
                    host: process.env.SMTP_HOST || 'localhost',
                    port: process.env.SMTP_PORT || 587,
                    secure: process.env.SMTP_SECURE === 'true',
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASSWORD
                    }
                };
        }
    }

    /**
     * Servicio de email fallback para desarrollo
     */
    createFallbackEmailService() {
        return {
            sendMail: async (mailOptions) => {
                logger.info('📧 [FALLBACK EMAIL]', {
                    to: mailOptions.to,
                    subject: mailOptions.subject,
                    text: mailOptions.text?.substring(0, 100) + '...'
                });
                return { messageId: `fallback-${Date.now()}` };
            }
        };
    }

    /**
     * Configurar servicio SMS
     */
    async initializeSMSService() {
        try {
            if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
                this.services.sms = twilio(
                    process.env.TWILIO_ACCOUNT_SID,
                    process.env.TWILIO_AUTH_TOKEN
                );
                
                // Verificar configuración
                await this.services.sms.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
                logger.info('✅ Servicio SMS configurado correctamente');
            } else {
                throw new Error('Credenciales de Twilio no configuradas');
            }
        } catch (error) {
            logger.warn('⚠️  SMS service no disponible, usando modo fallback');
            this.services.sms = this.createFallbackSMSService();
        }
    }

    /**
     * Servicio SMS fallback para desarrollo
     */
    createFallbackSMSService() {
        return {
            messages: {
                create: async (options) => {
                    logger.info('📱 [FALLBACK SMS]', {
                        to: options.to,
                        body: options.body?.substring(0, 50) + '...'
                    });
                    return { sid: `fallback-sms-${Date.now()}` };
                }
            }
        };
    }

    /**
     * Configurar servicio de almacenamiento
     */
    async initializeStorageService() {
        try {
            const storageType = process.env.STORAGE_TYPE || 'local';
            
            switch (storageType) {
                case 'gcs':
                    this.services.storage = new Storage({
                        projectId: process.env.GCS_PROJECT_ID,
                        keyFilename: process.env.GCS_KEY_FILE
                    });
                    break;
                
                case 's3':
                    aws.config.update({
                        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                        region: process.env.AWS_REGION
                    });
                    this.services.storage = new aws.S3();
                    break;
                
                default:
                    this.services.storage = this.createLocalStorageService();
            }
            
            logger.info(`✅ Servicio de almacenamiento (${storageType}) configurado`);
        } catch (error) {
            logger.warn('⚠️  Storage service usando modo local');
            this.services.storage = this.createLocalStorageService();
        }
    }

    /**
     * Servicio de almacenamiento local
     */
    createLocalStorageService() {
        const fs = require('fs').promises;
        const path = require('path');
        
        return {
            upload: async (file, destination) => {
                const uploadPath = path.join(process.cwd(), 'uploads', destination);
                await fs.mkdir(path.dirname(uploadPath), { recursive: true });
                await fs.writeFile(uploadPath, file.buffer);
                return { url: `/uploads/${destination}` };
            },
            delete: async (filePath) => {
                const fullPath = path.join(process.cwd(), 'uploads', filePath);
                await fs.unlink(fullPath);
                return true;
            }
        };
    }

    /**
     * Configurar servicio de notificaciones push
     */
    async initializePushService() {
        try {
            if (process.env.FCM_SERVER_KEY) {
                const admin = require('firebase-admin');
                
                if (!admin.apps.length) {
                    admin.initializeApp({
                        credential: admin.credential.cert({
                            projectId: process.env.FCM_PROJECT_ID,
                            clientEmail: process.env.FCM_CLIENT_EMAIL,
                            privateKey: process.env.FCM_PRIVATE_KEY?.replace(/\\n/g, '\n')
                        })
                    });
                }
                
                this.services.push = admin.messaging();
                logger.info('✅ Servicio de notificaciones push configurado');
            } else {
                throw new Error('Credenciales de FCM no configuradas');
            }
        } catch (error) {
            logger.warn('⚠️  Push notifications no disponibles, usando modo fallback');
            this.services.push = this.createFallbackPushService();
        }
    }

    /**
     * Servicio push fallback
     */
    createFallbackPushService() {
        return {
            send: async (message) => {
                logger.info('🔔 [FALLBACK PUSH]', {
                    to: message.token || message.topic,
                    title: message.notification?.title,
                    body: message.notification?.body
                });
                return { messageId: `fallback-push-${Date.now()}` };
            }
        };
    }

    /**
     * Enviar email
     */
    async sendEmail(options) {
        try {
            const result = await this.services.email.sendMail({
                from: options.from || process.env.DEFAULT_FROM_EMAIL,
                to: options.to,
                subject: options.subject,
                html: options.html,
                text: options.text,
                attachments: options.attachments
            });
            
            logger.info('📧 Email enviado:', { to: options.to, messageId: result.messageId });
            return result;
        } catch (error) {
            logger.error('❌ Error enviando email:', error);
            throw error;
        }
    }

    /**
     * Enviar SMS
     */
    async sendSMS(to, message) {
        try {
            const result = await this.services.sms.messages.create({
                body: message,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: to
            });
            
            logger.info('📱 SMS enviado:', { to, sid: result.sid });
            return result;
        } catch (error) {
            logger.error('❌ Error enviando SMS:', error);
            throw error;
        }
    }

    /**
     * Subir archivo
     */
    async uploadFile(file, options = {}) {
        try {
            const fileName = options.fileName || `${Date.now()}-${file.originalname}`;
            const destination = options.path || 'general';
            
            const result = await this.services.storage.upload(file, `${destination}/${fileName}`);
            
            logger.info('📁 Archivo subido:', { fileName, destination });
            return result;
        } catch (error) {
            logger.error('❌ Error subiendo archivo:', error);
            throw error;
        }
    }

    /**
     * Enviar notificación push
     */
    async sendPushNotification(options) {
        try {
            const message = {
                notification: {
                    title: options.title,
                    body: options.body
                },
                data: options.data || {},
                token: options.token,
                topic: options.topic
            };
            
            const result = await this.services.push.send(message);
            
            logger.info('🔔 Push notification enviada:', { 
                to: options.token || options.topic, 
                messageId: result 
            });
            return result;
        } catch (error) {
            logger.error('❌ Error enviando push notification:', error);
            throw error;
        }
    }

    /**
     * Verificar estado de todos los servicios
     */
    async healthCheck() {
        const health = {
            email: false,
            sms: false,
            storage: true, // Local storage siempre disponible
            push: false,
            timestamp: new Date().toISOString()
        };

        try {
            // Verificar email
            if (this.services.email && this.services.email.verify) {
                await this.services.email.verify();
                health.email = true;
            }
        } catch (error) {
            logger.debug('Email service health check failed:', error.message);
        }

        try {
            // Verificar SMS
            if (this.services.sms && process.env.TWILIO_ACCOUNT_SID) {
                await this.services.sms.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
                health.sms = true;
            }
        } catch (error) {
            logger.debug('SMS service health check failed:', error.message);
        }

        try {
            // Verificar push
            if (this.services.push && this.services.push.send) {
                health.push = true;
            }
        } catch (error) {
            logger.debug('Push service health check failed:', error.message);
        }

        return health;
    }
}

// Singleton instance
const externalServices = new ExternalServicesManager();

module.exports = externalServices;
