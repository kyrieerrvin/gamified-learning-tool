# NLP Integration Q&A

## Q: How do I add a new language challenge type that uses the NLP model?

### Context
- Files: `src/services/nlpService.ts`, `src/app/api/challenges/pos-game/route.ts`
- Components: `PartsOfSpeechGame.tsx`
- Current challenge types: Parts of speech identification

### Answer
To add a new language challenge type that uses the NLP model:

1. **Create a new API endpoint**:
```typescript
// src/app/api/challenges/new-challenge-type/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { parameter1, parameter2 } = await req.json();
    
    // Call Python NLP backend with appropriate parameters
    const response = await fetch('http://localhost:6000/your-new-endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parameter1, parameter2 }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to process request');
    }
    
    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
}
```

2. **Add the service method in nlpService.ts**:
```typescript
// src/services/nlpService.ts
export const newChallengeFunction = async (
  param1: string,
  param2: string
): Promise<NewChallengeResult> => {
  try {
    const response = await fetch('/api/challenges/new-challenge-type', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parameter1: param1, parameter2: param2 }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to process request');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to process request');
    }
    
    return result.data;
  } catch (error) {
    console.error('NLP service error:', error);
    throw error;
  }
};
```

3. **Add new challenge type to gameService.ts**:
```typescript
// src/services/gameService.ts
export const generateNewChallengeType = async (
  difficulty: 'easy' | 'medium' | 'hard' = 'easy'
): Promise<Challenge> => {
  try {
    // Call nlpService method
    const nlpResult = await nlpService.newChallengeFunction(
      getParameterBasedOnDifficulty(difficulty),
      'other-parameter'
    );
    
    // Transform NLP result into Challenge format
    const challenge: Challenge = {
      id: generateId(),
      text: nlpResult.text,
      options: nlpResult.options,
      correctAnswer: nlpResult.correctAnswer,
      difficulty,
      type: 'new-challenge-type'
    };
    
    // Update game store
    gameStore.getState().setCurrentChallenge(challenge);
    
    return challenge;
  } catch (error) {
    console.error('Failed to generate challenge:', error);
    throw error;
  }
};
```

4. **Create a new React component**:
```tsx
// src/components/challenges/new-challenge-type/NewChallengeComponent.tsx
import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import * as gameService from '@/services/gameService';
import Button from '@/components/ui/Button';

interface NewChallengeComponentProps {
  difficulty?: 'easy' | 'medium' | 'hard';
  onComplete?: (score: number) => void;
}

export const NewChallengeComponent: React.FC<NewChallengeComponentProps> = (props) => {
  // Component implementation similar to PartsOfSpeechGame
  // but adapted for your new challenge type
};
```

5. **Update Python backend**:
   - Add a new endpoint in app.py for your challenge type
   - Implement the NLP logic for the new challenge

### Best Practices
- Follow the error handling pattern from existing challenges
- Maintain consistent types and interfaces
- Add tests for the new challenge type
- Document the new challenge in appropriate places

## Q: How do I test the NLP connection without running the full app?

### Answer
You can use the included test script:

```bash
# Make sure Python dependencies are installed
pip install calamancy flask flask-cors

# Run the test script
python test-connection.py
```

Alternatively, you can use curl to test specific endpoints:

```bash
# First start the NLP service
./start-nlp.sh

# Then in another terminal, test endpoints
curl -X POST -H "Content-Type: application/json" -d '{"text":"Kumain ako ng mansanas"}' http://localhost:6000/analyze
```

## Q: How do I customize the difficulty levels for NLP challenges?

### Answer
Difficulty levels are controlled in the gameService.ts file. To customize them:

1. Modify the parameters sent to the NLP service based on difficulty level:

```typescript
// In src/services/gameService.ts
export const generateChallenge = async (
  difficulty: 'easy' | 'medium' | 'hard' = 'easy'
): Promise<Challenge> => {
  try {
    // Customize parameters based on difficulty
    let complexity = 1; // default for 'easy'
    let sentenceLength = 5; // default for 'easy'
    
    if (difficulty === 'medium') {
      complexity = 2;
      sentenceLength = 8;
    } else if (difficulty === 'hard') {
      complexity = 3;
      sentenceLength = 12;
    }
    
    // Pass customized parameters to NLP service
    const nlpResult = await nlpService.analyzeText({
      complexity,
      sentenceLength,
      includeRareWords: difficulty === 'hard',
    });
    
    // Rest of the function remains the same
  } catch (error) {
    console.error('Failed to generate challenge:', error);
    throw error;
  }
};
```

2. Update the NLP service to accept these parameters:

```typescript
// In src/services/nlpService.ts
export const analyzeText = async (
  params: {
    complexity?: number;
    sentenceLength?: number;
    includeRareWords?: boolean;
  }
): Promise<AnalysisResult> => {
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    
    // Rest of the function remains the same
  } catch (error) {
    console.error('NLP service error:', error);
    throw error;
  }
};
```

3. Update the Python backend to handle these parameters when generating challenges.