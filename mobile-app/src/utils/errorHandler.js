/**
 * Global Error Handler
 * Manejo centralizado de errores para la aplicación
 */

import { showMessage } from 'react-native-flash-message';
import crashlytics from '@react-native-firebase/crashlytics';

// Types
/**
 * @typedef {Object} ErrorInfo
 * @property {string} message - Error message
 * @property {string} [stack] - Error stack trace
 * @property {string} [componentStack] - React component stack trace
 * @property {('low'|'medium'|'high'|'critical')} [severity] - Error severity level
 * @property {*} [context] - Additional error context
 */

/**
 * Setup global error handlers
 */
export const setupGlobalErrorHandler = () => {
  // Global JavaScript error handler
  const originalHandler = ErrorUtils.getGlobalHandler();
  
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    console.error('Global Error:', error);
    
    // Log to crash reporting service
    if (crashlytics) {
      crashlytics().recordError(error);
    }
    
    // Show user-friendly message for fatal errors
    if (isFatal) {
      showMessage({
        message: 'Error Crítico',
        description: 'La aplicación ha encontrado un error crítico. Por favor, reinicia la app.',
        type: 'danger',
        duration: 8000,
      });
    }
    
    // Call original handler
    originalHandler(error, isFatal);
  });

  // Unhandled promise rejection handler
  const rejectionTracking = require('react-native/Libraries/Promise');
  rejectionTracking.setUnhandledPromiseRejectionTracker((id, rejection) => {
    console.error('Unhandled Promise Rejection:', rejection);
    
    if (crashlytics) {
      crashlytics().log('Unhandled Promise Rejection');
      crashlytics().recordError(new Error(rejection));
    }
  });
};

/**
 * Log error to analytics and crash reporting
 */
export const logError = (error, context) => {
  const errorObj = typeof error === 'string' ? new Error(error) : error;
  
  console.error('Logged Error:', errorObj, context);
  
  if (crashlytics) {
    if (context) {
      crashlytics().setAttributes(context);
    }
    crashlytics().recordError(errorObj);
  }
};

/**
 * Log non-fatal error with additional context
 */
export const logNonFatalError = (error, severity = 'medium', context) => {
  const errorObj = typeof error === 'string' ? new Error(error) : error;
  
  console.warn(`Non-fatal Error (${severity}):`, errorObj, context);
  
  if (crashlytics) {
    crashlytics().setAttribute('severity', severity);
    if (context) {
      crashlytics().setAttributes(context);
    }
    crashlytics().log(`Non-fatal error: ${errorObj.message}`);
  }
};

/**
 * Show user-friendly error message
 */
export const showErrorMessage = (title, message, duration = 4000) => {
  showMessage({
    message: title,
    description: message,
    type: 'danger',
    duration,
    floating: true,
  });
};

/**
 * Show success message
 */
export const showSuccessMessage = (title, message, duration = 3000) => {
  showMessage({
    message: title,
    description: message,
    type: 'success',
    duration,
    floating: true,
  });
};

/**
 * Show warning message
 */
export const showWarningMessage = (title, message, duration = 4000) => {
  showMessage({
    message: title,
    description: message,
    type: 'warning',
    duration,
    floating: true,
  });
};

/**
 * Show info message
 */
export const showInfoMessage = (title, message, duration = 3000) => {
  showMessage({
    message: title,
    description: message,
    type: 'info',
    duration,
    floating: true,
  });
};

/**
 * Handle API errors and show appropriate messages
 */
export const handleApiError = (error, defaultMessage = 'Error en la operación') => {
  let title = 'Error';
  let message = defaultMessage;
  
  if (error?.response) {
    // Server responded with error status
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        title = 'Datos Inválidos';
        message = data?.message || 'Los datos proporcionados no son válidos';
        break;
      case 401:
        title = 'No Autorizado';
        message = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente';
        break;
      case 403:
        title = 'Acceso Denegado';
        message = 'No tienes permisos para realizar esta acción';
        break;
      case 404:
        title = 'No Encontrado';
        message = 'El recurso solicitado no fue encontrado';
        break;
      case 422:
        title = 'Error de Validación';
        message = data?.message || 'Error en la validación de datos';
        break;
      case 500:
        title = 'Error del Servidor';
        message = 'Error interno del servidor. Intenta nuevamente más tarde';
        break;
      case 503:
        title = 'Servicio No Disponible';
        message = 'El servicio no está disponible temporalmente';
        break;
      default:
        title = 'Error de Conexión';
        message = data?.message || defaultMessage;
    }
  } else if (error?.request) {
    // Network error
    title = 'Error de Red';
    message = 'No se pudo conectar al servidor. Verifica tu conexión a internet';
  } else {
    // Other error
    title = 'Error';
    message = error?.message || defaultMessage;
  }
  
  // Log error for debugging
  logNonFatalError(error, 'medium', { title, message });
  
  // Show user message
  showErrorMessage(title, message);
  
  return { title, message };
};

/**
 * Validation error handler
 */
export const handleValidationError = (errors) => {
  if (Array.isArray(errors)) {
    // Multiple validation errors
    const firstError = errors[0];
    showErrorMessage('Error de Validación', firstError.message || firstError);
  } else if (typeof errors === 'object') {
    // Object with field errors
    const firstField = Object.keys(errors)[0];
    const firstError = errors[firstField];
    showErrorMessage('Error de Validación', Array.isArray(firstError) ? firstError[0] : firstError);
  } else {
    // Single error message
    showErrorMessage('Error de Validación', errors);
  }
};

/**
 * Biometric error handler
 */
export const handleBiometricError = (error) => {
  let title = 'Error Biométrico';
  let message = 'Error en la autenticación biométrica';
  
  switch (error.code) {
    case 'UserCancel':
      title = 'Cancelado por Usuario';
      message = 'La autenticación biométrica fue cancelada';
      break;
    case 'UserFallback':
      title = 'Método Alternativo';
      message = 'Se seleccionó método de autenticación alternativo';
      break;
    case 'BiometryNotAvailable':
      title = 'Biometría No Disponible';
      message = 'La autenticación biométrica no está disponible en este dispositivo';
      break;
    case 'BiometryNotEnrolled':
      title = 'Biometría No Configurada';
      message = 'No hay datos biométricos registrados en el dispositivo';
      break;
    case 'BiometryLockout':
      title = 'Biometría Bloqueada';
      message = 'La autenticación biométrica está temporalmente bloqueada';
      break;
    default:
      message = error.message || message;
  }
  
  logNonFatalError(error, 'low', { biometricError: true });
  showErrorMessage(title, message);
};

export default {
  setupGlobalErrorHandler,
  logError,
  logNonFatalError,
  showErrorMessage,
  showSuccessMessage,
  showWarningMessage,
  showInfoMessage,
  handleApiError,
  handleValidationError,
  handleBiometricError,
};
