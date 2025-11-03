import { resolveTheme } from '@/lib/resolveTheme';
import * as React from 'react';
import { StyleSheet, View, type ViewProps, useColorScheme } from 'react-native';

type ThemedViewProps = ViewProps & {
  variant?: 'default' | 'card' | 'highlight';
};

/**
 * Vista con fondo dinámico según el modo (light/dark)
 * y variantes opcionales.
 */
export function ThemedView({ style, variant = 'default', ...props }: ThemedViewProps) {
  const scheme = useColorScheme();
  const theme = resolveTheme(scheme);

  // Colores base según la variante
  const backgroundColor =
    variant === 'card'
      ? theme.tint + '20' // añade transparencia al tint
      : variant === 'highlight'
      ? theme.tint
      : theme.background;

  return (
    <View
      {...props}
      style={[styles.base, { backgroundColor }, style]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    flexShrink: 0,
  },
});
