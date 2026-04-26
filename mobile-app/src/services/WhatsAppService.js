import { Linking, Alert, Platform } from 'react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';

/**
 * Servicio para integración con WhatsApp
 */
class WhatsAppService {
  
  /**
   * Enviar invitación por WhatsApp
   */
  static async sendInvitation(guestData, propertyData, qrCode = null) {
    try {
      const message = this.formatInvitationMessage(guestData, propertyData, qrCode);
      const phoneNumber = this.formatPhoneNumber(guestData.phone);
      
      const whatsappUrl = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
      const webUrl = `https://web.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
      
      // Intentar abrir WhatsApp nativo primero
      const canOpenWhatsApp = await Linking.canOpenURL(whatsappUrl);
      
      if (canOpenWhatsApp) {
        await Linking.openURL(whatsappUrl);
        return { success: true, method: 'app' };
      } else {
        // Fallback a WhatsApp Web
        await Linking.openURL(webUrl);
        return { success: true, method: 'web' };
      }
    } catch (error) {
      console.error('Error enviando invitación por WhatsApp:', error);
      throw new Error('No se pudo enviar la invitación por WhatsApp');
    }
  }

  /**
   * Enviar notificación de acceso por WhatsApp
   */
  static async sendAccessNotification(guestData, propertyData, accessData) {
    try {
      const message = this.formatAccessNotificationMessage(guestData, propertyData, accessData);
      const phoneNumber = this.formatPhoneNumber(guestData.phone);
      
      const whatsappUrl = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
      
      const canOpenWhatsApp = await Linking.canOpenURL(whatsappUrl);
      
      if (canOpenWhatsApp) {
        await Linking.openURL(whatsappUrl);
        return { success: true };
      } else {
        throw new Error('WhatsApp no está instalado');
      }
    } catch (error) {
      console.error('Error enviando notificación de acceso:', error);
      throw error;
    }
  }

  /**
   * Enviar código QR por WhatsApp
   */
  static async sendQRCode(guestData, propertyData, qrCodeData) {
    try {
      const message = this.formatQRCodeMessage(guestData, propertyData, qrCodeData);
      const phoneNumber = this.formatPhoneNumber(guestData.phone);
      
      const whatsappUrl = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
      
      const canOpenWhatsApp = await Linking.canOpenURL(whatsappUrl);
      
      if (canOpenWhatsApp) {
        await Linking.openURL(whatsappUrl);
        return { success: true };
      } else {
        throw new Error('WhatsApp no está instalado');
      }
    } catch (error) {
      console.error('Error enviando código QR:', error);
      throw error;
    }
  }

  /**
   * Enviar alerta de seguridad por WhatsApp
   */
  static async sendSecurityAlert(contactData, alertData, propertyData) {
    try {
      const message = this.formatSecurityAlertMessage(alertData, propertyData);
      const phoneNumber = this.formatPhoneNumber(contactData.phone);
      
      const whatsappUrl = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
      
      const canOpenWhatsApp = await Linking.canOpenURL(whatsappUrl);
      
      if (canOpenWhatsApp) {
        await Linking.openURL(whatsappUrl);
        return { success: true };
      } else {
        throw new Error('WhatsApp no está instalado');
      }
    } catch (error) {
      console.error('Error enviando alerta de seguridad:', error);
      throw error;
    }
  }

  /**
   * Formatear mensaje de invitación
   */
  static formatInvitationMessage(guestData, propertyData, qrCode) {
    const startDate = new Date(guestData.startDate).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    
    const endDate = new Date(guestData.endDate).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    let message = `🏢 *INVITACIÓN DE ACCESO - ${propertyData.name.toUpperCase()}*\n\n`;
    message += `Hola ${guestData.name},\n\n`;
    message += `Has sido invitado(a) a acceder a:\n`;
    message += `📍 *${propertyData.name}*\n`;
    message += `📅 *Válido desde:* ${startDate}\n`;
    message += `📅 *Válido hasta:* ${endDate}\n`;
    message += `🔢 *Máximo de visitas:* ${guestData.maxVisits}\n\n`;
    
    if (guestData.unitNumber) {
      message += `🏠 *Unidad:* ${guestData.unitNumber}\n`;
    }
    
    if (guestData.specialInstructions) {
      message += `📝 *Instrucciones especiales:*\n${guestData.specialInstructions}\n\n`;
    }
    
    if (qrCode) {
      message += `📱 *Código QR de acceso:*\n${qrCode}\n\n`;
    }
    
    message += `⚠️ *IMPORTANTE:*\n`;
    message += `• Presenta este mensaje y tu documento de identidad al guardia\n`;
    message += `• El acceso está sujeto a verificación\n`;
    message += `• No compartas este código con terceros\n\n`;
    message += `¡Bienvenido(a)! 🎉\n\n`;
    message += `_Mensaje enviado por UnionTech Security System_`;

    return message;
  }

  /**
   * Formatear mensaje de notificación de acceso
   */
  static formatAccessNotificationMessage(guestData, propertyData, accessData) {
    const accessTime = new Date(accessData.timestamp).toLocaleString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    let message = `🔓 *NOTIFICACIÓN DE ACCESO*\n\n`;
    message += `✅ *Acceso registrado exitosamente*\n\n`;
    message += `👤 *Visitante:* ${guestData.name}\n`;
    message += `🏢 *Propiedad:* ${propertyData.name}\n`;
    message += `🕐 *Fecha y hora:* ${accessTime}\n`;
    message += `🚪 *Punto de acceso:* ${accessData.accessPoint || 'Entrada principal'}\n`;
    
    if (accessData.exitTime) {
      const exitTime = new Date(accessData.exitTime).toLocaleString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      });
      message += `🚪 *Hora de salida:* ${exitTime}\n`;
    }
    
    message += `\n_Mensaje enviado por UnionTech Security System_`;

    return message;
  }

  /**
   * Formatear mensaje de código QR
   */
  static formatQRCodeMessage(guestData, propertyData, qrCodeData) {
    let message = `📱 *CÓDIGO QR DE ACCESO*\n\n`;
    message += `👤 *Para:* ${guestData.name}\n`;
    message += `🏢 *Propiedad:* ${propertyData.name}\n`;
    message += `📅 *Válido hasta:* ${new Date(guestData.endDate).toLocaleDateString('es-ES')}\n\n`;
    message += `🔑 *Código QR:*\n${qrCodeData.data}\n\n`;
    message += `💡 *Instrucciones:*\n`;
    message += `1. Guarda este código QR\n`;
    message += `2. Muéstralo al guardia junto con tu documento\n`;
    message += `3. El código será escaneado para verificar tu acceso\n\n`;
    message += `⚠️ No compartas este código con terceros\n\n`;
    message += `_Mensaje enviado por UnionTech Security System_`;

    return message;
  }

  /**
   * Formatear mensaje de alerta de seguridad
   */
  static formatSecurityAlertMessage(alertData, propertyData) {
    const alertTime = new Date(alertData.timestamp).toLocaleString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    let message = `🚨 *ALERTA DE SEGURIDAD*\n\n`;
    
    switch (alertData.type) {
      case 'unauthorized_access':
        message += `⛔ *Intento de acceso no autorizado*\n`;
        break;
      case 'emergency':
        message += `🆘 *EMERGENCIA*\n`;
        break;
      case 'suspicious_activity':
        message += `👁️ *Actividad sospechosa detectada*\n`;
        break;
      default:
        message += `⚠️ *Alerta de seguridad*\n`;
    }
    
    message += `\n🏢 *Propiedad:* ${propertyData.name}\n`;
    message += `🕐 *Fecha y hora:* ${alertTime}\n`;
    message += `📍 *Ubicación:* ${alertData.location || 'No especificada'}\n`;
    message += `📝 *Descripción:* ${alertData.description}\n\n`;
    
    if (alertData.priority === 'emergency') {
      message += `🆘 *REQUIERE ATENCIÓN INMEDIATA*\n\n`;
    }
    
    message += `🚔 Si es una emergencia, contacta inmediatamente a las autoridades.\n\n`;
    message += `_Alerta enviada por UnionTech Security System_`;

    return message;
  }

  /**
   * Formatear número de teléfono para WhatsApp
   */
  static formatPhoneNumber(phone) {
    // Remover caracteres no numéricos
    let cleanPhone = phone.replace(/[^\d]/g, '');
    
    // Si no tiene código de país, agregar +51 (Perú)
    if (cleanPhone.length === 9 && !cleanPhone.startsWith('51')) {
      cleanPhone = '51' + cleanPhone;
    }
    
    // Si empieza con 0, removerlo
    if (cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.substring(1);
    }
    
    return cleanPhone;
  }

  /**
   * Verificar si WhatsApp está disponible
   */
  static async isWhatsAppAvailable() {
    try {
      const whatsappUrl = 'whatsapp://';
      return await Linking.canOpenURL(whatsappUrl);
    } catch (error) {
      return false;
    }
  }

  /**
   * Abrir chat directo con número
   */
  static async openDirectChat(phoneNumber, message = '') {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      const whatsappUrl = `whatsapp://send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;
      
      const canOpenWhatsApp = await Linking.canOpenURL(whatsappUrl);
      
      if (canOpenWhatsApp) {
        await Linking.openURL(whatsappUrl);
        return { success: true };
      } else {
        throw new Error('WhatsApp no está disponible');
      }
    } catch (error) {
      console.error('Error abriendo chat de WhatsApp:', error);
      throw error;
    }
  }

