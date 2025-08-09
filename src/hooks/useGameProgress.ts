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

// Generate initial sections
const generateSections = (): Section[] => {
  const sections: Section[] = [];
  
  for (let sectionId = 0; sectionId < 5; sectionId++) {
    const levels: Level[] = [];
    
    for (let levelId = 0; levelId < 5; levelId++) {
      levels.push({
        id: levelId,
        title: `Level ${levelId + 1}`,
        isLocked: !(sectionId === 0 && levelId === 0), // Only first level unlocked
        isCompleted: false,
        bestScore: 0,
        attempts: 0,
        lastPlayed: null
      });
    }
    
    sections.push({
      id: sectionId,
      title: `Section ${sectionId + 1}`,
      description: `Complete all levels in section ${sectionId + 1}`,
      isLocked: sectionId !== 0, // Only first section unlocked
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
      title: 'Streak Bonus',
      description: 'Play any game to maintain your streak',
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
            setData(docData);
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
    if (!user?.uid || !data) return;
    
    const gameProgress = data.progress[gameType];
    if (!gameProgress) return;
    
    const newXP = Math.max(0, gameProgress.xp + points);
    
    await updateData({
      score: data.score + points,
      progress: {
        ...data.progress,
        [gameType]: {
          ...gameProgress,
          xp: newXP
        }
      }
    });
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
    
    // Mark as completed if score >= 80%
    const isLevelCompleted = score !== undefined && score >= 80;
    let nextSectionId = sectionId;
    let nextLevelId = levelId;
    
    if (isLevelCompleted) {
      level.isCompleted = true;
      
      // Unlock next level
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
      }
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