@echo off
echo 📱 UnionTech Mobile App - Inicio Rápido
echo =======================================

cd mobile-app

echo 📦 Instalando dependencias...
call npm install

echo 🤖 Configurando Android...
call adb reverse tcp:3000 tcp:3000
call adb reverse tcp:8081 tcp:8081

echo 🚀 Iniciando aplicación...
call npm run android

pause
