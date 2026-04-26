/**
 * Loading Screen Component - Pantalla de carga
 * Componente reutilizable para mostrar estados de carga
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../styles/theme';

const LoadingScreen = ({ 
  message = 'Cargando...', 
  showIcon = true,
  backgroundColor = theme.colors.background,
  color = theme.colors.primary 
}) => {
  const spinValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spin.start();

    return () => spin.stop();
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.content}>
        {showIcon && (
          <Animated.View
            style={[
              styles.iconContainer,
              { transform: [{ rotate: spin }] },
            ]}
          >
            <Icon
              name="shield-check"
              size={60}
              color={color}
            />
          </Animated.View>
        )}
        
        <ActivityIndicator
          size="large"
          color={color}
          style={styles.spinner}
        />
        
        <Text style={[styles.message, { color }]}>
          {message}
        </Text>
        
        <View style={styles.dots}>
          <Animated.Text style={[styles.dot, { color }]}>•</Animated.Text>
          <Animated.Text style={[styles.dot, { color }]}>•</Animated.Text>
          <Animated.Text style={[styles.dot, { color }]}>•</Animated.Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: theme.spacing.lg,
    opacity: 0.8,
  },
  spinner: {
    marginVertical: theme.spacing.lg,
  },
  message: {
    fontSize: 16,
    fontFamily: theme.typography.medium,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    fontSize: 24,
    marginHorizontal: theme.spacing.xs,
    opacity: 0.6,
  },
});

export default LoadingScreen;
