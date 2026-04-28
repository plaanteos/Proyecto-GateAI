/**
 * UnionTech WhatsApp Bot
 * 
 * Bot autónomo que expone una API REST en el puerto 3002.
 * El backend principal (puerto 3001) lo llama para enviar mensajes.
 * 
 * Uso: node chatbot-whatsapp.js
 * Scripts: npm run chatbot  /  npm run chatbot:dev
 */

require('dotenv').config();
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
const express = require('express');
const http = require('http');

// ─────────────────────────────────────────────
// ESTADO GLOBAL DEL BOT
// ─────────────────────────────────────────────
const BOT_PORT = process.env.WHATSAPP_BOT_PORT || 3002;
let botStatus = 'initializing'; // initializing | qr_pending | connected | disconnected | auth_failure
let currentQR = null;
let whatsappClient = null;

// ─────────────────────────────────────────────
// MENSAJES DEL CHATBOT (respuestas automáticas)
// ─────────────────────────────────────────────
const COMPANY_NAME = process.env.COMPANY_NAME || 'UnionTech';
const ADMIN_PHONE = process.env.ADMIN_WHATSAPP || null; // ej: '+5491112345678'

const BOT_RESPONSES = {
  greetings: ['hola', 'hello', 'hi', 'buenas', 'buen día', 'buenos días', 'buenas tardes', 'buenas noches'],
  help: ['ayuda', 'help', 'menu', 'menú', 'opciones', 'info'],
  qr: ['qr', 'código', 'codigo', 'mi qr', 'ver qr', 'acceso'],
  status: ['estado', 'status', 'mi visita', 'visita', 'registro'],
  cancel: ['cancelar', 'cancel', 'anular'],
};

function getGreetingMessage(name = '') {
  const greeting = name ? `¡Hola ${name}!` : '¡Hola!';
  return `${greeting} 👋 Bienvenido/a al sistema de control de accesos de *${COMPANY_NAME}*.

Puedo ayudarte con:
1️⃣ *Ver mi QR de acceso* - escribe "QR"
2️⃣ *Estado de mi visita* - escribe "estado"
3️⃣ *Cancelar visita* - escribe "cancelar"
4️⃣ *Hablar con soporte* - escribe "soporte"

O simplemente cuéntame en qué puedo ayudarte. 😊`;
}

function getHelpMessage() {
  return `📋 *Comandos disponibles:*

🔹 *QR* → Ver tu código de acceso
🔹 *ESTADO* → Consultar el estado de tu visita
🔹 *CANCELAR* → Cancelar tu visita registrada
🔹 *SOPORTE* → Contactar con el equipo de seguridad

_Sistema de control de accesos ${COMPANY_NAME}_`;
}

function getSupportMessage() {
  return `🆘 *Soporte en camino*

Hemos notificado al equipo de seguridad. En breve se comunicarán contigo.

Horario de atención: 24/7 para emergencias.

Si tienes una emergencia inmediata, llama al número de seguridad de la empresa.`;
}

