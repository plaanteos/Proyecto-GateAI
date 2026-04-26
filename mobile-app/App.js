/**
 * @format
 * UnionTech Security System - Mobile App
 * Aplicación móvil profesional para gestión de accesos y seguridad empresarial
 * 
 * @version 2.0.0
 * @author UnionTech Development Team
 */

import React, { useEffect } from 'react';
import { StatusBar, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { Provider as ReduxProvider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import FlashMessage from 'react-native-flash-message';
import SplashScreen from 'react-native-splash-screen';

import { store, persistor } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { theme } from './src/styles/theme';
import LoadingScreen from './src/components/LoadingScreen';

const App = () => {
  useEffect(() => {
    // Ocultar splash screen después de que la app se inicialice
    const timer = setTimeout(() => {
      if (Platform.OS === 'android') {
        SplashScreen.hide();
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <ReduxProvider store={store}>
      <PersistGate loading={<LoadingScreen />} persistor={persistor}>
        <PaperProvider theme={theme}>
          <NavigationContainer theme={theme}>
            <StatusBar
              barStyle="light-content"
              backgroundColor={theme.colors.primary}
              translucent={false}
            />
            <AppNavigator />
            <FlashMessage position="top" />
          </NavigationContainer>
        </PaperProvider>
      </PersistGate>
    </ReduxProvider>
  );
};

export default App;