  /**
   * Compartir ubicación de la propiedad
   */
  static async shareLocation(propertyData, contactPhone) {
    try {
      const locationMessage = this.formatLocationMessage(propertyData);
      return await this.openDirectChat(contactPhone, locationMessage);
    } catch (error) {
      console.error('Error compartiendo ubicación:', error);
      throw error;
    }
  }

  /**
   * Formatear mensaje de ubicación
   */
  static formatLocationMessage(propertyData) {
    let message = `📍 *UBICACIÓN - ${propertyData.name.toUpperCase()}*\n\n`;
    message += `🏢 *Nombre:* ${propertyData.name}\n`;
    message += `📍 *Dirección:* ${propertyData.address}\n\n`;
    
    if (propertyData.coordinates) {
      message += `🗺️ *Coordenadas:*\n`;
      message += `${propertyData.coordinates.latitude}, ${propertyData.coordinates.longitude}\n\n`;
      message += `🔗 *Ver en Google Maps:*\n`;
      message += `https://maps.google.com/?q=${propertyData.coordinates.latitude},${propertyData.coordinates.longitude}\n\n`;
    }
    
    if (propertyData.parkingInstructions) {
      message += `🚗 *Instrucciones de estacionamiento:*\n${propertyData.parkingInstructions}\n\n`;
    }
    
    message += `_Ubicación compartida desde UnionTech Security System_`;

    return message;
  }

