/**
 * App Navigator - Navegación principal de la aplicación
 * Configuración de React Navigation con Stack, Tab y Drawer navigation
 */

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { selectIsAuthenticated, selectIsLoading, verifyTokenAsync } from '../store/slices/authSlice';
import { theme } from '../styles/theme';

// Importar pantallas
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import BiometricSetupScreen from '../screens/BiometricSetupScreen';

import DashboardScreen from '../screens/DashboardScreen';
import VisitorsScreen from '../screens/VisitorsScreen';
import RegisterVisitorScreen from '../screens/RegisterVisitorScreen';
import VisitorDetailsScreen from '../screens/VisitorDetailsScreen';
import AccessControlScreen from '../screens/AccessControlScreen';
import BiometricValidationScreen from '../screens/BiometricValidationScreen';
import ReportsScreen from '../screens/ReportsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SecurityAlertsScreen from '../screens/SecurityAlertsScreen';
import AccessLogsScreen from '../screens/AccessLogsScreen';
import ZoneManagementScreen from '../screens/ZoneManagementScreen';

// Nuevas pantallas mejoradas
import PropertyManagementScreen from '../screens/PropertyManagementScreen';
import GuestManagementScreen from '../screens/GuestManagementScreen';
import NotificationCenterScreen from '../screens/NotificationCenterScreen';
import EnhancedUserProfileScreen from '../screens/EnhancedUserProfileScreen';

import CustomDrawerContent from '../components/CustomDrawerContent';
import LoadingScreen from '../components/LoadingScreen';

// Crear navegadores
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

/**
 * Navegador de pestañas inferior para pantallas principales
 */
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
              break;
            case 'Visitors':
              iconName = focused ? 'account-group' : 'account-group-outline';
              break;
            case 'AccessControl':
              iconName = focused ? 'shield-check' : 'shield-check-outline';
              break;
            case 'Reports':
              iconName = focused ? 'chart-line' : 'chart-line-variant';
              break;
            default:
              iconName = 'circle';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          elevation: 8,
          shadowOpacity: 0.1,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: -2 },
          height: 60,
          paddingBottom: 5,
          paddingTop: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: theme.typography.medium,
          marginTop: 2,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Inicio',
        }}
      />
      <Tab.Screen 
        name="Visitors" 
        component={VisitorsScreen}
        options={{
          tabBarLabel: 'Visitantes',
        }}
      />
      <Tab.Screen 
        name="AccessControl" 
        component={AccessControlScreen}
        options={{
          tabBarLabel: 'Acceso',
        }}
      />
      <Tab.Screen 
        name="Reports" 
        component={ReportsScreen}
        options={{
          tabBarLabel: 'Reportes',
        }}
      />
    </Tab.Navigator>
  );
}

/**
 * Navegador lateral (drawer) para navegación extendida
 */
