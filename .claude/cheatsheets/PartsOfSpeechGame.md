# PartsOfSpeechGame Component Cheatsheet

## Component Location
`src/components/challenges/multiple-choice/PartsOfSpeechGame.tsx`

## Purpose
Interactive game component that challenges users to identify parts of speech in Tagalog sentences, using NLP to generate and validate challenges.

## Props
```typescript
interface PartsOfSpeechGameProps {
  difficulty?: 'easy' | 'medium' | 'hard';
  onComplete?: (score: number) => void;
}
```

## State
```typescript
// Game state from Zustand store
const gameState = useGameStore(state => state);

// Local component state
const [selectedAnswer, setSelectedAnswer] = useState<string>('');
const [feedback, setFeedback] = useState<string | null>(null);
const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
```

## Key Functions

### startNewGame
```typescript
const startNewGame = async () => {
  setFeedback(null);
  setIsCorrect(null);
  setSelectedAnswer('');
  setIsSubmitting(false);
  
  try {
    await gameService.generateChallenge(props.difficulty || 'easy');
  } catch (error) {
    console.error('Failed to start new game:', error);
    setFeedback('Failed to generate challenge. Please try again.');
  }
};
```

### handleSubmit
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!selectedAnswer || isSubmitting) return;
  
  setIsSubmitting(true);
  
  try {
    if (!gameState.currentChallenge) {
      throw new Error('No active challenge');
    }
    
    const result = await gameService.checkAnswer(
      selectedAnswer, 
      gameState.currentChallenge.id
    );
    
    setIsCorrect(result.isCorrect);
    setFeedback(result.explanation || (result.isCorrect ? 
      'Correct!' : `Wrong. The correct answer is ${result.correctAnswer}.`));
  } catch (error) {
    console.error('Error checking answer:', error);
    setFeedback('Failed to check answer. Please try again.');
    setIsCorrect(false);
  } finally {
    setIsSubmitting(false);
  }
};
```

## Common Operations

### Starting a New Game Session
```typescript
// In component or parent
<Button onClick={startNewGame}>Start New Game</Button>

// Programmatically
startNewGame();
```

### Submitting an Answer
```typescript
// Set selected answer first
setSelectedAnswer(optionValue);

// Then submit form or call directly
handleSubmit(event);
```

### Accessing Game Score
```typescript
const score = useGameStore(state => state.score);
```

### Handling Game Completion
```typescript
// In parent component
<PartsOfSpeechGame onComplete={(score) => {
  console.log(`Game completed with score: ${score}`);
  // Navigate or show results
}} />
```

## Pitfalls & Gotchas

### 1. Race Conditions
**Issue**: If `startNewGame()` is called multiple times rapidly, race conditions can occur.  
**Solution**: Add loading state and disable actions while loading.

### 2. Missing NLP Backend
**Issue**: Component will fail if NLP service is not running.  
**Solution**: Check for NLP connection at component mount, show clear error if missing.

### 3. Null Challenge Access
**Issue**: `gameState.currentChallenge` might be null if accessed too early.  
**Solution**: Always check for null before accessing properties.

### 4. Answer Validation Edge Cases
**Issue**: NLP service may fail to validate certain Tagalog answers correctly.  
**Solution**: Add manual override rules for known edge cases.

## Example Usage

```tsx
// Basic usage
<PartsOfSpeechGame />

// With difficulty and completion handler
<PartsOfSpeechGame 
  difficulty="medium"
  onComplete={(score) => {
    updateUserProgress(score);
    router.push('/challenges/completed');
  }}
/>
```

## Related Components
- `ChallengeSelection.tsx` - Parent component for selecting challenge types
- `Button.tsx` - UI button component used within the game

## Dependencies
- `gameService.ts` - Service for game logic and NLP integration
- `gameStore.ts` - Zustand store for game state management
- `nlpService.ts` - Service for NLP operations (indirectly used)