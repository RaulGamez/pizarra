// /modules/board/timeline.ts
import { useEffect, useRef } from 'react';
import { Easing } from 'react-native-reanimated';
import { useBoardStore } from './useBoardStore';

export function useTimelinePlayer(play: boolean) {
  const raf = useRef<number | null>(null);
  const start = useRef<number | null>(null);
  const { history, set } = useBoardStore();
  const { keyframes, duration } = history.present.timeline;

  useEffect(() => {
    if (!play) {
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = null;
      start.current = null;
      return;
    }

    const step = (ts: number) => {
      if (start.current == null) start.current = ts;
      const t = (ts - start.current) % Math.max(1, duration);

      set(draft => {
        if (!draft.timeline.keyframes || draft.timeline.keyframes.length < 2) return;
        const frames = draft.timeline.keyframes;
        let i = 0;
        while (i < frames.length && frames[i].t <= t) i++;
        const i1 = Math.min(frames.length - 1, Math.max(1, i));
        const i0 = i1 - 1;
        const k0 = frames[i0], k1 = frames[i1];
        const alpha = (t - k0.t) / Math.max(1, (k1.t - k0.t));
        const eased = Easing.inOut(Easing.quad)(Math.min(1, Math.max(0, alpha)));

        Object.keys(k0.entities).forEach(id => {
          const p0 = k0.entities[id];
          const p1 = k1.entities[id] ?? p0;
          const nx = p0.x + (p1.x - p0.x) * eased;
          const ny = p0.y + (p1.y - p0.y) * eased;
          const pl = draft.players.find(p => p.id === id);
          if (pl) pl.pos = { x: nx, y: ny };
        });
      });

      raf.current = requestAnimationFrame(step);
    };

    raf.current = requestAnimationFrame(step);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [play, keyframes, duration, set]);
}
