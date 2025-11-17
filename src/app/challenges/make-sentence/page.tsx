'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/layout/Navbar';
import LearningPathMap from '@/components/challenges/LearningPathMap';
import DailyQuests from '@/components/challenges/DailyQuests';
import UserStats from '@/components/challenges/UserStats';
import { useGameProgress } from '@/hooks/useGameProgress';

export default function MakeSentencePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { data, canAccessLevel } = useGameProgress();
  const [activeTab, setActiveTab] = useState<'learning' | 'quests' | 'stats'>('learning');
  const [isVisible, setIsVisible] = useState(false);
  
  // Determine if any challenge completed (to hide welcome card)
  const hasAnyCompletion = useMemo(() => {
    const sections = data?.progress?.['make-sentence']?.sections || [];
    for (const s of sections) {
      if (s.levels.some((l) => l.isCompleted)) return true;
    }
    return false;
  }, [data]);
  
  const startLatest = () => {
    const sections = data?.progress?.['make-sentence']?.sections || [];
    let target: { sectionId: number; levelId: number } | null = null;
    for (let i = sections.length - 1; i >= 0; i--) {
      const s = sections[i];
      if (s.isLocked) continue;
      for (let j = s.levels.length - 1; j >= 0; j--) {
        const lvl = s.levels[j];
        if (!lvl.isLocked && canAccessLevel('make-sentence', s.id, lvl.id)) {
          target = { sectionId: s.id, levelId: lvl.id };
          break;
        }
      }
      if (target) break;
    }
    if (!target && sections[0]) target = { sectionId: sections[0].id, levelId: 0 };
    if (target) {
      router.push(`/challenges/make-sentence/play?section=${target.sectionId}&level=${target.levelId}`);
    }
  };
  
  // Protect this route - redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);
  
  // Show animation after component mounts
  useEffect(() => {
    setIsVisible(true);
  }, []);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-duolingo-green"></div>
      </div>
    );
  }
  
  // If we're redirecting, show nothing
  if (!user) {
    return null;
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="container mx-auto px-4 py-6">
        {/* Header with back button */}
        <div className="flex items-center mb-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/dashboard')}
            className="mr-4 text-gray-600 hover:text-gray-900 bg-white p-2 rounded-full shadow hover:shadow-md transition-all"
            aria-label="Go back to dashboard"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </motion.button>
          
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-3xl font-bold text-gray-800"
            >
              Gumawa ng Pangungusap
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-gray-600"
            >
              Magsanay sa paggawa ng pangungusap gamit ang Tagalog.
            </motion.p>
          </div>
        </div>
        
        {/* Tab navigation - icon+label with animated underline */}
        <div className="bg-white rounded-xl shadow mb-4 p-1.5 flex justify-center max-w-2xl mx-auto">
          {([
            { key: 'learning', label: 'Pag-unlad', icon: '🗺️' },
            { key: 'quests', label: 'Mga Misyon', icon: '⭐' },
            { key: 'stats', label: 'Mga Nakamit', icon: '🏅' },
          ] as const).map((tab, idx) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`relative flex-1 py-3 px-4 rounded-full text-center transition-transform duration-150 ease-out mx-1 border ${
                activeTab === tab.key
                  ? 'bg-[#def4ff] border-[#85d8ff] text-[#0B63F6] font-semibold shadow-sm'
                  : 'bg-[#F6F7F9] border-transparent text-gray-700'
              } hover:-translate-y-0.5 hover:shadow active:scale-95`}
            >
              <span className={`mr-2 ${activeTab === tab.key ? 'opacity-100' : 'opacity-50'}`}>{tab.icon}</span>
              {tab.label}
              {activeTab === tab.key && (
                <motion.div layoutId="tab-underline" className="absolute left-3 right-3 -bottom-[2px] h-[2px] bg-[#0B63F6] rounded" />
              )}
            </button>
          ))}
        </div>
        
        {/* Tab content with animations */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`transition-all duration-700 transform ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}
        >
          {activeTab === 'learning' && (
            <div className="remove-vertical-lines">
              <LearningPathMap 
                gameType="make-sentence"
                title="Paggawa ng Pangungusap"
              />
            </div>
          )}
          
          {activeTab === 'quests' && (
            <div className="max-w-2xl mx-auto">
              <DailyQuests gameType="make-sentence" />
            </div>
          )}
          
          {activeTab === 'stats' && (
            <div className="max-w-2xl mx-auto">
              <UserStats gameType="make-sentence" />
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}