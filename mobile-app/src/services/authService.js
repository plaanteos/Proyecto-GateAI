/**
 * Auth Service - Servicio de autenticación
 * Manejo de login, registro, biometría y gestión de tokens
 */

import apiService from './apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TouchID from 'react-native-touch-id';
import { Platform } from 'react-native';

// Configuración de Touch ID / Face ID
const biometricOptions = {
  title: 'Autenticación Biométrica',
  subtitle: 'Usa tu huella o Face ID para acceder',
  description: 'Coloca tu dedo en el sensor o mira la cámara',
  fallbackLabel: 'Usar contraseña',
  cancelLabel: 'Cancelar',
  showFallback: true,
  disableVibration: false,
  ...(Platform.OS === 'android' && {
    color: '#1976d2',
    imageColor: '#1976d2',
    imageErrorColor: '#ff0000',
  }),
};

class AuthService {
  constructor() {
    this.endpoints = {
      login: '/auth/login',
      register: '/auth/register',
      logout: '/auth/logout',
      refresh: '/auth/refresh',
      verify: '/auth/verify',
      biometric: '/auth/biometric',
      forgot: '/auth/forgot-password',
      reset: '/auth/reset-password',
      profile: '/auth/profile',
    };
    
    this.storageKeys = {
      token: '@auth_token',
      refreshToken: '@refresh_token',
      user: '@user_data',
      biometricEnabled: '@biometric_enabled',
      lastLogin: '@last_login',
    };
  }

  /**
   * Login con email y contraseña
   */
  async login(email, password) {
    try {
      console.log('🔐 Iniciando login:', { email });

      const response = await apiService.post(this.endpoints.login, {
        email: email.toLowerCase().trim(),
        password,
        deviceInfo: await this.getDeviceInfo(),
      });

      if (response.success) {
        const { user, token, refreshToken } = response.data;
        
        // Guardar datos de autenticación
        await this.saveAuthData(user, token, refreshToken);
        
        // Configurar token en API service
        await apiService.setAuthToken(token);
        
        console.log('✅ Login exitoso para:', user.email);
        
        return {
          success: true,
          user,
          token,
          refreshToken,
          message: 'Login exitoso',
        };
      } else {
        throw new Error(response.error || 'Error de autenticación');
      }
    } catch (error) {
      console.error('❌ Error en login:', error);
      return {
        success: false,
        error: error.message,
        message: 'Credenciales inválidas',
      };
    }
  }

  /**
   * Registro de nuevo usuario
   */
  async register(userData) {
    try {
      console.log('📝 Registrando usuario:', userData.email);

      const response = await apiService.post(this.endpoints.register, {
        ...userData,
        email: userData.email.toLowerCase().trim(),
        deviceInfo: await this.getDeviceInfo(),
      });

      if (response.success) {
        const { user, token, refreshToken } = response.data;
        
        // Guardar datos de autenticación
        await this.saveAuthData(user, token, refreshToken);
        
        // Configurar token en API service
        await apiService.setAuthToken(token);
        
        console.log('✅ Registro exitoso para:', user.email);
        
        return {
          success: true,
          user,
          token,
          refreshToken,
          message: 'Registro exitoso',
        };
      } else {
        throw new Error(response.error || 'Error en el registro');
      }
    } catch (error) {
      console.error('❌ Error en registro:', error);
      return {
        success: false,
        error: error.message,
        message: 'Error al crear la cuenta',
      };
    }
  }

