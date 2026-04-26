# 🚀 GUÍA DE EJECUCIÓN - UnionTech Mobile App

## 📱 Cómo Ejecutar la Aplicación Móvil

### 📋 PRERREQUISITOS

#### 1. **Herramientas Necesarias**
```powershell
# Verificar Node.js (versión 16 o superior)
node --version

# Verificar npm
npm --version

# React Native CLI
npm install -g react-native-cli
# O usar npx para comandos individuales
```

#### 2. **Para Android**
- **Android Studio** instalado
- **Android SDK** configurado
- **Java JDK 11+** instalado
- **Emulador Android** o dispositivo físico conectado

#### 3. **Para iOS (solo macOS)**
- **Xcode** instalado
- **CocoaPods** instalado: `sudo gem install cocoapods`
- **iOS Simulator** o dispositivo físico

---

## 🛠️ PASOS DE INSTALACIÓN

### **Paso 1: Navegar al Directorio**
```powershell
cd "C:\Users\jesus\OneDrive\Escritorio\UNIONTECH\mobile-app"
```

### **Paso 2: Instalar Dependencias**
```powershell
# Instalar dependencias de Node.js
npm install

# Para iOS (solo macOS) - Instalar pods
cd ios && pod install && cd ..
```

### **Paso 3: Verificar Configuración**
```powershell
# Verificar configuración de React Native
npx react-native doctor

# Verificar dispositivos Android
adb devices

# Limpiar caché si es necesario
npx react-native start --reset-cache
```

---

## 🚀 EJECUTAR LA APLICACIÓN

### **🤖 Para Android**

#### **Opción 1: Con Emulador**
```powershell
# 1. Iniciar Android Studio y crear/iniciar emulador

# 2. En el directorio mobile-app, ejecutar:
npm run android
```

#### **Opción 2: Con Dispositivo Físico**
```powershell
# 1. Conectar dispositivo Android con USB Debugging habilitado
# 2. Verificar conexión
adb devices

# 3. Configurar port forwarding para el backend
adb reverse tcp:3000 tcp:3000

# 4. Ejecutar la app
npm run android
```

#### **Comandos Alternativos Android**
```powershell
# Metro Bundler en terminal separado
npm start

# En otro terminal
npx react-native run-android

# Con device específico
npx react-native run-android --deviceId=DEVICE_ID

# Para release/producción
npm run build:android
```

### **🍎 Para iOS (solo macOS)**

```bash
# Instalar pods primero
cd ios && pod install && cd ..

# Ejecutar en simulador
npm run ios

# Con simulador específico
npx react-native run-ios --simulator="iPhone 14"

# En dispositivo físico
npx react-native run-ios --device="iPhone de Jesus"
```

---

## ⚙️ CONFIGURACIÓN DE AMBIENTE

### **Paso 1: Crear Archivo de Configuración**
```powershell
# Copiar archivo de configuración de ejemplo
copy .env.example .env
```

### **Paso 2: Configurar Variables de Entorno**
Editar el archivo `.env` con la configuración local:

```env
# Backend Configuration
BACKEND_URL=http://localhost:3000
BACKEND_API_URL=http://localhost:3000/api

# Para dispositivo físico Android, usar IP local:
# BACKEND_URL=http://192.168.1.100:3000
# BACKEND_API_URL=http://192.168.1.100:3000/api

# Development Settings
ENVIRONMENT=development
DEBUG_MODE=true
CONSOLE_LOGS=true
```

### **Paso 3: Configurar Backend**
```powershell
# Asegurarse de que el backend esté ejecutándose
cd ..
npm start
# O
node uniontech-server.js
```

---

## 🔧 COMANDOS ÚTILES

### **Desarrollo**
```powershell
# Iniciar Metro Bundler
npm start

# Limpiar caché
npm run clean
npx react-native start --reset-cache

# Ver logs de la app
npm run log:android
npm run log:ios

# Ejecutar tests
npm test
```

