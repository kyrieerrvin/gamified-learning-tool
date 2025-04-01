// src/store/gameStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { doc, getDoc, setDoc, updateDoc, deleteField } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { auth } from '@/lib/firebase';

// Section represents a group of levels (5 levels per section, 5 sections total)
export type Section = {
  id: number;
  title: string;
  description: string;
  isLocked: boolean;
  isCompleted: boolean;
  levels: Level[];
};

// Level represents an individual challenge level
export type Level = {
  id: number;
  title: string;
  isLocked: boolean;
  isCompleted: boolean;
  bestScore: number;
  attempts: number;
  lastPlayed: string | null;
};

// Daily quest representation
export type DailyQuest = {
  id: string;
  title: string;
  description: string;
  reward: number; // XP reward
  progress: number;
  target: number;
  isCompleted: boolean;
  expiresAt: string; // ISO date string
};

// Record of completed levels for progression tracking
type LevelProgress = {
  [gameType: string]: {
    currentLevel: number;
    currentSection: number;
    sections: Section[];
    xp: number;
    quests: DailyQuest[];
  }
};

// GameState represents the global game state
type GameState = {
  score: number;
  streak: number;
  lastStreakDate: string;
  progress: LevelProgress;
  
  // Actions
  addPoints: (points: number, gameType: string) => void;
  increaseStreak: (gameType?: string) => void;
  resetStreak: (gameType?: string) => void;
  
  // Game progression
  completeLevel: (gameType: string, sectionId: number, levelId: number) => void;
  canAccessLevel: (gameType: string, sectionId: number, levelId: number) => boolean;
  unlockSection: (gameType: string, sectionId: number) => void;
  initializeGameProgress: (gameType: string) => void;
  
  // Daily quests
  addProgressToQuest: (gameType: string, questId: string, amount: number) => void;
  completeQuest: (gameType: string, questId: string) => void;
  checkAndRefreshQuests: (gameType: string) => void;
  
  // User specific data
  loadUserProgress: () => Promise<void>;
  saveUserProgress: () => Promise<void>;
  migrateUserData: () => Promise<void>;
};

// Helper to get today's date as a string
const getTodayDateString = () => {
  return new Date().toISOString().split('T')[0];
};

// Generate sections with levels
const generateSections = (count: number = 5, levelsPerSection: number = 5): Section[] => {
  return Array.from({ length: count }).map((_, sectionIndex) => ({
    id: sectionIndex,
    title: `Section ${sectionIndex + 1}`,
    description: `Complete all levels in Section ${sectionIndex + 1}`,
    isLocked: sectionIndex !== 0, // Only first section is unlocked
    isCompleted: false,
    levels: Array.from({ length: levelsPerSection }).map((_, levelIndex) => ({
      id: levelIndex,
      title: `Level ${levelIndex + 1}`,
      isLocked: levelIndex !== 0, // Only first level in each section is unlocked initially
      isCompleted: false,
      bestScore: 0,
      attempts: 0,
      lastPlayed: null
    }))
  }));
};

// Generate daily quests
const generateDailyQuests = (): DailyQuest[] => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  return [
    {
      id: 'daily-xp',
      title: 'Earn 50 XP',
      description: 'Complete challenges to earn 50 XP today',
      reward: 10,
      progress: 0,
      target: 50,
      isCompleted: false,
      expiresAt: tomorrow.toISOString()
    },
    {
      id: 'complete-levels',
      title: 'Complete 3 Levels',
      description: 'Complete any 3 levels today',
      reward: 15,
      progress: 0,
      target: 3,
      isCompleted: false,
      expiresAt: tomorrow.toISOString()
    },
    {
      id: 'perfect-score',
      title: 'Perfect Score',
      description: 'Complete a level with a perfect score',
      reward: 20,
      progress: 0,
      target: 1,
      isCompleted: false,
      expiresAt: tomorrow.toISOString()
    }
  ];
};

