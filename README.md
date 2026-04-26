# 🏢 UnionTech - Sistema de Control de Accesos

## 🚀 Descripción
Sistema completo de control de accesos empresariales que combina tecnología QR, notificaciones automáticas por WhatsApp/Email y gestión de visitantes en tiempo real. Desarrollado con Node.js, Express, Prisma ORM y SQL Server.

## ✨ Características Principales

### 🔐 Control de Accesos Avanzado
- **Códigos QR únicos y seguros** con encriptación AES-256
- **Validación en tiempo real** con expiración automática
- **Acceso manual** con autorización de anfitriones
- **Sistema anti-fraude** con límite de intentos fallidos

### 📱 Notificaciones Automáticas
- **WhatsApp Business** via Twilio API
- **Email profesional** via SendGrid
- **Notificaciones en tiempo real** para llegadas y autorizaciones
- **Alertas de seguridad** instantáneas

### 👥 Gestión de Visitantes
- **Pre-registro** de visitantes con códigos QR
- **Autorización de anfitriones** por WhatsApp/Email
- **Códigos grupales** para eventos y conferencias
- **Historial completo** de accesos

### 📊 Auditoría y Seguridad
- **Logs de auditoría** detallados por categorías
- **Encriptación** de códigos QR y datos sensibles
- **Autenticación JWT** para todas las APIs
- **Monitoreo en tiempo real** de accesos

## 🛠️ Stack Tecnológico
- **Backend**: Node.js + Express
- **ORM**: Prisma
- **Base de datos**: SQL Server (SSMS)
- **Autenticación**: JWT + bcryptjs
- **Notificaciones**: Twilio (WhatsApp) + SendGrid (Email)

## 📁 Estructura del Proyecto
```
UNIONTECH/
├── src/
│   ├── routes/          # Rutas de la API
│   ├── controllers/     # Controladores (futuro)
│   ├── middleware/      # Middlewares personalizados
│   ├── services/        # Lógica de negocio
│   ├── utils/           # Utilidades
│   ├── app.js           # Configuración de Express
│   └── server.js        # Punto de entrada
├── prisma/
│   └── schema.prisma    # Modelo de datos
├── base de datos/
│   └── Database-uniontech-mejorada.sql
├── .env                 # Variables de entorno
├── package.json
└── README.md
```

## 🗄️ Modelo de Datos
- **Personas**: Usuarios del sistema (residentes/empleados)
- **Usuarios**: Cuentas de acceso al sistema
- **Roles**: Permisos y niveles de acceso
- **Edificios**: Propiedades/edificios
- **Puertas_Acceso**: Puntos de entrada/salida
- **Credenciales**: Tarjetas, códigos, biometría
- **Niveles_Acceso**: Permisos por área/horario
- **Registros_Acceso**: Log de todos los accesos
- **Invitaciones**: Visitantes temporales
- **Fotos**: Imágenes para reconocimiento facial
- **Auditoria**: Logs del sistema

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js (v16+)
- SQL Server (SSMS)
- npm o yarn

### Pasos de instalación
1. **Clonar/descargar el proyecto**
   ```bash
   cd UNIONTECH
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar base de datos**
   - Ejecutar el script `base de datos/Database-uniontech-mejorada.sql` en SSMS
   - Configurar la cadena de conexión en `.env`

4. **Configurar variables de entorno**
   ```env
   DATABASE_URL="sqlserver://localhost:1433;database=Database-uniontech-mejorada;user=tu_usuario;password=tu_password;encrypt=true;trustServerCertificate=true"
   JWT_SECRET=tu_clave_secreta_super_segura
   NODE_ENV=development
   PORT=3000
   ```

5. **Generar cliente Prisma**
   ```bash
   npx prisma generate
   ```

6. **Ejecutar el servidor**
   ```bash
   npm run dev  # Modo desarrollo
   npm start    # Modo producción
   ```

## 📚 API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario
- `GET /api/auth/profile` - Obtener perfil

### Personas
- `GET /api/personas` - Listar personas
- `GET /api/personas/:id` - Obtener persona
- `POST /api/personas` - Crear persona
- `PUT /api/personas/:id` - Actualizar persona
- `DELETE /api/personas/:id` - Eliminar persona

### Edificios
- `GET /api/edificios` - Listar edificios
- `POST /api/edificios` - Crear edificio

### Accesos
- `GET /api/accesos` - Listar registros de acceso
- `POST /api/accesos` - Registrar acceso

### Visitantes
- `GET /api/visitantes` - Listar invitaciones
- `POST /api/visitantes` - Crear invitación

### Reportes
- `GET /api/reportes/accesos` - Reporte de accesos
- `GET /api/reportes/dashboard` - Dashboard principal

## 🔐 Seguridad
- Autenticación JWT con expiración
- Passwords hasheados con bcryptjs (12 rounds)
- Helmet para headers de seguridad
- CORS configurado
- Validación de inputs
- Logs de auditoría completos

## 📊 Funcionalidades Implementadas
✅ Estructura base del proyecto  
✅ Conexión a SQL Server con Prisma  
✅ Autenticación JWT  
✅ CRUD básico para entidades principales  
✅ Sistema de auditoría  
✅ Manejo de errores  
✅ Configuración de seguridad  

## ✅ Funcionalidades Implementadas (Completo)
- [x] Middleware de autenticación JWT + RBAC
- [x] Integración con Twilio (WhatsApp Business)
- [x] Integración con SendGrid (Email)
- [x] Validación de esquemas con Joi (`src/schemas/`, `src/middleware/joiValidation.js`)
- [x] Sistema de archivos/fotos (upload y almacenamiento)
- [x] Reconocimiento facial (IA) con `facialRecognitionService`
- [x] Generación de códigos QR con encriptación AES-256
- [x] Websockets para notificaciones en tiempo real (Socket.IO)
- [x] Rate limiting (100 req / 15 min por IP)
- [x] Documentación con Swagger (`/api/docs`)
- [x] Tests unitarios + e2e con Jest + Supertest
- [x] Docker containerización (`Dockerfile` + `docker-compose.yml`)
- [x] Deploy en Railway (`railway.json`) y Render (`render.yaml`)

## 🧪 Testing
```bash
# Health check
curl http://localhost:3000/health

# Login de prueba (después de crear usuario)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'
```

## 📝 Notas de Desarrollo
- El proyecto sigue principios REST
- Separación clara de responsabilidades
- Código limpio y bien documentado
- Manejo profesional de errores
- Logs estructurados para debugging
- Base sólida para escalabilidad

## 👥 Equipo
- **Arquitecto Backend**: Responsable del diseño y desarrollo del backend
- **Especialista en Notificaciones**: WhatsApp + Email integrations

---
**Desarrollado por el equipo de UnionTech** 🚀
