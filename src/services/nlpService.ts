// src/services/nlpService.ts
/* 
 * CLAUDE-MEMORY-ANCHOR: nlp-service-main
 * UUID: 7f4e9c3d-6a5b-4b8a-9e1f-3c9d7b2e8f1a
 * PURPOSE: NLP service integration for Tagalog language analysis
 * RELATED-COMPONENTS: gameService, API routes
 * LAST-UPDATED: 2025-03-10
 */
import { POSQuestion } from './gameService';

// Types for the NLP service
export interface NLPToken {
  text: string;
  pos: string;
  description: string;
}

export interface GameData {
  sentence: string;
  questions: POSQuestion[];
  source: string;
  difficulty?: string;
  timestamp?: number;
  custom?: boolean;
}

export interface AnswerVerification {
  word: string;
  selected: string;
  correct: string;
  is_correct: boolean;
  explanation: string;
}

// Helper function to get the NLP API URL
function getNlpApiUrl(): string {
  // Always use port 5000 for simplicity and reliability
  return 'http://localhost:5000';
}

/**
 * Fetch game data from the dedicated NLP API
 * @param difficulty The difficulty level for the game
 * @param customSentence Optional custom sentence to use
 * @returns Promise with game data
 */
export async function fetchNlpGameData(
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  customSentence?: string
): Promise<GameData> {
  try {
    // Set a timeout for the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    // Build the URL
    const baseUrl = `${getNlpApiUrl()}/api/pos-game`;
    const url = customSentence
      ? `${baseUrl}?difficulty=${difficulty}&sentence=${encodeURIComponent(customSentence)}`
      : `${baseUrl}?difficulty=${difficulty}`;
    
    console.log(`Fetching NLP game data from: ${url}`);
    
    // Make the request
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });
    
    // Clear the timeout
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch from NLP API (Status: ${response.status})`);
    }
    
    const data = await response.json();
    
    // Validate the response data
    if (!data || !data.sentence || !data.questions || !Array.isArray(data.questions)) {
      throw new Error('Invalid data structure received from NLP API');
    }
    
    // Store the port for future requests
    if (data.port) {
      localStorage.setItem('nlp_api_port', data.port.toString());
    }
    
    console.log(`Successfully received game data from NLP API (${data.source})`);
    return data;
  } catch (error) {
    console.error('Error fetching NLP game data:', error);
    throw error;
  }
}

/**
 * Submit a custom sentence to create a game
 * @param sentence The custom Tagalog sentence to use
 * @returns Promise with game data
 */
export async function createCustomGame(sentence: string): Promise<GameData> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    const url = `${getNlpApiUrl()}/api/custom-game`;
    console.log(`Creating custom game with sentence: "${sentence}"`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ sentence }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to create custom game (Status: ${response.status})`);
    }
    
    const data = await response.json();
    
    // Validate the response data
    if (!data || !data.sentence || !data.questions || !Array.isArray(data.questions)) {
      throw new Error('Invalid data structure received from NLP API');
    }
    
    return data;
  } catch (error) {
    console.error('Error creating custom game:', error);
    throw error;
  }
}

/**
 * Analyze a Tagalog sentence to get POS tags for each word
 * @param sentence The Tagalog sentence to analyze
 * @returns Promise with analysis results
 */
export async function analyzeSentence(sentence: string): Promise<{
  sentence: string;
  tokens: NLPToken[];
  method: string;
}> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    // Use the Next.js API route for proxying the request
    const url = '/api/analyze';
    console.log(`Analyzing sentence via Next.js API route: "${sentence}"`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ sentence }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      try {
        // First try to parse as JSON
        const errorData = await response.json().catch(() => null);
        if (errorData && errorData.error) {
          throw new Error(errorData.error);
        }
      } catch (e) {
        // If JSON parsing fails, try to get the response as text
        try {
          const errorText = await response.text();
          throw new Error(`Failed to analyze sentence (Status: ${response.status}). Response: ${errorText.substring(0, 100)}`);
        } catch (textError) {
          // If all else fails, use a generic error
          throw new Error(`Failed to analyze sentence (Status: ${response.status})`);
        }
      }
    }
    
    const data = await response.json();
    
    // Validate the response data
    if (!data || !data.sentence || !data.tokens || !Array.isArray(data.tokens)) {
      throw new Error('Invalid data structure received from NLP API');
    }
    
    return data;
  } catch (error) {
    console.error('Error analyzing sentence:', error);
    throw error;
  }
}

