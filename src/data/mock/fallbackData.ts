/**
 * Fallback data for when the NLP service is unavailable
 * This provides minimal game functionality during development or when backend is down
 */

import { POSGameData, POSQuestion, SentenceWord } from '@/types/game/index';

/**
 * Creates a POS question with appropriate options
 */
function createQuestion(id: number, word: string, sentence: string, correctType: string, explanation: string): POSQuestion {
  // Standard POS options
  const allOptions = [
    'Pangngalan (Noun)', 
    'Pandiwa (Verb)', 
    'Pang-uri (Adjective)', 
    'Pang-abay (Adverb)', 
    'Panghalip (Pronoun)', 
    'Pangatnig (Conjunction)', 
    'Pang-ukol (Preposition)', 
    'Pantukoy (Article)', 
    'Pandamdam (Interjection)'
  ];
  
  // Ensure correctType is in options
  if (!allOptions.includes(correctType)) {
    console.warn(`Warning: correctType "${correctType}" not in standard options`);
  }
  
  // Get 3 random incorrect options
  const incorrectOptions = allOptions
    .filter(option => option !== correctType)
    .slice(0, 3);
  
  // Combine correct and incorrect options and shuffle
  const options = [...incorrectOptions, correctType]
    .sort(() => Math.random() - 0.5);
  
  return {
    id,
    question: `Ano ang bahagi ng pananalita ng salitang "${word}" sa pangungusap na ito?`,
    options,
    correctAnswer: correctType,
    explanation
  };
}

/**
 * Fallback game data when the NLP service is unavailable
 */
export const FALLBACK_GAME_DATA: POSGameData = {
  sentence: "Binili niya ang bagong kotse mula sa tindahan kahapon.",
  questions: [
    {
      id: 1,
      question: "Ano ang bahagi ng pananalita ng salitang \"Binili\" sa pangungusap na ito?",
      options: ["Pandiwa (Verb)", "Pangngalan (Noun)", "Pang-uri (Adjective)", "Pang-abay (Adverb)"],
      correctAnswer: "Pandiwa (Verb)",
      explanation: "\"Binili\" ay isang pandiwa (verb) dahil ito ay nagsasaad ng aksyon."
    },
    {
      id: 2,
      question: "Ano ang bahagi ng pananalita ng salitang \"kotse\" sa pangungusap na ito?",
      options: ["Pangngalan (Noun)", "Pandiwa (Verb)", "Pang-uri (Adjective)", "Pang-abay (Adverb)"],
      correctAnswer: "Pangngalan (Noun)",
      explanation: "\"Kotse\" ay isang pangngalan (noun) dahil ito ay tumutukoy sa isang bagay."
    },
    {
      id: 3,
      question: "Ano ang bahagi ng pananalita ng salitang \"bagong\" sa pangungusap na ito?",
      options: ["Pang-uri (Adjective)", "Pangngalan (Noun)", "Pandiwa (Verb)", "Pang-abay (Adverb)"],
      correctAnswer: "Pang-uri (Adjective)",
      explanation: "\"Bagong\" ay isang pang-uri (adjective) dahil ito ay naglalarawan ng katangian ng kotse."
    }
  ],
  source: "fallback",
  timestamp: Date.now()
};

/**
 * Fallback words for Make a Sentence game when the API is unavailable
 */
export const FALLBACK_SENTENCE_WORDS: SentenceWord[] = [
  { 
    word: "kumain", 
    description: "To eat (Kumain ako ng almusal.) - I ate breakfast."
  },
  { 
    word: "matulog", 
    description: "To sleep (Matulog ka na.) - Go to sleep."
  },
  { 
    word: "magluto", 
    description: "To cook (Magluto tayo ng hapunan.) - Let's cook dinner."
  },
  { 
    word: "magsalita", 
    description: "To speak (Magsalita ka nang malakas.) - Speak loudly."
  },
  { 
    word: "magbasa", 
    description: "To read (Magbasa tayo ng libro.) - Let's read a book."
  },
  { 
    word: "maglaro", 
    description: "To play (Maglaro tayo sa labas.) - Let's play outside."
  },
  { 
    word: "tumawa", 
    description: "To laugh (Tumawa ang mga bata.) - The children laughed."
  },
  { 
    word: "umiyak", 
    description: "To cry (Umiyak ang sanggol.) - The baby cried."
  },
  { 
    word: "maglakad", 
    description: "To walk (Maglakad tayo sa parke.) - Let's walk in the park."
  },
  { 
    word: "sumayaw", 
    description: "To dance (Sumayaw siya sa entablado.) - She danced on stage."
  },
  { 
    word: "magmahal", 
    description: "To love (Magmahal ka ng tunay.) - Love truly."
  },
  { 
    word: "magbigay", 
    description: "To give (Magbigay ng regalo.) - Give a gift."
  }
];

/**
 * Simple fallback for NLP tagging when the backend is unavailable
 */
export function simpleFallbackTagging(sentence: string) {
  const words = sentence.split(/\s+/);
  
  const commonNouns = ['bahay', 'kotse', 'libro', 'mesa', 'upuan', 'paaralan', 'gusali', 'kompyuter'];
  const commonVerbs = ['kumain', 'uminom', 'tumakbo', 'lumakad', 'matulog', 'bumili', 'magluto'];
  const commonAdjectives = ['maganda', 'mabait', 'masaya', 'malaki', 'maliit', 'mainit', 'malamig'];
  const commonPronouns = ['ako', 'ikaw', 'siya', 'kami', 'tayo', 'sila', 'niya', 'namin', 'natin', 'nila'];
  
  return {
    sentence,
    tokens: words.map(word => {
      const cleanWord = word.toLowerCase().replace(/[.,!?;:]/g, '');
      
      if (commonNouns.includes(cleanWord)) {
        return {
          text: word,
          pos: 'Pangngalan (Noun)',
          description: 'Tumutukoy sa tao, hayop, bagay, lugar, o konsepto'
        };
      } else if (commonVerbs.includes(cleanWord)) {
        return {
          text: word,
          pos: 'Pandiwa (Verb)',
          description: 'Nagsasaad ng kilos o aksyon'
        };
      } else if (commonAdjectives.includes(cleanWord)) {
        return {
          text: word,
          pos: 'Pang-uri (Adjective)',
          description: 'Naglalarawan ng katangian'
        };
      } else if (commonPronouns.includes(cleanWord)) {
        return {
          text: word,
          pos: 'Panghalip (Pronoun)',
          description: 'Kahalili ng pangngalan'
        };
      } else {
        // Default to noun for unknown words
        return {
          text: word,
          pos: 'Hindi matukoy (Unknown)',
          description: 'Hindi kilalang bahagi ng pananalita'
        };
      }
    }),
    method: 'fallback'
  };
}
