// /modules/board/BoardScreen.tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Toolbar } from '../ui/Toolbar';
import BoardCanvas from './BoardCanvas';
import { useBoardStore } from './useBoardStore';

export function BoardScreen() {
  const { undo, redo, save } = useBoardStore();
  return (
    <View style={styles.container}>
      <Toolbar
        onUndo={undo}
        onRedo={redo}
        onSave={save}
        actions={[
          { id: 'addOff', label: 'Añadir OFF', onPress: () => {/* ... */} },
          { id: 'addDef', label: 'Añadir DEF', onPress: () => {/* ... */} },
          { id: 'clearArrows', label: 'Borrar flechas', onPress: () => {/* ... */} },
        ]}
      />
      <BoardCanvas />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa', paddingTop: 8 },
});
