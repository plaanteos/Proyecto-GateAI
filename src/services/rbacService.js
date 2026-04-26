/**
 * Servicio RBAC (Role-Based Access Control) Granular
 * Sistema de control de acceso basado en roles con permisos granulares
 */

const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');
const redisService = require('./redisService');

class RBACService {
    constructor() {
        this.prisma = new PrismaClient();
        this.permissionCache = new Map();
        this.roleHierarchy = new Map();
        
        // Inicializar después de que Prisma esté listo
        this.initialize();
    }

    async initialize() {
        try {
            await this.initializeDefaultRoles();
            logger.info('✅ RBAC Service inicializado correctamente');
        } catch (error) {
            logger.error('❌ Error inicializando RBAC Service:', error);
        }
    }

    /**
     * Inicializa roles y permisos por defecto
     */
    async initializeDefaultRoles() {
        try {
            // Definir permisos por módulo
            const permissions = [
                // Gestión de usuarios
                'users.create', 'users.read', 'users.update', 'users.delete', 'users.manage_roles',
                
                // Gestión de invitaciones
                'invitations.create', 'invitations.read', 'invitations.update', 'invitations.delete',
                'invitations.approve', 'invitations.extend', 'invitations.revoke',
                
                // Control de accesos
                'access.validate', 'access.manual_register', 'access.view_logs', 'access.manage',
                
                // Empleados de mantenimiento
                'maintenance.create', 'maintenance.read', 'maintenance.update', 'maintenance.delete',
                'maintenance.manage_credentials', 'maintenance.view_logs',
                
                // Reportes y análisis
                'reports.view', 'reports.export', 'reports.analytics', 'reports.advanced',
                
                // Configuración del sistema
                'system.config', 'system.maintenance', 'system.logs', 'system.backup',
                
                // Edificios y zonas
                'buildings.create', 'buildings.read', 'buildings.update', 'buildings.delete',
                'zones.manage', 'doors.manage',
                
                // Dashboard y monitoreo
                'dashboard.view', 'dashboard.realtime', 'dashboard.admin',
                
                // Auditoría y seguridad
                'audit.view', 'audit.export', 'security.manage', 'security.alerts'
            ];

            // Crear permisos si no existen
            for (const permission of permissions) {
                await this.createPermissionIfNotExists(permission);
            }

            // Definir roles con sus permisos
            const roles = [
                {
                    name: 'SUPER_ADMIN',
                    description: 'Administrador con acceso completo al sistema',
                    permissions: permissions // Todos los permisos
                },
                {
                    name: 'ADMIN',
                    description: 'Administrador del sistema con permisos amplios',
                    permissions: [
                        'users.create', 'users.read', 'users.update', 'users.manage_roles',
                        'invitations.create', 'invitations.read', 'invitations.update', 'invitations.approve', 'invitations.extend',
                        'access.validate', 'access.manual_register', 'access.view_logs',
                        'maintenance.create', 'maintenance.read', 'maintenance.update', 'maintenance.manage_credentials',
                        'reports.view', 'reports.export', 'reports.analytics',
                        'buildings.read', 'buildings.update', 'zones.manage', 'doors.manage',
                        'dashboard.view', 'dashboard.realtime',
                        'audit.view'
                    ]
                },
                {
                    name: 'SECURITY_MANAGER',
                    description: 'Gestor de seguridad con permisos de control de acceso',
                    permissions: [
                        'users.read',
                        'invitations.create', 'invitations.read', 'invitations.update', 'invitations.approve',
                        'access.validate', 'access.manual_register', 'access.view_logs', 'access.manage',
                        'maintenance.read', 'maintenance.view_logs',
                        'reports.view', 'reports.export',
                        'buildings.read', 'zones.manage',
                        'dashboard.view', 'dashboard.realtime',
                        'security.manage', 'security.alerts'
                    ]
                },
                {
                    name: 'RECEPTION',
                    description: 'Personal de recepción con permisos básicos',
                    permissions: [
                        'invitations.create', 'invitations.read', 'invitations.update',
                        'access.validate', 'access.manual_register',
                        'maintenance.read',
                        'reports.view',
                        'buildings.read',
                        'dashboard.view'
                    ]
                },
                {
                    name: 'MAINTENANCE_SUPERVISOR',
                    description: 'Supervisor de mantenimiento',
                    permissions: [
                        'maintenance.create', 'maintenance.read', 'maintenance.update', 'maintenance.manage_credentials', 'maintenance.view_logs',
                        'access.view_logs',
                        'reports.view',
                        'buildings.read', 'zones.manage',
                        'dashboard.view'
                    ]
                },
                {
                    name: 'VIEWER',
                    description: 'Usuario con permisos de solo lectura',
                    permissions: [
                        'invitations.read',
                        'access.view_logs',
                        'maintenance.read',
                        'reports.view',
                        'buildings.read',
                        'dashboard.view'
                    ]
                }
            ];

            // Crear roles si no existen
            for (const roleData of roles) {
                await this.createRoleIfNotExists(roleData);
            }

            logger.info('✅ Sistema RBAC inicializado con roles y permisos por defecto');

        } catch (error) {
            logger.error('Error inicializando RBAC:', error);
        }
    }