// ─────────────────────────────────────────────
// CLIENTE WHATSAPP
// ─────────────────────────────────────────────
function initWhatsAppClient() {
  console.log('🤖 Iniciando cliente WhatsApp...');

  whatsappClient = new Client({
    authStrategy: new LocalAuth({ clientId: 'uniontech-bot' }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
      ],
    },
    webVersionCache: {
      type: 'remote',
      remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
    },
  });

  // ── QR CODE ──────────────────────────────────
  whatsappClient.on('qr', async (qr) => {
    botStatus = 'qr_pending';
    currentQR = qr;
    console.log('\n📱 Escanea este QR con WhatsApp en tu teléfono:\n');
    qrcode.generate(qr, { small: true });
    console.log('\n💡 O abre http://localhost:' + BOT_PORT + '/qr en tu navegador para ver el QR como imagen.\n');
  });

  // ── LISTO ──────────────────────────────────
  whatsappClient.on('ready', () => {
    botStatus = 'connected';
    currentQR = null;
    const info = whatsappClient.info;
    console.log(`\n✅ WhatsApp Bot conectado!`);
    console.log(`   📞 Número: ${info?.wid?.user || 'N/A'}`);
    console.log(`   👤 Nombre: ${info?.pushname || 'N/A'}`);
    console.log(`   🌐 API disponible en http://localhost:${BOT_PORT}\n`);
  });

  // ── AUTENTICADO ──────────────────────────────
  whatsappClient.on('authenticated', () => {
    console.log('🔐 Sesión autenticada correctamente.');
  });

  // ── ERROR AUTH ──────────────────────────────
  whatsappClient.on('auth_failure', (msg) => {
    botStatus = 'auth_failure';
    console.error('❌ Error de autenticación WhatsApp:', msg);
  });

  // ── DESCONECTADO ──────────────────────────────
  whatsappClient.on('disconnected', (reason) => {
    botStatus = 'disconnected';
    currentQR = null;
    console.warn('⚠️ WhatsApp Bot desconectado:', reason);
    console.log('🔄 Reintentando en 10 segundos...');
    setTimeout(() => {
      whatsappClient.initialize().catch(console.error);
    }, 10000);
  });

  // ── MENSAJES ENTRANTES (CHATBOT) ──────────────
  whatsappClient.on('message', async (msg) => {
    if (msg.fromMe) return; // Ignorar mensajes propios

    const body = msg.body.trim().toLowerCase();
    const contact = await msg.getContact();
    const name = contact.pushname || contact.name || '';

    console.log(`📨 Mensaje de ${contact.number} (${name}): ${msg.body}`);

    try {
      // SALUDOS
      if (BOT_RESPONSES.greetings.some(g => body.includes(g))) {
        await msg.reply(getGreetingMessage(name));
        return;
      }

      // AYUDA / MENÚ
      if (BOT_RESPONSES.help.some(h => body.includes(h))) {
        await msg.reply(getHelpMessage());
        return;
      }

      // VER QR
      if (BOT_RESPONSES.qr.some(q => body.includes(q))) {
        await msg.reply(
          `🔍 Para obtener tu *QR de acceso*, el administrador debe haberte enviado uno al registrar tu visita.\n\n` +
          `Si no lo recibiste, pide al personal de seguridad que te reenvíe el acceso.\n\n` +
          `📞 También puedes escribir *soporte* para que un agente te atienda.`
        );
        return;
      }

      // ESTADO
      if (BOT_RESPONSES.status.some(s => body.includes(s))) {
        await msg.reply(
          `📋 *Consulta de estado*\n\n` +
          `Para verificar el estado de tu visita, el personal de seguridad debe confirmarte en el sistema.\n\n` +
          `Escribe *soporte* si necesitas asistencia inmediata.`
        );
        return;
      }

      // CANCELAR
      if (BOT_RESPONSES.cancel.some(c => body.includes(c))) {
        await msg.reply(
          `❌ *Cancelación de visita*\n\n` +
          `Para cancelar una visita registrada, comunícate con el área de Seguridad o escribe *soporte*.\n\n` +
          `Nuestro equipo procesará tu solicitud a la brevedad.`
        );
        return;
      }

      // SOPORTE
      if (body.includes('soporte') || body.includes('support') || body.includes('agente') || body.includes('humano')) {
        await msg.reply(getSupportMessage());
        // Notificar al admin si está configurado
        if (ADMIN_PHONE) {
          const adminId = ADMIN_PHONE.replace('+', '') + '@c.us';
          await whatsappClient.sendMessage(
            adminId,
            `🔔 *Solicitud de soporte*\n` +
            `👤 Usuario: ${name || 'Sin nombre'}\n` +
            `📞 Número: ${contact.number}\n` +
            `💬 Último mensaje: "${msg.body}"`
          );
        }
        return;
      }

      // RESPUESTA POR DEFECTO
      await msg.reply(
        `🤖 Entendido, "${msg.body}".\n\n` +
        `No estoy seguro de cómo ayudarte con eso. Escribe *ayuda* para ver lo que puedo hacer. 😊`
      );

    } catch (err) {
      console.error('❌ Error procesando mensaje:', err.message);
    }
  });

  // Inicializar
  whatsappClient.initialize().catch((err) => {
    console.error('❌ Error inicializando WhatsApp:', err.message);
    botStatus = 'disconnected';
  });
}

// ─────────────────────────────────────────────
// HELPER: FORMATEAR NÚMERO DE TELÉFONO
// ─────────────────────────────────────────────
function formatPhone(phone) {
  // Remover todo lo que no sea dígito o +
  let num = phone.replace(/[^0-9+]/g, '');
  // Asegurar que empiece con +
  if (!num.startsWith('+')) num = '+' + num;
  // Formato para whatsapp-web.js: sin + seguido de @c.us
  return num.replace('+', '') + '@c.us';
}

