'use client';

import { useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { ChallengeResult } from '@/store/gameStore';

interface ChallengeResultTrackerProps {
  result: ChallengeResult | null;
  onResultProcessed?: () => void;
}

/**
 * Component to track challenge results and update user data in Firestore
 * 
 * Usage:
 * 1. Import this component in your game/challenge page
 * 2. Create state to track the challenge result
 * 3. When the challenge is completed, set the result
 * 4. This component will automatically send the result to Firestore
 * 
 * Example:
 * ```tsx
 * const [result, setResult] = useState<ChallengeResult | null>(null);
 * 
 * // When game completes
 * const handleGameComplete = (score: number) => {
 *   setResult({
 *     id: uuidv4(),
 *     challengeType: 'multipleChoice',
 *     score,
 *     maxScore: 100,
 *     completedAt: new Date().toISOString(),
 *     duration: gameDuration
 *   });
 * }
 * 
 * // In your JSX
 * <ChallengeResultTracker 
 *   result={result} 
 *   onResultProcessed={() => setResult(null)}
 * />
 * ```
 */
export function ChallengeResultTracker({ result, onResultProcessed }: ChallengeResultTrackerProps) {
  const { addChallengeResult, loading } = useUser();

  useEffect(() => {
    // Only process if result exists and is not null
    if (result && !loading) {
      console.log('Processing challenge result:', result);
      
      // Add result to Firestore
      addChallengeResult(result)
        .then(() => {
          console.log('Challenge result saved to Firestore');
          
          // Call the callback if provided
          if (onResultProcessed) {
            onResultProcessed();
          }
        })
        .catch(error => {
          console.error('Error saving challenge result:', error);
        });
    }
  }, [result, addChallengeResult, loading, onResultProcessed]);

  // This is a utility component that doesn't render anything
  return null;
}

export default ChallengeResultTracker;
