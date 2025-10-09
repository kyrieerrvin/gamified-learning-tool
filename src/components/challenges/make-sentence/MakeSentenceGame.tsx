'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useGameProgress } from '@/hooks/useGameProgress';
import Button from '@/components/ui/Button';
import * as gameService from '@/services/game';
import * as nlpService from '@/services/nlp';
import { SentenceVerificationResult, MakeSentenceGameData } from '@/types/game';
import { motion } from 'framer-motion';
import Image from 'next/image';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - allow importing asset for dev reliability
import mascot from '../../../../assets/talking.gif';

interface MakeSentenceGameProps {
  questionsCount?: number;
  levelNumber?: number;
  onComplete?: (score: number, levelCompleted: boolean) => void;
  onStreakChange?: (streak: number) => void;
}

export default function MakeSentenceGame({ 
  questionsCount = 1,
  levelNumber = 0,
  onComplete,
  onStreakChange
}: MakeSentenceGameProps) {
  /************ All State Hooks First ************/
  // Game state
  const [gameData, setGameData] = useState<MakeSentenceGameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inputSentence, setInputSentence] = useState('');
  const [currentResult, setCurrentResult] = useState<SentenceVerificationResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  
  // Track if this is the first mistake on this question
  const [firstMistake, setFirstMistake] = useState<Record<number, boolean>>({});
  
  // Track consecutive correct answers for streak bonus
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [streakBonusActive, setStreakBonusActive] = useState(false);
  
  /************ All Ref Hooks Next ************/
  // Ref for input field to focus after submission
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  /************ All Custom/Library Hooks Next ************/
  // Global game store
  const { addPoints, increaseStreak, data, updateData, setQuests } = useGameProgress();

  // Notify parent of streak changes (for header indicator)
  useEffect(() => {
    if (onStreakChange) onStreakChange(consecutiveCorrect);
  }, [consecutiveCorrect, onStreakChange]);
  
  /************ All Effect Hooks Last ************/
  // Load game data when grade level is available
  useEffect(() => {
    const loadGame = async () => {
      try {
        // Wait for user profile to load to get grade level
        if (!data || !data.profile || !data.profile.gradeLevel) {
          return;
        }
        setLoading(true);
        setError(null);
        const grade = data.profile.gradeLevel as any;
        const game = await gameService.fetchMakeSentenceGame(questionsCount, grade);
        setGameData(game);
      } catch (err) {
        console.error('Error loading game:', err);
        setError('Hindi ma-load ang laro. Pakisubukang muli.');
      } finally {
        setLoading(false);
      }
    };
    loadGame();
  }, [questionsCount, data?.profile?.gradeLevel]);
  
  // Handle completion callback - this hook MUST be called in EVERY render
  useEffect(() => {
    // Only call onComplete if the game is over, we have game data, and an onComplete callback exists
    if (onComplete && gameOver && gameData) {
      const correctCount = gameData.history.filter(item => item.isCorrect).length;
      const levelCompleted = correctCount >= 7; // Consider level completed if 70%+ correct
      onComplete(gameData.score, levelCompleted);
    }
  }, [onComplete, gameOver, gameData]);
  
  /************ Helper Functions ************/
  // Get current word
  const getCurrentWord = () => {
    if (!gameData || gameData.currentIndex >= gameData.words.length) {
      return null;
    }
    return gameData.words[gameData.currentIndex];
  };
  
  // Calculate progress percentage
  const getProgressPercentage = () => {
    if (!gameData) return 0;
    return (gameData.currentIndex / gameData.totalQuestions) * 100;
  };
  
  // Calculate correct count for progress display
  const getCorrectCount = () => {
    if (!gameData) return 0;
    return gameData.history.filter(item => item.isCorrect).length;
  };
  
  // Determine if level is completed
  const isLevelCompleted = () => {
    return getCorrectCount() >= 7; // Consider level completed if 70%+ correct
  };
  
  /************ Event Handlers ************/
  // Handle sentence submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!gameData || isSubmitting || !inputSentence.trim()) {
      return;
    }
    
    const currentWord = getCurrentWord();
    if (!currentWord) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Verify the sentence
      const { gameData: updatedGameData, result } = await gameService.verifyMakeSentence(
        currentWord.word,
        inputSentence,
        gameData
      );
      
      // Update game data and current result
      setGameData(updatedGameData);
      setCurrentResult(result);
      
      // Update global score and streak
      if (result.isCorrect) {
        console.log('[MakeSentenceTyped] Correct');
        // Base points for correct answer
        const basePoints = 10;
        let totalPoints = basePoints;
        
        // Update consecutive correct count
        setConsecutiveCorrect(prev => {
          const next = prev + 1;
          console.log('[MakeSentenceTyped] consecutiveCorrect ->', next);
          return next;
        });
        
        // Check if streak bonus should be applied (3 or more consecutive)
        if (consecutiveCorrect + 1 >= 3) { // use next value to avoid stale closure
          console.log('Currently in an answer streak');
          setStreakBonusActive(true);
          totalPoints += 3; // Bonus points for streak
          
          // Complete the streak-bonus quest for make-sentence and award XP instantly
          if (data?.progress['make-sentence']?.quests) {
            const quests = [...data.progress['make-sentence'].quests];
            const streakBonusQuest = quests.find(q => q.id === 'streak-bonus');
            if (streakBonusQuest && !streakBonusQuest.isCompleted) {
              const before = streakBonusQuest.progress;
              streakBonusQuest.progress = Math.min(streakBonusQuest.progress + 1, streakBonusQuest.target);
              const justCompleted = before < streakBonusQuest.target && streakBonusQuest.progress >= streakBonusQuest.target;
              if (streakBonusQuest.progress >= streakBonusQuest.target) {
                streakBonusQuest.isCompleted = true;
              }
              await setQuests('make-sentence', quests);
              if (justCompleted) {
                await addPoints(streakBonusQuest.reward, 'make-sentence');
              }
            }
          }
        }
        
        addPoints(totalPoints, 'make-sentence');
        increaseStreak();
      } else {
        console.log('[MakeSentenceTyped] Incorrect - resetting consecutiveCorrect');
        // Don't reset streak on incorrect answers for daily streak
        // But do reset the consecutive correct answers streak
        setConsecutiveCorrect(0);
        setStreakBonusActive(false);
        
        // Subtract points for wrong answer, but don't go below 0
        addPoints(-5, 'make-sentence');
        
        // Track first mistake for this question
        if (!firstMistake[gameData.currentIndex]) {
          setFirstMistake(prev => ({
            ...prev,
            [gameData.currentIndex]: true
          }));
        }
      }
      
      // Check if game is over
      if (updatedGameData.currentIndex >= updatedGameData.totalQuestions) {
        setGameOver(true);
        if (onComplete) {
          onComplete(updatedGameData.score, isLevelCompleted());
        }
      }
      
    } catch (err) {
      console.error('Error verifying sentence:', err);
      setError('Hindi ma-verify ang iyong pangungusap. Pakisubukang muli.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle continuing to next word
  const handleNextWord = () => {
    setInputSentence('');
    setCurrentResult(null);
    
    // Focus on input field
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };
  
  // Restart the game
  const handleRestart = async () => {
    try {
      setLoading(true);
      setError(null);
      setGameOver(false);
      setCurrentResult(null);
      setInputSentence('');
      setConsecutiveCorrect(0);
      setStreakBonusActive(false);
      
      if (!data || !data.profile || !data.profile.gradeLevel) return;
      const grade = data.profile.gradeLevel as any;
      const game = await gameService.fetchMakeSentenceGame(questionsCount, grade);
      setGameData(game);
    } catch (err) {
      console.error('Error restarting game:', err);
      setError('Hindi ma-restart ang laro. Pakisubukang muli.');
    } finally {
      setLoading(false);
    }
  };
  
  /************ Render Logic ************/
  // Loading state
  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-600">Naglo-load...</p>
      </div>
    );
  }
  
  // Error state
  if (error || !gameData) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center">
        <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-4">
          <p>{error || 'Hindi ma-load ang laro. Pakisubukang muli.'}</p>
        </div>
        <Button onClick={() => window.location.reload()}>Subukang Muli</Button>
      </div>
    );
  }
  
  // Current word
  const currentWord = getCurrentWord();
  
  // Game over screen
  if (gameOver) {
    const correctCount = getCorrectCount();
    const levelCompleted = isLevelCompleted();
    
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-center mb-4">Tapos na ang laro!</h1>
        
        {/* Score display */}
        <div className="bg-blue-50 p-6 rounded-lg mb-6 text-center">
          <div className="text-gray-600 mb-2">Iyong iskor</div>
          <div className="text-4xl font-bold text-blue-600">{gameData.score}</div>
          <div className="mt-4">
            <div className="bg-white p-3 rounded-lg">
              <div className="text-sm text-gray-500">Tamang Sagot</div>
              <div className="text-xl font-semibold text-green-600">{correctCount}/{gameData.totalQuestions}</div>
            </div>
          </div>
        </div>
        
        {/* Level completion message */}
        <div className={`p-4 mb-6 text-center rounded-lg ${levelCompleted ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'}`}>
          {levelCompleted 
            ? `Binabati kita! Natapos mo na ang Level ${levelNumber + 1}!` 
            : `Kailangan mong sumagot ng hindi bababa sa 7 tanong nang tama para tapusin ang level.`}
        </div>
        
        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button onClick={handleRestart} className="px-8">
            Maglaro ulit
          </Button>
          <Button 
            onClick={() => {
              // Use window.location.replace to prevent the back button from returning to the game
              window.location.replace('/challenges/make-sentence');
            }}
            variant="secondary"
            className="px-8"
          >
            Bumalik sa mapa
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full flex flex-col items-center">
      {/* Character + title + helper */}
      {currentWord && !currentResult && (
        <div className="max-w-5xl w-full mx-auto mb-4">
          <div className="flex items-start gap-5">
            <div className="shrink-0">
              <Image src={mascot} alt="Mascot" width={256} height={128} className="" />
            </div>
            <div className="flex-1">
              <div className="text-center md:text-left">
                <div className="inline-flex items-center gap-2">
                  {/* {consecutiveCorrect >= 3 && !currentResult && (
                    <span className="text-5xl" aria-label="streak-indicator" title="Tatlong o mahigit na sunod sunod na tamang sagot!">🔥</span>
                  )} */}
                  <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900">Buuin ang pangungusap</h1>
                </div>
              </div>
              <div className="mt-3 inline-block bg-blue-50 rounded-2xl p-6 text-blue-900 font-sans">
                <div className="text-lg md:text-2xl font-semibold tracking-tight">Gamitin ang salitang</div>
                <div className="mt-3 inline-block px-5 py-2 rounded-full bg-blue-600 text-white font-extrabold text-lg md:text-xl">{currentWord.word}</div>
                {currentWord.description && (
                  <div className="mt-3 text-base md:text-lg text-blue-700">{currentWord.description}</div>
                )}
                <div className="text-lg md:text-2xl font-semibold tracking-tight">sa isang pangungusap.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* The main card: ONLY the input box and the button */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="bg-white rounded-2xl shadow-lg p-8 max-w-5xl w-full mx-auto -mt-6"
      >
        {currentWord && !currentResult && (
          <form onSubmit={handleSubmit} className="flex flex-col">
            <textarea
              ref={inputRef}
              className="w-full p-6 rounded-2xl bg-gray-50 border-2 border-blue-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-lg md:text-xl font-sans"
              rows={6}
              placeholder="Isulat ang iyong pangungusap dito…"
              value={inputSentence}
              onChange={(e) => setInputSentence(e.target.value)}
              disabled={isSubmitting}
              autoFocus
            />

            <div className="mt-8 flex justify-end">
              <motion.div whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.02 }}>
                <Button
                  type="submit"
                  className="rounded-[28px] px-10 py-4 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-extrabold shadow-md text-base md:text-lg font-sans tracking-tight"
                  loading={isSubmitting}
                  disabled={isSubmitting || !inputSentence.trim()}
                >
                  I-check
                </Button>
              </motion.div>
            </div>
          </form>
        )}
      
      {/* Feedback after submission */}
      {currentResult && (
        <div className="mb-6">
          {/* Keep results inside card only */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            {(currentResult as any).sentence}
          </div>

          {/* Feedback with playful animation */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0, boxShadow: currentResult.isCorrect ? '0 0 0 0 rgba(34,197,94,0)' : undefined }}
            className={`mb-6 p-4 rounded-lg ${
              currentResult.isCorrect
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            <div className="font-semibold mb-1">
              {currentResult.isCorrect ? '✓ Tama!' : '✗ May Problema'}
            </div>
            <div>{currentResult.feedback}</div>
          </motion.div>

          {/* Next button */}
          <div className="flex justify-end">
            <Button onClick={handleNextWord} className="rounded-[24px] px-6 py-3">
              {gameData.currentIndex < gameData.totalQuestions - 1 ? 'Susunod na Salita' : 'Tapusin ang Laro'}
            </Button>
          </div>
        </div>
      )}
      
      {/* Previous answers */}
      {gameData.history.length > 0 && !currentResult && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Mga Nakaraang Sagot</h2>
          
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {gameData.history.slice().reverse().map((item, index) => (
              <div 
                key={index} 
                className={`p-3 rounded-lg text-sm ${
                  item.isCorrect 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                <div className="font-medium">{item.word}</div>
                <div className="mt-1">{(item as any).sentence || (item as any).userSentence}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      </motion.div>
    </div>
  );
}