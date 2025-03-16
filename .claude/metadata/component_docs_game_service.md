# Game Service Component Documentation

## Purpose
The Game Service component manages the game logic for language learning challenges, bridging the UI layer with the NLP backend services. It handles challenge generation, answer validation, score tracking, and game state management.

## Schema
```typescript
// Core data structures
interface Challenge {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  type: 'parts-of-speech' | 'vocabulary' | 'grammar';
}

interface AnswerResult {
  isCorrect: boolean;
  correctAnswer: string;
  explanation?: string;
  points: number;
}

interface AnswerRecord {
  challengeId: string;
  userAnswer: string;
  isCorrect: boolean;
  timestamp: number;
}

interface GameState {
  score: number;
  currentChallenge: Challenge | null;
  history: AnswerRecord[];
  isLoading: boolean;
}

// Game service function signatures
async function generateChallenge(difficulty?: 'easy' | 'medium' | 'hard'): Promise<Challenge>;
async function checkAnswer(userAnswer: string, challengeId: string): Promise<AnswerResult>;
function resetGame(): void;
function getGameHistory(): AnswerRecord[];
```

## Patterns
### Challenge Generation Pattern
1. Request challenge parameters based on difficulty level
2. Call NLP service to generate challenge content
3. Transform NLP response into Challenge format
4. Update game state with new challenge
5. Return Challenge object to component

### Answer Validation Pattern
1. Retrieve current challenge from game state
2. Call NLP service to verify answer
3. Calculate points based on correctness and difficulty
4. Update game score in state
5. Add result to history
6. Return AnswerResult with feedback

### Error Handling Pattern
- Implement retry logic for transient NLP service errors
- Provide graceful degradation with simpler challenges when NLP is unavailable
- Preserve game state during errors to prevent loss of progress
- Clear error messages with next steps for players

## Interfaces
### Public Interfaces
```typescript
// Functions exposed to components
export { 
  generateChallenge,
  checkAnswer,
  resetGame,
  getGameHistory
};

// Types exposed to components
export type {
  Challenge,
  AnswerResult,
  AnswerRecord
};
```

### Internal Interfaces
```typescript
// NLP Service Integration
interface NLPRequest {
  text: string;
  options?: {
    difficulty?: string;
    maxOptions?: number;
    includeExplanation?: boolean;
  };
}

interface NLPResponse {
  analysis: {
    partsOfSpeech: Record<string, string>;
    options: string[];
    correctOption: string;
  };
  rawText: string;
}
```

## Invariants
1. Game score must never be negative
2. Challenge IDs must be unique across the game session
3. Game history records must be immutable once created
4. Challenge difficulty must always be one of the predefined levels
5. Answer validation must always return a result, even in error cases
6. NLP service errors must not corrupt game state

## Error States
### Error: NLP Service Unavailable
- **Cause**: Python backend not running or network issues
- **Detection**: Timeout or connection refused errors
- **Handling**: 
  - Fall back to pre-generated challenges
  - Display status indicator showing offline mode
  - Provide instructions for restarting NLP service

### Error: Invalid Challenge Format
- **Cause**: NLP service returned unexpected data structure
- **Detection**: Type validation failures in response processing
- **Handling**:
  - Log detailed error for debugging
  - Retry with different parameters
  - Fall back to simpler challenge type

### Error: Answer Verification Failed
- **Cause**: NLP model failed to assess answer correctly
- **Detection**: Verification endpoint returns error
- **Handling**:
  - Fall back to exact string matching
  - Flag challenge for review
  - Provide benefit of doubt to player