/**
 * App Initialization Utilities
 * Configuración inicial y servicios de la aplicación
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import NetInfo from '@react-native-community/netinfo';
import { Platform, PermissionsAndroid } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

// Services
import { logError, showInfoMessage } from './errorHandler';

/**
 * Initialize the application
 */
export const initializeApp = async () => {
  try {
    console.log('🚀 Initializing UnionTech Security Mobile App...');
    
    // Check device info
    await checkDeviceInfo();
    
    // Setup network monitoring
    await setupNetworkMonitoring();
    
    // Request necessary permissions
    await requestPermissions();
    
    // Initialize storage
    await initializeStorage();
    
    // Setup app state monitoring
    setupAppStateMonitoring();
    
    console.log('✅ App initialization completed successfully');
    
  } catch (error) {
    console.error('❌ Error during app initialization:', error);
    logError(error, { context: 'appInitialization' });
  }
};

/**
 * Check device information
 */
const checkDeviceInfo = async () => {
  try {
    const deviceInfo = {
      brand: DeviceInfo.getBrand(),
      model: DeviceInfo.getModel(),
      systemName: DeviceInfo.getSystemName(),
      systemVersion: DeviceInfo.getSystemVersion(),
      buildNumber: DeviceInfo.getBuildNumber(),
      version: DeviceInfo.getVersion(),
      bundleId: DeviceInfo.getBundleId(),
      deviceId: await DeviceInfo.getUniqueId(),
      isEmulator: await DeviceInfo.isEmulator(),
      hasNotch: DeviceInfo.hasNotch(),
      hasDynamicIsland: DeviceInfo.hasDynamicIsland(),
    };
    
    console.log('📱 Device Info:', deviceInfo);
    
    // Store device info for analytics
    await AsyncStorage.setItem('deviceInfo', JSON.stringify(deviceInfo));
    
    return deviceInfo;
  } catch (error) {
    console.error('Error getting device info:', error);
    logError(error, { context: 'deviceInfo' });
  }
};

/**
 * Setup network monitoring
 */
const setupNetworkMonitoring = async () => {
  try {
    // Get initial network state
    const netInfo = await NetInfo.fetch();
    console.log('🌐 Network Info:', netInfo);
    
    // Store initial network state
    await AsyncStorage.setItem('networkState', JSON.stringify({
      isConnected: netInfo.isConnected,
      type: netInfo.type,
      isInternetReachable: netInfo.isInternetReachable,
      timestamp: Date.now(),
    }));
    
    // Subscribe to network state changes
    NetInfo.addEventListener(state => {
      console.log('🌐 Network state changed:', state);
      
      AsyncStorage.setItem('networkState', JSON.stringify({
        isConnected: state.isConnected,
        type: state.type,
        isInternetReachable: state.isInternetReachable,
        timestamp: Date.now(),
      }));
      
      // Show network status messages
      if (!state.isConnected) {
        showInfoMessage('Sin Conexión', 'Trabajando en modo offline');
      } else if (state.isConnected && state.isInternetReachable === false) {
        showInfoMessage('Conexión Limitada', 'Conexión a internet limitada');
      }
    });
    
  } catch (error) {
    console.error('Error setting up network monitoring:', error);
    logError(error, { context: 'networkMonitoring' });
  }
};

/**
 * Request necessary permissions
 */
const requestPermissions = async () => {
  try {
    console.log('🔐 Requesting permissions...');
    
    const permissions = [];
    
    if (Platform.OS === 'android') {
      // Android permissions
      permissions.push(
        PERMISSIONS.ANDROID.CAMERA,
        PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
        PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
        PERMISSIONS.ANDROID.USE_BIOMETRIC,
        PERMISSIONS.ANDROID.USE_FINGERPRINT,
        PERMISSIONS.ANDROID.ACCESS_NETWORK_STATE,
        PERMISSIONS.ANDROID.INTERNET,
      );
      
      // Request notification permission (Android 13+)
      if (Platform.Version >= 33) {
        permissions.push(PERMISSIONS.ANDROID.POST_NOTIFICATIONS);
      }
    } else {
      // iOS permissions
      permissions.push(
        PERMISSIONS.IOS.CAMERA,
        PERMISSIONS.IOS.PHOTO_LIBRARY,
        PERMISSIONS.IOS.FACE_ID,
      );
    }
    
    // Check and request permissions
    for (const permission of permissions) {
      try {
        const result = await check(permission);
        
        if (result === RESULTS.DENIED) {
          const requestResult = await request(permission);
          console.log(`📋 Permission ${permission}: ${requestResult}`);
        } else {
          console.log(`📋 Permission ${permission}: ${result}`);
        }
      } catch (permError) {
        console.warn(`Error requesting permission ${permission}:`, permError);
      }
    }
    
    console.log('✅ Permissions check completed');
    
  } catch (error) {
    console.error('Error requesting permissions:', error);
    logError(error, { context: 'permissions' });
  }
};

/**
 * Initialize storage and migration
 */
