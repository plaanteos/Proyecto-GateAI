/**
 * UnionTech Mobile App - Tema y Estilos Profesionales
 * Sistema de diseño unificado para la aplicación móvil
 */

import { DefaultTheme } from 'react-native-paper';
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Paleta de colores profesional
export const colors = {
  // Colores primarios
  primary: '#667eea',
  primaryDark: '#5a6fd8',
  primaryLight: '#8fa2ff',
  
  // Colores secundarios
  secondary: '#764ba2',
  secondaryDark: '#6a4190',
  secondaryLight: '#9d7bc7',
  
  // Colores de estado
  success: '#27ae60',
  successLight: '#2ecc71',
  warning: '#f39c12',
  warningLight: '#f1c40f',
  error: '#e74c3c',
  errorLight: '#e55039',
  info: '#3498db',
  infoLight: '#74b9ff',
  
  // Colores neutros
  white: '#ffffff',
  black: '#000000',
  gray: '#95a5a6',
  grayLight: '#ecf0f1',
  grayDark: '#2c3e50',
  
  // Colores de fondo
  background: '#f8f9fa',
  backgroundDark: '#2c3e50',
  surface: '#ffffff',
  surfaceDark: '#34495e',
  
  // Colores de texto
  textPrimary: '#2c3e50',
  textSecondary: '#7f8c8d',
  textLight: '#bdc3c7',
  textWhite: '#ffffff',
  
  // Colores de acento
  accent: '#e67e22',
  accentLight: '#f39c12',
  
  // Colores de overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  
  // Gradientes
  gradientPrimary: ['#667eea', '#764ba2'],
  gradientSecondary: ['#27ae60', '#2ecc71'],
  gradientWarning: ['#f39c12', '#f1c40f'],
  gradientError: ['#e74c3c', '#e55039'],
};

// Tipografía profesional
export const typography = {
  // Tamaños de fuente
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    title: 28,
    heading: 24,
    subheading: 20,
    body: 16,
    caption: 14,
    small: 12,
  },
  
  // Familias de fuente
  families: {
    regular: 'System',
    medium: 'System-Medium',
    bold: 'System-Bold',
    light: 'System-Light',
  },
  
  // Alturas de línea
  lineHeights: {
    tight: 1.2,
    normal: 1.4,
    loose: 1.6,
  },
};

// Espaciado y dimensiones
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const dimensions = {
  screen: { width, height },
  
  // Tamaños de componentes
  buttonHeight: 48,
  inputHeight: 56,
  headerHeight: 64,
  tabBarHeight: 70,
  
  // Bordes y radios
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 24,
    full: 9999,
  },
  
  // Tamaños de iconos
  icons: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 32,
    xl: 40,
    xxl: 48,
  },
};

// Sombras y elevaciones
export const shadows = {
  sm: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
};

// Tema principal para React Native Paper
export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    accent: colors.accent,
    background: colors.background,
    surface: colors.surface,
    text: colors.textPrimary,
    disabled: colors.grayLight,
    placeholder: colors.textSecondary,
    backdrop: colors.overlay,
    notification: colors.error,
  },
  roundness: dimensions.borderRadius.md,
};

// Estilos globales comunes
export const globalStyles = {
  // Contenedores
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  contentContainer: {
    flex: 1,
    padding: spacing.md,
  },
  
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  
  // Cards y superficies
  card: {
    backgroundColor: colors.surface,
    borderRadius: dimensions.borderRadius.lg,
    padding: spacing.md,
    marginVertical: spacing.sm,
    ...shadows.md,
  },
  
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  
  // Botones
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: dimensions.borderRadius.md,
    height: dimensions.buttonHeight,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: spacing.sm,
    ...shadows.sm,
  },
  
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: dimensions.borderRadius.md,
    height: dimensions.buttonHeight,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  
  // Inputs
  textInput: {
    backgroundColor: colors.surface,
    borderRadius: dimensions.borderRadius.md,
    height: dimensions.inputHeight,
    paddingHorizontal: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.grayLight,
  },
  
  // Textos
  title: {
    fontSize: typography.sizes.title,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  
  subtitle: {
    fontSize: typography.sizes.heading,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  
  body: {
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
    lineHeight: typography.sizes.body * typography.lineHeights.normal,
  },
  
  caption: {
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
  },
  
  // Layout
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  spaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  // Separadores
  separator: {
    height: 1,
    backgroundColor: colors.grayLight,
    marginVertical: spacing.md,
  },
  
  // Estados
  disabled: {
    opacity: 0.6,
  },
  
  // Indicadores de estado
  badge: {
    backgroundColor: colors.primary,
    borderRadius: dimensions.borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minWidth: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  successBadge: {
    backgroundColor: colors.success,
  },
  
  warningBadge: {
    backgroundColor: colors.warning,
  },
  
  errorBadge: {
    backgroundColor: colors.error,
  },
};

// Animaciones
export const animations = {
  duration: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
  
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
};

// Configuración de componentes específicos
export const componentStyles = {
  // Header
  header: {
    backgroundColor: colors.primary,
    height: dimensions.headerHeight,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  
  // Tab Bar
  tabBar: {
    backgroundColor: colors.surface,
    height: dimensions.tabBarHeight,
    borderTopWidth: 1,
    borderTopColor: colors.grayLight,
    ...shadows.md,
  },
  
  // Modal
  modal: {
    backgroundColor: colors.surface,
    margin: spacing.lg,
    borderRadius: dimensions.borderRadius.lg,
    padding: spacing.lg,
    ...shadows.xl,
  },
  
  // Lista
  listItem: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  
  // Formularios
  formGroup: {
    marginBottom: spacing.md,
  },
  
  formLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  
  formError: {
    fontSize: typography.sizes.sm,
    color: colors.error,
    marginTop: spacing.xs,
  },
};

export default {
  colors,
  typography,
  spacing,
  dimensions,
  shadows,
  theme,
  globalStyles,
  animations,
  componentStyles,
};