function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerStyle: {
          backgroundColor: theme.colors.surface,
          width: 280,
        },
        drawerActiveTintColor: theme.colors.primary,
        drawerInactiveTintColor: theme.colors.textSecondary,
        drawerLabelStyle: {
          fontFamily: theme.typography.medium,
          fontSize: 16,
          marginLeft: -20,
        },
        headerStyle: {
          backgroundColor: theme.colors.primary,
          elevation: 4,
          shadowOpacity: 0.1,
        },
        headerTintColor: theme.colors.onPrimary,
        headerTitleStyle: {
          fontFamily: theme.typography.bold,
          fontSize: 20,
        },
      }}
    >
      <Drawer.Screen 
        name="MainTabs" 
        component={TabNavigator}
        options={{
          title: 'UnionTech Security',
          drawerIcon: ({ color, size }) => (
            <Icon name="home" size={size} color={color} />
          ),
          drawerLabel: 'Inicio',
        }}
      />
      <Drawer.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: 'Mi Perfil',
          drawerIcon: ({ color, size }) => (
            <Icon name="account" size={size} color={color} />
          ),
          drawerLabel: 'Perfil',
        }}
      />
      <Drawer.Screen 
        name="SecurityAlerts" 
        component={SecurityAlertsScreen}
        options={{
          title: 'Alertas de Seguridad',
          drawerIcon: ({ color, size }) => (
            <Icon name="alert" size={size} color={color} />
          ),
          drawerLabel: 'Alertas',
        }}
      />
      <Drawer.Screen 
        name="AccessLogs" 
        component={AccessLogsScreen}
        options={{
          title: 'Logs de Acceso',
          drawerIcon: ({ color, size }) => (
            <Icon name="history" size={size} color={color} />
          ),
          drawerLabel: 'Historial',
        }}
      />
      <Drawer.Screen 
        name="ZoneManagement" 
        component={ZoneManagementScreen}
        options={{
          title: 'Gestión de Zonas',
          drawerIcon: ({ color, size }) => (
            <Icon name="map-marker-multiple" size={size} color={color} />
          ),
          drawerLabel: 'Zonas',
        }}
      />
      <Drawer.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          title: 'Configuración',
          drawerIcon: ({ color, size }) => (
            <Icon name="cog" size={size} color={color} />
          ),
          drawerLabel: 'Configuración',
        }}
      />
      
      {/* Nuevas pantallas mejoradas en el drawer */}
      <Drawer.Screen 
        name="PropertyManagement" 
        component={PropertyManagementScreen}
        options={{
          title: 'Gestión de Propiedades',
          drawerIcon: ({ color, size }) => (
            <Icon name="office-building" size={size} color={color} />
          ),
          drawerLabel: 'Mis Propiedades',
        }}
      />
      
      <Drawer.Screen 
        name="GuestManagement" 
        component={GuestManagementScreen}
        options={{
          title: 'Gestión de Invitados',
          drawerIcon: ({ color, size }) => (
            <Icon name="account-multiple-plus" size={size} color={color} />
          ),
          drawerLabel: 'Invitados',
        }}
      />
      
      <Drawer.Screen 
        name="NotificationCenter" 
        component={NotificationCenterScreen}
        options={{
          title: 'Centro de Notificaciones',
          drawerIcon: ({ color, size }) => (
            <Icon name="bell" size={size} color={color} />
          ),
          drawerLabel: 'Notificaciones',
        }}
      />
      
      <Drawer.Screen 
        name="EnhancedUserProfile" 
        component={EnhancedUserProfileScreen}
        options={{
          title: 'Mi Perfil',
          drawerIcon: ({ color, size }) => (
            <Icon name="account-circle" size={size} color={color} />
          ),
          drawerLabel: 'Mi Perfil',
        }}
      />
    </Drawer.Navigator>
  );
}

/**
 * Stack de pantallas de autenticación
 */
