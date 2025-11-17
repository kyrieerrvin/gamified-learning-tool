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
  // Raw score for this level (number of correct answers minus hearts lost)
  score: number;
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

// User profile data (consolidated from UserService)
// Note: uid is not stored since document ID is already the user ID
export type UserProfile = {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  joinDate: string;
  lastActiveDate: string;
  // New: grade level onboarding selection; null until user picks one
  gradeLevel?: 'G1' | 'G2' | 'G3' | null;
  preferences: {
    emailNotifications: boolean;
    dailyReminder: boolean;
  };
};

// Challenge result tracking
export type ChallengeResult = {
  id: string;
  challengeType: 'make-sentence' | 'multiple-choice' | 'conversation';
  score: number;
  maxScore: number;
  completedAt: string;
  duration: number;
  isCorrect: boolean;
  gameType: string;
};

// Record of completed levels for progression tracking
type LevelProgress = {
  [gameType: string]: {
    currentLevel: number;
    currentSection: number;
    sections: Section[];
    xp: number;
    quests: DailyQuest[];
    completedLevels: string[];
    lastPlayedAt?: string;
  }
};

// Define achievement types
export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlockedAt?: string;
  gameType?: string; // Which game type this achievement was earned in
}

// GameState represents the global game state (consolidated data model)
type GameState = {
  // User profile
  profile: UserProfile | null;
  
  // Game statistics
  score: number;
  streak: number;
  lastStreakDate: string;
  streakState: "none" | "inactive" | "active";
  totalChallengesCompleted: number;
  
  // Game progress
  progress: LevelProgress;
  achievements: string[]; // For backward compatibility with existing users
  gameAchievements: {
    [gameType: string]: string[]; // Game-specific achievements by game type
  };
  
  // Challenge history
  recentChallenges: ChallengeResult[];
  
  // Actions
  addPoints: (points: number, gameType: string) => void;
  increaseStreak: () => void;
  resetStreak: () => void;
  
  // Game progression
  completeLevel: (gameType: string, sectionId: number, levelId: number, score?: number, rawScore?: number) => void;
  canAccessLevel: (gameType: string, sectionId: number, levelId: number) => boolean;
  unlockSection: (gameType: string, sectionId: number) => void;
  initializeGameProgress: (gameType: string) => void;
  
  // Daily quests
  addProgressToQuest: (gameType: string, questId: string, amount: number) => void;
  completeQuest: (gameType: string, questId: string) => void;
  checkAndRefreshQuests: (gameType: string) => void;
  resetQuests: (gameType: string) => void;
  completeStreakBonusQuest: (gameType: string) => void;
  
  // Challenge tracking
  addChallengeResult: (result: ChallengeResult) => void;
  
  // User specific data
  loadUserProgress: () => Promise<void>;
  saveUserProgress: () => Promise<void>;
  migrateUserData?: () => Promise<void>;
  checkStreakReset: () => void;
  checkStreakStatus: () => void;
  completeGame: (gameType: string, score: number, isCorrect: boolean) => void;
  ensureGameProgressExists: (gameType: string) => void;
  
  // Profile management
  updateUserProfile: (updates: Partial<UserProfile>) => void;
};

