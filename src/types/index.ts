// /types/index.ts
export type CourtVariant = 'FIBA_FULL' | 'FIBA_HALF' | 'NBA_FULL';

export type Vec2 = { x: number; y: number };

export type Player = {
  id: string;
  label: string;     // "1", "2", "5", "X1", etc.
  team: 'OFF' | 'DEF';
  pos: Vec2;         // posición actual (px)
  color?: string;    // color del círculo
};

export type Token =
  | { id: string; kind: 'CONE'; pos: Vec2 }
  | { id: string; kind: 'SCREEN'; pos: Vec2; angle: number }
  | { id: string; kind: 'BALL'; pos: Vec2 };

export type PathStyle = 'SOLID' | 'DASHED' | 'DOTTED';
export type Arrow = {
  id: string;
  from: Vec2;
  to: Vec2;
  style: PathStyle;
  curved?: boolean; // bezier simple
  color?: string;
};

export type Action =
  | { t: number; type: 'MOVE'; entityId: string; to: Vec2 }
  | { t: number; type: 'PASS'; fromId: string; toId: string }
  | { t: number; type: 'SCREEN_SET'; screenerId: string; targetId: string; angle: number }
  | { t: number; type: 'SHOT'; shooterId: string; spot: Vec2 };

export type Keyframe = { t: number; entities: Record<string, Vec2> };
export type Timeline = {
  duration: number; // ms
  keyframes: Keyframe[];
  actions: Action[];
};

export type BoardState = {
  id: string;
  court: CourtVariant;
  players: Player[];
  tokens: Token[];
  arrows: Arrow[];
  timeline: Timeline;
  meta: { name: string; tags: string[]; version: number };
};
