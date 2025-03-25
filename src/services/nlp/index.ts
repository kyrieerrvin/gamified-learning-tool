// src/services/nlp/index.ts
/* 
 * NLP service integration for Tagalog language analysis
 */
import { 
  POSToken, 
  POSQuestion, 
  POSGameData,
  POSAnswerVerification,
  SentenceWord,
  SentenceVerificationResult
} from '@/types/game';
import { API_ENDPOINTS } from '@/lib/config';
import { apiGet, apiPost } from '@/utils/api';

// Re-export types for backward compatibility
export type { 
  POSToken,
  POSGameData as GameData,
  POSAnswerVerification as AnswerVerification,
  SentenceWord,
  SentenceVerificationResult
};

// Helper function to get the NLP API URL
function getNlpApiUrl(): string {
  return API_ENDPOINTS.API_BASE_URL;
}

/**
 * Fetches game data from the NLP service
 * @param customSentence Optional custom sentence to use
 * @returns Promise with game data
 */
export async function fetchNlpGameData(
  customSentence?: string
): Promise<POSGameData> {
  try {
    // Create the URL with query parameters
    let urlParams = new URLSearchParams();
    
    if (customSentence) {
      urlParams.append('sentence', customSentence);
    }
    
    const url = `/api/game-data${customSentence ? `?${urlParams.toString()}` : ''}`;
    console.log(`Fetching NLP game data from: ${url}`);
    
    // Use our centralized API service
    return await apiGet<POSGameData>(url);
  } catch (error) {
    console.error("Error fetching game data:", error);
    // Re-throw to allow caller to handle
    throw error;
  }
}

/**
 * Submit a custom sentence to create a game
 * @param sentence The custom Tagalog sentence to use
 * @returns Promise with game data
 */
export async function createCustomGame(sentence: string): Promise<POSGameData> {
  try {
    const url = `/api/custom-game`;
    console.log(`Creating custom game with sentence: "${sentence}"`);
    
    // Use our centralized API service
    return await apiPost<POSGameData, { sentence: string }>(url, { sentence });
  } catch (error) {
    console.error("Error creating custom game:", error);
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
  tokens: POSToken[];
  method: string;
}> {
  try {
    const url = '/api/analyze';
    console.log(`Analyzing sentence via Next.js API route: "${sentence}"`);
    
    // Use our centralized API service
    return await apiPost<{
      sentence: string;
      tokens: POSToken[];
      method: string;
    }, { sentence: string }>(url, { sentence });
  } catch (error) {
    console.error("Error analyzing sentence:", error);
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
): Promise<POSAnswerVerification> {
  try {
    // Use the Next.js API route for proxying the request
    const url = '/api/verify';
    
    // Use our centralized API service
    return await apiPost<POSAnswerVerification, {
      word: string;
      sentence: string;
      selected: string;
    }>(url, {
      word,
      sentence,
      selected: selectedAnswer
    });
  } catch (error) {
    console.error("Error verifying answer:", error);
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
    const url = `${getNlpApiUrl()}/health`;
    
    // Use our centralized API service
    return await apiGet<{
      status: string;
      model: string;
      model_status: string;
      pos_tags_available: string[];
    }>(url);
  } catch (error) {
    console.error("Error checking NLP health:", error);
    return {
      status: 'error',
      model: 'unknown',
      model_status: 'offline',
      pos_tags_available: []
    };
  }
}

/**
 * Fetches words for the Make a Sentence game
 * @returns Promise with an array of words with descriptions
 */
export async function fetchSentenceWords(): Promise<SentenceWord[]> {
  try {
    const url = `/api/challenges/make-sentence/words`;
    console.log(`Fetching sentence words from: ${url}`);
    
    // Use our centralized API service
    const response = await apiGet<{words: SentenceWord[];}>(url);
    return response.words;
  } catch (error) {
    console.error("Error fetching sentence words:", error);
    // Re-throw to allow caller to handle with fallback
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
    const url = '/api/challenges/make-sentence/verify';
    console.log(`Verifying sentence for word "${word}": "${sentence}"`);
    
    // Use our centralized API service
    return await apiPost<SentenceVerificationResult, {
      word: string;
      sentence: string;
    }>(url, { word, sentence });
  } catch (error) {
    console.error("Error verifying sentence:", error);
    
    // Return error result
    return {
      isCorrect: false,
      feedback: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      word,
      sentence,
      error: String(error)
    };
  }
}
