/**
 * Rutas de gestión del WhatsApp Bot
 * Expone el estado del bot y permite enviar mensajes desde el panel de administración.
 */
const express = require('express');
const router = express.Router();
const http = require('http');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth-simple');

const BOT_URL = `http://localhost:${process.env.WHATSAPP_BOT_PORT || 3002}`;

// Proxy helper
function botGet(path) {
  return new Promise((resolve) => {
    http.get(`${BOT_URL}${path}`, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => { try { resolve({ ok: true, data: JSON.parse(raw) }); } catch { resolve({ ok: false, data: null }); } });
    }).on('error', () => resolve({ ok: false, data: null, error: 'Bot no disponible' }));
  });
}

function botPost(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      `${BOT_URL}${path}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } },
      (res) => {
        let raw = '';
        res.on('data', c => raw += c);
        res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); } catch { resolve({ status: res.statusCode, body: {} }); } });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// GET /api/whatsapp/status
router.get('/status', auth, async (req, res) => {
  const result = await botGet('/status');
  if (!result.ok) {
    return res.json({ connected: false, status: 'unavailable', message: 'Bot no iniciado. Ejecuta: npm run chatbot' });
  }
  res.json(result.data);
});

// GET /api/whatsapp/qr-url → URL del QR para el frontend
router.get('/qr-url', auth, async (req, res) => {
  res.json({ url: `${BOT_URL}/qr`, imageUrl: `${BOT_URL}/qr.png` });
});

// POST /api/whatsapp/send → enviar mensaje
router.post('/send', auth, [
  body('telefono').notEmpty().withMessage('telefono requerido'),
  body('mensaje').notEmpty().isLength({ max: 4096 }).withMessage('mensaje requerido (max 4096 chars)'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const resp = await botPost('/send', req.body);
    res.status(resp.status).json(resp.body);
  } catch {
    res.status(503).json({ success: false, error: 'Bot no disponible' });
  }
});

// POST /api/whatsapp/send-qr → enviar QR de acceso
router.post('/send-qr', auth, [
  body('telefono').notEmpty(),
  body('visitanteId').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const resp = await botPost('/send-qr', req.body);
    res.status(resp.status).json(resp.body);
  } catch {
    res.status(503).json({ success: false, error: 'Bot no disponible' });
  }
});

// POST /api/whatsapp/send-alert → enviar alerta de seguridad
router.post('/send-alert', auth, [
  body('telefono').notEmpty(),
  body('tipo').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const resp = await botPost('/send-alert', req.body);
    res.status(resp.status).json(resp.body);
  } catch {
    res.status(503).json({ success: false, error: 'Bot no disponible' });
  }
});

// POST /api/whatsapp/broadcast → broadcast a múltiples números
router.post('/broadcast', auth, [
  body('telefonos').isArray({ min: 1 }),
  body('mensaje').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const resp = await botPost('/broadcast', req.body);
    res.status(resp.status).json(resp.body);
  } catch {
    res.status(503).json({ success: false, error: 'Bot no disponible' });
  }
});

module.exports = router;
