// Sistema de Gestión de Usuarios y Roles - UnionTech
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class UserManagementSystem {
    constructor() {
        this.users = new Map();
        this.roles = new Map();
        this.permissions = new Map();
        this.initializeRoles();
        this.initializeDefaultUsers();
    }

    // Definir roles del sistema
    initializeRoles() {
        // Super Administrador - Control total del sistema
        this.roles.set('super_admin', {
            id: 'super_admin',
            name: 'Super Administrador',
            description: 'Control total del sistema',
            level: 1,
            permissions: [
                'system_management', 'user_management', 'building_management',
                'access_control', 'security_monitoring', 'reports_full',
                'database_management', 'backup_restore', 'system_settings'
            ],
            dashboard: 'super_admin_dashboard',
            defaultRoute: '/admin/system'
        });

        // Administrador de Edificio - Gestión del edificio específico
        this.roles.set('building_admin', {
            id: 'building_admin',
            name: 'Administrador de Edificio',
            description: 'Gestión completa del edificio',
            level: 2,
            permissions: [
                'building_management', 'resident_management', 'visitor_management',
                'access_control', 'reports_building', 'notifications_management',
                'guest_approval', 'emergency_management'
            ],
            dashboard: 'building_admin_dashboard',
            defaultRoute: '/admin/building'
        });

        // Personal de Seguridad - Monitoreo y control de accesos
        this.roles.set('security', {
            id: 'security',
            name: 'Personal de Seguridad',
            description: 'Monitoreo y control de accesos',
            level: 3,
            permissions: [
                'access_monitoring', 'visitor_validation', 'incident_reporting',
                'emergency_response', 'camera_access', 'manual_override',
                'guest_checkin', 'security_alerts'
            ],
            dashboard: 'security_dashboard',
            defaultRoute: '/security/monitoring'
        });

        // Residente/Propietario - Gestión personal y de invitados
        this.roles.set('resident', {
            id: 'resident',
            name: 'Residente',
            description: 'Propietario o inquilino del edificio',
            level: 4,
            permissions: [
                'guest_invitation', 'personal_access', 'guest_management',
                'personal_reports', 'profile_management', 'qr_generation',
                'notification_preferences', 'family_management'
            ],
            dashboard: 'resident_dashboard',
            defaultRoute: '/resident/dashboard'
        });

        // Visitante Autorizado - Acceso temporal específico
        this.roles.set('guest', {
            id: 'guest',
            name: 'Visitante',
            description: 'Acceso temporal autorizado',
            level: 5,
            permissions: [
                'limited_access', 'qr_scan', 'check_in_out',
                'emergency_contact', 'basic_navigation'
            ],
            dashboard: 'guest_dashboard',
            defaultRoute: '/guest/checkin'
        });

        // Personal de Mantenimiento - Acceso para servicios
        this.roles.set('maintenance', {
            id: 'maintenance',
            name: 'Mantenimiento',
            description: 'Personal de mantenimiento y servicios',
            level: 4,
            permissions: [
                'service_access', 'work_order_management', 'area_access',
                'equipment_monitoring', 'maintenance_reports', 'schedule_access'
            ],
            dashboard: 'maintenance_dashboard',
            defaultRoute: '/maintenance/workorders'
        });
    }

    // Usuarios por defecto del sistema
    async initializeDefaultUsers() {
        const users = [
            {
                id: 'admin001',
                email: 'admin@uniontech.com',
                password: 'admin123',
                name: 'Administrador Sistema',
                role: 'super_admin',
                building: null,
                unit: null,
                status: 'active',
                createdAt: new Date(),
                profile: {
                    phone: '+1234567890',
                    avatar: null,
                    preferences: {
                        language: 'es',
                        notifications: true,
                        theme: 'dark'
                    }
                }
            },
            {
                id: 'building001',
                email: 'admin.edificio@uniontech.com',
                password: 'building123',
                name: 'Carlos Méndez',
                role: 'building_admin',
                building: 'TORRE_A',
                unit: null,
                status: 'active',
                createdAt: new Date(),
                profile: {
                    phone: '+1234567891',
                    avatar: null,
                    preferences: {
                        language: 'es',
                        notifications: true,
                        theme: 'light'
                    }
                }
            },
            {
                id: 'security001',
                email: 'seguridad@uniontech.com',
                password: 'security123',
                name: 'José Ramírez',
                role: 'security',
                building: 'TORRE_A',
                unit: null,
                status: 'active',
                shift: 'morning',
                createdAt: new Date(),
                profile: {
                    phone: '+1234567892',
                    avatar: null,
                    badgeNumber: 'SEC001',
                    preferences: {
                        language: 'es',
                        notifications: true,
                        theme: 'dark'
                    }
                }
            },
            {
                id: 'resident001',
                email: 'maria.garcia@email.com',
                password: 'resident123',
                name: 'María García',
                role: 'resident',
                building: 'TORRE_A',
                unit: '304',
                status: 'active',
                createdAt: new Date(),
                profile: {
                    phone: '+1234567893',
                    avatar: null,
                    familyMembers: [
                        { name: 'Juan García', relationship: 'spouse', phone: '+1234567894' },
                        { name: 'Ana García', relationship: 'daughter', phone: '+1234567895' }
                    ],
                    preferences: {
                        language: 'es',
                        notifications: true,
                        theme: 'light'
                    }
                }
            }
        ];

        for (const userData of users) {
            const hashedPassword = await bcrypt.hash(userData.password, 12);
            userData.password = hashedPassword;
            this.users.set(userData.id, userData);
        }
    }

    // Autenticación de usuario
    async authenticateUser(email, password) {
        const user = Array.from(this.users.values()).find(u => u.email === email);
        
        if (!user) {
            throw new Error('Usuario no encontrado');
        }

        if (user.status !== 'active') {
            throw new Error('Usuario inactivo');
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            throw new Error('Contraseña incorrecta');
        }

        const role = this.roles.get(user.role);
        const token = jwt.sign(
            { 
                userId: user.id, 
                email: user.email, 
                role: user.role,
                building: user.building,
                unit: user.unit
            },
            process.env.JWT_SECRET || 'default_secret',
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        return {
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                roleName: role.name,
                building: user.building,
                unit: user.unit,
                permissions: role.permissions,
                dashboard: role.dashboard,
                defaultRoute: role.defaultRoute,
                profile: user.profile
            }
        };
    }

    // Verificar permisos
    hasPermission(userRole, permission) {
        const role = this.roles.get(userRole);
        return role && role.permissions.includes(permission);
    }

    // Obtener datos del dashboard según el rol
    getDashboardData(userRole, userId) {
        const role = this.roles.get(userRole);
        const user = this.users.get(userId);

        switch (userRole) {
            case 'super_admin':
                return this.getSuperAdminDashboard();
            case 'building_admin':
                return this.getBuildingAdminDashboard(user.building);
            case 'security':
                return this.getSecurityDashboard(user.building);
            case 'resident':
                return this.getResidentDashboard(user.building, user.unit);
            case 'guest':
                return this.getGuestDashboard(userId);
            case 'maintenance':
                return this.getMaintenanceDashboard(user.building);
            default:
                return { error: 'Rol no reconocido' };
        }
    }

    // Dashboard específicos por rol
    getSuperAdminDashboard() {
        return {
            title: 'Panel de Super Administrador',
            widgets: [
                { type: 'system_status', title: 'Estado del Sistema' },
                { type: 'user_stats', title: 'Estadísticas de Usuarios' },
                { type: 'building_overview', title: 'Resumen de Edificios' },
                { type: 'security_alerts', title: 'Alertas de Seguridad' },
                { type: 'system_logs', title: 'Logs del Sistema' },
                { type: 'database_status', title: 'Estado de Base de Datos' }
            ],
            quickActions: [
                'Gestionar Usuarios', 'Configurar Sistema', 'Ver Reportes',
                'Backup Base de Datos', 'Monitoreo en Tiempo Real'
            ]
        };
    }

    getBuildingAdminDashboard(building) {
        return {
            title: `Panel de Administración - ${building}`,
            widgets: [
                { type: 'residents_summary', title: 'Resumen de Residentes' },
                { type: 'visitor_stats', title: 'Estadísticas de Visitantes' },
                { type: 'access_log', title: 'Registro de Accesos' },
                { type: 'pending_approvals', title: 'Aprobaciones Pendientes' },
                { type: 'maintenance_requests', title: 'Solicitudes de Mantenimiento' },
                { type: 'notifications', title: 'Notificaciones' }
            ],
            quickActions: [
                'Aprobar Visitantes', 'Gestionar Residentes', 'Ver Reportes',
                'Enviar Notificaciones', 'Configurar Accesos'
            ]
        };
    }

    getSecurityDashboard(building) {
        return {
            title: `Monitoreo de Seguridad - ${building}`,
            widgets: [
                { type: 'live_monitoring', title: 'Monitoreo en Vivo' },
                { type: 'pending_visitors', title: 'Visitantes Pendientes' },
                { type: 'recent_incidents', title: 'Incidentes Recientes' },
                { type: 'camera_feed', title: 'Cámaras de Seguridad' },
                { type: 'access_alerts', title: 'Alertas de Acceso' },
                { type: 'emergency_contacts', title: 'Contactos de Emergencia' }
            ],
            quickActions: [
                'Validar Visitante', 'Reportar Incidente', 'Acceso Manual',
                'Activar Alarma', 'Ver Cámaras'
            ]
        };
    }

    getResidentDashboard(building, unit) {
        return {
            title: `Mi Hogar - ${building} ${unit}`,
            widgets: [
                { type: 'my_guests', title: 'Mis Invitados' },
                { type: 'access_history', title: 'Historial de Accesos' },
                { type: 'family_members', title: 'Miembros de la Familia' },
                { type: 'qr_codes', title: 'Códigos QR Activos' },
                { type: 'notifications', title: 'Notificaciones' },
                { type: 'building_news', title: 'Noticias del Edificio' }
            ],
            quickActions: [
                'Invitar Huésped', 'Generar QR', 'Ver Mi Historial',
                'Gestionar Familia', 'Configurar Perfil'
            ]
        };
    }

    getGuestDashboard(guestId) {
        return {
            title: 'Panel de Visitante',
            widgets: [
                { type: 'access_info', title: 'Información de Acceso' },
                { type: 'qr_code', title: 'Mi Código QR' },
                { type: 'visit_details', title: 'Detalles de la Visita' },
                { type: 'building_map', title: 'Mapa del Edificio' },
                { type: 'emergency_info', title: 'Información de Emergencia' }
            ],
            quickActions: [
                'Mostrar QR', 'Contactar Anfitrión', 'Ver Mapa',
                'Emergencia', 'Check-out'
            ]
        };
    }

    getMaintenanceDashboard(building) {
        return {
            title: `Mantenimiento - ${building}`,
            widgets: [
                { type: 'work_orders', title: 'Órdenes de Trabajo' },
                { type: 'equipment_status', title: 'Estado de Equipos' },
                { type: 'maintenance_schedule', title: 'Cronograma' },
                { type: 'inventory', title: 'Inventario' },
                { type: 'safety_reports', title: 'Reportes de Seguridad' }
            ],
            quickActions: [
                'Nueva Orden', 'Reportar Falla', 'Ver Cronograma',
                'Actualizar Inventario', 'Reporte de Seguridad'
            ]
        };
    }
}

module.exports = UserManagementSystem;
