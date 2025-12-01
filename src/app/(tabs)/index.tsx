import React, { useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, LayoutChangeEvent, StyleSheet, GestureResponderEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Canvas, Path, Skia, Group, Circle } from '@shopify/react-native-skia';

type Tool = 'offense' | 'defense' | 'erase' | 'none';

type Stroke = {
  path: string;
  color: string;
  width: number;
};

type Token = { x: number; y: number };

export default function HomeTab() {
  const insets = useSafeAreaInsets();

  // Tamaño del área de dibujo
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ w: width, h: height });
  };

  // Herramienta activa
  const [tool, setTool] = useState<Tool>('offense');

  // Trazos libres (si quisieras dibujar líneas; puedes quitar esta parte si no te hace falta)
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const redoStack = useRef<Stroke[]>([]);
  const [current, setCurrent] = useState<string | null>(null);
  const strokeColor = '#2c3e50';
  const strokeWidth = 3;

  // Fichas de jugadores
  const [offense, setOffense] = useState<Token[]>([]);
  const [defense, setDefense] = useState<Token[]>([]);
  const tokenR = 12; // radio de ficha

  const pushStroke = (s: Stroke) => {
    redoStack.current = [];
    setStrokes(prev => [...prev, s]);
  };
  const undo = () => {
    setStrokes(prev => {
      if (!prev.length) return prev;
      const last = prev[prev.length - 1];
      redoStack.current.push(last);
      return prev.slice(0, -1);
    });
  };
  const redo = () => {
    const item = redoStack.current.pop();
    if (item) setStrokes(prev => [...prev, item]);
  };
  const clearAll = () => {
    redoStack.current = [];
    setStrokes([]);
    setOffense([]);
    setDefense([]);
  };

  // Añadir / borrar fichas
  const addToken = (team: 'offense' | 'defense', x: number, y: number) => {
    const add = { x, y };
    if (team === 'offense') setOffense(prev => [...prev, add]);
    else setDefense(prev => [...prev, add]);
  };

  const removeNearestToken = (x: number, y: number) => {
  type Nearest = { team: 'offense' | 'defense'; index: number; d2: number } | null;

  const dist2 = (a: Token) => (a.x - x) ** 2 + (a.y - y) ** 2;
  let best: Nearest = null;

  // Busca en ataque
  for (let i = 0; i < offense.length; i++) {
    const d2 = dist2(offense[i]);
    if (best === null || d2 < best.d2) best = { team: 'offense', index: i, d2 };
  }
  // Busca en defensa
  for (let i = 0; i < defense.length; i++) {
    const d2 = dist2(defense[i]);
    if (best === null || d2 < best.d2) best = { team: 'defense', index: i, d2 };
  }

  const hitRadius = tokenR * 1.8;
  if (best && best.d2 <= hitRadius * hitRadius) {
    const { team, index } = best;
    if (team === 'offense') {
      setOffense(prev => prev.filter((_, i) => i !== index));
    } else {
      setDefense(prev => prev.filter((_, i) => i !== index));
    }
  }
};


  // Tocar el canvas
  const handleTouch = (type: 'start' | 'move' | 'end', e: GestureResponderEvent) => {
    const { locationX: x, locationY: y } = e.nativeEvent;

    // 1) Modo fichas
    if (tool === 'offense' || tool === 'defense') {
      if (type === 'start') addToken(tool, x, y);
      return;
    }
    if (tool === 'erase') {
      if (type === 'start') removeNearestToken(x, y);
      return;
    }

    // 2) Modo dibujo libre (tool === 'none')
    if (tool === 'none') {
      if (type === 'start') {
        const p = Skia.Path.Make();
        p?.moveTo(x, y);
        setCurrent(p?.toSVGString() ?? null);
      } else if (type === 'move') {
        if (!current) return;
        const p = Skia.Path.MakeFromSVGString(current);
        p?.lineTo(x, y);
        setCurrent(p?.toSVGString() ?? null);
      } else if (type === 'end') {
        if (!current) return;
        pushStroke({ path: current, color: strokeColor, width: strokeWidth });
        setCurrent(null);
      }
    }
  };

  // ======= PISTA EN VERTICAL (canastas arriba/abajo) =======
  const Court = useMemo(() => {
    const margin = 16;
    const w = size.w - margin * 2;
    const h = size.h - margin * 2;
    if (w <= 0 || h <= 0) return null;

    const left = margin;
    const top = margin;
    const right = margin + w;
    const bottom = margin + h;
    const cx = left + w / 2;
    const cy = top + h / 2;

    // Colores/anchos
    const courtFill = '#f7fbff';
    const courtStroke = '#bed3ff';
    const lineWidth = 2;

    // Pista exterior (redondeada)
    const outer = Skia.Path.Make();
    outer.addRRect({ rect: { x: left, y: top, width: w, height: h }, rx: 18, ry: 18 });

    // Línea central (horizontal)
    const mid = Skia.Path.Make();
    mid.moveTo(left, cy);
    mid.lineTo(right, cy);

    // Círculo central
    const centerCircle = Skia.Path.Make();
    centerCircle.addCircle(cx, cy, Math.min(w, h) * 0.09);

    // Zonas (keys) TOP y BOTTOM (centradas horizontalmente)
    const keyWidth = w * 0.32;     // ancho de la zona
    const keyHeight = h * 0.18;    // alto de la zona

    const keyTop = Skia.Path.Make();
    keyTop.addRect({
      x: cx - keyWidth / 2,
      y: top,
      width: keyWidth,
      height: keyHeight,
    });

    const keyBottom = Skia.Path.Make();
    keyBottom.addRect({
      x: cx - keyWidth / 2,
      y: bottom - keyHeight,
      width: keyWidth,
      height: keyHeight,
    });

    // Círculos de tiro libre (centro de la key)
    const ftRadius = keyWidth * 0.28;
    const ftTop = Skia.Path.Make();
    ftTop.addCircle(cx, top + keyHeight, ftRadius);

    const ftBottom = Skia.Path.Make();
    ftBottom.addCircle(cx, bottom - keyHeight, ftRadius);

    // Aros (un poco dentro de la key)
    const rimRadius = Math.min(w, h) * 0.02;
    const rimTop = Skia.Path.Make();
    rimTop.addCircle(cx, top + keyHeight * 0.65, rimRadius);

    const rimBottom = Skia.Path.Make();
    rimBottom.addCircle(cx, bottom - keyHeight * 0.65, rimRadius);

    // Tableros (segmentos horizontales cortos)
    const backboardLen = rimRadius * 3;
    const bbTop = Skia.Path.Make();
    bbTop.moveTo(cx - backboardLen / 2, top + keyHeight * 0.75);
    bbTop.lineTo(cx + backboardLen / 2, top + keyHeight * 0.75);

    const bbBottom = Skia.Path.Make();
    bbBottom.moveTo(cx - backboardLen / 2, bottom - keyHeight * 0.75);
    bbBottom.lineTo(cx + backboardLen / 2, bottom - keyHeight * 0.75);

    return (
      <Group>
        <Path path={outer} color={courtFill} style="fill" />
        <Path path={outer} color={courtStroke} style="stroke" strokeWidth={lineWidth} />

        <Path path={mid} color={courtStroke} style="stroke" strokeWidth={lineWidth} />
        <Path path={centerCircle} color={courtStroke} style="stroke" strokeWidth={lineWidth} />

        <Path path={keyTop} color={courtStroke} style="stroke" strokeWidth={lineWidth} />
        <Path path={keyBottom} color={courtStroke} style="stroke" strokeWidth={lineWidth} />
        <Path path={ftTop} color={courtStroke} style="stroke" strokeWidth={lineWidth} />
        <Path path={ftBottom} color={courtStroke} style="stroke" strokeWidth={lineWidth} />

        <Path path={rimTop} color={'#ff6b6b'} style="stroke" strokeWidth={lineWidth + 1} />
        <Path path={rimBottom} color={'#ff6b6b'} style="stroke" strokeWidth={lineWidth + 1} />
        <Path path={bbTop} color={'#666'} style="stroke" strokeWidth={lineWidth + 1} />
        <Path path={bbBottom} color={'#666'} style="stroke" strokeWidth={lineWidth + 1} />
      </Group>
    );
  }, [size]);

  return (
    <View style={styles.screen}>
      {/* Toolbar: respeta notch y es clickable */}
      <View style={[styles.toolbar, { paddingTop: 6 + insets.top }]} pointerEvents="auto">
        <ToolButton label="↶ Undo" onPress={undo} />
        <ToolButton label="↷ Redo" onPress={redo} />

        <ToolToggle label="OFF" active={tool === 'offense'} onPress={() => setTool('offense')} />
        <ToolToggle label="DEF" active={tool === 'defense'} onPress={() => setTool('defense')} />
        <ToolToggle label="Borrar" active={tool === 'erase'} onPress={() => setTool('erase')} />
        <ToolToggle label="Línea" active={tool === 'none'} onPress={() => setTool('none')} />

        <ToolButton label="Clear" onPress={clearAll} />
      </View>

      {/* Canvas (debajo) */}
      <View
        style={styles.canvasContainer}
        onLayout={onLayout}
        onTouchStart={e => handleTouch('start', e)}
        onTouchMove={e => handleTouch('move', e)}
        onTouchEnd={e => handleTouch('end', e)}
        pointerEvents="auto"
      >
        {size.w > 0 && size.h > 0 && (
          <Canvas style={{ width: size.w, height: size.h }}>
            {Court}

            {/* Trazo actual (si estás en modo línea) */}
            {current && <Path path={current} color={strokeColor} style="stroke" strokeWidth={strokeWidth} />}
            {/* Trazos confirmados */}
            {strokes.map((s, i) => (
              <Path key={i} path={s.path} color={s.color} style="stroke" strokeWidth={s.width} />
            ))}

            {/* Fichas */}
            {offense.map((t, i) => (
              <Group key={`o-${i}`}>
                <Circle cx={t.x} cy={t.y} r={tokenR} color="#ffe4e6" />
                <Circle cx={t.x} cy={t.y} r={tokenR} color="#e11d48" style="stroke" strokeWidth={2} />
              </Group>
            ))}
            {defense.map((t, i) => (
              <Group key={`d-${i}`}>
                <Circle cx={t.x} cy={t.y} r={tokenR} color="#dbeafe" />
                <Circle cx={t.x} cy={t.y} r={tokenR} color="#1d4ed8" style="stroke" strokeWidth={2} />
              </Group>
            ))}
          </Canvas>
        )}
      </View>
    </View>
  );
}

function ToolButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}>
      <Text style={styles.btnText}>{label}</Text>
    </Pressable>
  );
}

function ToolToggle({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.btn, active && styles.btnActive, pressed && styles.btnPressed]}
    >
      <Text style={[styles.btnText, active && styles.btnTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  toolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 8,
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#fafafa',
    zIndex: 10,
    elevation: 3,
  },
  btn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  btnActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#93c5fd',
  },
  btnPressed: { opacity: 0.7 },
  btnText: { fontSize: 12, color: '#1f2937' },
  btnTextActive: { color: '#0f172a', fontWeight: '600' },
  canvasContainer: { flex: 1, zIndex: 0 },
});
