'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useGameStore } from '@/store/gameStore';
import Button from '@/components/ui/Button';

// Dynamically import the game component to avoid module not found errors
const PartsOfSpeechGame = dynamic(
  () => import('@/components/challenges/multiple-choice/PartsOfSpeechGame'),
  { 
    loading: () => <div className="min-h-[400px] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-duolingo-purple"></div>
    </div>,
    ssr: false // Disable server-side rendering for this component
  }
);

export default function PlayMultipleChoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sectionId = parseInt(searchParams.get('section') || '0');
  const levelId = parseInt(searchParams.get('level') || '0');
  
  const { progress, canAccessLevel, completeLevel, addPoints, addProgressToQuest } = useGameStore();
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);
  
  // Check if level is accessible
  useEffect(() => {
    const checkAccess = () => {
      const hasAccess = canAccessLevel('multiple-choice', sectionId, levelId);
      
      if (!hasAccess) {
        // Redirect to challenges page if level is not accessible
        router.push('/challenges/multiple-choice');
      } else {
        setLoading(false);
      }
    };
    
    checkAccess();
  }, [sectionId, levelId, canAccessLevel, router]);
  
  // Handle game completion
  const handleComplete = (score: number, levelCompleted: boolean) => {
    setScore(score);
    setGameCompleted(true);
    
    if (levelCompleted) {
      // Complete level and add points
      completeLevel('multiple-choice', sectionId, levelId);
      addPoints(score, 'multiple-choice');
    }
      
    // Check for perfect score quest - always update if score is 100, regardless of level completion
    if (score === 100) {
      // Update perfect score quest
      const gameProgress = progress['multiple-choice'];
      if (gameProgress) {
        const perfectScoreQuest = gameProgress.quests.find(quest => quest.id === 'perfect-score');
        if (perfectScoreQuest && !perfectScoreQuest.isCompleted) {
          // Add progress to perfect score quest
          addPoints(10, 'multiple-choice'); // Bonus points for perfect score
          // Directly add progress to the quest
          addProgressToQuest('multiple-choice', 'perfect-score', 1);
        }
      }
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-duolingo-purple"></div>
        <p className="mt-4 text-gray-600">Naglo-load...</p>
      </div>
    );
  }
  
  if (gameCompleted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto text-center"
        >
          <div className="mb-6">
            {score >= 80 ? (
              <div className="mx-auto w-24 h-24 bg-duolingo-blue rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : (
              <div className="mx-auto w-24 h-24 bg-duolingo-blue rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            )}
            
            <h2 className="text-2xl font-bold mb-2">
              {score >= 80 ? 'Mahusay!' : 'Magaling!'}
            </h2>
            <p className="text-gray-600 mb-6">
              {score >= 80 
                ? 'Napakahusay mo! Nakumpleto mo ang level na ito.' 
                : 'Magaling ka! Subukan mo ulit para makakuha ng mas mataas na score.'}
            </p>
            
            <div className="bg-gray-100 rounded-full p-2 mb-6">
              <div className="bg-duolingo-blue h-6 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ width: `${score}%` }}>
                {score}%
              </div>
            </div>
            
            <div className="text-center text-xl font-bold text-duolingo-blue mb-6">
              + {score} XP
            </div>
            
            <div className="space-y-3">
              <Button 
                onClick={() => router.push('/challenges/multiple-choice')}
                className="w-full bg-duolingo-blue text-white hover:bg-duolingo-darkBlue"
              >
                Bumalik sa Learning Path
              </Button>
              
              {score < 80 && (
                <Button 
                  onClick={() => window.location.reload()}
                  className="w-full bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Subukan Ulit
                </Button>
              )}
              
              {score >= 80 && progress['multiple-choice'] && (
                <Button 
                  onClick={() => {
                    // Navigate to next level if available
                    const currentSection = progress['multiple-choice'].sections.find(s => s.id === sectionId);
                    if (currentSection) {
                      const nextLevel = currentSection.levels.find(l => l.id === levelId + 1);
                      if (nextLevel && !nextLevel.isLocked) {
                        // Go to the next level in the same section
                        router.push(`/challenges/multiple-choice/play?section=${sectionId}&level=${levelId + 1}`);
                        return;
                      } 
                      
                      // Try next section's first level
                      const nextSection = progress['multiple-choice'].sections.find(s => s.id === sectionId + 1 && !s.isLocked);
                      if (nextSection && nextSection.levels.length > 0) {
                        // Find the first unlocked level in the next section
                        const firstUnlockedLevel = nextSection.levels.find(l => !l.isLocked);
                        if (firstUnlockedLevel) {
                          router.push(`/challenges/multiple-choice/play?section=${sectionId + 1}&level=${firstUnlockedLevel.id}`);
                          return;
                        }
                      }
                      
                      // If there's no next level available, go back to dashboard
                      router.push('/challenges/multiple-choice');
                    }
                  }}
                  className="w-full border border-duolingo-blue text-duolingo-blue hover:bg-duolingo-blue hover:bg-opacity-10"
                >
                  Susunod na Level
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with back button */}
      <div className="flex items-center mb-8">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push('/challenges/multiple-choice')}
          className="mr-4 text-gray-600 hover:text-gray-900 bg-white p-2 rounded-full shadow hover:shadow-md transition-all"
          aria-label="Go back to learning path"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </motion.button>
        
        <div>
          <h2 className="text-2xl font-bold">Bahagi ng Pangungusap</h2>
          <p className="text-gray-600">
            Section {sectionId + 1}, Level {levelId + 1}: Tukuyin ang bahagi ng pangungusap sa Tagalog.
          </p>
        </div>
      </div>
      
      <PartsOfSpeechGame
        key={`${sectionId}-${levelId}`} // Add key to force component refresh when params change
        difficulty="medium"
        levelNumber={sectionId * 5 + levelId} // Convert section and level to overall level number
        onComplete={handleComplete}
      />
    </div>
  );
}