  /**
   * Login biométrico
   */
  async biometricLogin() {
    try {
      console.log('👆 Iniciando autenticación biométrica');

      // Verificar si la biometría está habilitada
      const biometricEnabled = await AsyncStorage.getItem(this.storageKeys.biometricEnabled);
      if (!biometricEnabled) {
        throw new Error('Autenticación biométrica no habilitada');
      }

      // Verificar disponibilidad de biometría
      const biometryType = await TouchID.isSupported();
      if (!biometryType) {
        throw new Error('Biometría no disponible en este dispositivo');
      }

      // Obtener datos de usuario almacenados
      const storedUser = await AsyncStorage.getItem(this.storageKeys.user);
      if (!storedUser) {
        throw new Error('No hay datos de usuario para autenticación biométrica');
      }

      // Solicitar autenticación biométrica
      await TouchID.authenticate('Acceso a UnionTech', biometricOptions);

      // Enviar datos biométricos al servidor
      const response = await apiService.post(this.endpoints.biometric, {
        userId: JSON.parse(storedUser).id,
        biometryType,
        deviceInfo: await this.getDeviceInfo(),
      });

      if (response.success) {
        const { user, token, refreshToken } = response.data;
        
        // Actualizar datos de autenticación
        await this.saveAuthData(user, token, refreshToken);
        
        // Configurar token en API service
        await apiService.setAuthToken(token);
        
        console.log('✅ Autenticación biométrica exitosa');
        
        return {
          success: true,
          user,
          token,
          refreshToken,
          message: 'Autenticación biométrica exitosa',
        };
      } else {
        throw new Error(response.error || 'Error en autenticación biométrica');
      }
    } catch (error) {
      console.error('❌ Error en autenticación biométrica:', error);
      
      let errorMessage = 'Error en autenticación biométrica';
      if (error.message === 'UserCancel') {
        errorMessage = 'Autenticación cancelada por el usuario';
      } else if (error.message === 'UserFallback') {
        errorMessage = 'Usuario seleccionó usar contraseña';
      } else if (error.message === 'SystemCancel') {
        errorMessage = 'Autenticación cancelada por el sistema';
      }
      
      return {
        success: false,
        error: error.message,
        message: errorMessage,
      };
    }
  }

  /**
   * Logout
   */
  async logout(token) {
    try {
      console.log('🚪 Cerrando sesión');

      // Intentar notificar al servidor
      if (token) {
        await apiService.post(this.endpoints.logout, { token });
      }

      // Limpiar datos locales
      await this.clearAuthData();
      
      // Limpiar token del API service
      await apiService.setAuthToken(null);
      
      console.log('✅ Sesión cerrada exitosamente');
      
      return {
        success: true,
        message: 'Sesión cerrada exitosamente',
      };
    } catch (error) {
      console.error('❌ Error en logout:', error);
      
      // Incluso si hay error, limpiar datos localmente
      await this.clearAuthData();
      await apiService.setAuthToken(null);
      
      return {
        success: true,
        message: 'Sesión cerrada localmente',
      };
    }
  }

