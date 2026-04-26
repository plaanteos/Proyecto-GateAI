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
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { 
  fetchUserProperties, 
  addProperty, 
  updateProperty, 
  deleteProperty,
  setActiveProperty,
  fetchPropertyUnits,
  addUnit,
  updateUnit,
  deleteUnit,
} from '../store/slices/propertiesSlice';

const PropertyManagementScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { 
    properties, 
    activeProperty, 
    units,
    loading, 
    error 
  } = useSelector(state => state.properties);
  
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isUnitModalVisible, setIsUnitModalVisible] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [editingUnit, setEditingUnit] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Formulario para propiedades
  const [propertyForm, setPropertyForm] = useState({
    name: '',
    type: 'residential',
    address: '',
    description: '',
    totalUnits: '',
  });
  
  // Formulario para unidades
  const [unitForm, setUnitForm] = useState({
    unitNumber: '',
    type: 'apartment',
    floor: '',
    area: '',
    bedrooms: '',
    bathrooms: '',
    description: '',
  });

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      await dispatch(fetchUserProperties()).unwrap();
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar las propiedades');
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadProperties().then(() => setRefreshing(false));
  }, []);

  const handleSaveProperty = async () => {
    try {
      const propertyData = {
        ...propertyForm,
        totalUnits: parseInt(propertyForm.totalUnits) || 0,
      };

      if (editingProperty) {
        await dispatch(updateProperty({ 
          id: editingProperty.id, 
          ...propertyData 
        })).unwrap();
      } else {
        await dispatch(addProperty(propertyData)).unwrap();
      }

      setIsAddModalVisible(false);
      setEditingProperty(null);
      resetPropertyForm();
      Alert.alert('Éxito', 'Propiedad guardada correctamente');
    } catch (error) {
      Alert.alert('Error', error.message || 'Error al guardar la propiedad');
    }
  };

  const handleSaveUnit = async () => {
    if (!activeProperty) {
      Alert.alert('Error', 'Selecciona una propiedad primero');
      return;
    }

    try {
      const unitData = {
        ...unitForm,
        propertyId: activeProperty.id,
        floor: parseInt(unitForm.floor) || 0,
        area: parseFloat(unitForm.area) || 0,
        bedrooms: parseInt(unitForm.bedrooms) || 0,
        bathrooms: parseInt(unitForm.bathrooms) || 0,
      };

      if (editingUnit) {
        await dispatch(updateUnit({ 
          id: editingUnit.id, 
          ...unitData 
        })).unwrap();
      } else {
        await dispatch(addUnit(unitData)).unwrap();
      }

      setIsUnitModalVisible(false);
      setEditingUnit(null);
      resetUnitForm();
      Alert.alert('Éxito', 'Unidad guardada correctamente');
      
      // Recargar las unidades
      if (activeProperty) {
        dispatch(fetchPropertyUnits(activeProperty.id));
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Error al guardar la unidad');
    }
  };

  const handleDeleteProperty = (property) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de que quieres eliminar "${property.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteProperty(property.id)).unwrap();
              Alert.alert('Éxito', 'Propiedad eliminada correctamente');
            } catch (error) {
              Alert.alert('Error', 'Error al eliminar la propiedad');
            }
          }
        },
      ]
    );
  };

  const handleDeleteUnit = (unit) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de que quieres eliminar la unidad "${unit.unitNumber}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteUnit(unit.id)).unwrap();
              Alert.alert('Éxito', 'Unidad eliminada correctamente');
              
              // Recargar las unidades
              if (activeProperty) {
                dispatch(fetchPropertyUnits(activeProperty.id));
              }
            } catch (error) {
              Alert.alert('Error', 'Error al eliminar la unidad');
            }
          }
        },
      ]
    );
  };

  const selectProperty = async (property) => {
    dispatch(setActiveProperty(property));
    try {
      await dispatch(fetchPropertyUnits(property.id)).unwrap();
    } catch (error) {
      Alert.alert('Error', 'Error al cargar las unidades');
    }
  };

  const editProperty = (property) => {
    setEditingProperty(property);
    setPropertyForm({
      name: property.name,
      type: property.type,
      address: property.address,
      description: property.description || '',
      totalUnits: property.totalUnits?.toString() || '',
    });
    setIsAddModalVisible(true);
  };

  const editUnit = (unit) => {
    setEditingUnit(unit);
    setUnitForm({
      unitNumber: unit.unitNumber,
      type: unit.type,
      floor: unit.floor?.toString() || '',
      area: unit.area?.toString() || '',
      bedrooms: unit.bedrooms?.toString() || '',
      bathrooms: unit.bathrooms?.toString() || '',
      description: unit.description || '',
    });
    setIsUnitModalVisible(true);
  };

  const resetPropertyForm = () => {
    setPropertyForm({
      name: '',
      type: 'residential',
      address: '',
      description: '',
      totalUnits: '',
    });
  };

  const resetUnitForm = () => {
    setUnitForm({
      unitNumber: '',
      type: 'apartment',
      floor: '',
      area: '',
      bedrooms: '',
      bathrooms: '',
      description: '',
    });
  };

  const renderProperty = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.propertyCard,
        activeProperty?.id === item.id && styles.activePropertyCard
      ]}
      onPress={() => selectProperty(item)}
    >
      <View style={styles.propertyHeader}>
        <View style={styles.propertyInfo}>
          <Text style={styles.propertyName}>{item.name}</Text>
          <Text style={styles.propertyType}>{item.type}</Text>
          <Text style={styles.propertyAddress}>{item.address}</Text>
        </View>
        <View style={styles.propertyActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => editProperty(item)}
          >
            <Icon name="edit" size={20} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteProperty(item)}
          >
            <Icon name="delete" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.propertyStats}>
        <Text style={styles.statText}>
          {item.totalUnits || 0} unidades
        </Text>
        <Text style={styles.statText}>
          {item.occupiedUnits || 0} ocupadas
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderUnit = ({ item }) => (
    <View style={styles.unitCard}>
      <View style={styles.unitHeader}>
        <View style={styles.unitInfo}>
          <Text style={styles.unitNumber}>{item.unitNumber}</Text>
          <Text style={styles.unitType}>{item.type}</Text>
          <Text style={styles.unitDetails}>
            Piso {item.floor} • {item.area}m² • {item.bedrooms}hab • {item.bathrooms}baños
          </Text>
        </View>
        <View style={styles.unitActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => editUnit(item)}
          >
            <Icon name="edit" size={20} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteUnit(item)}
          >
            <Icon name="delete" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={[
        styles.unitStatus,
        { backgroundColor: item.isOccupied ? '#FF3B30' : '#34C759' }
      ]}>
        <Text style={styles.unitStatusText}>
          {item.isOccupied ? 'Ocupada' : 'Disponible'}
        </Text>
      </View>
    </View>
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
        <Text style={styles.headerTitle}>Gestión de Propiedades</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            resetPropertyForm();
            setEditingProperty(null);
            setIsAddModalVisible(true);
          }}
        >
          <Icon name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Properties List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mis Propiedades</Text>
        <FlatList
          data={properties}
          renderItem={renderProperty}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No tienes propiedades registradas</Text>
          }
        />
      </View>

      {/* Units Section */}
      {activeProperty && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Unidades - {activeProperty.name}
            </Text>
            <TouchableOpacity
              style={styles.addUnitButton}
              onPress={() => {
                resetUnitForm();
                setEditingUnit(null);
                setIsUnitModalVisible(true);
              }}
            >
              <Icon name="add" size={20} color="#007AFF" />
              <Text style={styles.addUnitText}>Agregar Unidad</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={units}
            renderItem={renderUnit}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No hay unidades registradas</Text>
            }
          />
        </View>
      )}

      {/* Add/Edit Property Modal */}
      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalBackButton}
              onPress={() => {
                setIsAddModalVisible(false);
                setEditingProperty(null);
                resetPropertyForm();
              }}
            >
              <Icon name="close" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingProperty ? 'Editar Propiedad' : 'Agregar Propiedad'}
            </Text>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveProperty}
            >
              <Text style={styles.saveButtonText}>Guardar</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nombre de la Propiedad</Text>
              <TextInput
                style={styles.textInput}
                value={propertyForm.name}
                onChangeText={(text) => setPropertyForm(prev => ({...prev, name: text}))}
                placeholder="Ej: Residencial Los Álamos"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Dirección</Text>
              <TextInput
                style={styles.textInput}
                value={propertyForm.address}
                onChangeText={(text) => setPropertyForm(prev => ({...prev, address: text}))}
                placeholder="Dirección completa"
                multiline
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tipo de Propiedad</Text>
              <View style={styles.typeSelector}>
                {['residential', 'commercial', 'mixed'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeOption,
                      propertyForm.type === type && styles.typeOptionActive
                    ]}
                    onPress={() => setPropertyForm(prev => ({...prev, type}))}
                  >
                    <Text style={[
                      styles.typeOptionText,
                      propertyForm.type === type && styles.typeOptionTextActive
                    ]}>
                      {type === 'residential' ? 'Residencial' : 
                       type === 'commercial' ? 'Comercial' : 'Mixto'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Total de Unidades</Text>
              <TextInput
                style={styles.textInput}
                value={propertyForm.totalUnits}
                onChangeText={(text) => setPropertyForm(prev => ({...prev, totalUnits: text}))}
                placeholder="Número de unidades"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Descripción (Opcional)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={propertyForm.description}
                onChangeText={(text) => setPropertyForm(prev => ({...prev, description: text}))}
                placeholder="Descripción de la propiedad"
                multiline
                numberOfLines={4}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Add/Edit Unit Modal */}
      <Modal
        visible={isUnitModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalBackButton}
              onPress={() => {
                setIsUnitModalVisible(false);
                setEditingUnit(null);
                resetUnitForm();
              }}
            >
              <Icon name="close" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingUnit ? 'Editar Unidad' : 'Agregar Unidad'}
            </Text>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveUnit}
            >
              <Text style={styles.saveButtonText}>Guardar</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Número/Código de Unidad</Text>
              <TextInput
                style={styles.textInput}
                value={unitForm.unitNumber}
                onChangeText={(text) => setUnitForm(prev => ({...prev, unitNumber: text}))}
                placeholder="Ej: 101, A-1, Torre B-301"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tipo de Unidad</Text>
              <View style={styles.typeSelector}>
                {['apartment', 'house', 'office', 'store', 'parking'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeOption,
                      unitForm.type === type && styles.typeOptionActive
                    ]}
                    onPress={() => setUnitForm(prev => ({...prev, type}))}
                  >
                    <Text style={[
                      styles.typeOptionText,
                      unitForm.type === type && styles.typeOptionTextActive
                    ]}>
                      {type === 'apartment' ? 'Apartamento' : 
                       type === 'house' ? 'Casa' :
                       type === 'office' ? 'Oficina' :
                       type === 'store' ? 'Local' : 'Parqueadero'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.inputLabel}>Piso</Text>
                <TextInput
                  style={styles.textInput}
                  value={unitForm.floor}
                  onChangeText={(text) => setUnitForm(prev => ({...prev, floor: text}))}
                  placeholder="1"
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.inputLabel}>Área (m²)</Text>
                <TextInput
                  style={styles.textInput}
                  value={unitForm.area}
                  onChangeText={(text) => setUnitForm(prev => ({...prev, area: text}))}
                  placeholder="85"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.inputLabel}>Habitaciones</Text>
                <TextInput
                  style={styles.textInput}
                  value={unitForm.bedrooms}
                  onChangeText={(text) => setUnitForm(prev => ({...prev, bedrooms: text}))}
                  placeholder="3"
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.inputLabel}>Baños</Text>
                <TextInput
                  style={styles.textInput}
                  value={unitForm.bathrooms}
                  onChangeText={(text) => setUnitForm(prev => ({...prev, bathrooms: text}))}
                  placeholder="2"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Descripción (Opcional)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={unitForm.description}
                onChangeText={(text) => setUnitForm(prev => ({...prev, description: text}))}
                placeholder="Descripción adicional de la unidad"
                multiline
                numberOfLines={3}
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
  addButton: {
    padding: 8,
  },
  section: {
    flex: 1,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  addUnitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addUnitText: {
    color: '#fff',
    marginLeft: 4,
    fontWeight: '500',
  },
  propertyCard: {
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
  activePropertyCard: {
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  propertyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  propertyInfo: {
    flex: 1,
  },
  propertyName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  propertyType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  propertyAddress: {
    fontSize: 14,
    color: '#666',
  },
  propertyActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  propertyStats: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  statText: {
    fontSize: 14,
    color: '#666',
    marginRight: 16,
  },
  unitCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  unitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  unitInfo: {
    flex: 1,
  },
  unitNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  unitType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  unitDetails: {
    fontSize: 12,
    color: '#666',
  },
  unitActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unitStatus: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  unitStatusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 32,
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
  textArea: {
    height: 80,
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
});

export default PropertyManagementScreen;
