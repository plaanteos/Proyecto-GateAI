# UnionTech Security Mobile App

## 📱 Aplicación Móvil Profesional de Gestión de Visitantes y Control de Acceso

### 🚀 Descripción

UnionTech Security Mobile es una aplicación móvil profesional desarrollada en React Native que complementa el sistema de seguridad UnionTech. Proporciona una interfaz móvil completa para la gestión de visitantes, control de acceso biométrico y monitoreo de seguridad en tiempo real.

### ✨ Características Principales

#### 🔐 Autenticación y Seguridad
- **Autenticación Biométrica**: Touch ID, Face ID y huella digital
- **Login Seguro**: Autenticación con backend UnionTech
- **Gestión de Tokens**: JWT con refresh automático
- **Almacenamiento Seguro**: Keychain y AsyncStorage encriptado

#### 👥 Gestión de Visitantes
- **Registro de Visitantes**: Formulario completo con validaciones
- **Captura de Fotos**: Integración con cámara del dispositivo
- **Validación Biométrica**: Verificación de identidad en tiempo real
- **Estados de Visitantes**: Pendiente, aprobado, rechazado, activo
- **Historial de Visitas**: Tracking completo de entradas y salidas

#### 🏢 Control de Acceso
- **Zonas de Seguridad**: Gestión de diferentes áreas de acceso
- **Validación por Zona**: Control granular de permisos
- **Horarios de Acceso**: Configuración de ventanas de tiempo
- **Logs de Acceso**: Registro detallado de todos los accesos

#### 📊 Dashboard y Reportes
- **Dashboard Ejecutivo**: Métricas y estadísticas en tiempo real
- **Alertas de Seguridad**: Notificaciones push y in-app
- **Reportes Visuales**: Gráficos y charts interactivos
- **Exportación de Datos**: PDF y Excel desde la app

#### 🔄 Sincronización y Offline
- **Modo Offline**: Funcionalidad básica sin conexión
- **Sincronización Automática**: Sync en background
- **Caché Inteligente**: Almacenamiento local optimizado
- **Redux Persist**: Estado persistente entre sesiones

### 🏗️ Arquitectura Técnica

#### 📦 Stack Tecnológico
```
Frontend Mobile:
├── React Native 0.72.6
├── TypeScript
├── Redux Toolkit + RTK Query
├── React Navigation 6
├── React Native Paper
└── React Native Reanimated 3

Servicios:
├── Biometric Authentication
├── Camera & Image Processing
├── QR Code Scanner
├── Charts & Data Visualization
└── Push Notifications

Backend Integration:
├── RESTful API Client
├── WebSocket Real-time
├── JWT Authentication
└── File Upload/Download
```

#### 🗂️ Estructura del Proyecto
```
mobile-app/
├── src/
│   ├── components/          # Componentes reutilizables
│   │   ├── LoadingScreen.js
│   │   ├── StatisticCard.js
│   │   └── SecurityStatusCard.js
│   ├── screens/             # Pantallas de la aplicación
│   │   ├── SplashScreen.js
│   │   ├── LoginScreen.js
│   │   ├── DashboardScreen.js
│   │   └── VisitorsScreen.js
│   ├── navigation/          # Configuración de navegación
│   │   └── AppNavigator.js
│   ├── store/              # Estado global Redux
│   │   ├── index.js
│   │   └── slices/
│   │       ├── authSlice.js
│   │       ├── visitorsSlice.js
│   │       └── accessControlSlice.js
│   ├── services/           # Servicios de API
│   │   ├── apiService.js
│   │   ├── authService.js
│   │   ├── visitorsService.js
│   │   └── accessControlService.js
│   ├── styles/             # Sistema de diseño
│   │   └── theme.js
│   └── utils/              # Utilidades
├── android/                # Configuración Android
├── ios/                    # Configuración iOS
├── assets/                 # Recursos estáticos
├── package.json
└── README.md
```

### 🛠️ Configuración y Desarrollo

#### 📋 Prerrequisitos
```bash
# Herramientas necesarias
- Node.js >= 16.0.0
- npm >= 8.0.0
- React Native CLI
- Android Studio (para Android)
- Xcode (para iOS - solo macOS)
- Java JDK 11+
- CocoaPods (para iOS)
```

#### 🚀 Instalación y Configuración

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd UNIONTECH/mobile-app
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar iOS (solo macOS)**
```bash
cd ios && pod install && cd ..
```

