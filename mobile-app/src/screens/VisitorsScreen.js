/**
 * Visitors Screen - Gestión de Visitantes
 * Pantalla principal para la gestión completa de visitantes
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Text,
  Surface,
  FAB,
  Searchbar,
  Menu,
  Button,
  Chip,
  Card,
  Avatar,
  IconButton,
  Badge,
  Divider,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Store
import {
  fetchVisitors,
  searchVisitors,
  updateVisitorStatus,
  deleteVisitor,
} from '../store/slices/visitorsSlice';

// Components
import LoadingScreen from '../components/LoadingScreen';
import StatisticCard from '../components/StatisticCard';

// Styles
import { theme } from '../styles/theme';

// Utils
import { showSuccessMessage, showErrorMessage } from '../utils/errorHandler';

const VisitorsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const {
    visitors,
    loading,
    refreshing,
    error,
    stats,
    searchResults,
  } = useSelector(state => state.visitors);

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedVisitor, setSelectedVisitor] = useState(null);

  // Filter options
  const filterOptions = [
    { key: 'all', label: 'Todos', icon: 'account-group' },
    { key: 'pending', label: 'Pendientes', icon: 'clock-outline' },
    { key: 'approved', label: 'Aprobados', icon: 'check-circle' },
    { key: 'active', label: 'Activos', icon: 'account-check' },
    { key: 'completed', label: 'Completados', icon: 'check-all' },
    { key: 'rejected', label: 'Rechazados', icon: 'close-circle' },
  ];

  // Status options for updates
  const statusOptions = [
    { key: 'approved', label: 'Aprobar', icon: 'check-circle', color: theme.colors.success },
    { key: 'rejected', label: 'Rechazar', icon: 'close-circle', color: theme.colors.error },
    { key: 'active', label: 'Activar', icon: 'account-check', color: theme.colors.primary },
    { key: 'completed', label: 'Completar', icon: 'check-all', color: theme.colors.onSurface },
  ];

  useEffect(() => {
    loadVisitors();
  }, []);

  useEffect(() => {
    if (searchQuery.length > 0) {
      handleSearch();
    }
  }, [searchQuery]);

  const loadVisitors = useCallback(async () => {
    try {
      await dispatch(fetchVisitors()).unwrap();
    } catch (error) {
      console.error('Error loading visitors:', error);
    }
  }, [dispatch]);

  const handleRefresh = useCallback(async () => {
    await loadVisitors();
  }, [loadVisitors]);

  const handleSearch = useCallback(async () => {
    if (searchQuery.trim().length === 0) return;
    
    try {
      await dispatch(searchVisitors({
        query: searchQuery,
        filters: { status: selectedFilter !== 'all' ? selectedFilter : undefined }
      })).unwrap();
    } catch (error) {
      console.error('Error searching visitors:', error);
    }
  }, [dispatch, searchQuery, selectedFilter]);

  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
    setFilterMenuVisible(false);
    
    if (searchQuery.length > 0) {
      handleSearch();
    }
  };

  const handleStatusUpdate = async (visitor, newStatus) => {
    try {
      await dispatch(updateVisitorStatus({
        visitorId: visitor.id,
        status: newStatus,
      })).unwrap();
      
      showSuccessMessage('Estado Actualizado', `Visitante ${newStatus === 'approved' ? 'aprobado' : 'actualizado'} correctamente`);
      setStatusMenuVisible(false);
      setSelectedVisitor(null);
    } catch (error) {
      console.error('Error updating visitor status:', error);
    }
  };

  const handleDeleteVisitor = (visitor) => {
    Alert.alert(
      'Confirmar Eliminación',
      `¿Estás seguro de que deseas eliminar a ${visitor.firstName} ${visitor.lastName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteVisitor(visitor.id)).unwrap();
              showSuccessMessage('Visitante Eliminado', 'El visitante ha sido eliminado correctamente');
            } catch (error) {
              console.error('Error deleting visitor:', error);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: theme.colors.warning,
      approved: theme.colors.success,
      active: theme.colors.primary,
      completed: theme.colors.onSurface,
      rejected: theme.colors.error,
    };
    return colors[status] || theme.colors.onSurface;
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: 'clock-outline',
      approved: 'check-circle',
      active: 'account-check',
      completed: 'check-all',
      rejected: 'close-circle',
    };
    return icons[status] || 'help-circle';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pendiente',
      approved: 'Aprobado',
      active: 'Activo',
      completed: 'Completado',
      rejected: 'Rechazado',
    };
    return labels[status] || status;
  };

  const renderVisitorItem = ({ item: visitor }) => (
    <Card style={styles.visitorCard}>
      <Card.Content>
        <View style={styles.visitorHeader}>
          <View style={styles.visitorInfo}>
            <Avatar.Image
              size={50}
              source={visitor.photo ? { uri: visitor.photo } : undefined}
              style={styles.avatar}
            />
            <View style={styles.visitorDetails}>
              <Text variant="titleMedium" style={styles.visitorName}>
                {visitor.firstName} {visitor.lastName}
              </Text>
              <Text variant="bodyMedium" style={styles.visitorCompany}>
                {visitor.company}
              </Text>
              <Text variant="bodySmall" style={styles.visitorPhone}>
                {visitor.phone}
              </Text>
            </View>
          </View>
          
          <View style={styles.visitorActions}>
            <Chip
              icon={getStatusIcon(visitor.status)}
              style={[styles.statusChip, { backgroundColor: getStatusColor(visitor.status) }]}
              textStyle={styles.statusChipText}
            >
              {getStatusLabel(visitor.status)}
            </Chip>
            
            <Menu
              visible={statusMenuVisible && selectedVisitor?.id === visitor.id}
              onDismiss={() => {
                setStatusMenuVisible(false);
                setSelectedVisitor(null);
              }}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  size={20}
                  onPress={() => {
                    setSelectedVisitor(visitor);
                    setStatusMenuVisible(true);
                  }}
                />
              }
            >
              {statusOptions.map((option) => (
                <Menu.Item
                  key={option.key}
                  leadingIcon={option.icon}
                  title={option.label}
                  onPress={() => handleStatusUpdate(visitor, option.key)}
                  disabled={visitor.status === option.key}
                />
              ))}
              <Divider />
              <Menu.Item
                leadingIcon="eye"
                title="Ver Detalles"
                onPress={() => {
                  setStatusMenuVisible(false);
                  setSelectedVisitor(null);
                  navigation.navigate('VisitorDetails', { visitor });
                }}
              />
              <Menu.Item
                leadingIcon="delete"
                title="Eliminar"
                onPress={() => {
                  setStatusMenuVisible(false);
                  setSelectedVisitor(null);
                  handleDeleteVisitor(visitor);
                }}
              />
            </Menu>
          </View>
        </View>

        <View style={styles.visitorMeta}>
          <View style={styles.metaItem}>
            <Icon name="calendar" size={16} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodySmall" style={styles.metaText}>
              {new Date(visitor.visitDate).toLocaleDateString()}
            </Text>
          </View>
          
          <View style={styles.metaItem}>
            <Icon name="clock-outline" size={16} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodySmall" style={styles.metaText}>
              {visitor.visitTime}
            </Text>
          </View>
          
          {visitor.hostName && (
            <View style={styles.metaItem}>
              <Icon name="account" size={16} color={theme.colors.onSurfaceVariant} />
              <Text variant="bodySmall" style={styles.metaText}>
                {visitor.hostName}
              </Text>
            </View>
          )}
        </View>

        {visitor.purpose && (
          <Text variant="bodySmall" style={styles.visitorPurpose}>
            {visitor.purpose}
          </Text>
        )}
      </Card.Content>
    </Card>
  );

  const getFilteredVisitors = () => {
    const dataSource = searchQuery.length > 0 ? searchResults : visitors;
    
    if (selectedFilter === 'all') {
      return dataSource;
    }
    
    return dataSource.filter(visitor => visitor.status === selectedFilter);
  };

  if (loading && visitors.length === 0) {
    return <LoadingScreen message="Cargando visitantes..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Statistics Header */}
      <Surface style={styles.statsHeader}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsContainer}
        >
          <StatisticCard
            title="Total"
            value={stats?.total || 0}
            icon="account-group"
            color={theme.colors.primary}
            size="small"
          />
          <StatisticCard
            title="Activos"
            value={stats?.active || 0}
            icon="account-check"
            color={theme.colors.success}
            size="small"
          />
          <StatisticCard
            title="Pendientes"
            value={stats?.pending || 0}
            icon="clock-outline"
            color={theme.colors.warning}
            size="small"
          />
          <StatisticCard
            title="Hoy"
            value={stats?.today || 0}
            icon="calendar-today"
            color={theme.colors.secondary}
            size="small"
          />
        </ScrollView>
      </Surface>

      {/* Search and Filters */}
      <Surface style={styles.searchContainer}>
        <View style={styles.searchRow}>
          <Searchbar
            placeholder="Buscar visitantes..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
            icon="account-search"
          />
          
          <Menu
            visible={filterMenuVisible}
            onDismiss={() => setFilterMenuVisible(false)}
            anchor={
              <IconButton
                icon="filter-variant"
                size={24}
                onPress={() => setFilterMenuVisible(true)}
                style={styles.filterButton}
              />
            }
          >
            {filterOptions.map((option) => (
              <Menu.Item
                key={option.key}
                leadingIcon={option.icon}
                title={option.label}
                onPress={() => handleFilterChange(option.key)}
                titleStyle={selectedFilter === option.key ? { fontWeight: 'bold' } : {}}
              />
            ))}
          </Menu>
        </View>

        {selectedFilter !== 'all' && (
          <View style={styles.activeFilters}>
            <Chip
              icon={filterOptions.find(f => f.key === selectedFilter)?.icon}
              onClose={() => handleFilterChange('all')}
              style={styles.filterChip}
            >
              {filterOptions.find(f => f.key === selectedFilter)?.label}
            </Chip>
          </View>
        )}
      </Surface>

      {/* Visitors List */}
      <View style={styles.listContainer}>
        <FlashList
          data={getFilteredVisitors()}
          renderItem={renderVisitorItem}
          keyExtractor={(item) => item.id.toString()}
          estimatedItemSize={160}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
            />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Icon name="account-search" size={64} color={theme.colors.onSurfaceVariant} />
              <Text variant="headlineSmall" style={styles.emptyTitle}>
                {searchQuery ? 'Sin resultados' : 'No hay visitantes'}
              </Text>
              <Text variant="bodyMedium" style={styles.emptySubtitle}>
                {searchQuery 
                  ? 'No se encontraron visitantes con ese criterio'
                  : 'Comienza registrando tu primer visitante'
                }
              </Text>
              {!searchQuery && (
                <Button
                  mode="contained"
                  onPress={() => navigation.navigate('VisitorRegistration')}
                  style={styles.emptyButton}
                  icon="account-plus"
                >
                  Registrar Visitante
                </Button>
              )}
            </View>
          )}
          contentContainerStyle={styles.listContent}
        />
      </View>

      {/* Floating Action Button */}
      <FAB
        icon="account-plus"
        style={styles.fab}
        onPress={() => navigation.navigate('VisitorRegistration')}
        label="Registrar"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  statsHeader: {
    elevation: 2,
    paddingVertical: theme.spacing.sm,
  },
  statsContainer: {
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  searchContainer: {
    elevation: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchbar: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  filterButton: {
    margin: 0,
  },
  activeFilters: {
    flexDirection: 'row',
    marginTop: theme.spacing.sm,
  },
  filterChip: {
    marginRight: theme.spacing.sm,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: theme.spacing.md,
  },
  visitorCard: {
    marginBottom: theme.spacing.md,
  },
  visitorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  visitorInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  avatar: {
    marginRight: theme.spacing.md,
  },
  visitorDetails: {
    flex: 1,
  },
  visitorName: {
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  visitorCompany: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.xs,
  },
  visitorPhone: {
    color: theme.colors.onSurfaceVariant,
  },
  visitorActions: {
    alignItems: 'flex-end',
  },
  statusChip: {
    marginBottom: theme.spacing.xs,
  },
  statusChipText: {
    color: theme.colors.onPrimary,
    fontSize: 12,
  },
  visitorMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.spacing.lg,
    marginBottom: theme.spacing.xs,
  },
  metaText: {
    marginLeft: theme.spacing.xs,
    color: theme.colors.onSurfaceVariant,
  },
  visitorPurpose: {
    color: theme.colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl * 2,
  },
  emptyTitle: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.lg,
  },
  emptyButton: {
    marginTop: theme.spacing.md,
  },
  fab: {
    position: 'absolute',
    right: theme.spacing.lg,
    bottom: theme.spacing.lg,
  },
});

export default VisitorsScreen;
