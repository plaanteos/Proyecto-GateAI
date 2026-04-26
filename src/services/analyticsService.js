/**
 * UnionTech Analytics Service
 * Servicio avanzado para análisis y métricas del sistema
 * Version: 1.0.0
 */

class AnalyticsService {
  constructor() {
    this.estadisticas = new Map();
    this.intervalos = []; // Para poder limpiar los intervalos
    
    // Solo inicializar recolección automática si no estamos en modo test
    if (process.env.NODE_ENV !== 'test') {
      this.iniciarRecoleccionMetricas();
    }
  }

  // Inicializar recolección automática de métricas
  iniciarRecoleccionMetricas() {
    // Recolectar métricas cada 5 minutos
    const intervalo = setInterval(() => {
      this.recolectarMetricasEnTiempoReal();
    }, 5 * 60 * 1000);
    
    this.intervalos.push(intervalo);
    
    console.log('📊 Analytics Service iniciado - Recolección automática activada');
  }

  // Método para limpiar intervalos (útil para tests)
  detenerRecoleccion() {
    this.intervalos.forEach(intervalo => clearInterval(intervalo));
    this.intervalos = [];
  }

  // Recolectar métricas en tiempo real
  async recolectarMetricasEnTiempoReal() {
    try {
      const timestamp = new Date();
      
      const metricaActual = {
        timestamp,
        accesos_activos: this.contarAccesosActivos(),
        visitantes_presentes: this.contarVisitantesPresentes(),
        uso_sistema: this.calcularUsoSistema(),
        alertas_activas: this.contarAlertasActivas(),
        rendimiento: {
          cpu_usage: Math.random() * 100, // Simulado
          memory_usage: Math.random() * 100, // Simulado
          response_time: Math.random() * 500 + 100 // Simulado
        }
      };
      
      this.metricas.rendimiento.push(metricaActual);
      
      // Mantener solo las últimas 24 horas de métricas
      const hace24Horas = new Date(Date.now() - 24 * 60 * 60 * 1000);
      this.metricas.rendimiento = this.metricas.rendimiento.filter(
        m => m.timestamp > hace24Horas
      );
      
    } catch (error) {
      console.error('Error recolectando métricas:', error);
    }
  }

  // Generar reporte de tendencias
  generarReporteTendencias(periodo = '30d') {
    const fechaInicio = this.calcularFechaInicio(periodo);
    
    return {
      periodo,
      fecha_inicio: fechaInicio,
      fecha_fin: new Date(),
      tendencias: {
        accesos: this.analizarTendenciaAccesos(fechaInicio),
        visitantes: this.analizarTendenciaVisitantes(fechaInicio),
        seguridad: this.analizarTendenciaSeguridad(fechaInicio),
        uso_sistema: this.analizarTendenciaUsoSistema(fechaInicio)
      },
      predicciones: this.generarPredicciones(periodo),
      recomendaciones: this.generarRecomendaciones()
    };
  }

  // Análisis de patrones de acceso
  analizarPatronesAcceso(datos) {
    const patrones = {
      horarios_pico: this.identificarHorariosPico(datos),
      dias_mas_activos: this.identificarDiasMasActivos(datos),
      rutas_frecuentes: this.identificarRutasFrecuentes(datos),
      usuarios_regulares: this.identificarUsuariosRegulares(datos),
      anomalias: this.detectarAnomalias(datos)
    };
    
    return patrones;
  }

  // Detectar anomalías en el sistema
  detectarAnomalias(datos) {
    const anomalias = [];
    
    // Detección de picos inusuales de acceso
    const promedioDiario = this.calcularPromedioDiario(datos);
    const umbralAnomalia = promedioDiario * 2.5;
    
    datos.forEach(acceso => {
      const fecha = new Date(acceso.fecha_hora).toDateString();
      const accesosDia = datos.filter(a => 
        new Date(a.fecha_hora).toDateString() === fecha
      ).length;
      
      if (accesosDia > umbralAnomalia) {
        anomalias.push({
          tipo: 'pico_inusual_accesos',
          fecha,
          valor: accesosDia,
          umbral: umbralAnomalia,
          severidad: 'media'
        });
      }
    });
    
    // Detección de intentos fallidos consecutivos
    let fallosConsecutivos = 0;
    datos.forEach(acceso => {
      if (acceso.resultado === 'denegado') {
        fallosConsecutivos++;
        if (fallosConsecutivos >= 5) {
          anomalias.push({
            tipo: 'intentos_fallidos_consecutivos',
            fecha: new Date(acceso.fecha_hora),
            valor: fallosConsecutivos,
            usuario: acceso.persona_nombre,
            severidad: 'alta'
          });
        }
      } else {
        fallosConsecutivos = 0;
      }
    });
    
    return anomalias;
  }

