'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import MakeSentenceGame from '@/components/challenges/make-sentence/MakeSentenceGame';
import { useGameStore } from '@/store/gameStore';
import Button from '@/components/ui/Button';

export default function PlayMakeSentencePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sectionId = parseInt(searchParams.get('section') || '0');
  const levelId = parseInt(searchParams.get('level') || '0');
  
  const { progress, canAccessLevel, completeLevel, addPoints } = useGameStore();
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);
  
  // Check if level is accessible
  useEffect(() => {
    const checkAccess = () => {
      const hasAccess = canAccessLevel('make-sentence', sectionId, levelId);
      
      if (!hasAccess) {
        // Redirect to challenges page if level is not accessible
        router.push('/challenges/make-sentence');
      } else {
        setLoading(false);
      }
    };
    
    checkAccess();
  }, [sectionId, levelId, canAccessLevel, router]);
  
  // Handle game completion
  const handleComplete = (score: number, levelCompleted: boolean) => {
    setScore(score);
    setGameCompleted(true);
    
    if (levelCompleted) {
      // Complete level and add points
      completeLevel('make-sentence', sectionId, levelId);
      addPoints(score, 'make-sentence');
      
      // Check for perfect score for quest completion
      if (score === 100) {
        // Update perfect score quest
        const gameProgress = progress['make-sentence'];
        if (gameProgress) {
          const perfectScoreQuest = gameProgress.quests.find(quest => quest.id === 'perfect-score');
          if (perfectScoreQuest && !perfectScoreQuest.isCompleted) {
            // Will be handled by the addProgressToQuest in the gameStore
            setTimeout(() => {
              addPoints(10, 'make-sentence'); // Bonus points for perfect score
            }, 500);
          }
        }
      }
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-duolingo-green"></div>
        <p className="mt-4 text-gray-600">Naglo-load...</p>
      </div>
    );
  }
  
  if (gameCompleted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto text-center"
        >
          <div className="mb-6">
            {score >= 80 ? (
              <div className="mx-auto w-24 h-24 bg-duolingo-green rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : (
              <div className="mx-auto w-24 h-24 bg-duolingo-blue rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            )}
            
            <h2 className="text-2xl font-bold mb-2">
              {score >= 80 ? 'Mahusay!' : 'Magaling!'}
            </h2>
            <p className="text-gray-600 mb-6">
              {score >= 80 
                ? 'Napakahusay mo! Nakumpleto mo ang level na ito.' 
                : 'Magaling ka! Subukan mo ulit para makakuha ng mas mataas na score.'}
            </p>
            
            <div className="bg-gray-100 rounded-full p-2 mb-6">
              <div className="bg-duolingo-green h-6 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ width: `${score}%` }}>
                {score}%
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-lg font-bold text-duolingo-green">+ {score} XP</p>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => router.push('/challenges/make-sentence')}
              className="bg-duolingo-green hover:bg-duolingo-darkGreen text-white py-3 px-6 rounded-xl font-bold shadow-md hover:shadow-lg transition-all"
            >
              Bumalik sa Learning Path
            </Button>
            
            {levelId < 4 && (
              <Button
                onClick={() => router.push(`/challenges/make-sentence/play?section=${sectionId}&level=${levelId + 1}`)}
                className="bg-white border border-duolingo-green hover:bg-gray-100 text-duolingo-green py-3 px-6 rounded-xl font-bold shadow-sm hover:shadow-md transition-all"
              >
                Sunod na Level
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with back button */}
      <div className="flex items-center mb-8">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push('/challenges/make-sentence')}
          className="mr-4 text-gray-600 hover:text-gray-900 bg-white p-2 rounded-full shadow hover:shadow-md transition-all"
          aria-label="Go back to learning path"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </motion.button>
        
        <div>
          <h2 className="text-2xl font-bold">Paggawa ng Pangungusap</h2>
          <p className="text-gray-600">
            Section {sectionId + 1}, Level {levelId + 1}: Gumawa ng pangungusap gamit ang salitang binigay.
          </p>
        </div>
      </div>
      
      <MakeSentenceGame 
        questionsCount={10} 
        levelNumber={sectionId * 5 + levelId} // Convert section and level to overall level number
        onComplete={handleComplete}
      />
    </div>
  );
}