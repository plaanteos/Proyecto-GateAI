/**
 * Auth Slice - Gestión de autenticación
 * Manejo del estado de login, logout y tokens
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../services/authService';
import { showMessage } from 'react-native-flash-message';

// Estado inicial
const initialState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  lastLoginTime: null,
  biometricEnabled: false,
  rememberMe: false,
};

// Async Thunks para acciones asíncronas

// Login con email y contraseña
export const loginAsync = createAsyncThunk(
  'auth/login',
  async ({ email, password, rememberMe }, { rejectWithValue }) => {
    try {
      const response = await authService.login(email, password);
      
      if (response.success) {
        showMessage({
          message: 'Login Exitoso',
          description: `Bienvenido ${response.user.name}`,
          type: 'success',
          icon: 'success',
          duration: 3000,
        });
        
        return {
          user: response.user,
          token: response.token,
          refreshToken: response.refreshToken,
          rememberMe,
          lastLoginTime: new Date().toISOString(),
        };
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      showMessage({
        message: 'Error de Login',
        description: error.message || 'Credenciales inválidas',
        type: 'danger',
        icon: 'danger',
        duration: 4000,
      });
      return rejectWithValue(error.message);
    }
  }
);

// Login biométrico
export const biometricLoginAsync = createAsyncThunk(
  'auth/biometricLogin',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.biometricLogin();
      
      if (response.success) {
        showMessage({
          message: 'Acceso Biométrico Exitoso',
          description: 'Autenticación completada',
          type: 'success',
          icon: 'success',
          duration: 2000,
        });
        
        return {
          user: response.user,
          token: response.token,
          refreshToken: response.refreshToken,
          lastLoginTime: new Date().toISOString(),
        };
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      showMessage({
        message: 'Error de Autenticación Biométrica',
        description: error.message,
        type: 'danger',
        icon: 'danger',
        duration: 4000,
      });
      return rejectWithValue(error.message);
    }
  }
);

// Registro de usuario
export const registerAsync = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authService.register(userData);
      
      if (response.success) {
        showMessage({
          message: 'Registro Exitoso',
          description: 'Cuenta creada correctamente',
          type: 'success',
          icon: 'success',
          duration: 3000,
        });
        
        return {
          user: response.user,
          token: response.token,
          refreshToken: response.refreshToken,
          lastLoginTime: new Date().toISOString(),
        };
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      showMessage({
        message: 'Error de Registro',
        description: error.message,
        type: 'danger',
        icon: 'danger',
        duration: 4000,
      });
      return rejectWithValue(error.message);
    }
  }
);

// Refresh token
export const refreshTokenAsync = createAsyncThunk(
  'auth/refreshToken',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await authService.refreshToken(auth.refreshToken);
      
      if (response.success) {
        return {
          token: response.token,
          refreshToken: response.refreshToken,
        };
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Logout
export const logoutAsync = createAsyncThunk(
  'auth/logout',
  async (_, { getState }) => {
    try {
      const { auth } = getState();
      await authService.logout(auth.token);
      
      showMessage({
        message: 'Sesión Cerrada',
        description: 'Has cerrado sesión correctamente',
        type: 'info',
        icon: 'info',
        duration: 2000,
      });
      
      return true;
    } catch (error) {
      // Incluso si hay error, cerrar sesión localmente
      return true;
    }
  }
);

// Verificar token
export const verifyTokenAsync = createAsyncThunk(
  'auth/verifyToken',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      if (!auth.token) {
        throw new Error('No token available');
      }
      
      const response = await authService.verifyToken(auth.token);
      
      if (response.success) {
        return {
          user: response.user,
          isValid: true,
        };
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Limpiar errores
    clearError: (state) => {
      state.error = null;
    },
    
    // Actualizar información del usuario
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
    
    // Habilitar/deshabilitar biometría
    setBiometricEnabled: (state, action) => {
      state.biometricEnabled = action.payload;
    },
    
    // Establecer remember me
    setRememberMe: (state, action) => {
      state.rememberMe = action.payload;
    },
    
    // Reset auth state
    resetAuthState: () => initialState,
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.rememberMe = action.payload.rememberMe;
        state.lastLoginTime = action.payload.lastLoginTime;
        state.error = null;
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = action.payload;
      });

    // Login biométrico
    builder
      .addCase(biometricLoginAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(biometricLoginAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.lastLoginTime = action.payload.lastLoginTime;
        state.error = null;
      })
      .addCase(biometricLoginAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Registro
    builder
      .addCase(registerAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.lastLoginTime = action.payload.lastLoginTime;
        state.error = null;
      })
      .addCase(registerAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Refresh token
    builder
      .addCase(refreshTokenAsync.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
      })
      .addCase(refreshTokenAsync.rejected, (state) => {
        // Si el refresh falla, cerrar sesión
        return initialState;
      });

    // Logout
    builder
      .addCase(logoutAsync.fulfilled, () => {
        return initialState;
      });

    // Verificar token
    builder
      .addCase(verifyTokenAsync.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(verifyTokenAsync.rejected, () => {
        return initialState;
      });
  },
});

// Exportar actions
export const {
  clearError,
  updateUser,
  setBiometricEnabled,
  setRememberMe,
  resetAuthState,
} = authSlice.actions;

// Selectores
export const selectAuth = (state) => state.auth;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectUser = (state) => state.auth.user;
export const selectToken = (state) => state.auth.token;
export const selectIsLoading = (state) => state.auth.isLoading;
export const selectError = (state) => state.auth.error;
export const selectBiometricEnabled = (state) => state.auth.biometricEnabled;

export default authSlice.reducer;
