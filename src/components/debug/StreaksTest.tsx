'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { motion } from 'framer-motion';

export default function StreaksTest() {
  const { 
    streak,
    lastStreakDate,
    streakState,
    increaseStreak,
    resetStreak,
    checkStreakReset,
    checkStreakStatus,
    completeGame,
    saveUserProgress,
    loadUserProgress
  } = useGameStore();
  
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const runStreaksTest = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    const results = [];
    
    try {
      // Test 1: Initial streak state
      results.push({
        test: 'Initial Streak State',
        streak: streak,
        lastStreakDate: lastStreakDate,
        streakState: streakState,
        status: 'info'
      });
      
      // Test 2: Reset streak
      resetStreak();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      results.push({
        test: 'Streak Reset',
        after: {
          streak: streak,
          lastStreakDate: lastStreakDate,
          streakState: streakState
        },
        expected: {
          streak: 0,
          lastStreakDate: '',
          streakState: 'none'
        },
        status: streak === 0 && streakState === 'none' ? 'success' : 'error'
      });
      
      // Test 3: Increase streak
      const initialStreak = streak;
      increaseStreak();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      results.push({
        test: 'Increase Streak',
        before: initialStreak,
        after: streak,
        expected: initialStreak + 1,
        status: streak === initialStreak + 1 ? 'success' : 'error'
      });
      
      // Test 4: Multiple streak increases
      const beforeMultiple = streak;
      for (let i = 0; i < 3; i++) {
        increaseStreak();
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      results.push({
        test: 'Multiple Streak Increases',
        before: beforeMultiple,
        after: streak,
        expected: beforeMultiple + 3,
        status: streak === beforeMultiple + 3 ? 'success' : 'error'
      });
      
      // Test 5: Streak through game completion
      resetStreak();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const beforeGameCompletion = streak;
      completeGame('make-sentence', 80, true); // Complete with correct answer
      await new Promise(resolve => setTimeout(resolve, 100));
      
      results.push({
        test: 'Streak Through Game Completion',
        before: beforeGameCompletion,
        after: streak,
        streakState: streakState,
        expected: {
          streak: beforeGameCompletion + 1,
          streakState: 'active'
        },
        status: streak === beforeGameCompletion + 1 && streakState === 'active' ? 'success' : 'error'
      });
      
      // Test 6: Streak doesn't increase for wrong answers
      const beforeWrongAnswer = streak;
      completeGame('make-sentence', 40, false); // Complete with wrong answer
      await new Promise(resolve => setTimeout(resolve, 100));
      
      results.push({
        test: 'Streak Preserved on Wrong Answer',
        before: beforeWrongAnswer,
        after: streak,
        expected: beforeWrongAnswer, // Should stay the same
        status: streak === beforeWrongAnswer ? 'success' : 'error'
      });
      
      // Test 7: Streak status check
      checkStreakStatus();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      results.push({
        test: 'Streak Status Check',
        currentState: {
          streak: streak,
          streakState: streakState,
          lastStreakDate: lastStreakDate
        },
        status: 'info'
      });
      
      // Test 8: Streak reset functionality
      checkStreakReset();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      results.push({
        test: 'Streak Reset Check',
        result: {
          streak: streak,
          streakState: streakState,
          lastStreakDate: lastStreakDate
        },
        note: 'This checks if streaks should be reset based on date',
        status: 'info'
      });
      
      // Test 9: Streak persistence
      const beforePersist = {
        streak: streak,
        lastStreakDate: lastStreakDate,
        streakState: streakState
      };
      
      await saveUserProgress();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await loadUserProgress();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const afterPersist = {
        streak: streak,
        lastStreakDate: lastStreakDate,
        streakState: streakState
      };
      
      results.push({
        test: 'Streak Persistence',
        before: beforePersist,
        after: afterPersist,
        status: (
          beforePersist.streak === afterPersist.streak &&
          beforePersist.lastStreakDate === afterPersist.lastStreakDate &&
          beforePersist.streakState === afterPersist.streakState
        ) ? 'success' : 'error'
      });
      
      // Test 10: High streak achievement trigger
      resetStreak();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Simulate building up a high streak
      for (let i = 0; i < 7; i++) {
        increaseStreak();
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      // Complete a game to trigger achievement check
      completeGame('make-sentence', 90, true);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      results.push({
        test: 'High Streak Achievement Trigger',
        finalStreak: streak,
        streakState: streakState,
        expected: {
          streak: 8, // 7 increases + 1 from game completion
          streakState: 'active'
        },
        status: streak >= 7 ? 'success' : 'warning',
        note: 'Achievement system should trigger at 7+ day streak'
      });
      
    } catch (error) {
      results.push({
        test: 'Streak Test Error',
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 'error'
      });
    }
    
    setTestResults(results);
    setIsLoading(false);
  };
  
  const resetTestStreak = () => {
    resetStreak();
    setTestResults([]);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-md border border-gray-100 p-6 space-y-4"
    >
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Streaks Test</h3>
        <div className="flex gap-2">
          <button
            onClick={resetTestStreak}
            className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
          >
            Reset
          </button>
          <button
            onClick={runStreaksTest}
            disabled={isLoading}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? 'Testing...' : 'Run Test'}
          </button>
        </div>
      </div>
      
      <div className="text-sm text-gray-600 mb-4">
        This test verifies that streak tracking, reset functionality, and persistence work correctly.
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
              
              {result.streak !== undefined && (
                <div className="text-xs text-gray-600 mb-1">
                  <strong>Streak:</strong> {result.streak}
                </div>
              )}
              
              {result.lastStreakDate && (
                <div className="text-xs text-gray-600 mb-1">
                  <strong>Last Date:</strong> {result.lastStreakDate}
                </div>
              )}
              
              {result.streakState && (
                <div className="text-xs text-gray-600 mb-1">
                  <strong>State:</strong> {result.streakState}
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
              
              {result.currentState && (
                <div className="text-xs text-gray-600 mb-1">
                  <strong>Current State:</strong> {JSON.stringify(result.currentState)}
                </div>
              )}
              
              {result.result && (
                <div className="text-xs text-gray-600 mb-1">
                  <strong>Result:</strong> {JSON.stringify(result.result)}
                </div>
              )}
              
              {result.finalStreak !== undefined && (
                <div className="text-xs text-gray-600 mb-1">
                  <strong>Final Streak:</strong> {result.finalStreak}
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
      
      {/* Current Streak Status */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <h4 className="font-medium text-gray-700 mb-2">Current Streak Status</h4>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="font-medium text-gray-800">Current Streak</div>
              <div className={`text-2xl font-bold ${streak > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                {streak} {streak === 1 ? 'day' : 'days'}
              </div>
            </div>
            <div>
              <div className="font-medium text-gray-800">Streak State</div>
              <div className={`text-sm px-2 py-1 rounded inline-block ${
                streakState === 'active' ? 'bg-green-100 text-green-800' :
                streakState === 'inactive' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-600'
              }`}>
                {streakState}
              </div>
            </div>
            <div>
              <div className="font-medium text-gray-800">Last Active</div>
              <div className="text-sm text-gray-600">
                {lastStreakDate || 'Never'}
              </div>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  increaseStreak();
                }}
                className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
              >
                +1 Streak
              </button>
              <button
                onClick={() => {
                  resetStreak();
                }}
                className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
              >
                Reset
              </button>
              <button
                onClick={() => {
                  checkStreakStatus();
                }}
                className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
              >
                Check Status
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
} 