### **Debugging**
```powershell
# Habilitar debugging
# En el emulador/dispositivo: Shake device → Enable Remote Debugging

# Flipper (herramienta de debugging)
npx flipper

# React Native Debugger
# Instalar desde: https://github.com/jhen0409/react-native-debugger
```

### **Build para Producción**
```powershell
# Android APK
npm run build:android

# Android Bundle (Google Play)
cd android && ./gradlew bundleRelease

# iOS (macOS)
npm run build:ios
```

---

## 🚨 SOLUCIÓN DE PROBLEMAS COMUNES

### **Error: Metro Bundler**
```powershell
# Limpiar caché y reiniciar
npx react-native start --reset-cache
```

### **Error: Android Build**
```powershell
# Limpiar build de Android
cd android && ./gradlew clean && cd ..
rm -rf node_modules && npm install
```

### **Error: Conexión Backend**
```powershell
# Para dispositivo físico Android
adb reverse tcp:3000 tcp:3000
adb reverse tcp:8081 tcp:8081

# Verificar IP del backend (usar en .env)
ipconfig
```

### **Error: Permisos Android**
- Verificar permisos en `android/app/src/main/AndroidManifest.xml`
- Habilitar "Unknown Sources" en dispositivo
- Verificar USB Debugging

### **Error: iOS Build (macOS)**
```bash
# Reinstalar pods
cd ios && rm -rf Pods && pod install && cd ..

# Limpiar build de iOS
cd ios && xcodebuild clean && cd ..
```

---

## 📱 CONFIGURACIÓN DE DISPOSITIVO

### **Android**
1. **Habilitar Modo Desarrollador**:
   - Settings → About Phone → Tap "Build Number" 7 veces

2. **Habilitar USB Debugging**:
   - Settings → Developer Options → USB Debugging

3. **Permitir Apps de Fuentes Desconocidas**:
   - Settings → Security → Unknown Sources

### **iOS**
1. **Confiar en Desarrollador**:
   - Settings → General → Device Management → Trust Developer

2. **Permitir App**:
   - Primera ejecución requerirá confirmación

---

## 🌐 CONECTAR CON BACKEND

### **Verificar Backend Funcionando**
```powershell
# Verificar que el backend esté ejecutándose
curl http://localhost:3000/api/health
# O abrir en navegador: http://localhost:3000
```

### **Configurar IP para Dispositivo Físico**

1. **Obtener IP Local**:
```powershell
ipconfig
# Buscar "IPv4 Address" de tu red WiFi
```

2. **Actualizar .env**:
```env
BACKEND_URL=http://TU_IP_LOCAL:3000
BACKEND_API_URL=http://TU_IP_LOCAL:3000/api
```

3. **Configurar Port Forwarding** (Android):
```powershell
adb reverse tcp:3000 tcp:3000
```

---

## 🎯 EJECUCIÓN RÁPIDA

### **Comando Todo-en-Uno (Android)**
```powershell
# Script completo de ejecución
cd "C:\Users\jesus\OneDrive\Escritorio\UNIONTECH\mobile-app"
npm install
adb reverse tcp:3000 tcp:3000
npm run android
```

### **Verificación de Estado**
```powershell
# Verificar todo está funcionando
npm run doctor
adb devices
curl http://localhost:3000/api/health
```

---

## 📋 CHECKLIST DE EJECUCIÓN

- [ ] ✅ Node.js 16+ instalado
- [ ] ✅ Android Studio configurado
- [ ] ✅ Emulador/dispositivo conectado
- [ ] ✅ Backend UnionTech ejecutándose
- [ ] ✅ Dependencias instaladas (`npm install`)
- [ ] ✅ Archivo `.env` configurado
- [ ] ✅ Port forwarding configurado
- [ ] ✅ Metro bundler iniciado
- [ ] ✅ App ejecutándose

---

## 🎉 ¡LISTO!

Una vez completados estos pasos, tendrás la **UnionTech Security Mobile App** ejecutándose en tu dispositivo/emulador, conectada al backend y lista para usar todas las funcionalidades profesionales implementadas.

**¡Disfruta de tu aplicación móvil empresarial! 📱✨**
