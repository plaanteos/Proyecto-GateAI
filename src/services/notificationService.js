require('dotenv').config();
const http = require('http');
const twilio = require('twilio');
const sgMail = require('@sendgrid/mail');

// ── WhatsApp Bot local (chatbot-whatsapp.js en puerto 3002) ──────────────────
const BOT_URL = `http://localhost:${process.env.WHATSAPP_BOT_PORT || 3002}`;

async function callBot(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      `${BOT_URL}${path}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } },
      (res) => {
        let raw = '';
        res.on('data', c => raw += c);
        res.on('end', () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
          catch { resolve({ status: res.statusCode, body: raw }); }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function getBotStatus() {
  return new Promise((resolve) => {
    http.get(`${BOT_URL}/status`, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => { try { resolve(JSON.parse(raw)); } catch { resolve(null); } });
    }).on('error', () => resolve(null));
  });
}

// Verificar credenciales de Twilio
const twilioSid = process.env.TWILIO_ACCOUNT_SID;
const twilioToken = process.env.TWILIO_AUTH_TOKEN;
const isTwilioConfigured = twilioSid && 
                          twilioToken && 
                          twilioSid.startsWith('AC') && 
                          !twilioSid.includes('your_twilio') &&
                          !twilioToken.includes('your_twilio');

// Verificar credenciales de SendGrid
const sendgridKey = process.env.SENDGRID_API_KEY;
const isSendGridConfigured = sendgridKey && 
                            sendgridKey.startsWith('SG.') && 
                            !sendgridKey.includes('your_sendgrid');

// Configuración de Twilio (solo si está configurado)
let twilioClient = null;
if (isTwilioConfigured) {
  try {
    twilioClient = twilio(twilioSid, twilioToken);
    console.log('✅ Twilio configurado correctamente');
  } catch (error) {
    console.error('❌ Error configurando Twilio:', error.message);
  }
} else {
  console.log('⚠️ Twilio no configurado - usar credenciales reales en .env');
}

// Configuración de SendGrid (solo si está configurado)
if (isSendGridConfigured) {
  try {
    sgMail.setApiKey(sendgridKey);
    console.log('✅ SendGrid configurado correctamente');
  } catch (error) {
    console.error('❌ Error configurando SendGrid:', error.message);
  }
} else {
  console.log('⚠️ SendGrid no configurado - usar credenciales reales en .env');
}

class NotificationService {
  
  // Enviar WhatsApp — usa bot local primero, Twilio como fallback
  async enviarWhatsApp(telefono, mensaje) {
    // 1. Intentar bot local (whatsapp-web.js)
    try {
      const botState = await getBotStatus();
      if (botState && botState.connected) {
        const resp = await callBot('/send', { telefono, mensaje });
        if (resp.body && resp.body.success) {
          console.log(`✅ WhatsApp enviado via bot local a ${telefono}`);
          return { success: true, to: telefono, channel: 'whatsapp', via: 'bot' };
        }
      }
    } catch (e) {
      console.log('⚠️ Bot local no disponible, intentando Twilio...');
    }

    // 2. Fallback: Twilio
    try {
      if (!isTwilioConfigured || !twilioClient) {
        return {
          success: false,
          error: 'Bot WhatsApp no conectado y Twilio no configurado.',
          to: telefono,
          channel: 'whatsapp',
          simulated: true
        };
      }
      const numeroFormateado = `whatsapp:${telefono.startsWith('+') ? telefono : '+' + telefono}`;
      const message = await twilioClient.messages.create({
        body: mensaje,
        from: process.env.TWILIO_WHATSAPP_NUMBER,
        to: numeroFormateado
      });
      console.log(`✅ WhatsApp enviado via Twilio: ${message.sid}`);
      return { success: true, messageId: message.sid, to: telefono, channel: 'whatsapp', via: 'twilio' };
    } catch (error) {
      console.error('❌ Error enviando WhatsApp:', error.message);
      return { success: false, error: error.message, to: telefono, channel: 'whatsapp' };
    }
  }

  // Enviar QR de acceso por WhatsApp (imagen)
  async enviarQRAcceso(telefono, { nombre, visitanteId, tipo, fecha, hora, areas } = {}) {
    // Intentar bot local (soporta imágenes)
    try {
      const botState = await getBotStatus();
      if (botState && botState.connected) {
        const resp = await callBot('/send-qr', { telefono, nombre, visitanteId, tipo, fecha, hora, areas });
        if (resp.body && resp.body.success) {
          console.log(`✅ QR de acceso enviado a ${telefono}`);
          return { success: true, to: telefono, channel: 'whatsapp', via: 'bot' };
        }
      }
    } catch (e) { /* no bot */ }

    // Fallback: enviar mensaje de texto con los datos
    const msg =
      `🎫 *Código de acceso - UnionTech*\n\n` +
      `👤 Visitante: ${nombre || 'N/A'}\n` +
      `🆔 ID: ${visitanteId}\n` +
      `${tipo === 'recurrente' ? '🔄 Recurrente' : '📅 Temporal'}` +
      `${fecha ? `\n📅 Fecha: ${fecha}` : ''}${hora ? `\n🕐 Hora: ${hora}` : ''}` +
      `${areas ? `\n📍 Áreas: ${areas}` : ''}\n\n` +
      `Preséntate en recepción con tu DNI y este mensaje.`;
    return this.enviarWhatsApp(telefono, msg);
  }

  // Enviar alerta de seguridad por WhatsApp
  async enviarAlertaSeguridad(telefono, { tipo, detalle, nivel } = {}) {
    try {
      const botState = await getBotStatus();
      if (botState && botState.connected) {
        const resp = await callBot('/send-alert', { telefono, tipo, detalle, nivel });
        if (resp.body && resp.body.success) {
          return { success: true, to: telefono, via: 'bot' };
        }
      }
    } catch (e) { /* no bot */ }

    const nivelEmoji = nivel === 'alta' ? '🔴' : nivel === 'media' ? '🟡' : '🟢';
    const msg = `${nivelEmoji} *ALERTA DE SEGURIDAD*\n\n⚠️ Tipo: ${tipo}\n${detalle ? `📋 ${detalle}\n` : ''}🕐 ${new Date().toLocaleString('es-AR')}`;
    return this.enviarWhatsApp(telefono, msg);
  }

  // Obtener estado del bot WhatsApp
  async getBotStatus() {
    const s = await getBotStatus();
    return s || { connected: false, status: 'unavailable' };
  }

  // Enviar Email
  async enviarEmail(destinatario, asunto, contenido, esHTML = false) {
    try {
      // Verificar si SendGrid está configurado
      if (!isSendGridConfigured) {
        return {
          success: false,
          error: 'SendGrid no configurado. Configurar SENDGRID_API_KEY en .env',
          to: destinatario,
          channel: 'email',
          simulated: true
        };
      }

      const msg = {
        to: destinatario,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject: asunto,
        [esHTML ? 'html' : 'text']: contenido
      };

      await sgMail.send(msg);
      console.log(`✅ Email enviado a: ${destinatario}`);
      
      return {
        success: true,
        to: destinatario,
        subject: asunto,
        channel: 'email'
      };

    } catch (error) {
      console.error('❌ Error enviando email:', error.message);
      return {
        success: false,
        error: error.message,
        to: destinatario,
        channel: 'email'
      };
    }
  }

  // Notificación de visitante llegando
  async notificarLlegadaVisitante(anfitrion, visitante) {
    const mensaje = `🔔 *Visitante en recepción*\n\n` +
                   `📋 Nombre: ${visitante.nombre}\n` +
                   `🆔 DNI: ${visitante.dni}\n` +
                   `⏰ Hora: ${new Date().toLocaleString('es-AR')}\n\n` +
                   `¿Autoriza el ingreso?`;

    const resultados = [];

    // Enviar WhatsApp si tiene teléfono
    if (anfitrion.telefono) {
      const whatsapp = await this.enviarWhatsApp(anfitrion.telefono, mensaje);
      resultados.push(whatsapp);
    }

    // Enviar Email si tiene email
    if (anfitrion.email) {
      const emailHTML = `
        <h2>🔔 Visitante en recepción</h2>
        <p><strong>📋 Nombre:</strong> ${visitante.nombre}</p>
        <p><strong>🆔 DNI:</strong> ${visitante.dni}</p>
        <p><strong>⏰ Hora:</strong> ${new Date().toLocaleString('es-AR')}</p>
        <p><strong>¿Autoriza el ingreso?</strong></p>
        <hr>
        <p><small>Sistema UnionTech - Control de Accesos</small></p>
      `;
      
      const email = await this.enviarEmail(
        anfitrion.email,
        '🔔 Visitante esperando autorización',
        emailHTML,
        true
      );
      resultados.push(email);
    }

    return resultados;
  }

  // Notificación de acceso autorizado/denegado
  async notificarResultadoAcceso(destinatario, autorizado, motivo = '') {
    const emoji = autorizado ? '✅' : '❌';
    const estado = autorizado ? 'AUTORIZADO' : 'DENEGADO';
    
    const mensaje = `${emoji} *Acceso ${estado}*\n\n` +
                   `⏰ ${new Date().toLocaleString('es-AR')}\n` +
                   (motivo ? `📝 Motivo: ${motivo}\n` : '') +
                   `\nGracias por usar UnionTech`;

    const resultados = [];

    if (destinatario.telefono) {
      const whatsapp = await this.enviarWhatsApp(destinatario.telefono, mensaje);
      resultados.push(whatsapp);
    }

    if (destinatario.email) {
      const emailHTML = `
        <h2>${emoji} Acceso ${estado}</h2>
        <p><strong>⏰ Fecha y hora:</strong> ${new Date().toLocaleString('es-AR')}</p>
        ${motivo ? `<p><strong>📝 Motivo:</strong> ${motivo}</p>` : ''}
        <hr>
        <p><small>Sistema UnionTech - Control de Accesos</small></p>
      `;
      
      const email = await this.enviarEmail(
        destinatario.email,
        `${emoji} Acceso ${estado} - UnionTech`,
        emailHTML,
        true
      );
      resultados.push(email);
    }

    return resultados;
  }

  // Generar y enviar código QR de acceso
  async enviarCodigoAcceso(destinatario, codigoQR, validoHasta) {
    const mensaje = `🎫 *Código de Acceso UnionTech*\n\n` +
                   `📱 Tu código QR: ${codigoQR}\n` +
                   `⏰ Válido hasta: ${validoHasta.toLocaleString('es-AR')}\n\n` +
                   `Presenta este código en la entrada.\n\n` +
                   `¡Bienvenido!`;

    const resultados = [];

    if (destinatario.telefono) {
      const whatsapp = await this.enviarWhatsApp(destinatario.telefono, mensaje);
      resultados.push(whatsapp);
    }

    if (destinatario.email) {
      const emailHTML = `
        <h2>🎫 Código de Acceso UnionTech</h2>
        <div style="background: #f0f0f0; padding: 20px; text-align: center; margin: 20px 0;">
          <h3>📱 Código QR: <code>${codigoQR}</code></h3>
        </div>
        <p><strong>⏰ Válido hasta:</strong> ${validoHasta.toLocaleString('es-AR')}</p>
        <p>Presenta este código en la entrada.</p>
        <p><strong>¡Bienvenido!</strong></p>
        <hr>
        <p><small>Sistema UnionTech - Control de Accesos</small></p>
      `;
      
      const email = await this.enviarEmail(
        destinatario.email,
        '🎫 Tu código de acceso - UnionTech',
        emailHTML,
        true
      );
      resultados.push(email);
    }

    return resultados;
  }

  // Alerta de seguridad
  async enviarAlertaSeguridad(personal, tipo, descripcion, ubicacion) {
    const mensaje = `🚨 *ALERTA DE SEGURIDAD*\n\n` +
                   `⚠️ Tipo: ${tipo}\n` +
                   `📍 Ubicación: ${ubicacion}\n` +
                   `📝 Descripción: ${descripcion}\n` +
                   `⏰ ${new Date().toLocaleString('es-AR')}\n\n` +
                   `Acción requerida inmediata.`;

    const resultados = [];

    // Enviar a todo el personal de seguridad
    for (const persona of personal) {
      if (persona.telefono) {
        const whatsapp = await this.enviarWhatsApp(persona.telefono, mensaje);
        resultados.push(whatsapp);
      }

      if (persona.email) {
        const emailHTML = `
          <div style="background: #ff4444; color: white; padding: 20px; text-align: center;">
            <h2>🚨 ALERTA DE SEGURIDAD</h2>
          </div>
          <div style="padding: 20px;">
            <p><strong>⚠️ Tipo:</strong> ${tipo}</p>
            <p><strong>📍 Ubicación:</strong> ${ubicacion}</p>
            <p><strong>📝 Descripción:</strong> ${descripcion}</p>
            <p><strong>⏰ Fecha y hora:</strong> ${new Date().toLocaleString('es-AR')}</p>
            <div style="background: #ffeeee; padding: 15px; margin: 20px 0;">
              <strong>⚡ Acción requerida inmediata</strong>
            </div>
          </div>
          <hr>
          <p><small>Sistema UnionTech - Control de Accesos</small></p>
        `;
        
        const email = await this.enviarEmail(
          persona.email,
          `🚨 ALERTA DE SEGURIDAD - ${tipo}`,
          emailHTML,
          true
        );
        resultados.push(email);
      }
    }

    return resultados;
  }
}

module.exports = new NotificationService();
