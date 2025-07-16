'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { motion } from 'framer-motion';

export default function AchievementsTest() {
  const { 
    achievements,
    gameAchievements,
    completeGame,
    increaseStreak,
    resetStreak,
    addPoints,
    saveUserProgress,
    loadUserProgress,
    initializeGameProgress
  } = useGameStore();
  
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const gameTypes = ['make-sentence', 'multiple-choice'];
  const expectedAchievements = [
    { id: 'first-steps', name: 'First Steps', trigger: 'complete any game' },
    { id: 'perfect-score', name: 'Perfect Score', trigger: 'score 100% or higher' },
    { id: 'streak-master', name: 'Streak Master', trigger: 'maintain 7-day streak' },
    { id: 'xp-master', name: 'XP Master', trigger: 'earn 1000 XP' }
  ];
  
  // Initialize progress for all game types
  useEffect(() => {
    gameTypes.forEach(gameType => {
      initializeGameProgress(gameType);
    });
  }, []);
  
  const runAchievementsTest = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    const results = [];
    
    try {
      // Test 1: Initial achievement state
      results.push({
        test: 'Initial Achievement State',
        globalAchievements: achievements.length,
        gameSpecificAchievements: Object.keys(gameAchievements).reduce((acc, key) => {
          acc[key] = gameAchievements[key].length;
          return acc;
        }, {} as Record<string, number>),
        status: 'info'
      });
      
      // Test 2: First Steps achievement (complete any game)
      const gameType = 'make-sentence';
      const initialFirstSteps = gameAchievements[gameType]?.includes('first-steps') || false;
      
      completeGame(gameType, 50, true); // Complete with 50% score
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const afterFirstSteps = gameAchievements[gameType]?.includes('first-steps') || false;
      
      results.push({
        test: `${gameType} - First Steps Achievement`,
        before: initialFirstSteps,
        after: afterFirstSteps,
        expected: true,
        status: afterFirstSteps ? 'success' : 'error'
      });
      
      // Test 3: Perfect Score achievement (score 100% or higher)
      const initialPerfectScore = gameAchievements[gameType]?.includes('perfect-score') || false;
      
      completeGame(gameType, 100, true); // Complete with 100% score
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const afterPerfectScore = gameAchievements[gameType]?.includes('perfect-score') || false;
      
      results.push({
        test: `${gameType} - Perfect Score Achievement`,
        before: initialPerfectScore,
        after: afterPerfectScore,
        expected: true,
        status: afterPerfectScore ? 'success' : 'error'
      });
      
      // Test 4: XP Master achievement (earn 1000 XP)
      const initialXpMaster = gameAchievements[gameType]?.includes('xp-master') || false;
      
      // Add a lot of XP to trigger XP Master
      for (let i = 0; i < 50; i++) {
        addPoints(20, gameType);
      }
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const afterXpMaster = gameAchievements[gameType]?.includes('xp-master') || false;
      
      results.push({
        test: `${gameType} - XP Master Achievement`,
        before: initialXpMaster,
        after: afterXpMaster,
        expected: true,
        status: afterXpMaster ? 'success' : 'error'
      });
      
      // Test 5: Streak Master achievement (7-day streak)
      const initialStreakMaster = achievements.includes('streak-master') || false;
      
      // Reset streak first
      resetStreak();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Simulate 7-day streak (this is a simplified test)
      // In real implementation, this would require actual date manipulation
      for (let i = 0; i < 7; i++) {
        increaseStreak();
      }
      
      // Complete a game to trigger streak-related achievements
      completeGame(gameType, 80, true);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const afterStreakMaster = achievements.includes('streak-master') || false;
      
      results.push({
        test: 'Streak Master Achievement',
        before: initialStreakMaster,
        after: afterStreakMaster,
        expected: true,
        status: afterStreakMaster ? 'success' : 'warning', // Warning because date simulation is limited
        note: 'Limited test - real streak requires actual date progression'
      });
      
      // Test 6: Achievement persistence
      const beforePersistAchievements = [...achievements];
      const beforePersistGameAchievements = JSON.parse(JSON.stringify(gameAchievements));
      
      await saveUserProgress();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await loadUserProgress();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const afterPersistAchievements = achievements;
      const afterPersistGameAchievements = gameAchievements;
      
      results.push({
        test: 'Achievement Persistence',
        before: {
          globalCount: beforePersistAchievements.length,
          gameSpecificCount: Object.keys(beforePersistGameAchievements).reduce((acc, key) => {
            acc[key] = beforePersistGameAchievements[key].length;
            return acc;
          }, {} as Record<string, number>)
        },
        after: {
          globalCount: afterPersistAchievements.length,
          gameSpecificCount: Object.keys(afterPersistGameAchievements).reduce((acc, key) => {
            acc[key] = afterPersistGameAchievements[key].length;
            return acc;
          }, {} as Record<string, number>)
        },
        status: afterPersistAchievements.length >= beforePersistAchievements.length ? 'success' : 'error'
      });
      
      // Test 7: Cross-game achievement consistency
      const gameType2 = 'multiple-choice';
      completeGame(gameType2, 100, true);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const game1Achievements = gameAchievements[gameType] || [];
      const game2Achievements = gameAchievements[gameType2] || [];
      
      results.push({
        test: 'Cross-Game Achievement Consistency',
        game1: {
          gameType: gameType,
          achievements: game1Achievements.length,
          hasFirstSteps: game1Achievements.includes('first-steps'),
          hasPerfectScore: game1Achievements.includes('perfect-score')
        },
        game2: {
          gameType: gameType2,
          achievements: game2Achievements.length,
          hasFirstSteps: game2Achievements.includes('first-steps'),
          hasPerfectScore: game2Achievements.includes('perfect-score')
        },
        status: game2Achievements.includes('first-steps') && game2Achievements.includes('perfect-score') ? 'success' : 'error'
      });
      
    } catch (error) {
      results.push({
        test: 'Achievement Test Error',
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 'error'
      });
    }
    
    setTestResults(results);
    setIsLoading(false);
  };
  
  const resetAchievements = () => {
    // This would require a reset function in the store
    // For now, we'll just reset the test results
    setTestResults([]);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-md border border-gray-100 p-6 space-y-4"
    >
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Achievements Test</h3>
        <div className="flex gap-2">
          <button
            onClick={resetAchievements}
            className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
          >
            Reset
          </button>
          <button
            onClick={runAchievementsTest}
            disabled={isLoading}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? 'Testing...' : 'Run Test'}
          </button>
        </div>
      </div>
      
      <div className="text-sm text-gray-600 mb-4">
        This test verifies that achievements are properly unlocked and persisted to the database.
      </div>
      
      {testResults.length > 0 && (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {testResults.map((result, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border text-sm ${
                result.status === 'success' ? 'bg-green-50 border-green-200' :
                result.status === 'error' ? 'bg-red-50 border-red-200' :
                result.status === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="font-medium mb-1">{result.test}</div>
              
              {result.globalAchievements !== undefined && (
                <div className="text-xs text-gray-600 mb-1">
                  <strong>Global Achievements:</strong> {result.globalAchievements}
                </div>
              )}
              
              {result.gameSpecificAchievements && (
                <div className="text-xs text-gray-600 mb-1">
                  <strong>Game-Specific:</strong> {JSON.stringify(result.gameSpecificAchievements)}
                </div>
              )}
              
              {result.before !== undefined && (
                <div className="text-xs text-gray-600 mb-1">
                  <strong>Before:</strong> {JSON.stringify(result.before)}
                </div>
              )}
              
              {result.after !== undefined && (
                <div className="text-xs text-gray-600 mb-1">
                  <strong>After:</strong> {JSON.stringify(result.after)}
                </div>
              )}
              
              {result.game1 && (
                <div className="text-xs text-gray-600 mb-1">
                  <strong>Game 1:</strong> {JSON.stringify(result.game1)}
                </div>
              )}
              
              {result.game2 && (
                <div className="text-xs text-gray-600 mb-1">
                  <strong>Game 2:</strong> {JSON.stringify(result.game2)}
                </div>
              )}
              
              {result.expected !== undefined && (
                <div className="text-xs text-gray-600 mb-1">
                  <strong>Expected:</strong> {JSON.stringify(result.expected)}
                </div>
              )}
              
              {result.note && (
                <div className="text-xs text-orange-600 mb-1">
                  <strong>Note:</strong> {result.note}
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
      
      {/* Current Achievement Status */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <h4 className="font-medium text-gray-700 mb-2">Current Achievement Status</h4>
        
        {/* Global Achievements */}
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-800 mb-2">Global Achievements ({achievements.length})</div>
          <div className="flex flex-wrap gap-2">
            {expectedAchievements.map(achievement => (
              <div
                key={achievement.id}
                className={`px-2 py-1 rounded text-xs ${
                  achievements.includes(achievement.id) 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}
                title={achievement.trigger}
              >
                {achievements.includes(achievement.id) ? '✓' : '○'} {achievement.name}
              </div>
            ))}
          </div>
        </div>
        
        {/* Game-Specific Achievements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {gameTypes.map(gameType => {
            const gameAchievementsList = gameAchievements[gameType] || [];
            
            return (
              <div key={gameType} className="bg-gray-50 p-3 rounded">
                <div className="font-medium text-gray-800 mb-2">
                  {gameType} ({gameAchievementsList.length} achievements)
                </div>
                <div className="space-y-1">
                  {expectedAchievements.map(achievement => (
                    <div key={achievement.id} className="flex justify-between items-center">
                      <span className="truncate">{achievement.name}:</span>
                      <span className={gameAchievementsList.includes(achievement.id) ? 'text-green-600' : 'text-gray-500'}>
                        {gameAchievementsList.includes(achievement.id) ? '✓' : '○'}
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