// src/types/index.ts
export interface Challenge {
    id: string;
    type: 'conversation' | 'make-sentence' | 'multiple-choice';
    difficulty: 'easy' | 'medium' | 'hard';
    points: number;
    content: any; // We'll define specific content types later
  }
  
  export interface UserProgress {
    totalScore: number;
    currentStreak: number;
    highestStreak: number;
    challengesCompleted: number;
  }
  
  export interface UserProfile {
    id: string;
    name: string;
    progress: UserProgress;
  }