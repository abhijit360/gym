export const color = {
  primary: '#007AFF',
  primaryDark: '#0051D5',
  primaryLight: '#4DA2FF',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  bg: '#FFFFFF',
  surface: '#F5F5F5',
  border: '#DDDDDD',
  textPrimary: '#000000',
  textSecondary: '#666666',
  textTertiary: '#999999',
} as const;

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;

export const radius = { sm: 8, md: 12 } as const;

export const font = {
  display: { fontSize: 32, fontWeight: '700' as const },
  heading: { fontSize: 20, fontWeight: '600' as const },
  body: { fontSize: 16 },
  caption: { fontSize: 14 },
  small: { fontSize: 12 },
} as const;

export const touchTarget = 44;
