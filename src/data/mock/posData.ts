/**
 * Mock data for Parts of Speech (Multiple Choice) game
 * Used as a fallback when the API is unavailable
 */
import { POSGameData } from '@/types/game/index';

const mockPosData: POSGameData = {
  sentence: "Ang mga bata ay masayang naglarô sa parke kahapon.",
  questions: [
    {
      id: 1,
      question: "What part of speech is 'Ang'?",
      options: ["Article", "Pronoun", "Noun", "Adjective"],
      correctAnswer: "Article",
      explanation: "'Ang' is a definite article in Filipino that marks the subject of a sentence."
    },
    {
      id: 2,
      question: "What part of speech is 'bata'?",
      options: ["Verb", "Noun", "Adjective", "Adverb"],
      correctAnswer: "Noun",
      explanation: "'Bata' means 'child' which is a noun - a person, place, or thing."
    },
    {
      id: 3,
      question: "What part of speech is 'masayang'?",
      options: ["Noun", "Verb", "Adjective", "Adverb"],
      correctAnswer: "Adjective", 
      explanation: "'Masayang' (meaning 'happy' or 'joyful') describes how the children played, making it an adjective."
    },
    {
      id: 4,
      question: "What part of speech is 'naglarô'?",
      options: ["Noun", "Verb", "Adjective", "Adverb"],
      correctAnswer: "Verb",
      explanation: "'Naglarô' means 'played' which is a verb - an action word."
    },
    {
      id: 5,
      question: "What part of speech is 'sa'?",
      options: ["Preposition", "Conjunction", "Pronoun", "Interjection"],
      correctAnswer: "Preposition",
      explanation: "'Sa' is a preposition in Filipino, similar to 'in', 'at', or 'on' in English."
    }
  ],
  source: "mock_data",
  timestamp: Date.now()
};

export default mockPosData;
