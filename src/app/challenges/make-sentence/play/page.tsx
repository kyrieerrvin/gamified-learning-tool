'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import MakeSentenceGame from '@/components/challenges/make-sentence/MakeSentenceGame';
import SentenceTileGame from '@/components/challenges/make-sentence/SentenceTileGame';
import { useGameProgress } from '@/hooks/useGameProgress';
import Button from '@/components/ui/Button';
import { apiGet } from '@/utils/api';
import Image from 'next/image';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import placeholder from '../../../../../assets/placeholder.png';

export default function PlayMakeSentencePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sectionId = parseInt(searchParams.get('section') || '0'); // Level group index (0: Easy, 1: Difficult, 2: Hard)
  const levelId = parseInt(searchParams.get('level') || '0'); // Challenge index within the level (0..9)
  
  const { progress, canAccessLevel, completeLevel, updateData, data, loading: gameProgressLoading } = useGameProgress();
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

  // Prepare 5 rounds for SentenceTileGame for Easy/Difficult based on grade-level words
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
          if (candidates.length >= 8) break; // collect a few extra to sample from
        }
        // Limit to 1 round per level for quick testing
        const selected = candidates.slice(0, 1);
        setTileRounds(selected);
        setTileIndex(0);
        setTileScore(0);
      } catch (e) {
        // Fallback: static sample
        const fallback = [
          { sentence: 'Ang bata ay mahilig mag laro sa ulan.', focusWord: 'bata' }
        ];
        setTileRounds(fallback);
        setTileIndex(0);
        setTileScore(0);
      }
    };
    loadTileRounds();
  }, [sectionId, data?.profile?.gradeLevel]);
  
  // Handle quest progress updates
  const updateQuestProgress = async (questId: string, progressAmount: number) => {
    if (!data?.progress['make-sentence']?.quests) return;
    
    const quests = [...data.progress['make-sentence'].quests];
    const quest = quests.find(q => q.id === questId);
    
    if (quest && !quest.isCompleted) {
      quest.progress = Math.min(quest.progress + progressAmount, quest.target);
      if (quest.progress >= quest.target) {
        quest.isCompleted = true;
      }
      
      await updateData({
        progress: {
          ...data.progress,
          'make-sentence': {
            ...data.progress['make-sentence'],
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
    
    // Complete the level in game store
    await completeLevel('make-sentence', sectionId, levelId, score);
    
    // Update daily quest progress for game completion
    await updateQuestProgress('complete-games', 1);
    
    // Add progress to perfect score quest if applicable
    if (score === 100) {
      await updateQuestProgress('perfect-score', 1);
    }
  };

  // Handle per-round completion for SentenceTileGame (20 points per correct sentence, 5 rounds -> 100)
  const handleTileRoundComplete = async () => {
    const newScore = tileScore + 20;
    const nextIndex = tileIndex + 1;
    if (nextIndex >= 5 || nextIndex >= tileRounds.length) {
      // Finish level
      setScore(newScore);
      setGameCompleted(true);
      await completeLevel('make-sentence', sectionId, levelId, newScore);
      await updateQuestProgress('complete-games', 1);
      if (newScore === 100) {
        await updateQuestProgress('perfect-score', 1);
      }
    } else {
      setTileScore(newScore);
      setTileIndex(nextIndex);
    }
  };

  // Animate XP count-up when the game completes
  useEffect(() => {
    if (!gameCompleted) return;
    if (prefersReduced) {
      setDisplayXp(score);
      return;
    }
    const start = performance.now();
    const duration = 800;
    const from = 0;
    const to = score;
    let raf = 0 as unknown as number;
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setDisplayXp(Math.round(from + (to - from) * p));
      if (p < 1) raf = requestAnimationFrame(step) as unknown as number;
    };
    raf = requestAnimationFrame(step) as unknown as number;
    return () => cancelAnimationFrame(raf);
  }, [gameCompleted, score, prefersReduced]);
  
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white rounded-2xl shadow-xl p-8 md:p-10 max-w-xl w-full mx-auto text-center"
        >
          {/* Illustration + subtle confetti */}
          <div className="relative mb-6 flex items-center justify-center">
            {!prefersReduced && (
              <div className="absolute inset-0 -z-10 overflow-hidden">
                {[...Array(14)].map((_, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 12, x: (i % 2 === 0 ? -1 : 1) * 10 }}
                    animate={{ opacity: [0, 1, 0], y: [-8, -18, -28] }}
                    transition={{ duration: 0.9 + (i % 3) * 0.15, delay: i * 0.03, ease: 'easeOut' }}
                    className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full"
                    style={{ background: i % 3 === 0 ? '#22c55e' : i % 3 === 1 ? '#3b82f6' : '#f59e0b' }}
                  />
                ))}
              </div>
            )}
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}>
              <Image src={placeholder} alt="Celebration" width={140} height={140} className="rounded-xl" />
            </motion.div>
          </div>

          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">Mahusay!</h2>
          <p className="text-gray-600 mb-6">Napakahusay mo! Nakumpleto mo ang level na ito.</p>

          {/* Metrics */}
          <div className="space-y-4 mb-6">
            <div className="text-xl font-extrabold text-green-600">+ {displayXp} XP</div>
            <div>
              <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                <span>Section progress</span>
                <span>{sectionPct}%</span>
              </div>
              <div className="w-full h-2.5 bg-gray-200/80 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${sectionPct}%`, transition: 'width 300ms ease' }} />
              </div>
            </div>
          </div>

          {/* Buttons: primary first */}
          <div className="flex flex-col gap-3">
            {progress['make-sentence'] && (
              <Button 
                autoFocus
                onClick={() => {
                  const gameProgress = progress['make-sentence'];
                  if (gameProgress) {
                    const nextSectionId = gameProgress.currentSection;
                    const nextLevelId = gameProgress.currentLevel;
                    router.push(`/challenges/make-sentence/play?section=${nextSectionId}&level=${nextLevelId}`);
                  } else {
                    router.push('/challenges/make-sentence');
                  }
                }}
                className="w-full py-3 rounded-full bg-duolingo-green hover:bg-duolingo-darkGreen text-white font-bold shadow-md"
              >
                Susunod na Level
              </Button>
            )}
            <Button
              onClick={() => router.push('/challenges/make-sentence')}
              variant="secondary"
              className="w-full py-3 rounded-full border border-gray-300 text-gray-800 bg-white hover:bg-gray-50"
            >
              Bumalik sa Learning Path
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto px-4 py-8 flex flex-col flex-1">
      {/* Progress bar header (single top bar) */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => router.push('/challenges/make-sentence')}
            className="text-gray-600 hover:text-gray-900"
            aria-label="Go back"
          >
            ← Back
          </button>
          <div className="text-sm text-gray-600">Level {sectionId + 1} · Challenge {levelId + 1}</div>
        </div>
        {(() => {
          const pct = tileRounds.length > 0 ? Math.round((tileIndex / Math.max(1, tileRounds.length)) * 100) : 0;
          return (
            <div className="w-full h-[10px] md:h-[14px] bg-gray-200/80 rounded-full overflow-hidden" style={{ boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06)' }}>
              <div className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full relative" style={{ width: `${pct}%`, transition: 'width 240ms cubic-bezier(0.22,1,0.36,1)' }}>
                <div className="absolute inset-0 pointer-events-none bg-white/15" />
              </div>
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
            />
          ) : (
            <div className="text-gray-600">Naglo-load ng mga pangungusap…</div>
          )
        ) : (
          <MakeSentenceGame 
            questionsCount={10}
            levelNumber={sectionId * 10 + levelId}
            onComplete={handleComplete}
          />
        )}
      </div>
      </div>
    </div>
  );
}