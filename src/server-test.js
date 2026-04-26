/**
 * Servidor de diagnóstico para identificar problemas
 */

require('dotenv').config();
console.log('✅ Dotenv cargado');

const express = require('express');
console.log('✅ Express cargado');

const app = express();
console.log('✅ App de Express creado');

// Middleware básico
app.use(express.json());
console.log('✅ Middleware JSON configurado');

// Ruta de prueba
app.get('/test', (req, res) => {
    res.json({ message: 'Servidor de diagnóstico funcionando', timestamp: new Date() });
});
console.log('✅ Ruta de prueba configurada');

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`🚀 Servidor de diagnóstico en puerto ${PORT}`);
    console.log(`🧪 Prueba: http://localhost:${PORT}/test`);
});
console.log('✅ Listener configurado');
