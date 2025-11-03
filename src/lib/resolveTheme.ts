// src/lib/resolveTheme.ts
import { Colors } from '@/constants/theme';
import type { ColorSchemeName } from 'react-native';

export const resolveTheme = (scheme: ColorSchemeName) => {
  const key = scheme === 'dark' ? 'dark' : 'light';
  const base =
    (Colors as any) ?? {
      light: { background: '#fff', text: '#000', tint: '#0a7ea4' },
      dark: { background: '#000', text: '#fff', tint: '#7cc5eb' },
    };
  return base[key];
};

// Export default por si en algún sitio lo importaste como default
export default resolveTheme;
