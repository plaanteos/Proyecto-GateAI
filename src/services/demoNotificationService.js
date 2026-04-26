require('dotenv').config();

// Modo demo para probar sin credenciales reales
const DEMO_MODE = true;

class DemoNotificationService {
  
  async enviarWhatsApp(telefono, mensaje) {
    console.log('\n📱 [DEMO] WhatsApp simulado:');
    console.log(`  📞 Para: ${telefono}`);
    console.log(`  💬 Mensaje: ${mensaje}`);
    console.log(`  ⏰ Enviado: ${new Date().toLocaleString('es-AR')}`);
    
    return {
      success: true,
      messageId: 'DEMO_' + Date.now(),
      to: telefono,
      channel: 'whatsapp',
      demo: true
    };
  }

  async enviarEmail(destinatario, asunto, contenido, esHTML = false) {
    console.log('\n📧 [DEMO] Email simulado:');
    console.log(`  📮 Para: ${destinatario}`);
    console.log(`  📝 Asunto: ${asunto}`);
    console.log(`  📄 Tipo: ${esHTML ? 'HTML' : 'Texto'}`);
    console.log(`  💌 Contenido: ${contenido.substring(0, 100)}...`);
    console.log(`  ⏰ Enviado: ${new Date().toLocaleString('es-AR')}`);
    
    return {
      success: true,
      to: destinatario,
      subject: asunto,
      channel: 'email',
      demo: true
    };
  }

  async notificarLlegadaVisitante(anfitrion, visitante) {
    console.log('\n🔔 [DEMO] Notificación de llegada simulada:');
    console.log(`  👤 Anfitrión: ${anfitrion.nombre}`);
    console.log(`  🆔 Visitante: ${visitante.nombre} (DNI: ${visitante.dni})`);
    
    const resultados = [];
    
    if (anfitrion.telefono) {
      const whatsapp = await this.enviarWhatsApp(
        anfitrion.telefono,
        `🔔 Visitante ${visitante.nombre} (DNI: ${visitante.dni}) esperando autorización`
      );
      resultados.push(whatsapp);
    }
    
    if (anfitrion.email) {
      const email = await this.enviarEmail(
        anfitrion.email,
        '🔔 Visitante esperando autorización',
        `Visitante: ${visitante.nombre}\nDNI: ${visitante.dni}\nHora: ${new Date().toLocaleString('es-AR')}`,
        false
      );
      resultados.push(email);
    }
    
    return resultados;
  }

  async notificarResultadoAcceso(destinatario, autorizado, motivo = '') {
    const estado = autorizado ? 'AUTORIZADO ✅' : 'DENEGADO ❌';
    console.log(`\n${autorizado ? '✅' : '❌'} [DEMO] Resultado de acceso simulado: ${estado}`);
    
    const resultados = [];
    
    if (destinatario.telefono) {
      const whatsapp = await this.enviarWhatsApp(
        destinatario.telefono,
        `Acceso ${estado}${motivo ? ` - ${motivo}` : ''}`
      );
      resultados.push(whatsapp);
    }
    
    if (destinatario.email) {
      const email = await this.enviarEmail(
        destinatario.email,
        `Acceso ${estado}`,
        `Su solicitud de acceso ha sido ${estado.toLowerCase()}${motivo ? `. Motivo: ${motivo}` : ''}`,
        false
      );
      resultados.push(email);
    }
    
    return resultados;
  }

  async enviarCodigoAcceso(destinatario, codigoQR, validoHasta) {
    console.log('\n🎫 [DEMO] Código de acceso simulado:');
    console.log(`  🔢 Código: ${codigoQR}`);
    console.log(`  ⏰ Válido hasta: ${validoHasta.toLocaleString('es-AR')}`);
    
    const resultados = [];
    
    if (destinatario.telefono) {
      const whatsapp = await this.enviarWhatsApp(
        destinatario.telefono,
        `🎫 Tu código de acceso: ${codigoQR} (Válido hasta: ${validoHasta.toLocaleString('es-AR')})`
      );
      resultados.push(whatsapp);
    }
    
    if (destinatario.email) {
      const email = await this.enviarEmail(
        destinatario.email,
        '🎫 Código de Acceso UnionTech',
        `Su código de acceso: ${codigoQR}\nVálido hasta: ${validoHasta.toLocaleString('es-AR')}`,
        false
      );
      resultados.push(email);
    }
    
    return resultados;
  }

  async enviarAlertaSeguridad(personal, tipo, descripcion, ubicacion) {
    console.log('\n🚨 [DEMO] Alerta de seguridad simulada:');
    console.log(`  ⚠️ Tipo: ${tipo}`);
    console.log(`  📍 Ubicación: ${ubicacion}`);
    console.log(`  📝 Descripción: ${descripcion}`);
    console.log(`  👥 Personal notificado: ${personal.length} personas`);
    
    const resultados = [];
    
    for (const persona of personal) {
      console.log(`\n  📢 Notificando a: ${persona.nombre}`);
      
      if (persona.telefono) {
        const whatsapp = await this.enviarWhatsApp(
          persona.telefono,
          `🚨 ALERTA: ${tipo} en ${ubicacion}. ${descripcion}`
        );
        resultados.push(whatsapp);
      }
      
      if (persona.email) {
        const email = await this.enviarEmail(
          persona.email,
          `🚨 ALERTA DE SEGURIDAD: ${tipo}`,
          `Tipo: ${tipo}\nUbicación: ${ubicacion}\nDescripción: ${descripcion}\nAcción requerida inmediata.`,
          false
        );
        resultados.push(email);
      }
    }
    
    return resultados;
  }
}

module.exports = new DemoNotificationService();
