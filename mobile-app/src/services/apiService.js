/**
 * API Service - Configuración base para comunicación con el backend
 * Manejo centralizado de peticiones HTTP y configuración de endpoints
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { showMessage } from 'react-native-flash-message';

// Configuración base de la API
const API_CONFIG = {
  baseURL: 'http://localhost:3000/api', // URL del backend UnionTech
  timeout: 10000, // 10 segundos
  retries: 3,
  retryDelay: 1000, // 1 segundo
};

// Headers por defecto
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'X-Client-Type': 'mobile-app',
  'X-Client-Version': '1.0.0',
};

/**
 * Clase principal para manejo de API
 */
class APIService {
  constructor() {
    this.baseURL = API_CONFIG.baseURL;
    this.timeout = API_CONFIG.timeout;
    this.defaultHeaders = DEFAULT_HEADERS;
    this.interceptors = {
      request: [],
      response: [],
    };
  }

  /**
   * Configurar token de autorización
   */
  async setAuthToken(token) {
    if (token) {
      this.defaultHeaders['Authorization'] = `Bearer ${token}`;
      await AsyncStorage.setItem('@auth_token', token);
    } else {
      delete this.defaultHeaders['Authorization'];
      await AsyncStorage.removeItem('@auth_token');
    }
  }

  /**
   * Obtener token almacenado
   */
  async getStoredToken() {
    try {
      const token = await AsyncStorage.getItem('@auth_token');
      if (token) {
        this.defaultHeaders['Authorization'] = `Bearer ${token}`;
      }
      return token;
    } catch (error) {
      console.error('Error al obtener token:', error);
      return null;
    }
  }

  /**
   * Interceptor para peticiones
   */
  addRequestInterceptor(interceptor) {
    this.interceptors.request.push(interceptor);
  }

  /**
   * Interceptor para respuestas
   */
  addResponseInterceptor(interceptor) {
    this.interceptors.response.push(interceptor);
  }

  /**
   * Aplicar interceptores de petición
   */
  async applyRequestInterceptors(config) {
    let modifiedConfig = { ...config };
    
    for (const interceptor of this.interceptors.request) {
      modifiedConfig = await interceptor(modifiedConfig);
    }
    
    return modifiedConfig;
  }

  /**
   * Aplicar interceptores de respuesta
   */
  async applyResponseInterceptors(response, config) {
    let modifiedResponse = response;
    
    for (const interceptor of this.interceptors.response) {
      modifiedResponse = await interceptor(modifiedResponse, config);
    }
    
    return modifiedResponse;
  }

  /**
   * Realizar petición HTTP con reintentos
   */
  async makeRequest(endpoint, options = {}) {
    const config = {
      method: 'GET',
      headers: { ...this.defaultHeaders },
      timeout: this.timeout,
      ...options,
    };

    // Aplicar interceptores de petición
    const finalConfig = await this.applyRequestInterceptors(config);

    const url = `${this.baseURL}${endpoint}`;
    
    // Función para realizar la petición
    const attemptRequest = async (attempt = 1) => {
      try {
        console.log(`🔄 API Request [${attempt}/${API_CONFIG.retries}]:`, {
          method: finalConfig.method,
          url,
          headers: finalConfig.headers,
        });

        // Crear AbortController para timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), finalConfig.timeout);

        const fetchOptions = {
          method: finalConfig.method,
          headers: finalConfig.headers,
          signal: controller.signal,
        };

        // Agregar body si no es GET
        if (finalConfig.method !== 'GET' && finalConfig.body) {
          fetchOptions.body = typeof finalConfig.body === 'string' 
            ? finalConfig.body 
            : JSON.stringify(finalConfig.body);
        }

        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);

        // Verificar si la respuesta es exitosa
        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }

        // Parsear respuesta JSON
        const data = await response.json();

        console.log('✅ API Response:', {
          status: response.status,
          data: data,
        });

        // Aplicar interceptores de respuesta
        const finalResponse = await this.applyResponseInterceptors(data, finalConfig);

        return {
          success: true,
          data: finalResponse,
          status: response.status,
          headers: response.headers,
        };

      } catch (error) {
        console.error(`❌ API Error [${attempt}/${API_CONFIG.retries}]:`, error);

        // Si es el último intento o error no reintentable, lanzar error
        if (attempt >= API_CONFIG.retries || this.isNonRetryableError(error)) {
          return {
            success: false,
            error: error.message,
            status: error.status || 0,
            attempt,
          };
        }

        // Esperar antes del siguiente intento
        await this.delay(API_CONFIG.retryDelay * attempt);
        return attemptRequest(attempt + 1);
      }
    };

    return attemptRequest();
  }

  /**
   * Verificar si el error no debe reintentarse
   */
  isNonRetryableError(error) {
    const nonRetryableErrors = [
      'AbortError', // Timeout
      '400', '401', '403', '404', // Errores del cliente
    ];

    return nonRetryableErrors.some(errorType => 
      error.message.includes(errorType) || 
      error.status?.toString() === errorType
    );
  }

  /**
   * Utilidad para delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * GET request
   */
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    
    return this.makeRequest(url, {
      method: 'GET',
    });
  }

  /**
   * POST request
   */
  async post(endpoint, data = {}) {
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: data,
    });
  }

  /**
   * PUT request
   */
  async put(endpoint, data = {}) {
    return this.makeRequest(endpoint, {
      method: 'PUT',
      body: data,
    });
  }

  /**
   * PATCH request
   */
  async patch(endpoint, data = {}) {
    return this.makeRequest(endpoint, {
      method: 'PATCH',
      body: data,
    });
  }

  /**
   * DELETE request
   */
  async delete(endpoint) {
    return this.makeRequest(endpoint, {
      method: 'DELETE',
    });
  }

  /**
   * Upload de archivos
   */
  async upload(endpoint, file, additionalData = {}) {
    const formData = new FormData();
    
    // Agregar archivo
    formData.append('file', {
      uri: file.uri,
      type: file.type || 'image/jpeg',
      name: file.name || 'file.jpg',
    });

    // Agregar datos adicionales
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key]);
    });

    return this.makeRequest(endpoint, {
      method: 'POST',
      headers: {
        ...this.defaultHeaders,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });
  }

  /**
   * Health check de la API
   */
  async healthCheck() {
    try {
      const response = await this.get('/health');
      return response.success;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  /**
   * Manejo de errores de red
   */
  handleNetworkError(error) {
    let userMessage = 'Error de conexión';
    
    if (error.message.includes('Network request failed')) {
      userMessage = 'Sin conexión a internet';
    } else if (error.message.includes('timeout')) {
      userMessage = 'La petición tardó demasiado';
    } else if (error.message.includes('AbortError')) {
      userMessage = 'La petición fue cancelada';
    }

    showMessage({
      message: 'Error de Red',
      description: userMessage,
      type: 'danger',
      icon: 'danger',
      duration: 4000,
    });

    return {
      success: false,
      error: userMessage,
      originalError: error,
    };
  }
}

// Crear instancia singleton
const apiService = new APIService();

// Configurar interceptores por defecto
apiService.addRequestInterceptor(async (config) => {
  // Agregar timestamp a las peticiones
  config.headers['X-Request-Time'] = new Date().toISOString();
  return config;
});

apiService.addResponseInterceptor(async (response, config) => {
  // Log de respuestas para debugging
  if (__DEV__) {
    console.log('📱 Mobile API Response:', {
      endpoint: config.url,
      method: config.method,
      response,
    });
  }
  
  return response;
});

// Inicializar token almacenado al arrancar
apiService.getStoredToken();

export default apiService;
