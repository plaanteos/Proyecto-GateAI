/**
 * Access Control Service - Servicio de control de acceso
 * Manejo de zonas, permisos, validaciones y seguridad
 */

import apiService from './apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TouchID from 'react-native-touch-id';

class AccessControlService {
  constructor() {
    this.endpoints = {
      zones: '/access/zones',
      permissions: '/access/permissions',
      validate: '/access/validate',
      logs: '/access/logs',
      alerts: '/access/alerts',
      schedules: '/access/schedules',
      settings: '/access/settings',
      emergency: '/access/emergency',
    };
    
    this.storageKeys = {
      zones: '@access_zones',
      permissions: '@user_permissions',
      settings: '@access_settings',
      recentLogs: '@recent_access_logs',
      emergencyContacts: '@emergency_contacts',
    };
  }

  /**
   * Obtener zonas de acceso
   */
  async getZones() {
    try {
      console.log('🏢 Obteniendo zonas de acceso');

      const response = await apiService.get(this.endpoints.zones);

      if (response.success) {
        const { zones } = response.data;
        
        // Cachear zonas para uso offline
        await this.cacheZones(zones);
        
        console.log(`✅ ${zones.length} zonas obtenidas`);
        
        return {
          success: true,
          data: { zones },
        };
      } else {
        throw new Error(response.error || 'Error al obtener zonas');
      }
    } catch (error) {
      console.error('❌ Error al obtener zonas:', error);
      
      // Usar caché en caso de error
      const cachedZones = await this.getCachedZones();
      return {
        success: true,
        data: { zones: cachedZones },
        fromCache: true,
      };
    }
  }

