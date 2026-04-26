/**
 * Statistic Card Component - Tarjeta de estadísticas
 * Componente para mostrar métricas numéricas con iconos
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Card } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { theme } from '../styles/theme';

const { width } = Dimensions.get('window');
const cardWidth = (width - (theme.spacing.lg * 3)) / 2;

const StatisticCard = ({
  title,
  value,
  icon,
  color = theme.colors.primary,
  subtitle,
  onPress,
  trend,
  trendPercentage,
  loading = false,
}) => {
  const getTrendIcon = () => {
    if (trend === 'up') return 'trending-up';
    if (trend === 'down') return 'trending-down';
    return 'trending-neutral';
  };

  const getTrendColor = () => {
    if (trend === 'up') return theme.colors.success;
    if (trend === 'down') return theme.colors.error;
    return theme.colors.textSecondary;
  };

  const CardContent = () => (
    <Card style={styles.card} elevation={3}>
      <LinearGradient
        colors={[color, `${color}CC`]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          {/* Icono */}
          <View style={styles.iconContainer}>
            <Icon
              name={icon}
              size={28}
              color={theme.colors.onPrimary}
            />
          </View>

          {/* Valor principal */}
          <View style={styles.valueContainer}>
            <Text style={styles.value} numberOfLines={1}>
              {loading ? '...' : value}
            </Text>
            
            {/* Tendencia */}
            {trend && trendPercentage && !loading && (
              <View style={styles.trendContainer}>
                <Icon
                  name={getTrendIcon()}
                  size={16}
                  color={getTrendColor()}
                />
                <Text style={[styles.trendText, { color: getTrendColor() }]}>
                  {trendPercentage}%
                </Text>
              </View>
            )}
          </View>

          {/* Título y subtítulo */}
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            {subtitle && (
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>
      </LinearGradient>
    </Card>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={styles.container}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <CardContent />
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <CardContent />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: cardWidth,
    marginBottom: theme.spacing.md,
  },
  card: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  gradient: {
    padding: theme.spacing.md,
    minHeight: 120,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  iconContainer: {
    alignSelf: 'flex-end',
    marginBottom: theme.spacing.sm,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  value: {
    fontSize: 24,
    fontFamily: theme.typography.bold,
    color: theme.colors.onPrimary,
    flex: 1,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  trendText: {
    fontSize: 12,
    fontFamily: theme.typography.bold,
    marginLeft: 2,
  },
  textContainer: {
    marginTop: 'auto',
  },
  title: {
    fontSize: 14,
    fontFamily: theme.typography.bold,
    color: theme.colors.onPrimary,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: theme.typography.regular,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});

export default StatisticCard;
