import * as React from 'react';
import { Animated, Easing } from 'react-native';

export function HelloWave() {
  const rotation = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(rotation, { toValue: 1, duration: 800, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(rotation, { toValue: 0, duration: 800, easing: Easing.linear, useNativeDriver: true }),
      ])
    ).start();
  }, [rotation]);

  const rotate = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '20deg'] });

  return (
    <Animated.View
      style={{
        transform: [{ rotate }],
        width: 24, height: 24, borderRadius: 12, backgroundColor: '#61dafb'
      }}
    />
  );
}
