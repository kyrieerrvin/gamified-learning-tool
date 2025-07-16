'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { motion } from 'framer-motion';

export default function LevelCompletionTest() {
  const { 
    progress, 
    completeLevel, 
    canAccessLevel, 
    loadUserProgress, 
    saveUserProgress,
    initializeGameProgress 
  } = useGameStore();
  
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const gameTypes = ['make-sentence', 'multiple-choice'];
  
  // Initialize progress for all game types
  useEffect(() => {
    gameTypes.forEach(gameType => {
      initializeGameProgress(gameType);
    });
  }, []);
  
  const runLevelCompletionTest = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    const results = [];
    
    for (const gameType of gameTypes) {
      try {
        // Test 1: Complete a level and verify it's marked as completed
        console.log(`Testing level completion for ${gameType}...`);
        
        // Get initial state
        const initialState = progress[gameType];
        const initialLevel = initialState?.sections?.[0]?.levels?.[0];
        
        results.push({
          test: `${gameType} - Initial Level 0,0`,
          before: {
            isCompleted: initialLevel?.isCompleted || false,
            isLocked: initialLevel?.isLocked || true,
            bestScore: initialLevel?.bestScore || 0,
            attempts: initialLevel?.attempts || 0
          },
          status: 'info'
        });
        
        // Complete the level with a score of 85
        completeLevel(gameType, 0, 0, 85);
        
        // Wait for state to update
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check if level was completed
        const afterState = progress[gameType];
        const completedLevel = afterState?.sections?.[0]?.levels?.[0];
        
        results.push({
          test: `${gameType} - Level 0,0 Completion`,
          after: {
            isCompleted: completedLevel?.isCompleted || false,
            isLocked: completedLevel?.isLocked || true,
            bestScore: completedLevel?.bestScore || 0,
            attempts: completedLevel?.attempts || 0
          },
          expected: {
            isCompleted: true,
            bestScore: 85,
            attempts: 1
          },
          status: completedLevel?.isCompleted ? 'success' : 'error'
        });
        
        // Test 2: Verify next level is unlocked
        const nextLevel = afterState?.sections?.[0]?.levels?.[1];
        results.push({
          test: `${gameType} - Next Level 0,1 Unlocked`,
          result: {
            isLocked: nextLevel?.isLocked || true
          },
          expected: {
            isLocked: false
          },
          status: !nextLevel?.isLocked ? 'success' : 'error'
        });
        
        // Test 3: Save to database and reload
        await saveUserProgress();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Reload from database
        await loadUserProgress();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check if completion persisted
        const persistedState = progress[gameType];
        const persistedLevel = persistedState?.sections?.[0]?.levels?.[0];
        
        results.push({
          test: `${gameType} - Persistence Test`,
          persisted: {
            isCompleted: persistedLevel?.isCompleted || false,
            bestScore: persistedLevel?.bestScore || 0,
            attempts: persistedLevel?.attempts || 0
          },
          expected: {
            isCompleted: true,
            bestScore: 85,
            attempts: 1
          },
          status: persistedLevel?.isCompleted ? 'success' : 'error'
        });
        
      } catch (error) {
        results.push({
          test: `${gameType} - Error`,
          error: error instanceof Error ? error.message : 'Unknown error',
          status: 'error'
        });
      }
    }
    
    setTestResults(results);
    setIsLoading(false);
  };
  
  const resetProgress = () => {
    gameTypes.forEach(gameType => {
      initializeGameProgress(gameType);
    });
    setTestResults([]);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-md border border-gray-100 p-6 space-y-4"
    >
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Level Completion Test</h3>
        <div className="flex gap-2">
          <button
            onClick={resetProgress}
            className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
          >
            Reset
          </button>
          <button
            onClick={runLevelCompletionTest}
            disabled={isLoading}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? 'Testing...' : 'Run Test'}
          </button>
        </div>
      </div>
      
      <div className="text-sm text-gray-600 mb-4">
        This test verifies that level completion is properly tracked and persisted to the database.
      </div>
      
      {testResults.length > 0 && (
        <div className="space-y-3">
          {testResults.map((result, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border text-sm ${
                result.status === 'success' ? 'bg-green-50 border-green-200' :
                result.status === 'error' ? 'bg-red-50 border-red-200' :
                'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="font-medium mb-1">{result.test}</div>
              
              {result.before && (
                <div className="text-xs text-gray-600 mb-1">
                  <strong>Before:</strong> {JSON.stringify(result.before)}
                </div>
              )}
              
              {result.after && (
                <div className="text-xs text-gray-600 mb-1">
                  <strong>After:</strong> {JSON.stringify(result.after)}
                </div>
              )}
              
              {result.result && (
                <div className="text-xs text-gray-600 mb-1">
                  <strong>Result:</strong> {JSON.stringify(result.result)}
                </div>
              )}
              
              {result.persisted && (
                <div className="text-xs text-gray-600 mb-1">
                  <strong>Persisted:</strong> {JSON.stringify(result.persisted)}
                </div>
              )}
              
              {result.expected && (
                <div className="text-xs text-gray-600 mb-1">
                  <strong>Expected:</strong> {JSON.stringify(result.expected)}
                </div>
              )}
              
              {result.error && (
                <div className="text-xs text-red-600">
                  <strong>Error:</strong> {result.error}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Current Progress Display */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <h4 className="font-medium text-gray-700 mb-2">Current Progress</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {gameTypes.map(gameType => {
            const gameProgress = progress[gameType];
            const section = gameProgress?.sections?.[0];
            const levels = section?.levels || [];
            
            return (
              <div key={gameType} className="bg-gray-50 p-3 rounded">
                <div className="font-medium text-gray-800 mb-2">{gameType}</div>
                <div className="space-y-1">
                  {levels.slice(0, 3).map((level, index) => (
                    <div key={index} className="flex justify-between">
                      <span>Level {index}:</span>
                      <span className={level.isCompleted ? 'text-green-600' : 'text-gray-500'}>
                        {level.isCompleted ? '✓' : '○'} 
                        {level.bestScore > 0 && ` (${level.bestScore})`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
} 