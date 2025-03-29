// src/components/challenges/multiple-choice/PartsOfSpeechGame.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import Button from '@/components/ui/Button';
import { fetchGameData } from '@/services/game';
import { fetchNlpGameData, checkNlpHealth, GameData } from '@/services/nlp';
import { API_ENDPOINTS } from '@/lib/config';
import { v4 as uuidv4 } from 'uuid';
import ChallengeResultTracker from '@/components/common/ChallengeResultTracker';
import { ChallengeResult } from '@/types/user';
import { useUser } from '@/context/UserContext';

interface PartsOfSpeechGameProps {
  levelNumber?: number;
  onComplete?: (score: number, levelCompleted: boolean) => void;
}

type DifficultyLevel = 'easy' | 'medium' | 'hard';

export default function PartsOfSpeechGame({ 
  levelNumber = 0,
  onComplete
}: PartsOfSpeechGameProps) {
  // State for the game
  const [data, setData] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [score, setScore] = useState(0);
  const [useNlpApi, setUseNlpApi] = useState(false);
  const [nlpStatus, setNlpStatus] = useState<string>('unknown');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('easy');
  
  // Game store for managing global score, streak and hearts
  const { addPoints, increaseStreak, resetStreak, decreaseHeart } = useGameStore();
  
  // Track if this is the first mistake on this question
  const [firstMistake, setFirstMistake] = useState<Record<number, boolean>>({});
  
  // Track skipped questions
  const [skippedQuestions, setSkippedQuestions] = useState<number[]>([]);
  
  // Track game duration
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  
  // Challenge result state for Firestore tracking
  const [challengeResult, setChallengeResult] = useState<ChallengeResult | null>(null);

  // Check for NLP API availability
  useEffect(() => {
    // Only run on the client side
    if (typeof window === 'undefined') {
      return;
    }
    
    const checkNlpApi = async () => {
      try {
        console.log('Checking NLP API availability...');
        const health = await checkNlpHealth();
        if (health.status === 'healthy') {
          console.log(`NLP API is available and healthy. Model status: ${health.model_status}`);
          setUseNlpApi(true);
          setNlpStatus(health.model_status);
        } else {
          console.warn('NLP API is unhealthy, falling back to traditional API');
          setUseNlpApi(false);
        }
      } catch (error) {
        console.warn('NLP API is not available, falling back to traditional API:', error);
        setUseNlpApi(false);
      }
    };
    
    // Wrap in a try-catch to prevent any unhandled errors
    try {
      checkNlpApi();
    } catch (error) {
      console.error('Error checking NLP API:', error);
      setUseNlpApi(false);
    }
  }, []);

  // Set start time when game begins
  useEffect(() => {
    if (data && !loading && !gameOver && startTime === null) {
      setStartTime(Date.now());
    }
  }, [data, loading, gameOver, startTime]);

  // Load game data
  const loadGameData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Use our enhanced NLP service that handles fallbacks properly
      console.log('Loading game data using fetchNlpGameData...');
      const gameData = await fetchNlpGameData(undefined, difficulty);
      
      if (!gameData || !gameData.questions || gameData.questions.length === 0) {
        throw new Error('Invalid game data received');
      }
      
      console.log('Successfully loaded game data:', gameData);
      setData(gameData);
      setUseNlpApi(true);
      
      // Reset game state
      setCurrentQuestionIndex(0);
      setSelectedOption(null);
      setFeedback(null);
      setIsCorrect(null);
      setGameOver(false);
      setScore(0);
    } catch (error) {
      console.error('Error loading game data:', error);
      setUseNlpApi(false);
      setError('Failed to load game data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGameData();
  }, []);

  // Handle user selecting an answer option
  const handleOptionSelect = (option: string) => {
    if (isTransitioning || selectedOption) return; // Prevent multiple selections
    
    setSelectedOption(option);
    const currentQuestion = data?.questions[currentQuestionIndex];
    
    if (currentQuestion) {
      const correct = option === currentQuestion.correctAnswer;
      setIsCorrect(correct);
      
      if (correct) {
        setFeedback(`Tama! ${currentQuestion.explanation}`);
        addPoints(10); // Add points to the global store
        increaseStreak(); // Increase streak in the global store
        setScore(prevScore => prevScore + 10); // Update local score
      } else {
        setFeedback(`Mali. Ang tamang sagot ay ${currentQuestion.correctAnswer}. ${currentQuestion.explanation}`);
        resetStreak(); // Reset streak on wrong answer
        
        // Decrease heart on first mistake for this question
        if (!firstMistake[currentQuestionIndex]) {
          decreaseHeart();
          setFirstMistake(prev => ({
            ...prev,
            [currentQuestionIndex]: true
          }));
        }
      }
    }
  };
  
  // Handle skipping a question
  const handleSkip = () => {
    if (!data) return;
    
    // Don't allow skipping the last question
    if (currentQuestionIndex >= data.questions.length - 1) {
      return;
    }
    
    // Add to skipped questions
    setSkippedQuestions(prev => [...prev, currentQuestionIndex]);
    
    // Save the current question for later
    const currentQuestion = data.questions[currentQuestionIndex];
    
    // Create a new questions array by moving the current question to the end
    const reorderedQuestions = [...data.questions];
    reorderedQuestions.splice(currentQuestionIndex, 1); // Remove current
    reorderedQuestions.push(currentQuestion); // Add to end
    
    // Update the data with reordered questions
    setData({
      ...data,
      questions: reorderedQuestions
    });
    
    setSelectedOption(null);
    setFeedback(null);
    setIsCorrect(null);
  };

  // Move to the next question
  const handleNextQuestion = () => {
    if (!data) return;
    
    setIsTransitioning(true);
    
    setTimeout(() => {
      if (currentQuestionIndex < data.questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedOption(null);
        setFeedback(null);
        setIsCorrect(null);
      } else {
        setGameOver(true);
        // Record end time when the game completes
        setEndTime(Date.now());
        
        // Create the challenge result for Firestore when game is over
        const now = new Date().toISOString();
        const maxScore = data.questions.length * 10;
        const duration = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
        
        setChallengeResult({
          id: uuidv4(),
          challengeType: 'multipleChoice',
          score,
          maxScore,
          completedAt: now,
          duration
        });
        
        // Call onComplete callback if provided
        if (onComplete) {
          onComplete(score, true);
        }
      }
      setIsTransitioning(false);
    }, 500);
  };

  // Restart the game
  const handleRestart = () => {
    // Reset game state
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setScore(0);
    setGameOver(false);
    
    // Load new game data
    loadGameData();
  };

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
  if (error || !data) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center">
        <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-4">
          <p>{error || 'Hindi ma-load ang mga tanong. Pakisubukang muli.'}</p>
        </div>
        <Button onClick={() => window.location.reload()}>Subukang Muli</Button>
      </div>
    );
  }

  const currentQuestion = data.questions[currentQuestionIndex];

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 max-w-2xl mx-auto">
      {/* Game header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-center mb-4">Parts of a Sentence</h1>
        <div className="relative">
          {/* Enhanced API source indicator */}
          <div className="absolute top-0 right-0 -mt-1 -mr-1 flex flex-col gap-1">
            {/* NLP API indicator */}
            {useNlpApi && (
              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                {`Dedicated NLP API (${nlpStatus})`}
              </span>
            )}

          </div>
          
          <p className="text-lg text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
            {data.sentence}
          </p>
        </div>
      </div>

      {/* Game progress */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-500">Progress</span>
          <span className="text-sm font-medium">{currentQuestionIndex + 1} of {data.questions.length}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${((currentQuestionIndex + 1) / data.questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Question and options */}
      {!gameOver ? (
        <div className={`transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
          <h2 className="text-xl font-medium mb-6">
            {currentQuestion.question}
          </h2>
          
          <div className="grid grid-cols-1 gap-3 mb-6">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleOptionSelect(option)}
                disabled={selectedOption !== null}
                className={`py-3 px-4 rounded-lg text-left transition-all ${
                  selectedOption === option
                    ? isCorrect
                      ? 'bg-green-100 border-green-300 text-green-800'
                      : 'bg-red-100 border-red-300 text-red-800'
                    : selectedOption !== null && option === currentQuestion.correctAnswer
                    ? 'bg-green-100 border-green-300 text-green-800'
                    : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                } ${selectedOption === null ? 'hover:scale-[1.01]' : ''}`}
              >
                {option}
              </button>
            ))}
          </div>

          {/* Feedback section */}
          {feedback && (
            <div className={`mb-6 p-4 rounded-lg ${isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {feedback}
            </div>
          )}

          {/* Next or Skip buttons */}
          <div className="flex gap-3">
            {selectedOption ? (
              <Button 
                onClick={handleNextQuestion}
                className="flex-1"
              >
                {currentQuestionIndex < data.questions.length - 1 ? 'Susunod na Tanong' : 'Tapusin'}
              </Button>
            ) : (
              <>
                {/* Skip button - disabled for last question */}
                {currentQuestionIndex < data.questions.length - 1 && (
                  <Button 
                    onClick={handleSkip}
                    variant="secondary"
                    className="flex-1"
                  >
                    Laktawan
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        /* Game over screen */
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Natapos mo na ang laro!</h2>
          
          {/* Score display */}
          <div className="bg-blue-50 p-6 rounded-lg mb-6 inline-block">
            <div className="text-gray-600 mb-2">Iyong iskor</div>
            <div className="text-4xl font-bold text-blue-600">{score}</div>
            <div className="text-sm text-gray-500 mt-2">
              {score >= data.questions.length * 10 
                ? "Perpekto! Napakahusay!" 
                : score >= data.questions.length * 7 
                  ? "Magaling! Halos perpekto!" 
                  : score >= data.questions.length * 5 
                    ? "Mabuti! Patuloy lang sa pag-aaral."
                    : "Magpatuloy sa pag-aaral. Kaya mo yan!"}
            </div>
          </div>
          
          <p className="text-lg mb-6">
            Maraming salamat sa paglalaro! Subukan mo ulit para lalo mong maintindihan 
            ang mga bahagi ng pangungusap sa Tagalog.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button onClick={handleRestart} className="px-8">
              Maglaro ulit
            </Button>
            <Button 
              onClick={() => {
                // Use window.location.replace to prevent the back button from returning to the game
                window.location.replace('/challenges/multiple-choice');
              }}
              variant="secondary"
              className="px-8"
            >
              Bumalik sa mapa
            </Button>
          </div>
        </div>
      )}
      
      {/* Challenge Result Tracker - This records game results to Firestore */}
      <ChallengeResultTracker 
        result={challengeResult} 
        onResultProcessed={() => setChallengeResult(null)} 
      />
    </div>
  );
}