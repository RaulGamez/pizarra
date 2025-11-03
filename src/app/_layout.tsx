import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import 'react-native-reanimated';

// Fallbacks defensivos
const SafeDarkTheme = NavigationDarkTheme ?? { dark: true, colors: { background: '#000', text: '#fff', primary: '#7cc5eb', card: '#000', border: '#333', notification: '#7cc5eb' } };
const SafeDefaultTheme = NavigationDefaultTheme ?? { dark: false, colors: { background: '#fff', text: '#000', primary: '#0a7ea4', card: '#fff', border: '#ddd', notification: '#0a7ea4' } };

export default function RootLayout() {
  const scheme = useColorScheme() ?? 'light';
  const theme = scheme === 'dark' ? SafeDarkTheme : SafeDefaultTheme;

  return (
    <ThemeProvider value={theme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}
