'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useGameProgress } from '@/hooks/useGameProgress';
import Button from '@/components/ui/Button';
import * as gameService from '@/services/game';
import * as nlpService from '@/services/nlp';
import { SentenceVerificationResult, MakeSentenceGameData } from '@/types/game';

interface MakeSentenceGameProps {
  questionsCount?: number;
  levelNumber?: number;
  onComplete?: (score: number, levelCompleted: boolean) => void;
}

export default function MakeSentenceGame({ 
  questionsCount = 10,
  levelNumber = 0,
  onComplete
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
  const { addPoints, increaseStreak, data } = useGameProgress();
  
  /************ All Effect Hooks Last ************/
  // Load game data on component mount
  useEffect(() => {
    const loadGame = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await gameService.fetchMakeSentenceGame(questionsCount);
        setGameData(data);
      } catch (err) {
        console.error('Error loading game:', err);
        setError('Hindi ma-load ang laro. Pakisubukang muli.');
      } finally {
        setLoading(false);
      }
    };
    
    loadGame();
  }, [questionsCount]);
  
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
        // Base points for correct answer
        const basePoints = 10;
        let totalPoints = basePoints;
        
        // Update consecutive correct count
        setConsecutiveCorrect(prev => prev + 1);
        
        // Check if streak bonus should be applied (3 or more consecutive)
        if (consecutiveCorrect >= 2) { // Already have 2, this makes 3+
          setStreakBonusActive(true);
          totalPoints += 3; // Bonus points for streak
          
          // TODO: Implement quest completion in new system
          // completeStreakBonusQuest('make-sentence');
        }
        
        addPoints(totalPoints, 'make-sentence');
        increaseStreak();
      } else {
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
      
      const data = await gameService.fetchMakeSentenceGame(questionsCount);
      setGameData(data);
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
    <div className="bg-white rounded-xl shadow-sm p-6 max-w-2xl mx-auto">
      {/* Game header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-center mb-4">Paggawa ng Pangungusap</h1>
        
        {/* Game progress */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500">Progress</span>
            <span className="text-sm font-medium">{gameData.currentIndex + 1} of {gameData.totalQuestions}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
        </div>
        
        {/* Score */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-right">
            <span className="text-sm text-gray-500">Score: </span>
            <span className="text-lg font-bold text-blue-600">{gameData.score}</span>
            {streakBonusActive && <span className="text-red-500 ml-1">🔥</span>}
          </div>
        </div>
      </div>
      
      {/* Current word */}
      {currentWord && !currentResult && (
        <div className="mb-6">
          <div className="p-4 bg-blue-50 rounded-lg mb-4">
            <div className="text-sm text-gray-600 mb-1">Gamiting ang salitang:</div>
            <div className="text-xl font-bold text-blue-800">{currentWord.word}</div>
            <div className="text-sm text-gray-600 mt-2">{currentWord.description}</div>
          </div>
          
          <p className="text-gray-700 mb-6">
            Gumawa ng isang pangungusap na gumagamit ng salitang <strong>{currentWord.word}</strong>.
          </p>
          
          {/* Input form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <textarea 
                ref={inputRef}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Isulat ang iyong pangungusap dito..."
                value={inputSentence}
                onChange={(e) => setInputSentence(e.target.value)}
                disabled={isSubmitting}
                autoFocus
              />
            </div>
            
            <div className="flex gap-3">
              <Button 
                type="submit" 
                className="flex-1"
                loading={isSubmitting}
                disabled={isSubmitting || !inputSentence.trim()}
              >
                I-check ang Pangungusap
              </Button>
            </div>
          </form>
        </div>
      )}
      
      {/* Feedback after submission */}
      {currentResult && (
        <div className="mb-6">
          <div className="p-4 bg-blue-50 rounded-lg mb-4">
            <div className="text-sm text-gray-600 mb-1">Gamiting ang salitang:</div>
            <div className="text-xl font-bold text-blue-800">{currentResult.word}</div>
          </div>
          
          <div className="mb-4">
            <div className="text-sm text-gray-600 mb-1">Iyong pangungusap:</div>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              {currentResult.sentence}
            </div>
          </div>
          
          {/* Feedback */}
          <div className={`mb-6 p-4 rounded-lg ${
            currentResult.isCorrect 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            <div className="font-semibold mb-1">
              {currentResult.isCorrect ? '✓ Tama!' : '✗ May Problema'}
            </div>
            <div>{currentResult.feedback}</div>
          </div>
          
          {/* Next button */}
          <Button 
            onClick={handleNextWord} 
            className="w-full"
          >
            {gameData.currentIndex < gameData.totalQuestions - 1 
              ? 'Susunod na Salita' 
              : 'Tapusin ang Laro'}
          </Button>
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
                <div className="mt-1">{item.sentence}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}