/**
 * Properties Slice - Gestión de Propiedades/Edificios
 * Manejo del estado para edificios, unidades y áreas
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunks
export const fetchUserProperties = createAsyncThunk(
  'properties/fetchUserProperties',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/users/${userId}/properties`);
      if (!response.ok) throw new Error('Error fetching properties');
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addProperty = createAsyncThunk(
  'properties/addProperty',
  async (propertyData, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(propertyData),
      });
      if (!response.ok) throw new Error('Error adding property');
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateProperty = createAsyncThunk(
  'properties/updateProperty',
  async ({ propertyId, data }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Error updating property');
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const setActiveProperty = createAsyncThunk(
  'properties/setActiveProperty',
  async (propertyId, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/properties/${propertyId}/activate`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Error setting active property');
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  // Properties data
  properties: [],
  activeProperty: null,
  buildings: [],
  units: [],
  areas: [],
  
  // UI state
  loading: false,
  refreshing: false,
  error: null,
  
  // Filters and search
  searchQuery: '',
  filters: {
    building: null,
    type: 'all', // apartment, house, office
    status: 'all', // active, inactive
  },
  
  // Property details
  selectedProperty: null,
  propertyStats: {
    totalUnits: 0,
    occupiedUnits: 0,
    availableUnits: 0,
    totalAreas: 0,
  },
};

const propertiesSlice = createSlice({
  name: 'properties',
  initialState,
  reducers: {
    // UI actions
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    
    // Search and filters
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
      state.searchQuery = '';
    },
    
    // Property selection
    setSelectedProperty: (state, action) => {
      state.selectedProperty = action.payload;
    },
    clearSelectedProperty: (state) => {
      state.selectedProperty = null;
    },
    
    // Local data updates
    updatePropertyLocal: (state, action) => {
      const { propertyId, updates } = action.payload;
      const propertyIndex = state.properties.findIndex(p => p.id === propertyId);
      if (propertyIndex !== -1) {
        state.properties[propertyIndex] = { ...state.properties[propertyIndex], ...updates };
      }
    },
    
    removePropertyLocal: (state, action) => {
      state.properties = state.properties.filter(p => p.id !== action.payload);
    },
    
    // Building management
    setBuildings: (state, action) => {
      state.buildings = action.payload;
    },
    addBuilding: (state, action) => {
      state.buildings.push(action.payload);
    },
    
    // Unit management
    setUnits: (state, action) => {
      state.units = action.payload;
    },
    addUnit: (state, action) => {
      state.units.push(action.payload);
    },
    updateUnit: (state, action) => {
      const { unitId, updates } = action.payload;
      const unitIndex = state.units.findIndex(u => u.id === unitId);
      if (unitIndex !== -1) {
        state.units[unitIndex] = { ...state.units[unitIndex], ...updates };
      }
    },
    
    // Area management
    setAreas: (state, action) => {
      state.areas = action.payload;
    },
    addArea: (state, action) => {
      state.areas.push(action.payload);
    },
    
    // Stats update
    updatePropertyStats: (state, action) => {
      state.propertyStats = { ...state.propertyStats, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    // Fetch user properties
    builder
      .addCase(fetchUserProperties.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProperties.fulfilled, (state, action) => {
        state.loading = false;
        state.properties = action.payload.properties || [];
        state.activeProperty = action.payload.activeProperty || null;
        state.buildings = action.payload.buildings || [];
        state.units = action.payload.units || [];
        state.areas = action.payload.areas || [];
        state.propertyStats = action.payload.stats || initialState.propertyStats;
      })
      .addCase(fetchUserProperties.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Add property
      .addCase(addProperty.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addProperty.fulfilled, (state, action) => {
        state.loading = false;
        state.properties.push(action.payload);
      })
      .addCase(addProperty.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update property
      .addCase(updateProperty.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProperty.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.properties.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.properties[index] = action.payload;
        }
        if (state.activeProperty?.id === action.payload.id) {
          state.activeProperty = action.payload;
        }
      })
      .addCase(updateProperty.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Set active property
      .addCase(setActiveProperty.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(setActiveProperty.fulfilled, (state, action) => {
        state.loading = false;
        state.activeProperty = action.payload;
      })
      .addCase(setActiveProperty.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Selectors
export const selectProperties = (state) => state.properties.properties;
export const selectActiveProperty = (state) => state.properties.activeProperty;
export const selectBuildings = (state) => state.properties.buildings;
export const selectUnits = (state) => state.properties.units;
export const selectAreas = (state) => state.properties.areas;
export const selectPropertyStats = (state) => state.properties.propertyStats;
export const selectPropertiesLoading = (state) => state.properties.loading;
export const selectPropertiesError = (state) => state.properties.error;
export const selectSelectedProperty = (state) => state.properties.selectedProperty;

// Filtered selectors
export const selectFilteredProperties = (state) => {
  const { properties, searchQuery, filters } = state.properties;
  
  return properties.filter(property => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        property.name.toLowerCase().includes(query) ||
        property.address.toLowerCase().includes(query) ||
        property.building?.toLowerCase().includes(query) ||
        property.unit?.toLowerCase().includes(query);
      
      if (!matchesSearch) return false;
    }
    
    // Type filter
    if (filters.type && filters.type !== 'all') {
      if (property.type !== filters.type) return false;
    }
    
    // Status filter
    if (filters.status && filters.status !== 'all') {
      if (property.status !== filters.status) return false;
    }
    
    // Building filter
    if (filters.building) {
      if (property.buildingId !== filters.building) return false;
    }
    
    return true;
  });
};

export const {
  setLoading,
  clearError,
  setSearchQuery,
  setFilters,
  clearFilters,
  setSelectedProperty,
  clearSelectedProperty,
  updatePropertyLocal,
  removePropertyLocal,
  setBuildings,
  addBuilding,
  setUnits,
  addUnit,
  updateUnit,
  setAreas,
  addArea,
  updatePropertyStats,
} = propertiesSlice.actions;

export default propertiesSlice.reducer;
