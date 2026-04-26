const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const CryptoJS = require('crypto-js');

class QRService {
  constructor() {
    this.secretKey = process.env.JWT_SECRET || 'uniontech_qr_secret';
  }

  // Generar código único para acceso temporal
  generarCodigoAcceso(visitanteData, validoHasta, ubicacion = null) {
    const timestamp = Date.now();
    const codigoBase = {
      id: uuidv4(),
      visitante: {
        nombre: visitanteData.nombre,
        dni: visitanteData.dni,
        telefono: visitanteData.telefono || null
      },
      generado: new Date(timestamp).toISOString(),
      validoHasta: validoHasta.toISOString(),
      ubicacion: ubicacion,
      tipo: 'acceso_temporal',
      usado: false
    };

    // Encriptar el código para mayor seguridad
    const codigoEncriptado = CryptoJS.AES.encrypt(
      JSON.stringify(codigoBase), 
      this.secretKey
    ).toString();

    return {
      codigo: codigoBase.id,
      codigoCompleto: codigoEncriptado,
      validoHasta: validoHasta,
      datos: codigoBase
    };
  }

  // Validar y decodificar código QR
  validarCodigo(codigoEncriptado) {
    try {
      const bytes = CryptoJS.AES.decrypt(codigoEncriptado, this.secretKey);
      const codigoDecodificado = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      
      const ahora = new Date();
      const validoHasta = new Date(codigoDecodificado.validoHasta);
      
      return {
        valido: ahora <= validoHasta && !codigoDecodificado.usado,
        expirado: ahora > validoHasta,
        usado: codigoDecodificado.usado,
        datos: codigoDecodificado,
        tiempoRestante: validoHasta - ahora
      };
      
    } catch (error) {
      return {
        valido: false,
        error: 'Código QR inválido o corrupto',
        datos: null
      };
    }
  }

  // Generar imagen QR
  async generarImagenQR(codigo, opciones = {}) {
    try {
      const opcionesQR = {
        width: opciones.width || 300,
        height: opciones.height || 300,
        color: {
          dark: opciones.colorOscuro || '#000000',
          light: opciones.colorClaro || '#FFFFFF'
        },
        errorCorrectionLevel: 'M',
        ...opciones
      };

      // Generar QR como Data URL (base64)
      const qrDataURL = await QRCode.toDataURL(codigo, opcionesQR);
      
      // También generar como buffer para archivos
      const qrBuffer = await QRCode.toBuffer(codigo, opcionesQR);
      
      return {
        dataURL: qrDataURL,
        buffer: qrBuffer,
        formato: 'PNG'
      };
      
    } catch (error) {
      throw new Error(`Error generando QR: ${error.message}`);
    }
  }

  // Generar QR con URL del sistema
  async generarQRAcceso(visitanteData, validoHasta, baseURL = 'https://uniontech.com') {
    try {
      const codigoAcceso = this.generarCodigoAcceso(visitanteData, validoHasta);
      
      // URL para validar el acceso
      const urlAcceso = `${baseURL}/validar-acceso?codigo=${encodeURIComponent(codigoAcceso.codigoCompleto)}`;
      
      const imagenQR = await this.generarImagenQR(urlAcceso, {
        width: 400,
        height: 400
      });
      
      return {
        codigo: codigoAcceso.codigo,
        codigoCompleto: codigoAcceso.codigoCompleto,
        urlAcceso: urlAcceso,
        validoHasta: validoHasta,
        imagenQR: imagenQR,
        visitante: visitanteData
      };
      
    } catch (error) {
      throw new Error(`Error generando QR de acceso: ${error.message}`);
    }
  }

  // Marcar código como usado
  marcarComoUsado(codigoEncriptado) {
    try {
      const bytes = CryptoJS.AES.decrypt(codigoEncriptado, this.secretKey);
      const codigo = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      
      codigo.usado = true;
      codigo.fechaUso = new Date().toISOString();
      
      const codigoActualizado = CryptoJS.AES.encrypt(
        JSON.stringify(codigo), 
        this.secretKey
      ).toString();
      
      return {
        success: true,
        codigoActualizado: codigoActualizado,
        fechaUso: codigo.fechaUso
      };
      
    } catch (error) {
      return {
        success: false,
        error: 'Error marcando código como usado'
      };
    }
  }

  // Generar múltiples códigos QR (para eventos o grupos)
  async generarCodigosGrupales(visitantes, validoHasta, evento = null) {
    const codigos = [];
    
    for (const visitante of visitantes) {
      try {
        const qrData = await this.generarQRAcceso(visitante, validoHasta);
        codigos.push({
          visitante: visitante.nombre,
          dni: visitante.dni,
          codigo: qrData.codigo,
          qrImage: qrData.imagenQR.dataURL,
          validoHasta: validoHasta,
          evento: evento
        });
      } catch (error) {
        console.error(`Error generando QR para ${visitante.nombre}:`, error.message);
        codigos.push({
          visitante: visitante.nombre,
          dni: visitante.dni,
          error: error.message
        });
      }
    }
    
    return {
      total: visitantes.length,
      exitosos: codigos.filter(c => !c.error).length,
      fallidos: codigos.filter(c => c.error).length,
      codigos: codigos,
      evento: evento,
      validoHasta: validoHasta
    };
  }

  // Estadísticas de códigos QR
  obtenerEstadisticas(codigos) {
    const ahora = new Date();
    let total = 0;
    let validos = 0;
    let expirados = 0;
    let usados = 0;
    
    codigos.forEach(codigo => {
      total++;
      const validacion = this.validarCodigo(codigo);
      
      if (validacion.usado) {
        usados++;
      } else if (validacion.expirado) {
        expirados++;
      } else if (validacion.valido) {
        validos++;
      }
    });
    
    return {
      total,
      validos,
      expirados,
      usados,
      porcentajeUso: total > 0 ? ((usados / total) * 100).toFixed(2) : 0,
      timestamp: ahora.toISOString()
    };
  }
}

module.exports = new QRService();