4. **Configurar variables de entorno**
```bash
# Crear archivo .env
cp .env.example .env

# Configurar variables
BACKEND_URL=http://localhost:3000
API_KEY=your-api-key
ENVIRONMENT=development
```

5. **Configurar permisos Android**
```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.USE_BIOMETRIC" />
<uses-permission android:name="android.permission.USE_FINGERPRINT" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

6. **Configurar permisos iOS**
```xml
<!-- ios/UnionTechSecurity/Info.plist -->
<key>NSCameraUsageDescription</key>
<string>Esta app necesita acceso a la cámara para capturar fotos de visitantes</string>
<key>NSFaceIDUsageDescription</key>
<string>Esta app utiliza Face ID para autenticación segura</string>
```

#### 🏃‍♂️ Comandos de Desarrollo

```bash
# Iniciar Metro Bundler
npm start

# Ejecutar en Android
npm run android

# Ejecutar en iOS
npm run ios

# Limpiar caché
npm run clean
npm run reset-cache

# Linting y Type Checking
npm run lint
npm run type-check

# Tests
npm test
```

#### 🔧 Comandos de Construcción

```bash
# Build Android APK
npm run build:android

# Build Android Bundle (Google Play)
npm run build:android:bundle

# Build iOS Archive
npm run build:ios
```

### 🎨 Sistema de Diseño

#### 🎨 Paleta de Colores
```javascript
const colors = {
  primary: '#1976d2',      // Azul principal
  secondary: '#dc004e',    // Rosa secundario
  success: '#4caf50',      // Verde éxito
  warning: '#ff9800',      // Naranja advertencia
  error: '#f44336',        // Rojo error
  background: '#f5f5f5',   // Fondo gris claro
  surface: '#ffffff',      // Superficie blanca
  text: '#212121',         // Texto principal
}
```

#### 📝 Tipografía
```javascript
const typography = {
  regular: 'Roboto-Regular',
  medium: 'Roboto-Medium',
  bold: 'Roboto-Bold',
  light: 'Roboto-Light',
}
```

#### 📏 Espaciado
```javascript
const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
}
```

### 📱 Pantallas Principales

#### 🏠 Dashboard
- **Estadísticas en Tiempo Real**: Visitantes activos, accesos del día
- **Estado de Seguridad**: Nivel de alerta actual
- **Acciones Rápidas**: Botones para funciones principales
- **Actividad Reciente**: Lista de eventos recientes

#### 👥 Gestión de Visitantes
- **Lista de Visitantes**: Vista filtrable y buscable
- **Registro de Visitante**: Formulario completo con foto
- **Detalles del Visitante**: Información completa y historial
- **Validación Biométrica**: Proceso de verificación

#### 🔐 Control de Acceso
- **Zonas de Acceso**: Lista de áreas controladas
- **Validación de Acceso**: Scanner biométrico/QR
- **Logs de Acceso**: Historial de entradas/salidas
- **Configuración de Seguridad**: Ajustes de validación

#### 📊 Reportes y Alertas
- **Dashboard de Métricas**: Gráficos y estadísticas
- **Alertas de Seguridad**: Notificaciones críticas
- **Exportación de Reportes**: PDF y Excel
- **Configuración de Notificaciones**: Preferencias de alerta

### 🔗 Integración con Backend

#### 🌐 API Endpoints
```javascript
const endpoints = {
  auth: {
    login: '/api/auth/login',
    biometric: '/api/auth/biometric',
    refresh: '/api/auth/refresh',
  },
  visitors: {
    list: '/api/visitors',
    register: '/api/visitors/register',
    validate: '/api/visitors/validate',
  },
  access: {
    zones: '/api/access/zones',
    validate: '/api/access/validate',
    logs: '/api/access/logs',
  }
}
```

#### 📡 WebSocket Events
```javascript
const socketEvents = {
  'visitor_registered': handleVisitorRegistered,
  'access_granted': handleAccessGranted,
  'security_alert': handleSecurityAlert,
  'system_status': handleSystemStatus,
}
```

### 🔒 Seguridad

#### 🛡️ Medidas de Seguridad Implementadas

1. **Autenticación Robusta**
   - JWT con refresh tokens
   - Biometric authentication
   - Keychain storage (iOS) / Keystore (Android)

2. **Comunicación Segura**
   - HTTPS/TLS encryption
   - Certificate pinning
   - Request signing

3. **Almacenamiento Seguro**
   - Encrypted AsyncStorage
   - Sensitive data in Keychain/Keystore
   - No plain text credentials

4. **Validación de Datos**
   - Input sanitization
   - Schema validation
   - XSS protection

### 📈 Performance

#### ⚡ Optimizaciones Implementadas

1. **Renderizado Optimizado**
   - React.memo para componentes
   - useMemo y useCallback
   - FlatList para listas grandes

2. **Gestión de Estado Eficiente**
   - Redux Toolkit con RTK Query
   - Normalized state structure
   - Selective subscriptions

3. **Carga de Imágenes**
   - Lazy loading
   - Image caching
   - Compression automática

4. **Bundle Optimization**
   - Code splitting
   - Tree shaking
   - Hermes JavaScript engine

### 🧪 Testing

#### 🔬 Estrategia de Testing

```bash
# Unit Tests
npm run test:unit

