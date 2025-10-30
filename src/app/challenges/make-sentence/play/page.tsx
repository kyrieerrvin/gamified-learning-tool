'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import MakeSentenceGame from '@/components/challenges/make-sentence/MakeSentenceGame';
import SentenceTileGame from '@/components/challenges/make-sentence/SentenceTileGame';
import { useGameProgress } from '@/hooks/useGameProgress';
import Button from '@/components/ui/Button';
import Image from 'next/image';
import { apiGet } from '@/utils/api';
import EndOfLevelScreen from '@/components/challenges/common/EndOfLevelScreen';

export default function PlayMakeSentencePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sectionId = parseInt(searchParams.get('section') || '0'); // Level group index (0: Easy, 1: Difficult, 2: Hard)
  const levelId = parseInt(searchParams.get('level') || '0'); // Challenge index within the level (0..9)
  
  const { progress, canAccessLevel, completeLevel, updateData, addPoints, setQuests, data, loading: gameProgressLoading } = useGameProgress();
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);
  // Sentence Tile Game multi-round support for sections 0 (Easy) and 1 (Difficult)
  const [tileRounds, setTileRounds] = useState<Array<{ sentence: string; focusWord: string }>>([]);
  const [tileIndex, setTileIndex] = useState(0);
  const [tileScore, setTileScore] = useState(0);
  // Reduced motion preference and XP display state used for the completion screen
  const prefersReduced = useReducedMotion();
  const [displayXp, setDisplayXp] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [streak, setStreak] = useState(0);
  const [pendingBonusXp, setPendingBonusXp] = useState(0);
  const [finalXp, setFinalXp] = useState(0);
  const [progressPct, setProgressPct] = useState(0);
  
  // Check if level is accessible AFTER game progress has loaded
  useEffect(() => {
    // Wait until the game progress hook has finished loading and has data
    if (gameProgressLoading || !data) {
      setLoading(true);
      return;
    }

    const hasAccess = canAccessLevel('make-sentence', sectionId, levelId);
    if (!hasAccess) {
      router.push('/challenges/make-sentence');
      return;
    }

    setLoading(false);
  }, [sectionId, levelId, canAccessLevel, router, gameProgressLoading, data]);

  // Prepare up to 10 unique rounds for SentenceTileGame for Easy/Difficult based on grade-level words
  useEffect(() => {
    const loadTileRounds = async () => {
      // Only for Easy (0) and Difficult (1)
      if (!(sectionId === 0 || sectionId === 1)) return;
      // Need profile/grade
      if (!data?.profile?.gradeLevel) return;
      try {
        const grade = data.profile.gradeLevel as 'G1_2' | 'G3_4' | 'G5_6';
        const endpoint = grade ? `/api/challenges/make-sentence/words?grade=${grade}` : '/api/challenges/make-sentence/words';
        const resp = await apiGet<{ words: Array<any>; count: number }>(endpoint);
        const words = Array.isArray(resp?.words) ? resp.words : [];
        // Build candidates with available sentences
        const candidates: Array<{ sentence: string; focusWord: string }> = [];
        for (const w of words) {
          const wordText = (w.word || '').toString();
          // Prefer explicit easy/difficult fields if available (from backend JSON), else use sentences[0/1]
          const easy = (w.easy || (Array.isArray(w.sentences) ? w.sentences[0] : '')) || '';
          const difficult = (w.difficult || (Array.isArray(w.sentences) ? w.sentences[1] : '')) || '';
          if (sectionId === 0 && easy) {
            candidates.push({ sentence: easy, focusWord: wordText });
          } else if (sectionId === 1 && difficult) {
            candidates.push({ sentence: difficult, focusWord: wordText });
          }
        }
        // Normalize helper for deduplication
        const normalize = (text: string) =>
          text.toLowerCase().replace(/[.,!?;:]/g, '').replace(/\s+/g, ' ').trim();

        // Deduplicate by sentence text (normalized), then shuffle, then take up to 10
        const seen = new Set<string>();
        const unique: Array<{ sentence: string; focusWord: string }> = [];
        for (const c of candidates) {
          const key = normalize(c.sentence);
          if (!seen.has(key)) {
            seen.add(key);
            unique.push(c);
          }
        }
        // Fisher–Yates shuffle
        for (let i = unique.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [unique[i], unique[j]] = [unique[j], unique[i]];
        }
        const selected = unique.slice(0, Math.min(10, unique.length));
        // If empty, fallback handled below
        setTileRounds(selected.length ? selected : []);
        setTileIndex(0);
        setTileScore(0);
      } catch (e) {
        // No fallbacks: if fetch fails, keep empty state
        setTileRounds([]);
        setTileIndex(0);
        setTileScore(0);
      }
    };
    loadTileRounds();
  }, [sectionId, data?.profile?.gradeLevel]);

  // Reset bonus and final XP when navigating between levels
  useEffect(() => {
    setPendingBonusXp(0);
    setFinalXp(0);
    setDisplayXp(0);
  }, [sectionId, levelId]);
  
  // Handle quest progress updates
  const updateQuestProgress = async (questId: string, progressAmount: number) => {
    if (!data?.progress['make-sentence']?.quests) return;
    
    const quests = [...data.progress['make-sentence'].quests];
    const quest = quests.find(q => q.id === questId);
    
    if (quest && !quest.isCompleted) {
      quest.progress = Math.min(quest.progress + progressAmount, quest.target);
      const justCompleted = quest.progress >= quest.target;
      if (justCompleted) {
        quest.isCompleted = true;
      }
      
      await setQuests('make-sentence', quests);

      // Award XP instantly when a quest completes
      if (justCompleted) {
        await addPoints(quest.reward, 'make-sentence');
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

    // Complete the level in game store
    await completeLevel('make-sentence', sectionId, levelId, score, rawScore);
    // Only award bonus XP if level is completed and not out-of-hearts
    const bonusToGrant = levelCompleted ? pendingBonusXp : 0;
    // Grant +100 XP to lifetime on level completion (no score threshold)
    await addPoints(100 + bonusToGrant, 'make-sentence');
    setFinalXp(100 + bonusToGrant);
    // Streak: mark today as active
    try {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      // Persist streak fields atomically (avoid full overwrite)
      const { db } = await import('@/lib/firebase');
      const { doc, updateDoc } = await import('firebase/firestore');
      const { useAuth } = await import('@/context/AuthContext');
    } catch {}
    
    // Update daily quest progress for game completion
    await updateQuestProgress('complete-games', 1);
    
    // Add progress to perfect score quest only if raw perfect (10)
    if (rawScore === 10) {
      await updateQuestProgress('perfect-score', 1);
    }
  };

  // Handle per-round completion for SentenceTileGame (10 points per correct sentence)
  const handleTileRoundComplete = async () => {
    const newScore = tileScore + 10;
    const nextIndex = tileIndex + 1;
    if (nextIndex >= tileRounds.length) {
      // Finish level
      setScore(newScore);
      setGameCompleted(true);
      // Compute raw score for tile mode as number of correct sentences (each +10) minus hearts lost
      const correctCount = Math.max(0, Math.min(10, Math.round(newScore / 10)));
      const heartsLost = Math.max(0, 3 - hearts);
      const rawScore = Math.max(0, Math.min(10, correctCount - heartsLost));
      await completeLevel('make-sentence', sectionId, levelId, newScore, rawScore);
      // Only award pending bonus when finishing successfully
      await addPoints(100 + pendingBonusXp, 'make-sentence');
      setFinalXp(100 + pendingBonusXp);
      await updateQuestProgress('complete-games', 1);
      if (rawScore === 10) {
        await updateQuestProgress('perfect-score', 1);
      }
    } else {
      setTileScore(newScore);
      setTileIndex(nextIndex);
    }
  };

  // Animate XP count-up when the game completes (show 100 + bonus)
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-duolingo-green"></div>
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
          onClick: () => router.push('/challenges/make-sentence'),
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
      {/* Progress bar header (single top bar) */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/challenges/make-sentence')}
              className="text-gray-600 hover:text-gray-900"
              aria-label="Go back"
            >
              ← Back
            </button>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <div className="text-sm text-gray-600 mr-2">Level {sectionId + 1} · Challenge {levelId + 1}</div>
            <Image src="/hearts.svg" alt="Hearts" width={24} height={24} />
            <span className="font-semibold">x{hearts}</span>
            {streak >= 3 && (
              <span aria-label="streak-indicator">Sunod sunod na tama! 🔥</span>
            )}
          </div>
        </div>
        {(() => {
          const isTileGame = sectionId === 0 || sectionId === 1;
          const pct = isTileGame
            ? (tileRounds.length > 0 ? Math.round((tileIndex / Math.max(1, tileRounds.length)) * 100) : 0)
            : progressPct;

            return (
              <div className="w-full h-[10px] md:h-[14px] bg-gray-200/80 rounded-full overflow-hidden" style={{ boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06)' }}>
                <div className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full relative" style={{ width: `${pct}%`, transition: 'width 240ms cubic-bezier(0.22,1,0.36,1)' }} />
              </div>
            );
        })()}
      </div>
      
      {/* Centered game area */}
      <div className="flex-1 flex items-center justify-center">
        {(sectionId === 0 || sectionId === 1) ? (
          tileRounds.length > 0 ? (
            <SentenceTileGame
              sampleSentence={tileRounds[Math.min(tileIndex, tileRounds.length - 1)].sentence}
              focusWord={tileRounds[Math.min(tileIndex, tileRounds.length - 1)].focusWord}
              progressCompleted={tileIndex}
              progressTotal={Math.max(1, tileRounds.length)}
              onComplete={() => handleTileRoundComplete()}
              onHeartsChange={setHearts}
              onStreakChange={setStreak}
              onBonusEarned={(amt) => setPendingBonusXp(prev => prev + amt)}
            />
          ) : (
            <div className="text-gray-600">Naglo-load ng mga pangungusap…</div>
          )
        ) : (
          <MakeSentenceGame 
            questionsCount={10}
            levelNumber={sectionId * 10 + levelId}
            onComplete={handleComplete}
            onStreakChange={setStreak}
            onBonusEarned={(amt) => setPendingBonusXp(prev => prev + amt)}
            initialHearts={hearts}
            onHeartsChange={setHearts}
            onProgressChange={setProgressPct}
          />
        )}
      </div>
      </div>
    </div>
  );
}