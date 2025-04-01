// src/app/challenges/multiple-choice/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/layout/Navbar';
import LearningPathMap from '@/components/challenges/LearningPathMap';
import DailyQuests from '@/components/challenges/DailyQuests';
import UserStats from '@/components/challenges/UserStats';

export default function MultipleChoicePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'learning' | 'quests' | 'stats'>('learning');
  const [isVisible, setIsVisible] = useState(false);
  
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-duolingo-purple"></div>
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
      
      <main className="container mx-auto px-4 py-8">
        {/* Header with back button */}
        <div className="flex items-center mb-8">
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
              Bahagi ng Pangungusap
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-gray-600"
            >
              Tukuyin ang bahagi ng pangungusap sa Tagalog
            </motion.p>
          </div>
        </div>
        
        {/* Tab navigation */}
        <div className="bg-white rounded-lg shadow mb-8 p-1 flex justify-center max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('learning')}
            className={`flex-1 py-3 px-4 rounded-lg text-center font-medium transition-all ${
              activeTab === 'learning' 
                ? 'bg-duolingo-purple text-white shadow' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Learning Path
          </button>
          <button
            onClick={() => setActiveTab('quests')}
            className={`flex-1 py-3 px-4 rounded-lg text-center font-medium transition-all ${
              activeTab === 'quests' 
                ? 'bg-duolingo-yellow text-white shadow' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Daily Quests
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-3 px-4 rounded-lg text-center font-medium transition-all ${
              activeTab === 'stats' 
                ? 'bg-duolingo-blue text-white shadow' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Achievements
          </button>
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
            <LearningPathMap 
              gameType="multiple-choice"
              title="Bahagi ng Pangungusap"
            />
          )}
          
          {activeTab === 'quests' && (
            <div className="max-w-2xl mx-auto">
              <DailyQuests gameType="multiple-choice" />
            </div>
          )}
          
          {activeTab === 'stats' && (
            <div className="max-w-2xl mx-auto">
              <UserStats gameType="multiple-choice" />
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}