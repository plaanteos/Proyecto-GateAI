/**
 * Register Screen - Pantalla de Registro de Usuario
 * Permite el registro de nuevos usuarios administradores
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  HelperText,
  Surface,
  Avatar,
  Chip,
  Divider,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Store
import { registerUser } from '../store/slices/authSlice';

// Styles
import { theme } from '../styles/theme';

// Utils
import { showErrorMessage, showSuccessMessage } from '../utils/errorHandler';

const RegisterScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector(state => state.auth);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    role: 'admin',
    password: '',
    confirmPassword: '',
  });

  // Validation state
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // UI state
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [selectedRole, setSelectedRole] = useState('admin');

  // Available roles
  const roles = [
    { value: 'admin', label: 'Administrador', icon: 'shield-account' },
    { value: 'security', label: 'Seguridad', icon: 'security' },
    { value: 'reception', label: 'Recepción', icon: 'desk' },
  ];

  // Available departments
  const departments = [
    'Recursos Humanos',
    'Tecnología',
    'Seguridad',
    'Administración',
    'Operaciones',
    'Recepción',
    'Otro',
  ];

  useEffect(() => {
    validateForm();
  }, [formData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Mark field as touched
    setTouched(prev => ({
      ...prev,
      [field]: true,
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    // First name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es obligatorio';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'El nombre debe tener al menos 2 caracteres';
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'El apellido es obligatorio';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'El apellido debe tener al menos 2 caracteres';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'El email es obligatorio';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'El formato del email no es válido';
    }

    // Phone validation
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es obligatorio';
    } else if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'El formato del teléfono no es válido';
    }

    // Department validation
    if (!formData.department.trim()) {
      newErrors.department = 'El departamento es obligatorio';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'La contraseña es obligatoria';
    } else if (formData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'La contraseña debe contener mayúsculas, minúsculas y números';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu contraseña';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      showErrorMessage('Errores en el formulario', 'Por favor, corrige los errores antes de continuar');
      return;
    }

    try {
      const userData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        department: formData.department.trim(),
        role: selectedRole,
        password: formData.password,
      };

      const result = await dispatch(registerUser(userData)).unwrap();
      
      if (result.success) {
        showSuccessMessage('Registro Exitoso', 'Usuario registrado correctamente');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  const isFormValid = () => {
    return Object.keys(errors).length === 0 && 
           formData.firstName && 
           formData.lastName && 
           formData.email && 
           formData.phone && 
           formData.department && 
           formData.password && 
           formData.confirmPassword;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Surface style={styles.header}>
            <Avatar.Icon
              size={80}
              icon="account-plus"
              style={styles.avatar}
            />
            <Text variant="headlineSmall" style={styles.title}>
              Nuevo Usuario
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Registra un nuevo usuario administrador
            </Text>
          </Surface>

          {/* Personal Information */}
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <Icon name="account" size={24} color={theme.colors.primary} />
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Información Personal
                </Text>
              </View>

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <TextInput
                    label="Nombre *"
                    value={formData.firstName}
                    onChangeText={(value) => handleInputChange('firstName', value)}
                    error={touched.firstName && errors.firstName}
                    mode="outlined"
                    style={styles.input}
                  />
                  <HelperText type="error" visible={touched.firstName && errors.firstName}>
                    {errors.firstName}
                  </HelperText>
                </View>

                <View style={styles.halfInput}>
                  <TextInput
                    label="Apellido *"
                    value={formData.lastName}
                    onChangeText={(value) => handleInputChange('lastName', value)}
                    error={touched.lastName && errors.lastName}
                    mode="outlined"
                    style={styles.input}
                  />
                  <HelperText type="error" visible={touched.lastName && errors.lastName}>
                    {errors.lastName}
                  </HelperText>
                </View>
              </View>

              <TextInput
                label="Email *"
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                error={touched.email && errors.email}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
                left={<TextInput.Icon icon="email" />}
              />
              <HelperText type="error" visible={touched.email && errors.email}>
                {errors.email}
              </HelperText>

              <TextInput
                label="Teléfono *"
                value={formData.phone}
                onChangeText={(value) => handleInputChange('phone', value)}
                error={touched.phone && errors.phone}
                mode="outlined"
                keyboardType="phone-pad"
                style={styles.input}
                left={<TextInput.Icon icon="phone" />}
              />
              <HelperText type="error" visible={touched.phone && errors.phone}>
                {errors.phone}
              </HelperText>

              <TextInput
                label="Departamento *"
                value={formData.department}
                onChangeText={(value) => handleInputChange('department', value)}
                error={touched.department && errors.department}
                mode="outlined"
                style={styles.input}
                left={<TextInput.Icon icon="office-building" />}
              />
              <HelperText type="error" visible={touched.department && errors.department}>
                {errors.department}
              </HelperText>
            </Card.Content>
          </Card>

          {/* Role Selection */}
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <Icon name="shield-account" size={24} color={theme.colors.primary} />
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Rol del Usuario
                </Text>
              </View>

              <View style={styles.rolesContainer}>
                {roles.map((role) => (
                  <Chip
                    key={role.value}
                    icon={role.icon}
                    selected={selectedRole === role.value}
                    onPress={() => setSelectedRole(role.value)}
                    style={[
                      styles.roleChip,
                      selectedRole === role.value && styles.selectedRoleChip,
                    ]}
                    textStyle={[
                      styles.roleChipText,
                      selectedRole === role.value && styles.selectedRoleChipText,
                    ]}
                  >
                    {role.label}
                  </Chip>
                ))}
              </View>
            </Card.Content>
          </Card>

          {/* Security */}
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <Icon name="lock" size={24} color={theme.colors.primary} />
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Seguridad
                </Text>
              </View>

              <TextInput
                label="Contraseña *"
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                error={touched.password && errors.password}
                mode="outlined"
                secureTextEntry={!passwordVisible}
                style={styles.input}
                left={<TextInput.Icon icon="lock" />}
                right={
                  <TextInput.Icon
                    icon={passwordVisible ? 'eye-off' : 'eye'}
                    onPress={() => setPasswordVisible(!passwordVisible)}
                  />
                }
              />
              <HelperText type="error" visible={touched.password && errors.password}>
                {errors.password}
              </HelperText>

              <TextInput
                label="Confirmar Contraseña *"
                value={formData.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                error={touched.confirmPassword && errors.confirmPassword}
                mode="outlined"
                secureTextEntry={!confirmPasswordVisible}
                style={styles.input}
                left={<TextInput.Icon icon="lock-check" />}
                right={
                  <TextInput.Icon
                    icon={confirmPasswordVisible ? 'eye-off' : 'eye'}
                    onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                  />
                }
              />
              <HelperText type="error" visible={touched.confirmPassword && errors.confirmPassword}>
                {errors.confirmPassword}
              </HelperText>
            </Card.Content>
          </Card>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleRegister}
              loading={loading}
              disabled={!isFormValid() || loading}
              style={styles.registerButton}
              contentStyle={styles.buttonContent}
              icon="account-plus"
            >
              Registrar Usuario
            </Button>

            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              disabled={loading}
              style={styles.cancelButton}
              contentStyle={styles.buttonContent}
            >
              Cancelar
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.md,
    elevation: 2,
  },
  avatar: {
    backgroundColor: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  title: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  card: {
    margin: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    marginLeft: theme.spacing.sm,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
  input: {
    marginBottom: theme.spacing.xs,
  },
  rolesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  roleChip: {
    marginBottom: theme.spacing.sm,
  },
  selectedRoleChip: {
    backgroundColor: theme.colors.primary,
  },
  roleChipText: {
    color: theme.colors.onSurface,
  },
  selectedRoleChipText: {
    color: theme.colors.onPrimary,
  },
  buttonContainer: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  registerButton: {
    marginBottom: theme.spacing.md,
  },
  cancelButton: {
    borderColor: theme.colors.outline,
  },
  buttonContent: {
    height: 50,
  },
});

export default RegisterScreen;
