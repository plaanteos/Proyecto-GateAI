/**
 * Access Control Slice - Gestión de control de acceso
 * Manejo del estado de permisos, zonas, horarios y validaciones
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { accessControlService } from '../services/accessControlService';
import { showMessage } from 'react-native-flash-message';

// Estado inicial
const initialState = {
  zones: [],
  permissions: [],
  schedules: [],
  accessLogs: [],
  securityAlerts: [],
  realTimeEvents: [],
  currentZone: null,
  isLoading: false,
  isValidating: false,
  error: null,
  settings: {
    biometricRequired: true,
    cardRequired: false,
    photoRequired: true,
    alertsEnabled: true,
    autoLockTime: 30, // segundos
    maxFailedAttempts: 3,
  },
  validation: {
    currentAttempt: null,
    isScanning: false,
    scanType: null, // 'fingerprint', 'face', 'card', 'qr'
    lastResult: null,
  },
  statistics: {
    totalAccesses: 0,
    successfulAccesses: 0,
    failedAccesses: 0,
    activeZones: 0,
    securityLevel: 'normal', // low, normal, high, critical
  },
};

// Async Thunks para acciones asíncronas

// Obtener zonas de acceso
export const fetchZonesAsync = createAsyncThunk(
  'accessControl/fetchZones',
  async (_, { rejectWithValue }) => {
    try {
      const response = await accessControlService.getZones();
      
      if (response.success) {
        return response.data.zones;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      showMessage({
        message: 'Error al Cargar Zonas',
        description: error.message,
        type: 'danger',
        icon: 'danger',
        duration: 3000,
      });
      return rejectWithValue(error.message);
    }
  }
);

// Validar acceso
export const validateAccessAsync = createAsyncThunk(
  'accessControl/validateAccess',
  async ({ zoneId, biometricData, cardData, userId }, { rejectWithValue }) => {
    try {
      const response = await accessControlService.validateAccess({
        zoneId,
        biometricData,
        cardData,
        userId,
      });
      
      if (response.success) {
        const { access, result } = response.data;
        
        showMessage({
          message: access.granted ? 'Acceso Concedido' : 'Acceso Denegado',
          description: access.granted 
            ? `Bienvenido a ${access.zoneName}` 
            : access.reason || 'No autorizado',
          type: access.granted ? 'success' : 'danger',
          icon: access.granted ? 'success' : 'danger',
          duration: 3000,
        });
        
        return {
          access,
          result,
          timestamp: new Date().toISOString(),
        };
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      showMessage({
        message: 'Error de Validación',
        description: error.message,
        type: 'danger',
        icon: 'danger',
        duration: 4000,
      });
      return rejectWithValue(error.message);
    }
  }
);

// Obtener permisos de usuario
export const fetchPermissionsAsync = createAsyncThunk(
  'accessControl/fetchPermissions',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await accessControlService.getUserPermissions(userId);
      
      if (response.success) {
        return response.data.permissions;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Obtener horarios de acceso
export const fetchSchedulesAsync = createAsyncThunk(
  'accessControl/fetchSchedules',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await accessControlService.getAccessSchedules(userId);
      
      if (response.success) {
        return response.data.schedules;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Obtener logs de acceso
export const fetchAccessLogsAsync = createAsyncThunk(
  'accessControl/fetchAccessLogs',
  async ({ filters, page = 1 }, { rejectWithValue }) => {
    try {
      const response = await accessControlService.getAccessLogs(filters, page);
      
      if (response.success) {
        return response.data.logs;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Obtener alertas de seguridad
export const fetchSecurityAlertsAsync = createAsyncThunk(
  'accessControl/fetchSecurityAlerts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await accessControlService.getSecurityAlerts();
      
      if (response.success) {
        return response.data.alerts;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Crear nueva zona
export const createZoneAsync = createAsyncThunk(
  'accessControl/createZone',
  async (zoneData, { rejectWithValue }) => {
    try {
      const response = await accessControlService.createZone(zoneData);
      
      if (response.success) {
        showMessage({
          message: 'Zona Creada',
          description: `Zona "${zoneData.name}" creada exitosamente`,
          type: 'success',
          icon: 'success',
          duration: 3000,
        });
        
        return response.data.zone;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      showMessage({
        message: 'Error al Crear Zona',
        description: error.message,
        type: 'danger',
        icon: 'danger',
        duration: 4000,
      });
      return rejectWithValue(error.message);
    }
  }
);

// Actualizar configuración de seguridad
export const updateSecuritySettingsAsync = createAsyncThunk(
  'accessControl/updateSecuritySettings',
  async (settings, { rejectWithValue }) => {
    try {
      const response = await accessControlService.updateSecuritySettings(settings);
      
      if (response.success) {
        showMessage({
          message: 'Configuración Actualizada',
          description: 'Los ajustes de seguridad han sido guardados',
          type: 'success',
          icon: 'success',
          duration: 3000,
        });
        
        return response.data.settings;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      showMessage({
        message: 'Error al Actualizar',
        description: error.message,
        type: 'danger',
        icon: 'danger',
        duration: 4000,
      });
      return rejectWithValue(error.message);
    }
  }
);

// Slice
const accessControlSlice = createSlice({
  name: 'accessControl',
  initialState,
  reducers: {
    // Limpiar errores
    clearError: (state) => {
      state.error = null;
    },
    
    // Establecer zona actual
    setCurrentZone: (state, action) => {
      state.currentZone = action.payload;
    },
    
    // Iniciar escaneo biométrico
    startScan: (state, action) => {
      state.validation.isScanning = true;
      state.validation.scanType = action.payload.type;
      state.validation.currentAttempt = {
        zoneId: action.payload.zoneId,
        startTime: new Date().toISOString(),
        attempts: 0,
      };
    },
    
    // Detener escaneo
    stopScan: (state) => {
      state.validation.isScanning = false;
      state.validation.scanType = null;
      state.validation.currentAttempt = null;
    },
    
    // Agregar evento en tiempo real
    addRealTimeEvent: (state, action) => {
      state.realTimeEvents.unshift(action.payload);
      
      // Limitar a 100 eventos
      if (state.realTimeEvents.length > 100) {
        state.realTimeEvents = state.realTimeEvents.slice(0, 100);
      }
    },
    
    // Agregar alerta de seguridad
    addSecurityAlert: (state, action) => {
      state.securityAlerts.unshift({
        ...action.payload,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        read: false,
      });
      
      // Mostrar notificación
      showMessage({
        message: 'Alerta de Seguridad',
        description: action.payload.message,
        type: 'warning',
        icon: 'warning',
        duration: 5000,
      });
    },
    
    // Marcar alerta como leída
    markAlertAsRead: (state, action) => {
      const alert = state.securityAlerts.find(a => a.id === action.payload);
      if (alert) {
        alert.read = true;
      }
    },
    
    // Actualizar configuración local
    updateSettingsLocal: (state, action) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    
    // Actualizar estadísticas
    updateStatistics: (state, action) => {
      state.statistics = { ...state.statistics, ...action.payload };
    },
    
    // Limpiar logs de acceso
    clearAccessLogs: (state) => {
      state.accessLogs = [];
    },
    
    // Reset access control state
    resetAccessControlState: () => initialState,
  },
  extraReducers: (builder) => {
    // Fetch zones
    builder
      .addCase(fetchZonesAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchZonesAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.zones = action.payload;
        state.statistics.activeZones = action.payload.filter(z => z.active).length;
        state.error = null;
      })
      .addCase(fetchZonesAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Validate access
    builder
      .addCase(validateAccessAsync.pending, (state) => {
        state.isValidating = true;
        state.error = null;
        
        if (state.validation.currentAttempt) {
          state.validation.currentAttempt.attempts += 1;
        }
      })
      .addCase(validateAccessAsync.fulfilled, (state, action) => {
        state.isValidating = false;
        state.validation.isScanning = false;
        state.validation.lastResult = action.payload;
        
        // Agregar a logs de acceso
        state.accessLogs.unshift({
          ...action.payload.access,
          timestamp: action.payload.timestamp,
        });
        
        // Actualizar estadísticas
        state.statistics.totalAccesses += 1;
        if (action.payload.access.granted) {
          state.statistics.successfulAccesses += 1;
        } else {
          state.statistics.failedAccesses += 1;
        }
        
        // Agregar evento en tiempo real
        state.realTimeEvents.unshift({
          type: 'access_attempt',
          data: action.payload,
          timestamp: action.payload.timestamp,
        });
        
        // Verificar alertas de seguridad
        if (!action.payload.access.granted) {
          const failedAttempts = state.validation.currentAttempt?.attempts || 0;
          if (failedAttempts >= state.settings.maxFailedAttempts) {
            state.securityAlerts.unshift({
              id: Date.now().toString(),
              type: 'multiple_failed_attempts',
              message: 'Múltiples intentos fallidos de acceso detectados',
              severity: 'high',
              zoneId: action.payload.access.zoneId,
              timestamp: new Date().toISOString(),
              read: false,
            });
          }
        }
        
        state.validation.currentAttempt = null;
        state.error = null;
      })
      .addCase(validateAccessAsync.rejected, (state, action) => {
        state.isValidating = false;
        state.validation.isScanning = false;
        state.error = action.payload;
        
        // Agregar a estadísticas de fallos
        state.statistics.failedAccesses += 1;
      });

    // Fetch permissions
    builder
      .addCase(fetchPermissionsAsync.fulfilled, (state, action) => {
        state.permissions = action.payload;
      })
      .addCase(fetchPermissionsAsync.rejected, (state, action) => {
        state.error = action.payload;
      });

    // Fetch schedules
    builder
      .addCase(fetchSchedulesAsync.fulfilled, (state, action) => {
        state.schedules = action.payload;
      })
      .addCase(fetchSchedulesAsync.rejected, (state, action) => {
        state.error = action.payload;
      });

    // Fetch access logs
    builder
      .addCase(fetchAccessLogsAsync.fulfilled, (state, action) => {
        state.accessLogs = action.payload;
      })
      .addCase(fetchAccessLogsAsync.rejected, (state, action) => {
        state.error = action.payload;
      });

    // Fetch security alerts
    builder
      .addCase(fetchSecurityAlertsAsync.fulfilled, (state, action) => {
        state.securityAlerts = action.payload;
      })
      .addCase(fetchSecurityAlertsAsync.rejected, (state, action) => {
        state.error = action.payload;
      });

    // Create zone
    builder
      .addCase(createZoneAsync.fulfilled, (state, action) => {
        state.zones.push(action.payload);
        if (action.payload.active) {
          state.statistics.activeZones += 1;
        }
      })
      .addCase(createZoneAsync.rejected, (state, action) => {
        state.error = action.payload;
      });

    // Update security settings
    builder
      .addCase(updateSecuritySettingsAsync.fulfilled, (state, action) => {
        state.settings = { ...state.settings, ...action.payload };
      })
      .addCase(updateSecuritySettingsAsync.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

// Exportar actions
export const {
  clearError,
  setCurrentZone,
  startScan,
  stopScan,
  addRealTimeEvent,
  addSecurityAlert,
  markAlertAsRead,
  updateSettingsLocal,
  updateStatistics,
  clearAccessLogs,
  resetAccessControlState,
} = accessControlSlice.actions;

// Selectores
export const selectAccessControl = (state) => state.accessControl;
export const selectZones = (state) => state.accessControl.zones;
export const selectCurrentZone = (state) => state.accessControl.currentZone;
export const selectPermissions = (state) => state.accessControl.permissions;
export const selectSchedules = (state) => state.accessControl.schedules;
export const selectAccessLogs = (state) => state.accessControl.accessLogs;
export const selectSecurityAlerts = (state) => state.accessControl.securityAlerts;
export const selectRealTimeEvents = (state) => state.accessControl.realTimeEvents;
export const selectAccessControlLoading = (state) => state.accessControl.isLoading;
export const selectIsValidating = (state) => state.accessControl.isValidating;
export const selectAccessControlError = (state) => state.accessControl.error;
export const selectSecuritySettings = (state) => state.accessControl.settings;
export const selectValidation = (state) => state.accessControl.validation;
export const selectAccessStatistics = (state) => state.accessControl.statistics;

export default accessControlSlice.reducer;
