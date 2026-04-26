# 🚀 INICIO RÁPIDO - UnionTech Mobile App

## ⚡ EJECUCIÓN INMEDIATA

### **Opción 1: Una sola línea (Recomendado)**
```powershell
cd "C:\Users\jesus\OneDrive\Escritorio\UNIONTECH" && .\start-mobile-quick.bat
```

### **Opción 2: Paso a paso**
```powershell
# 1. Ir al directorio mobile-app
cd "C:\Users\jesus\OneDrive\Escritorio\UNIONTECH\mobile-app"

# 2. Instalar dependencias
npm install

# 3. Ejecutar en Android
npm run android
```

### **Opción 3: Con Expo (Más fácil)**
```powershell
# Instalar Expo CLI globalmente
npm install -g @expo/cli

# Crear proyecto Expo
npx create-expo-app UnionTechExpo --template
cd UnionTechExpo

# Ejecutar
npm start
```

---

## 📱 **PARA COMENZAR INMEDIATAMENTE**

### **Si tienes Android Studio instalado:**
1. **Abrir Android Studio**
2. **Crear/iniciar un emulador Android**
3. **Ejecutar:**
```powershell
cd "C:\Users\jesus\OneDrive\Escritorio\UNIONTECH\mobile-app"
npm install
npm run android
```

### **Si NO tienes Android Studio:**
1. **Instalar Expo Go** en tu teléfono desde:
   - Google Play Store (Android)
   - App Store (iOS)

2. **Usar Expo:**
```powershell
cd "C:\Users\jesus\OneDrive\Escritorio\UNIONTECH"
npx create-expo-app UnionTechMobileExpo
cd UnionTechMobileExpo
npm start
```

3. **Escanear QR** con Expo Go en tu teléfono

---

## 🛠️ **INSTALACIÓN FÁCIL DE HERRAMIENTAS**

### **Android Studio (Para emulador):**
1. Descargar desde: https://developer.android.com/studio
2. Instalar con configuración por defecto
3. Abrir → Tools → AVD Manager → Create Virtual Device

### **Expo CLI (Alternativa más fácil):**
```powershell
npm install -g @expo/cli
npm install -g eas-cli
```

---

## 🎯 **COMANDO DE EMERGENCIA (Funciona siempre)**

Si nada más funciona, usa Expo Web:

```powershell
cd "C:\Users\jesus\OneDrive\Escritorio\UNIONTECH"
npx create-expo-app UnionTechWeb
cd UnionTechWeb
npm run web
```

Esto abrirá la app en tu navegador web.

---

## 📞 **SOLUCIÓN RÁPIDA DE PROBLEMAS**

### **Error: "adb not found"**
- Instalar Android Studio
- O usar Expo (no necesita Android Studio)

### **Error: "No devices found"**
- Crear emulador en Android Studio
- O usar Expo Go en teléfono real

### **Error: "Port 8081 already in use"**
```powershell
npx react-native start --port=8082
```

### **Error: "React Native not found"**
```powershell
npm install -g react-native-cli
```

---

## 🎉 **MÉTODO MÁS FÁCIL (RECOMENDADO)**

```powershell
# 1. Instalar Expo
npm install -g @expo/cli

# 2. Crear proyecto
cd "C:\Users\jesus\OneDrive\Escritorio\UNIONTECH"
npx create-expo-app UnionTechSimple

# 3. Entrar al proyecto
cd UnionTechSimple

# 4. Ejecutar
npm start

# 5. Instalar "Expo Go" en tu teléfono y escanear QR
```

**¡Listo! Tu app estará ejecutándose en tu teléfono en menos de 5 minutos! 📱✨**
