import { BoardScreen } from '@/modules/board/BoardScreen';
import * as React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function HomeScreen() {
  // Envolvemos la pizarra para gestos (imprescindible para Skia + Drag)
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BoardScreen />
    </GestureHandlerRootView>
  );
}
