// Tipos mínimos para el editor. No afectan al runtime.
declare module '@shopify/react-native-skia' {
  import * as React from 'react';
  export const Canvas: React.ComponentType<any>;
  export const Circle: React.ComponentType<any>;
  export const Group: React.ComponentType<any>;
  export const Path: React.ComponentType<any>;
  export const Text: React.ComponentType<any>;
  export const Skia: any;
  export function useFont(src: any, size: number): any;
  export function useTouchHandler(
    handlers: {
      onStart?: (touch: any) => void;
      onActive?: (touch: any) => void;
      onEnd?: () => void;
    },
    deps?: readonly any[]
  ): (touchInfo: any) => void;
}
