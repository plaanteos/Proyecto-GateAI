// Servicio de Recuperación de Contraseña - UnionTech
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

class PasswordResetService {
    constructor() {
        this.prisma = new PrismaClient();
        this.resetTokens = new Map(); // En producción usar Redis o BD
        this.TOKEN_EXPIRY = 30 * 60 * 1000; // 30 minutos
    }

    // Generar token de reset
    generateResetToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    // Solicitar reset de contraseña
    async requestPasswordReset(email) {
        try {
            // Verificar si el usuario existe
            const user = await this.prisma.usuarios.findFirst({
                where: { 
                    persona: { email } 
                },
                include: { persona: true }
            });

            if (!user) {
                // Por seguridad, no revelamos si el email existe
                return {
                    success: true,
                    message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña'
                };
            }

            // Generar token
            const resetToken = this.generateResetToken();
            const expiresAt = new Date(Date.now() + this.TOKEN_EXPIRY);

            // Guardar token (en producción usar BD)
            this.resetTokens.set(resetToken, {
                userId: user.id,
                email: email,
                expiresAt: expiresAt,
                used: false
            });

            // En producción: enviar email con token
            console.log(`🔐 Token de reset generado para ${email}: ${resetToken}`);
            console.log(`🕐 Expira en: ${expiresAt.toLocaleString()}`);

            // Simular envío de email
            const resetUrl = `http://localhost:8081/reset-password?token=${resetToken}`;
            console.log(`📧 URL de reset: ${resetUrl}`);

            return {
                success: true,
                message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña',
                debug: {
                    token: resetToken,
                    resetUrl: resetUrl // Solo para desarrollo
                }
            };

        } catch (error) {
            console.error('Error solicitando reset de contraseña:', error);
            throw new Error('Error interno del servidor');
        }
    }

    // Verificar si un token es válido
    verifyResetToken(token) {
        const tokenData = this.resetTokens.get(token);
        
        if (!tokenData) {
            return { valid: false, error: 'Token inválido' };
        }

        if (tokenData.used) {
            return { valid: false, error: 'Token ya utilizado' };
        }

        if (new Date() > tokenData.expiresAt) {
            this.resetTokens.delete(token);
            return { valid: false, error: 'Token expirado' };
        }

        return { valid: true, userId: tokenData.userId, email: tokenData.email };
    }

    // Restablecer contraseña
    async resetPassword(token, newPassword) {
        try {
            // Verificar token
            const verification = this.verifyResetToken(token);
            if (!verification.valid) {
                throw new Error(verification.error);
            }

            // Validar nueva contraseña
            if (!newPassword || newPassword.length < 6) {
                throw new Error('La contraseña debe tener al menos 6 caracteres');
            }

            // Hash de la nueva contraseña
            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

            // Actualizar contraseña en la base de datos
            await this.prisma.usuarios.update({
                where: { id: verification.userId },
                data: { 
                    password_hash: hashedPassword,
                    updated_at: new Date()
                }
            });

            // Marcar token como usado
            const tokenData = this.resetTokens.get(token);
            tokenData.used = true;
            this.resetTokens.set(token, tokenData);

            console.log(`✅ Contraseña actualizada para usuario ID: ${verification.userId}`);

            return {
                success: true,
                message: 'Contraseña actualizada exitosamente'
            };

        } catch (error) {
            console.error('Error restableciendo contraseña:', error);
            throw error;
        }
    }

    // Obtener información del token (para mostrar en frontend)
    getTokenInfo(token) {
        const verification = this.verifyResetToken(token);
        
        if (!verification.valid) {
            return { valid: false, error: verification.error };
        }

        const tokenData = this.resetTokens.get(token);
        return {
            valid: true,
            email: verification.email,
            expiresAt: tokenData.expiresAt,
            timeRemaining: Math.max(0, tokenData.expiresAt - new Date())
        };
    }

    // Limpiar tokens expirados (ejecutar periódicamente)
    cleanupExpiredTokens() {
        const now = new Date();
        for (const [token, data] of this.resetTokens.entries()) {
            if (now > data.expiresAt || data.used) {
                this.resetTokens.delete(token);
            }
        }
        console.log(`🧹 Tokens expirados limpiados. Tokens activos: ${this.resetTokens.size}`);
    }

    // Invalidar todos los tokens de un usuario
    invalidateUserTokens(userId) {
        for (const [token, data] of this.resetTokens.entries()) {
            if (data.userId === userId) {
                this.resetTokens.delete(token);
            }
        }
    }
}

module.exports = PasswordResetService;
