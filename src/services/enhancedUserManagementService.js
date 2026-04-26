const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');

/**
 * HU1 y HU2 - Sistema Completo de Autenticación y Gestión de Usuarios
 * Implementa login, registro, gestión de roles, y operaciones CRUD de usuarios
 */
class EnhancedUserManagementService {
    constructor() {
        this.usersFile = path.join(__dirname, '../../data/users.json');
        this.rolesFile = path.join(__dirname, '../../data/roles.json');
        this.permissionsFile = path.join(__dirname, '../../data/permissions.json');
        this.users = new Map();
        this.roles = new Map();
        this.permissions = new Map();
        this.sessions = new Map(); // Para gestión avanzada de sesiones
        
        this.initializeSystem();
    }

    async initializeSystem() {
        try {
            await this.ensureDataDirectory();
            await this.initializeRoles();
            await this.initializePermissions();
            await this.loadUsers();
            await this.createDefaultUsers();
        } catch (error) {
            console.error('Error inicializando sistema de usuarios:', error);
        }
    }

    async ensureDataDirectory() {
        const dataDir = path.dirname(this.usersFile);
        try {
            await fs.mkdir(dataDir, { recursive: true });
        } catch (error) {
            if (error.code !== 'EEXIST') {
                throw error;
            }
        }
    }

    // HU2: Definir sistema completo de roles y permisos
    async initializeRoles() {
        const roles = [
            {
                id: 'super_admin',
                name: 'Super Administrador',
                description: 'Control total del sistema UnionTech',
                level: 1,
                color: '#e74c3c',
                permissions: [
                    'system_management', 'user_management', 'role_management',
                    'building_management', 'access_control', 'security_monitoring',
                    'reports_full', 'database_management', 'backup_restore',
                    'system_settings', 'audit_logs', 'critical_logs'
                ],
                dashboard: 'super_admin_dashboard',
                defaultRoute: '/admin/system',
                features: {
                    canCreateUsers: true,
                    canDeleteUsers: true,
                    canManageRoles: true,
                    canAccessAllBuildings: true,
                    canExportData: true,
                    canModifySystem: true
                }
            },
            {
                id: 'building_admin',
                name: 'Administrador de Edificio',
                description: 'Gestión completa del edificio asignado',
                level: 2,
                color: '#3498db',
                permissions: [
                    'building_management', 'resident_management', 'visitor_management',
                    'access_control', 'reports_building', 'notifications_management',
                    'guest_approval', 'emergency_management', 'unit_management',
                    'maintenance_coordination', 'security_oversight'
                ],
                dashboard: 'building_admin_dashboard',
                defaultRoute: '/admin/building',
                features: {
                    canCreateResidents: true,
                    canApproveVisitors: true,
                    canManageUnits: true,
                    canAccessReports: true,
                    canManageBuilding: true,
                    buildingScope: true
                }
            },
            {
                id: 'security',
                name: 'Personal de Seguridad',
                description: 'Monitoreo y control de accesos de seguridad',
                level: 3,
                color: '#f39c12',
                permissions: [
                    'access_monitoring', 'visitor_validation', 'incident_reporting',
                    'emergency_response', 'camera_access', 'manual_override',
                    'guest_checkin', 'security_alerts', 'patrol_logging',
                    'key_management', 'visitor_escorts'
                ],
                dashboard: 'security_dashboard',
                defaultRoute: '/security/monitoring',
                features: {
                    canOverrideAccess: true,
                    canViewCameras: true,
                    canManageIncidents: true,
                    canEscortVisitors: true,
                    shiftBased: true,
                    emergencyAccess: true
                }
            },
            {
                id: 'resident',
                name: 'Residente',
                description: 'Propietario o inquilino con acceso al edificio',
                level: 4,
                color: '#27ae60',
                permissions: [
                    'guest_invitation', 'personal_access', 'guest_management',
                    'personal_reports', 'profile_management', 'qr_generation',
                    'notification_preferences', 'family_management',
                    'unit_access', 'parking_management', 'service_requests'
                ],
                dashboard: 'resident_dashboard',
                defaultRoute: '/resident/dashboard',
                features: {
                    canInviteGuests: true,
                    canManageFamily: true,
                    canRequestServices: true,
                    canAccessPersonalReports: true,
                    unitAccess: true,
                    selfManagement: true
                }
            },
            {
                id: 'maintenance',
                name: 'Personal de Mantenimiento',
                description: 'Acceso para servicios y mantenimiento',
                level: 4,
                color: '#9b59b6',
                permissions: [
                    'service_access', 'work_order_management', 'area_access',
                    'equipment_monitoring', 'maintenance_reports', 'schedule_access',
                    'inventory_management', 'tool_checkout', 'safety_protocols'
                ],
                dashboard: 'maintenance_dashboard',
                defaultRoute: '/maintenance/workorders',
                features: {
                    canAccessAllAreas: true,
                    canManageWorkOrders: true,
                    canAccessEquipment: true,
                    canGenerateReports: true,
                    timeTrackingRequired: true,
                    safetyTrainingRequired: true
                }
            },
            {
                id: 'guest',
                name: 'Visitante',
                description: 'Acceso temporal autorizado por residente',
                level: 5,
                color: '#95a5a6',
                permissions: [
                    'limited_access', 'qr_scan', 'check_in_out',
                    'emergency_contact', 'basic_navigation', 'guest_wifi'
                ],
                dashboard: 'guest_dashboard',
                defaultRoute: '/guest/checkin',
                features: {
                    temporaryAccess: true,
                    requiresEscort: false,
                    limitedAreas: true,
                    timeRestricted: true,
                    sponsorRequired: true,
                    autoExpiry: true
                }
            }
        ];

        roles.forEach(role => {
            this.roles.set(role.id, role);
        });

        await this.saveRoles();
    }

