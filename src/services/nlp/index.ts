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
} from '@/types/game/index';
import { API_ENDPOINTS } from '@/lib/config';
import { apiGet, apiPost } from '@/utils/api';
import mockPosData from '../../data/mock/posData';

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
  customSentence?: string,
  difficulty?: string
): Promise<POSGameData> {
  try {
    // Create the URL with query parameters
    let urlParams = new URLSearchParams();
    
    if (customSentence) {
      urlParams.append('sentence', customSentence);
    }
    
    if (difficulty) {
      urlParams.append('difficulty', difficulty);
    }
    
    // Try using the Next.js API proxy endpoint first
    const proxyUrl = `${API_ENDPOINTS.POS_GAME_PROXY}${urlParams.toString() ? `?${urlParams.toString()}` : ''}`;
    
    try {
      console.log(`Attempting to fetch game data via Next.js proxy: ${proxyUrl}`);
      return await apiGet<POSGameData>(proxyUrl);
    } catch (proxyError) {
      console.warn("Next.js proxy route failed, trying direct API:", proxyError);
      
      // Fall back to direct API connection
      const directUrl = `${API_ENDPOINTS.CALAMANCY_API}${urlParams.toString() ? `?${urlParams.toString()}` : ''}`;
      console.log(`Fetching NLP game data directly from: ${directUrl}`);
      
      try {
        return await apiGet<POSGameData>(directUrl);
      } catch (directError) {
        console.warn("Direct API connection failed:", directError);
        throw directError; // Re-throw to trigger mock data fallback
      }
    }
  } catch (error) {
    console.error("Error fetching game data from both sources, using mock data:", error);
    
    // Final fallback to mock data
    console.log("Using mock POS game data as ultimate fallback");
    return mockPosData;
  }
}

/**
 * Submit a custom sentence to create a game
 * @param sentence The custom Tagalog sentence to use
 * @returns Promise with game data
 */
export async function createCustomGame(sentence: string): Promise<POSGameData> {
  try {
    // Try proxy endpoint first
    const proxyUrl = `${API_ENDPOINTS.POS_GAME_PROXY}`;
    console.log(`Creating custom game with sentence: "${sentence}" via proxy`);
    
    try {
      // Use our centralized API service
      return await apiPost<POSGameData, { sentence: string }>(proxyUrl, { sentence });
    } catch (proxyError) {
      console.warn("Next.js proxy route failed for custom game, trying direct API:", proxyError);
      
      // Fall back to direct API connection
      const directUrl = `${API_ENDPOINTS.CALAMANCY_API}`;
      return await apiPost<POSGameData, { sentence: string }>(directUrl, { sentence });
    }
  } catch (error) {
    console.error("Error creating custom game from both sources:", error);
    
    // Fallback to basic mock data with the custom sentence
    const mockData = {...mockPosData};
    mockData.sentence = sentence;
    return mockData;
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
    // Try proxy endpoint first
    const proxyUrl = API_ENDPOINTS.NLP_TEST_PROXY;
    console.log(`Analyzing sentence via Next.js API route: "${sentence}"`);
    
    try {
      return await apiPost<{
        sentence: string;
        tokens: POSToken[];
        method: string;
      }, { sentence: string }>(proxyUrl, { sentence });
    } catch (proxyError) {
      console.warn("Next.js proxy route failed for sentence analysis, trying direct API:", proxyError);
      
      // Fall back to direct API connection
      const directUrl = API_ENDPOINTS.ANALYZE_ENDPOINT;
      return await apiPost<{
        sentence: string;
        tokens: POSToken[];
        method: string;
      }, { sentence: string }>(directUrl, { sentence });
    }
  } catch (error) {
    console.error("Error analyzing sentence from both sources:", error);
    
    // Basic fallback response
    return {
      sentence,
      tokens: sentence.split(' ').map(word => ({
        text: word,
        pos: 'UNK', // Unknown part of speech
        description: 'Unknown word type'
      })),
      method: 'fallback'
    };
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
    // Try to check health via our centralized API utilities
    const healthEndpoint = API_ENDPOINTS.HEALTH_ENDPOINT;
    console.log(`Checking NLP API health at: ${healthEndpoint}`);
    
    try {
      // Use our centralized apiGet function instead of direct fetch
      return await apiGet(healthEndpoint);
    } catch (error) {
      console.warn('Failed to check health with apiGet, trying direct fetch as fallback');
      
      // Fallback to simple fetch with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout
      
      try {
        const response = await fetch(healthEndpoint, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Health endpoint returned ${response.status}`);
        }
        
        return await response.json();
      } catch (fetchError) {
        console.error('Direct fetch for health check failed:', fetchError);
        throw fetchError;
      } finally {
        clearTimeout(timeoutId);
      }
    }
  } catch (error) {
    console.error("Error checking NLP health:", error);
    
    // Fallback response
    return {
      status: 'offline',
      model: 'unavailable',
      model_status: 'offline',
      pos_tags_available: []
    };
  }
}

/**
 * Fetches words for the Make a Sentence game
 * @returns Promise with an array of words with descriptions
 */
export async function fetchSentenceWords(grade?: 'G1_2' | 'G3_4' | 'G5_6'): Promise<SentenceWord[]> {
  try {
    // Try proxy endpoint first
    const proxyUrl = grade
      ? `${API_ENDPOINTS.MAKE_SENTENCE_WORDS_PROXY}?grade=${grade}`
      : API_ENDPOINTS.MAKE_SENTENCE_WORDS_PROXY;
    console.log(`Fetching sentence words via Next.js API route`);
    
    try {
      return await apiGet<SentenceWord[]>(proxyUrl);
    } catch (proxyError) {
      console.warn("Next.js proxy route failed for sentence words, trying direct API:", proxyError);
      
      // Fall back to direct API connection
      const directUrl = grade
        ? `${API_ENDPOINTS.MAKE_SENTENCE_WORDS_ENDPOINT}?grade=${grade}`
        : API_ENDPOINTS.MAKE_SENTENCE_WORDS_ENDPOINT;
      return await apiGet<SentenceWord[]>(directUrl);
    }
  } catch (error) {
    console.error("Error fetching sentence words from both sources:", error);
    
    // Fallback words
    return [
      { word: 'ako', description: 'I or me (pronoun)' },
      { word: 'kumain', description: 'to eat (verb)' },
      { word: 'ng', description: 'of (particle)' },
      { word: 'kanin', description: 'rice (noun)' }
    ];
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
    const data = { word, sentence };
    
    // Try proxy endpoint first
    const proxyUrl = API_ENDPOINTS.MAKE_SENTENCE_VERIFY_PROXY;
    console.log(`Verifying sentence via Next.js API route`);
    
    try {
      return await apiPost<SentenceVerificationResult, typeof data>(proxyUrl, data);
    } catch (proxyError) {
      console.warn("Next.js proxy route failed for sentence verification, trying direct API:", proxyError);
      
      // Fall back to direct API connection
      const directUrl = API_ENDPOINTS.MAKE_SENTENCE_VERIFY_ENDPOINT;
      return await apiPost<SentenceVerificationResult, typeof data>(directUrl, data);
    }
  } catch (error) {
    console.error("Error verifying sentence from both sources:", error);
    
    // Simple fallback validation (just checks if word is in sentence)
    const isCorrect = sentence.toLowerCase().includes(word.toLowerCase());
    
    return {
      isCorrect,
      feedback: isCorrect 
        ? 'Sentence accepted (fallback validation)' 
        : `Your sentence must include the word "${word}"`,
      word,
      sentence
    };
  }
}