// Collection name for user game progress
const GAME_PROGRESS_COLLECTION = 'gameProgress';

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      // Initial state
      score: 0,
      streak: 0,
      lastStreakDate: '',
      progress: {},
      
      // Basic game actions
      addPoints: (points, gameType) => set((state) => {
        const gameProgress = state.progress[gameType];
        if (!gameProgress) return state;
        
        // Update XP for the specific game type
        const updatedGameProgress = {
          ...gameProgress,
          xp: gameProgress.xp + points
        };
        
        // Update daily quest progress for XP
        const updatedQuests = gameProgress.quests.map(quest => {
          if (quest.id === 'daily-xp' && !quest.isCompleted) {
            const newProgress = Math.min(quest.progress + points, quest.target);
            const isCompleted = newProgress >= quest.target;
            
            return {
              ...quest,
              progress: newProgress,
              isCompleted
            };
          }
          return quest;
        });
        
        const newState = {
          score: state.score + points,
          progress: {
            ...state.progress,
            [gameType]: {
              ...updatedGameProgress,
              quests: updatedQuests
            }
          }
        };
        
        // Save to Firebase after updating local state
        setTimeout(() => get().saveUserProgress(), 0);
        return newState;
      }),
      
      increaseStreak: (gameType?: string) => set((state) => {
        const today = getTodayDateString();
        let newStreak = state.streak;
        
        // If last streak date is yesterday, increment streak
        if (state.lastStreakDate !== today) {
          newStreak += 1;
        }
        
        const newState = {
          streak: newStreak,
          lastStreakDate: today
        };
        
        // Save to Firebase after updating local state
        setTimeout(() => get().saveUserProgress(), 0);
        return newState;
      }),
      
      resetStreak: (gameType?: string) => set((state) => {
        const newState = {
          streak: 0,
          lastStreakDate: ''
        };
        
        // Save to Firebase after updating local state
        setTimeout(() => get().saveUserProgress(), 0);
        return newState;
      }),
      
      // Progress tracking
      initializeGameProgress: (gameType: string) => {
        set((state) => {
          // Check if progress already exists for this game type
          if (state.progress[gameType] && state.progress[gameType].sections && state.progress[gameType].sections.length > 0) {
            console.log(`Game progress for ${gameType} already initialized.`);
            return state;
          }
          
          console.log(`Initializing game progress for ${gameType}`);
          
          // Default sections with 5 sections and 5 levels each
          const sections = generateSections();
          
          // First section and first level are always unlocked
          if (sections.length > 0) {
            sections[0].isLocked = false;
            
            if (sections[0].levels && sections[0].levels.length > 0) {
              sections[0].levels[0].isLocked = false;
            }
          }
          
          // Generate fresh daily quests if needed
          const quests = generateDailyQuests();
          
          return {
            progress: {
              ...state.progress,
              [gameType]: {
                sections,
                xp: 0,
                quests,
                currentSection: 0,
                currentLevel: 0
              }
            }
          };
        });
      },
      
      completeLevel: (gameType: string, sectionId: number, levelId: number) => {
        set((state) => {
          const gameProgress = state.progress[gameType];
          if (!gameProgress) return state;
          
          // Create a deep copy of sections
          const updatedSections = JSON.parse(JSON.stringify(gameProgress.sections));
          
          // Mark the level as completed
          const section = updatedSections[sectionId];
          if (section && section.levels[levelId]) {
            section.levels[levelId].isCompleted = true;
            
            // Unlock the next level in this section if available
            if (levelId < section.levels.length - 1) {
              section.levels[levelId + 1].isLocked = false;
            } 
            // If this was the last level in the section, mark section as completed
            else if (levelId === section.levels.length - 1) {
              section.isCompleted = true;
              
              // Unlock the next section if available
              if (sectionId < updatedSections.length - 1) {
                updatedSections[sectionId + 1].isLocked = false;
                // Unlock the first level of the next section
                updatedSections[sectionId + 1].levels[0].isLocked = false;
              }
            }
          }
          
          // Update quest progress for completing levels
          const updatedQuests = gameProgress.quests.map(quest => {
            if (quest.id === 'complete-levels' && !quest.isCompleted) {
              const newProgress = Math.min(quest.progress + 1, quest.target);
              const isCompleted = newProgress >= quest.target;
              
              return {
                ...quest,
                progress: newProgress,
                isCompleted
              };
            }
            return quest;
          });
          
          const newState = {
            progress: {
              ...state.progress,
              [gameType]: {
                ...gameProgress,
                sections: updatedSections,
                quests: updatedQuests
              }
            }
          };
          
          // Save to Firebase after updating local state
          setTimeout(() => get().saveUserProgress(), 0);
          
          return newState;
        });
      },
      
      canAccessLevel: (gameType: string, sectionId: number, levelId: number) => {
        const state = get();
        
        // Check if game progress exists
        if (!state.progress || !state.progress[gameType]) return false;
        
        const gameProgress = state.progress[gameType];
        
        // Check if sections array exists and sectionId is valid
        if (!gameProgress.sections || !Array.isArray(gameProgress.sections) || 
            sectionId < 0 || sectionId >= gameProgress.sections.length) {
          return false;
        }
        
        const section = gameProgress.sections[sectionId];
        
        // Check if section is locked
        if (!section || section.isLocked) return false;
        
        // Check if levels array exists and levelId is valid
        if (!section.levels || !Array.isArray(section.levels) || 
            levelId < 0 || levelId >= section.levels.length) {
          return false;
        }
        
        const level = section.levels[levelId];
        
        // Check if level exists and is not locked
        return level && !level.isLocked;
      },
      
      unlockSection: (gameType: string, sectionId: number) => {
        set((state) => {
          const gameProgress = state.progress[gameType];
          if (!gameProgress) return state;
          
          const updatedSections = [...gameProgress.sections];
          if (updatedSections[sectionId]) {
            updatedSections[sectionId].isLocked = false;
            // Also unlock the first level
            if (updatedSections[sectionId].levels[0]) {
              updatedSections[sectionId].levels[0].isLocked = false;
            }
          }
          
          const newState = {
            progress: {
              ...state.progress,
              [gameType]: {
                ...gameProgress,
                sections: updatedSections
              }
            }
          };
          
          // Save to Firebase after updating local state
          setTimeout(() => get().saveUserProgress(), 0);
          
          return newState;
        });
      },
      
      // Daily quests
      addProgressToQuest: (gameType: string, questId: string, amount: number) => {
        set((state) => {
          const gameProgress = state.progress[gameType];
          if (!gameProgress) return state;
          
          const updatedQuests = gameProgress.quests.map(quest => {
            if (quest.id === questId && !quest.isCompleted) {
              const newProgress = Math.min(quest.progress + amount, quest.target);
              const isCompleted = newProgress >= quest.target;
              
              return {
                ...quest,
                progress: newProgress,
                isCompleted
              };
            }
            return quest;
          });
          
          const newState = {
            progress: {
              ...state.progress,
              [gameType]: {
                ...gameProgress,
                quests: updatedQuests
              }
            }
          };
          
          // Save to Firebase after updating local state
          setTimeout(() => get().saveUserProgress(), 0);
          
          return newState;
        });
      },
      
      completeQuest: (gameType: string, questId: string) => {
        set((state) => {
          const gameProgress = state.progress[gameType];
          if (!gameProgress) return state;
          
          const updatedQuests = gameProgress.quests.map(quest => {
            if (quest.id === questId) {
              // Give XP reward for completing the quest
              if (!quest.isCompleted) {
                setTimeout(() => get().addPoints(quest.reward, gameType), 0);
              }
              
              return {
                ...quest,
                progress: quest.target,
                isCompleted: true
              };
            }
            return quest;
          });
          
          const newState = {
            progress: {
              ...state.progress,
              [gameType]: {
                ...gameProgress,
                quests: updatedQuests
              }
            }
          };
          
          // Save to Firebase after updating local state
          setTimeout(() => get().saveUserProgress(), 0);
          
          return newState;
        });
      },
      
      checkAndRefreshQuests: (gameType: string) => {
        set((state) => {
          const gameProgress = state.progress[gameType];
          if (!gameProgress) return state;
          
          const now = new Date().toISOString();
          let questsNeedReset = false;
          
          // Check if any quests have expired
          if (gameProgress.quests && Array.isArray(gameProgress.quests)) {
            gameProgress.quests.forEach(quest => {
              if (new Date(quest.expiresAt) < new Date(now)) {
                questsNeedReset = true;
              }
            });
          } else {
            // If quests array doesn't exist or is not an array, we need to reset
            questsNeedReset = true;
          }
          
          // If quests need to be reset, generate new ones
          if (questsNeedReset) {
            const newState = {
              progress: {
                ...state.progress,
                [gameType]: {
                  ...gameProgress,
                  quests: generateDailyQuests()
                }
              }
            };
            
            // Save to Firebase after updating local state
            setTimeout(() => get().saveUserProgress(), 0);
            
            return newState;
          }
          
          return state;
        });
      },
      
      // User-specific progress
      loadUserProgress: async () => {
        const user = auth.currentUser;
        if (!user) return;
        
        try {
          const userProgressRef = doc(db, GAME_PROGRESS_COLLECTION, user.uid);
          const userProgressDoc = await getDoc(userProgressRef);
          
          if (userProgressDoc.exists()) {
            const userData = userProgressDoc.data();
            
            // Update local state with Firebase data
            set({ 
              score: userData.score || 0,
              streak: userData.streak || 0,
              lastStreakDate: userData.lastStreakDate || '',
              progress: userData.progress || {}
            });
            
            // Check and refresh quests for each game type
            Object.keys(userData.progress || {}).forEach(gameType => {
              get().checkAndRefreshQuests(gameType);
            });
            
            console.log('Loaded user progress from Firebase');
            
            // Run migration to clean up hearts-related fields
            await get().migrateUserData();
          } else {
            // User doesn't have progress data yet, initialize defaults
            console.log('No existing progress found for user, using defaults');
          }
        } catch (error) {
          console.error('Error loading user progress:', error);
        }
      },
      
      saveUserProgress: async () => {
        const user = auth.currentUser;
        if (!user) return;
        
        try {
          const userProgressRef = doc(db, GAME_PROGRESS_COLLECTION, user.uid);
          const userProgressDoc = await getDoc(userProgressRef);
          
          // Ensure both game types are initialized in progress
          const currentProgress = get().progress;
          const gameTypes = ['make-sentence', 'multiple-choice'];
          
          // Initialize any missing game types
          gameTypes.forEach(gameType => {
            if (!currentProgress[gameType]) {
              get().initializeGameProgress(gameType);
            }
          });
          
          const dataToSave = {
            score: get().score,
            streak: get().streak,
            lastStreakDate: get().lastStreakDate,
            progress: get().progress,
            updatedAt: new Date().toISOString()
          };
          
          if (userProgressDoc.exists()) {
            // Update existing document - explicitly remove hearts-related fields
            await updateDoc(userProgressRef, {
              ...dataToSave,
              // Use Firebase field deletion to remove hearts-related fields
              hearts: deleteField(),
              lastHeartResetDate: deleteField()
            });
          } else {
            // Create new document
            await setDoc(userProgressRef, {
              ...dataToSave,
              createdAt: new Date().toISOString(),
              userId: user.uid
            });
          }
          
          console.log('Saved user progress to Firebase');
        } catch (error) {
          console.error('Error saving user progress:', error);
        }
      },
      
      migrateUserData: async () => {
        const user = auth.currentUser;
        if (!user) return;
        
        try {
          const userProgressRef = doc(db, GAME_PROGRESS_COLLECTION, user.uid);
          const userProgressDoc = await getDoc(userProgressRef);
          
          if (userProgressDoc.exists()) {
            // Use Firebase field deletion to remove hearts-related fields
            await updateDoc(userProgressRef, {
              hearts: deleteField(),
              lastHeartResetDate: deleteField()
            });
            
            console.log('Migrated user data and removed hearts-related fields');
          }
        } catch (error) {
          console.error('Error migrating user data:', error);
        }
      },
    }),
    {
      name: 'game-storage',
      // Store temporary UI state in localStorage, but user progress comes from Firestore
      partialize: (state) => ({
        // We don't need to persist most state to localStorage since we load from Firebase
        // Only keep minimal temporary state
        score: state.score,
        streak: state.streak,
        lastStreakDate: state.lastStreakDate
      })
    }
  )
);