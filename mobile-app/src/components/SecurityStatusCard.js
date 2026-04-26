/**
 * Security Status Card Component - Tarjeta de estado de seguridad
 * Muestra el nivel de seguridad actual del sistema
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Card, Chip } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../styles/theme';

const SecurityStatusCard = ({
  level = 'normal',
  levelText = 'Normal',
  levelColor = theme.colors.success,
  alertsCount = 0,
  activeZones = 0,
  totalZones = 0,
  onPress,
}) => {
  const getSecurityIcon = () => {
    switch (level) {
      case 'high':
        return 'shield-alert';
      case 'medium':
        return 'shield-half-full';
      default:
        return 'shield-check';
    }
  };

  const getSecurityMessage = () => {
    switch (level) {
      case 'high':
        return 'Atención requerida';
      case 'medium':
        return 'Revisar alertas';
      default:
        return 'Sistema seguro';
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={!onPress}
    >
      <Card style={styles.card}>
        <Card.Content style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Icon
                name={getSecurityIcon()}
                size={24}
                color={levelColor}
              />
              <Text style={styles.title}>Estado de Seguridad</Text>
            </View>
            
            <Chip
              style={[styles.levelChip, { backgroundColor: `${levelColor}15` }]}
              textStyle={[styles.levelText, { color: levelColor }]}
              compact
            >
              {levelText}
            </Chip>
          </View>

          {/* Status Message */}
          <Text style={[styles.message, { color: levelColor }]}>
            {getSecurityMessage()}
          </Text>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            {/* Alertas */}
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Icon
                  name="alert-circle"
                  size={16}
                  color={alertsCount > 0 ? theme.colors.error : theme.colors.textSecondary}
                />
              </View>
              <View style={styles.statTextContainer}>
                <Text style={styles.statValue}>
                  {alertsCount}
                </Text>
                <Text style={styles.statLabel}>
                  Alertas
                </Text>
              </View>
            </View>

            {/* Separador */}
            <View style={styles.separator} />

            {/* Zonas Activas */}
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Icon
                  name="map-marker-multiple"
                  size={16}
                  color={activeZones > 0 ? theme.colors.success : theme.colors.textSecondary}
                />
              </View>
              <View style={styles.statTextContainer}>
                <Text style={styles.statValue}>
                  {activeZones}/{totalZones}
                </Text>
                <Text style={styles.statLabel}>
                  Zonas
                </Text>
              </View>
            </View>
          </View>

          {/* Action Indicator */}
          {onPress && (
            <View style={styles.actionContainer}>
              <Text style={styles.actionText}>Ver detalles</Text>
              <Icon
                name="chevron-right"
                size={20}
                color={theme.colors.primary}
              />
            </View>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: theme.spacing.md,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.small,
  },
  content: {
    padding: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontFamily: theme.typography.bold,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
  levelChip: {
    height: 28,
  },
  levelText: {
    fontSize: 12,
    fontFamily: theme.typography.bold,
  },
  message: {
    fontSize: 14,
    fontFamily: theme.typography.medium,
    marginBottom: theme.spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statIconContainer: {
    marginRight: theme.spacing.sm,
  },
  statTextContainer: {
    alignItems: 'flex-start',
  },
  statValue: {
    fontSize: 16,
    fontFamily: theme.typography.bold,
    color: theme.colors.text,
    lineHeight: 20,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: theme.typography.regular,
    color: theme.colors.textSecondary,
  },
  separator: {
    width: 1,
    height: 30,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.md,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  actionText: {
    fontSize: 14,
    fontFamily: theme.typography.medium,
    color: theme.colors.primary,
    marginRight: theme.spacing.xs,
  },
});

export default SecurityStatusCard;
