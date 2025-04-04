'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useGameStore, Section, Level } from '@/store/gameStore';

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
  const { progress, initializeGameProgress, canAccessLevel } = useGameStore();
  const [isLoading, setIsLoading] = useState(true);
  
  // Set primary color based on game type
  const primaryColor = gameType === 'make-sentence' ? 'green' : 'blue';
  
  useEffect(() => {
    // Initialize game progress for this game type
    initializeGameProgress(gameType);
    
    // Small delay to ensure initialization is complete
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [gameType, initializeGameProgress]);
  
  if (isLoading) {
    return <div className="p-6 text-center">Loading learning path...</div>;
  }
  
  // Get sections from the game progress
  const sections = progress[gameType]?.sections || [];
  
  if (!sections || sections.length === 0) {
    return (
      <div className="p-6 text-center">
        <h3 className="text-xl font-bold mb-4">No learning sections available yet</h3>
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
      <div className="flex justify-center mb-8">
        <button
          onClick={startJourney}
          className="px-6 py-3 bg-blue-500 text-white font-bold rounded-lg shadow hover:bg-blue-600 transition-all"
        >
          Start Your Journey
        </button>
      </div>

      {/* Remove z-index to ensure the line stays behind content */}
      <div className="learning-path relative py-8" style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Removed vertical line */}
        
        {sections.map((section, sectionIndex) => {
          // Find the latest unlocked level in this section
          const latestUnlockedLevelId = section.isLocked ? -1 : 
            section.levels
              .filter(level => !level.isLocked && canAccessLevel(gameType, section.id, level.id))
              .reduce((latest, current) => current.id > latest ? current.id : latest, -1);
          
          return (
            <div key={section.id} className="mb-16">
              {/* Section divider */}
              <div className="flex justify-center items-center mb-6">
                <div className="h-[1px] bg-gray-300 flex-grow"></div>
                <div className="px-4 text-gray-500 font-semibold whitespace-nowrap">
                  SECTION {toRoman(sectionIndex + 1)}
                </div>
                <div className="h-[1px] bg-gray-300 flex-grow"></div>
              </div>
              
              {/* Section card */}
              <div className="bg-white rounded-xl shadow overflow-hidden max-w-xl mx-auto">
                {/* Section header */}
                <div className={`p-4 bg-${primaryColor}-${section.isLocked ? '200' : '500'} text-white`}>
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full bg-white text-${primaryColor}-${section.isLocked ? '300' : '500'} flex items-center justify-center text-lg font-bold mr-3`}>
                      {toRoman(sectionIndex + 1)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">{section.title}</h3>
                      <div className="text-sm opacity-80">
                        {section.levels.filter(l => l.isCompleted).length} of {section.levels.length} levels completed
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Levels grid */}
                <div className="p-4">
                  <div className="grid grid-cols-5 gap-3">
                    {section.levels.map((level) => {
                      // Determine if this level is accessible
                      const isAccessible = !section.isLocked && canAccessLevel(gameType, section.id, level.id);
                      
                      // Show START on latest unlocked level
                      const isLatestUnlocked = isAccessible && level.id === latestUnlockedLevelId;
                      
                      let btnClasses = "relative w-10 h-10 rounded-full flex items-center justify-center text-base font-medium";
                      let levelContent: React.ReactNode = level.id + 1;
                      
                      if (level.isCompleted) {
                        // Completed level
                        btnClasses += ` bg-${primaryColor}-500 text-white`;
                        levelContent = (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        );
                      } else if (isAccessible) {
                        // Unlocked level
                        btnClasses += ` border-2 border-${primaryColor}-500 text-${primaryColor}-500 hover:bg-${primaryColor}-500 hover:text-white cursor-pointer`;
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
                            <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 bg-orange-400 text-white px-2 py-0.5 rounded text-xs font-bold">
                              START
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
