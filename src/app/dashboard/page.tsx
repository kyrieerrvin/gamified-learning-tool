// src/app/dashboard/page.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { useGameStore } from '@/store/gameStore';
import ClientOnly from '@/components/common/ClientOnly';

function DashboardContent() {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const { loadUserProgress, checkAndRefreshQuests } = useGameStore();

  useEffect(() => {
    loadUserProgress();
    
    // Delay setting visibility to avoid transition on initial load
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    // Refresh quests for all game types
    checkAndRefreshQuests('make-sentence');
    checkAndRefreshQuests('multiple-choice');
    
    return () => clearTimeout(timer);
  }, [loadUserProgress, checkAndRefreshQuests]);

  const visibilityClasses = isVisible 
    ? 'translate-y-0 opacity-100'
    : 'translate-y-10 opacity-0';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className={`transition-all duration-1000 transform ${visibilityClasses} mb-8`}>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome, {user?.displayName || 'Learner'}!</h1>
          <p className="text-gray-600">Choose a challenge or review your progress.</p>
        </div>
        
        {/* Challenge Cards */}
        <div className={`transition-all duration-1000 delay-300 transform ${visibilityClasses} mb-10`}>
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Today's Challenges</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/challenges/conversation" className="group">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all group-hover:transform group-hover:scale-105 h-full">
                <div className="bg-blue-100 p-3 rounded-lg inline-block mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">Conversation</h3>
                <p className="text-gray-600">Practice real-world dialogues with context-aware AI feedback.</p>
                <div className="mt-4 text-blue-600 font-medium group-hover:underline flex items-center">
                  Start Challenge
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
            
            <Link href="/challenges/make-sentence" className="group">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-200 transition-all group-hover:transform group-hover:scale-105 h-full">
                <div className="bg-indigo-100 p-3 rounded-lg inline-block mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2 group-hover:text-indigo-600 transition-colors">Make a Sentence</h3>
                <p className="text-gray-600">Create meaningful sentences with Tagalog words and phrases.</p>
                <div className="mt-4 text-indigo-600 font-medium group-hover:underline flex items-center">
                  Start Challenge
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
            
            <Link href="/challenges/multiple-choice" className="group">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-purple-200 transition-all group-hover:transform group-hover:scale-105 h-full">
                <div className="bg-purple-100 p-3 rounded-lg inline-block mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2 group-hover:text-purple-600 transition-colors">Multiple Choice</h3>
                <p className="text-gray-600">Test your knowledge with adaptive quizzes and instant feedback.</p>
                <div className="mt-4 text-purple-600 font-medium group-hover:underline flex items-center">
                  Start Challenge
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

// Wrapper component for Dashboard that ensures all content is rendered client-side only
export default function Dashboard() {
  const { loading } = useAuth();
  
  const loadingState = (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
  
  if (loading) {
    return loadingState;
  }
  
  return (
    <ClientOnly fallback={loadingState}>
      <DashboardContent />
    </ClientOnly>
  );
}