function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{
          animation: 'fade',
        }}
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen}
        options={{
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen 
        name="ForgotPassword" 
        component={ForgotPasswordScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="BiometricSetup" 
        component={BiometricSetupScreen}
        options={{
          animation: 'fade_from_bottom',
        }}
      />
    </Stack.Navigator>
  );
}

/**
 * Stack principal de la aplicación autenticada
 */
function MainStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen 
        name="DrawerNavigator" 
        component={DrawerNavigator}
        options={{
          animation: 'fade',
        }}
      />
      
      {/* Pantallas modales y específicas */}
      <Stack.Screen 
        name="RegisterVisitor" 
        component={RegisterVisitorScreen}
        options={{
          headerShown: true,
          title: 'Registrar Visitante',
          animation: 'slide_from_bottom',
          presentation: 'modal',
          headerStyle: {
            backgroundColor: theme.colors.primary,
          },
          headerTintColor: theme.colors.onPrimary,
          headerTitleStyle: {
            fontFamily: theme.typography.bold,
          },
        }}
      />
      
      <Stack.Screen 
        name="VisitorDetails" 
        component={VisitorDetailsScreen}
        options={{
          headerShown: true,
          title: 'Detalles del Visitante',
          animation: 'slide_from_right',
          headerStyle: {
            backgroundColor: theme.colors.primary,
          },
          headerTintColor: theme.colors.onPrimary,
          headerTitleStyle: {
            fontFamily: theme.typography.bold,
          },
        }}
      />
      
      <Stack.Screen 
        name="BiometricValidation" 
        component={BiometricValidationScreen}
        options={{
          headerShown: true,
          title: 'Validación Biométrica',
          animation: 'fade_from_bottom',
          presentation: 'modal',
          headerStyle: {
            backgroundColor: theme.colors.primary,
          },
          headerTintColor: theme.colors.onPrimary,
          headerTitleStyle: {
            fontFamily: theme.typography.bold,
          },
        }}
      />
      
      {/* Nuevas pantallas mejoradas */}
      <Stack.Screen 
        name="PropertyManagement" 
        component={PropertyManagementScreen}
        options={{
          headerShown: false,
          title: 'Gestión de Propiedades',
          animation: 'slide_from_right',
        }}
      />
      
      <Stack.Screen 
        name="GuestManagement" 
        component={GuestManagementScreen}
        options={{
          headerShown: false,
          title: 'Gestión de Invitados',
          animation: 'slide_from_right',
        }}
      />
      
      <Stack.Screen 
        name="NotificationCenter" 
        component={NotificationCenterScreen}
        options={{
          headerShown: false,
          title: 'Centro de Notificaciones',
          animation: 'slide_from_right',
        }}
      />
      
      <Stack.Screen 
        name="EnhancedUserProfile" 
        component={EnhancedUserProfileScreen}
        options={{
          headerShown: false,
          title: 'Mi Perfil',
          animation: 'slide_from_right',
        }}
      />
    </Stack.Navigator>
  );
}

/**
 * Pantalla de carga mientras se verifica la autenticación
 */
function AuthLoadingScreen() {
  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    }}>
      <ActivityIndicator 
        size="large" 
        color={theme.colors.primary} 
      />
    </View>
  );
}

/**
 * Navegador principal de la aplicación
 */
export default function AppNavigator() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectIsLoading);
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  /**
   * Inicializar la aplicación
   */
  const initializeApp = async () => {
    try {
      // Verificar si hay token almacenado
      const token = await AsyncStorage.getItem('@auth_token');
      
      if (token) {
        // Verificar validez del token
        await dispatch(verifyTokenAsync()).unwrap();
      }
    } catch (error) {
      console.log('Error al verificar token:', error);
      // El token no es válido, continuar con flujo de login
    } finally {
      // Simular tiempo de splash screen
      setTimeout(() => {
        setIsAppReady(true);
      }, 2000);
    }
  };

  // Mostrar splash screen mientras la app se inicializa
  if (!isAppReady) {
    return <SplashScreen />;
  }

  // Mostrar loading screen mientras se verifica la autenticación
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer
      theme={{
        dark: false,
        colors: {
          primary: theme.colors.primary,
          background: theme.colors.background,
          card: theme.colors.surface,
          text: theme.colors.text,
          border: theme.colors.border,
          notification: theme.colors.error,
        },
      }}
    >
      {isAuthenticated ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

/**
 * Configuración de navegación para deep linking
 */
export const navigationConfig = {
  screens: {
    // Auth screens
    Login: 'login',
    Register: 'register',
    ForgotPassword: 'forgot-password',
    BiometricSetup: 'biometric-setup',
    
    // Main screens
    DrawerNavigator: {
      screens: {
        MainTabs: {
          screens: {
            Dashboard: 'dashboard',
            Visitors: 'visitors',
            AccessControl: 'access-control',
            Reports: 'reports',
          },
        },
        Profile: 'profile',
        SecurityAlerts: 'security-alerts',
        AccessLogs: 'access-logs',
        ZoneManagement: 'zone-management',
        Settings: 'settings',
      },
    },
    
    // Modal screens
    RegisterVisitor: 'register-visitor',
    VisitorDetails: 'visitor/:id',
    BiometricValidation: 'biometric-validation',
  },
};

/**
 * Hook para navegación tipada
 */
export const useAppNavigation = () => {
  return useNavigation();
};

/**
 * Hook para rutas tipadas
 */
export const useAppRoute = () => {
  return useRoute();
};