    /**
     * Crea un permiso si no existe
     */
    async createPermissionIfNotExists(permissionName) {
        try {
            const existing = await this.prisma.permisos.findUnique({
                where: { nombre: permissionName }
            });

            if (!existing) {
                const [module, action] = permissionName.split('.');
                
                await this.prisma.permisos.create({
                    data: {
                        nombre: permissionName,
                        descripcion: `Permiso para ${action} en módulo ${module}`,
                        modulo: module,
                        accion: action,
                        activo: true
                    }
                });
            }

        } catch (error) {
            logger.error(`Error creando permiso ${permissionName}:`, error);
        }
    }

    /**
     * Crea un rol si no existe
     */
    async createRoleIfNotExists(roleData) {
        try {
            let role = await this.prisma.roles.findUnique({
                where: { nombre: roleData.name }
            });

            if (!role) {
                role = await this.prisma.roles.create({
                    data: {
                        nombre: roleData.name,
                        descripcion: roleData.description,
                        activo: true
                    }
                });
            }

            // Asignar permisos al rol
            for (const permissionName of roleData.permissions) {
                await this.assignPermissionToRole(role.id, permissionName);
            }

        } catch (error) {
            logger.error(`Error creando rol ${roleData.name}:`, error);
        }
    }

    /**
     * Asigna un permiso a un rol
     */
    async assignPermissionToRole(roleId, permissionName) {
        try {
            const permission = await this.prisma.permisos.findUnique({
                where: { nombre: permissionName }
            });

            if (!permission) {
                logger.warn(`Permiso no encontrado: ${permissionName}`);
                return;
            }

            const existing = await this.prisma.rol_permisos.findFirst({
                where: {
                    rol_id: roleId,
                    permiso_id: permission.id
                }
            });

            if (!existing) {
                await this.prisma.rol_permisos.create({
                    data: {
                        rol_id: roleId,
                        permiso_id: permission.id,
                        activo: true
                    }
                });
            }

        } catch (error) {
            logger.error(`Error asignando permiso ${permissionName} a rol ${roleId}:`, error);
        }
    }

    /**
     * Verifica si un usuario tiene un permiso específico
     */
    async hasPermission(userId, permissionName) {
        try {
            // Verificar cache primero
            const cacheKey = `rbac:user:${userId}:permission:${permissionName}`;
            const cached = await redisService.get(cacheKey);
            
            if (cached !== null) {
                return cached;
            }

            // Obtener permisos del usuario
            const userPermissions = await this.getUserPermissions(userId);
            const hasPermission = userPermissions.includes(permissionName);

            // Cachear resultado por 10 minutos
            await redisService.set(cacheKey, hasPermission, 600);

            return hasPermission;

        } catch (error) {
            logger.error(`Error verificando permiso ${permissionName} para usuario ${userId}:`, error);
            return false;
        }
    }

    /**
     * Obtiene todos los permisos de un usuario
     */
    async getUserPermissions(userId) {
        try {
            // Verificar cache
            const cacheKey = `rbac:user:${userId}:permissions`;
            const cached = await redisService.get(cacheKey);
            
            if (cached) {
                return cached;
            }

            const user = await this.prisma.usuarios.findUnique({
                where: { id: userId },
                include: {
                    rol: {
                        include: {
                            permisos: {
                                include: {
                                    permiso: true
                                },
                                where: { activo: true }
                            }
                        }
                    },
                    permisos_adicionales: {
                        include: {
                            permiso: true
                        },
                        where: { activo: true }
                    }
                }
            });

            if (!user) {
                return [];
            }

            // Permisos del rol
            const rolePermissions = user.rol.permisos.map(rp => rp.permiso.nombre);
            
            // Permisos adicionales del usuario
            const additionalPermissions = user.permisos_adicionales.map(up => up.permiso.nombre);

            // Combinar y eliminar duplicados
            const allPermissions = [...new Set([...rolePermissions, ...additionalPermissions])];

            // Cachear por 5 minutos
            await redisService.set(cacheKey, allPermissions, 300);

            return allPermissions;

        } catch (error) {
            logger.error(`Error obteniendo permisos para usuario ${userId}:`, error);
            return [];
        }
    }

    /**
     * Verifica múltiples permisos a la vez
     */
    async hasAnyPermission(userId, permissions) {
        try {
            const userPermissions = await this.getUserPermissions(userId);
            return permissions.some(permission => userPermissions.includes(permission));

        } catch (error) {
            logger.error('Error verificando múltiples permisos:', error);
            return false;
        }
    }