// Helper to get today's date as ISO string for consistency
const getTodayDateString = () => {
  // Use consistent ISO format for all dates
  return new Date().toISOString();
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

// Helper to get tomorrow's date as ISO string for consistency
const getTomorrowDateString = (): string => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString();
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
      score: 0,
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
      title: 'Tatlong Sunod-sunod!',
      description: 'Makakuha ng 3 sunod-sunod na tamang sagot',
      reward: 10,
      progress: 0,
      target: 1, // Just needs to be achieved once
      isCompleted: false,
      expiresAt
    },
    {
      id: 'complete-games',
      title: 'Tatlong laro!',
      description: 'Makatapos ng 3 laro ngayong araw (anumang puntos)',
      reward: 15,
      progress: 0,
      target: 3,
      isCompleted: false,
      expiresAt
    },
    {
      id: 'perfect-score',
      title: 'Perpekto!',
      description: 'Tumapos ng isang level na may perpektong puntos.',
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
      profile: null,
      score: 0,
      streak: 0,
      lastStreakDate: '',
      streakState: 'none' as 'none' | 'inactive' | 'active',
      totalChallengesCompleted: 0,
      progress: {},
      achievements: [],
      gameAchievements: {},
      recentChallenges: [],
      
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
        const updatedQuests = gameProgress.quests;
        
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
                currentLevel: 0,
                completedLevels: []
              }
            }
          };
        });
      },
      
      completeLevel: (gameType: string, sectionId: number, levelId: number, score?: number, rawScore?: number) => {
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

          // Store raw score for this attempt if provided (clamped 0..10)
          if (typeof rawScore === 'number' && !Number.isNaN(rawScore)) {
            const clampedRaw = Math.max(0, Math.min(10, Math.round(rawScore)));
            level.score = clampedRaw;
          }
          
          // Store the best score if higher than previous
          if (score !== undefined && (level.bestScore === undefined || score > level.bestScore)) {
            level.bestScore = score;
          }
          
          // Create a unique ID for this level to track completion
          const levelKey = `${sectionId}-${levelId}`;
          
          // Track completed levels for summary stats
          let completedLevels = [...(gameProgress.completedLevels || [])];
          
          // Get achievements arrays
          let achievements = [...(state.achievements || [])];
          let gameTypeAchievements = [...(state.gameAchievements[gameType] || [])];
          
          // Track where the user should go next (current position)
          let nextSectionId = sectionId;
          let nextLevelId = levelId;
          
          // Mark level as completed if score is at least 80% (threshold for completing a level)
          const isLevelCompleted = score !== undefined && score >= 80;
          
          if (isLevelCompleted) {
            // Mark the level as completed
            level.isCompleted = true;
            
            // Add to completed levels array if not already there
            if (!completedLevels.includes(levelKey)) {
              completedLevels.push(levelKey);
            }
            
            // Check for "Perfect Score" achievement - score must be at least 100 (including bonuses)
            if (score >= 100 && !gameTypeAchievements.includes('perfect-score')) {
              // Add to game-specific achievements
              gameTypeAchievements.push('perfect-score');
              
              // Also add to global achievements for backward compatibility
              if (!achievements.includes('perfect-score')) {
                achievements.push('perfect-score');
              }
              
              console.log(`[Achievement] Unlocked: Perfect Score in ${gameType}`);
            }
            
            // Calculate the next level ID - advance to the next level
            if (levelId < section.levels.length - 1) {
              // Move to the next level in the same section
              nextLevelId = levelId + 1;
              
              // Unlock the next level
              section.levels[nextLevelId].isLocked = false;
            } 
            // If this was the last level in the section, move to the next section
            else if (levelId === section.levels.length - 1) {
              section.isCompleted = true;
              
              // Check for "Section Champion" achievement
              // A section is considered completed when all its levels are completed
              const isSectionCompleted = section.levels.every((lvl: Level) => lvl.isCompleted);
              if (isSectionCompleted && !gameTypeAchievements.includes('section-champion')) {
                // Add to game-specific achievements
                gameTypeAchievements.push('section-champion');
                
                // Also add to global achievements for backward compatibility
                if (!achievements.includes('section-champion')) {
                  achievements.push('section-champion');
                }
                
                console.log(`[Achievement] Unlocked: Section Champion in ${gameType}`);
              }
              
              // Move to the next section if available
              if (sectionId < updatedSections.length - 1) {
                nextSectionId = sectionId + 1;
                nextLevelId = 0; // Start at the first level of the next section
                
                // Unlock the next section
                updatedSections[nextSectionId].isLocked = false;
                
                // Unlock the first level of the next section
                updatedSections[nextSectionId].levels[0].isLocked = false;
              }
            }
          }
          
          // Update quest progress for game completion
          const updatedQuests = gameProgress.quests.map(quest => {
            // For the 'perfect-score' quest, count games with a score of at least 100 (including bonuses)
            if (quest.id === 'perfect-score' && !quest.isCompleted && score !== undefined && score >= 100) {
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
          
          // Calculate XP Master achievement
          if (gameProgress.xp >= 1000 && !gameTypeAchievements.includes('xp-master')) {
            // Add to game-specific achievements
            gameTypeAchievements.push('xp-master');
            
            // Also add to global achievements for backward compatibility
            if (!achievements.includes('xp-master')) {
              achievements.push('xp-master');
            }
            
            console.log(`[Achievement] Unlocked: XP Master in ${gameType}`);
          }
          
          // Prepare updated gameAchievements object
          const updatedGameAchievements = {
            ...state.gameAchievements,
            [gameType]: gameTypeAchievements
          };
          
          // Prepare updated state
          const newState = {
            achievements, // Update global achievements for backward compatibility
            gameAchievements: updatedGameAchievements, // Update game-specific achievements
            progress: {
              ...state.progress,
              [gameType]: {
                ...gameProgress,
                sections: updatedSections,
                quests: updatedQuests,
                completedLevels, // Update completed levels tracking
                
                // Update the current position to the next level
                currentSection: nextSectionId,
                currentLevel: nextLevelId
              }
            }
          };
          
          // Log the level transition
          console.log(`[Progress] Advanced to Section ${nextSectionId}, Level ${nextLevelId}`);
          
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
                progress: newProgress,  // Use exact same XP value as the game total
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
          // Skip if no progress data for this game type
          if (!state.progress || !state.progress[gameType]) return state;
          
          // Get the quests for this specific game type
          const gameProgress = state.progress[gameType];
          
          // Update only the streak-bonus quest for this game type
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
      
      // Challenge tracking
      addChallengeResult: (result: ChallengeResult) => {
        set((state) => {
          const newChallenges = [...state.recentChallenges, result];
          // Cap at 50 challenges to prevent document size issues
          const cappedChallenges = newChallenges.slice(-50);
          return { recentChallenges: cappedChallenges };
        });
      },
      
      // Check if streak should be reset
      checkStreakReset: () => {
        set((state) => {
          console.log('[StreakCheck] Current state:', { 
            streak: state.streak, 
            lastStreakDate: state.lastStreakDate, 
            streakState: state.streakState 
          });
          
          // If there's no last streak date, no need to check
          if (!state.lastStreakDate) {
            console.log('[StreakCheck] No last streak date, setting to none');
            return { ...state, streakState: 'none' };
          }
          
          const today = getTodayDateString();
          
          // If they already played today, streak is active
          if (isSameDay(state.lastStreakDate, today)) {
            console.log('[StreakCheck] Played today, keeping streak active');
            return { ...state, streakState: 'active' };
          }
          
          // If they last played yesterday, streak is valid but inactive
          if (isConsecutiveDay(state.lastStreakDate, today)) {
            console.log('[StreakCheck] Played yesterday, streak inactive but valid');
            return { ...state, streakState: 'inactive' };
          }
          
          // If it's been more than a day since last play, reset streak
          console.log('[StreakCheck] Resetting streak due to inactivity');
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
      
      // Complete a game and handle streak/XP tracking
      completeGame: (gameType, score, isCorrect) => set((state) => {
        if (!gameType) return state;
        
        console.log(`[GameDB] Completing game: ${gameType}, Score: ${score}, Correct: ${isCorrect}`);
        
        // Update the last played timestamp
        const gameProgress = state.progress[gameType] || {
          sections: generateSections(),
          xp: 0,
          quests: generateDailyQuests(),
          currentSection: 0,
          currentLevel: 0,
          completedLevels: [],
          lastPlayedAt: ''
        };
        
        // Create updated game progress with timestamp
        const updatedGameProgress = {
          ...gameProgress,
          lastPlayedAt: new Date().toISOString()
        };
        
        // Update streak handling - IMPORTANT: streak is not reset on wrong answers
        // It only updates (increases) when it's the first correct answer of a new day
        const today = getTodayDateString();
        const streakUpdates: Partial<GameState> = {};
        
        // Only consider streak updates for correct answers
        if (isCorrect) {
          if (state.lastStreakDate !== today) {
            // This is the first correct answer of a new day - increase streak
            streakUpdates.streak = state.streak + 1;
            streakUpdates.lastStreakDate = today;
            streakUpdates.streakState = 'active';
            
            console.log(`[GameDB] Increasing streak to ${streakUpdates.streak} (first correct answer today)`);
          } else {
            // Already played today and got something correct - streak remains active
            streakUpdates.streakState = 'active';
          }
        }
        
        // Update achievements - track each game type separately
        let achievements = [...(state.achievements || [])];
        let gameTypeAchievements = [...(state.gameAchievements[gameType] || [])];
        
        // Check for "First Steps" achievement - completing any game
        if (!gameTypeAchievements.includes('first-steps')) {
          // Add to game-specific achievements
          gameTypeAchievements.push('first-steps');
          
          // Also add to global achievements for backward compatibility
          if (!achievements.includes('first-steps')) {
            achievements.push('first-steps');
          }
          
          console.log(`[Achievement] Unlocked: First Steps in ${gameType} - Completed your first game!`);
        }
        
        // Check for "Perfect Score" achievement - score must be at least 100 (including bonuses)
        if (score >= 100 && !gameTypeAchievements.includes('perfect-score')) {
          // Add to game-specific achievements
          gameTypeAchievements.push('perfect-score');
          
          // Also add to global achievements for backward compatibility
          if (!achievements.includes('perfect-score')) {
            achievements.push('perfect-score');
          }
          
          console.log(`[Achievement] Unlocked: Perfect Score in ${gameType} - Scored 100% or higher!`);
        }
        
        // Check for "Streak Master" achievement - maintain a 7-day streak
        // Note: Streak Master is a global achievement, not game-specific
        if (streakUpdates.streak !== undefined && streakUpdates.streak >= 7 && !achievements.includes('streak-master')) {
          // Add directly to global achievements
          achievements.push('streak-master');
          
          // But also add to game-specific achievements for the current game type
          if (!gameTypeAchievements.includes('streak-master')) {
            gameTypeAchievements.push('streak-master');
          }
          
          console.log('[Achievement] Unlocked: Streak Master - Maintained a 7-day streak!');
        }
        
        // Prepare updated gameAchievements object
        const updatedGameAchievements = {
          ...state.gameAchievements,
          [gameType]: gameTypeAchievements
        };
        
        // Update progress with the game progress
        const updatedProgress = {
          ...state.progress,
          [gameType]: updatedGameProgress
        };
        
        // Create a challenge result record
        const challengeResult: ChallengeResult = {
          id: `${gameType}-${Date.now()}`,
          challengeType: gameType as 'make-sentence' | 'multiple-choice' | 'conversation',
          score,
          maxScore: 100,
          completedAt: new Date().toISOString(),
          duration: 0, // TODO: Track actual duration
          isCorrect,
          gameType
        };
        
        // Add to recent challenges
        const updatedRecentChallenges = [...state.recentChallenges, challengeResult];
        
        // Create the final state updates
        const gameUpdates = {
          progress: updatedProgress,
          achievements, // For backward compatibility
          gameAchievements: updatedGameAchievements,
          totalChallengesCompleted: state.totalChallengesCompleted + 1,
          recentChallenges: updatedRecentChallenges,
          ...streakUpdates
        };
        
        // Save to database
        setTimeout(() => get().saveUserProgress(), 0);
        
        return gameUpdates;
      }),
      
      // Save user progress to database - disabled to avoid conflicts with useGameProgress
      // All writes should go through src/hooks/useGameProgress.ts for a single source of truth
      saveUserProgress: async () => {
        // No-op: prevent overwriting XP and quests written by useGameProgress
        return;
      },
      
      // User-specific progress
      loadUserProgress: async () => {
        const user = auth.currentUser;
        if (!user) {
          console.log('[Auth] No authenticated user found when trying to load progress');
          return;
        }
        
        try {
          console.log(`[Auth] Loading progress for user: ${user.uid}`);
          const userProgressRef = doc(db, GAME_PROGRESS_COLLECTION, user.uid);
          const userProgressDoc = await getDoc(userProgressRef);
          
          if (userProgressDoc.exists()) {
            const data = userProgressDoc.data();
            
            set(state => ({
              ...state,
              profile: data.profile || null,
              score: data.score || 0,
              streak: data.streak || 0,
              lastStreakDate: data.lastStreakDate || '',
              streakState: data.streakState || 'none',
              totalChallengesCompleted: data.totalChallengesCompleted || 0,
              achievements: data.achievements || [],
              gameAchievements: data.gameAchievements || {},
              recentChallenges: data.recentChallenges || [],
              progress: data.progress || {}
            }));
            
            console.log('[Auth] Successfully loaded user progress from Firestore');
          } else {
            console.log('[Auth] No saved progress found for user. Initializing new progress.');
            
            // Create initial game progress structure
            const initialProgress = {
              'make-sentence': {
                sections: generateSections(),
                xp: 0,
                quests: generateDailyQuests(),
                currentSection: 0,
                currentLevel: 0,
                completedLevels: []
              },
              'multiple-choice': {
                sections: generateSections(),
                xp: 0,
                quests: generateDailyQuests(),
                currentSection: 0,
                currentLevel: 0,
                completedLevels: []
              }
            };
            
            // First, unlock the first level of each game type
            const gameTypes = ['make-sentence', 'multiple-choice'] as const;
            for (const gameType of gameTypes) {
              if (initialProgress[gameType].sections.length > 0) {
                initialProgress[gameType].sections[0].isLocked = false;
                if (initialProgress[gameType].sections[0].levels.length > 0) {
                  initialProgress[gameType].sections[0].levels[0].isLocked = false;
                }
              }
            }
            
            // Create initial user profile
            const initialProfile: UserProfile = {
              displayName: user.displayName ?? null,
              email: user.email ?? null,
              photoURL: user.photoURL ?? null,
              joinDate: new Date().toISOString(),
              lastActiveDate: new Date().toISOString(),
              gradeLevel: null,
              preferences: {
                emailNotifications: false,
                dailyReminder: true
              }
            };
            
            // Prepare initial state for local store (only GameState-compatible fields)
            const newUserState: Partial<GameState> = {
              profile: initialProfile,
              score: 0,
              streak: 0,
              lastStreakDate: '',
              streakState: 'none',
              totalChallengesCompleted: 0,
              achievements: [],
              gameAchievements: {},
              recentChallenges: [],
              progress: initialProgress
            };
            // Prepare full document for Firestore (can include extra metadata)
            const newUserDoc = {
              ...newUserState,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              userId: user.uid
            } as any;
            
            // Update local state
            set(() => ({
              ...(newUserState as Partial<GameState>)
            }));
            
            // IMPORTANT: Save the initial data to Firestore immediately
            // This ensures the user has a gameProgress document from the start
            try {
              await setDoc(userProgressRef, newUserDoc);
              console.log('[Auth] Successfully created new user progress document in Firestore');
            } catch (error) {
              console.error('[Auth] Error creating initial progress document:', error);
            }
          }
          
          // Check if streak should be reset after loading data
          get().checkStreakReset();
          
        } catch (error) {
          console.error('[Auth] Error loading user progress:', error);
        }
      },
      
      // Ensure game progress exists for a given game type
      ensureGameProgressExists: (gameType: string) => {
        set((state) => {
          if (!state.progress[gameType]) {
            const newProgress = {
              sections: generateSections(),
              xp: 0,
              quests: generateDailyQuests(),
              currentSection: 0,
              currentLevel: 0,
              completedLevels: []
            };
            
            return {
              progress: {
                ...state.progress,
                [gameType]: newProgress
              }
            };
          }
          return state;
        });
      },
      
      // Profile management
      updateUserProfile: (updates: Partial<UserProfile>) => {
        set((state) => {
          const nextProfile: UserProfile = {
            displayName: updates.displayName ?? state.profile?.displayName ?? null,
            email: updates.email ?? state.profile?.email ?? null,
            photoURL: updates.photoURL ?? state.profile?.photoURL ?? null,
            joinDate: updates.joinDate ?? state.profile?.joinDate ?? new Date().toISOString(),
            lastActiveDate: updates.lastActiveDate ?? state.profile?.lastActiveDate ?? new Date().toISOString(),
            gradeLevel: updates.gradeLevel ?? state.profile?.gradeLevel ?? null,
            preferences: updates.preferences ?? state.profile?.preferences ?? { emailNotifications: false, dailyReminder: true }
          };
          return { profile: nextProfile };
        });
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