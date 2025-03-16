// src/services/gameService.ts
import { API_ENDPOINTS, APP_CONFIG } from '@/lib/config';
import * as nlpService from './nlpService';

// Interface for POS test results
export interface POSToken {
  text: string;
  pos: string;
  description: string;
}

// Interface for the question object
export interface POSQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface GameData {
  sentence: string;
  questions: POSQuestion[];
  source?: string;
  difficulty?: string;
  timestamp?: number;
  port?: number;
}

// Helper function to shuffle an array
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Create a question with randomly ordered options
function createQuestion(id: number, word: string, sentence: string, correctType: string, explanation: string): POSQuestion {
  const allOptions = [
    "Panghalip (Pronoun)", 
    "Pandiwa (Verb)", 
    "Pang-Uri (Adjective)", 
    "Pangngalan (Noun)",
    "Pang-Abay (Adverb)",
    "Pang-ukol (Preposition)",
    "Pantukoy (Determiner)",
    "Panghikayat (Particle)"
  ];
  
  // Filter out the correct answer from all options
  const distractors = allOptions.filter(opt => opt !== correctType);
  
  // Select 3 random distractors
  const selectedDistractors = shuffleArray(distractors).slice(0, 3);
  
  // Create shuffled options including the correct answer
  const options = shuffleArray([correctType, ...selectedDistractors]);
  
  return {
    id,
    question: `Anong parte ng pangungusap ang '${word}' sa '${sentence}'?`,
    options,
    correctAnswer: correctType,
    explanation: `Ang '${word}' ay isang ${correctType.toLowerCase()}.`
  };
}

// Fallback game data to use when API is unavailable (for development and testing)
const FALLBACK_GAME_DATA: Record<string, GameData> = {
  easy: {
    sentence: "Ako ay masaya ngayon.",
    questions: [
      createQuestion(1, "Ako", "Ako ay masaya ngayon.", "Panghalip (Pronoun)", "Ang 'Ako' ay isang panghalip (pronoun)."),
      createQuestion(2, "masaya", "Ako ay masaya ngayon.", "Pang-Uri (Adjective)", "Ang 'masaya' ay isang pang-uri (adjective)."),
      createQuestion(3, "ngayon", "Ako ay masaya ngayon.", "Pang-Abay (Adverb)", "Ang 'ngayon' ay isang pang-abay (adverb).")
    ]
  },
  medium: {
    sentence: "Binili niya ang bagong kotse mula sa tindahan kahapon.",
    questions: [
      createQuestion(1, "Binili", "Binili niya ang bagong kotse mula sa tindahan kahapon.", "Pandiwa (Verb)", "Ang 'Binili' ay isang pandiwa (verb)."),
      createQuestion(2, "niya", "Binili niya ang bagong kotse mula sa tindahan kahapon.", "Panghalip (Pronoun)", "Ang 'niya' ay isang panghalip (pronoun)."),
      createQuestion(3, "kotse", "Binili niya ang bagong kotse mula sa tindahan kahapon.", "Pangngalan (Noun)", "Ang 'kotse' ay isang pangngalan (noun)."),
      createQuestion(4, "kahapon", "Binili niya ang bagong kotse mula sa tindahan kahapon.", "Pang-Abay (Adverb)", "Ang 'kahapon' ay isang pang-abay (adverb)."),
      createQuestion(5, "bagong", "Binili niya ang bagong kotse mula sa tindahan kahapon.", "Pang-Uri (Adjective)", "Ang 'bagong' ay isang pang-uri (adjective).")
    ]
  },
  hard: {
    sentence: "Maraming turista ang bumabalik taun-taon sa magandang isla dahil sa mababait na mga tao at masasarap na pagkain.",
    questions: [
      createQuestion(1, "Maraming", "Maraming turista ang bumabalik taun-taon sa magandang isla dahil sa mababait na mga tao at masasarap na pagkain.", "Pang-Uri (Adjective)", "Ang 'Maraming' ay isang pang-uri (adjective)."),
      createQuestion(2, "bumabalik", "Maraming turista ang bumabalik taun-taon sa magandang isla dahil sa mababait na mga tao at masasarap na pagkain.", "Pandiwa (Verb)", "Ang 'bumabalik' ay isang pandiwa (verb)."),
      createQuestion(3, "taun-taon", "Maraming turista ang bumabalik taun-taon sa magandang isla dahil sa mababait na mga tao at masasarap na pagkain.", "Pang-Abay (Adverb)", "Ang 'taun-taon' ay isang pang-abay (adverb)."),
      createQuestion(4, "isla", "Maraming turista ang bumabalik taun-taon sa magandang isla dahil sa mababait na mga tao at masasarap na pagkain.", "Pangngalan (Noun)", "Ang 'isla' ay isang pangngalan (noun)."),
      createQuestion(5, "dahil", "Maraming turista ang bumabalik taun-taon sa magandang isla dahil sa mababait na mga tao at masasarap na pagkain.", "Pang-ukol (Preposition)", "Ang 'dahil' ay isang pang-ukol (preposition).")
    ]
  }
};

/**
 * Fetches game data from the CalamanCy NLP service via our API proxy
 * @param difficulty The difficulty level of questions to fetch
 * @param useFallback Whether to use fallback data if API fails
 * @returns Promise with game data (sentence and questions)
 */
