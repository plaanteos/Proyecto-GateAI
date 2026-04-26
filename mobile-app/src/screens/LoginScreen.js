/**
 * Login Screen - Pantalla de inicio de sesión
 * Interfaz de autenticación con soporte biométrico
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { TextInput, Button, Checkbox } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch, useSelector } from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';

import {
  loginAsync,
  biometricLoginAsync,
  selectIsLoading,
  selectError,
  clearError,
  selectBiometricEnabled,
} from '../store/slices/authSlice';
import { theme } from '../styles/theme';
import LoadingOverlay from '../components/LoadingOverlay';
import { authService } from '../services/authService';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const dispatch = useDispatch();
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);
  const biometricEnabled = useSelector(selectBiometricEnabled);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [biometryType, setBiometryType] = useState(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    startAnimations();
    checkBiometricAvailability();
    loadStoredCredentials();
    
    return () => {
      dispatch(clearError());
    };
  }, []);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const checkBiometricAvailability = async () => {
    try {
      const type = await authService.getBiometryType();
      setBiometryType(type);
    } catch (error) {
      console.log('Biometría no disponible:', error);
    }
  };

  const loadStoredCredentials = async () => {
    try {
      const storedUser = await authService.getStoredUser();
      if (storedUser && storedUser.email) {
        setEmail(storedUser.email);
        setRememberMe(true);
      }
    } catch (error) {
      console.log('Error al cargar credenciales:', error);
    }
  };

  const validateForm = () => {
    let valid = true;
    
    // Validar email
    if (!email.trim()) {
      setEmailError('El email es requerido');
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Email inválido');
      valid = false;
    } else {
      setEmailError('');
    }

    // Validar contraseña
    if (!password.trim()) {
      setPasswordError('La contraseña es requerida');
      valid = false;
    } else if (password.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres');
      valid = false;
    } else {
      setPasswordError('');
    }

    return valid;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      await dispatch(loginAsync({
        email: email.trim(),
        password,
        rememberMe,
      })).unwrap();
    } catch (error) {
      Alert.alert('Error de Login', error || 'Credenciales inválidas');
    }
  };

  const handleBiometricLogin = async () => {
    try {
      await dispatch(biometricLoginAsync()).unwrap();
    } catch (error) {
      Alert.alert('Error Biométrico', error || 'Error en autenticación biométrica');
    }
  };

  const getBiometricIcon = () => {
    switch (biometryType) {
      case 'FaceID':
        return 'face-recognition';
      case 'TouchID':
      case 'Fingerprint':
        return 'fingerprint';
      default:
        return 'security';
    }
  };

  const getBiometricText = () => {
    switch (biometryType) {
      case 'FaceID':
        return 'Usar Face ID';
      case 'TouchID':
        return 'Usar Touch ID';
      case 'Fingerprint':
        return 'Usar Huella';
      default:
        return 'Autenticación Biométrica';
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryDark]}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.logoContainer}>
              <Icon
                name="shield-check"
                size={60}
                color={theme.colors.onPrimary}
              />
            </View>
            <Text style={styles.title}>Bienvenido</Text>
            <Text style={styles.subtitle}>Inicia sesión en UnionTech Security</Text>
          </Animated.View>

          {/* Formulario */}
          <Animated.View
            style={[
              styles.formContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.form}>
              {/* Campo Email */}
              <TextInput
                label="Email"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setEmailError('');
                }}
                mode="outlined"
                style={styles.input}
                error={!!emailError}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                left={<TextInput.Icon icon="email" />}
                theme={{
                  colors: {
                    primary: theme.colors.primary,
                    outline: theme.colors.border,
                  },
                }}
              />
              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

              {/* Campo Contraseña */}
              <TextInput
                label="Contraseña"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setPasswordError('');
                }}
                mode="outlined"
                style={styles.input}
                error={!!passwordError}
                secureTextEntry={!showPassword}
                autoComplete="password"
                left={<TextInput.Icon icon="lock" />}
                right={
                  <TextInput.Icon
                    icon={showPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
                theme={{
                  colors: {
                    primary: theme.colors.primary,
                    outline: theme.colors.border,
                  },
                }}
              />
              {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

              {/* Remember Me */}
              <View style={styles.checkboxContainer}>
                <Checkbox
                  status={rememberMe ? 'checked' : 'unchecked'}
                  onPress={() => setRememberMe(!rememberMe)}
                  color={theme.colors.primary}
                />
                <Text style={styles.checkboxLabel}>Recordar mis datos</Text>
              </View>

              {/* Error general */}
              {error ? (
                <View style={styles.errorContainer}>
                  <Icon name="alert-circle" size={20} color={theme.colors.error} />
                  <Text style={styles.errorMessage}>{error}</Text>
                </View>
              ) : null}

              {/* Botón Login */}
              <Button
                mode="contained"
                onPress={handleLogin}
                loading={isLoading}
                disabled={isLoading}
                style={styles.loginButton}
                labelStyle={styles.loginButtonText}
                contentStyle={styles.loginButtonContent}
              >
                Iniciar Sesión
              </Button>

              {/* Botón Biométrico */}
              {biometryType && biometricEnabled && (
                <TouchableOpacity
                  style={styles.biometricButton}
                  onPress={handleBiometricLogin}
                  disabled={isLoading}
                  activeOpacity={0.7}
                >
                  <Icon
                    name={getBiometricIcon()}
                    size={24}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.biometricButtonText}>
                    {getBiometricText()}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Enlaces */}
              <View style={styles.linksContainer}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('ForgotPassword')}
                  style={styles.linkButton}
                >
                  <Text style={styles.linkText}>¿Olvidaste tu contraseña?</Text>
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity
                  onPress={() => navigation.navigate('Register')}
                  style={styles.linkButton}
                >
                  <Text style={styles.linkText}>
                    ¿No tienes cuenta? <Text style={styles.linkTextBold}>Regístrate</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </ScrollView>

        {isLoading && <LoadingOverlay message="Iniciando sesión..." />}
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  title: {
    fontSize: 28,
    fontFamily: theme.typography.bold,
    color: theme.colors.onPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: theme.typography.regular,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.medium,
  },
  form: {
    width: '100%',
  },
  input: {
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },
  errorText: {
    fontSize: 12,
    color: theme.colors.error,
    marginBottom: theme.spacing.sm,
    marginLeft: theme.spacing.sm,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.md,
  },
  checkboxLabel: {
    fontSize: 14,
    fontFamily: theme.typography.medium,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.errorContainer,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.md,
  },
  errorMessage: {
    fontSize: 14,
    color: theme.colors.error,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  loginButton: {
    marginVertical: theme.spacing.md,
    backgroundColor: theme.colors.primary,
  },
  loginButtonContent: {
    height: 50,
  },
  loginButtonText: {
    fontSize: 16,
    fontFamily: theme.typography.bold,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    marginBottom: theme.spacing.lg,
  },
  biometricButtonText: {
    fontSize: 16,
    fontFamily: theme.typography.medium,
    color: theme.colors.primary,
    marginLeft: theme.spacing.sm,
  },
  linksContainer: {
    alignItems: 'center',
  },
  linkButton: {
    paddingVertical: theme.spacing.sm,
  },
  linkText: {
    fontSize: 14,
    fontFamily: theme.typography.regular,
    color: theme.colors.primary,
    textAlign: 'center',
  },
  linkTextBold: {
    fontFamily: theme.typography.bold,
  },
  divider: {
    width: '30%',
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.md,
  },
});
