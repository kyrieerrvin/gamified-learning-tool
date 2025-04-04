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
  streakState: "none" | "inactive" | "active";
  progress: LevelProgress;
  
  // Actions
  addPoints: (points: number, gameType: string) => void;
  increaseStreak: () => void;
  resetStreak: () => void;
  
  // Game progression
  completeLevel: (gameType: string, sectionId: number, levelId: number, score?: number) => void;
  canAccessLevel: (gameType: string, sectionId: number, levelId: number) => boolean;
  unlockSection: (gameType: string, sectionId: number) => void;
  initializeGameProgress: (gameType: string) => void;
  
  // Daily quests
  addProgressToQuest: (gameType: string, questId: string, amount: number) => void;
  completeQuest: (gameType: string, questId: string) => void;
  checkAndRefreshQuests: (gameType: string) => void;
  resetQuests: (gameType: string) => void;
  completeStreakBonusQuest: (gameType: string) => void;
  
  // User specific data
  loadUserProgress: () => Promise<void>;
  saveUserProgress: () => Promise<void>;
  migrateUserData: () => Promise<void>;
  checkStreakReset: () => void;
  checkStreakStatus: () => void;
};

// Helper to get today's date as a string in local time (YYYY-MM-DD format)
const getTodayDateString = () => {
  // Use a consistent date format for server/client to avoid hydration issues
  if (typeof window === 'undefined') {
    // Server-side: return a fixed value that will be replaced on client
    return '2025-01-01'; // This will be immediately replaced on client
  }
  
  // Get local date parts
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // +1 because months are 0-indexed
  const day = String(now.getDate()).padStart(2, '0');
  
  // Format as YYYY-MM-DD to maintain compatibility with existing data
  return `${year}-${month}-${day}`;
};

// Helper to check if two dates are consecutive days
const isConsecutiveDay = (previousDate: string, currentDate: string): boolean => {
  if (!previousDate) return false;
  
  // Parse dates (using Date constructor with YYYY-MM-DD format)
  const prev = new Date(previousDate);
  const curr = new Date(currentDate);
  
  // Set to same time to compare just the dates
  prev.setHours(0, 0, 0, 0);
  curr.setHours(0, 0, 0, 0);
  
  // Calculate difference in days
  const timeDiff = curr.getTime() - prev.getTime();
  const daysDiff = timeDiff / (1000 * 3600 * 24);
  
  // Return true if the dates are exactly 1 day apart
  return Math.round(daysDiff) === 1;
};

// Helper to check if dates are the same day
const isSameDay = (dateStr1: string, dateStr2: string): boolean => {
  if (!dateStr1 || !dateStr2) return false;
  return dateStr1 === dateStr2;
};

