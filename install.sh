#!/bin/bash

# Script de Instalación Completa UnionTech v2.0
# Instala todas las dependencias y configura el sistema

echo "🚀 =================================="
echo "   UNIONTECH INSTALLATION SCRIPT"
echo "   Version 2.0 - Complete Edition"
echo "🚀 =================================="
echo ""

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instala Node.js 18+ primero."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Se requiere Node.js 18 o superior. Versión actual: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detectado"

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está disponible"
    exit 1
fi

echo "✅ npm $(npm -v) detectado"

# Instalar dependencias
echo "📦 Instalando dependencias de Node.js..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Error instalando dependencias"
    exit 1
fi

echo "✅ Dependencias instaladas exitosamente"

# Configurar archivo .env
echo "⚙️ Configurando archivo de entorno..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Archivo .env creado desde .env.example"
    echo "⚠️ IMPORTANTE: Edita el archivo .env con tus configuraciones específicas"
else
    echo "⚠️ Archivo .env ya existe, no se sobrescribió"
fi

# Crear directorios necesarios
echo "📁 Creando directorios del sistema..."
mkdir -p logs
mkdir -p data/documents
mkdir -p data/faces
mkdir -p uploads
mkdir -p backups

echo "✅ Directorios creados"

# Verificar Redis (opcional)
echo "🔴 Verificando Redis..."
if command -v redis-cli &> /dev/null; then
    if redis-cli ping &> /dev/null; then
        echo "✅ Redis está ejecutándose"
    else
        echo "⚠️ Redis instalado pero no ejecutándose"
        echo "   Para instalar Redis:"
        echo "   - Windows: Descargar desde https://redis.io/download"
        echo "   - macOS: brew install redis"
        echo "   - Ubuntu: sudo apt install redis-server"
    fi
else
    echo "⚠️ Redis no detectado (opcional para cache)"
    echo "   El sistema funcionará sin Redis pero con menor rendimiento"
fi

# Verificar SQL Server (requerido)
echo "🗄️ Verificando configuración de base de datos..."
echo "⚠️ IMPORTANTE: Asegúrate de tener SQL Server configurado"
echo "   1. Instala SQL Server o SQL Server Express"
echo "   2. Crea una base de datos llamada 'uniontech'"
echo "   3. Configura la cadena de conexión en .env"
echo "   4. Ejecuta: npm run prisma:migrate"

# Mostrar siguiente pasos
echo ""
echo "🎯 =================================="
echo "   INSTALACIÓN COMPLETADA"
echo "🎯 =================================="
echo ""
echo "📋 PRÓXIMOS PASOS:"
echo ""
echo "1. 📝 Editar configuración:"
echo "   nano .env"
echo ""
echo "2. 🗄️ Configurar base de datos:"
echo "   npm run prisma:generate"
echo "   npm run prisma:migrate"
echo ""
echo "3. 🚀 Iniciar el sistema:"
echo "   # Modo desarrollo:"
echo "   npm run dev"
echo "   # Modo producción:"
echo "   npm run production:start"
echo ""
echo "4. 🔧 Inicializar servicios (opcional):"
echo "   # Con PM2:"
echo "   npm run pm2:start"
echo ""
echo "📡 URLs del sistema:"
echo "   - API REST: http://localhost:3000/api"
echo "   - Health Check: http://localhost:3000/health"
echo "   - Dashboard: http://localhost:3000/dashboard"
echo ""
echo "📚 DOCUMENTACIÓN:"
echo "   - README.md: Documentación general"
echo "   - DEPLOYMENT-GUIDE.md: Guía de despliegue"
echo "   - API endpoints: GET /api/system/info"
echo ""
echo "🎉 ¡UnionTech está listo para usar!"
echo ""