  /**
   * Validar acceso a zona
   */
  async validateAccess({ zoneId, biometricData, cardData, userId }) {
    try {
      console.log('🔐 Validando acceso a zona:', zoneId);

      const validationData = {
        zoneId,
        userId,
        timestamp: new Date().toISOString(),
        biometricData,
        cardData,
        deviceInfo: await this.getDeviceInfo(),
        location: await this.getCurrentLocation(),
      };

      const response = await apiService.post(this.endpoints.validate, validationData);

      if (response.success) {
        const { access, result } = response.data;
        
        // Registrar en logs locales
        await this.addToAccessLogs({
          ...access,
          timestamp: validationData.timestamp,
        });
        
        // Verificar alertas de seguridad
        if (!access.granted) {
          await this.checkSecurityAlerts(access);
        }
        
        console.log(`✅ Validación: ${access.granted ? 'PERMITIDA' : 'DENEGADA'}`);
        
        return {
          success: true,
          data: { access, result },
        };
      } else {
        throw new Error(response.error || 'Error en validación de acceso');
      }
    } catch (error) {
      console.error('❌ Error en validación de acceso:', error);
      
      // Registrar intento fallido
      await this.addToAccessLogs({
        zoneId,
        userId,
        granted: false,
        reason: 'Error de sistema',
        timestamp: new Date().toISOString(),
      });
      
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Obtener permisos de usuario
   */
  async getUserPermissions(userId) {
    try {
      console.log('👤 Obteniendo permisos de usuario:', userId);

      const response = await apiService.get(`${this.endpoints.permissions}/${userId}`);

      if (response.success) {
        const { permissions } = response.data;
        
        // Cachear permisos
        await this.cachePermissions(permissions);
        
        console.log(`✅ ${permissions.length} permisos obtenidos`);
        
        return {
          success: true,
          data: { permissions },
        };
      } else {
        throw new Error(response.error || 'Error al obtener permisos');
      }
    } catch (error) {
      console.error('❌ Error al obtener permisos:', error);
      
      // Usar caché en caso de error
      const cachedPermissions = await this.getCachedPermissions();
      return {
        success: true,
        data: { permissions: cachedPermissions },
        fromCache: true,
      };
    }
  }

  /**
   * Obtener horarios de acceso
   */
  async getAccessSchedules(userId) {
    try {
      console.log('⏰ Obteniendo horarios de acceso');

      const response = await apiService.get(`${this.endpoints.schedules}/${userId}`);

      if (response.success) {
        const { schedules } = response.data;
        
        console.log(`✅ ${schedules.length} horarios obtenidos`);
        
        return {
          success: true,
          data: { schedules },
        };
      } else {
        throw new Error(response.error || 'Error al obtener horarios');
      }
    } catch (error) {
      console.error('❌ Error al obtener horarios:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Obtener logs de acceso
   */
  async getAccessLogs(filters = {}, page = 1) {
    try {
      console.log('📋 Obteniendo logs de acceso');

      const params = {
        page,
        limit: 50,
        ...filters,
      };

      const response = await apiService.get(this.endpoints.logs, params);

      if (response.success) {
        const { logs } = response.data;
        
        console.log(`✅ ${logs.length} logs obtenidos`);
        
        return {
          success: true,
          data: { logs },
        };
      } else {
        throw new Error(response.error || 'Error al obtener logs');
      }
    } catch (error) {
      console.error('❌ Error al obtener logs:', error);
      
      // Usar logs locales como fallback
      const localLogs = await this.getLocalAccessLogs();
      return {
        success: true,
        data: { logs: localLogs },
        fromCache: true,
      };
    }
  }

  /**
   * Obtener alertas de seguridad
   */
  async getSecurityAlerts() {
    try {
      console.log('🚨 Obteniendo alertas de seguridad');

      const response = await apiService.get(this.endpoints.alerts);

      if (response.success) {
        const { alerts } = response.data;
        
        console.log(`✅ ${alerts.length} alertas obtenidas`);
        
        return {
          success: true,
          data: { alerts },
        };
      } else {
        throw new Error(response.error || 'Error al obtener alertas');
      }
    } catch (error) {
      console.error('❌ Error al obtener alertas:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Crear nueva zona
   */
  async createZone(zoneData) {
    try {
      console.log('🏗️ Creando nueva zona:', zoneData.name);

      const response = await apiService.post(this.endpoints.zones, zoneData);

      if (response.success) {
        const { zone } = response.data;
        
        // Actualizar caché de zonas
        await this.addZoneToCache(zone);
        
        console.log('✅ Zona creada:', zone.id);
        
        return {
          success: true,
          data: { zone },
        };
      } else {
        throw new Error(response.error || 'Error al crear zona');
      }
    } catch (error) {
      console.error('❌ Error al crear zona:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Actualizar configuración de seguridad
   */
  async updateSecuritySettings(settings) {
    try {
      console.log('⚙️ Actualizando configuración de seguridad');

      const response = await apiService.put(this.endpoints.settings, settings);

      if (response.success) {
        const { settings: updatedSettings } = response.data;
        
        // Cachear configuración
        await this.cacheSettings(updatedSettings);
        
        console.log('✅ Configuración actualizada');
        
        return {
          success: true,
          data: { settings: updatedSettings },
        };
      } else {
        throw new Error(response.error || 'Error al actualizar configuración');
      }
    } catch (error) {
      console.error('❌ Error al actualizar configuración:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Activar modo de emergencia
   */
  async activateEmergencyMode(emergencyType, location) {
    try {
      console.log('🚨 Activando modo de emergencia:', emergencyType);

      const emergencyData = {
        type: emergencyType,
        location,
        timestamp: new Date().toISOString(),
        deviceInfo: await this.getDeviceInfo(),
      };

      const response = await apiService.post(this.endpoints.emergency, emergencyData);

      if (response.success) {
        console.log('✅ Modo de emergencia activado');
        
        return {
          success: true,
          data: response.data,
        };
      } else {
        throw new Error(response.error || 'Error al activar modo de emergencia');
      }
    } catch (error) {
      console.error('❌ Error en modo de emergencia:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Validación biométrica local
   */
  async performBiometricValidation(zoneId) {
    try {
      console.log('👆 Iniciando validación biométrica para zona:', zoneId);

      // Verificar disponibilidad de biometría
      const biometryType = await TouchID.isSupported();
      if (!biometryType) {
        throw new Error('Biometría no disponible en este dispositivo');
      }

      // Solicitar autenticación biométrica
      await TouchID.authenticate('Acceso a zona de seguridad', {
        title: 'Autenticación Biométrica',
        subtitle: 'Valida tu identidad para acceder',
        description: 'Coloca tu dedo en el sensor o mira la cámara',
        fallbackLabel: 'Usar PIN',
        cancelLabel: 'Cancelar',
        showFallback: true,
        disableVibration: false,
      });

      console.log('✅ Validación biométrica exitosa');

      return {
        success: true,
        biometryType,
        timestamp: new Date().toISOString(),
        data: {
          validated: true,
          method: biometryType,
        },
      };
    } catch (error) {
      console.error('❌ Error en validación biométrica:', error);
      
      let errorMessage = 'Error en validación biométrica';
      if (error.message === 'UserCancel') {
        errorMessage = 'Validación cancelada por el usuario';
      } else if (error.message === 'UserFallback') {
        errorMessage = 'Usuario seleccionó usar PIN';
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  // Métodos de caché y almacenamiento local

  /**
   * Cachear zonas
   */
  async cacheZones(zones) {
    try {
      await AsyncStorage.setItem(this.storageKeys.zones, JSON.stringify(zones));
    } catch (error) {
      console.error('Error al cachear zonas:', error);
    }
  }

  /**
   * Obtener zonas desde caché
   */
  async getCachedZones() {
    try {
      const cached = await AsyncStorage.getItem(this.storageKeys.zones);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Agregar zona al caché
   */
  async addZoneToCache(zone) {
    try {
      const cached = await this.getCachedZones();
      cached.push(zone);
      await this.cacheZones(cached);
    } catch (error) {
      console.error('Error al agregar zona al caché:', error);
    }
  }

  /**
   * Cachear permisos
   */
  async cachePermissions(permissions) {
    try {
      await AsyncStorage.setItem(this.storageKeys.permissions, JSON.stringify(permissions));
    } catch (error) {
      console.error('Error al cachear permisos:', error);
    }
  }

  /**
   * Obtener permisos desde caché
   */
  async getCachedPermissions() {
    try {
      const cached = await AsyncStorage.getItem(this.storageKeys.permissions);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Cachear configuración
   */
  async cacheSettings(settings) {
    try {
      await AsyncStorage.setItem(this.storageKeys.settings, JSON.stringify(settings));
    } catch (error) {
      console.error('Error al cachear configuración:', error);
    }
  }

  /**
   * Agregar a logs de acceso locales
   */
  async addToAccessLogs(logEntry) {
    try {
      const logs = await this.getLocalAccessLogs();
      logs.unshift(logEntry);
      
      // Limitar a 200 entradas
      const limited = logs.slice(0, 200);
      
      await AsyncStorage.setItem(this.storageKeys.recentLogs, JSON.stringify(limited));
    } catch (error) {
      console.error('Error al agregar log de acceso:', error);
    }
  }

  /**
   * Obtener logs de acceso locales
   */
  async getLocalAccessLogs() {
    try {
      const logs = await AsyncStorage.getItem(this.storageKeys.recentLogs);
      return logs ? JSON.parse(logs) : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Verificar alertas de seguridad
   */
  async checkSecurityAlerts(accessAttempt) {
    try {
      const recentLogs = await this.getLocalAccessLogs();
      const recentFailures = recentLogs.filter(
        log => !log.granted && 
        log.userId === accessAttempt.userId &&
        new Date(log.timestamp) > new Date(Date.now() - 10 * 60 * 1000) // Últimos 10 minutos
      );

      // Si hay más de 3 intentos fallidos en 10 minutos, crear alerta
      if (recentFailures.length >= 3) {
        const alert = {
          type: 'multiple_failed_attempts',
          severity: 'high',
          message: 'Múltiples intentos fallidos de acceso detectados',
          userId: accessAttempt.userId,
          zoneId: accessAttempt.zoneId,
          timestamp: new Date().toISOString(),
          attempts: recentFailures.length,
        };

        // Enviar alerta al servidor
        await apiService.post(this.endpoints.alerts, alert);
        
        return alert;
      }
      
      return null;
    } catch (error) {
      console.error('Error al verificar alertas:', error);
      return null;
    }
  }

  /**
   * Obtener información del dispositivo
   */
  async getDeviceInfo() {
    try {
      const { DeviceInfo } = require('react-native-device-info');
      
      return {
        deviceId: await DeviceInfo.getUniqueId(),
        model: await DeviceInfo.getModel(),
        platform: DeviceInfo.getSystemName(),
        version: DeviceInfo.getSystemVersion(),
        appVersion: DeviceInfo.getVersion(),
      };
    } catch (error) {
      return {
        deviceId: 'unknown',
        model: 'unknown',
        platform: 'unknown',
      };
    }
  }

  /**
   * Obtener ubicación actual
   */
  async getCurrentLocation() {
    try {
      // Aquí se implementaría la obtención de ubicación GPS
      // Por ahora retornamos ubicación por defecto
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
   * Verificar permisos de zona
   */
  hasZonePermission(zoneId, userPermissions) {
    return userPermissions.some(permission => 
      permission.zoneId === zoneId && 
      permission.granted &&
      this.isWithinSchedule(permission.schedule)
    );
  }

  /**
   * Verificar si está dentro del horario permitido
   */
  isWithinSchedule(schedule) {
    if (!schedule) return true;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const currentDay = now.getDay();
    
    // Verificar horarios por día
    const daySchedule = schedule.days[currentDay];
    if (!daySchedule || !daySchedule.enabled) return false;
    
    const startTime = this.timeToMinutes(daySchedule.startTime);
    const endTime = this.timeToMinutes(daySchedule.endTime);
    
    return currentTime >= startTime && currentTime <= endTime;
  }

  /**
   * Convertir tiempo a minutos
   */
  timeToMinutes(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }
}

// Exportar instancia singleton
export const accessControlService = new AccessControlService();
export default accessControlService;
