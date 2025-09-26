'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import MakeSentenceGame from '@/components/challenges/make-sentence/MakeSentenceGame';
import SentenceTileGame from '@/components/challenges/make-sentence/SentenceTileGame';
import { useGameProgress } from '@/hooks/useGameProgress';
import Button from '@/components/ui/Button';
import { apiGet } from '@/utils/api';

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
        // Take first 5 (or fewer if not enough)
        const selected = candidates.slice(0, 5);
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
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-duolingo-green"></div>
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
              <div className="mx-auto w-24 h-24 bg-duolingo-green rounded-full flex items-center justify-center mb-4">
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
              <div className="bg-duolingo-green h-6 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ width: `${score}%` }}>
                {score}%
              </div>
            </div>
            */}
            <div className="mb-6">
              <p className="text-lg font-bold text-duolingo-green">+ {Math.floor(score)} XP</p>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => router.push('/challenges/make-sentence')}
              className="bg-duolingo-green hover:bg-duolingo-darkGreen text-white py-3 px-6 rounded-xl font-bold shadow-md hover:shadow-lg transition-all"
            >
              Bumalik sa Learning Path
            </Button>
            
            {score >= 80 && progress['make-sentence'] && (
              <Button 
                onClick={() => {
                  // Use the currentSection and currentLevel to navigate to the next level
                  const gameProgress = progress['make-sentence'];
                  if (gameProgress) {
                    // These values are automatically updated in completeLevel function
                    const nextSectionId = gameProgress.currentSection;
                    const nextLevelId = gameProgress.currentLevel;
                    
                    console.log(`[Navigation] Going to next level: Section ${nextSectionId}, Level ${nextLevelId}`);
                    
                    // Navigate to the next level using the stored values
                    router.push(`/challenges/make-sentence/play?section=${nextSectionId}&level=${nextLevelId}`);
                  } else {
                    // Fallback to challenges page if no progress data
                    router.push('/challenges/make-sentence');
                  }
                }}
                className="w-full bg-duolingo-green text-white hover:bg-duolingo-darkGreen"
              >
                Susunod na Level
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto px-4 py-8 flex flex-col flex-1">
      {/* Temporary progress bar header */}
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
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-duolingo-green h-2 rounded-full" style={{ width: '15%' }}></div>
        </div>
      </div>
      
      {/* Centered game area */}
      <div className="flex-1 flex items-center justify-center">
        {(sectionId === 0 || sectionId === 1) ? (
          tileRounds.length > 0 ? (
            <SentenceTileGame
              sampleSentence={tileRounds[Math.min(tileIndex, tileRounds.length - 1)].sentence}
              focusWord={tileRounds[Math.min(tileIndex, tileRounds.length - 1)].focusWord}
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