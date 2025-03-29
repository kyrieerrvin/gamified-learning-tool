// src/store/gameStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { auth } from '@/lib/firebase';

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
  
  // User-specific progress
  loadUserProgress: () => Promise<void>;
  saveUserProgress: () => Promise<void>;
}

// Helper to get today's date as a string
const getTodayDateString = () => {
  return new Date().toISOString().split('T')[0];
};

// Collection name for user game progress
const GAME_PROGRESS_COLLECTION = 'gameProgress';

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
      addPoints: (points) => set((state) => {
        const newState = { score: state.score + points };
        // Save to Firebase after updating local state
        setTimeout(() => get().saveUserProgress(), 0);
        return newState;
      }),
      
      increaseStreak: () => set((state) => {
        const newState = { streak: state.streak + 1 };
        // Save to Firebase after updating local state
        setTimeout(() => get().saveUserProgress(), 0);
        return newState;
      }),
      
      resetStreak: () => {
        set({ streak: 0 });
        // Save to Firebase after updating local state
        setTimeout(() => get().saveUserProgress(), 0);
      },
      
      // Heart system
      decreaseHeart: () => set((state) => {
        // Only decrease if we have hearts left
        if (state.hearts <= 0) {
          return state;
        }
        
        const newState = { hearts: state.hearts - 1 };
        // Save to Firebase after updating local state
        setTimeout(() => get().saveUserProgress(), 0);
        return newState;
      }),
      
      resetHearts: () => {
        set({ hearts: 5 });
        // Save to Firebase after updating local state
        setTimeout(() => get().saveUserProgress(), 0);
      },
      
      checkAndResetDailyHearts: () => {
        // During development, always reset hearts for testing
        console.log('Development mode: Reset hearts to 5');
        set({ hearts: 5, lastHeartResetDate: getTodayDateString() });
        
        // Save to Firebase after updating local state
        setTimeout(() => get().saveUserProgress(), 0);
        
        /* UNCOMMENT THIS FOR PRODUCTION
        const today = getTodayDateString();
        const { lastHeartResetDate } = get();
        
        if (today !== lastHeartResetDate) {
          console.log('New day detected, resetting hearts');
          set({ hearts: 5, lastHeartResetDate: today });
          // Save to Firebase after updating local state
          setTimeout(() => get().saveUserProgress(), 0);
        }
        */
      },
      
      // Progress tracking
      initializeGameProgress: (gameType) => {
        const currentProgress = get().progress;
        
        // Only initialize if not already present
        if (!currentProgress[gameType]) {
          set((state) => {
            const newState = {
              progress: {
                ...state.progress,
                [gameType]: {
                  currentLevel: 0,
                  levelsCompleted: [false, false, false, false, false]
                }
              }
            };
            
            // Save to Firebase after updating local state
            setTimeout(() => get().saveUserProgress(), 0);
            
            return newState;
          });
        }
      },
      
      completeLevel: (gameType, level) => {
        set((state) => {
          // Get the current progress for this game type
          const gameProgress = state.progress[gameType] || {
            currentLevel: 0,
            levelsCompleted: [false, false, false, false, false]
          };
          
          // Mark this level as completed
          const updatedLevelsCompleted = [...gameProgress.levelsCompleted];
          updatedLevelsCompleted[level] = true;
          
          // Calculate new current level (the next incomplete level)
          let newCurrentLevel = gameProgress.currentLevel;
          
          // If we just completed the current level, advance to the next level
          if (level === gameProgress.currentLevel) {
            // Find the next incomplete level
            const nextIncompleteLevel = updatedLevelsCompleted.findIndex(
              (completed) => !completed
            );
            
            // If all levels are completed, stay at the last level
            newCurrentLevel = nextIncompleteLevel === -1 
              ? updatedLevelsCompleted.length - 1 
              : nextIncompleteLevel;
          }
          
          const newState = {
            progress: {
              ...state.progress,
              [gameType]: {
                currentLevel: newCurrentLevel,
                levelsCompleted: updatedLevelsCompleted
              }
            }
          };
          
          // Save to Firebase after updating local state
          setTimeout(() => get().saveUserProgress(), 0);
          
          return newState;
        });
      },
      
      getCurrentLevel: (gameType) => {
        const state = get();
        return state.progress[gameType]?.currentLevel || 0;
      },
      
      canAccessLevel: (gameType, level) => {
        const state = get();
        const gameProgress = state.progress[gameType];
        
        if (!gameProgress) {
          // If no progress exists, only allow access to level 0
          return level === 0;
        }
        
        // Allow access to completed levels or the next playable level
        return level <= gameProgress.currentLevel;
      },
      
      // User-specific progress methods
      loadUserProgress: async () => {
        try {
          const currentUser = auth.currentUser;
          
          if (!currentUser) {
            console.log('No user logged in, using local progress');
            return;
          }
          
          const userId = currentUser.uid;
          const progressRef = doc(db, GAME_PROGRESS_COLLECTION, userId);
          const progressDoc = await getDoc(progressRef);
          
          if (progressDoc.exists()) {
            // Found user progress in Firestore
            const userProgress = progressDoc.data();
            console.log('Loaded user progress from Firestore:', userProgress);
            
            // Update local state with Firestore data
            set({
              score: userProgress.score || 0,
              streak: userProgress.streak || 0,
              hearts: userProgress.hearts || 5,
              lastHeartResetDate: userProgress.lastHeartResetDate || getTodayDateString(),
              progress: userProgress.progress || {}
            });
          } else {
            // No progress found, initialize with defaults and save to Firestore
            console.log('No existing progress found for user, creating new progress');
            await get().saveUserProgress();
          }
        } catch (error) {
          console.error('Error loading user progress:', error);
        }
      },
      
      saveUserProgress: async () => {
        try {
          const currentUser = auth.currentUser;
          
          if (!currentUser) {
            console.log('No user logged in, cannot save progress to Firestore');
            return;
          }
          
          const userId = currentUser.uid;
          const state = get();
          
          const progressData = {
            score: state.score,
            streak: state.streak,
            hearts: state.hearts,
            lastHeartResetDate: state.lastHeartResetDate,
            progress: state.progress,
            lastUpdated: new Date().toISOString()
          };
          
          const progressRef = doc(db, GAME_PROGRESS_COLLECTION, userId);
          
          // Check if document exists and update or create accordingly
          const progressDoc = await getDoc(progressRef);
          
          if (progressDoc.exists()) {
            await updateDoc(progressRef, progressData);
          } else {
            await setDoc(progressRef, progressData);
          }
          
          console.log('Saved user progress to Firestore');
        } catch (error) {
          console.error('Error saving user progress:', error);
        }
      }
    }),
    {
      name: 'game-storage',
      // Store temporary UI state in localStorage, but user progress comes from Firestore
      partialize: (state) => ({ 
        // Only these will be persisted to localStorage
        hearts: state.hearts,
        lastHeartResetDate: state.lastHeartResetDate
      }),
    }
  )
);