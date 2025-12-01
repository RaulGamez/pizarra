import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';
import 'react-native-reanimated';

const SafeDarkTheme =
  NavigationDarkTheme ?? { dark: true, colors: { background: '#000', text: '#fff', primary: '#7cc5eb', card: '#000', border: '#333', notification: '#7cc5eb' } };
const SafeDefaultTheme =
  NavigationDefaultTheme ?? { dark: false, colors: { background: '#fff', text: '#000', primary: '#0a7ea4', card: '#fff', border: '#ddd', notification: '#0a7ea4' } };

export default function RootLayout() {
  const scheme = useColorScheme() ?? 'light';
  const theme = scheme === 'dark' ? SafeDarkTheme : SafeDefaultTheme;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider value={theme}>
          <View style={{ flex: 1 }}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            </Stack>
            <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
          </View>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
