import { resolveTheme } from '@/lib/resolveTheme';
import * as React from 'react';
import { StyleSheet, Text, type TextProps, useColorScheme } from 'react-native';

type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'subtitle' | 'link';
};

export function ThemedText({ style, type = 'default', ...props }: ThemedTextProps) {
  const scheme = useColorScheme();
  const theme = resolveTheme(scheme);

  const fontSize =
    type === 'title' ? 24 :
    type === 'subtitle' ? 18 :
    type === 'link' ? 16 :
    14;

  const textStyle = [
    styles.base,
    { color: theme.text, fontSize, fontWeight: type === 'title' ? '700' : '400' },
    style,
  ];

  return <Text {...props} />;
}

const styles = StyleSheet.create({
  base: {
    marginVertical: 2,
  },
});
