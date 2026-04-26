// AuthController simplificado para demo - UnionTech
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class AuthController {
  constructor() {
    // Usuarios de prueba en memoria
    this.users = new Map([
      ['admin', {
        id: 1,
        username: 'admin',
        password_hash: bcrypt.hashSync('admin123', 10), // admin123
        email: 'admin@uniontech.com',
        role: 'admin',
        persona: {
          nombre: 'Administrador',
          apellido: 'Sistema'
        },
        activo: true
      }],
      ['user', {
        id: 2,
        username: 'user',
        password_hash: bcrypt.hashSync('user123', 10), // user123
        email: 'user@uniontech.com',
        role: 'user',
        persona: {
          nombre: 'Usuario',
          apellido: 'Demo'
        },
        activo: true
      }],
      ['security', {
        id: 3,
        username: 'security',
        password_hash: bcrypt.hashSync('security123', 10), // security123
        email: 'security@uniontech.com',
        role: 'security',
        persona: {
          nombre: 'Operador',
          apellido: 'Seguridad'
        },
        activo: true
      }]
    ]);

    this.JWT_SECRET = process.env.JWT_SECRET || 'uniontech_demo_secret_key_2025';
  }

  // Login de usuario
  async login(req, res) {
    try {
      const { username, password } = req.body;
      
      console.log('🔐 Intento de login:', { username, hasPassword: !!password });

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Usuario y contraseña son requeridos'
        });
      }

      // Buscar usuario
      const user = this.users.get(username);

      if (!user || !user.activo) {
        console.log('❌ Usuario no encontrado o inactivo:', username);
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Verificar contraseña
      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        console.log('❌ Contraseña incorrecta para usuario:', username);
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Generar JWT
      const token = jwt.sign(
        { 
          userId: user.id, 
          username: user.username,
          role: user.role 
        },
        this.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Respuesta exitosa
      const userData = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        nombre: user.persona.nombre,
        apellido: user.persona.apellido
      };

      console.log('✅ Login exitoso para usuario:', username);

      res.json({
        success: true,
        message: 'Login exitoso',
        token,
        user: userData
      });

    } catch (error) {
      console.error('❌ Error en login:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Registro de usuario
  async register(req, res) {
    try {
      const { username, password, email, nombre, apellido, role = 'user' } = req.body;

      // Verificar si el usuario ya existe
      if (this.users.has(username)) {
        return res.status(400).json({
          success: false,
          message: 'El usuario ya existe'
        });
      }

      // Hash de la contraseña
      const password_hash = await bcrypt.hash(password, 10);

      // Crear nuevo usuario
      const newUser = {
        id: this.users.size + 1,
        username,
        password_hash,
        email,
        role,
        persona: {
          nombre,
          apellido
        },
        activo: true,
        createdAt: new Date()
      };

      this.users.set(username, newUser);

      // Generar JWT
      const token = jwt.sign(
        { 
          userId: newUser.id, 
          username: newUser.username,
          role: newUser.role 
        },
        this.JWT_SECRET,
        { expiresIn: '24h' }
      );

      const userData = {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        nombre: newUser.persona.nombre,
        apellido: newUser.persona.apellido
      };

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        token,
        user: userData
      });

    } catch (error) {
      console.error('❌ Error en registro:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Verificar token
  async verifyToken(req, res) {
    try {
      // El middleware de auth ya decodificó el token en req.user
      const { userId, username, role } = req.user;
      
      const user = this.users.get(username);
      if (!user || !user.activo) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no válido'
        });
      }

      const userData = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        nombre: user.persona.nombre,
        apellido: user.persona.apellido
      };

      res.json({
        success: true,
        user: userData
      });

    } catch (error) {
      console.error('❌ Error verificando token:', error);
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
      const { username } = req.user;

      const user = this.users.get(username);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Verificar contraseña actual
      const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({
          success: false,
          message: 'Contraseña actual incorrecta'
        });
      }

      // Hash de la nueva contraseña
      const newPasswordHash = await bcrypt.hash(newPassword, 10);
      user.password_hash = newPasswordHash;
      user.updatedAt = new Date();

      res.json({
        success: true,
        message: 'Contraseña actualizada exitosamente'
      });

    } catch (error) {
      console.error('❌ Error cambiando contraseña:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Logout (opcional, ya que JWT es stateless)
  async logout(req, res) {
    res.json({
      success: true,
      message: 'Logout exitoso'
    });
  }

  // Obtener usuarios (solo para admin)
  async getUsers(req, res) {
    try {
      const { role } = req.user;
      
      if (role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado'
        });
      }

      const users = Array.from(this.users.values()).map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        nombre: user.persona.nombre,
        apellido: user.persona.apellido,
        activo: user.activo,
        createdAt: user.createdAt
      }));

      res.json({
        success: true,
        users
      });

    } catch (error) {
      console.error('❌ Error obteniendo usuarios:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Métodos de password reset (stubs)
  async requestPasswordReset(req, res) {
    res.json({
      success: true,
      message: 'Demo: Solicitud de reset enviada (no implementada en demo)'
    });
  }

  async verifyResetToken(req, res) {
    res.json({
      success: true,
      message: 'Demo: Token verificado (no implementado en demo)'
    });
  }

  async resetPassword(req, res) {
    res.json({
      success: true,
      message: 'Demo: Contraseña reseteada (no implementada en demo)'
    });
  }
}

// Crear instancia única
const authController = new AuthController();

// Exportar métodos individuales
module.exports = {
  login: authController.login.bind(authController),
  register: authController.register.bind(authController),
  verifyToken: authController.verifyToken.bind(authController),
  changePassword: authController.changePassword.bind(authController),
  logout: authController.logout.bind(authController),
  getUsers: authController.getUsers.bind(authController),
  requestPasswordReset: authController.requestPasswordReset.bind(authController),
  verifyResetToken: authController.verifyResetToken.bind(authController),
  resetPassword: authController.resetPassword.bind(authController)
};
