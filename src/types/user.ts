/**
 * Types for user data stored in Firestore
 */

export interface UserProgress {
  totalScore: number;
  level: number;
  nextLevelPoints: number;
  xpEarned: number;
  streakDays: number;
  lastActiveDate: string; // ISO date string format
  challengesCompleted: number;
  completedChallenges: {
    conversation: number;
    makeSentence: number;
    multipleChoice: number;
  };
  joinDate: string; // ISO date string format
}

export interface UserAchievement {
  id: string;
  name: string;
  description: string;
  iconName: string;
  unlockedDate: string; // ISO date string format
  category: 'streak' | 'score' | 'completion' | 'special';
}

export interface ChallengeResult {
  id: string;
  challengeType: 'conversation' | 'makeSentence' | 'multipleChoice';
  score: number;
  maxScore: number;
  completedAt: string; // ISO date string format
  duration: number; // in seconds
}

export interface UserData {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  progress: UserProgress;
  achievements: UserAchievement[];
  recentChallenges: ChallengeResult[];
  preferences: {
    emailNotifications: boolean;
    dailyReminder: boolean;
  };
  createdAt: string; // ISO date string format
  updatedAt: string; // ISO date string format
}

export interface UserContextType {
  userData: UserData | null;
  loading: boolean;
  error: Error | null;
  updateUserProgress: (progress: Partial<UserProgress>) => Promise<void>;
  updateUserAchievements: (achievement: UserAchievement) => Promise<void>;
  addChallengeResult: (result: ChallengeResult) => Promise<void>;
  updateUserPreferences: (preferences: Partial<UserData['preferences']>) => Promise<void>;
}