/**
 * Verify an answer to a POS question
 * @param word The word being asked about
 * @param sentence The sentence containing the word
 * @param selectedAnswer The answer selected by the user
 * @returns Promise with verification result
 */
export async function verifyAnswer(
  word: string,
  sentence: string,
  selectedAnswer: string
): Promise<AnswerVerification> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    // Use the Next.js API route for proxying the request
    const url = '/api/verify';
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        word,
        sentence,
        selected: selectedAnswer
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      try {
        // First try to parse as JSON
        const errorData = await response.json().catch(() => null);
        if (errorData && errorData.error) {
          throw new Error(errorData.error);
        }
      } catch (e) {
        // If JSON parsing fails, try to get the response as text
        try {
          const errorText = await response.text();
          throw new Error(`Failed to verify answer (Status: ${response.status}). Response: ${errorText.substring(0, 100)}`);
        } catch (textError) {
          // If all else fails, use a generic error
          throw new Error(`Failed to verify answer (Status: ${response.status})`);
        }
      }
    }
    
    const data = await response.json();
    
    // Validate the response data
    if (!data || !data.word || !data.correct || typeof data.is_correct !== 'boolean') {
      throw new Error('Invalid verification data received from NLP API');
    }
    
    return data;
  } catch (error) {
    console.error('Error verifying answer:', error);
    throw error;
  }
}

/**
 * Check the health of the NLP API
 * @returns Promise with health information
 */
export async function checkNlpHealth(): Promise<{
  status: string;
  model: string;
  model_status: string;
  pos_tags_available: string[];
}> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const url = `${getNlpApiUrl()}/health`;
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Health check failed (Status: ${response.status})`);
    }
    
    const data = await response.json();
    
    if (!data || !data.status) {
      throw new Error('Invalid health data received from NLP API');
    }
    
    return data;
  } catch (error) {
    console.error('Error checking NLP health:', error);
    throw error;
  }
}

/**
 * Interface for Make a Sentence game word
 */
export interface SentenceWord {
  word: string;
  description: string;
}

/**
 * Interface for sentence verification result
 */
export interface SentenceVerificationResult {
  isCorrect: boolean;
  feedback: string;
  word: string;
  sentence: string;
  error?: string;
}

/**
 * Fetch words for Make a Sentence game
 * @returns Promise with words for the game
 */
export async function fetchSentenceWords(): Promise<SentenceWord[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    // Use the Next.js API route for proxying the request
    const url = `/api/challenges/make-sentence/words`;
    console.log(`Fetching Make a Sentence words via API route`);
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch words (Status: ${response.status})`);
    }
    
    const data = await response.json();
    
    if (!data || !data.words || !Array.isArray(data.words)) {
      throw new Error('Invalid data structure received from API');
    }
    
    console.log(`Received ${data.words.length} words for Make a Sentence game`);
    return data.words;
  } catch (error) {
    console.error('Error fetching sentence words:', error);
    throw error;
  }
}

/**
 * Verify a sentence created by the user
 * @param word The word that should be used in the sentence
 * @param sentence The sentence created by the user
 * @returns Promise with verification result
 */
export async function verifySentence(
  word: string,
  sentence: string
): Promise<SentenceVerificationResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    // Use the Next.js API route for proxying the request
    const url = '/api/challenges/make-sentence/verify';
    console.log(`Verifying sentence for word "${word}": "${sentence}"`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ word, sentence }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      try {
        const errorData = await response.json().catch(() => null);
        if (errorData && errorData.error) {
          throw new Error(errorData.error);
        }
      } catch (e) {
        throw new Error(`Failed to verify sentence (Status: ${response.status})`);
      }
    }
    
    const data = await response.json();
    
    if (!data || typeof data.isCorrect !== 'boolean') {
      throw new Error('Invalid verification data received from API');
    }
    
    return data as SentenceVerificationResult;
  } catch (error) {
    console.error('Error verifying sentence:', error);
    throw error;
  }
}