/**
 * Recent Activity List Component - Lista de actividad reciente
 * Muestra las actividades recientes del sistema
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Card, Avatar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../styles/theme';

const RecentActivityList = ({
  activities = [],
  onActivityPress,
  showEmpty = true,
  maxItems = 5,
}) => {
  const limitedActivities = activities.slice(0, maxItems);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'entry':
        return 'login';
      case 'exit':
        return 'logout';
      case 'registration':
        return 'account-plus';
      case 'approval':
        return 'check-circle';
      case 'rejection':
        return 'close-circle';
      default:
        return 'account';
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'entry':
        return theme.colors.success;
      case 'exit':
        return theme.colors.info;
      case 'registration':
        return theme.colors.primary;
      case 'approval':
        return theme.colors.success;
      case 'rejection':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getActivityDescription = (activity) => {
    const visitor = activity.visitor;
    const type = activity.type;
    
    switch (type) {
      case 'entry':
        return `${visitor.name} ingresó al edificio`;
      case 'exit':
        return `${visitor.name} salió del edificio`;
      case 'registration':
        return `${visitor.name} se registró como visitante`;
      case 'approval':
        return `${visitor.name} fue aprobado`;
      case 'rejection':
        return `${visitor.name} fue rechazado`;
      default:
        return `Actividad de ${visitor.name}`;
    }
  };

  const formatTime = (timestamp) => {
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
    
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  const renderActivityItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.activityItem}
      onPress={() => onActivityPress && onActivityPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.activityContent}>
        {/* Avatar/Icono */}
        <Avatar.Icon
          size={40}
          icon={getActivityIcon(item.type)}
          style={[
            styles.activityIcon,
            { backgroundColor: `${getActivityColor(item.type)}15` }
          ]}
          color={getActivityColor(item.type)}
        />

        {/* Contenido */}
        <View style={styles.activityDetails}>
          <Text style={styles.activityDescription} numberOfLines={2}>
            {getActivityDescription(item)}
          </Text>
          
          <View style={styles.activityMeta}>
            <Text style={styles.activityTime}>
              {formatTime(item.timestamp)}
            </Text>
            
            {item.visitor.company && (
              <>
                <View style={styles.metaSeparator} />
                <Text style={styles.activityCompany} numberOfLines={1}>
                  {item.visitor.company}
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Indicador */}
        <Icon
          name="chevron-right"
          size={20}
          color={theme.colors.textTertiary}
        />
      </View>
    </TouchableOpacity>
  );

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon
        name="history"
        size={48}
        color={theme.colors.textTertiary}
      />
      <Text style={styles.emptyText}>
        No hay actividad reciente
      </Text>
      <Text style={styles.emptySubtext}>
        Las actividades aparecerán aquí cuando ocurran
      </Text>
    </View>
  );

  if (limitedActivities.length === 0 && showEmpty) {
    return <EmptyState />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={limitedActivities}
        renderItem={renderActivityItem}
        keyExtractor={(item, index) => `${item.id || index}-${item.timestamp}`}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  activityItem: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.xs,
    ...theme.shadows.small,
  },
  activityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  activityIcon: {
    marginRight: theme.spacing.md,
  },
  activityDetails: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  activityDescription: {
    fontSize: 14,
    fontFamily: theme.typography.medium,
    color: theme.colors.text,
    lineHeight: 20,
    marginBottom: theme.spacing.xs,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityTime: {
    fontSize: 12,
    fontFamily: theme.typography.regular,
    color: theme.colors.textSecondary,
  },
  metaSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.textTertiary,
    marginHorizontal: theme.spacing.sm,
  },
  activityCompany: {
    fontSize: 12,
    fontFamily: theme.typography.regular,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  separator: {
    height: theme.spacing.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl * 2,
    paddingHorizontal: theme.spacing.lg,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: theme.typography.medium,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: theme.typography.regular,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default RecentActivityList;
