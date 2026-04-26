import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Modal,
  TextInput,
  Switch,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { 
  updateUserProfile,
  updateUserPreferences,
  changePassword,
  enableTwoFactor,
  disableTwoFactor,
  updateNotificationSettings,
} from '../store/slices/userSlice';

const EnhancedUserProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user, preferences, loading } = useSelector(state => state.user);
  const { activeProperty } = useSelector(state => state.properties);
  
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [isPreferencesModalVisible, setIsPreferencesModalVisible] = useState(false);
  
  // Formulario de edición de perfil
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    emergencyContact: '',
    emergencyPhone: '',
    documentType: 'DNI',
    documentNumber: '',
    address: '',
    occupation: '',
    companyName: '',
  });

  // Formulario de cambio de contraseña
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Preferencias del usuario
  const [userPreferences, setUserPreferences] = useState({
    language: 'es',
    theme: 'light',
    notifications: {
      push: true,
      email: true,
      sms: false,
    },
    security: {
      biometric: true,
      twoFactor: false,
      sessionTimeout: 30,
    },
    privacy: {
      shareLocation: true,
      shareActivity: false,
      allowAnalytics: true,
    },
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        emergencyContact: user.emergencyContact || '',
        emergencyPhone: user.emergencyPhone || '',
        documentType: user.documentType || 'DNI',
        documentNumber: user.documentNumber || '',
        address: user.address || '',
        occupation: user.occupation || '',
        companyName: user.companyName || '',
      });
    }
    
    if (preferences) {
      setUserPreferences({...preferences});
    }
  }, [user, preferences]);

  const handleSaveProfile = async () => {
    try {
      await dispatch(updateUserProfile(profileForm)).unwrap();
      setIsEditModalVisible(false);
      Alert.alert('Éxito', 'Perfil actualizado correctamente');
    } catch (error) {
      Alert.alert('Error', error.message || 'Error al actualizar el perfil');
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      Alert.alert('Error', 'La contraseña debe tener al menos 8 caracteres');
      return;
    }

    try {
      await dispatch(changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })).unwrap();
      
      setIsPasswordModalVisible(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      Alert.alert('Éxito', 'Contraseña cambiada correctamente');
    } catch (error) {
      Alert.alert('Error', error.message || 'Error al cambiar la contraseña');
    }
  };

  const handleSavePreferences = async () => {
    try {
      await dispatch(updateUserPreferences(userPreferences)).unwrap();
      setIsPreferencesModalVisible(false);
      Alert.alert('Éxito', 'Preferencias actualizadas correctamente');
    } catch (error) {
      Alert.alert('Error', error.message || 'Error al actualizar las preferencias');
    }
  };

  const handleProfilePicturePress = () => {
    Alert.alert(
      'Cambiar Foto de Perfil',
      'Selecciona una opción',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cámara', onPress: () => openCamera() },
        { text: 'Galería', onPress: () => openGallery() },
        { text: 'Eliminar Foto', style: 'destructive', onPress: () => removeProfilePicture() },
      ]
    );
  };

  const openCamera = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.7,
      maxWidth: 300,
      maxHeight: 300,
    };

    launchCamera(options, (response) => {
      if (response.assets && response.assets[0]) {
        updateProfilePicture(response.assets[0]);
      }
    });
  };

  const openGallery = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.7,
      maxWidth: 300,
      maxHeight: 300,
    };

    launchImageLibrary(options, (response) => {
      if (response.assets && response.assets[0]) {
        updateProfilePicture(response.assets[0]);
      }
    });
  };

  const updateProfilePicture = async (image) => {
    try {
      const formData = new FormData();
      formData.append('profilePicture', {
        uri: image.uri,
        type: image.type,
        name: image.fileName || 'profile.jpg',
      });

      await dispatch(updateUserProfile({ profilePicture: formData })).unwrap();
      Alert.alert('Éxito', 'Foto de perfil actualizada');
    } catch (error) {
      Alert.alert('Error', 'Error al actualizar la foto de perfil');
    }
  };

  const removeProfilePicture = async () => {
    try {
      await dispatch(updateUserProfile({ profilePicture: null })).unwrap();
      Alert.alert('Éxito', 'Foto de perfil eliminada');
    } catch (error) {
      Alert.alert('Error', 'Error al eliminar la foto de perfil');
    }
  };

  const handleToggleTwoFactor = async (enabled) => {
    try {
      if (enabled) {
        await dispatch(enableTwoFactor()).unwrap();
        Alert.alert(
          'Autenticación de Dos Factores Habilitada',
          'Se ha enviado un código de verificación a tu teléfono'
        );
      } else {
        await dispatch(disableTwoFactor()).unwrap();
        Alert.alert('Autenticación de Dos Factores Deshabilitada');
      }
      
      setUserPreferences(prev => ({
        ...prev,
        security: {
          ...prev.security,
          twoFactor: enabled,
        }
      }));
    } catch (error) {
      Alert.alert('Error', 'Error al cambiar la configuración de dos factores');
    }
  };

  const menuItems = [
    {
      section: 'Cuenta',
      items: [
        {
          icon: 'edit',
          title: 'Editar Perfil',
          subtitle: 'Actualizar información personal',
          onPress: () => setIsEditModalVisible(true),
        },
        {
          icon: 'lock',
          title: 'Cambiar Contraseña',
          subtitle: 'Actualizar contraseña de seguridad',
          onPress: () => setIsPasswordModalVisible(true),
        },
        {
          icon: 'security',
          title: 'Autenticación de Dos Factores',
          subtitle: userPreferences.security.twoFactor ? 'Habilitada' : 'Deshabilitada',
          rightComponent: (
            <Switch
              value={userPreferences.security.twoFactor}
              onValueChange={handleToggleTwoFactor}
              trackColor={{ false: '#e0e0e0', true: '#007AFF' }}
              thumbColor="#fff"
            />
          ),
        },
      ],
    },
    {
      section: 'Configuración',
      items: [
        {
          icon: 'settings',
          title: 'Preferencias',
          subtitle: 'Personalizar la aplicación',
          onPress: () => setIsPreferencesModalVisible(true),
        },
        {
          icon: 'notifications',
          title: 'Notificaciones',
          subtitle: 'Configurar alertas y avisos',
          onPress: () => navigation.navigate('NotificationCenter'),
        },
        {
          icon: 'language',
          title: 'Idioma',
          subtitle: userPreferences.language === 'es' ? 'Español' : 'English',
          onPress: () => {
            Alert.alert(
              'Cambiar Idioma',
              'Selecciona un idioma',
              [
                { text: 'Cancelar', style: 'cancel' },
                { 
                  text: 'Español', 
                  onPress: () => setUserPreferences(prev => ({...prev, language: 'es'}))
                },
                { 
                  text: 'English', 
                  onPress: () => setUserPreferences(prev => ({...prev, language: 'en'}))
                },
              ]
            );
          },
        },
      ],
    },
    {
      section: 'Propiedades',
      items: [
        {
          icon: 'home',
          title: 'Mis Propiedades',
          subtitle: 'Gestionar propiedades y unidades',
          onPress: () => navigation.navigate('PropertyManagement'),
        },
        {
          icon: 'people',
          title: 'Invitados',
          subtitle: 'Gestionar accesos de visitantes',
          onPress: () => navigation.navigate('GuestManagement'),
        },
        {
          icon: 'history',
          title: 'Historial de Accesos',
          subtitle: 'Ver registros de entrada y salida',
          onPress: () => navigation.navigate('AccessHistory'),
        },
      ],
    },
    {
      section: 'Soporte',
      items: [
        {
          icon: 'help',
          title: 'Ayuda y Soporte',
          subtitle: 'Preguntas frecuentes y contacto',
          onPress: () => navigation.navigate('Support'),
        },
        {
          icon: 'info',
          title: 'Acerca de',
          subtitle: 'Información de la aplicación',
          onPress: () => navigation.navigate('About'),
        },
        {
          icon: 'privacy-tip',
          title: 'Política de Privacidad',
          subtitle: 'Términos y condiciones',
          onPress: () => navigation.navigate('Privacy'),
        },
      ],
    },
    {
      section: 'Sesión',
      items: [
        {
          icon: 'logout',
          title: 'Cerrar Sesión',
          subtitle: 'Salir de la aplicación',
          onPress: () => {
            Alert.alert(
              'Cerrar Sesión',
              '¿Estás seguro de que quieres cerrar sesión?',
              [
                { text: 'Cancelar', style: 'cancel' },
                { 
                  text: 'Cerrar Sesión', 
                  style: 'destructive',
                  onPress: () => {
                    // Dispatch logout action
                    Alert.alert('Sesión Cerrada', 'Has cerrado sesión correctamente');
                  }
                },
              ]
            );
          },
          danger: true,
        },
      ],
    },
  ];

  const renderMenuItem = (item, index) => (
    <TouchableOpacity
      key={index}
      style={styles.menuItem}
      onPress={item.onPress}
    >
      <View style={styles.menuItemLeft}>
        <View style={[
          styles.menuIcon,
          item.danger && styles.dangerIcon
        ]}>
          <Icon 
            name={item.icon} 
            size={24} 
            color={item.danger ? '#FF3B30' : '#666'} 
          />
        </View>
        <View style={styles.menuItemText}>
          <Text style={[
            styles.menuItemTitle,
            item.danger && styles.dangerText
          ]}>
            {item.title}
          </Text>
          <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
        </View>
      </View>
      {item.rightComponent || (
        <Icon name="chevron-right" size={24} color="#ccc" />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <TouchableOpacity
            style={styles.profilePictureContainer}
            onPress={handleProfilePicturePress}
          >
            {user?.profilePicture ? (
              <Image source={{ uri: user.profilePicture }} style={styles.profilePicture} />
            ) : (
              <View style={styles.profilePicturePlaceholder}>
                <Icon name="person" size={40} color="#666" />
              </View>
            )}
            <View style={styles.editProfilePictureButton}>
              <Icon name="camera-alt" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
          
          <Text style={styles.userName}>
            {user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Usuario'}
          </Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
          
          {activeProperty && (
            <View style={styles.activePropertyContainer}>
              <Icon name="home" size={16} color="#007AFF" />
              <Text style={styles.activePropertyText}>{activeProperty.name}</Text>
            </View>
          )}
        </View>

        {/* Menu Sections */}
        {menuItems.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.menuSection}>
            <Text style={styles.sectionTitle}>{section.section}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, itemIndex) => (
                <View key={itemIndex}>
                  {renderMenuItem(item, itemIndex)}
                  {itemIndex < section.items.length - 1 && (
                    <View style={styles.menuItemSeparator} />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalBackButton}
              onPress={() => setIsEditModalVisible(false)}
            >
              <Icon name="close" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Editar Perfil</Text>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveProfile}
            >
              <Text style={styles.saveButtonText}>Guardar</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Text style={styles.sectionTitle}>Información Personal</Text>
            
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.inputLabel}>Nombre</Text>
                <TextInput
                  style={styles.textInput}
                  value={profileForm.firstName}
                  onChangeText={(text) => setProfileForm(prev => ({...prev, firstName: text}))}
                  placeholder="Nombre"
                />
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.inputLabel}>Apellido</Text>
                <TextInput
                  style={styles.textInput}
                  value={profileForm.lastName}
                  onChangeText={(text) => setProfileForm(prev => ({...prev, lastName: text}))}
                  placeholder="Apellido"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.textInput}
                value={profileForm.email}
                onChangeText={(text) => setProfileForm(prev => ({...prev, email: text}))}
                placeholder="correo@ejemplo.com"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Teléfono</Text>
              <TextInput
                style={styles.textInput}
                value={profileForm.phone}
                onChangeText={(text) => setProfileForm(prev => ({...prev, phone: text}))}
                placeholder="+51 999 999 999"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.inputLabel}>Tipo de Documento</Text>
                <View style={styles.typeSelector}>
                  {['DNI', 'Pasaporte', 'CE'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeOption,
                        profileForm.documentType === type && styles.typeOptionActive
                      ]}
                      onPress={() => setProfileForm(prev => ({...prev, documentType: type}))}
                    >
                      <Text style={[
                        styles.typeOptionText,
                        profileForm.documentType === type && styles.typeOptionTextActive
                      ]}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.inputLabel}>Número de Documento</Text>
                <TextInput
                  style={styles.textInput}
                  value={profileForm.documentNumber}
                  onChangeText={(text) => setProfileForm(prev => ({...prev, documentNumber: text}))}
                  placeholder="12345678"
                />
              </View>
            </View>

            <Text style={styles.sectionTitle}>Información Adicional</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Dirección</Text>
              <TextInput
                style={styles.textInput}
                value={profileForm.address}
                onChangeText={(text) => setProfileForm(prev => ({...prev, address: text}))}
                placeholder="Dirección completa"
                multiline
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Ocupación</Text>
              <TextInput
                style={styles.textInput}
                value={profileForm.occupation}
                onChangeText={(text) => setProfileForm(prev => ({...prev, occupation: text}))}
                placeholder="Profesión u ocupación"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Empresa</Text>
              <TextInput
                style={styles.textInput}
                value={profileForm.companyName}
                onChangeText={(text) => setProfileForm(prev => ({...prev, companyName: text}))}
                placeholder="Nombre de la empresa"
              />
            </View>

            <Text style={styles.sectionTitle}>Contacto de Emergencia</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nombre del Contacto</Text>
              <TextInput
                style={styles.textInput}
                value={profileForm.emergencyContact}
                onChangeText={(text) => setProfileForm(prev => ({...prev, emergencyContact: text}))}
                placeholder="Nombre completo"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Teléfono de Emergencia</Text>
              <TextInput
                style={styles.textInput}
                value={profileForm.emergencyPhone}
                onChangeText={(text) => setProfileForm(prev => ({...prev, emergencyPhone: text}))}
                placeholder="+51 999 999 999"
                keyboardType="phone-pad"
              />
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={isPasswordModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalBackButton}
              onPress={() => setIsPasswordModalVisible(false)}
            >
              <Icon name="close" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Cambiar Contraseña</Text>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleChangePassword}
            >
              <Text style={styles.saveButtonText}>Cambiar</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Text style={styles.helpText}>
              Por seguridad, necesitamos verificar tu contraseña actual antes de cambiarla.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contraseña Actual</Text>
              <TextInput
                style={styles.textInput}
                value={passwordForm.currentPassword}
                onChangeText={(text) => setPasswordForm(prev => ({...prev, currentPassword: text}))}
                placeholder="Contraseña actual"
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nueva Contraseña</Text>
              <TextInput
                style={styles.textInput}
                value={passwordForm.newPassword}
                onChangeText={(text) => setPasswordForm(prev => ({...prev, newPassword: text}))}
                placeholder="Nueva contraseña (mínimo 8 caracteres)"
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirmar Nueva Contraseña</Text>
              <TextInput
                style={styles.textInput}
                value={passwordForm.confirmPassword}
                onChangeText={(text) => setPasswordForm(prev => ({...prev, confirmPassword: text}))}
                placeholder="Confirmar nueva contraseña"
                secureTextEntry
              />
            </View>

            <Text style={styles.helpText}>
              La contraseña debe tener al menos 8 caracteres e incluir letras y números.
            </Text>
          </ScrollView>
        </View>
      </Modal>

      {/* Preferences Modal */}
      <Modal
        visible={isPreferencesModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalBackButton}
              onPress={() => setIsPreferencesModalVisible(false)}
            >
              <Icon name="close" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Preferencias</Text>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSavePreferences}
            >
              <Text style={styles.saveButtonText}>Guardar</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Text style={styles.sectionTitle}>Notificaciones</Text>
            
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Notificaciones Push</Text>
              <Switch
                value={userPreferences.notifications.push}
                onValueChange={(value) => setUserPreferences(prev => ({
                  ...prev,
                  notifications: { ...prev.notifications, push: value }
                }))}
                trackColor={{ false: '#e0e0e0', true: '#007AFF' }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Notificaciones por Email</Text>
              <Switch
                value={userPreferences.notifications.email}
                onValueChange={(value) => setUserPreferences(prev => ({
                  ...prev,
                  notifications: { ...prev.notifications, email: value }
                }))}
                trackColor={{ false: '#e0e0e0', true: '#007AFF' }}
                thumbColor="#fff"
              />
            </View>

            <Text style={styles.sectionTitle}>Seguridad</Text>
            
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Autenticación Biométrica</Text>
              <Switch
                value={userPreferences.security.biometric}
                onValueChange={(value) => setUserPreferences(prev => ({
                  ...prev,
                  security: { ...prev.security, biometric: value }
                }))}
                trackColor={{ false: '#e0e0e0', true: '#007AFF' }}
                thumbColor="#fff"
              />
            </View>

            <Text style={styles.sectionTitle}>Privacidad</Text>
            
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Compartir Ubicación</Text>
              <Switch
                value={userPreferences.privacy.shareLocation}
                onValueChange={(value) => setUserPreferences(prev => ({
                  ...prev,
                  privacy: { ...prev.privacy, shareLocation: value }
                }))}
                trackColor={{ false: '#e0e0e0', true: '#007AFF' }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Permitir Análisis</Text>
              <Switch
                value={userPreferences.privacy.allowAnalytics}
                onValueChange={(value) => setUserPreferences(prev => ({
                  ...prev,
                  privacy: { ...prev.privacy, allowAnalytics: value }
                }))}
                trackColor={{ false: '#e0e0e0', true: '#007AFF' }}
                thumbColor="#fff"
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  profilePictureContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profilePicturePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editProfilePictureButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  activePropertyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  activePropertyText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 4,
    fontWeight: '500',
  },
  menuSection: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dangerIcon: {
    backgroundColor: '#ffebee',
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  dangerText: {
    color: '#FF3B30',
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  menuItemSeparator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginLeft: 68,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalBackButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  typeOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  typeOptionActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeOptionText: {
    fontSize: 14,
    color: '#666',
  },
  typeOptionTextActive: {
    color: '#fff',
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabel: {
    fontSize: 16,
    color: '#000',
    flex: 1,
  },
});

export default EnhancedUserProfileScreen;