  /**
   * Refresh token
   */
  async refreshToken(refreshToken) {
    try {
      console.log('🔄 Renovando token');

      const response = await apiService.post(this.endpoints.refresh, {
        refreshToken,
      });

      if (response.success) {
        const { token, refreshToken: newRefreshToken } = response.data;
        
        // Actualizar tokens
        await AsyncStorage.setItem(this.storageKeys.token, token);
        await AsyncStorage.setItem(this.storageKeys.refreshToken, newRefreshToken);
        
        // Configurar nuevo token en API service
        await apiService.setAuthToken(token);
        
        console.log('✅ Token renovado exitosamente');
        
        return {
          success: true,
          token,
          refreshToken: newRefreshToken,
        };
      } else {
        throw new Error(response.error || 'Error al renovar token');
      }
    } catch (error) {
      console.error('❌ Error al renovar token:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Verificar token
   */
  async verifyToken(token) {
    try {
      const response = await apiService.get(this.endpoints.verify);
      
      if (response.success) {
        const { user } = response.data;
        
        // Actualizar datos de usuario
        await AsyncStorage.setItem(this.storageKeys.user, JSON.stringify(user));
        
        return {
          success: true,
          user,
          isValid: true,
        };
      } else {
        throw new Error(response.error || 'Token inválido');
      }
    } catch (error) {
      console.error('❌ Error al verificar token:', error);
      return {
        success: false,
        error: error.message,
        isValid: false,
      };
    }
  }

  /**
   * Recuperar contraseña
   */
  async forgotPassword(email) {
    try {
      const response = await apiService.post(this.endpoints.forgot, {
        email: email.toLowerCase().trim(),
      });

      return {
        success: response.success,
        message: response.success 
          ? 'Instrucciones enviadas a tu email' 
          : response.error,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Resetear contraseña
   */
  async resetPassword(token, newPassword) {
    try {
      const response = await apiService.post(this.endpoints.reset, {
        token,
        password: newPassword,
      });

      return {
        success: response.success,
        message: response.success 
          ? 'Contraseña actualizada exitosamente' 
          : response.error,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Habilitar/Deshabilitar autenticación biométrica
   */
  async setBiometricEnabled(enabled) {
    try {
      if (enabled) {
        // Verificar disponibilidad
        const biometryType = await TouchID.isSupported();
        if (!biometryType) {
          throw new Error('Biometría no disponible');
        }

        // Solicitar autenticación para habilitar
        await TouchID.authenticate('Habilitar autenticación biométrica', biometricOptions);
      }

      await AsyncStorage.setItem(this.storageKeys.biometricEnabled, enabled.toString());
      
      return {
        success: true,
        enabled,
        message: enabled 
          ? 'Autenticación biométrica habilitada' 
          : 'Autenticación biométrica deshabilitada',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Verificar si la biometría está habilitada
   */
  async isBiometricEnabled() {
    try {
      const enabled = await AsyncStorage.getItem(this.storageKeys.biometricEnabled);
      return enabled === 'true';
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtener tipo de biometría disponible
   */
  async getBiometryType() {
    try {
      return await TouchID.isSupported();
    } catch (error) {
      return null;
    }
  }

  /**
   * Guardar datos de autenticación
   */
  async saveAuthData(user, token, refreshToken) {
    try {
      await Promise.all([
        AsyncStorage.setItem(this.storageKeys.user, JSON.stringify(user)),
        AsyncStorage.setItem(this.storageKeys.token, token),
        AsyncStorage.setItem(this.storageKeys.refreshToken, refreshToken),
        AsyncStorage.setItem(this.storageKeys.lastLogin, new Date().toISOString()),
      ]);
    } catch (error) {
      console.error('Error al guardar datos de auth:', error);
    }
  }

  /**
   * Limpiar datos de autenticación
   */
  async clearAuthData() {
    try {
      await Promise.all([
        AsyncStorage.removeItem(this.storageKeys.user),
        AsyncStorage.removeItem(this.storageKeys.token),
        AsyncStorage.removeItem(this.storageKeys.refreshToken),
        AsyncStorage.removeItem(this.storageKeys.lastLogin),
      ]);
    } catch (error) {
      console.error('Error al limpiar datos de auth:', error);
    }
  }

  /**
   * Obtener datos de usuario almacenados
   */
  async getStoredUser() {
    try {
      const userData = await AsyncStorage.getItem(this.storageKeys.user);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Obtener información del dispositivo
   */
  async getDeviceInfo() {
    const { DeviceInfo } = require('react-native');
    
    try {
      return {
        platform: Platform.OS,
        version: Platform.Version,
        model: await DeviceInfo.getModel(),
        uniqueId: await DeviceInfo.getUniqueId(),
        appVersion: DeviceInfo.getVersion(),
        buildNumber: DeviceInfo.getBuildNumber(),
      };
    } catch (error) {
      return {
        platform: Platform.OS,
        version: Platform.Version,
      };
    }
  }

  /**
   * Verificar si el usuario está autenticado
   */
  async isAuthenticated() {
    try {
      const token = await AsyncStorage.getItem(this.storageKeys.token);
      const user = await AsyncStorage.getItem(this.storageKeys.user);
      
      return !!(token && user);
    } catch (error) {
      return false;
    }
  }
}

// Exportar instancia singleton
export const authService = new AuthService();
export default authService;