    // HU2: Sistema de permisos granular
    async initializePermissions() {
        const permissions = [
            // Permisos de sistema
            { id: 'system_management', name: 'Gestión del Sistema', category: 'system', level: 1 },
            { id: 'user_management', name: 'Gestión de Usuarios', category: 'system', level: 1 },
            { id: 'role_management', name: 'Gestión de Roles', category: 'system', level: 1 },
            { id: 'database_management', name: 'Gestión de Base de Datos', category: 'system', level: 1 },
            { id: 'backup_restore', name: 'Respaldo y Restauración', category: 'system', level: 1 },
            { id: 'system_settings', name: 'Configuración del Sistema', category: 'system', level: 1 },

            // Permisos de edificio
            { id: 'building_management', name: 'Gestión de Edificio', category: 'building', level: 2 },
            { id: 'unit_management', name: 'Gestión de Unidades', category: 'building', level: 2 },
            { id: 'resident_management', name: 'Gestión de Residentes', category: 'building', level: 2 },
            { id: 'maintenance_coordination', name: 'Coordinación de Mantenimiento', category: 'building', level: 2 },

            // Permisos de acceso
            { id: 'access_control', name: 'Control de Acceso', category: 'access', level: 2 },
            { id: 'access_monitoring', name: 'Monitoreo de Accesos', category: 'access', level: 3 },
            { id: 'visitor_management', name: 'Gestión de Visitantes', category: 'access', level: 2 },
            { id: 'visitor_validation', name: 'Validación de Visitantes', category: 'access', level: 3 },
            { id: 'guest_approval', name: 'Aprobación de Invitados', category: 'access', level: 2 },
            { id: 'manual_override', name: 'Anulación Manual', category: 'access', level: 3 },

            // Permisos de seguridad
            { id: 'security_monitoring', name: 'Monitoreo de Seguridad', category: 'security', level: 1 },
            { id: 'camera_access', name: 'Acceso a Cámaras', category: 'security', level: 3 },
            { id: 'incident_reporting', name: 'Reporte de Incidentes', category: 'security', level: 3 },
            { id: 'emergency_response', name: 'Respuesta de Emergencia', category: 'security', level: 3 },
            { id: 'security_alerts', name: 'Alertas de Seguridad', category: 'security', level: 3 },

            // Permisos de reportes
            { id: 'reports_full', name: 'Reportes Completos', category: 'reports', level: 1 },
            { id: 'reports_building', name: 'Reportes del Edificio', category: 'reports', level: 2 },
            { id: 'personal_reports', name: 'Reportes Personales', category: 'reports', level: 4 },
            { id: 'maintenance_reports', name: 'Reportes de Mantenimiento', category: 'reports', level: 4 },

            // Permisos personales
            { id: 'profile_management', name: 'Gestión de Perfil', category: 'personal', level: 4 },
            { id: 'guest_invitation', name: 'Invitación de Huéspedes', category: 'personal', level: 4 },
            { id: 'family_management', name: 'Gestión Familiar', category: 'personal', level: 4 },
            { id: 'notification_preferences', name: 'Preferencias de Notificación', category: 'personal', level: 4 },

            // Permisos especiales
            { id: 'qr_generation', name: 'Generación de QR', category: 'special', level: 4 },
            { id: 'emergency_contact', name: 'Contacto de Emergencia', category: 'special', level: 5 },
            { id: 'audit_logs', name: 'Logs de Auditoría', category: 'special', level: 1 },
            { id: 'critical_logs', name: 'Logs Críticos', category: 'special', level: 1 }
        ];

        permissions.forEach(permission => {
            this.permissions.set(permission.id, permission);
        });

        await this.savePermissions();
    }

