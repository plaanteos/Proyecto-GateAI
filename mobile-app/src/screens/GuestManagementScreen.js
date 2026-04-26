import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  RefreshControl,
  Image,
  Share,
  Linking,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import QRCode from 'react-native-qrcode-svg';
import DateTimePicker from '@react-native-community/datetimepicker';
import { 
  fetchGuests,
  inviteGuest,
  updateGuest,
  revokeGuestAccess,
  generateQRCode,
  sendInvitationWhatsApp,
  extendGuestAccess,
  bulkInviteGuests,
} from '../store/slices/guestsSlice';

const GuestManagementScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { 
    guests, 
    pendingInvitations,
    qrCodes,
    loading, 
    error 
  } = useSelector(state => state.guests);
  
  const { activeProperty } = useSelector(state => state.properties);
  
  const [isInviteModalVisible, setIsInviteModalVisible] = useState(false);
  const [isQRModalVisible, setIsQRModalVisible] = useState(false);
  const [isBulkModalVisible, setIsBulkModalVisible] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerType, setDatePickerType] = useState('start');
  
  // Formulario para invitaciones
  const [inviteForm, setInviteForm] = useState({
    name: '',
    phone: '',
    email: '',
    documentType: 'DNI',
    documentNumber: '',
    guestType: 'temporary',
    startDate: new Date(),
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Mañana
    maxVisits: '1',
    allowedAreas: ['main_entrance'],
    specialInstructions: '',
    emergencyContact: '',
    vehiclePlate: '',
    unitNumber: '',
  });

  // Formulario para invitaciones masivas
  const [bulkInviteForm, setBulkInviteForm] = useState({
    guestList: '',
    guestType: 'temporary',
    startDate: new Date(),
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    allowedAreas: ['main_entrance'],
    specialInstructions: '',
  });

  useEffect(() => {
    loadGuests();
  }, [activeProperty]);

  const loadGuests = async () => {
    if (!activeProperty) return;
    
    try {
      await dispatch(fetchGuests(activeProperty.id)).unwrap();
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los invitados');
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadGuests().then(() => setRefreshing(false));
  }, [activeProperty]);

  const handleInviteGuest = async () => {
    if (!activeProperty) {
      Alert.alert('Error', 'Selecciona una propiedad primero');
      return;
    }

    try {
      const guestData = {
        ...inviteForm,
        propertyId: activeProperty.id,
        maxVisits: parseInt(inviteForm.maxVisits) || 1,
        startDate: inviteForm.startDate.toISOString(),
        endDate: inviteForm.endDate.toISOString(),
      };

      const result = await dispatch(inviteGuest(guestData)).unwrap();
      
      setIsInviteModalVisible(false);
      resetInviteForm();
      
      // Mostrar opciones de envío
      Alert.alert(
        'Invitación Creada',
        '¿Cómo quieres enviar la invitación?',
        [
          { text: 'Solo Guardar', style: 'cancel' },
          { 
            text: 'WhatsApp', 
            onPress: () => sendWhatsAppInvitation(result)
          },
          { 
            text: 'Mostrar QR', 
            onPress: () => showQRCode(result)
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', error.message || 'Error al crear la invitación');
    }
  };

  const handleBulkInvite = async () => {
    if (!activeProperty) {
      Alert.alert('Error', 'Selecciona una propiedad primero');
      return;
    }

    try {
      // Parsear la lista de invitados
      const guestLines = bulkInviteForm.guestList.trim().split('\n');
      const guestList = guestLines.map(line => {
        const parts = line.split(',').map(part => part.trim());
        return {
          name: parts[0] || '',
          phone: parts[1] || '',
          email: parts[2] || '',
          documentNumber: parts[3] || '',
        };
      }).filter(guest => guest.name && guest.phone);

      if (guestList.length === 0) {
        Alert.alert('Error', 'No se encontraron invitados válidos en la lista');
        return;
      }

      const bulkData = {
        ...bulkInviteForm,
        propertyId: activeProperty.id,
        guestList,
        startDate: bulkInviteForm.startDate.toISOString(),
        endDate: bulkInviteForm.endDate.toISOString(),
      };

      await dispatch(bulkInviteGuests(bulkData)).unwrap();
      
      setIsBulkModalVisible(false);
      resetBulkForm();
      
      Alert.alert(
        'Éxito',
        `Se enviaron ${guestList.length} invitaciones correctamente`
      );
    } catch (error) {
      Alert.alert('Error', error.message || 'Error al enviar las invitaciones');
    }
  };

  const sendWhatsAppInvitation = async (guest) => {
    try {
      await dispatch(sendInvitationWhatsApp({
        guestId: guest.id,
        propertyId: activeProperty.id,
      })).unwrap();
      
      Alert.alert('Éxito', 'Invitación enviada por WhatsApp');
    } catch (error) {
      Alert.alert('Error', 'Error al enviar la invitación por WhatsApp');
    }
  };

  const showQRCode = async (guest) => {
    try {
      await dispatch(generateQRCode({
        guestId: guest.id,
        propertyId: activeProperty.id,
      })).unwrap();
      
      setSelectedGuest(guest);
      setIsQRModalVisible(true);
    } catch (error) {
      Alert.alert('Error', 'Error al generar el código QR');
    }
  };

  const handleRevokeAccess = (guest) => {
    Alert.alert(
      'Revocar Acceso',
      `¿Estás seguro de que quieres revocar el acceso de ${guest.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Revocar', 
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(revokeGuestAccess(guest.id)).unwrap();
              Alert.alert('Éxito', 'Acceso revocado correctamente');
            } catch (error) {
              Alert.alert('Error', 'Error al revocar el acceso');
            }
          }
        },
      ]
    );
  };

  const handleExtendAccess = (guest) => {
    Alert.prompt(
      'Extender Acceso',
      'Ingresa los días adicionales:',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Extender',
          onPress: async (days) => {
            if (!days || isNaN(days)) {
              Alert.alert('Error', 'Ingresa un número válido de días');
              return;
            }
            
            try {
              await dispatch(extendGuestAccess({
                guestId: guest.id,
                additionalDays: parseInt(days),
              })).unwrap();
              
              Alert.alert('Éxito', `Acceso extendido por ${days} días`);
            } catch (error) {
              Alert.alert('Error', 'Error al extender el acceso');
            }
          }
        },
      ],
      'plain-text',
      '7'
    );
  };

  const shareQRCode = async () => {
    if (!selectedGuest) return;
    
    try {
      const qrCode = qrCodes[selectedGuest.id];
      if (qrCode) {
        await Share.share({
          message: `Código de acceso para ${selectedGuest.name}\n\nPropiedad: ${activeProperty.name}\nVálido hasta: ${new Date(selectedGuest.endDate).toLocaleDateString()}\n\nCódigo QR: ${qrCode.data}`,
          title: 'Invitación de Acceso',
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Error al compartir el código QR');
    }
  };

  const resetInviteForm = () => {
    setInviteForm({
      name: '',
      phone: '',
      email: '',
      documentType: 'DNI',
      documentNumber: '',
      guestType: 'temporary',
      startDate: new Date(),
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      maxVisits: '1',
      allowedAreas: ['main_entrance'],
      specialInstructions: '',
      emergencyContact: '',
      vehiclePlate: '',
      unitNumber: '',
    });
  };

  const resetBulkForm = () => {
    setBulkInviteForm({
      guestList: '',
      guestType: 'temporary',
      startDate: new Date(),
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      allowedAreas: ['main_entrance'],
      specialInstructions: '',
    });
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      if (datePickerType === 'start') {
        setInviteForm(prev => ({ ...prev, startDate: selectedDate }));
      } else {
        setInviteForm(prev => ({ ...prev, endDate: selectedDate }));
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#34C759';
      case 'expired': return '#FF3B30';
      case 'revoked': return '#FF9500';
      case 'pending': return '#007AFF';
      default: return '#8E8E93';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'expired': return 'Expirado';
      case 'revoked': return 'Revocado';
      case 'pending': return 'Pendiente';
      default: return 'Desconocido';
    }
  };

  const renderGuest = ({ item }) => (
    <View style={styles.guestCard}>
      <View style={styles.guestHeader}>
        <View style={styles.guestInfo}>
          <Text style={styles.guestName}>{item.name}</Text>
          <Text style={styles.guestPhone}>{item.phone}</Text>
          <Text style={styles.guestDocument}>
            {item.documentType}: {item.documentNumber}
          </Text>
          <Text style={styles.guestDates}>
            Válido: {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.guestActions}>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) }
          ]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.guestStats}>
        <Text style={styles.statText}>
          Visitas: {item.visitCount || 0}/{item.maxVisits}
        </Text>
        <Text style={styles.statText}>
          Tipo: {item.guestType === 'temporary' ? 'Temporal' : 
                 item.guestType === 'recurring' ? 'Recurrente' : 'Permanente'}
        </Text>
      </View>
      
      <View style={styles.guestButtons}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => showQRCode(item)}
        >
          <Icon name="qr-code" size={20} color="#007AFF" />
          <Text style={styles.actionBtnText}>QR</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => sendWhatsAppInvitation(item)}
        >
          <Icon name="message" size={20} color="#25D366" />
          <Text style={styles.actionBtnText}>WhatsApp</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleExtendAccess(item)}
        >
          <Icon name="schedule" size={20} color="#FF9500" />
          <Text style={styles.actionBtnText}>Extender</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleRevokeAccess(item)}
        >
          <Icon name="block" size={20} color="#FF3B30" />
          <Text style={styles.actionBtnText}>Revocar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!activeProperty) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Gestión de Invitados</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Icon name="home" size={80} color="#ccc" />
          <Text style={styles.emptyTitle}>Selecciona una Propiedad</Text>
          <Text style={styles.emptyText}>
            Primero debes seleccionar una propiedad para gestionar invitados
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('PropertyManagement')}
          >
            <Text style={styles.primaryButtonText}>Ir a Propiedades</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
        <Text style={styles.headerTitle}>Invitados</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              resetBulkForm();
              setIsBulkModalVisible(true);
            }}
          >
            <Icon name="group-add" size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              resetInviteForm();
              setIsInviteModalVisible(true);
            }}
          >
            <Icon name="person-add" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Property Info */}
      <View style={styles.propertyInfo}>
        <Text style={styles.propertyName}>{activeProperty.name}</Text>
        <Text style={styles.propertyAddress}>{activeProperty.address}</Text>
      </View>

      {/* Guest List */}
      <FlatList
        data={guests}
        renderItem={renderGuest}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="people" size={80} color="#ccc" />
            <Text style={styles.emptyTitle}>No hay invitados</Text>
            <Text style={styles.emptyText}>
              Comienza agregando tu primer invitado
            </Text>
          </View>
        }
      />

      {/* Invite Guest Modal */}
      <Modal
        visible={isInviteModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalBackButton}
              onPress={() => {
                setIsInviteModalVisible(false);
                resetInviteForm();
              }}
            >
              <Icon name="close" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Invitar Huésped</Text>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleInviteGuest}
            >
              <Text style={styles.saveButtonText}>Invitar</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {/* Información Personal */}
            <Text style={styles.sectionTitle}>Información Personal</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nombre Completo *</Text>
              <TextInput
                style={styles.textInput}
                value={inviteForm.name}
                onChangeText={(text) => setInviteForm(prev => ({...prev, name: text}))}
                placeholder="Nombre del invitado"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.inputLabel}>Teléfono *</Text>
                <TextInput
                  style={styles.textInput}
                  value={inviteForm.phone}
                  onChangeText={(text) => setInviteForm(prev => ({...prev, phone: text}))}
                  placeholder="+51 999 999 999"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.textInput}
                  value={inviteForm.email}
                  onChangeText={(text) => setInviteForm(prev => ({...prev, email: text}))}
                  placeholder="email@ejemplo.com"
                  keyboardType="email-address"
                />
              </View>
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
                        inviteForm.documentType === type && styles.typeOptionActive
                      ]}
                      onPress={() => setInviteForm(prev => ({...prev, documentType: type}))}
                    >
                      <Text style={[
                        styles.typeOptionText,
                        inviteForm.documentType === type && styles.typeOptionTextActive
                      ]}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.inputLabel}>Número de Documento *</Text>
                <TextInput
                  style={styles.textInput}
                  value={inviteForm.documentNumber}
                  onChangeText={(text) => setInviteForm(prev => ({...prev, documentNumber: text}))}
                  placeholder="12345678"
                />
              </View>
            </View>

            {/* Configuración de Acceso */}
            <Text style={styles.sectionTitle}>Configuración de Acceso</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tipo de Invitado</Text>
              <View style={styles.typeSelector}>
                {[
                  { key: 'temporary', label: 'Temporal' },
                  { key: 'recurring', label: 'Recurrente' },
                  { key: 'permanent', label: 'Permanente' }
                ].map((type) => (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.typeOption,
                      inviteForm.guestType === type.key && styles.typeOptionActive
                    ]}
                    onPress={() => setInviteForm(prev => ({...prev, guestType: type.key}))}
                  >
                    <Text style={[
                      styles.typeOptionText,
                      inviteForm.guestType === type.key && styles.typeOptionTextActive
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.inputLabel}>Fecha de Inicio</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => {
                    setDatePickerType('start');
                    setShowDatePicker(true);
                  }}
                >
                  <Text style={styles.dateButtonText}>
                    {inviteForm.startDate.toLocaleDateString()}
                  </Text>
                  <Icon name="calendar-today" size={20} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.inputLabel}>Fecha de Fin</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => {
                    setDatePickerType('end');
                    setShowDatePicker(true);
                  }}
                >
                  <Text style={styles.dateButtonText}>
                    {inviteForm.endDate.toLocaleDateString()}
                  </Text>
                  <Icon name="calendar-today" size={20} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.inputLabel}>Máximo de Visitas</Text>
                <TextInput
                  style={styles.textInput}
                  value={inviteForm.maxVisits}
                  onChangeText={(text) => setInviteForm(prev => ({...prev, maxVisits: text}))}
                  placeholder="1"
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.inputLabel}>Unidad (Opcional)</Text>
                <TextInput
                  style={styles.textInput}
                  value={inviteForm.unitNumber}
                  onChangeText={(text) => setInviteForm(prev => ({...prev, unitNumber: text}))}
                  placeholder="101"
                />
              </View>
            </View>

            {/* Información Adicional */}
            <Text style={styles.sectionTitle}>Información Adicional</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Placa de Vehículo (Opcional)</Text>
              <TextInput
                style={styles.textInput}
                value={inviteForm.vehiclePlate}
                onChangeText={(text) => setInviteForm(prev => ({...prev, vehiclePlate: text}))}
                placeholder="ABC-123"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contacto de Emergencia</Text>
              <TextInput
                style={styles.textInput}
                value={inviteForm.emergencyContact}
                onChangeText={(text) => setInviteForm(prev => ({...prev, emergencyContact: text}))}
                placeholder="+51 999 999 999"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Instrucciones Especiales</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={inviteForm.specialInstructions}
                onChangeText={(text) => setInviteForm(prev => ({...prev, specialInstructions: text}))}
                placeholder="Instrucciones adicionales para el guardia..."
                multiline
                numberOfLines={4}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Bulk Invite Modal */}
      <Modal
        visible={isBulkModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalBackButton}
              onPress={() => {
                setIsBulkModalVisible(false);
                resetBulkForm();
              }}
            >
              <Icon name="close" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Invitación Masiva</Text>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleBulkInvite}
            >
              <Text style={styles.saveButtonText}>Enviar</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Text style={styles.sectionTitle}>Lista de Invitados</Text>
            <Text style={styles.helpText}>
              Formato: Nombre, Teléfono, Email, DNI (uno por línea)
            </Text>
            
            <View style={styles.inputGroup}>
              <TextInput
                style={[styles.textInput, styles.bulkTextArea]}
                value={bulkInviteForm.guestList}
                onChangeText={(text) => setBulkInviteForm(prev => ({...prev, guestList: text}))}
                placeholder="Juan Pérez, +51999999999, juan@email.com, 12345678&#10;María García, +51888888888, maria@email.com, 87654321"
                multiline
                numberOfLines={10}
              />
            </View>

            <Text style={styles.sectionTitle}>Configuración General</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tipo de Invitado</Text>
              <View style={styles.typeSelector}>
                {[
                  { key: 'temporary', label: 'Temporal' },
                  { key: 'recurring', label: 'Recurrente' }
                ].map((type) => (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.typeOption,
                      bulkInviteForm.guestType === type.key && styles.typeOptionActive
                    ]}
                    onPress={() => setBulkInviteForm(prev => ({...prev, guestType: type.key}))}
                  >
                    <Text style={[
                      styles.typeOptionText,
                      bulkInviteForm.guestType === type.key && styles.typeOptionTextActive
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Instrucciones Especiales</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={bulkInviteForm.specialInstructions}
                onChangeText={(text) => setBulkInviteForm(prev => ({...prev, specialInstructions: text}))}
                placeholder="Instrucciones para todos los invitados..."
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* QR Code Modal */}
      <Modal
        visible={isQRModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalBackButton}
              onPress={() => setIsQRModalVisible(false)}
            >
              <Icon name="close" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Código QR</Text>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={shareQRCode}
            >
              <Icon name="share" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.qrContainer}>
            {selectedGuest && qrCodes[selectedGuest.id] && (
              <>
                <View style={styles.qrCodeWrapper}>
                  <QRCode
                    value={qrCodes[selectedGuest.id].data}
                    size={200}
                    backgroundColor="white"
                    color="black"
                  />
                </View>
                
                <Text style={styles.guestNameQR}>{selectedGuest.name}</Text>
                <Text style={styles.propertyNameQR}>{activeProperty.name}</Text>
                <Text style={styles.validityText}>
                  Válido hasta: {new Date(selectedGuest.endDate).toLocaleDateString()}
                </Text>
                
                <TouchableOpacity
                  style={styles.shareButton}
                  onPress={shareQRCode}
                >
                  <Icon name="share" size={20} color="#007AFF" />
                  <Text style={styles.shareButtonText}>Compartir Código</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={datePickerType === 'start' ? inviteForm.startDate : inviteForm.endDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}
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
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  propertyInfo: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  propertyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  propertyAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  listContainer: {
    padding: 16,
  },
  guestCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  guestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  guestInfo: {
    flex: 1,
  },
  guestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  guestPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  guestDocument: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  guestDates: {
    fontSize: 12,
    color: '#666',
  },
  guestActions: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  guestStats: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statText: {
    fontSize: 12,
    color: '#666',
    marginRight: 16,
  },
  guestButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionBtn: {
    alignItems: 'center',
    padding: 8,
  },
  actionBtnText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
    marginTop: 8,
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  bulkTextArea: {
    height: 150,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#000',
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  qrContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  qrCodeWrapper: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 24,
  },
  guestNameQR: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  propertyNameQR: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  validityText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shareButtonText: {
    color: '#007AFF',
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default GuestManagementScreen;
