'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useGameProgress } from '@/hooks/useGameProgress';
import Button from '@/components/ui/Button';
import Image from 'next/image';
import EndOfLevelScreen from '@/components/challenges/common/EndOfLevelScreen';

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
  const sectionId = parseInt(searchParams.get('section') || '0'); // Level group index (0: Easy, 1: Medium, 2: Hard)
  const levelId = parseInt(searchParams.get('level') || '0'); // Challenge index within the level (0..9)
  
  const { progress, canAccessLevel, completeLevel, updateData, addPoints, setQuests, data, loading: gameProgressLoading } = useGameProgress();
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [progressCompleted, setProgressCompleted] = useState(0);
  const [nextSection, setNextSection] = useState<number | null>(null);
  const [nextLevel, setNextLevel] = useState<number | null>(null);
  const [displayXp, setDisplayXp] = useState(0);
  const prefersReduced = useReducedMotion();
  const [hearts, setHearts] = useState(3);
  const [streak, setStreak] = useState(0);
  const [pendingBonusXp, setPendingBonusXp] = useState(0);
  const [finalXp, setFinalXp] = useState(0);
  
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
    setDisplayXp(0);
    setPendingBonusXp(0);
    setFinalXp(0);
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
    
    // Compute raw score = correct (out of 10) - hearts lost (clamped 0..10)
    const correctCount = Math.max(0, Math.min(10, Math.round(score / 10)));
    const heartsLost = Math.max(0, 3 - hearts);
    const rawScore = Math.max(0, Math.min(10, correctCount - heartsLost));

    // Complete level with the score to determine if next level should unlock
    await completeLevel('multiple-choice', sectionId, levelId, score, rawScore);
    const bonusToGrant = levelCompleted ? pendingBonusXp : 0;
    // Grant fixed +100 XP on level completion (no score threshold) + pending bonus
    await addPoints(100 + bonusToGrant, 'multiple-choice');
    setFinalXp(100 + bonusToGrant);
    
    // Update perfect score quest only if raw perfect (10)
    if (rawScore === 10) {
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

  // Animate XP display to match Make-a-Sentence
  useEffect(() => {
    if (!gameCompleted) return;
    const target = finalXp;
    if (prefersReduced) {
      setDisplayXp(target);
      return;
    }
    const start = performance.now();
    const duration = 800;
    const from = 0;
    const to = target;
    let raf = 0 as unknown as number;
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setDisplayXp(Math.round(from + (to - from) * p));
      if (p < 1) raf = requestAnimationFrame(step) as unknown as number;
    };
    raf = requestAnimationFrame(step) as unknown as number;
    return () => cancelAnimationFrame(raf);
  }, [gameCompleted, finalXp, prefersReduced]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-duolingo-purple"></div>
        <p className="mt-4 text-gray-600">Naglo-load...</p>
      </div>
    );
  }
  
  if (gameCompleted) {
    const levelsCompleted = Math.min(10, Math.max(0, levelId + 1));
    const sectionPct = Math.max(0, Math.min(100, Math.round((levelsCompleted / 10) * 100)));

    return (
      <EndOfLevelScreen
        xp={displayXp}
        sectionPct={sectionPct}
        primaryCta={{
          label: 'Bumalik sa Learning Path',
          onClick: () => router.push('/challenges/multiple-choice'),
          autoFocus: true
        }}
        secondaryCta={{
          label: 'Magbigay ng Feedback',
          onClick: () => {
            if (typeof window !== 'undefined') {
              window.open('https://forms.gle/1NZy1hTMBMA8PdvS9', '_blank');
            }
          }
        }}
      />
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto px-4 py-8 flex flex-col flex-1">
        {/* Make-a-Sentence style header + progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push('/challenges/multiple-choice')}
                className="text-gray-600 hover:text-gray-900"
                aria-label="Bumalik"
              >
                ← Back
              </button>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <div className="text-sm text-gray-600 mr-2">Level {sectionId + 1} · Challenge {levelId + 1}</div>
              <Image src="/hearts.svg" alt="Hearts" width={24} height={24} />
              <span className="font-semibold">x{hearts}</span>
              {streak >= 3 && (
              <span aria-label="streak-indicator">Sunud-sunod na tama! 🔥</span>
              )}
            </div>
          </div>
          {(() => {
            const pct = Math.max(0, Math.min(100, Math.round((progressCompleted / 10) * 100)));
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
            onStreakChange={(s) => setStreak(s)}
            onBonusEarned={(amt) => setPendingBonusXp(prev => prev + amt)}
          />
        </div>
      </div>
    </div>
  );
}