    // HU1: Sistema completo de autenticación
    async authenticate(username, password, additionalData = {}) {
        try {
            const user = this.findUserByUsername(username);
            
            if (!user) {
                throw new Error('Usuario no encontrado');
            }

            if (!user.active) {
                throw new Error('Usuario desactivado');
            }

            // Verificar si la cuenta está bloqueada
            if (user.locked && user.lockedUntil && new Date() < new Date(user.lockedUntil)) {
                const unlockTime = new Date(user.lockedUntil).toLocaleString();
                throw new Error(`Cuenta bloqueada hasta ${unlockTime}`);
            }

            // Verificar contraseña
            const isValidPassword = await bcrypt.compare(password, user.passwordHash);
            
            if (!isValidPassword) {
                await this.handleFailedLogin(user.id);
                throw new Error('Contraseña incorrecta');
            }

            // Limpiar intentos fallidos
            await this.clearFailedAttempts(user.id);

            // Generar token JWT
            const token = this.generateToken(user);

            // Crear sesión
            const session = this.createSession(user, additionalData);

            // Actualizar último login
            await this.updateLastLogin(user.id, additionalData.ip, additionalData.userAgent);

            return {
                success: true,
                token,
                sessionId: session.id,
                user: this.sanitizeUser(user),
                role: this.roles.get(user.roleId),
                permissions: this.getUserPermissions(user.roleId),
                expiresIn: '24h'
            };

        } catch (error) {
            throw error;
        }
    }

    // HU1: Gestión de sesiones
    createSession(user, additionalData = {}) {
        const sessionId = this.generateSessionId();
        const session = {
            id: sessionId,
            userId: user.id,
            createdAt: new Date(),
            lastActivity: new Date(),
            ip: additionalData.ip,
            userAgent: additionalData.userAgent,
            active: true
        };

        this.sessions.set(sessionId, session);
        return session;
    }

    // HU1: Validar token y sesión
    async validateSession(token, sessionId = null) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
            const user = this.findUserById(decoded.userId);

            if (!user || !user.active) {
                throw new Error('Usuario no válido');
            }

            // Verificar sesión si se proporciona
            if (sessionId) {
                const session = this.sessions.get(sessionId);
                if (!session || !session.active || session.userId !== user.id) {
                    throw new Error('Sesión no válida');
                }

                // Actualizar actividad de la sesión
                session.lastActivity = new Date();
            }

