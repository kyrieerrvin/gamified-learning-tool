'use client';

import { useEffect } from 'react';
import { useGameProgress } from '@/hooks/useGameProgress';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { ChallengeResult } from '@/hooks/useGameProgress';

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
 *     challengeType: 'multiple-choice',
 *     score,
 *     maxScore: 100,
 *     completedAt: new Date().toISOString(),
 *     duration: gameDuration,
 *     isCorrect: score >= 80,
 *     gameType: 'multiple-choice'
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
  const { user } = useAuth();
  const { data, loading } = useGameProgress();

  useEffect(() => {
    // Only process if result exists and user is authenticated
    if (result && user?.uid && !loading) {
      console.log('Processing challenge result:', result);
      
      // Add result to Firestore directly
      const userDocRef = doc(db, 'gameProgress', user.uid);
      
      updateDoc(userDocRef, {
        recentChallenges: arrayUnion({
          ...result,
          completedAt: new Date().toISOString()
        }),
        totalChallengesCompleted: (data?.totalChallengesCompleted || 0) + 1,
        updatedAt: new Date().toISOString()
      })
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
  }, [result, user?.uid, loading, data?.totalChallengesCompleted, onResultProcessed]);

  // This is a utility component that doesn't render anything
  return null;
}

export default ChallengeResultTracker;
