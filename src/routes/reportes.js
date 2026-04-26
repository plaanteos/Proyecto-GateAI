const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth-simple');
const { query, validationResult } = require('express-validator');
const analyticsService = require('../services/analyticsService');
const databaseService = require('../services/databaseService');

// Middleware para validación de errores
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: errors.array()
    });
  }
  next();
};

// Simulación de datos para reportes (temporal hasta integración completa)
let ACCESOS_DB = [];
let VISITANTES_DB = [];
let ALERTAS_DB = [];

// Generar datos de prueba
const generarDatosPrueba = () => {
  const fechas = [];
  for (let i = 30; i >= 0; i--) {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - i);
    fechas.push(fecha);
  }
  
  // Generar accesos
  fechas.forEach((fecha, index) => {
    const cantidadAccesos = Math.floor(Math.random() * 50) + 20;
    for (let i = 0; i < cantidadAccesos; i++) {
      ACCESOS_DB.push({
        id: `access_${index}_${i}`,
        fecha_hora: new Date(fecha.getTime() + Math.random() * 24 * 60 * 60 * 1000),
        persona_id: Math.floor(Math.random() * 100) + 1,
        persona_nombre: `Usuario ${Math.floor(Math.random() * 100) + 1}`,
        edificio: ['Torre Central', 'Edificio Norte', 'Edificio Sur'][Math.floor(Math.random() * 3)],
        puerta: `Puerta ${Math.floor(Math.random() * 10) + 1}`,
        tipo_acceso: ['tarjeta', 'qr', 'biometrico'][Math.floor(Math.random() * 3)],
        resultado: Math.random() > 0.1 ? 'autorizado' : 'denegado',
        metodo_validacion: ['facial', 'huella', 'tarjeta'][Math.floor(Math.random() * 3)]
      });
    }
  });
  
  // Generar visitantes
  fechas.forEach((fecha, index) => {
    const cantidadVisitantes = Math.floor(Math.random() * 15) + 5;
    for (let i = 0; i < cantidadVisitantes; i++) {
      VISITANTES_DB.push({
        id: `visitor_${index}_${i}`,
        nombre: `Visitante ${index}_${i}`,
        empresa: ['TechCorp', 'InnovateLab', 'FutureSoft', 'DataPro'][Math.floor(Math.random() * 4)],
        fecha_visita: fecha,
        estado: ['autorizado', 'pendiente', 'rechazado', 'finalizado'][Math.floor(Math.random() * 4)],
        edificio: ['Torre Central', 'Edificio Norte', 'Edificio Sur'][Math.floor(Math.random() * 3)],
        duracion_minutos: Math.floor(Math.random() * 240) + 30
      });
    }
  });
  
  // Generar alertas de seguridad
  fechas.forEach((fecha, index) => {
    if (Math.random() > 0.7) { // 30% de días con alertas
      ALERTAS_DB.push({
        id: `alert_${index}`,
        fecha_hora: fecha,
        tipo: ['acceso_no_autorizado', 'multiples_intentos_fallidos', 'acceso_fuera_horario'][Math.floor(Math.random() * 3)],
        severidad: ['baja', 'media', 'alta'][Math.floor(Math.random() * 3)],
        edificio: ['Torre Central', 'Edificio Norte', 'Edificio Sur'][Math.floor(Math.random() * 3)],
        estado: ['activa', 'resuelta', 'investigando'][Math.floor(Math.random() * 3)]
      });
    }
  });
};

// Inicializar datos
generarDatosPrueba();

