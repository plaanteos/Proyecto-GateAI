# 🏢 UnionTech - Sistema de Control de Accesos

## 🚀 Descripción
Sistema completo de control de accesos empresariales que combina tecnología QR, notificaciones automáticas por WhatsApp/Email, gestión de visitantes en tiempo real y un bot de WhatsApp autónomo. Desarrollado con Node.js, Express y SQL Server.

## ✨ Características Principales

### 🔐 Control de Accesos Avanzado
- **Códigos QR únicos y seguros** con encriptación AES-256
- **Validación en tiempo real** con expiración automática
- **Acceso manual** con autorización de anfitriones
- **Sistema anti-fraude** con límite de intentos fallidos

### 🤖 Bot de WhatsApp Autónomo
- **Escaneo de QR** para vincular número propio (sin API de pago)
- **Envío de QR de acceso como imagen** al autorizar visitantes
- **Respuestas automáticas** a comandos (hola, ayuda, qr, estado, soporte)
- **Alertas de seguridad** automáticas con nivel de prioridad (🔴/🟡/🟢)
- **Broadcast** a múltiples números simultáneamente
- **Fallback a Twilio** si el bot no está conectado
- **API interna REST** en puerto 3002 para integración con el backend

### 📱 Notificaciones Automáticas
- **WhatsApp** via bot local (whatsapp-web.js) o Twilio como fallback
- **Email profesional** via SendGrid
- **QR de acceso como imagen** adjunta al mensaje WhatsApp
- **Alertas de seguridad** instantáneas con emojis de nivel

### 👥 Gestión de Visitantes
- **Pre-registro** de visitantes con tipo temporal/recurrente
- **Áreas permitidas** configurables por visita
- **Horarios recurrentes** con selección de días de la semana
- **Envío automático de QR** por WhatsApp al autorizar
- **Historial completo** de accesos con estados

### 📊 Panel de Administración (SPA)
- **Dashboard unificado** en `frontend/modern-dashboard.html`
- **Módulos**: Usuarios, Edificios, Visitantes, Configuración
- **Panel de WhatsApp Bot** en Configuración > Sistema
- **Estado en tiempo real** del bot (verde/naranja/rojo)
- **Envío de mensajes de prueba** desde el panel

## 🛠️ Stack Tecnológico
- **Backend**: Node.js + Express (puerto 3001)
- **Bot WhatsApp**: whatsapp-web.js + Puppeteer (puerto 3002)
- **Frontend**: SPA HTML/CSS/JS vanilla (puerto 8080)
- **Base de datos**: SQL Server / modo fallback en memoria
- **Autenticación**: JWT + bcryptjs
- **Notificaciones**: Bot WhatsApp propio + Twilio (fallback) + SendGrid (Email)
- **QR**: librería `qrcode` (imágenes PNG)
- **Validación**: Joi + express-validator
- **RBAC**: Sistema de roles y permisos

## 📁 Estructura del Proyecto
```
UNIONTECH/
├── chatbot-whatsapp.js     ← Bot WhatsApp autónomo (puerto 3002)
├── src/
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── visitantes.js
│   │   ├── edificios.js
│   │   ├── notifications.js
│   │   └── whatsapp.js     ← API gestión del bot
│   ├── middleware/
│   │   ├── auth-simple.js
│   │   ├── auth.js
│   │   └── joiValidation.js
│   ├── services/
│   │   ├── notificationService.js  ← Bot local primero, Twilio fallback
│   │   ├── qrService.js
│   │   ├── biometricService.js
│   │   └── ...
│   ├── schemas/             ← Validaciones Joi
│   ├── app.js               ← Configuración Express + rutas
│   └── server-complete.js   ← Entry point
├── frontend/
│   └── modern-dashboard.html  ← SPA principal
├── prisma/
│   └── schema.prisma
├── base de datos/
│   └── BD_UNIONTECH.sql
├── .env
├── package.json
└── README.md
```

## 🗄️ Modelo de Datos
- **Usuarios**: Cuentas de acceso con roles y permisos (RBAC)
- **Edificios**: Propiedades con puertas de acceso
- **Visitantes**: Invitaciones temporales y recurrentes
- **Registros_Acceso**: Log de todos los accesos
- **Auditoria**: Logs del sistema

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js v18+
- SQL Server (SSMS) — o modo fallback sin BD
- npm

### Pasos de instalación

1. **Clonar el proyecto**
   ```bash
   git clone https://github.com/plaanteos/proyecto-marco.git
   cd UNIONTECH
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno** — crear `.env`:
   ```env
   # Servidor
   PORT=3001
   NODE_ENV=development
   JWT_SECRET=tu_clave_secreta_super_segura

   # Base de datos (opcional, hay modo fallback)
   DATABASE_URL="sqlserver://localhost:1433;database=BD_UNIONTECH;..."
   SKIP_DB_CONNECTION=true       # true para modo sin BD
   DATABASE_MODE=fallback

   # WhatsApp Bot
   WHATSAPP_BOT_PORT=3002
   ADMIN_WHATSAPP=+5491112345678  # número del admin para alertas
   COMPANY_NAME=UnionTech

   # Twilio (fallback si el bot no está conectado)
   TWILIO_ACCOUNT_SID=ACxxxx
   TWILIO_AUTH_TOKEN=xxxx
   TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

   # SendGrid (email)
   SENDGRID_API_KEY=SG.xxxx
   SENDGRID_FROM_EMAIL=noreply@tuempresa.com
   ```

4. **Iniciar el backend**
   ```bash
   npm start          # producción
   npm run dev        # desarrollo con nodemon
   ```

5. **Iniciar el frontend** (puerto 8080)
   ```bash
   node frontend-server.js
   ```

6. **Iniciar el bot de WhatsApp** (puerto 3002, terminal separada)
   ```bash
   npm run chatbot         # producción
   npm run chatbot:dev     # desarrollo con nodemon
   ```
   Luego abre `http://localhost:3002/qr` en el navegador y escanea el QR con WhatsApp.

