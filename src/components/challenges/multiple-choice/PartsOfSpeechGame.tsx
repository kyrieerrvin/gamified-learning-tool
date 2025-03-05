// src/components/challenges/multiple-choice/PartsOfSpeechGame.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import Button from '@/components/ui/Button';
import { fetchGameData, GameData } from '@/services/gameService';
import { fetchNlpGameData, checkNlpHealth } from '@/services/nlpService';
import { API_ENDPOINTS } from '@/lib/config';

interface PartsOfSpeechGameProps {
  difficulty?: 'easy' | 'medium' | 'hard';
}

export default function PartsOfSpeechGame({ difficulty = 'medium' }: PartsOfSpeechGameProps) {
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
  
  // Game store for managing global score and streak
  const { addPoints, increaseStreak, resetStreak } = useGameStore();
  
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

  // Fetch game data from either NLP API or traditional API
  useEffect(() => {
    // Only run on the client side
    if (typeof window === 'undefined') {
      return;
    }
    
    const loadGameData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Add a retry mechanism for API requests
        let attempts = 0;
        const maxAttempts = 3;
        let gameData = null;
        
        while (attempts < maxAttempts && !gameData) {
          try {
            console.log(`Attempt ${attempts + 1}: Fetching game data with difficulty '${difficulty}'`);
            
            // Store server/port info when received for future connections
            const storeServerInfo = (data: any) => {
              if (data?.source && typeof window !== 'undefined') {
                try {
                  // Only access localStorage if we're in a browser environment
                  if (typeof localStorage !== 'undefined') {
                    localStorage.setItem('nlp_source', data.source);
                    if (data.port) {
                      localStorage.setItem('calamancy_api_port', data.port.toString());
                    }
                  }
                } catch (e) {
                  console.warn('Failed to save server info:', e);
                }
              }
            };
            
            // Always try direct connection to NLP API first
            try {
              // Make sure we're in a browser environment with fetch available
              if (typeof window === 'undefined') {
                throw new Error('Not in browser environment, skipping direct API connection');
              }
              
              console.log('Directly connecting to NLP API for game data...');
              const response = await fetch(`${API_ENDPOINTS.API_BASE_URL}/api/pos-game?difficulty=${difficulty}`, {
                method: 'GET',
                headers: {
                  'Accept': 'application/json'
                }
              });
              
              if (response.ok) {
                const nlpData = await response.json();
                if (nlpData && nlpData.sentence && nlpData.questions) {
                  console.log('Successfully received game data directly from NLP API:', nlpData);
                  setUseNlpApi(true);
                  gameData = nlpData;
                } else {
                  throw new Error('Invalid data structure');
                }
              } else {
                throw new Error(`Status: ${response.status}`);
              }
            } catch (directError) {
              console.error('Error with direct NLP API connection:', directError);
              
              // Fall back to our service methods
              if (useNlpApi) {
                console.log('Falling back to nlpService...');
                try {
                  gameData = await fetchNlpGameData(difficulty);
                  console.log('Successfully received game data from NLP service:', gameData);
                } catch (nlpError) {
                  console.error('Error fetching from NLP service, falling back to traditional API:', nlpError);
                  gameData = await fetchGameData(difficulty);
                }
              } else {
                // If NLP API is not available, use the traditional API
                console.log(`Using traditional API endpoint: ${API_ENDPOINTS.POS_GAME_PROXY}`);
                gameData = await fetchGameData(difficulty);
              }
            }
            
            console.log('Received game data:', gameData);
            
            // Store server info for future connections
            storeServerInfo(gameData);
            
            // Validate the data received
            if (!gameData || !gameData.sentence || !gameData.questions || !Array.isArray(gameData.questions) || gameData.questions.length === 0) {
              console.warn(`Attempt ${attempts + 1}: Received invalid data structure from API:`, gameData);
              gameData = null; // Reset for retry
              throw new Error('Invalid data structure received from API');
            }
            
            // Ensure the options are in random order for each question
            gameData.questions.forEach((question: { options?: string[], id: number, question: string, correctAnswer: string }) => {
              // Create a copy of the options array and shuffle it
              // (Randomize order to avoid having the correct answer always in the same position)
              if (question.options && Array.isArray(question.options) && question.options.length > 0) {
                const shuffledOptions = [...question.options];
                for (let i = shuffledOptions.length - 1; i > 0; i--) {
                  const j = Math.floor(Math.random() * (i + 1));
                  [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
                }
                question.options = shuffledOptions;
              }
            });
            
            setData(gameData);
            console.log('Game data set successfully');
          } catch (fetchError) {
            attempts++;
            console.error(`API fetch attempt ${attempts} failed:`, fetchError);
            
            if (attempts >= maxAttempts) {
              throw fetchError; // Re-throw if we've exhausted all attempts
            }
            
            // Wait a bit before retrying (with exponential backoff)
            const backoffTime = 1000 * Math.pow(2, attempts - 1);
            console.log(`Retrying in ${backoffTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, backoffTime));
          }
        }
      } catch (err) {
        console.error('Error loading game data after all retries:', err);
        setError('Nagkaroon ng problema sa pagkuha ng mga tanong. Pakisubukang muli.');
      } finally {
        setLoading(false);
      }
    };
    
    loadGameData();
  }, [difficulty, useNlpApi]);

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
      }
    }
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
        // Add a completion bonus if score is good
        const correctAnswers = score / 10;
        const totalQuestions = data.questions.length;
        
        if (correctAnswers >= totalQuestions * 0.7) { // 70% or better
          const bonus = 20; // Completion bonus
          addPoints(bonus);
          setScore(prevScore => prevScore + bonus);
        }
      }
      setIsTransitioning(false);
    }, 500);
  };

  // Restart the game
  const handleRestart = async () => {
    setLoading(true);
    try {
      const gameData = await fetchGameData(difficulty);
      setData(gameData);
      setError(null);
      setCurrentQuestionIndex(0);
      setSelectedOption(null);
      setFeedback(null);
      setIsCorrect(null);
      setGameOver(false);
      setScore(0);
    } catch (err) {
      console.error('Error reloading game data:', err);
      setError('Nagkaroon ng problema sa pagkuha ng mga tanong. Pakisubukang muli.');
    } finally {
      setLoading(false);
    }
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
            
            {/* Analysis method indicator */}
            {data.source && (
              <span className={`text-xs px-2 py-1 rounded-full ${
                data.source === 'calamancy' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {data.source === 'calamancy' ? 'AI Analysis' : 'Basic Analysis'}
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

          {/* Next button */}
          {selectedOption && (
            <Button 
              onClick={handleNextQuestion}
              className="w-full"
            >
              {currentQuestionIndex < data.questions.length - 1 ? 'Susunod na Tanong' : 'Tapusin'}
            </Button>
          )}
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
              onClick={() => window.location.href = '/challenges'}
              variant="secondary"
              className="px-8"
            >
              Bumalik sa mga hamon
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}