// src/store/gameStore.ts
import { create } from 'zustand';

interface GameState {
  score: number;
  streak: number;
  addPoints: (points: number) => void;
  increaseStreak: () => void;
  resetStreak: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  score: 0,
  streak: 0,
  addPoints: (points) => set((state) => ({ score: state.score + points })),
  increaseStreak: () => set((state) => ({ streak: state.streak + 1 })),
  resetStreak: () => set({ streak: 0 }),
}));