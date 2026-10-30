export const Colors = {
  charcoal: {
    50: '#f6f7f8',
    100: '#eceef1',
    200: '#d5d9e0',
    300: '#b0b8c5',
    400: '#8492a6',
    500: '#65748b',
    600: '#515d70',
    700: '#414a59',
    800: '#2e3340',
    900: '#1a1d25',
    950: '#0f1115',
  },
  accent: {
    50: '#fff8ed',
    100: '#ffefd4',
    200: '#ffdca8',
    300: '#ffc270',
    400: '#ff9b3a',
    500: '#ff7d12',
    600: '#f05f08',
    700: '#c74708',
    800: '#9e380f',
    900: '#7f3010',
    950: '#451506',
  },
  electric: {
    50: '#eff6ff',
    100: '#d9e7ff',
    200: '#bcd5ff',
    300: '#8ebaff',
    400: '#5993ff',
    500: '#326bff',
    600: '#1d48f5',
    700: '#1736db',
    800: '#1a31b0',
    900: '#1c2f8a',
    950: '#161e52',
  },
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    500: '#f59e0b',
    600: '#d97706',
  },
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
  },
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const FontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  title: 36,
} as const;

export const FontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;
