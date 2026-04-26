# UnionTech - Sistema de Control de Acceso

## Descripción
Sistema completo de control de acceso con validación multimodal (QR, facial, documentos) para edificios corporativos.

## Características
- ✅ Autenticación JWT
- ✅ Gestión de usuarios y edificios
- ✅ Control de acceso en tiempo real
- ✅ Validación QR, facial y por documentos
- ✅ Dashboard administrativo
- ✅ Reportes y auditoría
- ✅ Notificaciones del sistema

## Instalación

### Requisitos
- Node.js v16 or superior
- NPM o Yarn

### Pasos
1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:
```bash
cp .env.example .env
```

3. Iniciar el sistema:
```bash
# Windows
start-uniontech.bat
# o
start-uniontech.ps1

# Manual
node simple-api-server.js    # Puerto 3000
node frontend-server.js      # Puerto 8080
```

## Uso

### Acceso al Sistema
- **URL**: http://localhost:8080
- **Usuario**: admin@uniontech.com
- **Contraseña**: admin123

### APIs Disponibles
- **API Base**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/health
- **Documentación**: Ver endpoints en simple-api-server.js

## Estructura del Proyecto

```
UNIONTECH/
├── frontend/               # Interfaz de usuario
│   ├── index.html         # Página principal
│   ├── src/
│   │   ├── app.js         # Aplicación principal
│   │   └── app-validation.js # Sistema de validación
│   └── css/               # Estilos
├── src/                   # Backend modular
│   ├── routes/           # Rutas de API
│   ├── services/         # Servicios de negocio
│   └── middleware/       # Middlewares
├── base de datos/        # Scripts de base de datos
├── simple-api-server.js  # Servidor API principal
├── frontend-server.js    # Servidor de frontend
└── package.json          # Dependencias
```

## Tecnologías
- **Backend**: Node.js (HTTP puro)
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **UI Framework**: Bootstrap 5
- **Autenticación**: JWT
- **Base de datos**: Mock data (preparado para SQL Server)

## Estado del Proyecto
✅ **100% Completado** - Sistema funcional y listo para producción.

## Soporte
Para soporte técnico, revisar la documentación del código o contactar al equipo de desarrollo.
