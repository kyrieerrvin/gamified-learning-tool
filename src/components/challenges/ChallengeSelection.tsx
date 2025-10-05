// src/components/challenges/ChallengeSelection.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useGameProgress } from '@/hooks/useGameProgress';


export default function ChallengeSelection() {
  // State to track which button is active
  const [activeButton, setActiveButton] = useState<string | null>(null);
  const { progress, data } = useGameProgress();

  // Game progress is automatically initialized by the hook

  // Calculate progress percentage for each game type
  const calculateProgress = (gameType: string) => {
    if (!progress[gameType] || !progress[gameType].sections) return 0;
    
    let completed = 0;
    let total = 0;
    
    progress[gameType].sections.forEach(section => {
      section.levels.forEach(level => {
        total++;
        if (level.isCompleted) {
          completed++;
        }
      });
    });
    
    return total > 0 ? (completed / total) * 100 : 0;
  };

  const challenges = [
    {
      id: 'conversation',
      name: 'Tagalog Chatbot',
      path: '/challenges/conversation',
      color: 'blue',
      progressPercentage: 0 // No progression map for this yet
    },
    {
      id: 'make-sentence',
      name: 'Make a Sentence',
      path: '/challenges/make-sentence',
      color: 'blue',
      progressPercentage: calculateProgress('make-sentence')
    },
    {
      id: 'multiple-choice',
      name: 'Parts of a Sentence',
      path: '/challenges/multiple-choice',
      color: 'blue',
      progressPercentage: calculateProgress('multiple-choice')
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 pt-10 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Choose a challenge</h1>
      </div>
      
      <div className="flex flex-col space-y-6 max-w-md mx-auto w-full">
        {challenges.map((challenge) => (
          <div key={challenge.id} className="relative">
            <Link 
              href={challenge.path}
              className="block"
              onMouseEnter={() => setActiveButton(challenge.id)}
              onMouseLeave={() => setActiveButton(null)}
            >
              <button 
                className={`w-full py-4 rounded-full text-white font-medium transition-all ${
                  activeButton === challenge.id 
                    ? 'bg-blue-700 transform scale-105 shadow-md' 
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                {challenge.name}
              </button>
            </Link>
            
            {/* Progress indicator - dynamic based on user progress */}
            <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-500" 
                style={{ width: `${challenge.progressPercentage}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}