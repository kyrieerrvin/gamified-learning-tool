// src/store/gameStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Record of completed levels for progression tracking
type LevelProgress = {
  [gameType: string]: {
    currentLevel: number;
    levelsCompleted: boolean[];
  }
};

interface GameState {
  // Basic game stats
  score: number;
  streak: number;
  hearts: number;
  lastHeartResetDate: string;
  
  // Progression tracking
  progress: LevelProgress;
  
  // Actions
  addPoints: (points: number) => void;
  increaseStreak: () => void;
  resetStreak: () => void;
  
  // Heart system
  decreaseHeart: () => void;
  resetHearts: () => void;
  checkAndResetDailyHearts: () => void;
  
  // Progress tracking
  completeLevel: (gameType: string, level: number) => void;
  getCurrentLevel: (gameType: string) => number;
  canAccessLevel: (gameType: string, level: number) => boolean;
  initializeGameProgress: (gameType: string) => void;
}

// Helper to get today's date as a string
const getTodayDateString = () => {
  return new Date().toISOString().split('T')[0];
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      // Initial state
      score: 0,
      streak: 0,
      hearts: 5,
      lastHeartResetDate: getTodayDateString(),
      progress: {},
      
      // Basic game actions
      addPoints: (points) => set((state) => ({ score: state.score + points })),
      increaseStreak: () => set((state) => ({ streak: state.streak + 1 })),
      resetStreak: () => set({ streak: 0 }),
      
      // Heart system
      decreaseHeart: () => set((state) => {
        // Only decrease if we have hearts left
        if (state.hearts <= 0) {
          return state;
        }
        
        return { 
          hearts: state.hearts - 1 
        };
      }),
      
      resetHearts: () => set({ hearts: 5 }),
      
      checkAndResetDailyHearts: () => {
        // During development, always reset hearts for testing
        console.log('Development mode: Reset hearts to 5');
        set({ hearts: 5, lastHeartResetDate: getTodayDateString() });
        
        /* UNCOMMENT THIS FOR PRODUCTION
        const today = getTodayDateString();
        const { lastHeartResetDate } = get();
        
        if (today !== lastHeartResetDate) {
          console.log('New day detected, resetting hearts');
          set({ hearts: 5, lastHeartResetDate: today });
        }
        */
      },
      
      // Progress tracking
      initializeGameProgress: (gameType) => {
        const currentProgress = get().progress;
        
        // Only initialize if not already present
        if (!currentProgress[gameType]) {
          set((state) => ({
            progress: {
              ...state.progress,
              [gameType]: {
                currentLevel: 0,
                levelsCompleted: [false, false, false, false, false]
              }
            }
          }));
        }
      },
      
      completeLevel: (gameType, level) => {
        // Initialize game type if needed
        if (!get().progress[gameType]) {
          get().initializeGameProgress(gameType);
        }
        
        set((state) => {
          const gameProgress = state.progress[gameType];
          const newLevelsCompleted = [...gameProgress.levelsCompleted];
          newLevelsCompleted[level] = true;
          
          // Calculate new current level (the next uncompleted level or the last one)
          let newCurrentLevel = gameProgress.currentLevel;
          for (let i = 0; i < newLevelsCompleted.length; i++) {
            if (!newLevelsCompleted[i]) {
              newCurrentLevel = i;
              break;
            }
            
            // If all are completed, point to the last level
            if (i === newLevelsCompleted.length - 1) {
              newCurrentLevel = i;
            }
          }
          
          return {
            progress: {
              ...state.progress,
              [gameType]: {
                currentLevel: newCurrentLevel,
                levelsCompleted: newLevelsCompleted
              }
            }
          };
        });
      },
      
      getCurrentLevel: (gameType) => {
        // Initialize game type if needed
        if (!get().progress[gameType]) {
          get().initializeGameProgress(gameType);
        }
        
        return get().progress[gameType]?.currentLevel || 0;
      },
      
      canAccessLevel: (gameType, level) => {
        // Initialize game type if needed
        if (!get().progress[gameType]) {
          get().initializeGameProgress(gameType);
        }
        
        const gameProgress = get().progress[gameType];
        
        // Level 0 is always accessible
        if (level === 0) return true;
        
        // Can access if previous level is completed
        return level <= gameProgress.currentLevel;
      }
    }),
    {
      name: 'game-storage',
    }
  )
);