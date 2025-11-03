declare module '@shopify/react-native-skia' {
  export function useTouchHandler(
    handlers: {
      onStart?: (touch: any) => void;
      onActive?: (touch: any) => void;
      onEnd?: () => void;
    },
    deps?: readonly any[]
  ): (touchInfo: any) => void;
}
