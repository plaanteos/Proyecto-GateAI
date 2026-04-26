/**
 * Notifications Slice - Sistema de Notificaciones
 * Gestión de notificaciones push, en app y alertas en tiempo real
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunks
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async ({ page = 1, limit = 20, type = 'all' }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({ page, limit, type });
      const response = await fetch(`/api/notifications?${params}`);
      if (!response.ok) throw new Error('Error fetching notifications');
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const markAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (notificationIds, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds }),
      });
      if (!response.ok) throw new Error('Error marking notifications as read');
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const markAllAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Error marking all notifications as read');
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteNotification = createAsyncThunk(
  'notifications/deleteNotification',
  async (notificationId, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Error deleting notification');
      return notificationId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateNotificationSettings = createAsyncThunk(
  'notifications/updateNotificationSettings',
  async (settings, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/notifications/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!response.ok) throw new Error('Error updating notification settings');
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const subscribeToWebSocket = createAsyncThunk(
  'notifications/subscribeToWebSocket',
  async (userId, { dispatch, rejectWithValue }) => {
    try {
      const ws = new WebSocket(`ws://localhost:3000/notifications/${userId}`);
      
      ws.onopen = () => {
        console.log('WebSocket connected for notifications');
        dispatch(setWebSocketStatus('connected'));
      };
      
      ws.onmessage = (event) => {
        const notification = JSON.parse(event.data);
        dispatch(addNotification(notification));
        
        // Show in-app notification if app is active
        if (notification.showInApp) {
          dispatch(showInAppNotification(notification));
        }
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected');
        dispatch(setWebSocketStatus('disconnected'));
        
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          dispatch(subscribeToWebSocket(userId));
        }, 5000);
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        dispatch(setWebSocketStatus('error'));
      };
      
      return ws;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  // Notifications data
  notifications: [],
  unreadNotifications: [],
  archivedNotifications: [],
  
  // Real-time notifications
  liveNotifications: [],
  inAppNotifications: [],
  
  // Security alerts
  securityAlerts: [],
  emergencyAlerts: [],
  
  // WebSocket connection
  webSocket: null,
  webSocketStatus: 'disconnected', // connected, disconnected, error, connecting
  
  // UI state
  loading: false,
  refreshing: false,
  error: null,
  
  // Filters and pagination
  filters: {
    type: 'all', // security, access, guest, system, emergency
    status: 'all', // read, unread
    priority: 'all', // low, medium, high, critical
    dateRange: null,
  },
  pagination: {
    page: 1,
    limit: 20,
    hasMore: true,
    total: 0,
  },
  
  // Notification settings
  settings: {
    pushEnabled: true,
    emailEnabled: true,
    smsEnabled: false,
    whatsappEnabled: false,
    inAppEnabled: true,
    soundEnabled: true,
    vibrationEnabled: true,
    
    // Notification types
    types: {
      guestAccess: true,
      securityAlert: true,
      systemUpdate: false,
      maintenanceAlert: true,
      emergencyAlert: true,
      accessDenied: true,
      newGuest: true,
      guestExpired: false,
    },
    
    // Quiet hours
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00',
    },
    
    // Priority filtering
    minimumPriority: 'low', // low, medium, high, critical
  },
  
  // Stats
  notificationStats: {
    totalNotifications: 0,
    unreadCount: 0,
    todayCount: 0,
    weekCount: 0,
    securityAlertsCount: 0,
    criticalAlertsCount: 0,
  },
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    // WebSocket management
    setWebSocket: (state, action) => {
      state.webSocket = action.payload;
    },
    setWebSocketStatus: (state, action) => {
      state.webSocketStatus = action.payload;
    },
    
    // Real-time notifications
    addNotification: (state, action) => {
      const notification = action.payload;
      state.notifications.unshift(notification);
      
      if (!notification.read) {
        state.unreadNotifications.unshift(notification);
        state.notificationStats.unreadCount += 1;
      }
      
      // Add to live notifications for real-time display
      state.liveNotifications.unshift(notification);
      
      // Keep only last 50 live notifications
      if (state.liveNotifications.length > 50) {
        state.liveNotifications = state.liveNotifications.slice(0, 50);
      }
      
      // Handle security alerts
      if (notification.type === 'security' || notification.priority === 'critical') {
        state.securityAlerts.unshift(notification);
      }
      
      // Handle emergency alerts
      if (notification.type === 'emergency') {
        state.emergencyAlerts.unshift(notification);
      }
    },
    
    // In-app notifications
    showInAppNotification: (state, action) => {
      state.inAppNotifications.push({
        ...action.payload,
        id: `inapp_${Date.now()}`,
        timestamp: Date.now(),
      });
    },
    dismissInAppNotification: (state, action) => {
      state.inAppNotifications = state.inAppNotifications.filter(
        n => n.id !== action.payload
      );
    },
    clearInAppNotifications: (state) => {
      state.inAppNotifications = [];
    },
    
    // Local updates
    markNotificationAsRead: (state, action) => {
      const notificationId = action.payload;
      
      // Update in main notifications
      const notification = state.notifications.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        notification.read = true;
        notification.readAt = new Date().toISOString();
        
        // Remove from unread
        state.unreadNotifications = state.unreadNotifications.filter(
          n => n.id !== notificationId
        );
        
        // Update stats
        state.notificationStats.unreadCount = Math.max(0, state.notificationStats.unreadCount - 1);
      }
    },
    
    markAllNotificationsAsRead: (state) => {
      state.notifications.forEach(notification => {
        if (!notification.read) {
          notification.read = true;
          notification.readAt = new Date().toISOString();
        }
      });
      
      state.unreadNotifications = [];
      state.notificationStats.unreadCount = 0;
    },
    
    removeNotification: (state, action) => {
      const notificationId = action.payload;
      
      state.notifications = state.notifications.filter(n => n.id !== notificationId);
      state.unreadNotifications = state.unreadNotifications.filter(n => n.id !== notificationId);
      state.liveNotifications = state.liveNotifications.filter(n => n.id !== notificationId);
      state.securityAlerts = state.securityAlerts.filter(n => n.id !== notificationId);
      state.emergencyAlerts = state.emergencyAlerts.filter(n => n.id !== notificationId);
    },
    
    // Filters and pagination
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    resetPagination: (state) => {
      state.pagination = initialState.pagination;
    },
    
    // Settings
    updateNotificationSettingsLocal: (state, action) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    
    // Archive notifications
    archiveNotification: (state, action) => {
      const notificationId = action.payload;
      const notification = state.notifications.find(n => n.id === notificationId);
      
      if (notification) {
        notification.archived = true;
        notification.archivedAt = new Date().toISOString();
        state.archivedNotifications.push(notification);
        
        // Remove from main list
        state.notifications = state.notifications.filter(n => n.id !== notificationId);
        state.unreadNotifications = state.unreadNotifications.filter(n => n.id !== notificationId);
      }
    },
    
    // Security alerts management
    dismissSecurityAlert: (state, action) => {
      const alertId = action.payload;
      state.securityAlerts = state.securityAlerts.filter(a => a.id !== alertId);
    },
    clearSecurityAlerts: (state) => {
      state.securityAlerts = [];
    },
    
    // Emergency alerts management
    dismissEmergencyAlert: (state, action) => {
      const alertId = action.payload;
      state.emergencyAlerts = state.emergencyAlerts.filter(a => a.id !== alertId);
    },
    clearEmergencyAlerts: (state) => {
      state.emergencyAlerts = [];
    },
    
    // Stats update
    updateNotificationStats: (state, action) => {
      state.notificationStats = { ...state.notificationStats, ...action.payload };
    },
    
    // UI state
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch notifications
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        const { notifications, unread, stats, pagination } = action.payload;
        
        if (state.pagination.page === 1) {
          state.notifications = notifications;
        } else {
          state.notifications.push(...notifications);
        }
        
        state.unreadNotifications = unread || [];
        state.notificationStats = { ...state.notificationStats, ...stats };
        state.pagination = { ...state.pagination, ...pagination };
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Mark as read
      .addCase(markAsRead.fulfilled, (state, action) => {
        const { notificationIds } = action.payload;
        notificationIds.forEach(id => {
          const notification = state.notifications.find(n => n.id === id);
          if (notification) {
            notification.read = true;
            notification.readAt = new Date().toISOString();
          }
        });
        
        state.unreadNotifications = state.unreadNotifications.filter(
          n => !notificationIds.includes(n.id)
        );
        
        state.notificationStats.unreadCount = Math.max(
          0, 
          state.notificationStats.unreadCount - notificationIds.length
        );
      })
      
      // Mark all as read
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.notifications.forEach(notification => {
          notification.read = true;
          notification.readAt = new Date().toISOString();
        });
        
        state.unreadNotifications = [];
        state.notificationStats.unreadCount = 0;
      })
      
      // Delete notification
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const notificationId = action.payload;
        state.notifications = state.notifications.filter(n => n.id !== notificationId);
        state.unreadNotifications = state.unreadNotifications.filter(n => n.id !== notificationId);
      })
      
      // Update settings
      .addCase(updateNotificationSettings.fulfilled, (state, action) => {
        state.settings = { ...state.settings, ...action.payload };
      })
      
      // WebSocket subscription
      .addCase(subscribeToWebSocket.pending, (state) => {
        state.webSocketStatus = 'connecting';
      })
      .addCase(subscribeToWebSocket.fulfilled, (state, action) => {
        state.webSocket = action.payload;
        state.webSocketStatus = 'connected';
      })
      .addCase(subscribeToWebSocket.rejected, (state, action) => {
        state.webSocketStatus = 'error';
        state.error = action.payload;
      });
  },
});

// Selectors
export const selectNotifications = (state) => state.notifications.notifications;
export const selectUnreadNotifications = (state) => state.notifications.unreadNotifications;
export const selectLiveNotifications = (state) => state.notifications.liveNotifications;
export const selectInAppNotifications = (state) => state.notifications.inAppNotifications;
export const selectSecurityAlerts = (state) => state.notifications.securityAlerts;
export const selectEmergencyAlerts = (state) => state.notifications.emergencyAlerts;
export const selectNotificationStats = (state) => state.notifications.notificationStats;
export const selectNotificationSettings = (state) => state.notifications.settings;
export const selectWebSocketStatus = (state) => state.notifications.webSocketStatus;
export const selectNotificationsLoading = (state) => state.notifications.loading;
export const selectNotificationsError = (state) => state.notifications.error;

// Filtered selectors
export const selectFilteredNotifications = (state) => {
  const { notifications, filters } = state.notifications;
  
  return notifications.filter(notification => {
    // Type filter
    if (filters.type && filters.type !== 'all') {
      if (notification.type !== filters.type) return false;
    }
    
    // Status filter
    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'read' && !notification.read) return false;
      if (filters.status === 'unread' && notification.read) return false;
    }
    
    // Priority filter
    if (filters.priority && filters.priority !== 'all') {
      if (notification.priority !== filters.priority) return false;
    }
    
    // Date range filter
    if (filters.dateRange) {
      const notificationDate = new Date(notification.createdAt);
      const { start, end } = filters.dateRange;
      if (start && notificationDate < start) return false;
      if (end && notificationDate > end) return false;
    }
    
    return true;
  });
};

export const selectUnreadCount = (state) => state.notifications.notificationStats.unreadCount;
export const selectHasUnread = (state) => state.notifications.notificationStats.unreadCount > 0;

export const {
  setWebSocket,
  setWebSocketStatus,
  addNotification,
  showInAppNotification,
  dismissInAppNotification,
  clearInAppNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  removeNotification,
  setFilters,
  clearFilters,
  setPagination,
  resetPagination,
  updateNotificationSettingsLocal,
  archiveNotification,
  dismissSecurityAlert,
  clearSecurityAlerts,
  dismissEmergencyAlert,
  clearEmergencyAlerts,
  updateNotificationStats,
  setLoading,
  clearError,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
