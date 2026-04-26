/**
 * Dashboard Screen - Pantalla principal del sistema
 * Vista general con estadísticas y accesos rápidos
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Card, FAB, Chip, Badge } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSelector, useDispatch } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';

import {
  selectUser,
  selectIsAuthenticated,
} from '../store/slices/authSlice';
import {
  fetchVisitorsAsync,
  selectVisitorsStatistics,
  selectPendingVisitors,
  selectRecentVisits,
} from '../store/slices/visitorsSlice';
import {
  fetchZonesAsync,
  fetchSecurityAlertsAsync,
  selectAccessStatistics,
  selectSecurityAlerts,
  selectZones,
} from '../store/slices/accessControlSlice';
import { theme } from '../styles/theme';
import LoadingScreen from '../components/LoadingScreen';
import QuickActionCard from '../components/QuickActionCard';
import StatisticCard from '../components/StatisticCard';
import RecentActivityList from '../components/RecentActivityList';
import SecurityStatusCard from '../components/SecurityStatusCard';

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }) {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const visitorsStats = useSelector(selectVisitorsStatistics);
  const accessStats = useSelector(selectAccessStatistics);
  const pendingVisitors = useSelector(selectPendingVisitors);
  const recentVisits = useSelector(selectRecentVisits);
  const securityAlerts = useSelector(selectSecurityAlerts);
  const zones = useSelector(selectZones);

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [])
  );

  useEffect(() => {
    // Actualizar hora cada minuto
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      await Promise.all([
        dispatch(fetchVisitorsAsync({})),
        dispatch(fetchZonesAsync()),
        dispatch(fetchSecurityAlertsAsync()),
      ]);
    } catch (error) {
      console.error('Error al cargar dashboard:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos del dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const getSecurityLevel = () => {
    const unreadAlerts = securityAlerts.filter(alert => !alert.read).length;
    if (unreadAlerts > 5) return { level: 'high', color: theme.colors.error, text: 'Alto' };
    if (unreadAlerts > 2) return { level: 'medium', color: theme.colors.warning, text: 'Medio' };
    return { level: 'normal', color: theme.colors.success, text: 'Normal' };
  };

  const quickActions = [
    {
      id: 'register-visitor',
      title: 'Registrar Visitante',
      icon: 'account-plus',
      color: theme.colors.primary,
      onPress: () => navigation.navigate('RegisterVisitor'),
    },
    {
      id: 'biometric-validation',
      title: 'Validación Biométrica',
      icon: 'fingerprint',
      color: theme.colors.secondary,
      onPress: () => navigation.navigate('BiometricValidation'),
    },
    {
      id: 'security-alerts',
      title: 'Alertas de Seguridad',
      icon: 'shield-alert',
      color: theme.colors.warning,
      badge: securityAlerts.filter(alert => !alert.read).length,
      onPress: () => navigation.navigate('SecurityAlerts'),
    },
    {
      id: 'access-logs',
      title: 'Logs de Acceso',
      icon: 'history',
      color: theme.colors.info,
      onPress: () => navigation.navigate('AccessLogs'),
    },
  ];

  if (!isAuthenticated) {
    return <LoadingScreen />;
  }

  if (isLoading) {
    return <LoadingScreen message="Cargando dashboard..." />;
  }

  const securityLevel = getSecurityLevel();

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.primaryDark]}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <View style={styles.greetingContainer}>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.userName}>
                {user?.name || 'Usuario'}
              </Text>
              <Text style={styles.currentTime}>
                {currentTime.toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => navigation.navigate('Profile')}
            >
              <Icon
                name="account-circle"
                size={40}
                color={theme.colors.onPrimary}
              />
            </TouchableOpacity>
          </View>

          {/* Estado de Seguridad */}
          <SecurityStatusCard
            level={securityLevel.level}
            levelText={securityLevel.text}
            levelColor={securityLevel.color}
            alertsCount={securityAlerts.filter(alert => !alert.read).length}
            activeZones={zones.filter(zone => zone.active).length}
            totalZones={zones.length}
          />
        </LinearGradient>

        {/* Estadísticas Principales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estadísticas de Hoy</Text>
          <View style={styles.statsGrid}>
            <StatisticCard
              title="Visitantes"
              value={visitorsStats.todayVisitors || 0}
              icon="account-group"
              color={theme.colors.primary}
              subtitle="Hoy"
            />
            <StatisticCard
              title="Accesos"
              value={accessStats.totalAccesses || 0}
              icon="door-open"
              color={theme.colors.success}
              subtitle="Total"
            />
            <StatisticCard
              title="Pendientes"
              value={pendingVisitors.length || 0}
              icon="clock-outline"
              color={theme.colors.warning}
              subtitle="Aprobaciones"
            />
            <StatisticCard
              title="Alertas"
              value={securityAlerts.filter(alert => !alert.read).length || 0}
              icon="alert"
              color={theme.colors.error}
              subtitle="Sin leer"
            />
          </View>
        </View>

        {/* Acciones Rápidas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <QuickActionCard
                key={action.id}
                title={action.title}
                icon={action.icon}
                color={action.color}
                badge={action.badge}
                onPress={action.onPress}
              />
            ))}
          </View>
        </View>

        {/* Actividad Reciente */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Actividad Reciente</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('AccessLogs')}
              style={styles.seeAllButton}
            >
              <Text style={styles.seeAllText}>Ver todo</Text>
              <Icon
                name="chevron-right"
                size={20}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          </View>
          <RecentActivityList
            activities={recentVisits.slice(0, 5)}
            onActivityPress={(activity) => {
              navigation.navigate('VisitorDetails', { id: activity.visitor.id });
            }}
          />
        </View>

        {/* Alertas Recientes */}
        {securityAlerts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Alertas de Seguridad</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('SecurityAlerts')}
                style={styles.seeAllButton}
              >
                <Text style={styles.seeAllText}>Ver todas</Text>
                <Icon
                  name="chevron-right"
                  size={20}
                  color={theme.colors.error}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.alertsContainer}>
              {securityAlerts.slice(0, 3).map((alert) => (
                <Card key={alert.id} style={styles.alertCard}>
                  <Card.Content style={styles.alertContent}>
                    <View style={styles.alertHeader}>
                      <Icon
                        name="alert-circle"
                        size={20}
                        color={theme.colors.error}
                      />
                      <Text style={styles.alertTitle}>{alert.type}</Text>
                      {!alert.read && <Badge style={styles.alertBadge} />}
                    </View>
                    <Text style={styles.alertMessage} numberOfLines={2}>
                      {alert.message}
                    </Text>
                    <Text style={styles.alertTime}>
                      {new Date(alert.timestamp).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </Card.Content>
                </Card>
              ))}
            </View>
          </View>
        )}

        {/* Espacio para el FAB */}
        <View style={styles.fabSpace} />
      </ScrollView>

      {/* Botón de Acción Flotante */}
      <FAB
        style={styles.fab}
        icon="plus"
        label="Nuevo"
        onPress={() => navigation.navigate('RegisterVisitor')}
        color={theme.colors.onPrimary}
        animated={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    fontFamily: theme.typography.regular,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  userName: {
    fontSize: 24,
    fontFamily: theme.typography.bold,
    color: theme.colors.onPrimary,
    marginVertical: theme.spacing.xs,
  },
  currentTime: {
    fontSize: 14,
    fontFamily: theme.typography.regular,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  profileButton: {
    padding: theme.spacing.sm,
  },
  section: {
    padding: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: theme.typography.bold,
    color: theme.colors.text,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 14,
    fontFamily: theme.typography.medium,
    color: theme.colors.primary,
    marginRight: theme.spacing.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  alertsContainer: {
    gap: theme.spacing.sm,
  },
  alertCard: {
    backgroundColor: theme.colors.surface,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.error,
  },
  alertContent: {
    paddingVertical: theme.spacing.md,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  alertTitle: {
    fontSize: 14,
    fontFamily: theme.typography.bold,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  alertBadge: {
    backgroundColor: theme.colors.error,
    width: 8,
    height: 8,
  },
  alertMessage: {
    fontSize: 14,
    fontFamily: theme.typography.regular,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  alertTime: {
    fontSize: 12,
    fontFamily: theme.typography.regular,
    color: theme.colors.textTertiary,
  },
  fab: {
    position: 'absolute',
    margin: theme.spacing.md,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
  fabSpace: {
    height: 80,
  },
});
