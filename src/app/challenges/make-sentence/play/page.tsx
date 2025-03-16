'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MakeSentenceGame from '@/components/challenges/make-sentence/MakeSentenceGame';
import { useGameStore } from '@/store/gameStore';
import Hearts from '@/components/ui/Hearts';
import Button from '@/components/ui/Button';

export default function PlayMakeSentencePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const level = parseInt(searchParams.get('level') || '0');
  
  const { canAccessLevel, completeLevel, hearts } = useGameStore();
  const [loading, setLoading] = useState(true);
  
  // Check if level is accessible
  useEffect(() => {
    const checkAccess = () => {
      const hasAccess = canAccessLevel('make-sentence', level);
      
      if (!hasAccess) {
        // Redirect to challenges page if level is not accessible
        router.push('/challenges/make-sentence');
      } else {
        setLoading(false);
      }
    };
    
    checkAccess();
  }, [level, canAccessLevel, router]);
  
  // Handle game completion
  const handleComplete = (score: number, levelCompleted: boolean) => {
    if (levelCompleted) {
      completeLevel('make-sentence', level);
    }
    
    // Show completion message and redirect after a delay
    setTimeout(() => {
      router.push('/challenges/make-sentence');
    }, 3000);
  };
  
  // If no hearts, redirect to dashboard
  useEffect(() => {
    if (hearts <= 0) {
      router.push('/dashboard');
    }
  }, [hearts, router]);
  
  // If no hearts, show loading while redirecting
  if (hearts <= 0) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-600">Redirecting to Dashboard...</p>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-600">Naglo-load...</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Exit button to dashboard */}
      <div className="mb-4">
        <button 
          onClick={() => router.push('/dashboard')}
          className="text-gray-600 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Go back to dashboard"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Paggawa ng Pangungusap - Level {level + 1}</h2>
          <p className="text-gray-600">
            Gumawa ng pangungusap gamit ang salitang binigay.
          </p>
        </div>
        <Hearts />
      </div>
      
      <MakeSentenceGame 
        questionsCount={10} 
        levelNumber={level}
        onComplete={handleComplete}
      />
    </div>
  );
}