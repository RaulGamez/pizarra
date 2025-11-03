import { Canvas, Circle, Group, Path, Skia, Text as SkText } from '@shopify/react-native-skia';
import React, { useRef, useState } from 'react';
import { Dimensions } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import type { Vec2 } from '../../types';
import { useBoardStore } from './useBoardStore';

const { width } = Dimensions.get('window');
const COURT_W = 360; // diseño en px "lógicos"
const COURT_H = 640;
const SCALE = width / COURT_W;

const toPx = (v: Vec2) => ({ x: v.x * SCALE, y: v.y * SCALE });

export default function BoardCanvas() {
  const { history, newArrow, moveEntity } = useBoardStore();
  const state = history.present;

  // ---- Dibujo de flechas "rápidas" (tap-drag-release)
  const [draftArrow, setDraftArrow] = useState<{ from: Vec2; to: Vec2 } | null>(null);

  // ---- Arrastre de jugadores (simple por hit-test)
  const draggingRef = useRef<string | null>(null);

  const onPlayerDrag = (id: string) => ({
    onStart: (t: any) => {
      draggingRef.current = id;
    },
    onActive: (t: any) => {
      if (draggingRef.current === id) {
        moveEntity(id, { x: t.x / SCALE, y: t.y / SCALE });
      }
    },
    onEnd: () => {
      draggingRef.current = null;
    },
  });

  // Fuente opcional para etiquetas
  // const font = useFont(require('../../assets/Inter-SemiBold.ttf'), 14 * SCALE);
  const font = undefined;

  const arrowPath = (from: Vec2, to: Vec2) => {
    const p = Skia.Path.Make(); // 👈 correcto
    p.moveTo(from.x * SCALE, from.y * SCALE);
    p.lineTo(to.x * SCALE, to.y * SCALE);
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    const len = 10 * SCALE;
    p.moveTo(to.x * SCALE, to.y * SCALE);
    p.lineTo(to.x * SCALE - len * Math.cos(angle - 0.4), to.y * SCALE - len * Math.sin(angle - 0.4));
    p.moveTo(to.x * SCALE, to.y * SCALE);
    p.lineTo(to.x * SCALE - len * Math.cos(angle + 0.4), to.y * SCALE - len * Math.sin(angle + 0.4));
    return p;
  };


  return (
    <Canvas
      style={{ width: COURT_W * SCALE, height: COURT_H * SCALE }}
      onTouchStart={(t: any) => {
        const p = { x: t.x / SCALE, y: t.y / SCALE };
        setDraftArrow({ from: p, to: p });
      }}
      onTouchMove={(t: any) => {
        if (!draftArrow) return;
        setDraftArrow({ ...draftArrow, to: { x: t.x / SCALE, y: t.y / SCALE } });
      }}
      onTouchEnd={() => {
        if (draftArrow) newArrow(draftArrow.from, draftArrow.to);
        setDraftArrow(null);
      }}
    >
      {/* FONDO CANCHA */}
      <Path
        path={Skia.Path.MakeFromSVGString(
          `M0,0 L${COURT_W * SCALE},0 L${COURT_W * SCALE},${COURT_H * SCALE} L0,${COURT_H * SCALE} Z`
        )!}
        strokeWidth={2}
        style="stroke"
        color="#ccc"
      />


      {/* Flechas existentes */}
      {state.arrows.map((a) => (
        <Path
          key={a.id}
          path={arrowPath(a.from, a.to)}
          color={a.color ?? '#222'}
          strokeWidth={3}
          style="stroke"
        />
      ))}

      {/* Flecha en borrador */}
      {draftArrow && (
        <Path
          path={arrowPath(draftArrow.from, draftArrow.to)}
          color="#777"
          strokeWidth={2}
          style="stroke"
        />
      )}

      {/* Jugadores */}
      {state.players.map((p) => {
        const px = toPx(p.pos);
        return (
          <Group key={p.id}>
            <Circle cx={px.x} cy={px.y} r={16 * SCALE} color={p.color ?? '#1976d2'} />
            {font && (
              <SkText
                x={px.x - 4 * SCALE}
                y={px.y + 4 * SCALE}
                text={p.label}
                color="white"
                font={font}
              />
            )}
            {/* Gestos de arrastre */}
            <PanGestureHandler {...onPlayerDrag(p.id)}>
              <Group />
            </PanGestureHandler>
          </Group>
        );
      })}
    </Canvas>
  );
}
