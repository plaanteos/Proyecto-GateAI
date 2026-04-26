/**
 * Splash Screen - Pantalla de bienvenida
 * Pantalla inicial que se muestra mientras la aplicación se carga
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { theme } from '../styles/theme';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    startAnimations();
  }, []);

  const startAnimations = () => {
    // Animación del logo
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Animación del texto
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    }, 500);
  };

  return (
    <>
      <StatusBar
        backgroundColor={theme.colors.primary}
        barStyle="light-content"
        translucent
      />
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryDark]}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          {/* Logo animado */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={styles.logoWrapper}>
              <Icon
                name="shield-check"
                size={80}
                color={theme.colors.onPrimary}
              />
            </View>
          </Animated.View>

          {/* Título animado */}
          <Animated.View
            style={[
              styles.titleContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.title}>UnionTech</Text>
            <Text style={styles.subtitle}>Security System</Text>
          </Animated.View>

          {/* Versión */}
          <Animated.View
            style={[
              styles.versionContainer,
              {
                opacity: fadeAnim,
              },
            ]}
          >
            <Text style={styles.version}>v1.0.0</Text>
          </Animated.View>
        </View>

        {/* Indicador de carga */}
        <View style={styles.loadingContainer}>
          <View style={styles.loadingBar}>
            <Animated.View
              style={[
                styles.loadingProgress,
                {
                  opacity: fadeAnim,
                },
              ]}
            />
          </View>
          <Animated.Text
            style={[
              styles.loadingText,
              {
                opacity: fadeAnim,
              },
            ]}
          >
            Iniciando sistema de seguridad...
          </Animated.Text>
        </View>

        {/* Elementos decorativos */}
        <Animated.View
          style={[
            styles.decorativeElement1,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.decorativeElement2,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        />
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  logoContainer: {
    marginBottom: theme.spacing.xl,
  },
  logoWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: 32,
    fontFamily: theme.typography.bold,
    color: theme.colors.onPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: theme.typography.regular,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    letterSpacing: 2,
  },
  versionContainer: {
    position: 'absolute',
    bottom: 120,
  },
  version: {
    fontSize: 14,
    fontFamily: theme.typography.medium,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
    width: width * 0.8,
  },
  loadingBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
  },
  loadingProgress: {
    height: '100%',
    backgroundColor: theme.colors.onPrimary,
    borderRadius: 2,
    width: '70%',
  },
  loadingText: {
    fontSize: 14,
    fontFamily: theme.typography.medium,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  decorativeElement1: {
    position: 'absolute',
    top: 100,
    right: 50,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  decorativeElement2: {
    position: 'absolute',
    bottom: 200,
    left: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
});
