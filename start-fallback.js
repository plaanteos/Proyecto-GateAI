#!/usr/bin/env node
/**
 * Script de inicio robusto para UNIONTECH
 * Maneja modo fallback sin base de datos
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando UNIONTECH en modo robusto...');
console.log('📄 Base de datos: OMITIDA (modo fallback)');
console.log('🔧 Servicios: Modo fallback habilitado');
console.log('');

// Configurar variables de entorno para modo fallback
process.env.DATABASE_MODE = 'fallback';
process.env.SKIP_DB_CONNECTION = 'true';

// Iniciar servidor
const serverProcess = spawn('node', ['src/server-complete.js'], {
    stdio: 'inherit',
    cwd: path.join(__dirname),
    env: {
        ...process.env,
        DATABASE_MODE: 'fallback',
        SKIP_DB_CONNECTION: 'true'
    }
});

serverProcess.on('close', (code) => {
    if (code !== 0) {
        console.log(`\n⚠️ Servidor terminado con código: ${code}`);
        console.log('🔄 Para reiniciar: node start-fallback.js');
    }
});

// Manejo de señales para parada elegante
process.on('SIGINT', () => {
    console.log('\n🛑 Deteniendo servidor...');
    serverProcess.kill('SIGTERM');
});

process.on('SIGTERM', () => {
    serverProcess.kill('SIGTERM');
});