# Integration Tests
npm run test:integration

# E2E Tests
npm run test:e2e

# Performance Tests
npm run test:performance
```

#### 📊 Coverage Report
```bash
npm run test:coverage
```

### 🚀 Deployment

#### 📦 Preparación para Producción

1. **Android (Google Play)**
```bash
# Generar keystore
keytool -genkey -v -keystore uniontech-release-key.keystore -alias uniontech -keyalg RSA -keysize 2048 -validity 10000

# Build signed APK
npm run build:android

# Build AAB para Google Play
npm run build:android:bundle
```

2. **iOS (App Store)**
```bash
# Configurar certificados en Xcode
# Build archive
npm run build:ios

# Upload a App Store Connect
```

#### 🌐 Distribución

1. **Internal Testing**
   - TestFlight (iOS)
   - Internal App Sharing (Android)

2. **Beta Testing**
   - TestFlight External Testing
   - Google Play Internal Testing

3. **Production Release**
   - App Store Review
   - Google Play Review
   - Phased rollout

### 📋 Roadmap

#### 🎯 Próximas Funcionalidades

- [ ] **Notificaciones Push**: Firebase Cloud Messaging
- [ ] **Modo Offline Avanzado**: Sync diferido inteligente
- [ ] **AR Scanner**: Reconocimiento facial con ARKit/ARCore
- [ ] **Voice Commands**: Integración con Siri/Google Assistant
- [ ] **Apple Watch/Wear OS**: Companion apps
- [ ] **Multi-idioma**: Internacionalización completa
- [ ] **Dark Mode**: Tema oscuro adaptativo
- [ ] **Accessibility**: Soporte completo para discapacidades

#### 🔄 Mejoras Técnicas

- [ ] **TypeScript Migration**: Conversión completa a TS
- [ ] **New Architecture**: Fabric y TurboModules
- [ ] **Code Push**: Updates over-the-air
- [ ] **Performance Monitoring**: Crashlytics y Analytics
- [ ] **Automated Testing**: CI/CD completo
- [ ] **Security Audit**: Penetration testing

### 🤝 Contribución

#### 📝 Guías de Contribución

1. **Fork del repositorio**
2. **Crear branch de feature**: `git checkout -b feature/nueva-funcionalidad`
3. **Commit cambios**: `git commit -m 'Add: nueva funcionalidad'`
4. **Push al branch**: `git push origin feature/nueva-funcionalidad`
5. **Crear Pull Request**

#### 📋 Convenciones de Código

- **ESLint**: Seguir reglas definidas
- **Prettier**: Formateo automático
- **Conventional Commits**: Mensajes estructurados
- **Component Naming**: PascalCase para componentes
- **File Naming**: camelCase para archivos

### 📞 Soporte

#### 🆘 Obtener Ayuda

- **Documentación**: [Wiki del proyecto]
- **Issues**: Reportar bugs en GitHub Issues
- **Discussions**: GitHub Discussions para preguntas
- **Email**: support@uniontech.com

#### 🐛 Reportar Bugs

Usar la plantilla de issue con:
- Pasos para reproducir
- Comportamiento esperado vs actual
- Screenshots/videos
- Información del dispositivo
- Logs relevantes

### 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

---

**UnionTech Security Mobile App** - Desarrollado con ❤️ por el equipo de UnionTech

*Versión: 1.0.0 | Última actualización: Noviembre 2024*
