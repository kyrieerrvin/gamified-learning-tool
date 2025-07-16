'use client';

import React, { useEffect, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import Link from 'next/link';

import { useUser } from '@/context/UserContext';

export type GameType = 'make-sentence' | 'multiple-choice';

interface ProgressionMapProps {
  gameType: GameType;
  title: string;
  description: string;
}

export default function ProgressionMap({ gameType, title, description }: ProgressionMapProps) {
  const { initializeGameProgress, canAccessLevel, progress, loadUserProgress } = useGameStore();
  const [levels, setLevels] = useState<{ completed: boolean; accessible: boolean }[]>([]);
  const { userData } = useUser();
  
  // Load user-specific progress when the user is logged in
  useEffect(() => {
    if (userData?.displayName) {
      console.log('User logged in, loading progress for:', userData.displayName);
      loadUserProgress();
    }
  }, [userData, loadUserProgress]);
  
  // Initialize progression data for this game type
  useEffect(() => {
    initializeGameProgress(gameType);
  }, [gameType, initializeGameProgress]);
  
  // Update levels state based on game progress
  useEffect(() => {
    const gameProgress = progress[gameType];
    if (gameProgress && gameProgress.sections) {
      const levelsData: { completed: boolean; accessible: boolean }[] = [];
      
      gameProgress.sections.forEach((section, sectionIndex) => {
        section.levels.forEach((level, levelIndex) => {
          levelsData.push({
            completed: level.isCompleted,
            accessible: canAccessLevel(gameType, sectionIndex, levelIndex)
          });
        });
      });
      
      setLevels(levelsData);
    }
  }, [gameType, progress, canAccessLevel]);
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-gray-600">{description}</p>
        </div>
      </div>
      
      <div className="relative py-8">
        {/* Path line */}
        <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-blue-200 transform -translate-x-1/2 z-0"></div>
        
        {/* Level nodes */}
        <div className="relative z-10 space-y-16">
          {levels.map((level, index) => (
            <LevelNode 
              key={index} 
              level={index}
              completed={level.completed}
              accessible={level.accessible}
              gameType={gameType}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface LevelNodeProps {
  level: number;
  completed: boolean;
  accessible: boolean;
  gameType: GameType;
}

function LevelNode({ level, completed, accessible, gameType }: LevelNodeProps) {
  const nodeSize = completed ? 'w-16 h-16' : 'w-14 h-14';
  const bgColor = completed 
    ? 'bg-green-500 border-green-600' 
    : accessible 
      ? 'bg-blue-500 border-blue-600' 
      : 'bg-gray-300 border-gray-400';
  
  return (
    <div className="flex items-center justify-center">
      <div className={`relative ${accessible ? '' : 'opacity-60'}`}>
        {accessible ? (
          <Link href={`/challenges/${gameType}/play?level=${level}`}>
            <div className={`${nodeSize} rounded-full ${bgColor} border-2 flex items-center justify-center text-white font-bold transition-all hover:scale-105 relative`}>
              <span className="text-xl">{level + 1}</span>
              {completed && (
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-green-500">
                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </Link>
        ) : (
          <div className={`${nodeSize} rounded-full ${bgColor} border-2 flex items-center justify-center text-white font-bold cursor-not-allowed`}>
            <span className="text-xl">{level + 1}</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 absolute">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </div>
        )}
        
        {/* Level description */}
        <div className={`mt-2 text-center font-medium ${accessible ? 'text-gray-800' : 'text-gray-500'}`}>
          Level {level + 1}
        </div>
      </div>
    </div>
  );
}