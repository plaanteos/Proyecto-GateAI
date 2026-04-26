import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Switch,
  Modal,
  ScrollView,
  Animated,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { 
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  subscribeToWebSocket,
  unsubscribeFromWebSocket,
  updateNotificationSettings,
  dismissNotification,
} from '../store/slices/notificationsSlice';

const NotificationCenterScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { 
    notifications, 
    unreadCount,
    settings,
    isConnected,
    loading, 
    error 
  } = useSelector(state => state.notifications);
  
  const { activeProperty } = useSelector(state => state.properties);
  
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [expandedNotification, setExpandedNotification] = useState(null);
  
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadNotifications();
    connectWebSocket();
    
    return () => {
      dispatch(unsubscribeFromWebSocket());
    };
  }, [activeProperty]);

  const loadNotifications = async () => {
    if (!activeProperty) return;
    
    try {
      await dispatch(fetchNotifications({
        propertyId: activeProperty.id,
        limit: 50,
      })).unwrap();
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar las notificaciones');
    }
  };

  const connectWebSocket = () => {
    if (activeProperty) {
      dispatch(subscribeToWebSocket({
        propertyId: activeProperty.id,
        userId: 'current-user-id', // Get from auth state
      }));
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadNotifications().then(() => setRefreshing(false));
  }, [activeProperty]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await dispatch(markAsRead(notificationId)).unwrap();
    } catch (error) {
      Alert.alert('Error', 'Error al marcar como leída');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await dispatch(markAllAsRead()).unwrap();
      Alert.alert('Éxito', 'Todas las notificaciones marcadas como leídas');
    } catch (error) {
      Alert.alert('Error', 'Error al marcar las notificaciones');
    }
  };

  const handleDeleteNotification = (notificationId) => {
    Alert.alert(
      'Eliminar Notificación',
      '¿Estás seguro de que quieres eliminar esta notificación?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteNotification(notificationId)).unwrap();
            } catch (error) {
              Alert.alert('Error', 'Error al eliminar la notificación');
            }
          }
        },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      'Limpiar Todas',
      '¿Estás seguro de que quieres eliminar todas las notificaciones?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar Todas', 
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(clearAllNotifications()).unwrap();
              Alert.alert('Éxito', 'Todas las notificaciones eliminadas');
            } catch (error) {
              Alert.alert('Error', 'Error al eliminar las notificaciones');
            }
          }
        },
      ]
    );
  };

  const handleDismissNotification = async (notificationId) => {
    // Animación de deslizamiento
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

    try {
      await dispatch(dismissNotification(notificationId)).unwrap();
    } catch (error) {
      Alert.alert('Error', 'Error al descartar la notificación');
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      await dispatch(updateNotificationSettings(newSettings)).unwrap();
      Alert.alert('Éxito', 'Configuración actualizada');
    } catch (error) {
      Alert.alert('Error', 'Error al actualizar la configuración');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'security': return 'security';
      case 'visitor': return 'person';
      case 'access': return 'lock';
      case 'emergency': return 'warning';
      case 'maintenance': return 'build';
      case 'announcement': return 'campaign';
      case 'system': return 'settings';
      default: return 'notifications';
    }
  };

  const getNotificationColor = (type, priority) => {
    if (priority === 'emergency') return '#FF3B30';
    if (priority === 'high') return '#FF9500';
    
    switch (type) {
      case 'security': return '#FF3B30';
      case 'visitor': return '#007AFF';
      case 'access': return '#34C759';
      case 'emergency': return '#FF3B30';
      case 'maintenance': return '#FF9500';
      case 'announcement': return '#5856D6';
      case 'system': return '#8E8E93';
      default: return '#007AFF';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'emergency': return 'EMERGENCIA';
      case 'high': return 'ALTA';
      case 'medium': return 'MEDIA';
      case 'low': return 'BAJA';
      default: return '';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    
    return date.toLocaleDateString();
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filterType === 'all') return true;
    if (filterType === 'unread') return !notification.read;
    return notification.type === filterType;
  });

  const renderNotification = ({ item, index }) => (
    <Animated.View style={[styles.notificationCard, { opacity: fadeAnim }]}>
      <TouchableOpacity
        style={[
          styles.notificationContent,
          !item.read && styles.unreadNotification
        ]}
        onPress={() => {
          if (!item.read) {
            handleMarkAsRead(item.id);
          }
          if (item.actionRequired || item.longContent) {
            setExpandedNotification(expandedNotification === item.id ? null : item.id);
          }
        }}
        onLongPress={() => {
          Alert.alert(
            'Opciones',
            'Selecciona una acción',
            [
              { text: 'Cancelar', style: 'cancel' },
              { 
                text: 'Marcar como leída', 
                onPress: () => handleMarkAsRead(item.id)
              },
              { 
                text: 'Eliminar', 
                style: 'destructive',
                onPress: () => handleDeleteNotification(item.id)
              },
            ]
          );
        }}
      >
        <View style={styles.notificationHeader}>
          <View style={styles.notificationLeft}>
            <View style={[
              styles.notificationIcon,
              { backgroundColor: getNotificationColor(item.type, item.priority) }
            ]}>
              <Icon 
                name={getNotificationIcon(item.type)} 
                size={20} 
                color="#fff" 
              />
            </View>
            <View style={styles.notificationInfo}>
              <View style={styles.notificationTitleRow}>
                <Text style={[
                  styles.notificationTitle,
                  !item.read && styles.unreadText
                ]}>
                  {item.title}
                </Text>
                {item.priority === 'emergency' && (
                  <View style={styles.emergencyBadge}>
                    <Text style={styles.emergencyText}>
                      {getPriorityLabel(item.priority)}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.notificationMessage} numberOfLines={2}>
                {item.message}
              </Text>
              <Text style={styles.notificationTime}>
                {formatTimestamp(item.createdAt)}
              </Text>
            </View>
          </View>
          
          <View style={styles.notificationActions}>
            {!item.read && <View style={styles.unreadDot} />}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDismissNotification(item.id)}
            >
              <Icon name="close" size={20} color="#8E8E93" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Expanded Content */}
        {expandedNotification === item.id && (
          <View style={styles.expandedContent}>
            {item.longContent && (
              <Text style={styles.longContent}>{item.longContent}</Text>
            )}
            
            {item.actionRequired && (
              <View style={styles.actionButtons}>
                {item.actions?.map((action, actionIndex) => (
                  <TouchableOpacity
                    key={actionIndex}
                    style={[
                      styles.actionBtn,
                      action.style === 'primary' && styles.primaryActionBtn,
                      action.style === 'destructive' && styles.destructiveActionBtn
                    ]}
                    onPress={() => {
                      // Handle action
                      Alert.alert('Acción', `Ejecutando: ${action.label}`);
                    }}
                  >
                    <Text style={[
                      styles.actionBtnText,
                      action.style === 'primary' && styles.primaryActionBtnText,
                      action.style === 'destructive' && styles.destructiveActionBtnText
                    ]}>
                      {action.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {item.attachments?.length > 0 && (
              <View style={styles.attachments}>
                <Text style={styles.attachmentsTitle}>Adjuntos:</Text>
                {item.attachments.map((attachment, attachIndex) => (
                  <TouchableOpacity
                    key={attachIndex}
                    style={styles.attachment}
                    onPress={() => {
                      // Handle attachment view
                      Alert.alert('Adjunto', `Abriendo: ${attachment.name}`);
                    }}
                  >
                    <Icon name="attach-file" size={16} color="#007AFF" />
                    <Text style={styles.attachmentName}>{attachment.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );

  const renderFilterButton = (type, label) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filterType === type && styles.activeFilterButton
      ]}
      onPress={() => setFilterType(type)}
    >
      <Text style={[
        styles.filterButtonText,
        filterType === type && styles.activeFilterButtonText
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
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
          <Text style={styles.headerTitle}>Notificaciones</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Icon name="notifications-off" size={80} color="#ccc" />
          <Text style={styles.emptyTitle}>Selecciona una Propiedad</Text>
          <Text style={styles.emptyText}>
            Primero debes seleccionar una propiedad para ver las notificaciones
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
        <Text style={styles.headerTitle}>Notificaciones</Text>
        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setIsSettingsModalVisible(true)}
          >
            <Icon name="settings" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Connection Status */}
      <View style={[
        styles.connectionStatus,
        { backgroundColor: isConnected ? '#34C759' : '#FF3B30' }
      ]}>
        <Icon 
          name={isConnected ? 'wifi' : 'wifi-off'} 
          size={16} 
          color="#fff" 
        />
        <Text style={styles.connectionText}>
          {isConnected ? 'Conectado en tiempo real' : 'Desconectado'}
        </Text>
      </View>

      {/* Property Info */}
      <View style={styles.propertyInfo}>
        <Text style={styles.propertyName}>{activeProperty.name}</Text>
        <Text style={styles.propertyAddress}>{activeProperty.address}</Text>
      </View>

      {/* Filter Buttons */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {renderFilterButton('all', 'Todas')}
        {renderFilterButton('unread', 'No leídas')}
        {renderFilterButton('security', 'Seguridad')}
        {renderFilterButton('visitor', 'Visitantes')}
        {renderFilterButton('access', 'Acceso')}
        {renderFilterButton('maintenance', 'Mantenimiento')}
        {renderFilterButton('announcement', 'Anuncios')}
      </ScrollView>

      {/* Action Buttons */}
      {notifications.length > 0 && (
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.actionButtonSecondary}
            onPress={handleMarkAllAsRead}
          >
            <Icon name="done-all" size={16} color="#007AFF" />
            <Text style={styles.actionButtonSecondaryText}>Marcar todas</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButtonSecondary}
            onPress={handleClearAll}
          >
            <Icon name="clear-all" size={16} color="#FF3B30" />
            <Text style={[styles.actionButtonSecondaryText, { color: '#FF3B30' }]}>
              Limpiar todas
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Notifications List */}
      <FlatList
        data={filteredNotifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="notifications-none" size={80} color="#ccc" />
            <Text style={styles.emptyTitle}>No hay notificaciones</Text>
            <Text style={styles.emptyText}>
              {filterType === 'all' 
                ? 'No tienes notificaciones en este momento'
                : `No hay notificaciones de tipo "${filterType}"`
              }
            </Text>
          </View>
        }
      />

      {/* Settings Modal */}
      <Modal
        visible={isSettingsModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalBackButton}
              onPress={() => setIsSettingsModalVisible(false)}
            >
              <Icon name="close" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Configuración de Notificaciones</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Text style={styles.sectionTitle}>Tipos de Notificaciones</Text>
            
            {[
              { key: 'security', label: 'Alertas de Seguridad', icon: 'security' },
              { key: 'visitor', label: 'Visitantes', icon: 'person' },
              { key: 'access', label: 'Control de Acceso', icon: 'lock' },
              { key: 'maintenance', label: 'Mantenimiento', icon: 'build' },
              { key: 'announcement', label: 'Anuncios', icon: 'campaign' },
              { key: 'system', label: 'Sistema', icon: 'settings' },
            ].map((type) => (
              <View key={type.key} style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Icon name={type.icon} size={24} color="#666" />
                  <Text style={styles.settingLabel}>{type.label}</Text>
                </View>
                <Switch
                  value={settings[type.key]?.enabled !== false}
                  onValueChange={(value) => {
                    const newSettings = {
                      ...settings,
                      [type.key]: { ...settings[type.key], enabled: value }
                    };
                    updateSettings(newSettings);
                  }}
                  trackColor={{ false: '#e0e0e0', true: '#007AFF' }}
                  thumbColor="#fff"
                />
              </View>
            ))}

            <Text style={styles.sectionTitle}>Configuración General</Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Icon name="vibration" size={24} color="#666" />
                <Text style={styles.settingLabel}>Vibración</Text>
              </View>
              <Switch
                value={settings.vibration !== false}
                onValueChange={(value) => {
                  updateSettings({ ...settings, vibration: value });
                }}
                trackColor={{ false: '#e0e0e0', true: '#007AFF' }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Icon name="volume-up" size={24} color="#666" />
                <Text style={styles.settingLabel}>Sonido</Text>
              </View>
              <Switch
                value={settings.sound !== false}
                onValueChange={(value) => {
                  updateSettings({ ...settings, sound: value });
                }}
                trackColor={{ false: '#e0e0e0', true: '#007AFF' }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Icon name="do-not-disturb" size={24} color="#666" />
                <Text style={styles.settingLabel}>No Molestar</Text>
              </View>
              <Switch
                value={settings.doNotDisturb === true}
                onValueChange={(value) => {
                  updateSettings({ ...settings, doNotDisturb: value });
                }}
                trackColor={{ false: '#e0e0e0', true: '#007AFF' }}
                thumbColor="#fff"
              />
            </View>

            <Text style={styles.sectionTitle}>Horario de No Molestar</Text>
            
            <View style={styles.timeRangeSetting}>
              <Text style={styles.timeLabel}>Desde:</Text>
              <TouchableOpacity style={styles.timeButton}>
                <Text style={styles.timeButtonText}>
                  {settings.doNotDisturbStart || '22:00'}
                </Text>
              </TouchableOpacity>
              
              <Text style={styles.timeLabel}>Hasta:</Text>
              <TouchableOpacity style={styles.timeButton}>
                <Text style={styles.timeButtonText}>
                  {settings.doNotDisturbEnd || '07:00'}
                </Text>
              </TouchableOpacity>
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
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
  },
  unreadBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  connectionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
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
  filterContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  activeFilterButton: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: '#fff',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  actionButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  actionButtonSecondaryText: {
    color: '#007AFF',
    fontWeight: '500',
    marginLeft: 8,
  },
  listContainer: {
    padding: 16,
  },
  notificationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationContent: {
    padding: 16,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  notificationLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    flex: 1,
  },
  unreadText: {
    fontWeight: '600',
  },
  emergencyBadge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  emergencyText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#8E8E93',
  },
  notificationActions: {
    alignItems: 'center',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    marginBottom: 8,
  },
  actionButton: {
    padding: 4,
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  longContent: {
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  primaryActionBtn: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  destructiveActionBtn: {
    backgroundColor: '#FF3B30',
    borderColor: '#FF3B30',
  },
  actionBtnText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  primaryActionBtnText: {
    color: '#fff',
  },
  destructiveActionBtnText: {
    color: '#fff',
  },
  attachments: {
    marginTop: 12,
  },
  attachmentsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginBottom: 8,
  },
  attachment: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  attachmentName: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 8,
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
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: '#000',
    marginLeft: 12,
  },
  timeRangeSetting: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  timeLabel: {
    fontSize: 16,
    color: '#000',
  },
  timeButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  timeButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
});

export default NotificationCenterScreen;
