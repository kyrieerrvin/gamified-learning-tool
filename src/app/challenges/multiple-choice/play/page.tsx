'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useGameProgress } from '@/hooks/useGameProgress';
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
  const sectionId = parseInt(searchParams.get('section') || '0'); // Level group index (0: Easy, 1: Difficult, 2: Hard)
  const levelId = parseInt(searchParams.get('level') || '0'); // Challenge index within the level (0..9)
  
  const { progress, canAccessLevel, completeLevel, updateData, data, loading: gameProgressLoading } = useGameProgress();
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [progressCompleted, setProgressCompleted] = useState(0);
  const prefersReduced = useReducedMotion();
  
  // Check if level is accessible AFTER game progress has loaded
  useEffect(() => {
    if (gameProgressLoading || !data) {
      setLoading(true);
      return;
    }

    const hasAccess = canAccessLevel('multiple-choice', sectionId, levelId);
    if (!hasAccess) {
      router.push('/challenges/multiple-choice');
      return;
    }

    setLoading(false);
  }, [sectionId, levelId, canAccessLevel, router, gameProgressLoading, data]);
  
  // Handle quest progress updates
  const updateQuestProgress = async (questId: string, progressAmount: number) => {
    if (!data?.progress['multiple-choice']?.quests) return;
    
    const quests = [...data.progress['multiple-choice'].quests];
    const quest = quests.find(q => q.id === questId);
    
    if (quest && !quest.isCompleted) {
      quest.progress = Math.min(quest.progress + progressAmount, quest.target);
      if (quest.progress >= quest.target) {
        quest.isCompleted = true;
      }
      
      await updateData({
        progress: {
          ...data.progress,
          'multiple-choice': {
            ...data.progress['multiple-choice'],
            quests
          }
        }
      });
    }
  };
  
  // Handle game completion
  const handleComplete = async (score: number, levelCompleted: boolean) => {
    setScore(score);
    setGameCompleted(true);
    
    // Complete level with the score to determine if next level should unlock
    await completeLevel('multiple-choice', sectionId, levelId, score);
    
    // Update perfect score quest only if perfect
    if (score === 100) {
      await updateQuestProgress('perfect-score', 1);
    }
    
    // Always update complete-games quest - any completed game counts
    await updateQuestProgress('complete-games', 1);
    
    // Add additional debug log for XP tracking
    console.log(`[XP Debug - MultipleChoice] Score: ${score}, Level: ${levelId}, Section: ${sectionId}`);
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
            {/* PROGRESS BAR 
            <div className="bg-gray-100 rounded-full p-2 mb-6">
              <div className="bg-duolingo-blue h-6 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ width: `${score}%` }}>
                {score}%
              </div>
            </div>
            */}

            <div className="text-center text-xl font-bold text-duolingo-blue mb-6">
              + {Math.floor(score)} XP
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
                    // Use the currentSection and currentLevel to navigate to the next level
                    const gameProgress = progress['multiple-choice'];
                    if (gameProgress) {
                      // These values are automatically updated in completeLevel function
                      const nextSectionId = gameProgress.currentSection;
                      const nextLevelId = gameProgress.currentLevel;
                      
                      console.log(`[Navigation] Going to next level: Section ${nextSectionId}, Level ${nextLevelId}`);
                      
                      // Navigate to the next level using the stored values
                      router.push(`/challenges/multiple-choice/play?section=${nextSectionId}&level=${nextLevelId}`);
                    } else {
                      // Fallback to challenges page if no progress data
                      router.push('/challenges/multiple-choice');
                    }
                  }}
                  className="w-full bg-duolingo-green text-white hover:bg-duolingo-darkGreen"
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
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto px-4 py-8 flex flex-col flex-1">
        {/* Make-a-Sentence style header + progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => router.push('/challenges/multiple-choice')}
              className="text-gray-600 hover:text-gray-900"
              aria-label="Bumalik"
            >
              ← Back
            </button>
            <div className="text-sm text-gray-600">Level {sectionId + 1} · Challenge {levelId + 1}</div>
          </div>
          {(() => {
            const pct = Math.max(0, Math.min(100, Math.round((progressCompleted / 5) * 100)));
            return (
              <div className="w-full h-[10px] md:h-[14px] bg-gray-200/80 rounded-full overflow-hidden" style={{ boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06)' }}>
                <div className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full relative" style={{ width: `${pct}%`, transition: prefersReduced ? 'none' : 'width 240ms cubic-bezier(0.22,1,0.36,1)' }}>
                  <div className="absolute inset-0 pointer-events-none bg-white/15" />
                </div>
              </div>
            );
          })()}
        </div>
        
        {/* Centered game area */}
        <div className="flex-1 flex items-start md:items-center">
          <PartsOfSpeechGame
            key={`${sectionId}-${levelId}`}
            levelNumber={sectionId * 10 + levelId}
            onComplete={handleComplete}
            onProgressChange={(c) => setProgressCompleted(c)}
          />
        </div>
      </div>
    </div>
  );
}