## 📚 API Endpoints

### Autenticación
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Iniciar sesión |
| POST | `/api/auth/register` | Registrar usuario |
| GET | `/api/auth/verify` | Verificar token |

### Usuarios
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/users` | Listar usuarios |
| POST | `/api/users` | Crear usuario |
| PUT | `/api/users/:id` | Actualizar usuario |
| DELETE | `/api/users/:id` | Eliminar usuario |

### Edificios
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/edificios` | Listar edificios con puertas |
| POST | `/api/edificios` | Crear edificio |

### Visitantes
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/visitors` | Listar visitantes |
| POST | `/api/visitors` | Registrar visitante |
| PUT | `/api/visitors/:id/authorize` | Autorizar acceso |
| PUT | `/api/visitors/:id/reject` | Rechazar acceso |
| DELETE | `/api/visitors/:id` | Eliminar visitante |

### WhatsApp Bot
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/whatsapp/status` | Estado del bot |
| GET | `/api/whatsapp/qr-url` | URL del QR de vinculación |
| POST | `/api/whatsapp/send` | Enviar mensaje de texto |
| POST | `/api/whatsapp/send-qr` | Enviar QR de acceso (imagen) |
| POST | `/api/whatsapp/send-alert` | Enviar alerta de seguridad |
| POST | `/api/whatsapp/broadcast` | Enviar a múltiples números |

### Notificaciones
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/notifications/whatsapp` | Enviar WhatsApp (texto) |
| POST | `/api/notifications/email` | Enviar email |

## 🤖 Bot WhatsApp — Comandos automáticos

Los visitantes pueden escribir al número del bot y recibir respuestas automáticas:

| Mensaje | Respuesta |
|---------|-----------|
| `hola` / `buenos días` | Menú de bienvenida |
| `ayuda` / `menu` | Lista de comandos |
| `qr` / `código` | Instrucciones para obtener QR |
| `estado` / `visita` | Estado de la visita |
| `cancelar` | Instrucciones para cancelar |
| `soporte` / `agente` | Escalado al admin humano |

## 🔐 Seguridad
- Autenticación JWT con expiración configurable
- Passwords hasheados con bcryptjs (12 rounds)
- Helmet para headers de seguridad HTTP
- CORS configurado para orígenes permitidos
- Validación de inputs con Joi + express-validator
- RBAC con permisos granulares por recurso
- Rate limiting: 100 req / 15 min por IP
- API del bot (3002) solo accesible desde localhost

## ✅ Funcionalidades Implementadas

- [x] Backend Express + rutas CRUD completas
- [x] Autenticación JWT + middleware RBAC
- [x] Modo fallback sin base de datos
- [x] **Bot WhatsApp autónomo** con whatsapp-web.js
- [x] Envío de QR de acceso como imagen PNG por WhatsApp
- [x] Respuestas automáticas del chatbot
- [x] Alertas de seguridad automáticas
- [x] Broadcast a múltiples números
- [x] Fallback a Twilio si el bot no está conectado
- [x] Integración con SendGrid (Email)
- [x] Panel SPA unificado (`modern-dashboard.html`)
- [x] Módulo Usuarios (CRUD completo)
- [x] Módulo Edificios (CRUD con puertas)
- [x] Módulo Visitantes (temporal/recurrente, áreas, QR)
- [x] Módulo Configuración (Perfil, Seguridad, Notificaciones, Sistema)
- [x] **Panel de estado del bot** en Configuración > Sistema
- [x] Validación de esquemas con Joi
- [x] Generación de QR con encriptación
- [x] Docker containerización
- [x] Deploy en Railway y Render

## 🧪 Testing

```bash
# Health check backend
curl http://localhost:3001/health

# Estado del bot WhatsApp
curl http://localhost:3001/api/whatsapp/status \
  -H "Authorization: Bearer <token>"

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}'

# Estado directo del bot (sin auth)
curl http://localhost:3002/status
```

## 📝 Scripts disponibles

```bash
npm start              # Iniciar backend
npm run dev            # Backend con nodemon
npm run chatbot        # Iniciar bot WhatsApp
npm run chatbot:dev    # Bot con nodemon
npm test               # Tests Jest
npm run pm2:start      # Iniciar con PM2 (producción)
```

## 👥 Repositorio
- **GitHub**: https://github.com/plaanteos/proyecto-marco
- **Rama**: main

---
**Desarrollado por el equipo de UnionTech** 🚀


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