  // Generar dashboard ejecutivo
  generarDashboardEjecutivo() {
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const inicioSemana = new Date(ahora);
    inicioSemana.setDate(ahora.getDate() - 7);
    
    return {
      resumen_ejecutivo: {
        kpis_principales: this.calcularKPIsPrincipales(),
        tendencia_mes: this.calcularTendenciaMes(inicioMes),
        alertas_criticas: this.obtenerAlertasCriticas(),
        objetivos_cumplimiento: this.evaluarCumplimientoObjetivos()
      },
      metricas_operacionales: {
        eficiencia_accesos: this.calcularEficienciaAccesos(),
        satisfaccion_visitantes: this.calcularSatisfaccionVisitantes(),
        tiempo_respuesta_promedio: this.calcularTiempoRespuestaPromedio(),
        disponibilidad_sistema: this.calcularDisponibilidadSistema()
      },
      analisis_costos: {
        costo_por_acceso: this.calcularCostoPorAcceso(),
        roi_sistema: this.calcularROISistema(),
        ahorro_estimado: this.calcularAhorroEstimado()
      },
      proyecciones: {
        crecimiento_esperado: this.proyectarCrecimiento(),
        recursos_necesarios: this.proyectarRecursosNecesarios(),
        inversiones_recomendadas: this.recomendarInversiones()
      }
    };
  }

