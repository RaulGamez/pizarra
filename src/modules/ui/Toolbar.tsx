import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Action = { id: string; label: string; onPress: () => void };

export function Toolbar({
  onUndo, onRedo, onSave, actions = [],
}: {
  onUndo?: () => void;
  onRedo?: () => void;
  onSave?: () => void;
  actions?: Action[];
}) {
  return (
    <View style={styles.wrap}>
      {onUndo && <Pressable style={styles.btn} onPress={onUndo}><Text>↶ Undo</Text></Pressable>}
      {onRedo && <Pressable style={styles.btn} onPress={onRedo}><Text>↷ Redo</Text></Pressable>}
      {onSave && <Pressable style={styles.btn} onPress={onSave}><Text>💾 Guardar</Text></Pressable>}
      {actions.map(a => (
        <Pressable key={a.id} style={styles.btn} onPress={a.onPress}>
          <Text>{a.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingVertical: 8 },
  btn: { backgroundColor: '#eee', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
});