// ─────────────────────────────────────────────
// HELPER: GENERAR QR COMO DATA URL
// ─────────────────────────────────────────────
async function generateQRImage(data) {
  return QRCode.toDataURL(data, {
    width: 300,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
  });
}

// ─────────────────────────────────────────────
// API REST INTERNA (puerto 3002)
// ─────────────────────────────────────────────
const app = express();
app.use(express.json());

// CORS solo para localhost (el backend en 3001)
app.use((req, res, next) => {
  const allowed = ['http://localhost:3001', 'http://127.0.0.1:3001'];
  const origin = req.headers.origin;
  if (!origin || allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// GET /status → estado del bot
app.get('/status', (req, res) => {
  const info = botStatus === 'connected' && whatsappClient?.info;
  res.json({
    status: botStatus,
    connected: botStatus === 'connected',
    phone: info?.wid?.user || null,
    name: info?.pushname || null,
    qrPending: botStatus === 'qr_pending',
  });
});

// GET /qr → imagen del QR de conexión (HTML o PNG)
app.get('/qr', async (req, res) => {
  if (botStatus === 'connected') {
    return res.send('<html><body style="font-family:sans-serif;text-align:center;padding:40px"><h2>✅ WhatsApp Bot ya está conectado</h2><p>El bot está funcionando correctamente.</p></body></html>');
  }
  if (!currentQR) {
    return res.send('<html><body style="font-family:sans-serif;text-align:center;padding:40px"><h2>⏳ Generando QR...</h2><p>Recarga en unos segundos.</p><script>setTimeout(()=>location.reload(),3000)</script></body></html>');
  }
  try {
    const dataUrl = await generateQRImage(currentQR);
    res.send(`<html><head><title>UnionTech WhatsApp QR</title></head>
<body style="font-family:sans-serif;text-align:center;padding:40px;background:#f5f5f5">
<h2>📱 Conecta WhatsApp</h2>
<p>Abre WhatsApp → Dispositivos vinculados → Vincular dispositivo</p>
<img src="${dataUrl}" style="border:4px solid #25D366;border-radius:12px;max-width:300px" />
<p style="color:#888;font-size:13px">El QR expira en 60 segundos. Recarga la página si es necesario.</p>
<script>setTimeout(()=>location.reload(),20000)</script>
</body></html>`);
  } catch (err) {
    res.status(500).send('Error generando QR: ' + err.message);
  }
});

// GET /qr.png → imagen PNG del QR (para el frontend)
app.get('/qr.png', async (req, res) => {
  if (!currentQR) return res.status(404).json({ error: 'QR no disponible' });
  try {
    const buffer = await QRCode.toBuffer(currentQR, { width: 300 });
    res.setHeader('Content-Type', 'image/png');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /send → enviar mensaje de texto
app.post('/send', async (req, res) => {
  const { telefono, mensaje } = req.body;
  if (!telefono || !mensaje) {
    return res.status(400).json({ success: false, error: 'telefono y mensaje son requeridos' });
  }
  if (botStatus !== 'connected') {
    return res.status(503).json({ success: false, error: 'Bot no conectado. Estado: ' + botStatus });
  }
  try {
    const chatId = formatPhone(telefono);
    await whatsappClient.sendMessage(chatId, mensaje);
    console.log(`✅ Mensaje enviado a ${telefono}`);
    res.json({ success: true, to: telefono });
  } catch (err) {
    console.error(`❌ Error enviando a ${telefono}:`, err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /send-qr → enviar QR de acceso como imagen + texto
app.post('/send-qr', async (req, res) => {
  const { telefono, nombre, visitanteId, tipo, fecha, hora, areas } = req.body;
  if (!telefono || !visitanteId) {
    return res.status(400).json({ success: false, error: 'telefono y visitanteId son requeridos' });
  }
  if (botStatus !== 'connected') {
    return res.status(503).json({ success: false, error: 'Bot no conectado. Estado: ' + botStatus });
  }
  try {
    const chatId = formatPhone(telefono);
    const nombreStr = nombre || 'Visitante';
    const tipoStr = tipo === 'recurrente' ? '🔄 Recurrente' : '📅 Temporal';

    // Datos del QR
    const qrData = JSON.stringify({
      id: visitanteId,
      tipo: tipo || 'temporal',
      empresa: COMPANY_NAME,
      ts: Date.now(),
    });

    // Generar imagen del QR
    const qrBuffer = await QRCode.toBuffer(qrData, {
      width: 400,
      margin: 2,
      color: { dark: '#1a1a2e', light: '#ffffff' },
    });

    // Mensaje de bienvenida
    const mensaje =
      `🎫 *Código de acceso - ${COMPANY_NAME}*\n\n` +
      `👤 *Visitante:* ${nombreStr}\n` +
      `${tipoStr}${fecha ? `\n📅 *Fecha:* ${fecha}` : ''}${hora ? `\n🕐 *Hora:* ${hora}` : ''}` +
      `${areas ? `\n📍 *Áreas:* ${areas}` : ''}\n\n` +
      `📌 *Instrucciones:*\n` +
      `1. Muestra este QR en la entrada del edificio\n` +
      `2. El personal de seguridad lo escaneará\n` +
      `3. Conserva este mensaje hasta tu salida\n\n` +
      `⚠️ _Este código es personal e intransferible_\n` +
      `🔒 _${COMPANY_NAME} - Sistema de Control de Accesos_`;

    // Enviar imagen del QR
    const media = new MessageMedia('image/png', qrBuffer.toString('base64'), 'acceso-qr.png');
    await whatsappClient.sendMessage(chatId, media, { caption: mensaje });

    console.log(`✅ QR de acceso enviado a ${telefono} (visitante: ${visitanteId})`);
    res.json({ success: true, to: telefono, visitanteId });
  } catch (err) {
    console.error(`❌ Error enviando QR a ${telefono}:`, err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /send-alert → enviar alerta de seguridad
app.post('/send-alert', async (req, res) => {
  const { telefono, tipo, detalle, nivel } = req.body;
  if (!telefono || !tipo) {
    return res.status(400).json({ success: false, error: 'telefono y tipo son requeridos' });
  }
  if (botStatus !== 'connected') {
    return res.status(503).json({ success: false, error: 'Bot no conectado' });
  }
  try {
    const chatId = formatPhone(telefono);
    const nivelEmoji = nivel === 'alta' ? '🔴' : nivel === 'media' ? '🟡' : '🟢';
    const mensaje =
      `${nivelEmoji} *ALERTA DE SEGURIDAD - ${COMPANY_NAME}*\n\n` +
      `⚠️ *Tipo:* ${tipo}\n` +
      `${detalle ? `📋 *Detalle:* ${detalle}\n` : ''}` +
      `🕐 *Hora:* ${new Date().toLocaleString('es-AR')}\n\n` +
      `_Sistema de monitoreo ${COMPANY_NAME}_`;
    await whatsappClient.sendMessage(chatId, mensaje);
    res.json({ success: true, to: telefono });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /broadcast → enviar a múltiples números
app.post('/broadcast', async (req, res) => {
  const { telefonos, mensaje } = req.body;
  if (!Array.isArray(telefonos) || !mensaje) {
    return res.status(400).json({ success: false, error: 'telefonos (array) y mensaje son requeridos' });
  }
  if (botStatus !== 'connected') {
    return res.status(503).json({ success: false, error: 'Bot no conectado' });
  }
  const results = [];
  for (const tel of telefonos) {
    try {
      await whatsappClient.sendMessage(formatPhone(tel), mensaje);
      results.push({ telefono: tel, success: true });
      await new Promise(r => setTimeout(r, 1000)); // delay para evitar spam ban
    } catch (err) {
      results.push({ telefono: tel, success: false, error: err.message });
    }
  }
  res.json({ success: true, results });
});

// GET /health
app.get('/health', (req, res) => {
  res.json({ ok: true, status: botStatus, port: BOT_PORT });
});

// ─────────────────────────────────────────────
// ARRANCAR
// ─────────────────────────────────────────────
const server = http.createServer(app);
server.listen(BOT_PORT, () => {
  console.log(`\n🤖 UnionTech WhatsApp Bot`);
  console.log(`📡 API interna: http://localhost:${BOT_PORT}`);
  console.log(`🔍 QR de conexión: http://localhost:${BOT_PORT}/qr`);
  console.log(`📊 Estado: http://localhost:${BOT_PORT}/status\n`);
  initWhatsAppClient();
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Puerto ${BOT_PORT} ocupado. Cambia WHATSAPP_BOT_PORT en .env`);
  } else {
    console.error('❌ Error del servidor:', err.message);
  }
  process.exit(1);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 Apagando bot...');
  if (whatsappClient) {
    await whatsappClient.destroy().catch(() => {});
  }
  server.close(() => process.exit(0));
});
