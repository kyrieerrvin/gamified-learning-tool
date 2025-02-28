// src/components/challenges/ChallengeSelection.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ChallengeSelection() {
  // State to track which button is active
  const [activeButton, setActiveButton] = useState<string | null>(null);

  const challenges = [
    {
      id: 'conversation',
      name: 'AI Chatbot',
      path: '/challenges/conversation',
      color: 'blue'
    },
    {
      id: 'make-sentence',
      name: 'Make a Sentence',
      path: '/challenges/make-sentence',
      color: 'blue'
    },
    {
      id: 'multiple-choice',
      name: 'Parts of a Sentence',
      path: '/challenges/multiple-choice',
      color: 'blue'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 pt-10 px-4">
      <h1 className="text-2xl font-bold mb-12 text-center">Choose a challenge</h1>
      
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
            
            {/* Progress indicator - this could be dynamic based on user progress */}
            {challenge.id === 'conversation' && (
              <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '40%' }}></div>
              </div>
            )}
            
            {challenge.id === 'make-sentence' && (
              <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '20%' }}></div>
              </div>
            )}
            
            {challenge.id === 'multiple-choice' && (
              <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '10%' }}></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}