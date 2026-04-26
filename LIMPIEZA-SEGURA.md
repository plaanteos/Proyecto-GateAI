# UnionTech - Guía de Limpieza de Archivos

## Archivos ESENCIALES (NO ELIMINAR)

### Core del Sistema
- `simple-api-server.js` - Servidor API principal
- `frontend-server.js` - Servidor del frontend
- `package.json` - Dependencias del proyecto
- `package-lock.json` - Lock de dependencias
- `.env` - Variables de entorno
- `.env.example` - Ejemplo de configuración

### Frontend
- `frontend/index.html` - Página principal
- `frontend/src/app.js` - Aplicación principal
- `frontend/src/app-validation.js` - Sistema de validación
- `frontend/css/` - Todos los estilos
- `frontend/src/utils/` - Utilidades del frontend

### Backend Modular
- `src/` - Todo el contenido (rutas, servicios, middleware)
- `src/routes/` - Todas las rutas de API
- `src/services/` - Servicios de negocio
- `src/middleware/` - Middlewares de autenticación
- `src/data/mockData.js` - Datos de prueba

### Base de Datos
- `base de datos/` - Todos los archivos SQL

### Scripts de Inicio
- `start-uniontech.ps1` - Script principal de PowerShell
- `start-uniontech.bat` - Script de Windows batch
- `start-servers.ps1` - Script alternativo

### Configuración
- `prisma/schema.prisma` - Esquema de base de datos
- `.gitignore` - Configuración de Git

## Archivos que SE PUEDEN ELIMINAR de forma segura

### Archivos de Testing (si existen)
- `test-*.js` - Scripts de prueba
- `test-*.ps1` - Tests de PowerShell
- `*-test.js` - Archivos de testing

### Archivos de Backup
- `*.backup` - Copias de seguridad
- `*-original.js` - Versiones originales
- `*-old.js` - Versiones antigas
- `*-copy.js` - Copias duplicadas

### Documentación Excesiva
- `ERRORES-*.md` - Logs de errores históricos
- `MEJORAS-*.md` - Documentos de mejoras
- `IMPLEMENTACIONES-*.md` - Logs de implementación
- `CHATBOT-*.md` - Documentación de chatbot
- Múltiples archivos README (mantener solo README.md principal)

### Scripts Duplicados
- Múltiples scripts start-* (mantener solo los principales)
- Scripts de inicio obsoletos o experimentales

### Archivos de Configuración Obsoletos
- `ecosystem.config.js` - Config de PM2 si no se usa
- `package-professional.json` - Package.json duplicado
- Archivos de configuración de herramientas no usadas

### Funcionalidades No Utilizadas
- `chatbot-whatsapp.js` - Si no se usa WhatsApp
- `notification-queue.js` - Si se usa otro sistema de notificaciones
- Scripts de migración antiguos

### Archivos Temporales
- `nuevos problemas.txt` - Notas temporales
- `datosimportantes.txt` - Notas personales
- Archivos `.log` - Logs antiguos
- Carpeta `logs/` si está vacía

### Archivos del IDE
- `.vs/` - Archivos de Visual Studio
- `.vscode/` (excepto configuración esencial)
- Archivos temporales del editor

## Comando de Limpieza Segura

```powershell
# Eliminar solo archivos de testing
Remove-Item "test-*.js", "test-*.ps1" -Force -ErrorAction SilentlyContinue

# Eliminar archivos de backup
Remove-Item "*-backup.*", "*-original.*", "*-old.*" -Force -ErrorAction SilentlyContinue

# Eliminar documentación excesiva (mantener README.md principal)
Remove-Item "ERRORES-*.md", "MEJORAS-*.md", "IMPLEMENTACIONES-*.md" -Force -ErrorAction SilentlyContinue

# Eliminar archivos temporales
Remove-Item "*.txt" -Exclude "README.txt" -Force -ErrorAction SilentlyContinue

# Eliminar logs antiguos
Remove-Item "*.log" -Force -ErrorAction SilentlyContinue
```

## ⚠️ IMPORTANTE
Antes de eliminar cualquier archivo:
1. Haz backup del proyecto completo
2. Verifica que el sistema funcione después de cada eliminación
3. No elimines archivos si no estás 100% seguro de su función
