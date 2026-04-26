/**
 * UnionTech Mobile App - Redux Store
 * Gestión del estado global de la aplicación
 */

import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from '@reduxjs/toolkit';

// Importar reducers
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import biometricReducer from './slices/biometricSlice';
import visitorsReducer from './slices/visitorsSlice';
import accessReducer from './slices/accessSlice';
import settingsReducer from './slices/settingsSlice';
import uiReducer from './slices/uiSlice';
import propertiesReducer from './slices/propertiesSlice';
import guestsReducer from './slices/guestsSlice';
import notificationsReducer from './slices/notificationsSlice';

// Configuración de persistencia
const persistConfig = {
  key: 'uniontech-mobile',
  storage: AsyncStorage,
  whitelist: ['auth', 'user', 'settings', 'properties'], // Solo persistir estos reducers
  blacklist: ['ui', 'notifications', 'guests'], // No persistir UI state y datos en tiempo real
};

// Combinar todos los reducers
const rootReducer = combineReducers({
  auth: authReducer,
  user: userReducer,
  biometric: biometricReducer,
  visitors: visitorsReducer,
  access: accessReducer,
  settings: settingsReducer,
  ui: uiReducer,
  properties: propertiesReducer,
  guests: guestsReducer,
  notifications: notificationsReducer,
});

// Crear reducer persistido
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configurar store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: __DEV__, // Solo en desarrollo
});

// Crear persistor
export const persistor = persistStore(store);

// Export store and persistor
export { store, persistor };
