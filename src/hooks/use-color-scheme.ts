import { useColorScheme as useRNColorScheme } from 'react-native';
export function useColorScheme() {
  // Devuelve 'light' | 'dark' | null (como RN). Ajusta si quieres forzar un modo.
  return useRNColorScheme();
}