const initializeStorage = async () => {
  try {
    console.log('💾 Initializing storage...');
    
    // Check if this is first app launch
    const isFirstLaunch = await AsyncStorage.getItem('isFirstLaunch');
    
    if (isFirstLaunch === null) {
      // First launch setup
      await AsyncStorage.setItem('isFirstLaunch', 'false');
      await AsyncStorage.setItem('appInstallDate', new Date().toISOString());
      
      console.log('🎉 First app launch detected');
    }
    
    // Store app version for migration purposes
    const currentVersion = DeviceInfo.getVersion();
    const storedVersion = await AsyncStorage.getItem('appVersion');
    
    if (storedVersion !== currentVersion) {
      console.log(`📱 App updated from ${storedVersion || 'unknown'} to ${currentVersion}`);
      await AsyncStorage.setItem('appVersion', currentVersion);
      
      // Perform migration if needed
      await performStorageMigration(storedVersion, currentVersion);
    }
    
    // Initialize user preferences if not exists
    const userPreferences = await AsyncStorage.getItem('userPreferences');
    if (!userPreferences) {
      const defaultPreferences = {
        theme: 'light',
        language: 'es',
        notifications: true,
        biometricAuth: false,
        autoLock: true,
        autoLockTime: 300000, // 5 minutes
        soundEnabled: true,
        hapticFeedback: true,
      };
      
      await AsyncStorage.setItem('userPreferences', JSON.stringify(defaultPreferences));
    }
    
    console.log('✅ Storage initialization completed');
    
  } catch (error) {
    console.error('Error initializing storage:', error);
    logError(error, { context: 'storageInitialization' });
  }
};

/**
 * Perform storage migration between app versions
 */
const performStorageMigration = async (fromVersion, toVersion) => {
  try {
    console.log(`🔄 Performing storage migration from ${fromVersion} to ${toVersion}`);
    
    // Example migration logic
    if (!fromVersion || fromVersion < '1.0.0') {
      // Migration from pre-1.0.0 versions
      console.log('Migrating from pre-1.0.0...');
    }
    
    if (fromVersion && fromVersion < '2.0.0') {
      // Migration from pre-2.0.0 versions
      console.log('Migrating from pre-2.0.0...');
      
      // Example: Migrate old user data format
      const oldUserData = await AsyncStorage.getItem('userData');
      if (oldUserData) {
        try {
          const parsedData = JSON.parse(oldUserData);
          // Transform data format
          const newUserData = {
            ...parsedData,
            version: '2.0.0',
            migrated: true,
            migratedAt: new Date().toISOString(),
          };
          await AsyncStorage.setItem('userDataV2', JSON.stringify(newUserData));
        } catch (parseError) {
          console.warn('Error parsing old user data:', parseError);
        }
      }
    }
    
    console.log('✅ Storage migration completed');
    
  } catch (error) {
    console.error('Error during storage migration:', error);
    logError(error, { context: 'storageMigration', fromVersion, toVersion });
  }
};

/**
 * Setup app state monitoring
 */
const setupAppStateMonitoring = () => {
  try {
    const { AppState } = require('react-native');
    
    let appState = AppState.currentState;
    
    const handleAppStateChange = (nextAppState) => {
      console.log(`📱 App state changed from ${appState} to ${nextAppState}`);
      
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        console.log('🎯 App has come to the foreground');
        // App resumed from background
        AsyncStorage.setItem('lastActiveTime', new Date().toISOString());
      } else if (appState === 'active' && nextAppState.match(/inactive|background/)) {
        console.log('🔒 App has gone to the background');
        // App went to background
        AsyncStorage.setItem('lastBackgroundTime', new Date().toISOString());
      }
      
      appState = nextAppState;
      AsyncStorage.setItem('currentAppState', appState);
    };
    
    AppState.addEventListener('change', handleAppStateChange);
    
    console.log('✅ App state monitoring setup completed');
    
  } catch (error) {
    console.error('Error setting up app state monitoring:', error);
    logError(error, { context: 'appStateMonitoring' });
  }
};

/**
 * Get app initialization status
 */
export const getInitializationStatus = async () => {
  try {
    const status = {
      isFirstLaunch: await AsyncStorage.getItem('isFirstLaunch') === null,
      appVersion: await AsyncStorage.getItem('appVersion'),
      installDate: await AsyncStorage.getItem('appInstallDate'),
      lastActiveTime: await AsyncStorage.getItem('lastActiveTime'),
      deviceInfo: await AsyncStorage.getItem('deviceInfo'),
      networkState: await AsyncStorage.getItem('networkState'),
      userPreferences: await AsyncStorage.getItem('userPreferences'),
    };
    
    return status;
  } catch (error) {
    console.error('Error getting initialization status:', error);
    logError(error, { context: 'getInitializationStatus' });
    return null;
  }
};

/**
 * Clear app data (for logout or reset)
 */
export const clearAppData = async (keepUserPreferences = true) => {
  try {
    console.log('🧹 Clearing app data...');
    
    const keysToKeep = [
      'deviceInfo',
      'appVersion',
      'appInstallDate',
      'isFirstLaunch',
    ];
    
    if (keepUserPreferences) {
      keysToKeep.push('userPreferences');
    }
    
    // Get all keys
    const allKeys = await AsyncStorage.getAllKeys();
    
    // Filter keys to remove
    const keysToRemove = allKeys.filter(key => !keysToKeep.includes(key));
    
    // Remove keys
    await AsyncStorage.multiRemove(keysToRemove);
    
    console.log(`🗑️ Removed ${keysToRemove.length} storage keys`);
    console.log('✅ App data cleared successfully');
    
  } catch (error) {
    console.error('Error clearing app data:', error);
    logError(error, { context: 'clearAppData' });
  }
};

/**
 * Get storage usage info
 */
export const getStorageInfo = async () => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const allData = await AsyncStorage.multiGet(allKeys);
    
    let totalSize = 0;
    const itemSizes = {};
    
    allData.forEach(([key, value]) => {
      const size = new Blob([value || '']).size;
      itemSizes[key] = size;
      totalSize += size;
    });
    
    return {
      totalKeys: allKeys.length,
      totalSize,
      itemSizes,
      formattedSize: formatBytes(totalSize),
    };
  } catch (error) {
    console.error('Error getting storage info:', error);
    logError(error, { context: 'getStorageInfo' });
    return null;
  }
};

/**
 * Format bytes to human readable string
 */
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export default {
  initializeApp,
  getInitializationStatus,
  clearAppData,
  getStorageInfo,
};
