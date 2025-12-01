import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, LayoutChangeEvent, StyleSheet, GestureResponderEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Canvas, Path, Skia, Group, Circle } from '@shopify/react-native-skia';

type Tool =
  | 'offense'
  | 'defense'
  | 'erase'
  | 'none'        // dibujo libre (ya no hay botón, pero lo dejamos)
  | 'pass'        // línea de pase (discontinua)
  | 'move'        // movimiento sin balón (línea)
  | 'dribble'     // movimiento con bote (ondulada)
  | 'ball'        // colocar balón
  | 'cone';       // colocar cono

type Stroke = {
  path: string;
  color: string;
  width: number;
};

type Token = { x: number; y: number };

type TacticalLineType = 'pass' | 'move' | 'dribble';

type TacticalLine = {
  type: TacticalLineType;
  from: Token;
  to: Token;
};

// Estado completo para poder hacer undo/redo
type BoardState = {
  strokes: Stroke[];
  offense: Token[];
  defense: Token[];
  balls: Token[];
  cones: Token[];
  tacticalLines: TacticalLine[];
};

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

  // Trazos libres (dibujo a mano alzada)
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [current, setCurrent] = useState<string | null>(null);
  const strokeColor = '#2c3e50';
  const strokeWidth = 3;

  // Fichas de jugadores
  const [offense, setOffense] = useState<Token[]>([]);
  const [defense, setDefense] = useState<Token[]>([]);
  const tokenR = 12; // radio de ficha

  // Balones y conos
  const [balls, setBalls] = useState<Token[]>([]);
  const [cones, setCones] = useState<Token[]>([]);

  // Líneas tácticas (pase, movimiento, bote)
  const [tacticalLines, setTacticalLines] = useState<TacticalLine[]>([]);
  const [tempLine, setTempLine] = useState<TacticalLine | null>(null);

  // Historial para undo/redo
  const [history, setHistory] = useState<BoardState[]>([]);
  const [future, setFuture] = useState<BoardState[]>([]);

  const getSnapshot = (): BoardState => ({
    strokes,
    offense,
    defense,
    balls,
    cones,
    tacticalLines,
  });

  const restoreSnapshot = (state: BoardState) => {
    setStrokes(state.strokes);
    setOffense(state.offense);
    setDefense(state.defense);
    setBalls(state.balls);
    setCones(state.cones);
    setTacticalLines(state.tacticalLines);
    setTempLine(null);
  };

  const pushHistory = () => {
    setHistory(prev => [...prev, getSnapshot()]);
    setFuture([]); // al hacer una acción nueva, borramos el redo
  };

  const undo = () => {
    setHistory(prev => {
      if (!prev.length) return prev;
      const last = prev[prev.length - 1];

      // guardamos estado actual en future
      setFuture(f => [...f, getSnapshot()]);
      restoreSnapshot(last);

      return prev.slice(0, -1);
    });
  };

  const redo = () => {
    setFuture(prev => {
      if (!prev.length) return prev;
      const last = prev[prev.length - 1];

      // el estado actual vuelve al historial
      setHistory(h => [...h, getSnapshot()]);
      restoreSnapshot(last);

      return prev.slice(0, -1);
    });
  };

  const clearAll = () => {
    pushHistory();
    setStrokes([]);
    setOffense([]);
    setDefense([]);
    setBalls([]);
    setCones([]);
    setTacticalLines([]);
    setTempLine(null);
  };

  // Añadir fichas u objetos
  const addToken = (team: 'offense' | 'defense', x: number, y: number) => {
    pushHistory();
    const add = { x, y };
    if (team === 'offense') setOffense(prev => [...prev, add]);
    else setDefense(prev => [...prev, add]);
  };

  const addBall = (x: number, y: number) => {
    pushHistory();
    setBalls(prev => [...prev, { x, y }]);
  };

  const addCone = (x: number, y: number) => {
    pushHistory();
    setCones(prev => [...prev, { x, y }]);
  };

  // Borrar el objeto más cercano (jugador / balón / cono)
  const removeNearestToken = (x: number, y: number) => {
    type Kind = 'offense' | 'defense' | 'ball' | 'cone';

    const dist2 = (a: Token): number => (a.x - x) ** 2 + (a.y - y) ** 2;

    let bestKind: Kind | null = null;
    let bestIndex = -1;
    let bestD2 = Infinity;

    const checkList = (list: Token[], kind: Kind) => {
      for (let i = 0; i < list.length; i++) {
        const d2 = dist2(list[i]);
        if (d2 < bestD2) {
          bestD2 = d2;
          bestKind = kind;
          bestIndex = i;
        }
      }
    };

    // Miramos ofensivos, defensivos, balones y conos
    checkList(offense, 'offense');
    checkList(defense, 'defense');
    checkList(balls, 'ball');
    checkList(cones, 'cone');

    const hitRadius = tokenR * 1.8;

    if (bestKind !== null && bestD2 <= hitRadius * hitRadius) {
      pushHistory();
      switch (bestKind) {
        case 'offense':
          setOffense(prev => prev.filter((_, i) => i !== bestIndex));
          break;
        case 'defense':
          setDefense(prev => prev.filter((_, i) => i !== bestIndex));
          break;
        case 'ball':
          setBalls(prev => prev.filter((_, i) => i !== bestIndex));
          break;
        case 'cone':
          setCones(prev => prev.filter((_, i) => i !== bestIndex));
          break;
      }
    }
  };

  // Helpers para líneas tácticas
  const createArrowHeadPath = (from: Token, to: Token, size = 9) => {
    const p = Skia.Path.Make();
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const angle = Math.atan2(dy, dx);

    const leftAngle = angle - Math.PI / 7;
    const rightAngle = angle + Math.PI / 7;

    const xLeft = to.x - size * Math.cos(leftAngle);
    const yLeft = to.y - size * Math.sin(leftAngle);

    const xRight = to.x - size * Math.cos(rightAngle);
    const yRight = to.y - size * Math.sin(rightAngle);

    p.moveTo(to.x, to.y);
    p.lineTo(xLeft, yLeft);
    p.moveTo(to.x, to.y);
    p.lineTo(xRight, yRight);

    return p;
  };

  const createStraightPath = (from: Token, to: Token) => {
    const p = Skia.Path.Make();
    p.moveTo(from.x, from.y);
    p.lineTo(to.x, to.y);
    return p;
  };

  const createDashedPath = (from: Token, to: Token, dash = 12, gap = 8) => {
    const p = Skia.Path.Make();
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const dirX = dx / len;
    const dirY = dy / len;

    let dist = 0;
    while (dist < len) {
      const seg = Math.min(dash, len - dist);
      const x1 = from.x + dirX * dist;
      const y1 = from.y + dirY * dist;
      const x2 = from.x + dirX * (dist + seg);
      const y2 = from.y + dirY * (dist + seg);

      p.moveTo(x1, y1);
      p.lineTo(x2, y2);

      dist += dash + gap;
    }
    return p;
  };

  const createWavyPath = (from: Token, to: Token, waves = 8, amp = 7) => {
    const p = Skia.Path.Make();
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const dirX = dx / len;
    const dirY = dy / len;
    // vector normal
    const nx = -dirY;
    const ny = dirX;

    const steps = waves * 20;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const baseX = from.x + dirX * len * t;
      const baseY = from.y + dirY * len * t;
      const offset = Math.sin(t * Math.PI * waves) * amp;
      const x = baseX + nx * offset;
      const y = baseY + ny * offset;

      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p;
  };

  // Solo dibujar si es touch o botón izquierdo del ratón (evita scroll con rueda)
  const isPrimaryPointer = (e: GestureResponderEvent) => {
    const anyEvent: any = e.nativeEvent as any;
    const buttons = anyEvent.buttons;
    const button = anyEvent.button;

    // En móvil (touch) normalmente no vienen definidos => dejamos pasar
    if (buttons === undefined && button === undefined) return true;

    // En web: buttons = 1 -> botón izquierdo presionado
    if (buttons !== undefined && buttons !== 0 && (buttons & 1) === 1) return true;

    // button = 0 suele ser click izquierdo en algunos eventos
    if (button !== undefined && button === 0) return true;

    return false;
  };

  // Tocar el canvas
  const handleTouch = (type: 'start' | 'move' | 'end', e: GestureResponderEvent) => {
    if (!isPrimaryPointer(e)) {
      // Ignoramos eventos que no sean click izquierdo / touch (como la rueda)
      return;
    }

    const { locationX: x, locationY: y } = e.nativeEvent;

    // 1) Modo fichas de jugadores
    if (tool === 'offense' || tool === 'defense') {
      if (type === 'start') addToken(tool, x, y);
      return;
    }

    // 2) Objetos: balón / cono
    if (tool === 'ball') {
      if (type === 'start') addBall(x, y);
      return;
    }

    if (tool === 'cone') {
      if (type === 'start') addCone(x, y);
      return;
    }

    // 3) Borrar fichas/objetos
    if (tool === 'erase') {
      if (type === 'start') removeNearestToken(x, y);
      return;
    }

    // 4) Líneas tácticas: pase/movimiento/bote
    if (tool === 'pass' || tool === 'move' || tool === 'dribble') {
      if (type === 'start') {
        const from = { x, y };
        setTempLine({ type: tool, from, to: from });
      } else if (type === 'move') {
        setTempLine(prev => (prev ? { ...prev, to: { x, y } } : prev));
      } else if (type === 'end') {
        setTempLine(prev => {
          if (!prev) return null;
          pushHistory();
          setTacticalLines(lines => [...lines, { ...prev, to: { x, y } }]);
          return null;
        });
      }
      return;
    }

    // 5) Modo dibujo libre (tool === 'none') – ahora no hay botón que lo active
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
        pushHistory();
        setStrokes(prev => [...prev, { path: current, color: strokeColor, width: strokeWidth }]);
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

    // Línea central
    const mid = Skia.Path.Make();
    mid.moveTo(left, cy);
    mid.lineTo(right, cy);

    // Círculo central
    const centerCircle = Skia.Path.Make();
    centerCircle.addCircle(cx, cy, Math.min(w, h) * 0.09);

    // Zonas (keys) TOP y BOTTOM
    const keyWidth = w * 0.32;
    const keyHeight = h * 0.18;

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

    // Círculos de tiro libre
    const ftRadius = keyWidth * 0.28;
    const ftTop = Skia.Path.Make();
    ftTop.addCircle(cx, top + keyHeight, ftRadius);

    const ftBottom = Skia.Path.Make();
    ftBottom.addCircle(cx, bottom - keyHeight, ftRadius);

    // ===== AROS CERCA DE LA LÍNEA DE FONDO =====
    const rimRadius = Math.min(w, h) * 0.02;
    const rimOffsetFromBaseline = keyHeight * 0.18;

    const rimTopY = top + rimOffsetFromBaseline;
    const rimBottomY = bottom - rimOffsetFromBaseline;

    const rimTop = Skia.Path.Make();
    rimTop.addCircle(cx, rimTopY, rimRadius);

    const rimBottom = Skia.Path.Make();
    rimBottom.addCircle(cx, rimBottomY, rimRadius);

    const backboardLen = rimRadius * 3;
    const bbTop = Skia.Path.Make();
    bbTop.moveTo(cx - backboardLen / 2, rimTopY + rimRadius * 0.6);
    bbTop.lineTo(cx + backboardLen / 2, rimTopY + rimRadius * 0.6);

    const bbBottom = Skia.Path.Make();
    bbBottom.moveTo(cx - backboardLen / 2, rimBottomY - rimRadius * 0.6);
    bbBottom.lineTo(cx + backboardLen / 2, rimBottomY - rimRadius * 0.6);

    // ===== LÍNEAS DE TRIPLE (ajustadas) =====
    const threeRadius = keyHeight * 1.3;

    // TOP
    const threeTopCenterY = top + keyHeight * 0.5;
    const threeTopOval = {
      x: cx - threeRadius,
      y: threeTopCenterY - threeRadius,
      width: threeRadius * 2,
      height: threeRadius * 2,
    };
    const threeTop = Skia.Path.Make();
    threeTop.addArc(threeTopOval, 0, 180);
    const leftThreeTopX = cx - threeRadius;
    const rightThreeTopX = cx + threeRadius;
    threeTop.moveTo(leftThreeTopX, top);
    threeTop.lineTo(leftThreeTopX, threeTopCenterY);
    threeTop.moveTo(rightThreeTopX, top);
    threeTop.lineTo(rightThreeTopX, threeTopCenterY);

    // BOTTOM
    const threeBottomCenterY = bottom - keyHeight * 0.5;
    const threeBottomOval = {
      x: cx - threeRadius,
      y: threeBottomCenterY - threeRadius,
      width: threeRadius * 2,
      height: threeRadius * 2,
    };
    const threeBottom = Skia.Path.Make();
    threeBottom.addArc(threeBottomOval, 180, 180);
    const leftThreeBottomX = cx - threeRadius;
    const rightThreeBottomX = cx + threeRadius;
    threeBottom.moveTo(leftThreeBottomX, bottom);
    threeBottom.lineTo(leftThreeBottomX, threeBottomCenterY);
    threeBottom.moveTo(rightThreeBottomX, bottom);
    threeBottom.lineTo(rightThreeBottomX, threeBottomCenterY);

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

        {/* Aros y tableros */}
        <Path path={rimTop} color={'#ff6b6b'} style="stroke" strokeWidth={lineWidth + 1} />
        <Path path={rimBottom} color={'#ff6b6b'} style="stroke" strokeWidth={lineWidth + 1} />
        <Path path={bbTop} color={'#666'} style="stroke" strokeWidth={lineWidth + 1} />
        <Path path={bbBottom} color={'#666'} style="stroke" strokeWidth={lineWidth + 1} />

        {/* Líneas de triple corregidas */}
        <Path path={threeTop} color={courtStroke} style="stroke" strokeWidth={lineWidth} />
        <Path path={threeBottom} color={courtStroke} style="stroke" strokeWidth={lineWidth} />
      </Group>
    );
  }, [size]);

  // Helper para dibujar defensa: círculo + “semicírculo” tangente arriba
  const renderDefenseToken = (t: Token, i: number) => {
    const baseR = tokenR;
    const capR = tokenR * 0.7;

    const capPath = Skia.Path.Make();
    const oval = {
      x: t.x - capR,
      y: t.y - baseR - capR,
      width: capR * 2,
      height: capR * 2,
    };
    capPath.addArc(oval, 0, 180);
    capPath.close();

    return (
      <Group key={`d-${i}`}>
        <Circle cx={t.x} cy={t.y} r={baseR} color="#dbeafe" />
        <Circle cx={t.x} cy={t.y} r={baseR} color="#1d4ed8" style="stroke" strokeWidth={2} />
        <Path path={capPath} color="#1d4ed8" style="fill" />
        <Path path={capPath} color="#1e40af" style="stroke" strokeWidth={1.5} />
      </Group>
    );
  };

  // Helper para dibujar conos
  const renderCone = (t: Token, i: number) => {
    const h = tokenR * 1.6;
    const w = tokenR * 1.2;
    const p = Skia.Path.Make();

    p.moveTo(t.x, t.y - h / 2);
    p.lineTo(t.x - w / 2, t.y + h / 2);
    p.lineTo(t.x + w / 2, t.y + h / 2);
    p.close();

    return (
      <Group key={`c-${i}`}>
        <Path path={p} color="#fed7aa" style="fill" />
        <Path path={p} color="#c2410c" style="stroke" strokeWidth={1.5} />
      </Group>
    );
  };

  return (
    <View style={styles.screen}>
      {/* Toolbar */}
      <View style={[styles.toolbar, { paddingTop: 6 + insets.top }]} pointerEvents="auto">
        <ToolButton label="↶ Undo" onPress={undo} />
        <ToolButton label="↷ Redo" onPress={redo} />

        <ToolToggle label="OFF" active={tool === 'offense'} onPress={() => setTool('offense')} />
        <ToolToggle label="DEF" active={tool === 'defense'} onPress={() => setTool('defense')} />
        <ToolToggle label="Borrar" active={tool === 'erase'} onPress={() => setTool('erase')} />

        {/* Se elimina el botón "Línea" */}
        {/* <ToolToggle label="Línea" active={tool === 'none'} onPress={() => setTool('none')} /> */}

        <ToolToggle label="Pase" active={tool === 'pass'} onPress={() => setTool('pass')} />
        <ToolToggle label="Mov s/balón" active={tool === 'move'} onPress={() => setTool('move')} />
        <ToolToggle label="Bote" active={tool === 'dribble'} onPress={() => setTool('dribble')} />

        <ToolToggle label="Balón" active={tool === 'ball'} onPress={() => setTool('ball')} />
        <ToolToggle label="Cono" active={tool === 'cone'} onPress={() => setTool('cone')} />

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

            {/* Trazo actual (dibujo libre) */}
            {current && (
              <Path path={current} color={strokeColor} style="stroke" strokeWidth={strokeWidth} />
            )}

            {/* Trazos confirmados (dibujo libre) */}
            {strokes.map((s, i) => (
              <Path key={i} path={s.path} color={s.color} style="stroke" strokeWidth={s.width} />
            ))}

            {/* Líneas tácticas (confirmadas) */}
            {tacticalLines.map((l, i) => {
              let basePath: any;
              if (l.type === 'pass') basePath = createDashedPath(l.from, l.to);
              else if (l.type === 'move') basePath = createStraightPath(l.from, l.to);
              else basePath = createWavyPath(l.from, l.to);

              const arrow = createArrowHeadPath(l.from, l.to, 9);
              const color =
                l.type === 'pass' ? '#10b981' : l.type === 'move' ? '#0ea5e9' : '#f97316';

              return (
                <Group key={`line-${i}`}>
                  <Path path={basePath} color={color} style="stroke" strokeWidth={2.5} />
                  <Path path={arrow} color={color} style="stroke" strokeWidth={2.5} />
                </Group>
              );
            })}

            {/* Línea táctica en curso (tempLine) */}
            {tempLine &&
              (() => {
                let basePath: any;
                if (tempLine.type === 'pass') basePath = createDashedPath(tempLine.from, tempLine.to);
                else if (tempLine.type === 'move') basePath = createStraightPath(tempLine.from, tempLine.to);
                else basePath = createWavyPath(tempLine.from, tempLine.to);

                const arrow = createArrowHeadPath(tempLine.from, tempLine.to, 9);
                const color =
                  tempLine.type === 'pass' ? '#10b981' : tempLine.type === 'move' ? '#0ea5e9' : '#f97316';

                return (
                  <Group>
                    <Path path={basePath} color={color} style="stroke" strokeWidth={2.5} />
                    <Path path={arrow} color={color} style="stroke" strokeWidth={2.5} />
                  </Group>
                );
              })()}

            {/* Fichas ataque */}
            {offense.map((t, i) => (
              <Group key={`o-${i}`}>
                <Circle cx={t.x} cy={t.y} r={tokenR} color="#ffe4e6" />
                <Circle cx={t.x} cy={t.y} r={tokenR} color="#e11d48" style="stroke" strokeWidth={2} />
              </Group>
            ))}

            {/* Fichas defensa: círculo + semicírculo */}
            {defense.map(renderDefenseToken)}

            {/* Balones */}
            {balls.map((t, i) => (
              <Group key={`b-${i}`}>
                <Circle cx={t.x} cy={t.y} r={tokenR * 0.9} color="#fed7aa" />
                <Circle cx={t.x} cy={t.y} r={tokenR * 0.9} color="#c2410c" style="stroke" strokeWidth={2} />
              </Group>
            ))}

            {/* Conos */}
            {cones.map(renderCone)}
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
