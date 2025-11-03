import * as React from 'react';
import { ScrollView, View, type ViewProps } from 'react-native';

export function ParallaxScrollView({ children, ...props }: ViewProps & { children?: React.ReactNode }) {
  // Placeholder simple; si luego quieres parallax real, lo cambiamos.
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
      <View {...props}>{children}</View>
    </ScrollView>
  );
}
