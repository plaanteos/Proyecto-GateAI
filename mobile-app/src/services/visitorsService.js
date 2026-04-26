/**
 * Visitors Service - Servicio de gestión de visitantes
 * Manejo de registro, validación y seguimiento de visitantes
 */

import apiService from './apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

class VisitorsService {
  constructor() {
    this.endpoints = {
      visitors: '/visitors',
      register: '/visitors/register',
      validate: '/visitors/validate',
      approve: '/visitors/approve',
      reject: '/visitors/reject',
      search: '/visitors/search',
      history: '/visitors/history',
      statistics: '/visitors/statistics',
      export: '/visitors/export',
    };
    
    this.storageKeys = {
      recentVisitors: '@recent_visitors',
      pendingApprovals: '@pending_approvals',
      visitorsCache: '@visitors_cache',
      lastSync: '@visitors_last_sync',
    };
  }

  /**
   * Obtener lista de visitantes
   */
  async getVisitors(filters = {}, page = 1) {
    try {
      console.log('👥 Obteniendo visitantes:', { filters, page });

      const params = {
        page,
        limit: 20,
        ...filters,
      };

      const response = await apiService.get(this.endpoints.visitors, params);

      if (response.success) {
        const { visitors, pagination, statistics } = response.data;
        
        // Cachear visitantes para uso offline
        await this.cacheVisitors(visitors);
        
        console.log(`✅ ${visitors.length} visitantes obtenidos`);
        
        return {
          success: true,
          data: {
            visitors,
            pagination,
            statistics,
          },
        };
      } else {
        throw new Error(response.error || 'Error al obtener visitantes');
      }
    } catch (error) {
      console.error('❌ Error al obtener visitantes:', error);
      
      // Intentar usar caché en caso de error
      const cachedVisitors = await this.getCachedVisitors();
      if (cachedVisitors.length > 0) {
        return {
          success: true,
          data: {
            visitors: cachedVisitors,
            pagination: { currentPage: 1, totalPages: 1 },
            statistics: { totalVisitors: cachedVisitors.length },
          },
          fromCache: true,
        };
      }
      
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Registrar nuevo visitante
   */
  async registerVisitor(visitorData) {
    try {
      console.log('📝 Registrando visitante:', visitorData.name);

      // Preparar datos del visitante
      const formattedData = {
        ...visitorData,
        registrationDate: new Date().toISOString(),
        status: 'pending', // Por defecto pending hasta aprobación
      };

      const response = await apiService.post(this.endpoints.register, formattedData);

      if (response.success) {
        const { visitor } = response.data;
        
        // Agregar a visitantes recientes
        await this.addToRecentVisitors(visitor);
        
        // Si requiere aprobación, agregar a pendientes
        if (visitor.status === 'pending') {
          await this.addToPendingApprovals(visitor);
        }
        
        console.log('✅ Visitante registrado:', visitor.id);
        
        return {
          success: true,
          data: { visitor },
          message: 'Visitante registrado exitosamente',
        };
      } else {
        throw new Error(response.error || 'Error al registrar visitante');
      }
    } catch (error) {
      console.error('❌ Error al registrar visitante:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Validar visitante (entrada/salida)
   */
  async validateVisitor(visitorId, validationType, biometricData = null) {
    try {
      console.log('🔍 Validando visitante:', { visitorId, validationType });

      const validationData = {
        visitorId,
        type: validationType, // 'entry' o 'exit'
        timestamp: new Date().toISOString(),
        biometricData,
        location: await this.getCurrentLocation(),
      };

      const response = await apiService.post(this.endpoints.validate, validationData);

      if (response.success) {
        const { visitor, validation } = response.data;
        
        // Actualizar caché local
        await this.updateVisitorInCache(visitor);
        
        // Registrar validación en historial local
        await this.addToValidationHistory(validation);
        
        console.log('✅ Validación exitosa:', validation.id);
        
        return {
          success: true,
          data: {
            visitor,
            validation,
          },
          message: `${validationType === 'entry' ? 'Entrada' : 'Salida'} registrada`,
        };
      } else {
        throw new Error(response.error || 'Error en validación');
      }
    } catch (error) {
      console.error('❌ Error en validación:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Aprobar visitante pendiente
   */
  async approveVisitor(visitorId, approvalData = {}) {
    try {
      console.log('✅ Aprobando visitante:', visitorId);

      const response = await apiService.post(`${this.endpoints.approve}/${visitorId}`, {
        ...approvalData,
        approvedAt: new Date().toISOString(),
      });

      if (response.success) {
        const { visitor } = response.data;
        
        // Remover de aprobaciones pendientes
        await this.removeFromPendingApprovals(visitorId);
        
        // Actualizar caché
        await this.updateVisitorInCache(visitor);
        
        console.log('✅ Visitante aprobado:', visitor.id);
        
        return {
          success: true,
          data: { visitor },
          message: 'Visitante aprobado exitosamente',
        };
      } else {
        throw new Error(response.error || 'Error al aprobar visitante');
      }
    } catch (error) {
      console.error('❌ Error al aprobar visitante:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Rechazar visitante
   */
  async rejectVisitor(visitorId, reason = '') {
    try {
      console.log('❌ Rechazando visitante:', visitorId);

      const response = await apiService.post(`${this.endpoints.reject}/${visitorId}`, {
        reason,
        rejectedAt: new Date().toISOString(),
      });

      if (response.success) {
        const { visitor } = response.data;
        
        // Remover de aprobaciones pendientes
        await this.removeFromPendingApprovals(visitorId);
        
        // Actualizar caché
        await this.updateVisitorInCache(visitor);
        
        console.log('✅ Visitante rechazado:', visitor.id);
        
        return {
          success: true,
          data: { visitor },
          message: 'Visitante rechazado',
        };
      } else {
        throw new Error(response.error || 'Error al rechazar visitante');
      }
    } catch (error) {
      console.error('❌ Error al rechazar visitante:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Buscar visitantes
   */
  async searchVisitors(searchTerm, filters = {}) {
    try {
      console.log('🔍 Buscando visitantes:', searchTerm);

      const params = {
        q: searchTerm,
        ...filters,
      };

      const response = await apiService.get(this.endpoints.search, params);

      if (response.success) {
        const { visitors } = response.data;
        
        console.log(`✅ ${visitors.length} visitantes encontrados`);
        
        return {
          success: true,
          data: { visitors },
        };
      } else {
        throw new Error(response.error || 'Error en búsqueda');
      }
    } catch (error) {
      console.error('❌ Error en búsqueda:', error);
      
      // Búsqueda en caché local como fallback
      const cachedResults = await this.searchInCache(searchTerm);
      return {
        success: true,
        data: { visitors: cachedResults },
        fromCache: true,
      };
    }
  }

  /**
   * Obtener historial de visitas
   */
  async getVisitHistory(visitorId = null, dateRange = 'week') {
    try {
      console.log('📋 Obteniendo historial de visitas');

      const params = {
        visitorId,
        dateRange,
      };

      const response = await apiService.get(this.endpoints.history, params);

      if (response.success) {
        const { visits } = response.data;
        
        console.log(`✅ ${visits.length} visitas en el historial`);
        
        return {
          success: true,
          data: { visits },
        };
      } else {
        throw new Error(response.error || 'Error al obtener historial');
      }
    } catch (error) {
      console.error('❌ Error al obtener historial:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Obtener estadísticas de visitantes
   */
  async getStatistics(dateRange = 'month') {
    try {
      const response = await apiService.get(this.endpoints.statistics, { dateRange });

      if (response.success) {
        return {
          success: true,
          data: response.data,
        };
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('❌ Error al obtener estadísticas:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Exportar datos de visitantes
   */
  async exportVisitors(format = 'csv', filters = {}) {
    try {
      const params = {
        format,
        ...filters,
      };

      const response = await apiService.get(this.endpoints.export, params);

      if (response.success) {
        return {
          success: true,
          data: response.data,
        };
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('❌ Error al exportar:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Métodos de caché local

  /**
   * Cachear visitantes
   */
  async cacheVisitors(visitors) {
    try {
      await AsyncStorage.setItem(
        this.storageKeys.visitorsCache,
        JSON.stringify(visitors)
      );
      await AsyncStorage.setItem(
        this.storageKeys.lastSync,
        new Date().toISOString()
      );
    } catch (error) {
      console.error('Error al cachear visitantes:', error);
    }
  }

  /**
   * Obtener visitantes desde caché
   */
  async getCachedVisitors() {
    try {
      const cached = await AsyncStorage.getItem(this.storageKeys.visitorsCache);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Actualizar visitante en caché
   */
  async updateVisitorInCache(updatedVisitor) {
    try {
      const cached = await this.getCachedVisitors();
      const index = cached.findIndex(v => v.id === updatedVisitor.id);
      
      if (index !== -1) {
        cached[index] = updatedVisitor;
      } else {
        cached.unshift(updatedVisitor);
      }
      
      await this.cacheVisitors(cached);
    } catch (error) {
      console.error('Error al actualizar caché:', error);
    }
  }

  /**
   * Buscar en caché local
   */
  async searchInCache(searchTerm) {
    try {
      const cached = await this.getCachedVisitors();
      const term = searchTerm.toLowerCase();
      
      return cached.filter(visitor =>
        visitor.name.toLowerCase().includes(term) ||
        visitor.email.toLowerCase().includes(term) ||
        visitor.document.toLowerCase().includes(term) ||
        visitor.company.toLowerCase().includes(term)
      );
    } catch (error) {
      return [];
    }
  }

  /**
   * Agregar a visitantes recientes
   */
  async addToRecentVisitors(visitor) {
    try {
      const recent = await AsyncStorage.getItem(this.storageKeys.recentVisitors);
      const recentList = recent ? JSON.parse(recent) : [];
      
      // Remover si ya existe
      const filtered = recentList.filter(v => v.id !== visitor.id);
      
      // Agregar al inicio y limitar a 20
      filtered.unshift(visitor);
      const limited = filtered.slice(0, 20);
      
      await AsyncStorage.setItem(
        this.storageKeys.recentVisitors,
        JSON.stringify(limited)
      );
    } catch (error) {
      console.error('Error al actualizar visitantes recientes:', error);
    }
  }

  /**
   * Agregar a aprobaciones pendientes
   */
  async addToPendingApprovals(visitor) {
    try {
      const pending = await AsyncStorage.getItem(this.storageKeys.pendingApprovals);
      const pendingList = pending ? JSON.parse(pending) : [];
      
      // Agregar si no existe
      if (!pendingList.find(v => v.id === visitor.id)) {
        pendingList.unshift(visitor);
        await AsyncStorage.setItem(
          this.storageKeys.pendingApprovals,
          JSON.stringify(pendingList)
        );
      }
    } catch (error) {
      console.error('Error al actualizar aprobaciones pendientes:', error);
    }
  }

  /**
   * Remover de aprobaciones pendientes
   */
  async removeFromPendingApprovals(visitorId) {
    try {
      const pending = await AsyncStorage.getItem(this.storageKeys.pendingApprovals);
      const pendingList = pending ? JSON.parse(pending) : [];
      
      const filtered = pendingList.filter(v => v.id !== visitorId);
      await AsyncStorage.setItem(
        this.storageKeys.pendingApprovals,
        JSON.stringify(filtered)
      );
    } catch (error) {
      console.error('Error al remover de pendientes:', error);
    }
  }

  /**
   * Agregar al historial de validaciones
   */
  async addToValidationHistory(validation) {
    try {
      const key = '@validation_history';
      const history = await AsyncStorage.getItem(key);
      const historyList = history ? JSON.parse(history) : [];
      
      historyList.unshift(validation);
      
      // Limitar a 100 validaciones
      const limited = historyList.slice(0, 100);
      
      await AsyncStorage.setItem(key, JSON.stringify(limited));
    } catch (error) {
      console.error('Error al guardar validación:', error);
    }
  }

  /**
   * Obtener ubicación actual
   */
  async getCurrentLocation() {
    try {
      // Aquí se implementaría la obtención de ubicación GPS
      // Por ahora retornamos una ubicación por defecto
      return {
        latitude: null,
        longitude: null,
        accuracy: null,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Validar datos de visitante
   */
  validateVisitorData(visitorData) {
    const errors = [];

    if (!visitorData.name || visitorData.name.trim().length < 2) {
      errors.push('El nombre debe tener al menos 2 caracteres');
    }

    if (!visitorData.email || !/\S+@\S+\.\S+/.test(visitorData.email)) {
      errors.push('Email inválido');
    }

    if (!visitorData.document || visitorData.document.trim().length < 5) {
      errors.push('Documento inválido');
    }

    if (!visitorData.company || visitorData.company.trim().length < 2) {
      errors.push('Empresa es requerida');
    }

    if (!visitorData.purpose || visitorData.purpose.trim().length < 5) {
      errors.push('Propósito de la visita es requerido');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Exportar instancia singleton
export const visitorsService = new VisitorsService();
export default visitorsService;
