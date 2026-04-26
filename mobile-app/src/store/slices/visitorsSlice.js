/**
 * Visitors Slice - Gestión de visitantes
 * Manejo del estado de visitantes, registros y validaciones
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { visitorsService } from '../services/visitorsService';
import { showMessage } from 'react-native-flash-message';

// Estado inicial
const initialState = {
  visitors: [],
  currentVisitor: null,
  pendingVisitors: [],
  approvedVisitors: [],
  rejectedVisitors: [],
  recentVisits: [],
  searchResults: [],
  isLoading: false,
  isRegistering: false,
  isValidating: false,
  error: null,
  filters: {
    status: 'all', // all, pending, approved, rejected
    dateRange: 'today', // today, week, month, all
    searchTerm: '',
  },
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
  },
  statistics: {
    totalVisitors: 0,
    todayVisitors: 0,
    pendingApprovals: 0,
    activeVisits: 0,
  },
};

// Async Thunks para acciones asíncronas

// Obtener lista de visitantes
export const fetchVisitorsAsync = createAsyncThunk(
  'visitors/fetchVisitors',
  async ({ filters, page = 1 }, { rejectWithValue }) => {
    try {
      const response = await visitorsService.getVisitors(filters, page);
      
      if (response.success) {
        return {
          visitors: response.data.visitors,
          pagination: response.data.pagination,
          statistics: response.data.statistics,
        };
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      showMessage({
        message: 'Error al Cargar Visitantes',
        description: error.message,
        type: 'danger',
        icon: 'danger',
        duration: 3000,
      });
      return rejectWithValue(error.message);
    }
  }
);

// Registrar nuevo visitante
export const registerVisitorAsync = createAsyncThunk(
  'visitors/registerVisitor',
  async (visitorData, { rejectWithValue }) => {
    try {
      const response = await visitorsService.registerVisitor(visitorData);
      
      if (response.success) {
        showMessage({
          message: 'Visitante Registrado',
          description: `${visitorData.name} ha sido registrado exitosamente`,
          type: 'success',
          icon: 'success',
          duration: 3000,
        });
        
        return response.data.visitor;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      showMessage({
        message: 'Error en Registro',
        description: error.message,
        type: 'danger',
        icon: 'danger',
        duration: 4000,
      });
      return rejectWithValue(error.message);
    }
  }
);

// Validar visitante (entrada/salida)
export const validateVisitorAsync = createAsyncThunk(
  'visitors/validateVisitor',
  async ({ visitorId, validationType, biometricData }, { rejectWithValue }) => {
    try {
      const response = await visitorsService.validateVisitor(
        visitorId,
        validationType,
        biometricData
      );
      
      if (response.success) {
        const message = validationType === 'entry' ? 'Entrada Registrada' : 'Salida Registrada';
        const description = `${response.data.visitor.name} - ${validationType === 'entry' ? 'Ingreso' : 'Salida'} exitosa`;
        
        showMessage({
          message,
          description,
          type: 'success',
          icon: 'success',
          duration: 3000,
        });
        
        return {
          visitor: response.data.visitor,
          validation: response.data.validation,
          validationType,
        };
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      showMessage({
        message: 'Error en Validación',
        description: error.message,
        type: 'danger',
        icon: 'danger',
        duration: 4000,
      });
      return rejectWithValue(error.message);
    }
  }
);

// Aprobar visitante pendiente
export const approveVisitorAsync = createAsyncThunk(
  'visitors/approveVisitor',
  async ({ visitorId, approvalData }, { rejectWithValue }) => {
    try {
      const response = await visitorsService.approveVisitor(visitorId, approvalData);
      
      if (response.success) {
        showMessage({
          message: 'Visitante Aprobado',
          description: 'El visitante ha sido aprobado exitosamente',
          type: 'success',
          icon: 'success',
          duration: 3000,
        });
        
        return response.data.visitor;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      showMessage({
        message: 'Error en Aprobación',
        description: error.message,
        type: 'danger',
        icon: 'danger',
        duration: 4000,
      });
      return rejectWithValue(error.message);
    }
  }
);

// Rechazar visitante
export const rejectVisitorAsync = createAsyncThunk(
  'visitors/rejectVisitor',
  async ({ visitorId, reason }, { rejectWithValue }) => {
    try {
      const response = await visitorsService.rejectVisitor(visitorId, reason);
      
      if (response.success) {
        showMessage({
          message: 'Visitante Rechazado',
          description: 'El visitante ha sido rechazado',
          type: 'warning',
          icon: 'warning',
          duration: 3000,
        });
        
        return response.data.visitor;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      showMessage({
        message: 'Error en Rechazo',
        description: error.message,
        type: 'danger',
        icon: 'danger',
        duration: 4000,
      });
      return rejectWithValue(error.message);
    }
  }
);

// Buscar visitantes
export const searchVisitorsAsync = createAsyncThunk(
  'visitors/searchVisitors',
  async (searchTerm, { rejectWithValue }) => {
    try {
      const response = await visitorsService.searchVisitors(searchTerm);
      
      if (response.success) {
        return response.data.visitors;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Obtener historial de visitas
export const fetchVisitHistoryAsync = createAsyncThunk(
  'visitors/fetchVisitHistory',
  async ({ visitorId, dateRange }, { rejectWithValue }) => {
    try {
      const response = await visitorsService.getVisitHistory(visitorId, dateRange);
      
      if (response.success) {
        return response.data.visits;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Slice
const visitorsSlice = createSlice({
  name: 'visitors',
  initialState,
  reducers: {
    // Limpiar errores
    clearError: (state) => {
      state.error = null;
    },
    
    // Establecer visitante actual
    setCurrentVisitor: (state, action) => {
      state.currentVisitor = action.payload;
    },
    
    // Limpiar visitante actual
    clearCurrentVisitor: (state) => {
      state.currentVisitor = null;
    },
    
    // Actualizar filtros
    updateFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    
    // Limpiar filtros
    clearFilters: (state) => {
      state.filters = {
        status: 'all',
        dateRange: 'today',
        searchTerm: '',
      };
    },
    
    // Actualizar paginación
    updatePagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    
    // Limpiar resultados de búsqueda
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    
    // Actualizar visitante localmente
    updateVisitorLocal: (state, action) => {
      const { visitorId, updates } = action.payload;
      const index = state.visitors.findIndex(v => v.id === visitorId);
      if (index !== -1) {
        state.visitors[index] = { ...state.visitors[index], ...updates };
      }
    },
    
    // Reset visitors state
    resetVisitorsState: () => initialState,
  },
  extraReducers: (builder) => {
    // Fetch visitors
    builder
      .addCase(fetchVisitorsAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchVisitorsAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.visitors = action.payload.visitors;
        state.pagination = action.payload.pagination;
        state.statistics = action.payload.statistics;
        
        // Separar por estados
        state.pendingVisitors = state.visitors.filter(v => v.status === 'pending');
        state.approvedVisitors = state.visitors.filter(v => v.status === 'approved');
        state.rejectedVisitors = state.visitors.filter(v => v.status === 'rejected');
        
        state.error = null;
      })
      .addCase(fetchVisitorsAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Register visitor
    builder
      .addCase(registerVisitorAsync.pending, (state) => {
        state.isRegistering = true;
        state.error = null;
      })
      .addCase(registerVisitorAsync.fulfilled, (state, action) => {
        state.isRegistering = false;
        state.visitors.unshift(action.payload);
        
        // Actualizar listas por estado
        if (action.payload.status === 'pending') {
          state.pendingVisitors.unshift(action.payload);
        } else if (action.payload.status === 'approved') {
          state.approvedVisitors.unshift(action.payload);
        }
        
        // Actualizar estadísticas
        state.statistics.totalVisitors += 1;
        if (action.payload.status === 'pending') {
          state.statistics.pendingApprovals += 1;
        }
        
        state.error = null;
      })
      .addCase(registerVisitorAsync.rejected, (state, action) => {
        state.isRegistering = false;
        state.error = action.payload;
      });

    // Validate visitor
    builder
      .addCase(validateVisitorAsync.pending, (state) => {
        state.isValidating = true;
        state.error = null;
      })
      .addCase(validateVisitorAsync.fulfilled, (state, action) => {
        state.isValidating = false;
        
        const { visitor, validation, validationType } = action.payload;
        
        // Actualizar visitante en la lista
        const index = state.visitors.findIndex(v => v.id === visitor.id);
        if (index !== -1) {
          state.visitors[index] = visitor;
        }
        
        // Agregar a visitas recientes
        state.recentVisits.unshift({
          ...validation,
          visitor,
          type: validationType,
          timestamp: new Date().toISOString(),
        });
        
        // Limitar visitas recientes a 50
        if (state.recentVisits.length > 50) {
          state.recentVisits = state.recentVisits.slice(0, 50);
        }
        
        // Actualizar estadísticas
        if (validationType === 'entry') {
          state.statistics.activeVisits += 1;
        } else {
          state.statistics.activeVisits = Math.max(0, state.statistics.activeVisits - 1);
        }
        
        state.error = null;
      })
      .addCase(validateVisitorAsync.rejected, (state, action) => {
        state.isValidating = false;
        state.error = action.payload;
      });

    // Approve visitor
    builder
      .addCase(approveVisitorAsync.fulfilled, (state, action) => {
        const approvedVisitor = action.payload;
        
        // Actualizar en lista principal
        const index = state.visitors.findIndex(v => v.id === approvedVisitor.id);
        if (index !== -1) {
          state.visitors[index] = approvedVisitor;
        }
        
        // Mover de pendientes a aprobados
        state.pendingVisitors = state.pendingVisitors.filter(v => v.id !== approvedVisitor.id);
        state.approvedVisitors.push(approvedVisitor);
        
        // Actualizar estadísticas
        state.statistics.pendingApprovals = Math.max(0, state.statistics.pendingApprovals - 1);
      })
      .addCase(approveVisitorAsync.rejected, (state, action) => {
        state.error = action.payload;
      });

    // Reject visitor
    builder
      .addCase(rejectVisitorAsync.fulfilled, (state, action) => {
        const rejectedVisitor = action.payload;
        
        // Actualizar en lista principal
        const index = state.visitors.findIndex(v => v.id === rejectedVisitor.id);
        if (index !== -1) {
          state.visitors[index] = rejectedVisitor;
        }
        
        // Mover de pendientes a rechazados
        state.pendingVisitors = state.pendingVisitors.filter(v => v.id !== rejectedVisitor.id);
        state.rejectedVisitors.push(rejectedVisitor);
        
        // Actualizar estadísticas
        state.statistics.pendingApprovals = Math.max(0, state.statistics.pendingApprovals - 1);
      })
      .addCase(rejectVisitorAsync.rejected, (state, action) => {
        state.error = action.payload;
      });

    // Search visitors
    builder
      .addCase(searchVisitorsAsync.fulfilled, (state, action) => {
        state.searchResults = action.payload;
      })
      .addCase(searchVisitorsAsync.rejected, (state, action) => {
        state.searchResults = [];
        state.error = action.payload;
      });

    // Fetch visit history
    builder
      .addCase(fetchVisitHistoryAsync.fulfilled, (state, action) => {
        state.recentVisits = action.payload;
      })
      .addCase(fetchVisitHistoryAsync.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

// Exportar actions
export const {
  clearError,
  setCurrentVisitor,
  clearCurrentVisitor,
  updateFilters,
  clearFilters,
  updatePagination,
  clearSearchResults,
  updateVisitorLocal,
  resetVisitorsState,
} = visitorsSlice.actions;

// Selectores
export const selectVisitors = (state) => state.visitors;
export const selectVisitorsList = (state) => state.visitors.visitors;
export const selectCurrentVisitor = (state) => state.visitors.currentVisitor;
export const selectPendingVisitors = (state) => state.visitors.pendingVisitors;
export const selectApprovedVisitors = (state) => state.visitors.approvedVisitors;
export const selectRejectedVisitors = (state) => state.visitors.rejectedVisitors;
export const selectRecentVisits = (state) => state.visitors.recentVisits;
export const selectSearchResults = (state) => state.visitors.searchResults;
export const selectVisitorsLoading = (state) => state.visitors.isLoading;
export const selectVisitorsError = (state) => state.visitors.error;
export const selectVisitorsFilters = (state) => state.visitors.filters;
export const selectVisitorsPagination = (state) => state.visitors.pagination;
export const selectVisitorsStatistics = (state) => state.visitors.statistics;

export default visitorsSlice.reducer;
