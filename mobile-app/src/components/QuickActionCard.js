/**
 * Quick Action Card Component - Tarjeta de acción rápida
 * Componente para acciones rápidas en el dashboard
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Card, Badge } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../styles/theme';

const { width } = Dimensions.get('window');
const cardWidth = (width - (theme.spacing.lg * 3)) / 2;

const QuickActionCard = ({
  title,
  icon,
  color = theme.colors.primary,
  onPress,
  badge,
  disabled = false,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        disabled && styles.disabledContainer,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Card style={[
        styles.card,
        disabled && styles.disabledCard,
      ]}>
        <Card.Content style={styles.content}>
          {/* Badge */}
          {badge && badge > 0 && (
            <Badge
              style={[styles.badge, { backgroundColor: color }]}
              size={20}
            >
              {badge > 99 ? '99+' : badge}
            </Badge>
          )}

          {/* Icono */}
          <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
            <Icon
              name={icon}
              size={32}
              color={disabled ? theme.colors.disabled : color}
            />
          </View>

          {/* Título */}
          <Text
            style={[
              styles.title,
              disabled && styles.disabledText,
            ]}
            numberOfLines={2}
          >
            {title}
          </Text>

          {/* Indicador de acción */}
          <View style={styles.actionIndicator}>
            <Icon
              name="chevron-right"
              size={20}
              color={disabled ? theme.colors.disabled : color}
            />
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: cardWidth,
    marginBottom: theme.spacing.md,
  },
  disabledContainer: {
    opacity: 0.6,
  },
  card: {
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.small,
  },
  disabledCard: {
    backgroundColor: theme.colors.surfaceDisabled,
  },
  content: {
    padding: theme.spacing.md,
    minHeight: 120,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    zIndex: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: 14,
    fontFamily: theme.typography.bold,
    color: theme.colors.text,
    textAlign: 'left',
    lineHeight: 20,
    flex: 1,
  },
  disabledText: {
    color: theme.colors.disabled,
  },
  actionIndicator: {
    position: 'absolute',
    bottom: theme.spacing.sm,
    right: theme.spacing.sm,
  },
});

export default QuickActionCard;