// GET /api/reportes/dashboard - Dashboard principal completo
router.get('/dashboard', auth, async (req, res) => {
  try {
    const hoy = new Date();
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - 7);
    const inicioMes = new Date(hoy);
    inicioMes.setDate(hoy.getDate() - 30);
    
    // Obtener datos de la base de datos
    const [
      accesosHoy,
      personasActivas,
      invitacionesPendientes,
      edificiosActivos
    ] = await Promise.all([
      databaseService.countRecords('registros_acceso', { 
        fecha_hora: { gte: inicioHoy } 
      }),
      databaseService.countRecords('personas', { activo: true }),
      databaseService.countRecords('invitaciones', { estado: 'pendiente' }),
      databaseService.countRecords('edificios', { activo: true })
    ]);
    
    // Obtener registros para análisis
    const registrosRecientes = await databaseService.findRegistrosAcceso({
      fecha_hora: { gte: inicioSemana }
    });
    
    const invitacionesRecientes = await databaseService.findInvitaciones({
      fecha_invitacion: { gte: inicioSemana }
    });
    
    // Actividad por edificio (simulada si no hay datos reales)
    const actividadPorEdificio = {};
    if (registrosRecientes.length > 0) {
      registrosRecientes.forEach(r => {
        const edificio = r.puerta?.edificio?.nombre || 'Edificio Desconocido';
        actividadPorEdificio[edificio] = (actividadPorEdificio[edificio] || 0) + 1;
      });
    } else {
      // Datos simulados si no hay registros reales
      actividadPorEdificio['Torre Central'] = Math.floor(Math.random() * 50) + 20;
      actividadPorEdificio['Edificio Norte'] = Math.floor(Math.random() * 30) + 15;
      actividadPorEdificio['Edificio Sur'] = Math.floor(Math.random() * 25) + 10;
    }
    
    // Horarios pico
    const horariosPico = {};
    if (registrosRecientes.length > 0) {
      registrosRecientes.forEach(r => {
        const hora = new Date(r.fecha_hora).getHours();
        horariosPico[hora] = (horariosPico[hora] || 0) + 1;
      });
    } else {
      // Horarios pico simulados
      horariosPico[9] = Math.floor(Math.random() * 20) + 15;
      horariosPico[10] = Math.floor(Math.random() * 25) + 20;
      horariosPico[14] = Math.floor(Math.random() * 15) + 10;
      horariosPico[17] = Math.floor(Math.random() * 30) + 25;
    }
    
    const dashboard = {
      metricas_hoy: {
        total_accesos: accesosHoy,
        accesos_autorizados: Math.floor(accesosHoy * 0.95), // 95% éxito simulado
        accesos_denegados: Math.floor(accesosHoy * 0.05),
        total_visitantes: invitacionesRecientes.length,
        visitantes_activos: invitacionesRecientes.filter(i => i.estado === 'autorizado').length,
        alertas_activas: Math.floor(Math.random() * 3) // Alertas simuladas
      },
      tendencias_semanales: {
        accesos_promedio_dia: Math.round(registrosRecientes.length / 7),
        visitantes_promedio_dia: Math.round(invitacionesRecientes.length / 7),
        crecimiento_accesos: `${Math.floor(Math.random() * 20) - 10}%`,
        crecimiento_visitantes: `${Math.floor(Math.random() * 30) - 15}%`
      },
      actividad_por_edificio: actividadPorEdificio,
      horarios_pico: horariosPico,
      alertas_recientes: [], // Se llenarían con datos reales de alertas
      database_status: await databaseService.healthCheck(),
      ultima_actualizacion: new Date()
    };

    res.json({
      success: true,
      data: dashboard
    });

  } catch (error) {
    console.error('Error generando dashboard:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// GET /api/reportes/accesos - Reporte detallado de accesos
router.get('/accesos', [
  auth,
  query('fecha_desde').optional().isISO8601(),
  query('fecha_hasta').optional().isISO8601(),
  query('edificio').optional().isString(),
  query('tipo_acceso').optional().isString(),
  query('resultado').optional().isIn(['autorizado', 'denegado']),
  handleValidationErrors
], async (req, res) => {
  try {
    const { 
      fecha_desde, 
      fecha_hasta, 
      edificio, 
      tipo_acceso, 
      resultado,
      page = 1,
      limit = 100
    } = req.query;
    
    let accesosFiltrados = [...ACCESOS_DB];
    
    // Aplicar filtros
    if (fecha_desde) {
      const fechaDesde = new Date(fecha_desde);
      accesosFiltrados = accesosFiltrados.filter(a => 
        new Date(a.fecha_hora) >= fechaDesde
      );
    }
    
    if (fecha_hasta) {
      const fechaHasta = new Date(fecha_hasta);
      accesosFiltrados = accesosFiltrados.filter(a => 
        new Date(a.fecha_hora) <= fechaHasta
      );
    }
    
    if (edificio) {
      accesosFiltrados = accesosFiltrados.filter(a => 
        a.edificio.toLowerCase().includes(edificio.toLowerCase())
      );
    }
    
    if (tipo_acceso) {
      accesosFiltrados = accesosFiltrados.filter(a => 
        a.tipo_acceso === tipo_acceso
      );
    }
    
    if (resultado) {
      accesosFiltrados = accesosFiltrados.filter(a => 
        a.resultado === resultado
      );
    }
    
    // Ordenar por fecha descendente
    accesosFiltrados.sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora));
    
    // Paginación
    const offset = (page - 1) * limit;
    const accesosPaginados = accesosFiltrados.slice(offset, offset + parseInt(limit));
    
    // Generar estadísticas del período
    const estadisticas = {
      total_accesos: accesosFiltrados.length,
      autorizados: accesosFiltrados.filter(a => a.resultado === 'autorizado').length,
      denegados: accesosFiltrados.filter(a => a.resultado === 'denegado').length,
      por_edificio: {},
      por_tipo_acceso: {},
      por_hora: {}
    };
    
    accesosFiltrados.forEach(a => {
      // Por edificio
      if (!estadisticas.por_edificio[a.edificio]) {
        estadisticas.por_edificio[a.edificio] = 0;
      }
      estadisticas.por_edificio[a.edificio]++;
      
      // Por tipo de acceso
      if (!estadisticas.por_tipo_acceso[a.tipo_acceso]) {
        estadisticas.por_tipo_acceso[a.tipo_acceso] = 0;
      }
      estadisticas.por_tipo_acceso[a.tipo_acceso]++;
      
      // Por hora
      const hora = new Date(a.fecha_hora).getHours();
      if (!estadisticas.por_hora[hora]) {
        estadisticas.por_hora[hora] = 0;
      }
      estadisticas.por_hora[hora]++;
    });
    
    // Calcular tasa de éxito
    estadisticas.tasa_exito = accesosFiltrados.length > 0 
      ? Math.round((estadisticas.autorizados / accesosFiltrados.length) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        accesos: accesosPaginados,
        estadisticas,
        paginacion: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: accesosFiltrados.length,
          pages: Math.ceil(accesosFiltrados.length / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error generando reporte de accesos:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// GET /api/reportes/visitantes - Reporte de visitantes
router.get('/visitantes', [
  auth,
  query('fecha_desde').optional().isISO8601(),
  query('fecha_hasta').optional().isISO8601(),
  query('estado').optional().isString(),
  query('edificio').optional().isString(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { 
      fecha_desde, 
      fecha_hasta, 
      estado, 
      edificio,
      page = 1,
      limit = 50
    } = req.query;
    
    let visitantesFiltrados = [...VISITANTES_DB];
    
    // Aplicar filtros
    if (fecha_desde) {
      const fechaDesde = new Date(fecha_desde);
      visitantesFiltrados = visitantesFiltrados.filter(v => 
        new Date(v.fecha_visita) >= fechaDesde
      );
    }
    
    if (fecha_hasta) {
      const fechaHasta = new Date(fecha_hasta);
      visitantesFiltrados = visitantesFiltrados.filter(v => 
        new Date(v.fecha_visita) <= fechaHasta
      );
    }
    
    if (estado) {
      visitantesFiltrados = visitantesFiltrados.filter(v => v.estado === estado);
    }
    
    if (edificio) {
      visitantesFiltrados = visitantesFiltrados.filter(v => 
        v.edificio.toLowerCase().includes(edificio.toLowerCase())
      );
    }
    
    // Ordenar por fecha
    visitantesFiltrados.sort((a, b) => new Date(b.fecha_visita) - new Date(a.fecha_visita));
    
    // Paginación
    const offset = (page - 1) * limit;
    const visitantesPaginados = visitantesFiltrados.slice(offset, offset + parseInt(limit));
    
    // Estadísticas
    const estadisticas = {
      total_visitantes: visitantesFiltrados.length,
      por_estado: {},
      por_edificio: {},
      por_empresa: {},
      duracion_promedio: 0,
      visitantes_recurrentes: 0
    };
    
    const empresas = {};
    let totalDuracion = 0;
    let visitantesConDuracion = 0;
    
    visitantesFiltrados.forEach(v => {
      // Por estado
      if (!estadisticas.por_estado[v.estado]) {
        estadisticas.por_estado[v.estado] = 0;
      }
      estadisticas.por_estado[v.estado]++;
      
      // Por edificio
      if (!estadisticas.por_edificio[v.edificio]) {
        estadisticas.por_edificio[v.edificio] = 0;
      }
      estadisticas.por_edificio[v.edificio]++;
      
      // Por empresa
      if (v.empresa) {
        if (!estadisticas.por_empresa[v.empresa]) {
          estadisticas.por_empresa[v.empresa] = 0;
        }
        estadisticas.por_empresa[v.empresa]++;
        
        if (!empresas[v.empresa]) {
          empresas[v.empresa] = new Set();
        }
        empresas[v.empresa].add(v.nombre);
      }
      
      // Duración promedio
      if (v.duracion_minutos) {
        totalDuracion += v.duracion_minutos;
        visitantesConDuracion++;
      }
    });
    
    // Calcular promedios
    if (visitantesConDuracion > 0) {
      estadisticas.duracion_promedio = Math.round(totalDuracion / visitantesConDuracion);
    }
    
    // Visitantes recurrentes (mismo nombre más de una vez)
    const nombresVisitantes = {};
    visitantesFiltrados.forEach(v => {
      if (!nombresVisitantes[v.nombre]) {
        nombresVisitantes[v.nombre] = 0;
      }
      nombresVisitantes[v.nombre]++;
    });
    
    estadisticas.visitantes_recurrentes = Object.values(nombresVisitantes)
      .filter(count => count > 1).length;

    res.json({
      success: true,
      data: {
        visitantes: visitantesPaginados,
        estadisticas,
        paginacion: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: visitantesFiltrados.length,
          pages: Math.ceil(visitantesFiltrados.length / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error generando reporte de visitantes:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// GET /api/reportes/seguridad - Reporte de seguridad y alertas
router.get('/seguridad', [
  auth,
  query('fecha_desde').optional().isISO8601(),
  query('fecha_hasta').optional().isISO8601(),
  query('severidad').optional().isIn(['baja', 'media', 'alta']),
  query('tipo').optional().isString(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { 
      fecha_desde, 
      fecha_hasta, 
      severidad, 
      tipo,
      page = 1,
      limit = 50
    } = req.query;
    
    let alertasFiltradas = [...ALERTAS_DB];
    
    // Aplicar filtros
    if (fecha_desde) {
      const fechaDesde = new Date(fecha_desde);
      alertasFiltradas = alertasFiltradas.filter(a => 
        new Date(a.fecha_hora) >= fechaDesde
      );
    }
    
    if (fecha_hasta) {
      const fechaHasta = new Date(fecha_hasta);
      alertasFiltradas = alertasFiltradas.filter(a => 
        new Date(a.fecha_hora) <= fechaHasta
      );
    }
    
    if (severidad) {
      alertasFiltradas = alertasFiltradas.filter(a => a.severidad === severidad);
    }
    
    if (tipo) {
      alertasFiltradas = alertasFiltradas.filter(a => a.tipo === tipo);
    }
    
    // Ordenar por fecha descendente
    alertasFiltradas.sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora));
    
    // Paginación
    const offset = (page - 1) * limit;
    const alertasPaginadas = alertasFiltradas.slice(offset, offset + parseInt(limit));
    
    // Estadísticas de seguridad
    const estadisticas = {
      total_alertas: alertasFiltradas.length,
      por_severidad: {},
      por_tipo: {},
      por_estado: {},
      por_edificio: {},
      alertas_criticas_abiertas: 0,
      tiempo_promedio_resolucion: '2.5 horas' // Simulado
    };
    
    alertasFiltradas.forEach(a => {
      // Por severidad
      if (!estadisticas.por_severidad[a.severidad]) {
        estadisticas.por_severidad[a.severidad] = 0;
      }
      estadisticas.por_severidad[a.severidad]++;
      
      // Por tipo
      if (!estadisticas.por_tipo[a.tipo]) {
        estadisticas.por_tipo[a.tipo] = 0;
      }
      estadisticas.por_tipo[a.tipo]++;
      
      // Por estado
      if (!estadisticas.por_estado[a.estado]) {
        estadisticas.por_estado[a.estado] = 0;
      }
      estadisticas.por_estado[a.estado]++;
      
      // Por edificio
      if (!estadisticas.por_edificio[a.edificio]) {
        estadisticas.por_edificio[a.edificio] = 0;
      }
      estadisticas.por_edificio[a.edificio]++;
      
      // Alertas críticas abiertas
      if (a.severidad === 'alta' && a.estado === 'activa') {
        estadisticas.alertas_criticas_abiertas++;
      }
    });
    
    // Intentos de acceso fallidos por período
    const intentosFallidos = ACCESOS_DB.filter(a => 
      a.resultado === 'denegado' &&
      (!fecha_desde || new Date(a.fecha_hora) >= new Date(fecha_desde)) &&
      (!fecha_hasta || new Date(a.fecha_hora) <= new Date(fecha_hasta))
    );
    
    estadisticas.intentos_fallidos = intentosFallidos.length;
    estadisticas.tasa_fallos = ACCESOS_DB.length > 0 
      ? Math.round((intentosFallidos.length / ACCESOS_DB.length) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        alertas: alertasPaginadas,
        estadisticas,
        paginacion: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: alertasFiltradas.length,
          pages: Math.ceil(alertasFiltradas.length / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error generando reporte de seguridad:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// GET /api/reportes/analytics - Analytics avanzados
router.get('/analytics', [
  auth,
  query('periodo').optional().isIn(['7d', '30d', '90d', '1y']),
  handleValidationErrors
], async (req, res) => {
  try {
    const { periodo = '30d' } = req.query;
    
    // Calcular fecha de inicio
    let fechaInicio = new Date();
    switch (periodo) {
      case '7d':
        fechaInicio.setDate(fechaInicio.getDate() - 7);
        break;
      case '30d':
        fechaInicio.setDate(fechaInicio.getDate() - 30);
        break;
      case '90d':
        fechaInicio.setDate(fechaInicio.getDate() - 90);
        break;
      case '1y':
        fechaInicio.setFullYear(fechaInicio.getFullYear() - 1);
        break;
    }
    
    const accesosPeriodo = ACCESOS_DB.filter(a => 
      new Date(a.fecha_hora) >= fechaInicio
    );
    
    const visitantesPeriodo = VISITANTES_DB.filter(v => 
      new Date(v.fecha_visita) >= fechaInicio
    );
    
    // Análisis temporal (por día)
    const analisisPorDia = {};
    accesosPeriodo.forEach(a => {
      const fecha = new Date(a.fecha_hora).toISOString().split('T')[0];
      if (!analisisPorDia[fecha]) {
        analisisPorDia[fecha] = {
          accesos: 0,
          visitantes: 0,
          accesos_autorizados: 0,
          accesos_denegados: 0
        };
      }
      analisisPorDia[fecha].accesos++;
      if (a.resultado === 'autorizado') {
        analisisPorDia[fecha].accesos_autorizados++;
      } else {
        analisisPorDia[fecha].accesos_denegados++;
      }
    });
    
    visitantesPeriodo.forEach(v => {
      const fecha = new Date(v.fecha_visita).toISOString().split('T')[0];
      if (analisisPorDia[fecha]) {
        analisisPorDia[fecha].visitantes++;
      }
    });
    
    // Análisis por hora del día
    const analisisPorHora = {};
    for (let i = 0; i < 24; i++) {
      analisisPorHora[i] = 0;
    }
    
    accesosPeriodo.forEach(a => {
      const hora = new Date(a.fecha_hora).getHours();
      analisisPorHora[hora]++;
    });
    
    // Top edificios más activos
    const actividadEdificios = {};
    accesosPeriodo.forEach(a => {
      if (!actividadEdificios[a.edificio]) {
        actividadEdificios[a.edificio] = 0;
      }
      actividadEdificios[a.edificio]++;
    });
    
    const topEdificios = Object.entries(actividadEdificios)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([edificio, accesos]) => ({ edificio, accesos }));
    
    // Top usuarios más activos
    const actividadUsuarios = {};
    accesosPeriodo.forEach(a => {
      if (!actividadUsuarios[a.persona_nombre]) {
        actividadUsuarios[a.persona_nombre] = 0;
      }
      actividadUsuarios[a.persona_nombre]++;
    });
    
    const topUsuarios = Object.entries(actividadUsuarios)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([usuario, accesos]) => ({ usuario, accesos }));
    
    // Predicciones (simuladas)
    const predicciones = {
      accesos_proxima_semana: Math.round(accesosPeriodo.length * 1.05),
      visitantes_proxima_semana: Math.round(visitantesPeriodo.length * 0.95),
      crecimiento_estimado: '+5%',
      recomendaciones: [
        'Considerar reforzar seguridad en horario pico (9-10 AM)',
        'Torre Central necesita optimización de flujo',
        'Implementar pre-autorización para visitantes recurrentes'
      ]
    };
    
    const analytics = {
      periodo,
      resumen: {
        total_accesos: accesosPeriodo.length,
        total_visitantes: visitantesPeriodo.length,
        promedio_accesos_dia: Math.round(accesosPeriodo.length / 30),
        tasa_exito_accesos: Math.round(
          (accesosPeriodo.filter(a => a.resultado === 'autorizado').length / accesosPeriodo.length) * 100
        )
      },
      analisis_temporal: {
        por_dia: analisisPorDia,
        por_hora: analisisPorHora
      },
      rankings: {
        top_edificios: topEdificios,
        top_usuarios: topUsuarios
      },
      predicciones,
      ultima_actualizacion: new Date()
    };

    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('Error generando analytics:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// GET /api/reportes/exportar - Exportar reportes (CSV/JSON)
router.get('/exportar', [
  auth,
  query('tipo').isIn(['accesos', 'visitantes', 'seguridad']).withMessage('Tipo debe ser: accesos, visitantes o seguridad'),
  query('formato').optional().isIn(['json', 'csv']),
  query('fecha_desde').optional().isISO8601(),
  query('fecha_hasta').optional().isISO8601(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { 
      tipo, 
      formato = 'json', 
      fecha_desde, 
      fecha_hasta 
    } = req.query;
    
    let datos = [];
    let nombreArchivo = '';
    
    switch (tipo) {
      case 'accesos':
        datos = ACCESOS_DB.filter(a => {
          if (fecha_desde && new Date(a.fecha_hora) < new Date(fecha_desde)) return false;
          if (fecha_hasta && new Date(a.fecha_hora) > new Date(fecha_hasta)) return false;
          return true;
        });
        nombreArchivo = `accesos_${new Date().toISOString().split('T')[0]}`;
        break;
        
      case 'visitantes':
        datos = VISITANTES_DB.filter(v => {
          if (fecha_desde && new Date(v.fecha_visita) < new Date(fecha_desde)) return false;
          if (fecha_hasta && new Date(v.fecha_visita) > new Date(fecha_hasta)) return false;
          return true;
        });
        nombreArchivo = `visitantes_${new Date().toISOString().split('T')[0]}`;
        break;
        
      case 'seguridad':
        datos = ALERTAS_DB.filter(a => {
          if (fecha_desde && new Date(a.fecha_hora) < new Date(fecha_desde)) return false;
          if (fecha_hasta && new Date(a.fecha_hora) > new Date(fecha_hasta)) return false;
          return true;
        });
        nombreArchivo = `alertas_seguridad_${new Date().toISOString().split('T')[0]}`;
        break;
    }
    
    if (formato === 'csv') {
      // Convertir a CSV (simplificado)
      const headers = Object.keys(datos[0] || {});
      let csv = headers.join(',') + '\n';
      
      datos.forEach(item => {
        const values = headers.map(header => {
          const value = item[header];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        });
        csv += values.join(',') + '\n';
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}.csv"`);
      res.send(csv);
      
    } else {
      // JSON
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}.json"`);
      res.json({
        success: true,
        data: {
          tipo,
          fecha_exportacion: new Date(),
          total_registros: datos.length,
          registros: datos
        }
      });
    }

  } catch (error) {
    console.error('Error exportando reporte:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// GET /api/reportes/ejecutivo - Dashboard ejecutivo
router.get('/ejecutivo', auth, async (req, res) => {
  try {
    const dashboardEjecutivo = analyticsService.generarDashboardEjecutivo();
    
    res.json({
      success: true,
      data: dashboardEjecutivo
    });

  } catch (error) {
    console.error('Error generando dashboard ejecutivo:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// GET /api/reportes/tendencias - Análisis de tendencias
router.get('/tendencias', [
  auth,
  query('periodo').optional().isIn(['7d', '30d', '90d', '1y']),
  handleValidationErrors
], async (req, res) => {
  try {
    const { periodo = '30d' } = req.query;
    
    const reporteTendencias = analyticsService.generarReporteTendencias(periodo);
    
    res.json({
      success: true,
      data: reporteTendencias
    });

  } catch (error) {
    console.error('Error generando reporte de tendencias:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// GET /api/reportes/patrones - Análisis de patrones de acceso
router.get('/patrones', [
  auth,
  query('fecha_desde').optional().isISO8601(),
  query('fecha_hasta').optional().isISO8601(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta } = req.query;
    
    // Simular datos para análisis (en sistema real vendría de BD)
    let datosAcceso = ACCESOS_DB;
    
    if (fecha_desde) {
      datosAcceso = datosAcceso.filter(a => 
        new Date(a.fecha_hora) >= new Date(fecha_desde)
      );
    }
    
    if (fecha_hasta) {
      datosAcceso = datosAcceso.filter(a => 
        new Date(a.fecha_hora) <= new Date(fecha_hasta)
      );
    }
    
    const patrones = analyticsService.analizarPatronesAcceso(datosAcceso);
    
    res.json({
      success: true,
      data: {
        periodo: {
          desde: fecha_desde || 'Último mes',
          hasta: fecha_hasta || 'Ahora'
        },
        total_accesos_analizados: datosAcceso.length,
        patrones
      }
    });

  } catch (error) {
    console.error('Error analizando patrones:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

module.exports = router;
