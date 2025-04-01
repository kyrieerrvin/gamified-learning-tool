/**
 * Type definitions for game-related data
 */

// History entry for Make a Sentence game
export interface SentenceAttempt {
  word: string;
  userSentence: string;
  isCorrect: boolean;
  feedback: string;
  timestamp: string;
}

// Make a Sentence game data
export interface MakeSentenceGameData {
  words: Array<{
    word: string;
    description: string;
  }>;
  currentIndex: number;
  totalQuestions: number;
  score: number;
  history: SentenceAttempt[];
  startTime: number;
  endTime: number | null;
}

// Result of sentence verification
export interface SentenceVerificationResult {
  isCorrect: boolean;
  containsWord: boolean;
  feedback: string;
}

// Multiple Choice game data
export interface MultipleChoiceGameData {
  questions: Array<{
    id: number;
    question: string;
    options: string[];
    correctAnswerIndex: number;
  }>;
  currentIndex: number;
  totalQuestions: number;
  score: number;
  history: Array<{
    questionId: number;
    selectedOption: number;
    isCorrect: boolean;
    timestamp: string;
  }>;
  startTime: number;
  endTime: number | null;
}

// Result of answering a multiple choice question
export interface MultipleChoiceAnswerResult {
  isCorrect: boolean;
  correctAnswerIndex: number;
  explanation?: string;
}
