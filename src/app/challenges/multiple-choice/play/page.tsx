'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useGameProgress } from '@/hooks/useGameProgress';
import Button from '@/components/ui/Button';
import Image from 'next/image';

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
  
  const { progress, canAccessLevel, completeLevel, updateData, addPoints, setQuests, data, loading: gameProgressLoading } = useGameProgress();
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [progressCompleted, setProgressCompleted] = useState(0);
  const [nextSection, setNextSection] = useState<number | null>(null);
  const [nextLevel, setNextLevel] = useState<number | null>(null);
  const prefersReduced = useReducedMotion();
  const [hearts, setHearts] = useState(3);
  
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

  // Reset completion and local navigation state when URL params change
  useEffect(() => {
    setGameCompleted(false);
    setScore(0);
    setProgressCompleted(0);
    setNextSection(null);
    setNextLevel(null);
  }, [sectionId, levelId]);
  
  // Handle quest progress updates
  const updateQuestProgress = async (questId: string, progressAmount: number) => {
    if (!data?.progress['multiple-choice']?.quests) return;
    
    const quests = [...data.progress['multiple-choice'].quests];
    const quest = quests.find(q => q.id === questId);
    
    if (quest && !quest.isCompleted) {
      quest.progress = Math.min(quest.progress + progressAmount, quest.target);
      const justCompleted = quest.progress >= quest.target;
      if (justCompleted) {
        quest.isCompleted = true;
      }
      
      await setQuests('multiple-choice', quests);
      await setQuests('multiple-choice', quests);

      // Award XP once at the moment the quest completes
      if (justCompleted) {
        await addPoints(quest.reward, 'multiple-choice');
      }
    }
  };
  
  // Handle game completion
  const handleComplete = async (score: number, levelCompleted: boolean) => {
    setScore(score);
    setGameCompleted(true);
    
    // Complete level with the score to determine if next level should unlock
    await completeLevel('multiple-choice', sectionId, levelId, score);
    // Grant fixed +100 XP on level completion (no score threshold)
    await addPoints(100, 'multiple-choice');
    
    // Update perfect score quest only if perfect
    if (score === 100) {
      await updateQuestProgress('perfect-score', 1);
    }
    
    // Always update complete-games quest - any completed game counts
    await updateQuestProgress('complete-games', 1);
    
    // Add additional debug log for XP tracking
    console.log(`[XP Debug - MultipleChoice] Score: ${score}, Level: ${levelId}, Section: ${sectionId}`);

    // Pre-compute the next level locally to avoid relying on async store propagation
    let ns = sectionId;
    let nl = levelId;
    if (levelId < 9) {
      nl = levelId + 1;
    } else if (sectionId < 2) {
      ns = sectionId + 1;
      nl = 0;
    } else {
      // No next level (finished last level). Keep nulls to hide the button.
      ns = -1;
      nl = -1;
    }
    setNextSection(ns >= 0 ? ns : null);
    setNextLevel(nl >= 0 ? nl : null);
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
            {true ? (
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
              {'Napakagaling mo! Nakumpleto mo ang level na ito.'}
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
              
              {nextSection !== null && nextLevel !== null && (
                <Button 
                  onClick={() => {
                    const nextSectionId = nextSection as number;
                    const nextLevelId = nextLevel as number;
                    console.log(`[Navigation] Going to next level: Section ${nextSectionId}, Level ${nextLevelId}`);
                    router.push(`/challenges/multiple-choice/play?section=${nextSectionId}&level=${nextLevelId}`);
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
            <div className="flex items-center gap-2 text-gray-700">
              <div className="text-sm text-gray-600 mr-2">Level {sectionId + 1} · Challenge {levelId + 1}</div>
              <Image src="/hearts.svg" alt="Hearts" width={24} height={24} />
              <span className="font-semibold">x{hearts}</span>
            </div>
          </div>
          {(() => {
            const pct = Math.max(0, Math.min(100, Math.round((progressCompleted / 5) * 100)));
            return (
              <div className="w-full h-[10px] md:h-[14px] bg-gray-200/80 rounded-full overflow-hidden" style={{ boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06)' }}>
                <div className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full relative" style={{ width: `${pct}%`, transition: prefersReduced ? 'none' : 'width 240ms cubic-bezier(0.22,1,0.36,1)' }} />
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
            onHeartsChange={(h) => setHearts(h)}
          />
        </div>
      </div>
    </div>
  );
}