            return {
                valid: true,
                user: this.sanitizeUser(user),
                role: this.roles.get(user.roleId),
                permissions: this.getUserPermissions(user.roleId)
            };

        } catch (error) {
            return { valid: false, error: error.message };
        }
    }

    // HU1: Logout
    async logout(sessionId, token = null) {
        try {
            if (sessionId && this.sessions.has(sessionId)) {
                const session = this.sessions.get(sessionId);
                session.active = false;
                session.loggedOutAt = new Date();
            }

            // Si se proporciona token, invalidarlo (en implementación real se agregaría a blacklist)
            if (token) {
                // TODO: Agregar a lista negra de tokens
            }

            return { success: true, message: 'Logout exitoso' };

        } catch (error) {
            throw error;
        }
    }

    // HU2: Crear usuario
    async createUser(userData, createdBy) {
        try {
            // Validar permisos del creador
            if (!this.hasPermission(createdBy.roleId, 'user_management')) {
                throw new Error('Sin permisos para crear usuarios');
            }

            // Validar datos requeridos
            this.validateUserData(userData);

            // Verificar si el usuario ya existe
            if (this.findUserByUsername(userData.username) || this.findUserByEmail(userData.email)) {
                throw new Error('El usuario ya existe');
            }

            // Crear usuario
            const userId = this.generateUserId();
            const passwordHash = await bcrypt.hash(userData.password, 12);

            const newUser = {
                id: userId,
                username: userData.username,
                email: userData.email,
                passwordHash,
                roleId: userData.roleId,
                profile: {
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    phone: userData.phone || null,
                    avatar: userData.avatar || null,
                    building: userData.building || null,
                    unit: userData.unit || null,
                    department: userData.department || null,
                    ...userData.profile
                },
                active: true,
                locked: false,
                failedAttempts: 0,
                createdAt: new Date(),
                createdBy: createdBy.id,
                updatedAt: new Date(),
                lastLogin: null,
                settings: {
                    language: 'es',
                    notifications: true,
                    theme: 'light',
                    ...userData.settings
                }
            };

            this.users.set(userId, newUser);
            await this.saveUsers();

            return {
                success: true,
                user: this.sanitizeUser(newUser),
                message: 'Usuario creado exitosamente'
            };

        } catch (error) {
            throw error;
        }
    }

    // HU2: Actualizar usuario
    async updateUser(userId, updateData, updatedBy) {
        try {
            const user = this.findUserById(userId);
            if (!user) {
                throw new Error('Usuario no encontrado');
            }

            // Verificar permisos
            if (!this.hasPermission(updatedBy.roleId, 'user_management') && updatedBy.id !== userId) {
                throw new Error('Sin permisos para actualizar este usuario');
            }

            // Aplicar actualizaciones
            const updatedUser = {
                ...user,
                ...updateData,
                updatedAt: new Date(),
                updatedBy: updatedBy.id
            };

            // Si se actualiza la contraseña, hashearla
            if (updateData.password) {
                updatedUser.passwordHash = await bcrypt.hash(updateData.password, 12);
                delete updatedUser.password;
            }

            this.users.set(userId, updatedUser);
            await this.saveUsers();

            return {
                success: true,
                user: this.sanitizeUser(updatedUser),
                message: 'Usuario actualizado exitosamente'
            };

        } catch (error) {
            throw error;
        }
    }

    // HU2: Eliminar usuario (soft delete)
    async deleteUser(userId, deletedBy) {
        try {
            const user = this.findUserById(userId);
            if (!user) {
                throw new Error('Usuario no encontrado');
            }

            // Verificar permisos
            if (!this.hasPermission(deletedBy.roleId, 'user_management')) {
                throw new Error('Sin permisos para eliminar usuarios');
            }

            // No permitir eliminar super admins
            if (user.roleId === 'super_admin' && deletedBy.roleId !== 'super_admin') {
                throw new Error('No se puede eliminar un super administrador');
            }

            // Soft delete
            user.active = false;
            user.deletedAt = new Date();
            user.deletedBy = deletedBy.id;

            // Invalidar sesiones activas
            this.invalidateUserSessions(userId);

            await this.saveUsers();

            return {
                success: true,
                message: 'Usuario eliminado exitosamente'
            };

        } catch (error) {
            throw error;
        }
    }

    // HU2: Listar usuarios con filtros
    async listUsers(filters = {}, requestedBy) {
        try {
            let users = Array.from(this.users.values());

            // Filtrar según permisos
            if (!this.hasPermission(requestedBy.roleId, 'user_management')) {
                // Solo puede ver su propio perfil
                users = users.filter(user => user.id === requestedBy.id);
            }

            // Aplicar filtros
            if (filters.active !== undefined) {
                users = users.filter(user => user.active === filters.active);
            }

            if (filters.roleId) {
                users = users.filter(user => user.roleId === filters.roleId);
            }

            if (filters.building) {
                users = users.filter(user => user.profile.building === filters.building);
            }

            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                users = users.filter(user => 
                    user.username.toLowerCase().includes(searchTerm) ||
                    user.email.toLowerCase().includes(searchTerm) ||
                    user.profile.firstName?.toLowerCase().includes(searchTerm) ||
                    user.profile.lastName?.toLowerCase().includes(searchTerm)
                );
            }

            // Paginar
            const page = filters.page || 1;
            const limit = filters.limit || 20;
            const offset = (page - 1) * limit;

            const total = users.length;
            const paginatedUsers = users.slice(offset, offset + limit);

            return {
                success: true,
                users: paginatedUsers.map(user => this.sanitizeUser(user)),
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            };

        } catch (error) {
            throw error;
        }
    }

    // Utilidades y helpers
    generateToken(user) {
        return jwt.sign(
            {
                userId: user.id,
                username: user.username,
                roleId: user.roleId,
                building: user.profile.building,
                iat: Date.now()
            },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '24h' }
        );
    }

    generateSessionId() {
        return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateUserId() {
        return 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    sanitizeUser(user) {
        const { passwordHash, ...sanitized } = user;
        return sanitized;
    }

    findUserByUsername(username) {
        return Array.from(this.users.values()).find(user => user.username === username);
    }

    findUserByEmail(email) {
        return Array.from(this.users.values()).find(user => user.email === email);
    }

    findUserById(id) {
        return this.users.get(id);
    }

    hasPermission(roleId, permission) {
        const role = this.roles.get(roleId);
        return role && role.permissions.includes(permission);
    }

    getUserPermissions(roleId) {
        const role = this.roles.get(roleId);
        return role ? role.permissions : [];
    }

    validateUserData(userData) {
        const required = ['username', 'email', 'password', 'firstName', 'lastName', 'roleId'];
        for (const field of required) {
            if (!userData[field]) {
                throw new Error(`Campo requerido: ${field}`);
            }
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userData.email)) {
            throw new Error('Formato de email inválido');
        }

        // Validar rol
        if (!this.roles.has(userData.roleId)) {
            throw new Error('Rol inválido');
        }

        // Validar contraseña
        if (userData.password.length < 8) {
            throw new Error('La contraseña debe tener al menos 8 caracteres');
        }
    }

    async handleFailedLogin(userId) {
        const user = this.findUserById(userId);
        if (user) {
            user.failedAttempts = (user.failedAttempts || 0) + 1;
            user.lastFailedAttempt = new Date();

            // Bloquear cuenta después de 5 intentos fallidos
            if (user.failedAttempts >= 5) {
                user.locked = true;
                user.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos
            }

            await this.saveUsers();
        }
    }

    async clearFailedAttempts(userId) {
        const user = this.findUserById(userId);
        if (user) {
            user.failedAttempts = 0;
            user.locked = false;
            user.lockedUntil = null;
            await this.saveUsers();
        }
    }

    async updateLastLogin(userId, ip, userAgent) {
        const user = this.findUserById(userId);
        if (user) {
            user.lastLogin = new Date();
            user.lastLoginIp = ip;
            user.lastLoginUserAgent = userAgent;
            await this.saveUsers();
        }
    }

    invalidateUserSessions(userId) {
        for (const [sessionId, session] of this.sessions) {
            if (session.userId === userId) {
                session.active = false;
                session.invalidatedAt = new Date();
            }
        }
    }

    // Persistencia de datos
    async loadUsers() {
        try {
            const data = await fs.readFile(this.usersFile, 'utf8');
            const usersArray = JSON.parse(data);
            usersArray.forEach(user => {
                this.users.set(user.id, user);
            });
        } catch (error) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }
    }

    async saveUsers() {
        const usersArray = Array.from(this.users.values());
        await fs.writeFile(this.usersFile, JSON.stringify(usersArray, null, 2));
    }

    async saveRoles() {
        const rolesArray = Array.from(this.roles.values());
        await fs.writeFile(this.rolesFile, JSON.stringify(rolesArray, null, 2));
    }

    async savePermissions() {
        const permissionsArray = Array.from(this.permissions.values());
        await fs.writeFile(this.permissionsFile, JSON.stringify(permissionsArray, null, 2));
    }

    // Crear usuarios por defecto
    async createDefaultUsers() {
        // Solo crear si no existen usuarios
        if (this.users.size === 0) {
            const defaultUsers = [
                {
                    username: 'admin',
                    email: 'admin@uniontech.com',
                    password: 'admin123',
                    firstName: 'Administrador',
                    lastName: 'Sistema',
                    roleId: 'super_admin',
                    profile: {
                        phone: '+1234567890',
                        building: null,
                        unit: null,
                        department: 'TI'
                    }
                },
                {
                    username: 'edificio.admin',
                    email: 'edificio@uniontech.com',
                    password: 'edificio123',
                    firstName: 'Carlos',
                    lastName: 'Méndez',
                    roleId: 'building_admin',
                    profile: {
                        phone: '+1234567891',
                        building: 'Torre A',
                        unit: null,
                        department: 'Administración'
                    }
                },
                {
                    username: 'seguridad',
                    email: 'seguridad@uniontech.com',
                    password: 'seguridad123',
                    firstName: 'José',
                    lastName: 'Ramírez',
                    roleId: 'security',
                    profile: {
                        phone: '+1234567892',
                        building: 'Torre A',
                        unit: null,
                        department: 'Seguridad'
                    }
                }
            ];

            const systemUser = { id: 'system', roleId: 'super_admin' };

            for (const userData of defaultUsers) {
                try {
                    await this.createUser(userData, systemUser);
                } catch (error) {
                    console.error(`Error creando usuario ${userData.username}:`, error.message);
                }
            }
        }
    }

    // Obtener estadísticas del sistema
    getSystemStats() {
        const totalUsers = this.users.size;
        const activeUsers = Array.from(this.users.values()).filter(user => user.active).length;
        const roleDistribution = {};
        const activeSessions = Array.from(this.sessions.values()).filter(session => session.active).length;

        // Contar usuarios por rol
        for (const role of this.roles.keys()) {
            roleDistribution[role] = Array.from(this.users.values())
                .filter(user => user.roleId === role && user.active).length;
        }

        return {
            totalUsers,
            activeUsers,
            inactiveUsers: totalUsers - activeUsers,
            roleDistribution,
            activeSessions,
            totalRoles: this.roles.size,
            totalPermissions: this.permissions.size
        };
    }

    // ===== MÉTODOS ADICIONALES PARA CRUD COMPLETO =====

    /**
     * Obtener usuarios con filtros y paginación
     */
    async getUsers(filters = {}) {
        const { page = 1, limit = 20, role, active, search } = filters;
        let userList = Array.from(this.users.values());

        // Aplicar filtros
        if (role) {
            userList = userList.filter(user => user.role === role);
        }

        if (active !== undefined) {
            userList = userList.filter(user => user.active === active);
        }

        if (search) {
            const searchLower = search.toLowerCase();
            userList = userList.filter(user => 
                user.username.toLowerCase().includes(searchLower) ||
                user.email.toLowerCase().includes(searchLower) ||
                user.firstName.toLowerCase().includes(searchLower) ||
                user.lastName.toLowerCase().includes(searchLower)
            );
        }

        // Paginación
        const total = userList.length;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedUsers = userList.slice(startIndex, endIndex);

        // Remover información sensible
        const safeUsers = paginatedUsers.map(user => {
            const { password, ...safeUser } = user;
            return safeUser;
        });

        return {
            users: safeUsers,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: endIndex < total,
                hasPrev: page > 1
            }
        };
    }

    /**
     * Obtener usuario por ID
     */
    async getUserById(userId) {
        const user = this.users.get(userId);
        if (!user) {
            return null;
        }

        const { password, ...safeUser } = user;
        return safeUser;
    }

    /**
     * Cambiar contraseña de usuario
     */
    async changePassword(userId, currentPassword, newPassword) {
        const user = this.users.get(userId);
        if (!user) {
            return { success: false, message: 'Usuario no encontrado' };
        }

        // Verificar contraseña actual
        const isCurrentValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentValid) {
            return { success: false, message: 'Contraseña actual incorrecta' };
        }

        // Hashear nueva contraseña
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Actualizar usuario
        user.password = hashedPassword;
        user.lastPasswordChange = new Date().toISOString();
        user.updatedAt = new Date().toISOString();

        this.users.set(userId, user);
        await this.saveUsers();

        return { success: true, message: 'Contraseña cambiada exitosamente' };
    }

    /**
     * Cambiar rol de usuario
     */
    async changeUserRole(userId, newRole, changedBy, reason = '') {
        const user = this.users.get(userId);
        if (!user) {
            return { success: false, message: 'Usuario no encontrado' };
        }

        if (!this.roles.has(newRole)) {
            return { success: false, message: 'Rol no válido' };
        }

        const oldRole = user.role;
        user.role = newRole;
        user.updatedAt = new Date().toISOString();
        user.updatedBy = changedBy;

        // Agregar al historial de cambios
        if (!user.roleHistory) {
            user.roleHistory = [];
        }

        user.roleHistory.push({
            from: oldRole,
            to: newRole,
            changedBy,
            reason,
            timestamp: new Date().toISOString()
        });

        this.users.set(userId, user);
        await this.saveUsers();

        const { password, ...safeUser } = user;
        return { success: true, user: safeUser };
    }

    /**
     * Obtener roles disponibles
     */
    async getAvailableRoles() {
        return Array.from(this.roles.values());
    }

    /**
     * Obtener permisos de usuario
     */
    async getUserPermissions(userId) {
        const user = this.users.get(userId);
        if (!user) {
            return null;
        }

        const role = this.roles.get(user.role);
        if (!role) {
            return [];
        }

        const permissions = role.permissions.map(permissionId => {
            return this.permissions.get(permissionId);
        }).filter(Boolean);

        return {
            userId,
            role: role.name,
            permissions
        };
    }

    /**
     * Activar usuario
     */
    async activateUser(userId, activatedBy) {
        const user = this.users.get(userId);
        if (!user) {
            return { success: false, message: 'Usuario no encontrado' };
        }

        user.active = true;
        user.updatedAt = new Date().toISOString();
        user.updatedBy = activatedBy;

        this.users.set(userId, user);
        await this.saveUsers();

        const { password, ...safeUser } = user;
        return { success: true, user: safeUser };
    }

    /**
     * Desactivar usuario
     */
    async deactivateUser(userId, deactivatedBy, reason = '') {
        const user = this.users.get(userId);
        if (!user) {
            return { success: false, message: 'Usuario no encontrado' };
        }

        user.active = false;
        user.deactivatedAt = new Date().toISOString();
        user.deactivatedBy = deactivatedBy;
        user.deactivationReason = reason;
        user.updatedAt = new Date().toISOString();
        user.updatedBy = deactivatedBy;

        this.users.set(userId, user);
        await this.saveUsers();

        const { password, ...safeUser } = user;
        return { success: true, user: safeUser };
    }

    /**
     * Obtener estadísticas de usuarios
     */
    async getUserStatistics() {
        const users = Array.from(this.users.values());
        const roles = Array.from(this.roles.values());

        const stats = {
            total: users.length,
            active: users.filter(u => u.active).length,
            inactive: users.filter(u => !u.active).length,
            byRole: {},
            byStatus: {
                never_logged_in: users.filter(u => !u.lastLogin).length,
                logged_in_today: 0,
                logged_in_week: 0,
                logged_in_month: 0
            },
            recentRegistrations: users.filter(u => {
                const createdDate = new Date(u.createdAt);
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return createdDate > weekAgo;
            }).length
        };

        // Estadísticas por rol
        roles.forEach(role => {
            stats.byRole[role.name] = users.filter(u => u.role === role.id).length;
        });

        // Estadísticas de logins recientes
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        users.forEach(user => {
            if (user.lastLogin) {
                const lastLogin = new Date(user.lastLogin);
                if (lastLogin >= today) {
                    stats.byStatus.logged_in_today++;
                }
                if (lastLogin >= weekAgo) {
                    stats.byStatus.logged_in_week++;
                }
                if (lastLogin >= monthAgo) {
                    stats.byStatus.logged_in_month++;
                }
            }
        });

        return stats;
    }
}

module.exports = EnhancedUserManagementService;
