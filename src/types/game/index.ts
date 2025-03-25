/**
 * Core game type definitions shared across the application
 */

// ======== Shared Types ========

/**
 * Game types for progression tracking
 */
export type GameType = 'make-sentence' | 'multiple-choice';

// ======== Parts of Speech Game Types ========

/**
 * Represents a word token with part of speech information
 */
export interface POSToken {
  text: string;
  pos: string;
  description: string;
}

/**
 * Represents a multiple choice question for the Parts of Speech game
 */
export interface POSQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

/**
 * Game data for Parts of Speech (Multiple Choice) game
 */
export interface POSGameData {
  sentence: string;
  questions: POSQuestion[];
  source?: string;
  timestamp?: number;
  port?: number;
}

/**
 * Verification result for Parts of Speech answer
 */
export interface POSAnswerVerification {
  word: string;
  selected: string;
  correct: string;
  is_correct: boolean;
  explanation?: string;
}

// ======== Make a Sentence Game Types ========

/**
 * Represents a word for the Make a Sentence game
 */
export interface SentenceWord {
  word: string;
  description: string;
}

/**
 * Represents a verification result for a sentence
 */
export interface SentenceVerificationResult {
  isCorrect: boolean;
  feedback: string;
  word: string;
  sentence: string;
  error?: string;
}

/**
 * Record of a sentence creation attempt
 */
export interface SentenceAttempt {
  word: string;
  sentence: string;
  isCorrect: boolean;
  feedback: string;
  timestamp: number;
}

/**
 * Game data for Make a Sentence game
 */
export interface MakeSentenceGameData {
  words: SentenceWord[];
  currentIndex: number;
  score: number;
  history: SentenceAttempt[];
  totalQuestions: number;
}