  /**
   * Crear grupo de WhatsApp para emergencias
   */
  static async createEmergencyGroup(propertyData, contacts) {
    try {
      const groupName = `🚨 Emergencias ${propertyData.name}`;
      const description = `Grupo de emergencias para ${propertyData.name}. Solo para situaciones urgentes.`;
      
      // Crear mensaje para invitar al grupo
      let message = `🚨 *GRUPO DE EMERGENCIAS*\n\n`;
      message += `Se ha creado un grupo de WhatsApp para emergencias de:\n`;
      message += `🏢 *${propertyData.name}*\n\n`;
      message += `👥 *Participantes:*\n`;
      
      contacts.forEach((contact, index) => {
        message += `${index + 1}. ${contact.name} - ${contact.role}\n`;
      });
      
      message += `\n⚠️ *IMPORTANTE:*\n`;
      message += `• Este grupo es solo para emergencias\n`;
      message += `• Mantén tu teléfono activo 24/7\n`;
      message += `• Responde inmediatamente a las alertas\n\n`;
      message += `_Grupo creado por UnionTech Security System_`;

      return { groupName, description, inviteMessage: message };
    } catch (error) {
      console.error('Error creando grupo de emergencia:', error);
      throw error;
    }
  }
}

export default WhatsAppService;
