import * as React from 'react';
import { Linking, Text, type TextProps } from 'react-native';

export function ExternalLink({
  href,
  children,
  ...props
}: TextProps & { href: string }) {
  return (
    <Text
      {...props}
      onPress={() => Linking.openURL(href)}
      accessibilityRole="link"
      style={[{ textDecorationLine: 'underline' }, props.style as any]}
    >
      {children}
    </Text>
  );
}
