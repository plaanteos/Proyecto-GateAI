# UNIONTECH Backend API Documentation

## Información General

- **Versión**: 1.0.0
- **Base URL**: `http://localhost:3000/api`
- **Autenticación**: Bearer Token (JWT)

## Guía de Inicio Rápido

### 1. Autenticación

Primero, obtén un token de acceso:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@uniontech.com",
    "password": "tu_password"
  }'
```

### 2. Usar el Token

Incluye el token en todas las peticiones:

```bash
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer TU_TOKEN_JWT"
```

## Endpoints Principales

### Autenticación

- `POST /auth/login` - Iniciar sesión
- `POST /auth/register` - Registrar nuevo usuario
- `GET /auth/me` - Obtener perfil del usuario actual
- `POST /auth/logout` - Cerrar sesión

### Usuarios

- `GET /users` - Listar usuarios
- `POST /users` - Crear usuario
- `GET /users/:id` - Obtener usuario por ID
- `PUT /users/:id` - Actualizar usuario
- `DELETE /users/:id` - Eliminar usuario

### Visitantes

- `GET /visitors` - Listar visitantes
- `POST /visitors` - Registrar visitante
- `GET /visitors/:id` - Obtener visitante por ID
- `POST /visitors/:id/checkin` - Hacer check-in
- `POST /visitors/:id/checkout` - Hacer check-out
- `GET /visitors/search` - Buscar visitantes

### Dashboard

- `GET /dashboard/stats` - Estadísticas generales
- `GET /dashboard/active-visitors` - Visitantes activos
- `GET /dashboard/recent-activity` - Actividad reciente

### RBAC (Roles y Permisos)

- `GET /rbac/roles` - Listar roles
- `POST /rbac/roles` - Crear rol
- `GET /rbac/permissions` - Listar permisos
- `POST /users/:id/roles` - Asignar rol a usuario

## Códigos de Respuesta

- `200` - Éxito
- `201` - Creado exitosamente
- `400` - Error de validación
- `401` - No autenticado
- `403` - Sin permisos
- `404` - No encontrado
- `429` - Demasiadas peticiones
- `500` - Error del servidor

## Rate Limiting

- **General**: 1000 peticiones por hora por IP
- **Auth**: 5 intentos de login por minuto por IP
- **API**: 100 peticiones por minuto por usuario autenticado

## WebSocket Events

El dashboard soporta actualizaciones en tiempo real vía WebSocket:

```javascript
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
```

## Ejemplos de Uso

### Registrar un Visitante

```javascript
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
```

### Obtener Estadísticas del Dashboard

```javascript
const stats = await fetch('/api/dashboard/stats', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});

const data = await stats.json();
console.log('Visitantes activos:', data.activeVisitors);
```

## Seguridad

### Headers de Seguridad

La API incluye automáticamente headers de seguridad:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security`

### Validación de Entrada

Todos los endpoints validan la entrada usando esquemas estrictos:

- Validación de tipos de datos
- Sanitización de strings
- Verificación de rangos numéricos
- Validación de formatos (email, teléfono, etc.)

## Monitoreo y Logs

### Health Check

`GET /health` - Estado del sistema

### Métricas

`GET /metrics` - Métricas de rendimiento (requiere permisos de admin)

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