const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const PasswordResetService = require('../services/passwordResetService');

class AuthController {
  constructor() {
    this.prisma = new PrismaClient();
    this.passwordResetService = new PasswordResetService();
  }

  // Login de usuario
  async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Usuario y contraseña son requeridos'
        });
      }

      // Buscar usuario en la base de datos
      const user = await this.prisma.usuarios.findUnique({
        where: { username },
        include: {
          persona: true,
          rol: true
        }
      });

      if (!user || !user.activo) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Verificar contraseña
      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Generar JWT
      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          persona_id: user.persona_id,
          rol: user.rol.nombre
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        message: 'Login exitoso',
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            persona: user.persona,
            rol: user.rol.nombre
          }
        }
      });

    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Registro de nuevo usuario
  async register(req, res) {
    try {
      const { username, password, persona_id, rol_id } = req.body;

      if (!username || !password || !persona_id) {
        return res.status(400).json({
          success: false,
          message: 'Todos los campos son requeridos'
        });
      }

      // Verificar si el usuario ya existe
      const existingUser = await this.prisma.usuarios.findUnique({
        where: { username }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'El usuario ya existe'
        });
      }

      // Verificar si la persona existe
      const persona = await this.prisma.personas.findUnique({
        where: { id: persona_id }
      });

      if (!persona) {
        return res.status(400).json({
          success: false,
          message: 'Persona no encontrada'
        });
      }

      // Hash de la contraseña
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Crear usuario
      const newUser = await this.prisma.usuarios.create({
        data: {
          username,
          password_hash: hashedPassword,
          persona_id,
          rol_id: rol_id || 2, // Rol por defecto: usuario
          activo: true
        },
        include: {
          persona: true,
          rol: true
        }
      });

      res.status(201).json({
        success: true,
        message: 'Usuario creado exitosamente',
        data: {
          id: newUser.id,
          username: newUser.username,
          persona: newUser.persona,
          rol: newUser.rol.nombre
        }
      });

    } catch (error) {
      console.error('Error en registro:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Verificar token
  async verifyToken(req, res) {
    try {
      const user = await this.prisma.usuarios.findUnique({
        where: { id: req.user.id },
        include: {
          persona: true,
          rol: true
        }
      });

      if (!user || !user.activo) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no válido'
        });
      }

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            username: user.username,
            persona: user.persona,
            rol: user.rol.nombre
          }
        }
      });

    } catch (error) {
      console.error('Error verificando token:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Cambiar contraseña
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Contraseña actual y nueva son requeridas'
        });
      }

      // Buscar usuario
      const user = await this.prisma.usuarios.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Verificar contraseña actual
      const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
      if (!validPassword) {
        return res.status(400).json({
          success: false,
          message: 'Contraseña actual incorrecta'
        });
      }

      // Hash de la nueva contraseña
      const saltRounds = 12;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Actualizar contraseña
      await this.prisma.usuarios.update({
        where: { id: userId },
        data: { 
          password_hash: hashedNewPassword,
          updated_at: new Date()
        }
      });

      res.json({
        success: true,
        message: 'Contraseña actualizada exitosamente'
      });

    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Logout (principalmente para invalidar sesión del lado del cliente)
  async logout(req, res) {
    try {
      // En una implementación más robusta, podrías mantener una blacklist de tokens
      res.json({
        success: true,
        message: 'Logout exitoso'
      });
    } catch (error) {
      console.error('Error en logout:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Solicitar reset de contraseña
  async requestPasswordReset(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email es requerido'
        });
      }

      const result = await this.passwordResetService.requestPasswordReset(email);
      
      res.json(result);

    } catch (error) {
      console.error('Error solicitando reset:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Verificar token de reset
  async verifyResetToken(req, res) {
    try {
      const { token } = req.params;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token es requerido'
        });
      }

      const tokenInfo = this.passwordResetService.getTokenInfo(token);
      
      if (!tokenInfo.valid) {
        return res.status(400).json({
          success: false,
          message: tokenInfo.error
        });
      }

      res.json({
        success: true,
        message: 'Token válido',
        data: {
          email: tokenInfo.email,
          expiresAt: tokenInfo.expiresAt,
          timeRemaining: tokenInfo.timeRemaining
        }
      });

    } catch (error) {
      console.error('Error verificando token:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Restablecer contraseña
  async resetPassword(req, res) {
    try {
      const { token, newPassword, confirmPassword } = req.body;

      if (!token || !newPassword || !confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'Token, nueva contraseña y confirmación son requeridos'
        });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'Las contraseñas no coinciden'
        });
      }

      const result = await this.passwordResetService.resetPassword(token, newPassword);
      
      res.json(result);

    } catch (error) {
      console.error('Error restableciendo contraseña:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new AuthController();
