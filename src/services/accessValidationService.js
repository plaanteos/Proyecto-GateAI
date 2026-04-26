const qrService = require('./qrService');
const notificationService = require('./notificationService');

class AccessValidationService {
  constructor() {
    this.accesosEnTiempoReal = new Map(); // Cache de accesos en memoria
    this.intentosFallidos = new Map(); // Control de intentos fallidos
    this.maxIntentosFallidos = 3;
    this.tiempoBloqueo = 15 * 60 * 1000; // 15 minutos
  }

  // Validar acceso por código QR
  async validarAccesoQR(codigoQR, ubicacion, dispositivoId = null) {
    try {
      const timestamp = new Date();
      const ip = this.obtenerIP();
      
      // Verificar si hay demasiados intentos fallidos
      if (this.estaBloqueado(ip)) {
        return {
          acceso: 'denegado',
          motivo: 'Demasiados intentos fallidos. Intente más tarde.',
          tiempoBloqueo: this.obtenerTiempoBloqueo(ip),
          timestamp
        };
      }

      // Validar el código QR
      const validacion = qrService.validarCodigo(codigoQR);
      
      if (!validacion.valido) {
        this.registrarIntentoFallido(ip);
        
        return {
          acceso: 'denegado',
          motivo: validacion.expirado ? 'Código expirado' : 
                 validacion.usado ? 'Código ya utilizado' : 
                 'Código inválido',
          detalles: validacion,
          timestamp
        };
      }

      // Marcar código como usado
      const marcado = qrService.marcarComoUsado(codigoQR);
      
      if (!marcado.success) {
        return {
          acceso: 'denegado',
          motivo: 'Error procesando el código',
          timestamp
        };
      }

      // Limpiar intentos fallidos exitosos
      this.limpiarIntentosFallidos(ip);

      // Registrar acceso exitoso
      const accesoId = this.registrarAcceso(validacion.datos, ubicacion, dispositivoId);
      
      // Notificar acceso autorizado
      if (validacion.datos.visitante.telefono) {
        await notificationService.notificarResultadoAcceso(
          {
            telefono: validacion.datos.visitante.telefono,
            email: null
          },
          true,
          `Acceso autorizado en ${ubicacion}`
        );
      }

      return {
        acceso: 'autorizado',
        visitante: validacion.datos.visitante,
        accesoId: accesoId,
        ubicacion: ubicacion,
        validoHasta: validacion.datos.validoHasta,
        timestamp,
        dispositivoId
      };

    } catch (error) {
      console.error('Error validando acceso QR:', error);
      return {
        acceso: 'denegado',
        motivo: 'Error interno del sistema',
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  // Validar acceso manual (por personal de seguridad)
  async validarAccesoManual(visitanteData, anfitrionId, ubicacion, personalId) {
    try {
      const timestamp = new Date();
      
      // Simular consulta a base de datos para obtener anfitrión
      const anfitrion = await this.obtenerAnfitrion(anfitrionId);
      
      if (!anfitrion) {
        return {
          acceso: 'denegado',
          motivo: 'Anfitrión no encontrado',
          timestamp
        };
      }

      // Registrar acceso manual
      const accesoId = this.registrarAccesoManual(
        visitanteData, 
        anfitrionId, 
        ubicacion, 
        personalId
      );

      // Notificar al anfitrión sobre la llegada
      await notificationService.notificarLlegadaVisitante(anfitrion, visitanteData);

      return {
        acceso: 'pendiente_autorizacion',
        visitante: visitanteData,
        anfitrion: anfitrion.nombre,
        accesoId: accesoId,
        ubicacion: ubicacion,
        timestamp,
        requiereAutorizacion: true
      };

    } catch (error) {
      console.error('Error validando acceso manual:', error);
      return {
        acceso: 'denegado',
        motivo: 'Error interno del sistema',
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  // Autorizar/Denegar acceso pendiente (respuesta del anfitrión)
  async responderAutorizacion(accesoId, autorizado, motivo = '', anfitrionId) {
    try {
      const acceso = this.accesosEnTiempoReal.get(accesoId);
      
      if (!acceso) {
        return {
          success: false,
          error: 'Acceso no encontrado o expirado'
        };
      }

      const timestamp = new Date();
      
      // Actualizar estado del acceso
      acceso.estado = autorizado ? 'autorizado' : 'denegado';
      acceso.motivo = motivo;
      acceso.fechaRespuesta = timestamp;
      acceso.respondidoPor = anfitrionId;

      // Notificar al visitante sobre la decisión
      if (acceso.visitante.telefono) {
        await notificationService.notificarResultadoAcceso(
          {
            telefono: acceso.visitante.telefono,
            email: null
          },
          autorizado,
          motivo
        );
      }

      // Si es autorizado, generar código QR temporal
      let codigoQR = null;
      if (autorizado) {
        const validoHasta = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 horas
        const qrData = await qrService.generarQRAcceso(acceso.visitante, validoHasta);
        
        codigoQR = qrData.codigo;
        
        // Enviar código QR al visitante
        await notificationService.enviarCodigoAcceso(
          {
            telefono: acceso.visitante.telefono,
            email: null
          },
          codigoQR,
          validoHasta
        );
      }

      return {
        success: true,
        accesoId: accesoId,
        autorizado: autorizado,
        motivo: motivo,
        codigoQR: codigoQR,
        visitante: acceso.visitante.nombre,
        timestamp
      };

    } catch (error) {
      console.error('Error respondiendo autorización:', error);
      return {
        success: false,
        error: 'Error procesando la respuesta'
      };
    }
  }

  // Obtener estado de acceso en tiempo real
  obtenerEstadoAcceso(accesoId) {
    const acceso = this.accesosEnTiempoReal.get(accesoId);
    
    if (!acceso) {
      return {
        encontrado: false,
        error: 'Acceso no encontrado'
      };
    }

    return {
      encontrado: true,
      accesoId: accesoId,
      estado: acceso.estado,
      visitante: acceso.visitante,
      ubicacion: acceso.ubicacion,
      fechaCreacion: acceso.timestamp,
      fechaRespuesta: acceso.fechaRespuesta || null,
      motivo: acceso.motivo || null
    };
  }

  // Listar accesos pendientes para un anfitrión
  obtenerAccesosPendientes(anfitrionId) {
    const accesosPendientes = [];
    
    this.accesosEnTiempoReal.forEach((acceso, id) => {
      if (acceso.anfitrionId === anfitrionId && acceso.estado === 'pendiente_autorizacion') {
        accesosPendientes.push({
          accesoId: id,
          visitante: acceso.visitante,
          ubicacion: acceso.ubicacion,
          timestamp: acceso.timestamp,
          tiempoEspera: Date.now() - new Date(acceso.timestamp).getTime()
        });
      }
    });

    return accesosPendientes.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  // Generar alerta de seguridad
  async generarAlertaSeguridad(tipo, descripcion, ubicacion, personalIds) {
    try {
      // Simular obtención de personal de seguridad
      const personal = personalIds.map(id => ({
        id,
        nombre: `Personal ${id}`,
        telefono: '+5491123456789', // Obtener de BD
        email: `seguridad${id}@uniontech.com`
      }));

      await notificationService.enviarAlertaSeguridad(
        personal,
        tipo,
        descripcion,
        ubicacion
      );

      const alertaId = `ALERT_${Date.now()}`;
      
      return {
        success: true,
        alertaId: alertaId,
        tipo: tipo,
        ubicacion: ubicacion,
        personalNotificado: personal.length,
        timestamp: new Date()
      };

    } catch (error) {
      console.error('Error generando alerta:', error);
      return {
        success: false,
        error: 'Error enviando alerta de seguridad'
      };
    }
  }

  // Métodos auxiliares
  registrarAcceso(visitanteData, ubicacion, dispositivoId) {
    const accesoId = `ACC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.accesosEnTiempoReal.set(accesoId, {
      visitante: visitanteData.visitante,
      ubicacion: ubicacion,
      dispositivoId: dispositivoId,
      estado: 'autorizado',
      timestamp: new Date(),
      tipo: 'qr'
    });

    return accesoId;
  }

  registrarAccesoManual(visitanteData, anfitrionId, ubicacion, personalId) {
    const accesoId = `MAN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.accesosEnTiempoReal.set(accesoId, {
      visitante: visitanteData,
      anfitrionId: anfitrionId,
      ubicacion: ubicacion,
      personalId: personalId,
      estado: 'pendiente_autorizacion',
      timestamp: new Date(),
      tipo: 'manual'
    });

    return accesoId;
  }

  async obtenerAnfitrion(anfitrionId) {
    // Simular consulta a BD - aquí usarías Prisma
    return {
      id: anfitrionId,
      nombre: `Anfitrión ${anfitrionId}`,
      telefono: '+5491123456789',
      email: 'anfitrion@test.com'
    };
  }

  estaBloqueado(ip) {
    const intentos = this.intentosFallidos.get(ip);
    if (!intentos) return false;
    
    return intentos.count >= this.maxIntentosFallidos && 
           (Date.now() - intentos.ultimoIntento) < this.tiempoBloqueo;
  }

  registrarIntentoFallido(ip) {
    const intentos = this.intentosFallidos.get(ip) || { count: 0, ultimoIntento: 0 };
    intentos.count++;
    intentos.ultimoIntento = Date.now();
    this.intentosFallidos.set(ip, intentos);
  }

  limpiarIntentosFallidos(ip) {
    this.intentosFallidos.delete(ip);
  }

  obtenerTiempoBloqueo(ip) {
    const intentos = this.intentosFallidos.get(ip);
    if (!intentos) return 0;
    
    const tiempoRestante = this.tiempoBloqueo - (Date.now() - intentos.ultimoIntento);
    return Math.max(0, Math.ceil(tiempoRestante / 1000)); // segundos
  }

  obtenerIP() {
    // En un entorno real, obtendrías esto del request
    return '127.0.0.1';
  }

  // Limpiar accesos antiguos (llamar periódicamente)
  limpiarAccesosAntiguos() {
    const hace24Horas = Date.now() - (24 * 60 * 60 * 1000);
    
    this.accesosEnTiempoReal.forEach((acceso, id) => {
      if (new Date(acceso.timestamp).getTime() < hace24Horas) {
        this.accesosEnTiempoReal.delete(id);
      }
    });

    console.log(`Limpieza completada. Accesos en memoria: ${this.accesosEnTiempoReal.size}`);
  }
}

module.exports = new AccessValidationService();
