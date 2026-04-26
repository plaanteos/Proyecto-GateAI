/**
 * Guests Slice - Gestión de Invitados/Huéspedes
 * Sistema completo para invitar, gestionar y controlar huéspedes
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunks
export const fetchGuests = createAsyncThunk(
  'guests/fetchGuests',
  async (propertyId, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/properties/${propertyId}/guests`);
      if (!response.ok) throw new Error('Error fetching guests');
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const inviteGuest = createAsyncThunk(
  'guests/inviteGuest',
  async (guestData, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/guests/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(guestData),
      });
      if (!response.ok) throw new Error('Error inviting guest');
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateGuestAccess = createAsyncThunk(
  'guests/updateGuestAccess',
  async ({ guestId, accessData }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/guests/${guestId}/access`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accessData),
      });
      if (!response.ok) throw new Error('Error updating guest access');
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const revokeGuestAccess = createAsyncThunk(
  'guests/revokeGuestAccess',
  async (guestId, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/guests/${guestId}/revoke`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Error revoking guest access');
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const generateQRCode = createAsyncThunk(
  'guests/generateQRCode',
  async ({ guestId, options }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/guests/${guestId}/qr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });
      if (!response.ok) throw new Error('Error generating QR code');
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const sendInvitationWhatsApp = createAsyncThunk(
  'guests/sendInvitationWhatsApp',
  async ({ guestId, phone, message }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/guests/${guestId}/whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message }),
      });
      if (!response.ok) throw new Error('Error sending WhatsApp invitation');
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchGuestAccessHistory = createAsyncThunk(
  'guests/fetchGuestAccessHistory',
  async ({ guestId, startDate, endDate }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({
        startDate: startDate || '',
        endDate: endDate || '',
      });
      const response = await fetch(`/api/guests/${guestId}/history?${params}`);
      if (!response.ok) throw new Error('Error fetching guest history');
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  // Guests data
  guests: [],
  activeGuests: [],
  expiredGuests: [],
  revokedGuests: [],
  
  // Invitation data
  pendingInvitations: [],
  sentInvitations: [],
  
  // Access history
  accessHistory: [],
  guestHistory: {},
  
  // QR codes
  qrCodes: {},
  
  // UI state
  loading: false,
  refreshing: false,
  error: null,
  
  // Filters and search
  searchQuery: '',
  filters: {
    status: 'all', // active, expired, revoked, pending
    type: 'all', // temporary, recurring, permanent
    dateRange: null,
  },
  
  // Selected guest
  selectedGuest: null,
  
  // Invitation flow
  invitationStep: 1,
  invitationData: {
    type: 'temporary', // temporary, recurring, permanent
    name: '',
    email: '',
    phone: '',
    document: '',
    startDate: null,
    endDate: null,
    startTime: '08:00',
    endTime: '18:00',
    areas: [],
    description: '',
    sendWhatsApp: false,
    sendEmail: false,
    generateQR: true,
  },
  
  // Stats
  guestStats: {
    totalGuests: 0,
    activeGuests: 0,
    todayVisits: 0,
    thisWeekVisits: 0,
    thisMonthVisits: 0,
    averageVisitDuration: 0,
  },
};

const guestsSlice = createSlice({
  name: 'guests',
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
    
    // Guest selection
    setSelectedGuest: (state, action) => {
      state.selectedGuest = action.payload;
    },
    clearSelectedGuest: (state) => {
      state.selectedGuest = null;
    },
    
    // Invitation flow
    setInvitationStep: (state, action) => {
      state.invitationStep = action.payload;
    },
    updateInvitationData: (state, action) => {
      state.invitationData = { ...state.invitationData, ...action.payload };
    },
    clearInvitationData: (state) => {
      state.invitationData = initialState.invitationData;
      state.invitationStep = 1;
    },
    
    // Local guest updates
    updateGuestLocal: (state, action) => {
      const { guestId, updates } = action.payload;
      const guestIndex = state.guests.findIndex(g => g.id === guestId);
      if (guestIndex !== -1) {
        state.guests[guestIndex] = { ...state.guests[guestIndex], ...updates };
      }
    },
    
    removeGuestLocal: (state, action) => {
      state.guests = state.guests.filter(g => g.id !== action.payload);
    },
    
    // QR codes management
    setQRCode: (state, action) => {
      const { guestId, qrData } = action.payload;
      state.qrCodes[guestId] = qrData;
    },
    clearQRCode: (state, action) => {
      delete state.qrCodes[action.payload];
    },
    
    // Access history
    setAccessHistory: (state, action) => {
      state.accessHistory = action.payload;
    },
    addAccessRecord: (state, action) => {
      state.accessHistory.unshift(action.payload);
    },
    setGuestHistory: (state, action) => {
      const { guestId, history } = action.payload;
      state.guestHistory[guestId] = history;
    },
    
    // Real-time updates
    updateGuestStatus: (state, action) => {
      const { guestId, status, timestamp } = action.payload;
      const guest = state.guests.find(g => g.id === guestId);
      if (guest) {
        guest.status = status;
        guest.lastActivity = timestamp;
      }
    },
    
    // Stats
    updateGuestStats: (state, action) => {
      state.guestStats = { ...state.guestStats, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    // Fetch guests
    builder
      .addCase(fetchGuests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGuests.fulfilled, (state, action) => {
        state.loading = false;
        state.guests = action.payload.guests || [];
        state.activeGuests = action.payload.activeGuests || [];
        state.expiredGuests = action.payload.expiredGuests || [];
        state.revokedGuests = action.payload.revokedGuests || [];
        state.guestStats = action.payload.stats || initialState.guestStats;
      })
      .addCase(fetchGuests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Invite guest
      .addCase(inviteGuest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(inviteGuest.fulfilled, (state, action) => {
        state.loading = false;
        state.guests.push(action.payload.guest);
        state.sentInvitations.push(action.payload.invitation);
        state.clearInvitationData = initialState.invitationData;
        state.invitationStep = 1;
      })
      .addCase(inviteGuest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update guest access
      .addCase(updateGuestAccess.fulfilled, (state, action) => {
        const guest = state.guests.find(g => g.id === action.payload.id);
        if (guest) {
          Object.assign(guest, action.payload);
        }
      })
      
      // Revoke guest access
      .addCase(revokeGuestAccess.fulfilled, (state, action) => {
        const guest = state.guests.find(g => g.id === action.payload.id);
        if (guest) {
          guest.status = 'revoked';
          guest.revokedAt = action.payload.revokedAt;
        }
      })
      
      // Generate QR code
      .addCase(generateQRCode.fulfilled, (state, action) => {
        const { guestId, qrData } = action.payload;
        state.qrCodes[guestId] = qrData;
      })
      
      // Send WhatsApp invitation
      .addCase(sendInvitationWhatsApp.fulfilled, (state, action) => {
        const guest = state.guests.find(g => g.id === action.payload.guestId);
        if (guest) {
          guest.whatsappSent = true;
          guest.whatsappSentAt = action.payload.sentAt;
        }
      })
      
      // Fetch guest access history
      .addCase(fetchGuestAccessHistory.fulfilled, (state, action) => {
        const { guestId, history } = action.payload;
        state.guestHistory[guestId] = history;
      });
  },
});

// Selectors
export const selectGuests = (state) => state.guests.guests;
export const selectActiveGuests = (state) => state.guests.activeGuests;
export const selectExpiredGuests = (state) => state.guests.expiredGuests;
export const selectRevokedGuests = (state) => state.guests.revokedGuests;
export const selectGuestStats = (state) => state.guests.guestStats;
export const selectGuestsLoading = (state) => state.guests.loading;
export const selectGuestsError = (state) => state.guests.error;
export const selectSelectedGuest = (state) => state.guests.selectedGuest;
export const selectInvitationData = (state) => state.guests.invitationData;
export const selectInvitationStep = (state) => state.guests.invitationStep;
export const selectQRCodes = (state) => state.guests.qrCodes;
export const selectAccessHistory = (state) => state.guests.accessHistory;

// Filtered selectors
export const selectFilteredGuests = (state) => {
  const { guests, searchQuery, filters } = state.guests;
  
  return guests.filter(guest => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        guest.name.toLowerCase().includes(query) ||
        guest.email?.toLowerCase().includes(query) ||
        guest.phone?.includes(query) ||
        guest.document?.includes(query);
      
      if (!matchesSearch) return false;
    }
    
    // Status filter
    if (filters.status && filters.status !== 'all') {
      if (guest.status !== filters.status) return false;
    }
    
    // Type filter
    if (filters.type && filters.type !== 'all') {
      if (guest.type !== filters.type) return false;
    }
    
    // Date range filter
    if (filters.dateRange) {
      const guestDate = new Date(guest.startDate);
      const { start, end } = filters.dateRange;
      if (start && guestDate < start) return false;
      if (end && guestDate > end) return false;
    }
    
    return true;
  });
};

export const selectGuestById = (guestId) => (state) => {
  return state.guests.guests.find(g => g.id === guestId);
};

export const selectGuestQRCode = (guestId) => (state) => {
  return state.guests.qrCodes[guestId];
};

export const selectGuestHistory = (guestId) => (state) => {
  return state.guests.guestHistory[guestId] || [];
};

export const {
  setLoading,
  clearError,
  setSearchQuery,
  setFilters,
  clearFilters,
  setSelectedGuest,
  clearSelectedGuest,
  setInvitationStep,
  updateInvitationData,
  clearInvitationData,
  updateGuestLocal,
  removeGuestLocal,
  setQRCode,
  clearQRCode,
  setAccessHistory,
  addAccessRecord,
  setGuestHistory,
  updateGuestStatus,
  updateGuestStats,
} = guestsSlice.actions;

export default guestsSlice.reducer;
