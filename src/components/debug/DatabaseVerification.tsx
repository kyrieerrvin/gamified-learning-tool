'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

interface DatabaseData {
  streak: number;
  lastStreakDate: string;
  streakState: string;
  score: number;
  updatedAt: string;
  progress?: any;
}

export default function DatabaseVerification() {
  const [databaseData, setDatabaseData] = useState<DatabaseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get current state from store
  const { streak, lastStreakDate, streakState, score, progress } = useGameStore();

  const fetchDatabaseData = async () => {
    const user = auth.currentUser;
    if (!user) {
      setError('No authenticated user');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const userProgressRef = doc(db, 'gameProgress', user.uid);
      const userProgressDoc = await getDoc(userProgressRef);
      
      if (userProgressDoc.exists()) {
        const data = userProgressDoc.data();
        setDatabaseData({
          streak: data.streak || 0,
          lastStreakDate: data.lastStreakDate || '',
          streakState: data.streakState || 'none',
          score: data.score || 0,
          updatedAt: data.updatedAt || '',
          progress: data.progress || {}
        });
      } else {
        setError('No database document found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabaseData();
  }, []);

  const syncStatus = databaseData ? {
    streakMatch: databaseData.streak === streak,
    dateMatch: databaseData.lastStreakDate === lastStreakDate,
    stateMatch: databaseData.streakState === streakState,
    scoreMatch: databaseData.score === score
  } : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-md border border-gray-100 p-6 space-y-4"
    >
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Database Verification</h3>
        <button
          onClick={fetchDatabaseData}
          disabled={loading}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="text-sm">Error: {error}</p>
        </div>
      )}

      {databaseData && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Local State */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-3">Local State (Current)</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Streak:</span>
                  <span className="font-mono">{streak}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Date:</span>
                  <span className="font-mono">{lastStreakDate || 'None'}</span>
                </div>
                <div className="flex justify-between">
                  <span>State:</span>
                  <span className={`font-mono px-2 py-1 rounded text-xs ${
                    streakState === 'active' ? 'bg-green-200 text-green-800' :
                    streakState === 'inactive' ? 'bg-yellow-200 text-yellow-800' :
                    'bg-gray-200 text-gray-800'
                  }`}>
                    {streakState}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Score:</span>
                  <span className="font-mono">{score}</span>
                </div>
              </div>
            </div>

            {/* Database State */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-3">Database State (Saved)</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Streak:</span>
                  <span className="font-mono">{databaseData.streak}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Date:</span>
                  <span className="font-mono">{databaseData.lastStreakDate || 'None'}</span>
                </div>
                <div className="flex justify-between">
                  <span>State:</span>
                  <span className={`font-mono px-2 py-1 rounded text-xs ${
                    databaseData.streakState === 'active' ? 'bg-green-200 text-green-800' :
                    databaseData.streakState === 'inactive' ? 'bg-yellow-200 text-yellow-800' :
                    'bg-gray-200 text-gray-800'
                  }`}>
                    {databaseData.streakState}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Score:</span>
                  <span className="font-mono">{databaseData.score}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sync Status */}
          {syncStatus && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-3">Synchronization Status</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                {Object.entries(syncStatus).map(([key, isMatch]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${isMatch ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="capitalize">{key.replace('Match', '')}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-3 text-xs text-gray-600">
                Last Updated: {new Date(databaseData.updatedAt).toLocaleString()}
              </div>
            </div>
          )}

          {/* Quest Data Preview */}
          {databaseData.progress && Object.keys(databaseData.progress).length > 0 && (
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-semibold text-purple-800 mb-3">Daily Quests (Sample)</h4>
              <div className="text-xs text-gray-600 space-y-1">
                {Object.entries(databaseData.progress).slice(0, 2).map(([gameType, data]: [string, any]) => (
                  <div key={gameType}>
                    <strong>{gameType}:</strong> {data.quests?.length || 0} quests, {data.xp || 0} XP
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
} 