    /**
     * Verifica si tiene todos los permisos requeridos
     */
    async hasAllPermissions(userId, permissions) {
        try {
            const userPermissions = await this.getUserPermissions(userId);
            return permissions.every(permission => userPermissions.includes(permission));

        } catch (error) {
            logger.error('Error verificando todos los permisos:', error);
            return false;
        }
    }

    /**
     * Asigna un permiso adicional a un usuario
     */
    async grantUserPermission(userId, permissionName, grantedBy) {
        try {
            const permission = await this.prisma.permisos.findUnique({
                where: { nombre: permissionName }
            });

            if (!permission) {
                throw new Error(`Permiso no encontrado: ${permissionName}`);
            }

            const existing = await this.prisma.usuario_permisos.findFirst({
                where: {
                    usuario_id: userId,
                    permiso_id: permission.id
                }
            });

            if (existing) {
                if (!existing.activo) {
                    await this.prisma.usuario_permisos.update({
                        where: { id: existing.id },
                        data: {
                            activo: true,
                            updated_at: new Date()
                        }
                    });
                }
            } else {
                await this.prisma.usuario_permisos.create({
                    data: {
                        usuario_id: userId,
                        permiso_id: permission.id,
                        otorgado_por: grantedBy,
                        activo: true
                    }
                });
            }

            // Limpiar cache
            await this.clearUserPermissionCache(userId);

            // Registrar auditoría
            await this.prisma.auditoria.create({
                data: {
                    usuario_id: grantedBy,
                    accion: 'GRANT_PERMISSION',
                    tabla_afectada: 'UsuarioPermisos',
                    registro_id: userId,
                    valores_nuevos: { permiso: permissionName },
                    ip_address: '127.0.0.1',
                    user_agent: 'System'
                }
            });

            logger.info(`✅ Permiso ${permissionName} otorgado a usuario ${userId} por ${grantedBy}`);

            return {
                success: true,
                message: 'Permiso otorgado exitosamente'
            };

        } catch (error) {
            logger.error('Error otorgando permiso:', error);
            throw error;
        }
    }

    /**
     * Revoca un permiso de un usuario
     */
    async revokeUserPermission(userId, permissionName, revokedBy) {
        try {
            const permission = await this.prisma.permisos.findUnique({
                where: { nombre: permissionName }
            });

            if (!permission) {
                throw new Error(`Permiso no encontrado: ${permissionName}`);
            }

            const userPermission = await this.prisma.usuario_permisos.findFirst({
                where: {
                    usuario_id: userId,
                    permiso_id: permission.id,
                    activo: true
                }
            });

            if (userPermission) {
                await this.prisma.usuario_permisos.update({
                    where: { id: userPermission.id },
                    data: {
                        activo: false,
                        revocado_por: revokedBy,
                        fecha_revocacion: new Date(),
                        updated_at: new Date()
                    }
                });

                // Limpiar cache
                await this.clearUserPermissionCache(userId);

                // Registrar auditoría
                await this.prisma.auditoria.create({
                    data: {
                        usuario_id: revokedBy,
                        accion: 'REVOKE_PERMISSION',
                        tabla_afectada: 'UsuarioPermisos',
                        registro_id: userId,
                        valores_anteriores: { permiso: permissionName },
                        ip_address: '127.0.0.1',
                        user_agent: 'System'
                    }
                });

                logger.info(`🚫 Permiso ${permissionName} revocado de usuario ${userId} por ${revokedBy}`);
            }

            return {
                success: true,
                message: 'Permiso revocado exitosamente'
            };

        } catch (error) {
            logger.error('Error revocando permiso:', error);
            throw error;
        }
    }

    /**
     * Cambia el rol de un usuario
     */
    async changeUserRole(userId, newRoleId, changedBy) {
        try {
            const user = await this.prisma.usuarios.findUnique({
                where: { id: userId },
                include: { rol: true }
            });

            if (!user) {
                throw new Error('Usuario no encontrado');
            }

            const newRole = await this.prisma.roles.findUnique({
                where: { id: newRoleId }
            });

            if (!newRole) {
                throw new Error('Rol no encontrado');
            }

            const oldRole = user.rol;

            await this.prisma.usuarios.update({
                where: { id: userId },
                data: {
                    rol_id: newRoleId,
                    updated_at: new Date()
                }
            });

            // Limpiar cache
            await this.clearUserPermissionCache(userId);

            // Registrar auditoría
            await this.prisma.auditoria.create({
                data: {
                    usuario_id: changedBy,
                    accion: 'CHANGE_USER_ROLE',
                    tabla_afectada: 'Usuarios',
                    registro_id: userId,
                    valores_anteriores: { rol: oldRole.nombre },
                    valores_nuevos: { rol: newRole.nombre },
                    ip_address: '127.0.0.1',
                    user_agent: 'System'
                }
            });

            logger.info(`🔄 Rol de usuario ${userId} cambiado de ${oldRole.nombre} a ${newRole.nombre} por ${changedBy}`);

            return {
                success: true,
                message: 'Rol cambiado exitosamente',
                oldRole: oldRole.nombre,
                newRole: newRole.nombre
            };

        } catch (error) {
            logger.error('Error cambiando rol de usuario:', error);
            throw error;
        }
    }

