require('dotenv').config();
const twilio = require('twilio');
const sgMail = require('@sendgrid/mail');

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
  
  // Enviar WhatsApp
  async enviarWhatsApp(telefono, mensaje) {
    try {
      // Verificar si Twilio está configurado
      if (!isTwilioConfigured || !twilioClient) {
        return {
          success: false,
          error: 'Twilio no configurado. Configurar TWILIO_ACCOUNT_SID y TWILIO_AUTH_TOKEN en .env',
          to: telefono,
          channel: 'whatsapp',
          simulated: true
        };
      }

      // Formatear número para WhatsApp
      const numeroFormateado = `whatsapp:${telefono.startsWith('+') ? telefono : '+' + telefono}`;
      
      const message = await twilioClient.messages.create({
        body: mensaje,
        from: process.env.TWILIO_WHATSAPP_NUMBER,
        to: numeroFormateado
      });

      console.log(`✅ WhatsApp enviado: ${message.sid}`);
      return {
        success: true,
        messageId: message.sid,
        to: telefono,
        channel: 'whatsapp'
      };

    } catch (error) {
      console.error('❌ Error enviando WhatsApp:', error.message);
      return {
        success: false,
        error: error.message,
        to: telefono,
        channel: 'whatsapp'
      };
    }
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
