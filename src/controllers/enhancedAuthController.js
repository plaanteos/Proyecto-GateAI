const EnhancedUserManagementService = require('../services/enhancedUserManagementService');

/**
 * HU1 y HU2 - Controlador mejorado de autenticación y gestión de usuarios
 * Implementa endpoints completos para login, registro, CRUD de usuarios y gestión de roles
 */
class EnhancedAuthController {
    constructor() {
        this.userService = new EnhancedUserManagementService();
    }

    // HU1: Login mejorado con gestión de sesiones
    async login(req, res) {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Usuario y contraseña son requeridos'
                });
            }

            const result = await this.userService.authenticate(username, password, {
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });

            // Establecer cookie de sesión
            res.cookie('sessionId', result.sessionId, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 24 * 60 * 60 * 1000 // 24 horas
            });

            res.json({
                success: true,
                message: 'Login exitoso',
                data: {
                    token: result.token,
                    user: result.user,
                    role: result.role,
                    permissions: result.permissions,
                    expiresIn: result.expiresIn
                }
            });

        } catch (error) {
            console.error('Error en login:', error);
            res.status(401).json({
                success: false,
                message: error.message,
                code: 'LOGIN_FAILED'
            });
        }
    }

    // HU1: Validar token y sesión
    async validateToken(req, res) {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '');
            const sessionId = req.cookies.sessionId;

            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'Token no proporcionado'
                });
            }

            const result = await this.userService.validateSession(token, sessionId);

            if (!result.valid) {
                return res.status(401).json({
                    success: false,
                    message: result.error || 'Token inválido'
                });
            }

            res.json({
                success: true,
                data: {
                    user: result.user,
                    role: result.role,
                    permissions: result.permissions
                }
            });

        } catch (error) {
            console.error('Error validando token:', error);
            res.status(401).json({
                success: false,
                message: 'Token inválido'
            });
        }
    }

    // HU1: Logout mejorado
    async logout(req, res) {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '');
            const sessionId = req.cookies.sessionId;

            await this.userService.logout(sessionId, token);

            // Limpiar cookie de sesión
            res.clearCookie('sessionId');

            res.json({
                success: true,
                message: 'Logout exitoso'
            });

        } catch (error) {
            console.error('Error en logout:', error);
            res.status(500).json({
                success: false,
                message: 'Error en logout'
            });
        }
    }

    // HU2: Crear usuario
    async createUser(req, res) {
        try {
            const userData = req.body;
            const createdBy = req.user; // Del middleware de autenticación

            const result = await this.userService.createUser(userData, createdBy);

            res.status(201).json({
                success: true,
                message: result.message,
                data: {
                    user: result.user
                }
            });

        } catch (error) {
            console.error('Error creando usuario:', error);
            res.status(400).json({
                success: false,
                message: error.message,
                code: 'USER_CREATION_FAILED'
            });
        }
    }

    // HU2: Obtener usuario por ID
    async getUserById(req, res) {
        try {
            const { userId } = req.params;
            const requestedBy = req.user;

            const user = this.userService.findUserById(userId);
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            // Verificar permisos
            if (!this.userService.hasPermission(requestedBy.roleId, 'user_management') && 
                requestedBy.id !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Sin permisos para acceder a este usuario'
                });
            }

            res.json({
                success: true,
                data: {
                    user: this.userService.sanitizeUser(user),
                    role: this.userService.roles.get(user.roleId)
                }
            });

        } catch (error) {
            console.error('Error obteniendo usuario:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // HU2: Listar usuarios con filtros y paginación
    async listUsers(req, res) {
        try {
            const filters = {
                active: req.query.active !== undefined ? req.query.active === 'true' : undefined,
                roleId: req.query.roleId,
                building: req.query.building,
                search: req.query.search,
                page: parseInt(req.query.page) || 1,
                limit: Math.min(parseInt(req.query.limit) || 20, 100) // Máximo 100 por página
            };

            const requestedBy = req.user;
            const result = await this.userService.listUsers(filters, requestedBy);

            res.json({
                success: true,
                data: result
            });

        } catch (error) {
            console.error('Error listando usuarios:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // HU2: Actualizar usuario
    async updateUser(req, res) {
        try {
            const { userId } = req.params;
            const updateData = req.body;
            const updatedBy = req.user;

            const result = await this.userService.updateUser(userId, updateData, updatedBy);

            res.json({
                success: true,
                message: result.message,
                data: {
                    user: result.user
                }
            });

        } catch (error) {
            console.error('Error actualizando usuario:', error);
            res.status(400).json({
                success: false,
                message: error.message,
                code: 'USER_UPDATE_FAILED'
            });
        }
    }

    // HU2: Eliminar usuario (soft delete)
    async deleteUser(req, res) {
        try {
            const { userId } = req.params;
            const deletedBy = req.user;

            const result = await this.userService.deleteUser(userId, deletedBy);

            res.json({
                success: true,
                message: result.message
            });

        } catch (error) {
            console.error('Error eliminando usuario:', error);
            res.status(400).json({
                success: false,
                message: error.message,
                code: 'USER_DELETE_FAILED'
            });
        }
    }

    // HU2: Activar/Desactivar usuario
    async toggleUserStatus(req, res) {
        try {
            const { userId } = req.params;
            const { active } = req.body;
            const updatedBy = req.user;

            const result = await this.userService.updateUser(userId, { active }, updatedBy);

            res.json({
                success: true,
                message: `Usuario ${active ? 'activado' : 'desactivado'} exitosamente`,
                data: {
                    user: result.user
                }
            });

        } catch (error) {
            console.error('Error cambiando estado del usuario:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // HU2: Cambiar rol de usuario
    async changeUserRole(req, res) {
        try {
            const { userId } = req.params;
            const { roleId } = req.body;
            const updatedBy = req.user;

            // Verificar que el rol existe
            if (!this.userService.roles.has(roleId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Rol inválido'
                });
            }

            const result = await this.userService.updateUser(userId, { roleId }, updatedBy);

            res.json({
                success: true,
                message: 'Rol de usuario actualizado exitosamente',
                data: {
                    user: result.user,
                    newRole: this.userService.roles.get(roleId)
                }
            });

        } catch (error) {
            console.error('Error cambiando rol de usuario:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // HU2: Obtener todos los roles disponibles
    async getRoles(req, res) {
        try {
            const requestedBy = req.user;

            // Verificar permisos para ver roles
            if (!this.userService.hasPermission(requestedBy.roleId, 'user_management') &&
                !this.userService.hasPermission(requestedBy.roleId, 'role_management')) {
                return res.status(403).json({
                    success: false,
                    message: 'Sin permisos para acceder a los roles'
                });
            }

            const roles = Array.from(this.userService.roles.values());

            res.json({
                success: true,
                data: {
                    roles: roles.map(role => ({
                        id: role.id,
                        name: role.name,
                        description: role.description,
                        level: role.level,
                        color: role.color,
                        permissions: role.permissions,
                        features: role.features
                    }))
                }
            });

        } catch (error) {
            console.error('Error obteniendo roles:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // HU2: Obtener permisos disponibles
    async getPermissions(req, res) {
        try {
            const requestedBy = req.user;

            // Solo super admins pueden ver todos los permisos
            if (!this.userService.hasPermission(requestedBy.roleId, 'role_management')) {
                return res.status(403).json({
                    success: false,
                    message: 'Sin permisos para acceder a los permisos'
                });
            }

            const permissions = Array.from(this.userService.permissions.values());

            res.json({
                success: true,
                data: {
                    permissions
                }
            });

        } catch (error) {
            console.error('Error obteniendo permisos:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // HU1: Cambiar contraseña
    async changePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;
            const user = req.user;

            if (!currentPassword || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Contraseña actual y nueva son requeridas'
                });
            }

            // Verificar contraseña actual
            const currentUser = this.userService.findUserById(user.id);
            const bcrypt = require('bcryptjs');
            const isValidCurrent = await bcrypt.compare(currentPassword, currentUser.passwordHash);

            if (!isValidCurrent) {
                return res.status(400).json({
                    success: false,
                    message: 'Contraseña actual incorrecta'
                });
            }

            // Actualizar contraseña
            const result = await this.userService.updateUser(user.id, { password: newPassword }, user);

            res.json({
                success: true,
                message: 'Contraseña actualizada exitosamente'
            });

        } catch (error) {
            console.error('Error cambiando contraseña:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // HU1: Obtener perfil del usuario actual
    async getProfile(req, res) {
        try {
            const user = req.user;
            const fullUser = this.userService.findUserById(user.id);
            
            if (!fullUser) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            res.json({
                success: true,
                data: {
                    user: this.userService.sanitizeUser(fullUser),
                    role: this.userService.roles.get(fullUser.roleId),
                    permissions: this.userService.getUserPermissions(fullUser.roleId)
                }
            });

        } catch (error) {
            console.error('Error obteniendo perfil:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // HU1: Actualizar perfil del usuario actual
    async updateProfile(req, res) {
        try {
            const user = req.user;
            const { profile, settings } = req.body;

            const updateData = {};
            if (profile) updateData.profile = { ...user.profile, ...profile };
            if (settings) updateData.settings = { ...user.settings, ...settings };

            const result = await this.userService.updateUser(user.id, updateData, user);

            res.json({
                success: true,
                message: 'Perfil actualizado exitosamente',
                data: {
                    user: result.user
                }
            });

        } catch (error) {
            console.error('Error actualizando perfil:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // HU2: Obtener estadísticas del sistema de usuarios
    async getUserStats(req, res) {
        try {
            const requestedBy = req.user;

            // Solo usuarios con permisos de gestión pueden ver estadísticas
            if (!this.userService.hasPermission(requestedBy.roleId, 'user_management')) {
                return res.status(403).json({
                    success: false,
                    message: 'Sin permisos para acceder a las estadísticas'
                });
            }

            const stats = this.userService.getSystemStats();

            res.json({
                success: true,
                data: {
                    stats
                }
            });

        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // HU1: Obtener sesiones activas del usuario
    async getActiveSessions(req, res) {
        try {
            const user = req.user;
            const sessions = Array.from(this.userService.sessions.values())
                .filter(session => session.userId === user.id && session.active)
                .map(session => ({
                    id: session.id,
                    createdAt: session.createdAt,
                    lastActivity: session.lastActivity,
                    ip: session.ip,
                    userAgent: session.userAgent
                }));

            res.json({
                success: true,
                data: {
                    sessions
                }
            });

        } catch (error) {
            console.error('Error obteniendo sesiones:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // HU1: Invalidar sesión específica
    async invalidateSession(req, res) {
        try {
            const { sessionId } = req.params;
            const user = req.user;

            const session = this.userService.sessions.get(sessionId);
            
            if (!session || session.userId !== user.id) {
                return res.status(404).json({
                    success: false,
                    message: 'Sesión no encontrada'
                });
            }

            await this.userService.logout(sessionId);

            res.json({
                success: true,
                message: 'Sesión invalidada exitosamente'
            });

        } catch (error) {
            console.error('Error invalidando sesión:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
}

module.exports = EnhancedAuthController;
