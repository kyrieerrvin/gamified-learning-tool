/**
 * Game service functions
 * Handles API calls for all game-related functionality
 */

import { apiGet, apiPost } from '@/utils/api';
import { MakeSentenceGameData, SentenceVerificationResult, SentenceAttempt } from '@/types/game';
import { useGameProgress } from '@/hooks/useGameProgress';
import * as nlpService from '@/services/nlp';
import { API_ENDPOINTS } from '@/lib/config';
import { POSGameData } from '@/types/game/index';

/**
 * Fetch data for Make a Sentence game
 * @param count Number of questions to fetch
 * @returns Game data with words
 */
export async function fetchMakeSentenceGame(count: number = 10, gradeLevel?: 'G1_2' | 'G3_4' | 'G5_6'): Promise<MakeSentenceGameData> {
  try {
    // Call the API to get words, forwarding the grade level
    const endpoint = gradeLevel
      ? `/api/challenges/make-sentence/words?grade=${gradeLevel}`
      : '/api/challenges/make-sentence/words';
    const response = await apiGet<{words: Array<{word: string, description: string}>}>(endpoint);
    const sourceWords = response.words;
    
    // Take only the requested number of words
    const words = sourceWords.slice(0, count);
    
    // Initialize game data
    return {
      words,
      currentIndex: 0,
      totalQuestions: words.length,
      score: 0,
      history: [],
      startTime: Date.now(),
      endTime: null as number | null
    };
  } catch (error) {
    console.error('Error fetching Make a Sentence game data:', error);
    // Provide simple fallback data
    return {
      words: [
        { word: "Tahanan", description: "Bahay o tirahan" },
        { word: "Paaralan", description: "Lugar kung saan nag-aaral" },
        { word: "Kaibigan", description: "Taong malapit sa'yo" }
      ],
      currentIndex: 0,
      totalQuestions: 3,
      score: 0,
      history: [],
      startTime: Date.now(),
      endTime: null as number | null
    };
  }
}

/**
 * Verify a sentence for the Make a Sentence game
 * @param targetWord The target word to use in the sentence
 * @param sentence The user's sentence
 * @param gameData Current game data
 * @returns Updated game data and verification result
 */
export async function verifyMakeSentence(
  targetWord: string,
  sentence: string,
  gameData: MakeSentenceGameData
): Promise<{ gameData: MakeSentenceGameData, result: SentenceVerificationResult }> {
  try {
    // Call the verification API
    const result = await apiPost<SentenceVerificationResult, {word: string, sentence: string}>(
      '/api/challenges/make-sentence/verify',
      {
        word: targetWord,
        sentence
      }
    );
    
    // Calculate new score
    const scoreForQuestion = result.isCorrect ? 10 : 0;
    
    // Create a history entry
    const historyEntry: SentenceAttempt = {
      word: targetWord,
      userSentence: sentence,
      isCorrect: result.isCorrect,
      feedback: result.feedback || '',
      timestamp: new Date().toISOString()
    };
    
    // Create updated game data
    const updatedGameData: MakeSentenceGameData = {
      ...gameData,
      currentIndex: gameData.currentIndex + 1, // Move to next word
      score: gameData.score + scoreForQuestion,
      history: [...gameData.history, historyEntry],
      endTime: gameData.currentIndex + 1 >= gameData.totalQuestions ? Date.now() : null as number | null
    };
    
    return { gameData: updatedGameData, result };
  } catch (error) {
    console.error('Error verifying sentence:', error);
    
    // Provide fallback result with a simple validation
    const sentence_lower = sentence.toLowerCase();
    const word_lower = targetWord.toLowerCase();
    
    const isCorrect = sentence_lower.includes(word_lower) && sentence_lower.split(/\s+/).length >= 3;
    
    const result: SentenceVerificationResult = {
      isCorrect,
      containsWord: sentence_lower.includes(word_lower),
      feedback: isCorrect 
        ? "Magaling! Nakagawa ka ng tamang pangungusap." 
        : `Hindi tama. Siguraduhing ginagamit mo ang salitang "${targetWord}" sa iyong pangungusap.`
    };
    
    // Create a history entry
    const historyEntry: SentenceAttempt = {
      word: targetWord,
      userSentence: sentence,
      isCorrect,
      feedback: result.feedback,
      timestamp: new Date().toISOString()
    };
    
    // Create updated game data
    const updatedGameData: MakeSentenceGameData = {
      ...gameData,
      currentIndex: gameData.currentIndex + 1, // Move to next word
      score: gameData.score + (isCorrect ? 10 : 0),
      history: [...gameData.history, historyEntry],
      endTime: gameData.currentIndex + 1 >= gameData.totalQuestions ? Date.now() : null as number | null
    };
    
    return { gameData: updatedGameData, result };
  }
}

/**
 * Skip a question in the Make a Sentence game
 * @param gameData Current game data
 * @returns Updated game data
 */
export function skipMakeSentenceQuestion(gameData: MakeSentenceGameData): MakeSentenceGameData {
  const currentWord = gameData.words[gameData.currentIndex];
  
  // Create a history entry for skipped question
  const historyEntry: SentenceAttempt = {
    word: currentWord.word,
    userSentence: "[Skipped]",
    isCorrect: false,
    feedback: "Nilaktawan ang tanong.",
    timestamp: new Date().toISOString()
  };
  
  // Create updated game data
  return {
    ...gameData,
    currentIndex: gameData.currentIndex + 1,
    history: [...gameData.history, historyEntry],
    endTime: gameData.currentIndex + 1 >= gameData.totalQuestions ? Date.now() : null as number | null
  };
}

/**
 * Fetch data for Parts of Speech (Multiple Choice) game
 * @param difficulty The difficulty level ('easy', 'medium', 'hard')
 * @returns Game data for multiple choice POS game
 */
export async function fetchPartsOfSpeechGame(_difficulty?: string, grade?: 'G1_2' | 'G3_4' | 'G5_6'): Promise<POSGameData> {
  try {
    // Call the API to get POS game data; grade takes precedence
    const url = grade ? `/api/challenges/pos-game?grade=${grade}` : `/api/challenges/pos-game?difficulty=medium`;
    const response = await apiGet<POSGameData>(url);
    console.log('Successfully fetched POS game data from API');
    return response;
  } catch (error) {
    console.error('Error fetching Parts of Speech game data:', error);
    throw error; // Re-throw to let the component handle the error
  }
}

/**
 * Test the POS tagging on a custom sentence
 * @param sentence The Tagalog sentence to analyze
 * @returns Promise with the POS tagging results
 */
export async function testPOSTagging(sentence: string) {
  try {
    return await nlpService.analyzeSentence(sentence);
  } catch (error) {
    console.error('Error testing POS tagging:', error);
    throw error;
  }
}
