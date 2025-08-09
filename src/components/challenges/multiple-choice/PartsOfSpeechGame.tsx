// src/components/challenges/multiple-choice/PartsOfSpeechGame.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useGameProgress } from '@/hooks/useGameProgress';
import Button from '@/components/ui/Button';
import { API_ENDPOINTS } from '@/lib/config';
import { v4 as uuidv4 } from 'uuid';
import ChallengeResultTracker from '@/components/common/ChallengeResultTracker';
import { ChallengeResult } from '@/hooks/useGameProgress';
import { fetchPartsOfSpeechGame } from '@/services/game';
import { POSGameData, POSQuestion } from '@/types/game/index';

// Interface for component props
interface PartsOfSpeechGameProps {
  levelNumber?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  onComplete?: (score: number, levelCompleted: boolean) => void;
}

type DifficultyLevel = 'easy' | 'medium' | 'hard';

export default function PartsOfSpeechGame({ 
  levelNumber = 0,
  difficulty = 'medium',
  onComplete
}: PartsOfSpeechGameProps) {
  // State for the game
  const [data, setData] = useState<POSGameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [score, setScore] = useState(0);
  const [difficultyLevel, setDifficultyLevel] = useState<DifficultyLevel>(difficulty);
  
  // New useGameProgress hook instead of old gameStore
  const { addPoints, increaseStreak, completeLevel, updateData, data: gameData } = useGameProgress();
  
  // Track consecutive correct answers for streak bonus
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [streakBonusActive, setStreakBonusActive] = useState(false);
  
  // Track if this is the first mistake on this question
  const [firstMistake, setFirstMistake] = useState<Record<number, boolean>>({});
  
  // Track game duration
  const [startTime, setStartTime] = useState<number | null>(null);
  const [gameEndTime, setGameEndTime] = useState<number | null>(null);
  
  // Final challenge result
  const [challengeResult, setChallengeResult] = useState<ChallengeResult | null>(null);
  
  // Set start time when component mounts
  useEffect(() => {
    setStartTime(Date.now());
  }, []);
  
  // Determine difficulty based on level number
  useEffect(() => {
    let newDifficulty: DifficultyLevel = 'easy';
    
    if (levelNumber <= 1) {
      newDifficulty = 'easy';
    } else if (levelNumber <= 3) {
      newDifficulty = 'medium';
    } else {
      newDifficulty = 'hard';
    }
    
    setDifficultyLevel(newDifficulty);
  }, [levelNumber]);
  
  // Initialize game data
  useEffect(() => {
    loadGameData();
  }, [difficultyLevel]);
  
  async function loadGameData() {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch game data from the NLP API
      const gameData = await fetchPartsOfSpeechGame(difficultyLevel);
      console.log('Loaded POS game data from API:', gameData);
      setData(gameData);
    } catch (err) {
      console.error('Error loading game data:', err);
      setError('Failed to load game data. Please try again.');
    } finally {
      setLoading(false);
    }
  }
  
  // Helper to get the current question
  const getCurrentQuestion = (): POSQuestion | null => {
    if (!data || !data.questions || data.questions.length === 0) {
      return null;
    }
    return data.questions[currentQuestionIndex];
  };
  
  // Helper to format options as Tagalog (English)
  const getTagalogTermForPOS = (pos: string) => {
    const tagalogTerms: Record<string, string> = {
      "Noun": "Pangngalan",
      "Verb": "Pandiwa",
      "Adjective": "Pang-uri",
      "Adverb": "Pang-abay",
      "Pronoun": "Panghalip",
      "Preposition": "Pang-ukol",
      "Conjunction": "Pangatnig",
      "Interjection": "Pandamdam",
      "Article": "Pantukoy"
    };
    
    return tagalogTerms[pos] || pos;
  };
  
  // Handle option selection
  const handleOptionSelect = async (option: string) => {
    setSelectedOption(option);
    
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return;
    
    const isOptionCorrect = option === currentQuestion.correctAnswer;
    setIsCorrect(isOptionCorrect);
    
    // Add points for correct answer
    if (isOptionCorrect) {
      // Base points for correct answer
      const basePoints = 10;
      let totalPoints = basePoints;
      
      // Update consecutive correct count
      setConsecutiveCorrect(prev => prev + 1);
      
      // Check if streak bonus should be applied (3 or more consecutive)
      if (consecutiveCorrect >= 2) { // Already have 2, this makes 3+
        setStreakBonusActive(true);
        totalPoints += 3; // Bonus points for streak
        
        // Complete the streak-bonus quest manually
        if (gameData?.progress['multiple-choice']?.quests) {
          const quests = [...gameData.progress['multiple-choice'].quests];
          const streakBonusQuest = quests.find(q => q.id === 'streak-bonus');
          if (streakBonusQuest && !streakBonusQuest.isCompleted) {
            streakBonusQuest.progress = Math.min(streakBonusQuest.progress + 1, streakBonusQuest.target);
            if (streakBonusQuest.progress >= streakBonusQuest.target) {
              streakBonusQuest.isCompleted = true;
            }
            
            // Update the quests data
            await updateData({
              progress: {
                ...gameData.progress,
                'multiple-choice': {
                  ...gameData.progress['multiple-choice'],
                  quests
                }
              }
            });
          }
        }
      }
      
      setScore(prevScore => prevScore + totalPoints);
      await addPoints(totalPoints, 'multiple-choice');
      await increaseStreak(); 
      setFeedback('Tama! Magaling!');
    } else {
      // Don't reset streak on incorrect answers for daily streak
      // But do reset the consecutive correct answers streak
      setConsecutiveCorrect(0);
      setStreakBonusActive(false);
      
      // Subtract points for wrong answer, but don't go below 0
      setScore(prevScore => Math.max(0, prevScore - 5));
      await addPoints(-5, 'multiple-choice');
      
      setFeedback(`Hindi tama. Ang tamang sagot ay "${currentQuestion.correctAnswer}".`);
      
      // Track if this is the first mistake on this question
      if (!firstMistake[currentQuestionIndex]) {
        setFirstMistake(prev => ({
          ...prev,
          [currentQuestionIndex]: true
        }));
      }
    }
    
    // Wait before enabling the Next button
    setTimeout(() => {
      setIsTransitioning(false);
    }, 500);
  };
  
  // Handle moving to the next question
  const handleNextQuestion = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setTimeout(() => {
      setSelectedOption(null);
      setFeedback(null);
      setIsCorrect(null);
      
      if (currentQuestionIndex < (data?.questions.length || 0) - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        // Game over
        finishGame();
      }
      
      setIsTransitioning(false);
    }, 500);
  };
  
  // Handle game completion
  const handleGameCompletion = async () => {
    if (gameOver) return; // Prevent multiple calls
    
    setGameOver(true);
    
    // Calculate final score percentage
    const finalScore = Math.round((score / (data?.questions.length || 1)) * 100);
    
    // Create result record
    const result: ChallengeResult = {
      id: uuidv4(),
      challengeType: 'multiple-choice',
      score: finalScore,
      maxScore: 100,
      completedAt: new Date().toISOString(),
      duration: startTime ? Math.floor((Date.now() - (startTime || 0)) / 1000) : 0,
      isCorrect: finalScore >= 80,
      gameType: 'multiple-choice'
    };
    
    setChallengeResult(result);
    
    // Update database with game progress
    if (typeof levelNumber === 'number' && gameData) {
      // Map difficulty to section ID
      const sectionMap = { 'easy': 0, 'medium': 1, 'hard': 2 };
      const sectionId = sectionMap[difficultyLevel] || 0;
      
      // Complete the level in the database
      await completeLevel('multiple-choice', sectionId, levelNumber, finalScore);
      
      // Update quest progress for completing games
      const quests = [...(gameData.progress['multiple-choice']?.quests || [])];
      const completeGamesQuest = quests.find(q => q.id === 'complete-games');
      if (completeGamesQuest && !completeGamesQuest.isCompleted) {
        completeGamesQuest.progress = Math.min(completeGamesQuest.progress + 1, completeGamesQuest.target);
        if (completeGamesQuest.progress >= completeGamesQuest.target) {
          completeGamesQuest.isCompleted = true;
        }
        
        // Update the quests data
        await updateData({
          progress: {
            ...gameData.progress,
            'multiple-choice': {
              ...gameData.progress['multiple-choice'],
              quests
            }
          }
        });
      }
      
      console.log(`[GameCompletion] Saved progress to database. Level: ${levelNumber}, Section: ${sectionId}`);
    }
    
    // Call the onComplete callback with the final score
    if (onComplete) {
      // Consider the level completed if the score is at least 80%
      const levelCompleted = finalScore >= 80;
      onComplete(finalScore, levelCompleted);
    }
  };
  
  // Finish the game and calculate final score
  const finishGame = async () => {
    setGameEndTime(Date.now());
    setGameOver(true);
    
    // Calculate final score
    const correctAnswers = score / 10;
    const totalQuestions = data?.questions.length || 0;
    const finalScore = Math.round((correctAnswers / totalQuestions) * 100);
    
    // Create challenge result
    const result: ChallengeResult = {
      id: uuidv4(),
      challengeType: 'multiple-choice',
      score: finalScore,
      maxScore: 100,
      completedAt: new Date().toISOString(),
      duration: startTime ? Math.floor((Date.now() - (startTime || 0)) / 1000) : 0,
      isCorrect: finalScore >= 80,
      gameType: 'multiple-choice'
    };
    
    setChallengeResult(result);
    
    // Update database with game progress
    if (typeof levelNumber === 'number' && gameData) {
      // Map difficulty to section ID
      const sectionMap = { 'easy': 0, 'medium': 1, 'hard': 2 };
      const sectionId = sectionMap[difficultyLevel] || 0;
      
      // Complete the level in the database
      await completeLevel('multiple-choice', sectionId, levelNumber, finalScore);
      
      // Update quest progress for completing games
      const quests = [...(gameData.progress['multiple-choice']?.quests || [])];
      const completeGamesQuest = quests.find(q => q.id === 'complete-games');
      if (completeGamesQuest && !completeGamesQuest.isCompleted) {
        completeGamesQuest.progress = Math.min(completeGamesQuest.progress + 1, completeGamesQuest.target);
        if (completeGamesQuest.progress >= completeGamesQuest.target) {
          completeGamesQuest.isCompleted = true;
        }
        
        // Update the quests data
        await updateData({
          progress: {
            ...gameData.progress,
            'multiple-choice': {
              ...gameData.progress['multiple-choice'],
              quests
            }
          }
        });
      }
      
      console.log(`[GameCompletion] Saved progress to database. Level: ${levelNumber}, Section: ${sectionId}`);
    }
    
    // Call the onComplete callback with the final score
    if (onComplete) {
      // Consider the level completed if the score is at least 80%
      const levelCompleted = finalScore >= 80;
      onComplete(finalScore, levelCompleted);
    }
  };
  
  // Render loading state
  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-duolingo-blue mx-auto mb-4"></div>
        <p className="text-lg text-gray-600">Naglo-load ang game...</p>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mx-auto mb-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <h2 className="text-xl font-bold text-red-800 mb-2">May Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadGameData} className="bg-red-100 text-red-800 hover:bg-red-200">
            Subukan Ulit
          </Button>
        </div>
      </div>
    );
  }
  
  // Render game over state
  if (gameOver) {
    const correctAnswers = score / 10;
    const totalQuestions = data?.questions.length || 0;
    const finalScore = Math.round((correctAnswers / totalQuestions) * 100);
    
    return (
      <div className="text-center py-8">
        <div className="bg-duolingo-blue bg-opacity-10 border border-duolingo-blue border-opacity-30 rounded-lg p-6 max-w-md mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-duolingo-blue mx-auto mb-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <h2 className="text-xl font-bold text-duolingo-darkBlue mb-2">Tapos na!</h2>
          <p className="text-lg text-duolingo-darkBlue mb-2">Score: {finalScore}%</p>
          <p className="text-duolingo-blue mb-4">{correctAnswers} sa {totalQuestions} ang tama</p>
          
          <div className="space-y-2">
            <Button onClick={() => window.location.reload()} className="bg-duolingo-blue bg-opacity-20 text-duolingo-darkBlue hover:bg-opacity-30 w-full">
              Subukan Ulit
            </Button>
          </div>
        </div>
        
        {/* Challenge Result Tracker */}
        <ChallengeResultTracker 
          result={challengeResult}
          onResultProcessed={() => setChallengeResult(null)}
        />
      </div>
    );
  }
  
  // Get the current question
  const question = getCurrentQuestion();
  
  if (!question) {
    return (
      <div className="text-center py-8">
        <p className="text-lg text-gray-600">Walang mga tanong na available. Please try again later.</p>
        <Button onClick={loadGameData} className="mt-4">
          Subukan Ulit
        </Button>
      </div>
    );
  }
  
  // Render the game
  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress indicator */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Question {currentQuestionIndex + 1} of {data?.questions.length}</span>
          <span>
            {streakBonusActive && <span className="text-red-500 mr-1">🔥</span>}
            Score: {score}
          </span>
        </div>
        <div className="bg-gray-200 h-2 rounded-full">
          <div 
            className="bg-duolingo-blue h-2 rounded-full transition-all duration-500"
            style={{ width: `${((currentQuestionIndex) / (data?.questions.length || 1)) * 100}%` }}
          ></div>
        </div>
      </div>
      
      {/* Question and Sentence */}
      <div className="bg-white shadow-md rounded-lg border border-gray-200 p-6 mb-6">
        {/* Show the sentence prominently at the top */}
        {data?.sentence && (
          <div className="mb-5 text-lg font-medium text-gray-800 border-b pb-4 border-gray-100">
            {data.sentence}
          </div>
        )}
        
        <div className="text-2xl font-bold text-duolingo-darkBlue">
          {question.question}
        </div>
      </div>
      
      {/* Options */}
      <div className="space-y-3 my-6">
        {question.options
          // Filter out punctuation options which are too obvious
          .filter(option => !['Punctuation', 'Bantas'].includes(option))
          .map(option => {
            // Format the option to show only once, e.g. "Pang-Uri (Adjective)"
            const tagalogTerm = getTagalogTermForPOS(option);
            // If the option is already in Tagalog, show with English translation
            // If the option is in English, show with Tagalog translation
            const displayOption = option === tagalogTerm 
              ? `${tagalogTerm}` 
              : `${tagalogTerm} (${option})`;
            
            return (
              <button
                key={option}
                className={`w-full text-left p-4 rounded-lg transition-all duration-200 
                  ${selectedOption === option 
                    ? isCorrect 
                      ? 'bg-green-100 border-2 border-green-500 text-green-800' 
                      : 'bg-red-100 border-2 border-red-500 text-red-800'
                    : selectedOption
                      ? 'bg-gray-100 text-gray-500'
                      : 'bg-duolingo-blue bg-opacity-10 border border-duolingo-blue text-duolingo-darkBlue hover:bg-opacity-20'
                  }`}
                onClick={() => handleOptionSelect(option)}
                disabled={!!selectedOption}
              >
                {displayOption}
              </button>
            );
          })}
      </div>
      
      {/* Feedback */}
      {feedback && (
        <div className={`text-center py-3 px-4 rounded-lg mb-6 ${
          isCorrect ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {feedback}
        </div>
      )}
      
      {/* Actions */}
      <div className="flex justify-between mt-6">
        <Button 
          onClick={handleNextQuestion} 
          disabled={!selectedOption}
          className="bg-duolingo-blue text-white hover:bg-duolingo-darkBlue"
        >
          {currentQuestionIndex >= (data?.questions.length || 0) - 1 ? 'Finish' : 'Next'}
        </Button>
      </div>
    </div>
  );
}