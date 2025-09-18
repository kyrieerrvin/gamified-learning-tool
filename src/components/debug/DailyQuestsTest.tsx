'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { motion } from 'framer-motion';

export default function DailyQuestsTest() {
  const { 
    progress, 
    addProgressToQuest, 
    completeQuest, 
    checkAndRefreshQuests,
    resetQuests,
    saveUserProgress,
    loadUserProgress,
    initializeGameProgress,
    addPoints
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
  
  const runDailyQuestsTest = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    const results = [];
    
    for (const gameType of gameTypes) {
      try {
        console.log(`Testing daily quests for ${gameType}...`);
        
        // Test 1: Check initial quest state
        const initialState = progress[gameType];
        const initialQuests = initialState?.quests || [];
        
        results.push({
          test: `${gameType} - Initial Quest State`,
          quests: initialQuests.map(q => ({
            id: q.id,
            progress: q.progress,
            target: q.target,
            isCompleted: q.isCompleted,
            reward: q.reward
          })),
          status: 'info'
        });
        
        // Note: 'daily-xp' quest removed; skip its test
        
        // Test 3: Complete perfect-score quest
        const perfectScoreQuest = initialQuests.find(q => q.id === 'perfect-score');
        if (perfectScoreQuest && !perfectScoreQuest.isCompleted) {
          addProgressToQuest(gameType, 'perfect-score', 1);
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const afterPerfectState = progress[gameType];
          const afterPerfectQuest = afterPerfectState?.quests?.find(q => q.id === 'perfect-score');
          
          results.push({
            test: `${gameType} - Perfect Score Quest Completion`,
            before: { progress: perfectScoreQuest.progress, isCompleted: perfectScoreQuest.isCompleted },
            after: { progress: afterPerfectQuest?.progress || 0, isCompleted: afterPerfectQuest?.isCompleted || false },
            expected: { progress: 1, isCompleted: true },
            status: afterPerfectQuest?.isCompleted ? 'success' : 'error'
          });
        }
        
        // Test 4: Manual quest completion
        const streakQuest = initialQuests.find(q => q.id === 'streak-bonus');
        if (streakQuest && !streakQuest.isCompleted) {
          completeQuest(gameType, 'streak-bonus');
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const afterStreakState = progress[gameType];
          const afterStreakQuest = afterStreakState?.quests?.find(q => q.id === 'streak-bonus');
          
          results.push({
            test: `${gameType} - Manual Quest Completion`,
            before: { progress: streakQuest.progress, isCompleted: streakQuest.isCompleted },
            after: { progress: afterStreakQuest?.progress || 0, isCompleted: afterStreakQuest?.isCompleted || false },
            expected: { progress: 1, isCompleted: true },
            status: afterStreakQuest?.isCompleted ? 'success' : 'error'
          });
        }
        
        // Test 5: Quest persistence
        await saveUserProgress();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        await loadUserProgress();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const persistedState = progress[gameType];
        const persistedQuests = persistedState?.quests || [];
        const persistedCompletedCount = persistedQuests.filter(q => q.isCompleted).length;
        
        results.push({
          test: `${gameType} - Quest Persistence`,
          persisted: {
            completedQuests: persistedCompletedCount,
            totalQuests: persistedQuests.length,
            xp: persistedState?.xp || 0
          },
          expected: {
            completedQuests: '>=2',
            totalQuests: 4,
            xp: '>=45' // 25 base + 20 reward from perfect-score + 10 from streak-bonus
          },
          status: persistedCompletedCount >= 2 ? 'success' : 'error'
        });
        
        // Test 6: Quest refresh (reset)
        resetQuests(gameType);
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const refreshedState = progress[gameType];
        const refreshedQuests = refreshedState?.quests || [];
        const refreshedCompletedCount = refreshedQuests.filter(q => q.isCompleted).length;
        
        results.push({
          test: `${gameType} - Quest Refresh`,
          refreshed: {
            completedQuests: refreshedCompletedCount,
            totalQuests: refreshedQuests.length,
            allProgressReset: refreshedQuests.every(q => q.progress === 0)
          },
          expected: {
            completedQuests: 0,
            totalQuests: 4,
            allProgressReset: true
          },
          status: refreshedCompletedCount === 0 ? 'success' : 'error'
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
  
  const resetAllQuests = () => {
    gameTypes.forEach(gameType => {
      resetQuests(gameType);
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
        <h3 className="text-lg font-semibold text-gray-800">Daily Quests Test</h3>
        <div className="flex gap-2">
          <button
            onClick={resetAllQuests}
            className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
          >
            Reset
          </button>
          <button
            onClick={runDailyQuestsTest}
            disabled={isLoading}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? 'Testing...' : 'Run Test'}
          </button>
        </div>
      </div>
      
      <div className="text-sm text-gray-600 mb-4">
        This test verifies that daily quests are properly tracked, updated, and persisted to the database.
      </div>
      
      {testResults.length > 0 && (
        <div className="space-y-3 max-h-96 overflow-y-auto">
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
              
              {result.quests && (
                <div className="text-xs text-gray-600 mb-1">
                  <strong>Initial Quests:</strong>
                  <div className="pl-2 mt-1">
                    {result.quests.map((quest: any, qIndex: number) => (
                      <div key={qIndex}>
                        {quest.id}: {quest.progress}/{quest.target} 
                        {quest.isCompleted && ' ✓'}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
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
              
              {result.persisted && (
                <div className="text-xs text-gray-600 mb-1">
                  <strong>Persisted:</strong> {JSON.stringify(result.persisted)}
                </div>
              )}
              
              {result.refreshed && (
                <div className="text-xs text-gray-600 mb-1">
                  <strong>Refreshed:</strong> {JSON.stringify(result.refreshed)}
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
      
      {/* Current Quest Status */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <h4 className="font-medium text-gray-700 mb-2">Current Quest Status</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {gameTypes.map(gameType => {
            const gameProgress = progress[gameType];
            const quests = gameProgress?.quests || [];
            
            return (
              <div key={gameType} className="bg-gray-50 p-3 rounded">
                <div className="font-medium text-gray-800 mb-2">
                  {gameType} (XP: {gameProgress?.xp || 0})
                </div>
                <div className="space-y-1">
                  {quests.map((quest, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="truncate">{quest.title}:</span>
                      <span className={quest.isCompleted ? 'text-green-600' : 'text-gray-500'}>
                        {quest.progress}/{quest.target}
                        {quest.isCompleted && ' ✓'}
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