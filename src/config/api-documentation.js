/**
 * Documentación API Automática
 * Generador de documentación interactiva con Swagger/OpenAPI
 */

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs').promises;
const path = require('path');

class APIDocumentationGenerator {
    constructor() {
        this.apiSpec = null;
        this.generateDocumentation();
    }

    /**
     * Generar documentación completa de la API
     */
    generateDocumentation() {
        const options = {
            definition: {
                openapi: '3.0.0',
                info: {
                    title: 'UNIONTECH Backend API',
                    version: '1.0.0',
                    description: `
# UNIONTECH - Sistema de Gestión de Visitantes

API completa para gestión de visitantes, control de acceso y administración empresarial.

## Características Principales

- 🔐 **Autenticación JWT** con RBAC granular
- 👥 **Gestión de usuarios** y empleados
- 🏢 **Control de visitantes** con check-in/check-out
- 📊 **Dashboard en tiempo real** con WebSockets
- 🔧 **Sistema de mantenimiento** integrado
- 📈 **Métricas y reportes** avanzados

## Seguridad

La API implementa múltiples capas de seguridad:
- Rate limiting por IP y usuario
- Validación de entrada exhaustiva
- Encriptación de datos sensibles
- Logs de auditoría completos

## Rendimiento

- Optimización de base de datos con índices inteligentes
- Cache Redis para sesiones y datos frecuentes
- Compresión automática de respuestas
- Monitoreo continuo de performance
                    `,
                    contact: {
                        name: 'UNIONTECH Dev Team',
                        email: 'dev@uniontech.com'
                    },
                    license: {
                        name: 'MIT',
                        url: 'https://opensource.org/licenses/MIT'
                    }
                },
                servers: [
                    {
                        url: 'http://localhost:3000/api',
                        description: 'Servidor de desarrollo'
                    },
                    {
                        url: 'https://api.uniontech.com/api',
                        description: 'Servidor de producción'
                    }
                ],
                components: {
                    securitySchemes: {
                        bearerAuth: {
                            type: 'http',
                            scheme: 'bearer',
                            bearerFormat: 'JWT',
                            description: 'Token JWT obtenido del endpoint /auth/login'
                        }
                    },
                    schemas: this.generateSchemas(),
                    responses: this.generateCommonResponses(),
                    parameters: this.generateCommonParameters()
                },
                security: [
                    {
                        bearerAuth: []
                    }
                ],
                tags: [
                    {
                        name: 'Auth',
                        description: 'Autenticación y autorización'
                    },
                    {
                        name: 'Users',
                        description: 'Gestión de usuarios y empleados'
                    },
                    {
                        name: 'Visitors',
                        description: 'Gestión de visitantes y acceso'
                    },
                    {
                        name: 'Dashboard',
                        description: 'Métricas y estadísticas en tiempo real'
                    },
                    {
                        name: 'RBAC',
                        description: 'Sistema de roles y permisos'
                    },
                    {
                        name: 'Maintenance',
                        description: 'Gestión de empleados de mantenimiento'
                    },
                    {
                        name: 'System',
                        description: 'Configuración y administración del sistema'
                    }
                ]
            },
            apis: [
                './src/routes/*.js',
                './src/controllers/*.js',
                './src/models/*.js'
            ]
        };

        this.apiSpec = swaggerJsdoc(options);
    }