  // Métodos auxiliares
  calcularFechaInicio(periodo) {
    const ahora = new Date();
    switch (periodo) {
      case '7d': return new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d': return new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d': return new Date(ahora.getTime() - 90 * 24 * 60 * 60 * 1000);
      case '1y': return new Date(ahora.getTime() - 365 * 24 * 60 * 60 * 1000);
      default: return new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }

  contarAccesosActivos() {
    // Simulación - en sistema real consultaría BD
    return Math.floor(Math.random() * 50) + 10;
  }

  contarVisitantesPresentes() {
    // Simulación - visitantes actualmente en edificio
    return Math.floor(Math.random() * 20) + 5;
  }

  calcularUsoSistema() {
    // Simulación - porcentaje de uso del sistema
    return Math.floor(Math.random() * 30) + 60;
  }

  contarAlertasActivas() {
    // Simulación - alertas de seguridad activas
    return Math.floor(Math.random() * 5);
  }

  analizarTendenciaAccesos(fechaInicio) {
    return {
      total: Math.floor(Math.random() * 1000) + 500,
      crecimiento: `${Math.floor(Math.random() * 20) - 10}%`,
      promedio_diario: Math.floor(Math.random() * 50) + 25,
      pico_maximo: Math.floor(Math.random() * 100) + 80
    };
  }

  analizarTendenciaVisitantes(fechaInicio) {
    return {
      total: Math.floor(Math.random() * 200) + 100,
      crecimiento: `${Math.floor(Math.random() * 30) - 15}%`,
      promedio_diario: Math.floor(Math.random() * 10) + 5,
      tasa_autorizacion: Math.floor(Math.random() * 20) + 80
    };
  }

  analizarTendenciaSeguridad(fechaInicio) {
    return {
      alertas_totales: Math.floor(Math.random() * 20) + 5,
      incidentes_resueltos: Math.floor(Math.random() * 15) + 10,
      tiempo_promedio_resolucion: `${Math.floor(Math.random() * 3) + 1}.${Math.floor(Math.random() * 9)} horas`,
      nivel_seguridad: 'Alto'
    };
  }

  analizarTendenciaUsoSistema(fechaInicio) {
    return {
      disponibilidad: `${99 + Math.random()}%`,
      tiempo_respuesta_promedio: `${Math.floor(Math.random() * 200) + 100}ms`,
      usuarios_activos: Math.floor(Math.random() * 50) + 20,
      sesiones_diarias: Math.floor(Math.random() * 100) + 80
    };
  }

  generarPredicciones(periodo) {
    return {
      accesos_proxima_semana: Math.floor(Math.random() * 500) + 300,
      visitantes_proxima_semana: Math.floor(Math.random() * 50) + 30,
      carga_sistema_esperada: `${Math.floor(Math.random() * 30) + 60}%`,
      recursos_adicionales_necesarios: Math.random() > 0.7
    };
  }

  generarRecomendaciones() {
    const recomendaciones = [
      'Optimizar flujo de acceso en horarios pico (9-11 AM)',
      'Implementar pre-autorización para visitantes recurrentes',
      'Considerar ampliación de personal de seguridad en días de alta actividad',
      'Actualizar protocolo de emergencia basado en últimas alertas',
      'Mejorar integración con sistemas biométricos'
    ];
    
    return recomendaciones.sort(() => 0.5 - Math.random()).slice(0, 3);
  }

  identificarHorariosPico(datos) {
    const horarios = {};
    datos.forEach(acceso => {
      const hora = new Date(acceso.fecha_hora).getHours();
      horarios[hora] = (horarios[hora] || 0) + 1;
    });
    
    return Object.entries(horarios)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hora, cantidad]) => ({ hora: parseInt(hora), accesos: cantidad }));
  }

  identificarDiasMasActivos(datos) {
    const dias = {};
    datos.forEach(acceso => {
      const dia = new Date(acceso.fecha_hora).toLocaleDateString();
      dias[dia] = (dias[dia] || 0) + 1;
    });
    
    return Object.entries(dias)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([dia, cantidad]) => ({ dia, accesos: cantidad }));
  }

  identificarRutasFrecuentes(datos) {
    // Simulación de rutas más utilizadas
    return [
      { origen: 'Entrada Principal', destino: 'Torre Central', frecuencia: 45 },
      { origen: 'Estacionamiento', destino: 'Edificio Norte', frecuencia: 32 },
      { origen: 'Recepción', destino: 'Salas de Reunión', frecuencia: 28 }
    ];
  }

  identificarUsuariosRegulares(datos) {
    const usuarios = {};
    datos.forEach(acceso => {
      usuarios[acceso.persona_nombre] = (usuarios[acceso.persona_nombre] || 0) + 1;
    });
    
    return Object.entries(usuarios)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([usuario, accesos]) => ({ usuario, accesos, categoria: accesos > 20 ? 'regular' : 'ocasional' }));
  }

  calcularPromedioDiario(datos) {
    const diasUnicos = new Set(datos.map(a => new Date(a.fecha_hora).toDateString())).size;
    return diasUnicos > 0 ? datos.length / diasUnicos : 0;
  }

  calcularKPIsPrincipales() {
    return {
      accesos_diarios: Math.floor(Math.random() * 100) + 50,
      tasa_exito_accesos: Math.floor(Math.random() * 10) + 90,
      visitantes_diarios: Math.floor(Math.random() * 20) + 10,
      tiempo_respuesta_promedio: Math.floor(Math.random() * 100) + 150,
      disponibilidad_sistema: 99.5 + Math.random() * 0.5
    };
  }

  calcularTendenciaMes(inicioMes) {
    return {
      crecimiento_accesos: `${Math.floor(Math.random() * 20) - 5}%`,
      crecimiento_visitantes: `${Math.floor(Math.random() * 30) - 10}%`,
      mejora_eficiencia: `${Math.floor(Math.random() * 15) + 5}%`
    };
  }

  obtenerAlertasCriticas() {
    return [
      {
        id: 'alert_001',
        tipo: 'Múltiples intentos fallidos',
        severidad: 'alta',
        estado: 'activa',
        fecha: new Date()
      }
    ].filter(() => Math.random() > 0.7); // Solo mostrar a veces
  }

  evaluarCumplimientoObjetivos() {
    return {
      seguridad: Math.floor(Math.random() * 20) + 80,
      eficiencia: Math.floor(Math.random() * 15) + 85,
      satisfaccion_usuario: Math.floor(Math.random() * 10) + 90
    };
  }

  calcularEficienciaAccesos() {
    return {
      tiempo_promedio_procesamiento: `${Math.floor(Math.random() * 3) + 2}.${Math.floor(Math.random() * 9)} segundos`,
      tasa_exito_primer_intento: `${Math.floor(Math.random() * 10) + 90}%`,
      reduccion_colas: `${Math.floor(Math.random() * 20) + 15}%`
    };
  }

  calcularSatisfaccionVisitantes() {
    return `${Math.floor(Math.random() * 10) + 85}%`;
  }

  calcularTiempoRespuestaPromedio() {
    return `${Math.floor(Math.random() * 200) + 100}ms`;
  }

  calcularDisponibilidadSistema() {
    return `${99 + Math.random().toFixed(2)}%`;
  }

  calcularCostoPorAcceso() {
    return `$${(Math.random() * 0.5 + 0.5).toFixed(2)}`;
  }

  calcularROISistema() {
    return `${Math.floor(Math.random() * 50) + 150}%`;
  }

  calcularAhorroEstimado() {
    return `$${Math.floor(Math.random() * 50000) + 25000}/año`;
  }

  proyectarCrecimiento() {
    return {
      accesos: `${Math.floor(Math.random() * 20) + 5}% anual`,
      visitantes: `${Math.floor(Math.random() * 25) + 10}% anual`,
      usuarios_sistema: `${Math.floor(Math.random() * 15) + 8}% anual`
    };
  }

  proyectarRecursosNecesarios() {
    return {
      servidores_adicionales: Math.random() > 0.8 ? 1 : 0,
      personal_seguridad: Math.floor(Math.random() * 3),
      actualizaciones_hardware: Math.random() > 0.6
    };
  }

  recomendarInversiones() {
    const inversiones = [
      'Actualización de cámaras de seguridad',
      'Ampliación de sistema biométrico',
      'Mejora en infraestructura de red',
      'Capacitación adicional del personal',
      'Implementación de IA predictiva'
    ];
    
    return inversiones.sort(() => 0.5 - Math.random()).slice(0, 2);
  }
}

module.exports = new AnalyticsService();
