'use client';

import { useEffect, useState } from 'react';
import { onSnapshot, doc, updateDoc, setDoc, increment, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

// Types from existing gameStore
export type Section = {
  id: number;
  title: string;
  description: string;
  isLocked: boolean;
  isCompleted: boolean;
  levels: Level[];
};

export type Level = {
  id: number;
  title: string;
  isLocked: boolean;
  isCompleted: boolean;
  bestScore: number;
  attempts: number;
  lastPlayed: string | null;
};

export type DailyQuest = {
  id: string;
  title: string;
  description: string;
  reward: number;
  progress: number;
  target: number;
  isCompleted: boolean;
  expiresAt: string;
};

export type UserProfile = {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  joinDate: string;
  lastActiveDate: string;
  gradeLevel?: 'G1_2' | 'G3_4' | 'G5_6' | null;
  preferences: {
    emailNotifications: boolean;
    dailyReminder: boolean;
  };
};

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

export type GameProgressData = {
  // User profile
  profile: UserProfile | null;
  
  // Game statistics
  score: number;
  streak: number;
  lastStreakDate: string;
  streakState: "none" | "inactive" | "active";
  totalChallengesCompleted: number;
  
  // Game progress
  progress: {
    [gameType: string]: {
      currentLevel: number;
      currentSection: number;
      sections: Section[];
      xp: number;
      quests: DailyQuest[];
      completedLevels: string[];
      lastPlayedAt?: string;
    };
  };
  
  // Achievements
  achievements: string[];
  gameAchievements: {
    [gameType: string]: string[];
  };
  
  // Challenge history
  recentChallenges: ChallengeResult[];
  
  // Metadata
  updatedAt: string;
};

// Helper functions
const getTodayDateString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isSameDay = (dateStr1: string, dateStr2: string): boolean => {
  if (!dateStr1 || !dateStr2) return false;
  return dateStr1 === dateStr2;
};

const isConsecutiveDay = (lastDateStr: string, todayStr: string): boolean => {
  if (!lastDateStr || !todayStr) return false;
  
  const lastDate = new Date(lastDateStr);
  const today = new Date(todayStr);
  
  const timeDiff = today.getTime() - lastDate.getTime();
  const daysDiff = timeDiff / (1000 * 3600 * 24);
  
  return Math.round(daysDiff) === 1;
};

// Generate 3 Levels (Easy, Difficult, Hard) each with 10 challenges
const generateSections = (): Section[] => {
  const sections: Section[] = [];
  const levelNames = ['Easy', 'Difficult', 'Hard'];
  
  for (let sectionId = 0; sectionId < 3; sectionId++) {
    const levels: Level[] = [];
    
    for (let levelId = 0; levelId < 10; levelId++) {
      levels.push({
        id: levelId,
        title: `Challenge ${levelId + 1}`,
        isLocked: !(sectionId === 0 && levelId === 0), // Only first challenge unlocked
        isCompleted: false,
        bestScore: 0,
        attempts: 0,
        lastPlayed: null
      });
    }
    
    sections.push({
      id: sectionId,
      title: `Level ${sectionId + 1}: ${levelNames[sectionId] || ''}`.trim(),
      description: `Complete all challenges in ${levelNames[sectionId] || `Level ${sectionId + 1}`}`,
      isLocked: sectionId !== 0, // Only first level unlocked
      isCompleted: false,
      levels
    });
  }
  
  return sections;
};

// Generate daily quests
const generateDailyQuests = (): DailyQuest[] => {
  const today = getTodayDateString();
  const expiresAt = today; // Expires at end of today
  
  return [
    {
      id: 'daily-xp',
      title: 'Daily XP',
      description: 'Earn 50 XP today',
      reward: 10,
      progress: 0,
      target: 50,
      isCompleted: false,
      expiresAt
    },
    {
      id: 'streak-bonus',
      title: 'Get 3 Correct in a Row',
      description: 'Answer three questions correctly in a row',
      reward: 10,
      progress: 0,
      target: 1,
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

// Default initial data
const getInitialData = (user: any): GameProgressData => {
  return {
    profile: {
      displayName: user?.displayName || null,
      email: user?.email || null,
      photoURL: user?.photoURL || null,
      joinDate: new Date().toISOString(),
      lastActiveDate: new Date().toISOString(),
      gradeLevel: null,
      preferences: {
        emailNotifications: false,
        dailyReminder: true,
      }
    },
    score: 0,
    streak: 0,
    lastStreakDate: '',
    streakState: 'none',
    totalChallengesCompleted: 0,
    progress: {
      'make-sentence': {
        currentLevel: 0,
        currentSection: 0,
        sections: generateSections(),
        xp: 0,
        quests: generateDailyQuests(),
        completedLevels: [],
      },
      'multiple-choice': {
        currentLevel: 0,
        currentSection: 0,
        sections: generateSections(),
        xp: 0,
        quests: generateDailyQuests(),
        completedLevels: [],
      }
    },
    achievements: [],
    gameAchievements: {},
    recentChallenges: [],
    updatedAt: new Date().toISOString()
  };
};

export const useGameProgress = () => {
  const { user } = useAuth();
  const [data, setData] = useState<GameProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Real-time listener
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }
    
    console.log('[GameProgress] Setting up real-time listener for user:', user.uid);
    
    const userDocRef = doc(db, 'gameProgress', user.uid);
    
    const unsubscribe = onSnapshot(
      userDocRef,
      async (doc) => {
        try {
          if (doc.exists()) {
            const docData = doc.data() as GameProgressData;
            console.log('[GameProgress] Real-time data received:', docData);

            // Migration: ensure 3 Levels with 10 challenges each for both games
            const needsMigration = (progress: any): boolean => {
              if (!progress || !progress.sections) return true;
              if (progress.sections.length !== 3) return true;
              for (const s of progress.sections) {
                if (!s.levels || s.levels.length !== 10) return true;
              }
              return false;
            };

            const updatedProgress: any = { ...docData.progress };
            let didMigrate = false;

            for (const gameType of ['make-sentence', 'multiple-choice']) {
              const gp = docData.progress?.[gameType];
              if (!gp || needsMigration(gp)) {
                didMigrate = true;
                const sections = generateSections();
                // Unlock first level and first challenge
                if (sections.length > 0) {
                  sections[0].isLocked = false;
                  if (sections[0].levels.length > 0) sections[0].levels[0].isLocked = false;
                }
                updatedProgress[gameType] = {
                  sections,
                  xp: gp?.xp || 0,
                  quests: gp?.quests || [],
                  currentSection: 0,
                  currentLevel: 0,
                  completedLevels: []
                };
              }
            }

            // Reset streak if a day was missed (device local date)
            try {
              const today = getTodayDateString();
              const missedDay = !!docData.lastStreakDate &&
                !isSameDay(docData.lastStreakDate, today) &&
                !isConsecutiveDay(docData.lastStreakDate, today) &&
                (docData.streak || 0) > 0;
              if (missedDay) {
                await updateDoc(userDocRef, {
                  streak: 0,
                  streakState: 'none',
                  updatedAt: new Date().toISOString()
                });
                docData.streak = 0;
                docData.streakState = 'none';
              }
            } catch (e) {
              console.warn('[GameProgress] Streak reset check failed:', e);
            }

            if (didMigrate) {
              console.log('[GameProgress] Migrating progress to 3 levels × 10 challenges structure');
              await updateDoc(userDocRef, {
                progress: updatedProgress,
                updatedAt: new Date().toISOString()
              });
              setData({ ...docData, progress: updatedProgress });
            } else {
              setData(docData);
            }
          } else {
            // Create initial data if document doesn't exist
            console.log('[GameProgress] No document found, creating initial data');
            const initialData = getInitialData(user);
            await setDoc(userDocRef, initialData);
            setData(initialData);
          }
          setLoading(false);
          setError(null);
        } catch (err) {
          console.error('[GameProgress] Error processing real-time data:', err);
          setError(err instanceof Error ? err.message : 'Unknown error');
          setLoading(false);
        }
      },
      (err) => {
        console.error('[GameProgress] Real-time listener error:', err);
        setError(err.message);
        setLoading(false);
      }
    );
    
    return () => {
      console.log('[GameProgress] Cleaning up real-time listener');
      unsubscribe();
    };
  }, [user?.uid]);
  
  // Action functions
  const updateData = async (updates: Partial<GameProgressData>) => {
    if (!user?.uid) return;
    
    try {
      const userDocRef = doc(db, 'gameProgress', user.uid);
      await updateDoc(userDocRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('[GameProgress] Error updating data:', err);
      throw err;
    }
  };
  
  const addPoints = async (points: number, gameType: string) => {
    if (!user?.uid) return;
    try {
      const userDocRef = doc(db, 'gameProgress', user.uid);
      await updateDoc(userDocRef, {
        [`progress.${gameType}.xp`]: increment(points),
        score: increment(points),
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('[GameProgress] Error incrementing XP:', err);
      throw err;
    }
  };

  const setQuests = async (gameType: string, quests: DailyQuest[]) => {
    if (!user?.uid) return;
    try {
      const userDocRef = doc(db, 'gameProgress', user.uid);
      await updateDoc(userDocRef, {
        [`progress.${gameType}.quests`]: quests,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('[GameProgress] Error updating quests:', err);
      throw err;
    }
  };
  
  const increaseStreak = async () => {
    if (!user?.uid || !data) return;
    
    const today = getTodayDateString();
    let newStreak = data.streak;
    
    // Don't increase if already played today
    if (isSameDay(data.lastStreakDate, today)) {
      return;
    }
    
    // Increase streak if consecutive day or starting new
    if (isConsecutiveDay(data.lastStreakDate, today) || !data.lastStreakDate) {
      newStreak += 1;
    } else {
      newStreak = 1; // Reset to 1 if missed days
    }
    
    await updateData({
      streak: newStreak,
      lastStreakDate: today,
      streakState: 'active'
    });
  };
  
  const completeLevel = async (gameType: string, sectionId: number, levelId: number, score?: number) => {
    if (!user?.uid || !data) return;
    
    const gameProgress = data.progress[gameType];
    if (!gameProgress) return;
    
    const updatedSections = [...gameProgress.sections];
    const section = updatedSections[sectionId];
    if (!section || !section.levels[levelId]) return;
    
    const level = section.levels[levelId];
    level.attempts = (level.attempts || 0) + 1;
    level.lastPlayed = new Date().toISOString();
    
    if (score !== undefined && (level.bestScore === undefined || score > level.bestScore)) {
      level.bestScore = score;
    }
    
    // Treat invocation of completeLevel as "finished the level"
    // Always mark as completed and advance unlocking
    let nextSectionId = sectionId;
    let nextLevelId = levelId;
    
    level.isCompleted = true;
    
    // Unlock next level or section
    if (levelId < section.levels.length - 1) {
      nextLevelId = levelId + 1;
      section.levels[nextLevelId].isLocked = false;
    } else {
      // Completed section, unlock next section
      section.isCompleted = true;
      if (sectionId < updatedSections.length - 1) {
        nextSectionId = sectionId + 1;
        nextLevelId = 0;
        updatedSections[nextSectionId].isLocked = false;
        updatedSections[nextSectionId].levels[0].isLocked = false;
      }
    }

    // Prepare achievements updates (simple MVP)
    const updatedGameAchievements = { ...(data.gameAchievements || {}) } as Record<string, string[]>;
    const gameTypeAchievements = new Set<string>(updatedGameAchievements[gameType] || []);
    const updatedAchievements = new Set<string>(data.achievements || []);

    // First Steps: completing a first game
    if (!gameTypeAchievements.has('first-steps')) {
      gameTypeAchievements.add('first-steps');
      updatedAchievements.add('first-steps');
    }
    // Perfect Score: score 100
    if (score !== undefined && score >= 100 && !gameTypeAchievements.has('perfect-score')) {
      gameTypeAchievements.add('perfect-score');
      updatedAchievements.add('perfect-score');
    }
    // Section Champion: entire section completed
    const sectionCompleted = section.levels.every(l => l.isCompleted);
    if (sectionCompleted && !gameTypeAchievements.has('section-champion')) {
      gameTypeAchievements.add('section-champion');
      updatedAchievements.add('section-champion');
    }
    updatedGameAchievements[gameType] = Array.from(gameTypeAchievements);
    
    // Streak logic (local time):
    // - Start at 1 on first completion
    // - If same day: keep streak, set active
    // - If consecutive day: +1
    // - If missed days: reset to 1
    const todayStr = getTodayDateString();
    let newStreak = data.streak || 0;
    let newLastStreakDate = data.lastStreakDate || '';
    let newStreakState: 'none' | 'inactive' | 'active' = 'active';
    if (!data.lastStreakDate) {
      newStreak = 1;
      newLastStreakDate = todayStr;
    } else if (isSameDay(data.lastStreakDate, todayStr)) {
      // already counted today; keep state active
      newStreak = data.streak;
      newLastStreakDate = data.lastStreakDate;
    } else if (isConsecutiveDay(data.lastStreakDate, todayStr)) {
      newStreak = (data.streak || 0) + 1;
      newLastStreakDate = todayStr;
    } else {
      // Missed a day, restart at 1
      newStreak = 1;
      newLastStreakDate = todayStr;
    }

    await updateData({
      progress: {
        ...data.progress,
        [gameType]: {
          ...gameProgress,
          sections: updatedSections,
          currentSection: nextSectionId,
          currentLevel: nextLevelId
        }
      },
      achievements: Array.from(updatedAchievements),
      gameAchievements: updatedGameAchievements,
      streak: newStreak,
      lastStreakDate: newLastStreakDate,
      streakState: newStreak > 0 ? 'active' : 'none'
    });
  };
  
  const canAccessLevel = (gameType: string, sectionId: number, levelId: number): boolean => {
    if (!data || !data.progress[gameType]) return false;
    
    const gameProgress = data.progress[gameType];
    if (!gameProgress.sections || sectionId < 0 || sectionId >= gameProgress.sections.length) {
      return false;
    }
    
    const section = gameProgress.sections[sectionId];
    if (!section || section.isLocked) return false;
    
    if (!section.levels || levelId < 0 || levelId >= section.levels.length) {
      return false;
    }
    
    const level = section.levels[levelId];
    return level && !level.isLocked;
  };
  
  return {
    data,
    loading,
    error,
    // Actions
    updateData,
    addPoints,
    setQuests,
    increaseStreak,
    completeLevel,
    canAccessLevel,
    // Convenience getters
    profile: data?.profile || null,
    score: data?.score || 0,
    streak: data?.streak || 0,
    streakState: data?.streakState || 'none',
    progress: data?.progress || {},
    achievements: data?.achievements || [],
    gameAchievements: data?.gameAchievements || {},
    recentChallenges: data?.recentChallenges || []
  };
}; 