export async function fetchGameData(
  difficulty: 'easy' | 'medium' | 'hard' = 'medium', 
  useFallback: boolean = true
): Promise<GameData> {
  try {
    // Set a timeout for the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout for NLP model loading
    
    console.log(`Fetching game data from ${API_ENDPOINTS.POS_GAME_PROXY} with difficulty ${difficulty}`);
    
    // Always use our internal API route, which proxies to the Flask backend
    const response = await fetch(`${API_ENDPOINTS.POS_GAME_PROXY}?difficulty=${difficulty}`, {
      signal: controller.signal
    });
    
    // Clear the timeout
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch questions (Status: ${response.status})`);
    }
    
    const data = await response.json();
    
    // Validate that we got proper data back
    if (!data || !data.sentence || !data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
      throw new Error('Invalid data structure received from API');
    }

    // Log the data we received from the API for debugging
    console.log('Received game data from API:', data);
    
    return data;
  } catch (error) {
    console.error('Error fetching game data:', error);
    
    // Use fallback data if API request fails and fallback is enabled
    if (useFallback && FALLBACK_GAME_DATA[difficulty]) {
      console.log(`Using fallback data for ${difficulty} difficulty level`);
      return FALLBACK_GAME_DATA[difficulty];
    }
    
    throw new Error('Nagkaroon ng problema sa pagkuha ng mga tanong. Pakisubukang muli.');
  }
}

/**
 * Test the POS tagging on a custom sentence
 * @param sentence The Tagalog sentence to analyze
 * @returns Promise with the POS tagging results
 */
export async function testPOSTagging(sentence: string): Promise<{
  sentence: string;
  tokens: POSToken[];
  method: string;
}> {
  try {
    // Set a shorter timeout for the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
    // Check if API_ENDPOINTS.NLP_TEST_PROXY is defined
    if (!API_ENDPOINTS.NLP_TEST_PROXY) {
      console.error('NLP_TEST_PROXY endpoint is not defined in API_ENDPOINTS');
      throw new Error('API endpoint configuration error');
    }
    
    console.log(`Making request to NLP test proxy endpoint at ${API_ENDPOINTS.NLP_TEST_PROXY}`);
    
    // Use our internal Next.js API route which has built-in fallback functionality
    const response = await fetch(API_ENDPOINTS.NLP_TEST_PROXY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ sentence }),
      signal: controller.signal
    });
    
    // Clear the timeout
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
    
    try {
      const data = await response.json();
      
      // Log the results for debugging
      console.log('POS tagging results:', data);
      console.log('Method used:', data.method || 'unknown'); // Display which method was used
      
      // Validate the data structure
      if (!data || !data.sentence || !data.tokens || !Array.isArray(data.tokens)) {
        throw new Error('Invalid data structure received from API');
      }
      
      return data;
    } catch (jsonError) {
      console.error('Error parsing JSON response:', jsonError);
      throw new Error('Invalid response format from server. Could not parse JSON.');
    }
  } catch (error) {
    console.error('Error testing POS tagging:', error);
    throw new Error(`Error analyzing sentence: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Interface for Make a Sentence game data
 */
export interface MakeSentenceGameData {
  words: nlpService.SentenceWord[];
  currentIndex: number;
  score: number;
  history: MakeSentenceAttempt[];
  totalQuestions: number;
}

/**
 * Interface for sentence attempt history
 */
export interface MakeSentenceAttempt {
  word: string;
  sentence: string;
  isCorrect: boolean;
  feedback: string;
  timestamp: number;
}

/**
 * Fetch words for Make a Sentence game
 * @param count Number of words to include in the game
 * @returns Promise with game data
 */
export async function fetchMakeSentenceGame(
  count: number = 10
): Promise<MakeSentenceGameData> {
  try {
    // Fetch words from the NLP service
    const words = await nlpService.fetchSentenceWords();
    
    // Shuffle to ensure randomness
    const shuffledWords = [...words].sort(() => Math.random() - 0.5);
    
    // Take exactly the number of words requested, ensuring we don't exceed available words
    const selectedWords = shuffledWords.slice(0, Math.min(count, shuffledWords.length));
    
    // Create initial game data
    return {
      words: selectedWords,
      currentIndex: 0,
      score: 0,
      history: [],
      totalQuestions: selectedWords.length
    };
  } catch (error) {
    console.error('Error fetching Make a Sentence game data:', error);
    throw new Error('Failed to load Make a Sentence game. Please try again.');
  }
}

/**
 * Verify a sentence in the Make a Sentence game
 * @param word The target word to use in the sentence
 * @param sentence The sentence created by the user
 * @param gameData Current game data
 * @returns Promise with updated game data and verification result
 */
export async function verifyMakeSentence(
  word: string,
  sentence: string,
  gameData: MakeSentenceGameData
): Promise<{
  gameData: MakeSentenceGameData;
  result: nlpService.SentenceVerificationResult;
}> {
  try {
    // Verify the sentence using the NLP service
    const result = await nlpService.verifySentence(word, sentence);
    
    // Create a new attempt record
    const attempt: MakeSentenceAttempt = {
      word,
      sentence,
      isCorrect: result.isCorrect,
      feedback: result.feedback,
      timestamp: Date.now()
    };
    
    // Update game data
    const updatedGameData: MakeSentenceGameData = {
      ...gameData,
      score: gameData.score + (result.isCorrect ? 10 : 0),
      history: [...gameData.history, attempt],
      currentIndex: gameData.currentIndex + 1
    };
    
    return {
      gameData: updatedGameData,
      result
    };
  } catch (error) {
    console.error('Error verifying Make a Sentence attempt:', error);
    throw new Error('Failed to verify your sentence. Please try again.');
  }
}