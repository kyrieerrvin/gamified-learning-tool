'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useGameProgress } from '@/hooks/useGameProgress';
import { cn } from '@/utils/cn';

interface UserStatsProps {
  gameType: 'make-sentence' | 'multiple-choice';
}

export default function UserStats({ gameType }: UserStatsProps) {
  const { progress, achievements, gameAchievements, profile, loading } = useGameProgress();
  const [xp, setXP] = useState(0);
  const [completedLevels, setCompletedLevels] = useState(0);
  const [totalLevels, setTotalLevels] = useState(0);
  const [gameProgress, setGameProgress] = useState(progress[gameType]);
  
  useEffect(() => {
    // Set game progress for this specific game type
    setGameProgress(progress[gameType]);
    
    const checkProgress = () => {
      const gameProgress = progress[gameType];
      if (gameProgress) {
        // Set XP
        setXP(gameProgress.xp || 0);
        
        // Count completed levels
        let completed = 0;
        let total = 0;
        
        if (gameProgress.sections) {
          gameProgress.sections.forEach(section => {
            section.levels.forEach(level => {
              total++;
              if (level.isCompleted) {
                completed++;
              }
            });
          });
        }
        
        setCompletedLevels(completed);
        setTotalLevels(total);
        
        // Update game progress
        setGameProgress(gameProgress);
      }
    };
    
    checkProgress();
  }, [gameType, progress]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-duolingo-blue"></div>
      </div>
    );
  }
  
  // Calculate completion percentage
  const completionPercent = Math.round((completedLevels / totalLevels) * 100) || 0;
  
  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
      <div className="flex items-start space-x-6">
        {/* Avatar and user info */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-duolingo-blue to-duolingo-green flex items-center justify-center text-white text-2xl font-bold">
              {profile?.displayName?.charAt(0) || 'U'}
            </div>
          </div>
          <p className="mt-3 font-medium text-gray-800 text-sm">{profile?.displayName || 'User'}</p>
        </div>
        
        {/* Stats grid */}
        <div className="flex-1 grid grid-cols-3 gap-4">
          {/* XP */}
          <div className="bg-blue-50 p-3 rounded-lg border border-duolingo-blue">
            <div className="text-xs text-duolingo-darkBlue font-medium mb-1">Nakuhang XP</div>
            <div className="text-2xl font-bold text-duolingo-blue">{xp} XP</div>
          </div>
          
          {/* Completion */}
          <div className="bg-green-50 p-3 rounded-lg border border-duolingo-green">
            <div className="text-xs text-duolingo-darkGreen font-medium mb-1">Nagawa</div>
            <div className="text-2xl font-bold text-duolingo-green">{completionPercent}%</div>
          </div>
          
          {/* Levels */}
          <div className="bg-purple-50 p-3 rounded-lg border border-duolingo-purple">
            <div className="text-xs text-duolingo-darkPurple font-medium mb-1">Nasagutan</div>
            <div className="text-2xl font-bold text-duolingo-purple">{completedLevels}/{totalLevels}</div>
          </div>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="mt-6">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Natapos</span>
          <span className="font-medium">{completedLevels}/{totalLevels} lebel</span>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${completionPercent}%` }}
            transition={{ duration: 1, delay: 0.2 }}
            className="h-full bg-gradient-to-r from-duolingo-green to-duolingo-blue"
          />
        </div>
      </div>
      
      {/* Achievement badges */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <h3 className="font-bold text-gray-700 mb-3">Resulta</h3>
        <div className="flex flex-wrap justify-center gap-4">
          <AchievementBadge 
            title="Bagito"
            description="Complete your first level" 
            isUnlocked={
              (gameAchievements && gameAchievements[gameType]?.includes('first-steps')) || 
              false
            }
            icon="🌱"
          />
          <AchievementBadge 
            title="Perpekto"
            description="Get 100% on any level" 
            isUnlocked={
              (gameAchievements && gameAchievements[gameType]?.includes('perfect-score')) || 
              false
            }
            icon="🏆"
          />
          <AchievementBadge 
            title="Determinado"
            description="Maintain a 7-day streak" 
            isUnlocked={
              (gameAchievements && gameAchievements[gameType]?.includes('streak-master')) || 
              achievements?.includes('streak-master') || 
              false
            }
            icon="🔥"
          />
          <AchievementBadge 
            title="Kampeon"
            description="Complete all levels in a section" 
            isUnlocked={
              (gameAchievements && gameAchievements[gameType]?.includes('section-champion')) || 
              false
            }
            icon="⭐"
          />
          <AchievementBadge 
            title="Bida ng XP"
            description="Earn 1000 XP" 
            isUnlocked={
              (gameAchievements && gameAchievements[gameType]?.includes('xp-master')) || 
              achievements?.includes('xp-master') || 
              false
            }
            icon="💎"
          />
        </div>
      </div>
    </div>
  );
}

interface AchievementBadgeProps {
  title: string;
  description: string;
  isUnlocked: boolean;
  icon: string;
}

function AchievementBadge({ title, description, isUnlocked, icon }: AchievementBadgeProps) {
  return (
    <div 
      className={cn(
        "w-24 h-24 rounded-lg flex flex-col items-center justify-center px-1 py-2 border-2 transition-all relative",
        isUnlocked 
          ? "bg-gradient-to-b from-duolingo-yellow to-duolingo-orange border-duolingo-darkOrange shadow-md"
          : "bg-gray-100 border-gray-300 opacity-50"
      )}
      title={`${title}: ${description}`}
    >
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-xs text-center font-medium overflow-hidden text-ellipsis w-full">
        {title}
      </div>
      {isUnlocked && (
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 border border-duolingo-darkGreen"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-duolingo-darkGreen" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </motion.div>
      )}
    </div>
  );
}
