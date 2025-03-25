// src/services/game/index.ts
import { 
  POSToken, 
  POSQuestion, 
  POSGameData,
  SentenceWord,
  SentenceVerificationResult, 
  SentenceAttempt,
  MakeSentenceGameData
} from '@/types/game';
import * as nlpService from '@/services/nlp';

// Helper function to shuffle an array - with safety checks
function shuffleArray<T>(array: T[] | null | undefined): T[] {
  // If array is null, undefined, or not an array, return an empty array
  if (!array || !Array.isArray(array)) {
    console.warn('Attempted to shuffle a non-array value:', array);
    return [];
  }
  
  // Create a copy of the array to shuffle
  const newArray = array.slice();
  
  // Perform Fisher-Yates shuffle
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  
  return newArray;
}

/**
 * Fetches game data from the CalamanCy NLP service via our API proxy
 * @param useFallback Whether to use fallback data if API fails
 * @returns Promise with game data (sentence and questions)
 */
export async function fetchGameData(
  useFallback: boolean = true
): Promise<POSGameData> {
  try {
    console.log(`Fetching game data from NLP service`);
    
    // Fetch data from the NLP service
    return await nlpService.fetchNlpGameData();
  } catch (error) {
    console.error('Error fetching game data:', error);
    
    if (!useFallback) {
      throw error;
    }
    
    // Import fallback data as needed
    console.warn(`Using fallback game data`);
    const { FALLBACK_GAME_DATA } = await import('@/data/mock/fallbackData');
    return FALLBACK_GAME_DATA;
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
  return nlpService.analyzeSentence(sentence);
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
    console.log(`Fetching Make a Sentence game with ${count} words`);
    
    // Fetch words list from API or use fallback
    let words;
    try {
      words = await nlpService.fetchSentenceWords();
    } catch (error) {
      console.warn('Error fetching sentence words from API, using fallback data');
      const { FALLBACK_SENTENCE_WORDS } = await import('@/data/mock/fallbackData');
      words = FALLBACK_SENTENCE_WORDS;
    }
    
    // Safely shuffle the words (our updated function handles null/undefined safely)
    const shuffled = shuffleArray(words);
    const selectedWords = shuffled.slice(0, Math.min(count, shuffled.length));
    
    // Create initial game data
    return {
      words: selectedWords,
      currentIndex: 0,
      score: 0,
      history: [],
      totalQuestions: selectedWords.length
    };
  } catch (error) {
    console.error('Error creating Make a Sentence game:', error);
    
    // Last resort fallback - always return something playable
    console.warn('Using emergency fallback for Make a Sentence game');
    const { FALLBACK_SENTENCE_WORDS } = await import('@/data/mock/fallbackData');
    const selectedWords = FALLBACK_SENTENCE_WORDS.slice(0, Math.min(count, FALLBACK_SENTENCE_WORDS.length));
    
    return {
      words: selectedWords,
      currentIndex: 0,
      score: 0,
      history: [],
      totalQuestions: selectedWords.length
    };
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
  result: SentenceVerificationResult;
}> {
  try {
    // Verify the sentence with the NLP service
    const result = await nlpService.verifySentence(word, sentence);
    
    // Create a history entry for this attempt
    const attempt: SentenceAttempt = {
      word,
      sentence,
      isCorrect: result.isCorrect,
      feedback: result.feedback,
      timestamp: Date.now()
    };
    
    // Update game data
    const updatedGameData: MakeSentenceGameData = {
      ...gameData,
      score: result.isCorrect ? gameData.score + 1 : gameData.score,
      currentIndex: gameData.currentIndex + 1,
      history: [...gameData.history, attempt]
    };
    
    return {
      gameData: updatedGameData,
      result
    };
  } catch (error) {
    console.error('Error verifying Make a Sentence game:', error);
    
    // Return error result
    const errorResult: SentenceVerificationResult = {
      isCorrect: false,
      feedback: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      word,
      sentence,
      error: String(error)
    };
    
    // Keep game state but add error to history
    const errorAttempt: SentenceAttempt = {
      word,
      sentence,
      isCorrect: false,
      feedback: errorResult.feedback,
      timestamp: Date.now()
    };
    
    const updatedGameData: MakeSentenceGameData = {
      ...gameData,
      currentIndex: gameData.currentIndex + 1,
      history: [...gameData.history, errorAttempt]
    };
    
    return {
      gameData: updatedGameData,
      result: errorResult
    };
  }
}