    /**
     * Obtiene todos los roles disponibles
     */
    async getAllRoles() {
        try {
            return await this.prisma.roles.findMany({
                where: { activo: true },
                include: {
                    permisos: {
                        include: {
                            permiso: true
                        },
                        where: { activo: true }
                    }
                },
                orderBy: { nombre: 'asc' }
            });

        } catch (error) {
            logger.error('Error obteniendo roles:', error);
            return [];
        }
    }

    /**
     * Obtiene todos los permisos disponibles
     */
    async getAllPermissions() {
        try {
            return await this.prisma.permisos.findMany({
                where: { activo: true },
                orderBy: ['modulo', 'accion']
            });

        } catch (error) {
            logger.error('Error obteniendo permisos:', error);
            return [];
        }
    }

    /**
     * Middleware para verificar permisos
     */
    requirePermission(permissionName) {
        return async (req, res, next) => {
            try {
                if (!req.user || !req.user.id) {
                    return res.status(401).json({
                        success: false,
                        message: 'No autenticado'
                    });
                }

                const hasPermission = await this.hasPermission(req.user.id, permissionName);

                if (!hasPermission) {
                    logger.warn(`Acceso denegado: Usuario ${req.user.id} sin permiso ${permissionName}`);
                    return res.status(403).json({
                        success: false,
                        message: `Acceso denegado. Permiso requerido: ${permissionName}`
                    });
                }

                next();

            } catch (error) {
                logger.error('Error en middleware de permisos:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Error interno del servidor'
                });
            }
        };
    }

    /**
     * Middleware para verificar múltiples permisos (cualquiera)
     */
    requireAnyPermission(permissions) {
        return async (req, res, next) => {
            try {
                if (!req.user || !req.user.id) {
                    return res.status(401).json({
                        success: false,
                        message: 'No autenticado'
                    });
                }

                const hasAnyPermission = await this.hasAnyPermission(req.user.id, permissions);

                if (!hasAnyPermission) {
                    logger.warn(`Acceso denegado: Usuario ${req.user.id} sin ningún permiso de ${permissions.join(', ')}`);
                    return res.status(403).json({
                        success: false,
                        message: `Acceso denegado. Se requiere alguno de estos permisos: ${permissions.join(', ')}`
                    });
                }

                next();

            } catch (error) {
                logger.error('Error en middleware de múltiples permisos:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Error interno del servidor'
                });
            }
        };
    }

    /**
     * Limpia el cache de permisos de un usuario
     */
    async clearUserPermissionCache(userId) {
        try {
            const patterns = [
                `rbac:user:${userId}:permissions`,
                `rbac:user:${userId}:permission:*`
            ];

            for (const pattern of patterns) {
                await redisService.clearPattern(pattern);
            }

        } catch (error) {
            logger.error('Error limpiando cache de permisos:', error);
        }
    }

    /**
     * Obtiene resumen de permisos de un usuario
     */
    async getUserPermissionSummary(userId) {
        try {
            const user = await this.prisma.usuarios.findUnique({
                where: { id: userId },
                include: {
                    rol: {
                        include: {
                            permisos: {
                                include: {
                                    permiso: true
                                },
                                where: { activo: true }
                            }
                        }
                    },
                    permisos_adicionales: {
                        include: {
                            permiso: true
                        },
                        where: { activo: true }
                    }
                }
            });

            if (!user) {
                return null;
            }

            const rolePermissions = user.rol.permisos.map(rp => ({
                ...rp.permiso,
                source: 'role',
                roleName: user.rol.nombre
            }));

            const additionalPermissions = user.permisos_adicionales.map(up => ({
                ...up.permiso,
                source: 'additional',
                grantedAt: up.created_at
            }));

            return {
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.rol.nombre
                },
                permissions: {
                    fromRole: rolePermissions,
                    additional: additionalPermissions,
                    total: rolePermissions.length + additionalPermissions.length
                }
            };

        } catch (error) {
            logger.error('Error obteniendo resumen de permisos:', error);
            return null;
        }
    }
}

// Crear instancia singleton
let rbacInstance = null;

function getRBACInstance() {
    if (!rbacInstance) {
        rbacInstance = new RBACService();
    }
    return rbacInstance;
}

module.exports = { RBACService, getRBACInstance };
