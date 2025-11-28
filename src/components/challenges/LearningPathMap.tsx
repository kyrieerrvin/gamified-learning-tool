'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useGameProgress } from '@/hooks/useGameProgress';

// Import the types from useGameProgress
interface Section {
  id: number;
  title: string;
  description: string;
  isLocked: boolean;
  isCompleted: boolean;
  levels: Level[];
}

interface Level {
  id: number;
  title: string;
  isLocked: boolean;
  isCompleted: boolean;
  bestScore: number;
  attempts: number;
  lastPlayed: string | null;
}

interface LearningPathMapProps {
  gameType: 'make-sentence' | 'multiple-choice';
  title?: string;
}

// Helper function to convert number to Roman numeral
function toRoman(num: number): string {
  const romanNumerals = [
    { value: 10, numeral: 'X' },
    { value: 9, numeral: 'IX' },
    { value: 5, numeral: 'V' },
    { value: 4, numeral: 'IV' },
    { value: 1, numeral: 'I' }
  ];
  
  let result = '';
  for (const { value, numeral } of romanNumerals) {
    while (num >= value) {
      result += numeral;
      num -= value;
    }
  }
  return result;
}

export default function LearningPathMap({ gameType, title = "Learning Path" }: LearningPathMapProps) {
  const router = useRouter();
  const { progress, canAccessLevel, loading } = useGameProgress();
  
  // Map level groups to colors: Easy→green, Medium→orange, Hard→red
  const getLevelColor = (sectionIndex: number): 'green' | 'orange' | 'red' => {
    if (sectionIndex === 0) return 'green';
    if (sectionIndex === 1) return 'orange';
    return 'red';
  };
  
  if (loading) {
    return <div className="p-6 text-center">Loading learning path...</div>;
  }
  
  // Get sections (now "Levels") from the game progress
  const sections = progress[gameType]?.sections || [];
  
  if (!sections || sections.length === 0) {
    return (
      <div className="p-6 text-center">
        <h3 className="text-xl font-bold mb-4">No levels available yet</h3>
        <p className="text-gray-600 mb-6">Check back soon for new content!</p>
      </div>
    );
  }

  // Get latest available level to start journey
  const getLatestPlayableLevel = () => {
    let latestSection = null;
    let latestLevel = null;
    
    // First find the latest unlocked section
    for (let i = sections.length - 1; i >= 0; i--) {
      const section = sections[i];
      if (!section.isLocked) {
        latestSection = section;
        
        // Find the latest unlocked level in this section
        for (let j = section.levels.length - 1; j >= 0; j--) {
          const level = section.levels[j];
          if (!level.isLocked && canAccessLevel(gameType, section.id, level.id)) {
            latestLevel = level;
            return { section, level };
          }
        }
        
        // If no unlocked level found in this section, continue to previous section
        if (!latestLevel && i > 0) {
          continue;
        }
      }
    }
    
    // Fallback to the first unlocked level if no latest one found
    for (const section of sections) {
      if (section.isLocked) continue;
      
      for (const level of section.levels) {
        if (!level.isLocked && canAccessLevel(gameType, section.id, level.id)) {
          return { section, level };
        }
      }
    }
    
    return null;
  };

  // Start journey with latest available level
  const startJourney = () => {
    const latestPlayable = getLatestPlayableLevel();
    if (latestPlayable) {
      router.push(`/challenges/${gameType}/play?section=${latestPlayable.section.id}&level=${latestPlayable.level.id}`);
    }
  };
  
  return (
    <div className="container mx-auto p-4" style={{ position: 'relative' }}>

      {/* Remove z-index to ensure the line stays behind content */}
      <div className="learning-path relative py-8" style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Removed vertical line */}
        
        {sections.slice(0, 3).map((section, sectionIndex) => {
          // Find the latest unlocked level in this section
          const latestUnlockedLevelId = section.isLocked ? -1 : 
            section.levels
              .filter(level => !level.isLocked && canAccessLevel(gameType, section.id, level.id))
              .reduce((latest, current) => current.id > latest ? current.id : latest, -1);
          // Static Tailwind classes (no dynamic strings) to ensure colors compile
          const headerBgClass = sectionIndex === 0
            ? 'bg-green-500'
            : sectionIndex === 1
              ? 'bg-orange-500'
              : 'bg-red-500';
          const badgeTextClass = sectionIndex === 0
            ? 'text-green-500'
            : sectionIndex === 1
              ? 'text-orange-500'
              : 'text-red-500';
          const completedBgClass = sectionIndex === 0
            ? 'bg-green-500'
            : sectionIndex === 1
              ? 'bg-orange-500'
              : 'bg-red-500';
          const unlockedClasses = sectionIndex === 0
            ? 'border-2 border-green-500 text-green-500 hover:bg-green-500 hover:text-white'
            : sectionIndex === 1
              ? 'border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white'
              : 'border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white';
          
          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1], delay: sectionIndex * 0.06 }}
              className="mb-10"
            >
              {/* Level divider */}
              <div className="flex justify-center items-center mb-3">
                <div className="h-[1px] bg-gray-200 flex-grow"></div>
                <div className="px-3 text-gray-500 font-semibold whitespace-nowrap">
                  {toRoman(sectionIndex + 1)}
                </div>
                <div className="h-[1px] bg-gray-200 flex-grow"></div>
              </div>
              
              {/* Level card */}
              <div
                onClick={() => {
                  // Navigate to the latest playable level within this section
                  const latestUnlockedLevelId = section.isLocked ? -1 : section.levels
                    .filter(l => !l.isLocked && canAccessLevel(gameType, section.id, l.id))
                    .reduce((latest, current) => current.id > latest ? current.id : latest, -1);
                  const targetLevelId = latestUnlockedLevelId !== -1 ? latestUnlockedLevelId : 0;
                  if (!section.isLocked) {
                    router.push(`/challenges/${gameType}/play?section=${section.id}&level=${targetLevelId}`);
                  }
                }}
                className={`bg-white rounded-2xl shadow-md overflow-hidden max-w-2xl md:max-w-3xl mx-auto cursor-pointer transform transition-transform transition-duration-[170ms] transition-timing-function-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.03] active:scale-[0.98] motion-reduce:transition-none motion-reduce:transform-none`}
                style={{ minHeight: 150 }}
              >
                {/* Level header */}
                <div className={`px-5 md:px-6 py-5 ${headerBgClass} text-white`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-white ${badgeTextClass} flex items-center justify-center text-lg font-bold`}>{toRoman(sectionIndex + 1)}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold">{['Easy', 'Medium', 'Hard'][sectionIndex] || section.title}</span>
                    </div>
                  </div>
                  {/* Progress line */}
                  <div className="mt-2">
                    {(() => {
                      const completed = section.levels.filter(l => l.isCompleted).length;
                      const total = section.levels.length;
                      const pct = Math.max(0, Math.min(100, Math.round((completed / Math.max(1, total)) * 100)));
                      return (
                        <div>
                          <div className="flex items-center justify-between text-xs opacity-90 mb-1">
                            <span>{completed} of {total} done</span>
                            <span>{pct}%</span>
                          </div>
                          <div className="h-1.5 bg-white/30 rounded-full overflow-hidden">
                            <div className="h-full bg-white rounded-full" style={{ width: `${pct}%`, transition: 'width 300ms ease' }} />
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
                
                {/* Challenges grid */}
                <div className="px-5 md:px-6 py-5">
                  <div className="grid grid-cols-5 gap-3 md:gap-4 justify-items-center w-full">
                    {section.levels.map((level) => {
                      // Determine if this level is accessible
                      const isAccessible = !section.isLocked && canAccessLevel(gameType, section.id, level.id);
                      
                      // Show START on latest unlocked level
                      const isLatestUnlocked = isAccessible && level.id === latestUnlockedLevelId;
                      
                      let btnClasses = "relative w-10 h-10 md:w-10 md:h-10 rounded-full flex items-center justify-center text-base font-medium select-none";
                      let levelContent: React.ReactNode = level.id + 1;
                      
                      if (level.isCompleted) {
                        // Completed level
                          btnClasses += ` ${completedBgClass} text-white`;
                        levelContent = (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        );
                      } else if (isAccessible) {
                        // Unlocked level
                          btnClasses += ` ${unlockedClasses} cursor-pointer`;
                      } else {
                        // Locked level
                        btnClasses += " bg-gray-200 text-gray-400 cursor-not-allowed";
                        levelContent = (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        );
                      }
                      
                      // Handle click to navigate to the level
                      const handleLevelClick = () => {
                        if (!isAccessible) return;
                        
                        // Navigate directly to the game with proper query parameters
                        router.push(`/challenges/${gameType}/play?section=${section.id}&level=${level.id}`);
                      };
                      
                         return (
                           <div key={level.id} className="relative">
                          <button
                            onClick={handleLevelClick} 
                            disabled={!isAccessible}
                            className={btnClasses}
                          >
                            {levelContent}
                          </button>
                          
                          {isLatestUnlocked && (
                            <motion.div
                              initial={{ scale: 1 }}
                              animate={{ scale: [1, 1.04, 1] }}
                              transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 7 }}
                              className="absolute -top-7 left-1/2 transform -translate-x-1/2 bg-orange-400 text-white px-2 py-0.5 rounded text-xs font-bold shadow"
                            >
                              START
                            </motion.div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