// Helper to get tomorrow's date as a string in local time (YYYY-MM-DD format)
const getTomorrowDateString = (): string => {
  // Use a consistent date format for server/client to avoid hydration issues
  if (typeof window === 'undefined') {
    // Server-side: return a fixed value that will be replaced on client
    return '2025-01-02'; // This will be immediately replaced on client
  }
  
  // Get local date parts for tomorrow
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const day = String(tomorrow.getDate()).padStart(2, '0');
  
  // Format as YYYY-MM-DD to maintain compatibility with existing data
  return `${year}-${month}-${day}`;
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
  // Get tomorrow's date in YYYY-MM-DD format (using local time)
  const expiresAt = getTomorrowDateString();
  
  return [
    {
      id: 'streak-bonus',
      title: 'Get 3 in a row correct',
      description: 'Answer 3 questions correctly in a row',
      reward: 10,
      progress: 0,
      target: 1, // Just needs to be achieved once
      isCompleted: false,
      expiresAt
    },
    {
      id: 'complete-games',
      title: 'Complete 3 Games',
      description: 'Complete any 3 games today (any score)',
      reward: 15,
      progress: 0,
      target: 3,
      isCompleted: false,
      expiresAt
    },
    {
      id: 'perfect-score',
      title: 'Perfect Score',
      description: 'Complete a level with a perfect score',
      reward: 20,
      progress: 0,
      target: 1,
      isCompleted: false,
      expiresAt
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
      streakState: 'none' as 'none' | 'inactive' | 'active',
      progress: {},
      
      // Basic game actions
      addPoints: (points, gameType) => set((state) => {
        const gameProgress = state.progress[gameType];
        if (!gameProgress) return state;
        
        console.log(`[XP Debug] Adding ${points} points to ${gameType}`);
        console.log(`[XP Debug] Current XP: ${gameProgress.xp}`);
        
        // Prevent negative XP - calculate new XP ensuring it doesn't go below 0
        const newXP = Math.max(0, gameProgress.xp + points);
        
        // Update XP for the specific game type
        const updatedGameProgress = {
          ...gameProgress,
          xp: newXP
        };
        
        console.log(`[XP Debug] New total XP: ${updatedGameProgress.xp}`);
        
        // Update daily quest progress for XP - DIRECTLY use the game's total XP value for consistency
        const updatedQuests = gameProgress.quests.map(quest => {
          if (quest.id === 'daily-xp' && !quest.isCompleted) {
            // Simply use the same newXP value we calculated for total XP
            const isCompleted = newXP >= quest.target;
            
            return {
              ...quest,
              progress: newXP,  // Use exact same XP value as the game total
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
      
      increaseStreak: () => set((state) => {
        const today = getTodayDateString();
        let newStreak = state.streak;
        
        // Case 1: Already logged streak today - don't increase, just make active
        if (isSameDay(state.lastStreakDate, today)) {
          return { 
            ...state, 
            streakState: 'active' 
          }; 
        }
        
        // Case 2: First time playing or continuing streak from yesterday
        if (isConsecutiveDay(state.lastStreakDate, today) || !state.lastStreakDate) {
          newStreak += 1;
        } 
        // Case 3: Missed a day or more, restart streak from 1
        else {
          newStreak = 1; // Start a new streak
        }
        
        const newState = {
          streak: newStreak,
          lastStreakDate: today,
          streakState: 'active' as 'none' | 'inactive' | 'active'
        };
        
        // Save to Firebase after updating local state
        setTimeout(() => get().saveUserProgress(), 0);
        return newState;
      }),
      
      resetStreak: () => set((state) => {
        const newState = {
          streak: 0,
          lastStreakDate: '',
          streakState: 'none' as 'none' | 'inactive' | 'active'
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
      
      completeLevel: (gameType: string, sectionId: number, levelId: number, score?: number) => {
        set((state) => {
          const gameProgress = state.progress[gameType];
          if (!gameProgress) return state;
          
          // Create a deep copy of sections
          const updatedSections = JSON.parse(JSON.stringify(gameProgress.sections));
          
          // Get the section and level
          const section = updatedSections[sectionId];
          if (!section || !section.levels[levelId]) return state;
          
          // Update level stats - this happens regardless of score
          const level = section.levels[levelId];
          level.attempts = (level.attempts || 0) + 1;
          level.lastPlayed = new Date().toISOString();
          
          // Store the best score if higher than previous
          if (score !== undefined && (level.bestScore === undefined || score > level.bestScore)) {
            level.bestScore = score;
          }
          
          // Only mark as completed and unlock next level if perfect score (100)
          if (score === 100) {
            // Mark the level as completed
            level.isCompleted = true;
            
            // Unlock the next level if available
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
          
          // Update quest progress for game completion
          const updatedQuests = gameProgress.quests.map(quest => {
            // For the 'perfect-score' quest, only count games with a perfect score
            if (quest.id === 'perfect-score' && !quest.isCompleted && score === 100) {
              const newProgress = Math.min(quest.progress + 1, quest.target);
              const isCompleted = newProgress >= quest.target;
              
              return {
                ...quest,
                progress: newProgress,
                isCompleted
              };
            }
            // Always update daily XP quest regardless of score
            else if (quest.id === 'daily-xp' && !quest.isCompleted && score !== undefined) {
              // Instead of using gameProgress.xp (total XP), use the points earned in this game session
              // This prevents inconsistency between quest progress and actual XP earned today
              const pointsEarned = Math.floor(score / 10); // Convert score to XP points
              const newProgress = Math.min(quest.progress + pointsEarned, quest.target);
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
              
              // When a quest completes, it automatically gives its reward
              if (isCompleted && !quest.isCompleted) {
                console.log(`Quest ${quest.title} completed! Reward: ${quest.reward} XP`);
                // This is where the extra XP is coming from - automatic quest rewards
                setTimeout(() => get().addPoints(quest.reward, gameType), 0);
              }
              
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
          
          const today = getTodayDateString();
          let questsNeedReset = false;
          
          // Check if any quests have expired
          if (gameProgress.quests && Array.isArray(gameProgress.quests)) {
            gameProgress.quests.forEach(quest => {
              // Compare dates in YYYY-MM-DD format (local time)
              // If the expiration date is today or earlier, the quest has expired
              if (quest.expiresAt <= today) {
                questsNeedReset = true;
              }
            });
          } else {
            // If quests array doesn't exist or is not an array, we need to reset
            questsNeedReset = true;
          }
          
          // If quests need to be reset, generate new ones
          if (questsNeedReset) {
            console.log(`Resetting quests for ${gameType} as they have expired`);
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
      
      resetQuests: (gameType: string) => {
        set((state) => {
          const gameProgress = state.progress[gameType];
          if (!gameProgress) return state;
          
          // Generate fresh quests
          const freshQuests = generateDailyQuests();
          
          const newState = {
            progress: {
              ...state.progress,
              [gameType]: {
                ...gameProgress,
                quests: freshQuests
              }
            }
          };
          
          // Save to Firebase after updating local state
          setTimeout(() => get().saveUserProgress(), 0);
          
          return newState;
        });
      },
      
      completeStreakBonusQuest: (gameType: string) => {
        set((state) => {
          // Skip if no progress data for this game type
          if (!state.progress || !state.progress[gameType]) return state;
          
          // Get the quests for this specific game type
          const gameProgress = state.progress[gameType];
          
          // Update only the streak-bonus quest for this game type
          const updatedQuests = gameProgress.quests.map(quest => {
            if (quest.id === 'streak-bonus' && !quest.isCompleted) {
              return {
                ...quest,
                progress: 1,
                isCompleted: true
              };
            }
            return quest;
          });
          
          // Create the updated progress for just this game type
          const updatedProgress = {
            ...state.progress,
            [gameType]: {
              ...gameProgress,
              quests: updatedQuests
            }
          };
          
          // Save to Firebase after updating
          setTimeout(() => get().saveUserProgress(), 0);
          
          return { progress: updatedProgress };
        });
      },
      
      // Check if streak should be reset
      checkStreakReset: () => {
        set((state) => {
          // If there's no last streak date, no need to check
          if (!state.lastStreakDate) return { ...state, streakState: 'none' };
          
          const today = getTodayDateString();
          
          // If they already played today, streak is active
          if (isSameDay(state.lastStreakDate, today)) {
            return { ...state, streakState: 'active' };
          }
          
          // If they last played yesterday, streak is valid but inactive
          if (isConsecutiveDay(state.lastStreakDate, today)) {
            return { ...state, streakState: 'inactive' };
          }
          
          // If it's been more than a day since last play, reset streak
          console.log('Resetting streak due to inactivity');
          return {
            ...state,
            streak: 0,
            streakState: 'none',
            // Don't update lastStreakDate so they can still start a new streak today
          };
        });
      },
      
      checkStreakStatus: () => {
        set((state) => {
          const today = getTodayDateString();
          
          // If no streak, status is "none"
          if (state.streak === 0) {
            return { ...state, streakState: 'none' };
          }
          
          // If played today, streak is active
          if (isSameDay(state.lastStreakDate, today)) {
            return { ...state, streakState: 'active' };
          }
          
          // Otherwise, streak exists but is inactive
          return { ...state, streakState: 'inactive' };
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
            console.log("Loaded user progress from Firestore");
            
            // Check if we need to reset the streak
            const today = getTodayDateString();
            let { streak = 0, lastStreakDate = '' } = userData;
            
            // If the last streak date is not today or yesterday, reset streak
            if (lastStreakDate && 
                !isSameDay(lastStreakDate, today) && 
                !isConsecutiveDay(lastStreakDate, today)) {
              console.log("Resetting streak due to inactivity. Last played:", lastStreakDate);
              streak = 0; // Reset streak
              lastStreakDate = ''; // Clear the last streak date
            }
            
            // Update user data with potentially reset streak
            set((state) => ({
              ...state,
              ...userData,
              streak,
              lastStreakDate
            }));
            
            // Check and refresh quests for each game type
            Object.keys(userData.progress || {}).forEach(gameType => {
              get().checkAndRefreshQuests(gameType);
            });
            
            console.log('Loaded user progress from Firestore');
            
            // Run migration to clean up hearts-related fields
            await get().migrateUserData();
          } else {
            // User doesn't have progress data yet, initialize defaults
            console.log('No existing progress found for user, initializing default data');
            
            // Initialize default game types
            const defaultGameTypes = ['make-sentence', 'multiple-choice', 'conversation'];
            const initialProgress: LevelProgress = {};
            
            // Initialize progress for each game type
            defaultGameTypes.forEach(gameType => {
              initialProgress[gameType] = {
                sections: generateSections(),
                xp: 0,
                quests: generateDailyQuests(),
                currentSection: 0,
                currentLevel: 0
              };
              
              // First section and first level are always unlocked
              if (initialProgress[gameType].sections.length > 0) {
                initialProgress[gameType].sections[0].isLocked = false;
                
                if (initialProgress[gameType].sections[0].levels.length > 0) {
                  initialProgress[gameType].sections[0].levels[0].isLocked = false;
                }
              }
            });
            
            // Create initial user state
            const initialUserState = {
              score: 0,
              streak: 0,
              lastStreakDate: '',
              streakState: 'none' as 'none' | 'inactive' | 'active',
              progress: initialProgress
            };
            
            // Update local state
            set(initialUserState);
            
            // Save to Firestore
            await setDoc(userProgressRef, initialUserState);
            console.log('Initialized and saved default user progress to Firestore');
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
            streakState: get().streakState,
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
      // Don't persist user progress from localStorage to avoid hydration issues
      partialize: (state) => ({}),
      // Only enable storage on the client side
      skipHydration: true
    }
  )
);