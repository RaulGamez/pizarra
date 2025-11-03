import * as SecureStore from 'expo-secure-store';
import { produce } from 'immer';
import { create } from 'zustand';

// -----------------------------
// Tipos base
// -----------------------------
export type Vec2 = { x: number; y: number };

export type Player = {
  id: string;
  label: string;
  pos: Vec2;
  color: string;
};

export type Arrow = {
  id: string;
  from: Vec2;
  to: Vec2;
  color: string;
};

export type BoardState = {
  players: Player[];
  arrows: Arrow[];
  history: {
    past: { players: Player[]; arrows: Arrow[] }[];
    present: { players: Player[]; arrows: Arrow[] };
    future: { players: Player[]; arrows: Arrow[] }[];
  };
};

// -----------------------------
// Helpers de historial
// -----------------------------
function createHistory(initialPlayers: Player[], initialArrows: Arrow[]): BoardState['history'] {
  return {
    past: [],
    present: { players: initialPlayers, arrows: initialArrows },
    future: [],
  };
}

function pushHistory(
  history: BoardState['history'],
  newPresent: { players: Player[]; arrows: Arrow[] }
): BoardState['history'] {
  return {
    past: [...history.past, history.present],
    present: newPresent,
    future: [],
  };
}

// -----------------------------
// Storage (Expo Secure Store)
// -----------------------------
const storage = {
  set: async (key: string, value: string) => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (e) {
      console.error('Error saving data', e);
    }
  },
  getString: async (key: string) => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (e) {
      console.error('Error reading data', e);
      return null;
    }
  },
};

// -----------------------------
// Zustand store principal
// -----------------------------
export const useBoardStore = create<
  BoardState & {
    addPlayer: (player: Player) => void;
    moveEntity: (id: string, newPos: Vec2) => void;
    removePlayer: (id: string) => void;
    newArrow: (from: Vec2, to: Vec2) => void;
    clearBoard: () => void;
    undo: () => void;
    redo: () => void;
    saveBoard: () => Promise<void>;
    loadBoard: () => Promise<void>;
  }
>((set, get) => ({
  players: [],
  arrows: [],
  history: createHistory([], []),

  // -----------------------------------------
  // Gestión de jugadores
  // -----------------------------------------
  addPlayer: (player) =>
    set((state) =>
      produce(state, (draft) => {
        draft.players.push(player);
        draft.history = pushHistory(draft.history, {
          players: draft.players,
          arrows: draft.arrows,
        });
      })
    ),

  moveEntity: (id, newPos) =>
    set((state) =>
      produce(state, (draft) => {
        const p = draft.players.find((pl) => pl.id === id);
        if (p) {
          p.pos = newPos;
          draft.history = pushHistory(draft.history, {
            players: draft.players,
            arrows: draft.arrows,
          });
        }
      })
    ),

  removePlayer: (id) =>
    set((state) =>
      produce(state, (draft) => {
        draft.players = draft.players.filter((p) => p.id !== id);
        draft.history = pushHistory(draft.history, {
          players: draft.players,
          arrows: draft.arrows,
        });
      })
    ),

  // -----------------------------------------
  // Flechas
  // -----------------------------------------
  newArrow: (from, to) =>
    set((state) =>
      produce(state, (draft) => {
        const arrow: Arrow = {
          id: Date.now().toString(),
          from,
          to,
          color: '#0a7ea4',
        };
        draft.arrows.push(arrow);
        draft.history = pushHistory(draft.history, {
          players: draft.players,
          arrows: draft.arrows,
        });
      })
    ),

  // -----------------------------------------
  // Limpieza y control de historial
  // -----------------------------------------
  clearBoard: () =>
    set((state) =>
      produce(state, (draft) => {
        draft.players = [];
        draft.arrows = [];
        draft.history = pushHistory(draft.history, {
          players: [],
          arrows: [],
        });
      })
    ),

  undo: () =>
    set((state) =>
      produce(state, (draft) => {
        if (draft.history.past.length === 0) return;
        const previous = draft.history.past[draft.history.past.length - 1];
        draft.history.past = draft.history.past.slice(0, -1);
        draft.history.future = [draft.history.present, ...draft.history.future];
        draft.history.present = previous;
        draft.players = previous.players;
        draft.arrows = previous.arrows;
      })
    ),

  redo: () =>
    set((state) =>
      produce(state, (draft) => {
        if (draft.history.future.length === 0) return;
        const next = draft.history.future[0];
        draft.history.future = draft.history.future.slice(1);
        draft.history.past = [...draft.history.past, draft.history.present];
        draft.history.present = next;
        draft.players = next.players;
        draft.arrows = next.arrows;
      })
    ),

  // -----------------------------------------
  // Persistencia (con SecureStore)
  // -----------------------------------------
  saveBoard: async () => {
    const { history } = get();
    try {
      await storage.set('board:current', JSON.stringify(history.present ?? {}));
    } catch (e) {
      console.error('Error saving board', e);
    }
  },

  loadBoard: async () => {
    try {
      const data = await storage.getString('board:current');
      if (data) {
        const { players, arrows } = JSON.parse(data) as { players: Player[]; arrows: Arrow[] };
        set({
          players,
          arrows,
          history: createHistory(players, arrows),
        });
      }
    } catch (e) {
      console.error('Error loading board', e);
    }
  },
}));