    /**
     * Generar esquemas de datos
     */
    generateSchemas() {
        return {
            User: {
                type: 'object',
                required: ['name', 'email', 'position'],
                properties: {
                    id: {
                        type: 'string',
                        format: 'uuid',
                        description: 'ID único del usuario'
                    },
                    name: {
                        type: 'string',
                        minLength: 2,
                        maxLength: 100,
                        description: 'Nombre completo del usuario'
                    },
                    email: {
                        type: 'string',
                        format: 'email',
                        description: 'Correo electrónico único'
                    },
                    position: {
                        type: 'string',
                        minLength: 2,
                        maxLength: 50,
                        description: 'Cargo o posición en la empresa'
                    },
                    isActive: {
                        type: 'boolean',
                        description: 'Estado activo del usuario'
                    },
                    lastLogin: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Último acceso al sistema'
                    },
                    createdAt: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Fecha de creación'
                    },
                    roles: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Role' },
                        description: 'Roles asignados al usuario'
                    }
                },
                example: {
                    id: '123e4567-e89b-12d3-a456-426614174000',
                    name: 'Juan Pérez',
                    email: 'juan.perez@empresa.com',
                    position: 'Desarrollador Senior',
                    isActive: true,
                    lastLogin: '2024-01-15T10:30:00Z',
                    createdAt: '2024-01-01T09:00:00Z',
                    roles: ['user', 'developer']
                }
            },
            Visitor: {
                type: 'object',
                required: ['name', 'email', 'purpose', 'hostUserId'],
                properties: {
                    id: {
                        type: 'string',
                        format: 'uuid',
                        description: 'ID único del visitante'
                    },
                    name: {
                        type: 'string',
                        minLength: 2,
                        maxLength: 100,
                        description: 'Nombre completo del visitante'
                    },
                    email: {
                        type: 'string',
                        format: 'email',
                        description: 'Correo electrónico del visitante'
                    },
                    phone: {
                        type: 'string',
                        pattern: '^\\+?[1-9]\\d{1,14}$',
                        description: 'Número de teléfono'
                    },
                    company: {
                        type: 'string',
                        maxLength: 100,
                        description: 'Empresa del visitante'
                    },
                    purpose: {
                        type: 'string',
                        minLength: 5,
                        maxLength: 500,
                        description: 'Propósito de la visita'
                    },
                    status: {
                        type: 'string',
                        enum: ['registered', 'checked_in', 'checked_out', 'cancelled'],
                        description: 'Estado actual del visitante'
                    },
                    visitDate: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Fecha programada de la visita'
                    },
                    hostUserId: {
                        type: 'string',
                        format: 'uuid',
                        description: 'ID del usuario anfitrión'
                    },
                    qrCode: {
                        type: 'string',
                        description: 'Código QR único para check-in'
                    },
                    photoUrl: {
                        type: 'string',
                        format: 'url',
                        description: 'URL de la foto del visitante'
                    }
                },
                example: {
                    id: '456e7890-e89b-12d3-a456-426614174001',
                    name: 'María García',
                    email: 'maria.garcia@clienteempresa.com',
                    phone: '+34612345678',
                    company: 'Cliente Empresa S.L.',
                    purpose: 'Reunión de seguimiento del proyecto',
                    status: 'registered',
                    visitDate: '2024-01-16T14:00:00Z',
                    hostUserId: '123e4567-e89b-12d3-a456-426614174000',
                    qrCode: 'VIS_20240116_001'
                }
            },
            AccessLog: {
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                        format: 'uuid',
                        description: 'ID único del registro'
                    },
                    visitorId: {
                        type: 'string',
                        format: 'uuid',
                        description: 'ID del visitante'
                    },
                    type: {
                        type: 'string',
                        enum: ['checkin', 'checkout'],
                        description: 'Tipo de acceso'
                    },
                    location: {
                        type: 'string',
                        description: 'Ubicación del acceso'
                    },
                    timestamp: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Momento del acceso'
                    },
                    notes: {
                        type: 'string',
                        description: 'Notas adicionales'
                    }
                }
            },
            Role: {
                type: 'object',
                required: ['name', 'description'],
                properties: {
                    id: {
                        type: 'string',
                        format: 'uuid',
                        description: 'ID único del rol'
                    },
                    name: {
                        type: 'string',
                        minLength: 2,
                        maxLength: 50,
                        description: 'Nombre del rol'
                    },
                    description: {
                        type: 'string',
                        maxLength: 200,
                        description: 'Descripción del rol'
                    },
                    permissions: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Permission' },
                        description: 'Permisos asociados al rol'
                    }
                }
            },
            Permission: {
                type: 'object',
                required: ['name', 'resource', 'action'],
                properties: {
                    id: {
                        type: 'string',
                        format: 'uuid',
                        description: 'ID único del permiso'
                    },
                    name: {
                        type: 'string',
                        description: 'Nombre del permiso'
                    },
                    description: {
                        type: 'string',
                        description: 'Descripción del permiso'
                    },
                    resource: {
                        type: 'string',
                        description: 'Recurso al que aplica el permiso'
                    },
                    action: {
                        type: 'string',
                        description: 'Acción permitida'
                    }
                }
            },
            MaintenanceEmployee: {
                type: 'object',
                required: ['name', 'email', 'speciality'],
                properties: {
                    id: {
                        type: 'string',
                        format: 'uuid',
                        description: 'ID único del empleado'
                    },
                    name: {
                        type: 'string',
                        description: 'Nombre completo'
                    },
                    email: {
                        type: 'string',
                        format: 'email',
                        description: 'Correo electrónico'
                    },
                    phone: {
                        type: 'string',
                        description: 'Número de teléfono'
                    },
                    speciality: {
                        type: 'string',
                        description: 'Especialidad técnica'
                    },
                    isActive: {
                        type: 'boolean',
                        description: 'Estado activo'
                    }
                }
            },
            DashboardStats: {
                type: 'object',
                properties: {
                    totalUsers: {
                        type: 'integer',
                        description: 'Total de usuarios registrados'
                    },
                    totalVisitors: {
                        type: 'integer',
                        description: 'Total de visitantes registrados'
                    },
                    activeVisitors: {
                        type: 'integer',
                        description: 'Visitantes actualmente en las instalaciones'
                    },
                    todayVisits: {
                        type: 'integer',
                        description: 'Visitas del día actual'
                    },
                    avgVisitDuration: {
                        type: 'number',
                        description: 'Duración promedio de visitas (minutos)'
                    }
                }
            },
            Error: {
                type: 'object',
                properties: {
                    error: {
                        type: 'string',
                        description: 'Mensaje de error'
                    },
                    code: {
                        type: 'string',
                        description: 'Código de error interno'
                    },
                    details: {
                        type: 'object',
                        description: 'Detalles adicionales del error'
                    }
                }
            }
        };
    }

    /**
     * Generar respuestas comunes
     */
    generateCommonResponses() {
        return {
            UnauthorizedError: {
                description: 'Token de autenticación inválido o expirado',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/Error' },
                        example: {
                            error: 'Token inválido o expirado',
                            code: 'UNAUTHORIZED'
                        }
                    }
                }
            },
            ForbiddenError: {
                description: 'Permisos insuficientes para realizar la operación',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/Error' },
                        example: {
                            error: 'Permisos insuficientes',
                            code: 'FORBIDDEN'
                        }
                    }
                }
            },
            NotFoundError: {
                description: 'Recurso no encontrado',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/Error' },
                        example: {
                            error: 'Recurso no encontrado',
                            code: 'NOT_FOUND'
                        }
                    }
                }
            },
            ValidationError: {
                description: 'Error de validación en los datos enviados',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/Error' },
                        example: {
                            error: 'Datos de entrada inválidos',
                            code: 'VALIDATION_ERROR',
                            details: {
                                email: 'Formato de email inválido',
                                password: 'La contraseña debe tener al menos 8 caracteres'
                            }
                        }
                    }
                }
            },
            ServerError: {
                description: 'Error interno del servidor',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/Error' },
                        example: {
                            error: 'Error interno del servidor',
                            code: 'INTERNAL_ERROR'
                        }
                    }
                }
            }
        };
    }

    /**
     * Generar parámetros comunes
     */
    generateCommonParameters() {
        return {
            LimitParam: {
                name: 'limit',
                in: 'query',
                description: 'Número máximo de resultados a devolver',
                schema: {
                    type: 'integer',
                    minimum: 1,
                    maximum: 1000,
                    default: 50
                }
            },
            OffsetParam: {
                name: 'offset',
                in: 'query',
                description: 'Número de resultados a omitir',
                schema: {
                    type: 'integer',
                    minimum: 0,
                    default: 0
                }
            },
            SortParam: {
                name: 'sort',
                in: 'query',
                description: 'Campo por el que ordenar los resultados',
                schema: {
                    type: 'string',
                    enum: ['createdAt', 'name', 'email', 'status'],
                    default: 'createdAt'
                }
            },
            OrderParam: {
                name: 'order',
                in: 'query',
                description: 'Dirección del ordenamiento',
                schema: {
                    type: 'string',
                    enum: ['asc', 'desc'],
                    default: 'desc'
                }
            }
        };
    }

    /**
     * Generar documentación de endpoints específicos
     */
    generateEndpointDocs() {
        return {
            '/auth/login': {
                post: {
                    tags: ['Auth'],
                    summary: 'Iniciar sesión',
                    description: 'Autenticar usuario y obtener token JWT',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['email', 'password'],
                                    properties: {
                                        email: {
                                            type: 'string',
                                            format: 'email',
                                            example: 'usuario@empresa.com'
                                        },
                                        password: {
                                            type: 'string',
                                            minLength: 8,
                                            example: 'miPasswordSeguro123'
                                        }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: 'Login exitoso',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            token: {
                                                type: 'string',
                                                description: 'Token JWT para autenticación'
                                            },
                                            user: {
                                                $ref: '#/components/schemas/User'
                                            },
                                            expiresIn: {
                                                type: 'integer',
                                                description: 'Tiempo de expiración en segundos'
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        401: { $ref: '#/components/responses/UnauthorizedError' },
                        400: { $ref: '#/components/responses/ValidationError' }
                    }
                }
            }
        };
    }

    /**
     * Generar archivo de documentación Markdown
     */
    async generateMarkdownDocs() {
        const markdown = `
# UNIONTECH Backend API Documentation

## Información General

- **Versión**: 1.0.0
- **Base URL**: \`http://localhost:3000/api\`
- **Autenticación**: Bearer Token (JWT)

## Guía de Inicio Rápido

### 1. Autenticación

Primero, obtén un token de acceso:

\`\`\`bash
curl -X POST http://localhost:3000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "admin@uniontech.com",
    "password": "tu_password"
  }'
\`\`\`

### 2. Usar el Token

Incluye el token en todas las peticiones:

\`\`\`bash
curl -X GET http://localhost:3000/api/users \\
  -H "Authorization: Bearer TU_TOKEN_JWT"
\`\`\`

## Endpoints Principales

### Autenticación

- \`POST /auth/login\` - Iniciar sesión
- \`POST /auth/register\` - Registrar nuevo usuario
- \`GET /auth/me\` - Obtener perfil del usuario actual
- \`POST /auth/logout\` - Cerrar sesión

### Usuarios

- \`GET /users\` - Listar usuarios
- \`POST /users\` - Crear usuario
- \`GET /users/:id\` - Obtener usuario por ID
- \`PUT /users/:id\` - Actualizar usuario
- \`DELETE /users/:id\` - Eliminar usuario

### Visitantes

- \`GET /visitors\` - Listar visitantes
- \`POST /visitors\` - Registrar visitante
- \`GET /visitors/:id\` - Obtener visitante por ID
- \`POST /visitors/:id/checkin\` - Hacer check-in
- \`POST /visitors/:id/checkout\` - Hacer check-out
- \`GET /visitors/search\` - Buscar visitantes

### Dashboard

- \`GET /dashboard/stats\` - Estadísticas generales
- \`GET /dashboard/active-visitors\` - Visitantes activos
- \`GET /dashboard/recent-activity\` - Actividad reciente

### RBAC (Roles y Permisos)

- \`GET /rbac/roles\` - Listar roles
- \`POST /rbac/roles\` - Crear rol
- \`GET /rbac/permissions\` - Listar permisos
- \`POST /users/:id/roles\` - Asignar rol a usuario

## Códigos de Respuesta

- \`200\` - Éxito
- \`201\` - Creado exitosamente
- \`400\` - Error de validación
- \`401\` - No autenticado
- \`403\` - Sin permisos
- \`404\` - No encontrado
- \`429\` - Demasiadas peticiones
- \`500\` - Error del servidor

## Rate Limiting

- **General**: 1000 peticiones por hora por IP
- **Auth**: 5 intentos de login por minuto por IP
- **API**: 100 peticiones por minuto por usuario autenticado

## WebSocket Events

El dashboard soporta actualizaciones en tiempo real vía WebSocket:

\`\`\`javascript
const socket = io('http://localhost:3000');

socket.on('visitor_checkin', (data) => {
  console.log('Nuevo check-in:', data);
});

socket.on('visitor_checkout', (data) => {
  console.log('Nuevo check-out:', data);
});

socket.on('dashboard_update', (stats) => {
  console.log('Estadísticas actualizadas:', stats);
});
\`\`\`

## Ejemplos de Uso

### Registrar un Visitante

\`\`\`javascript
const visitor = await fetch('/api/visitors', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    name: 'Juan Pérez',
    email: 'juan@empresa.com',
    phone: '+34612345678',
    company: 'Empresa Cliente',
    purpose: 'Reunión comercial',
    hostUserId: 'host-user-id'
  })
});
\`\`\`

### Obtener Estadísticas del Dashboard

\`\`\`javascript
const stats = await fetch('/api/dashboard/stats', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});

const data = await stats.json();
console.log('Visitantes activos:', data.activeVisitors);
\`\`\`

## Seguridad

### Headers de Seguridad

La API incluye automáticamente headers de seguridad:

- \`X-Content-Type-Options: nosniff\`
- \`X-Frame-Options: DENY\`
- \`X-XSS-Protection: 1; mode=block\`
- \`Strict-Transport-Security\`

### Validación de Entrada

Todos los endpoints validan la entrada usando esquemas estrictos:

- Validación de tipos de datos
- Sanitización de strings
- Verificación de rangos numéricos
- Validación de formatos (email, teléfono, etc.)

## Monitoreo y Logs

### Health Check

\`GET /health\` - Estado del sistema

### Métricas

\`GET /metrics\` - Métricas de rendimiento (requiere permisos de admin)

### Logs de Auditoría

Todas las operaciones importantes son registradas automáticamente con:
- Usuario que realizó la acción
- Timestamp preciso
- IP de origen
- Detalles de la operación

## Soporte

Para soporte técnico o reportar problemas:
- Email: dev@uniontech.com
- Documentación interactiva: http://localhost:3000/api/docs
        `;

        await fs.writeFile(
            path.join(process.cwd(), 'docs', 'API.md'),
            markdown.trim()
        );
    }

    /**
     * Configurar middleware de Swagger UI
     */
    setupSwaggerUI() {
        const customCSS = `
            .swagger-ui .topbar { display: none; }
            .swagger-ui .info { margin: 20px 0; }
            .swagger-ui .info .title { color: #2c3e50; }
            .swagger-ui .scheme-container { background: #f8f9fa; }
        `;

        const swaggerOptions = {
            customCss: customCSS,
            customSiteTitle: 'UNIONTECH API Docs',
            swaggerOptions: {
                defaultModelsExpandDepth: -1,
                docExpansion: 'list',
                filter: true,
                showRequestHeaders: true,
                tryItOutEnabled: true
            }
        };

        return [
            swaggerUi.serve,
            swaggerUi.setup(this.apiSpec, swaggerOptions)
        ];
    }

    /**
     * Obtener especificación OpenAPI
     */
    getAPISpec() {
        return this.apiSpec;
    }
}

module.exports = new APIDocumentationGenerator();
