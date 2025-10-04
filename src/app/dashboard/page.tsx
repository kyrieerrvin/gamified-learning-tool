// src/app/dashboard/page.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { useGameProgress } from '@/hooks/useGameProgress';
import { useRouter } from 'next/navigation';
import ClientOnly from '@/components/common/ClientOnly';
// import ResetTimer from '@/components/ui/ResetTimer';
import DatabaseVerification from '@/components/debug/DatabaseVerification';
import LevelCompletionTest from '@/components/debug/LevelCompletionTest';
import DailyQuestsTest from '@/components/debug/DailyQuestsTest';
import AchievementsTest from '@/components/debug/AchievementsTest';
import StreaksTest from '@/components/debug/StreaksTest';

function DashboardContent() {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const { data, loading } = useGameProgress();
  const router = useRouter();

  // Rotating motivational messages (Tagalog)
  const motivationalMessages = [
    'Handa ka na bang matuto ngayon?',
    'Magaling! Patuloy lang sa pag-aaral!',
    'Ang sipag mo! Tuloy-tuloy na natin ‘to.',
    'Maliit man, bawat hakbang ay progreso.',
    'Ang galing mo! Ipagpatuloy mo lang!'
  ];
  const [motivation, setMotivation] = useState('');

  useEffect(() => {
    // Delay setting visibility to avoid transition on initial load
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Pick a random motivational message per load
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * motivationalMessages.length);
    setMotivation(motivationalMessages[randomIndex]);
  }, []);

  // Redirect to onboarding if no grade level set (first-time users)
  useEffect(() => {
    if (!loading && user && data && (!data.profile || !data.profile.gradeLevel)) {
      router.replace('/onboarding/grade');
    }
  }, [loading, user, data, router]);

  const visibilityClasses = isVisible 
    ? 'translate-y-0 opacity-100'
    : 'translate-y-10 opacity-0';

  // Card entrance animation helper
  const cardEnter = isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4';
  const cardTransitionStyle = {
    transition: 'transform 240ms cubic-bezier(0.22,1,0.36,1), opacity 240ms cubic-bezier(0.22,1,0.36,1)'
  } as const;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-6">
        {/* Welcome Section */}
        <div className={`transition-all duration-1000 transform ${visibilityClasses} mb-6`}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome, {user?.displayName || 'Learner'}!</h1>
              <p className="text-gray-700">{motivation}</p>
            </div>
            {/* Reset Timer temporarily disabled */}
            {/*
            {false && (
              <div className="flex-shrink-0 w-full sm:w-auto">
                <ResetTimer 
                  size="medium" 
                  showProgress={true}
                  className="w-full sm:w-auto lg:w-80"
                />
              </div>
            )}
            */}
          </div>
        </div>
        
        {/* Challenge Cards - vertically prioritized layout */}
        <div className={`transition-all duration-1000 delay-300 transform ${visibilityClasses} mb-6`}>
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Matuto ng Tagalog:</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-1 gap-5">
            <Link href="/challenges/conversation" className="group block">
              <div
                className={`rounded-[22px] px-5 sm:px-6 md:px-8 py-5 sm:py-6 md:py-8 shadow-sm border bg-gradient-to-br from-blue-50 to-cyan-100/60 border-blue-100 text-gray-800 transform ${cardEnter} motion-reduce:transform-none motion-reduce:opacity-100 hover:shadow-lg hover:scale-[1.03] active:scale-[0.98] active:duration-[90ms] transition-transform duration-[160ms] transition-shadow transition-opacity ease-out min-h-[150px]`}
                style={cardTransitionStyle}
              >
                <div className="grid grid-cols-1 md:grid-cols-[auto,1fr] items-center md:items-stretch gap-4 md:gap-6">
                  <div className="self-center md:self-stretch w-[72px] h-[72px] md:w-[96px] md:h-[96px] p-3 md:p-4 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-[18px] shadow-md aspect-square flex items-center justify-center transition-transform duration-[160ms] delay-[40ms] group-hover:scale-[1.05]">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-white w-[70%] h-[70%]">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <div className="flex-1 my-2 md:my-0 flex flex-col justify-center max-w-[60ch]">
                    <h3 className="text-2xl md:text-3xl font-semibold mb-2">Conversation</h3>
                    <p className="text-gray-700">Practice real-world dialogues with context-aware AI feedback.</p>
                    <div className="mt-4 text-blue-700 font-medium group-hover:underline inline-flex items-center">
                      Start Challenge
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/challenges/make-sentence" className="group block">
              <div
                className={`rounded-[22px] px-5 sm:px-6 md:px-8 py-5 sm:py-6 md:py-8 shadow-sm border bg-gradient-to-br from-indigo-50 to-pink-100/60 border-indigo-100 text-gray-800 transform ${cardEnter} motion-reduce:transform-none motion-reduce:opacity-100 hover:shadow-lg hover:scale-[1.03] active:scale-[0.98] active:duration-[90ms] transition-transform duration-[160ms] transition-shadow transition-opacity ease-out delay-[60ms] min-h-[150px]`}
                style={cardTransitionStyle}
              >
                <div className="grid grid-cols-1 md:grid-cols-[auto,1fr] items-center md:items-stretch gap-4 md:gap-6">
                  <div className="self-center md:self-stretch w-[72px] h-[72px] md:w-[96px] md:h-[96px] p-3 md:p-4 bg-gradient-to-tr from-indigo-600 to-pink-500 rounded-[18px] shadow-md aspect-square flex items-center justify-center transition-transform duration-[160ms] delay-[40ms] group-hover:scale-[1.05]">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-white w-[70%] h-[70%]">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="flex-1 my-2 md:my-0 flex flex-col justify-center max-w-[60ch]">
                    <h3 className="text-2xl md:text-3xl font-semibold mb-2">Make a Sentence</h3>
                    <p className="text-gray-700">Create meaningful sentences with Tagalog words and phrases.</p>
                    <div className="mt-4 text-indigo-700 font-medium group-hover:underline inline-flex items-center">
                      Start Challenge
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/challenges/multiple-choice" className="group block">
              <div
                className={`rounded-[22px] px-5 sm:px-6 md:px-8 py-5 sm:py-6 md:py-8 shadow-sm border bg-gradient-to-br from-purple-50 to-violet-100/60 border-purple-100 text-gray-800 transform ${cardEnter} motion-reduce:transform-none motion-reduce:opacity-100 hover:shadow-lg hover:scale-[1.03] active:scale-[0.98] active:duration-[90ms] transition-transform duration-[160ms] transition-shadow transition-opacity ease-out delay-[120ms] min-h-[150px]`}
                style={cardTransitionStyle}
              >
                <div className="grid grid-cols-1 md:grid-cols-[auto,1fr] items-center md:items-stretch gap-4 md:gap-6">
                  <div className="self-center md:self-stretch w-[72px] h-[72px] md:w-[96px] md:h-[96px] p-3 md:p-4 bg-gradient-to-tr from-purple-600 to-violet-500 rounded-[18px] shadow-md aspect-square flex items-center justify-center transition-transform duration-[160ms] delay-[40ms] group-hover:scale-[1.05]">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-white w-[70%] h-[70%]">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 my-2 md:my-0 flex flex-col justify-center max-w-[60ch]">
                    <h3 className="text-2xl md:text-3xl font-semibold mb-2">Multiple Choice</h3>
                    <p className="text-gray-700">Test your knowledge with adaptive quizzes and instant feedback.</p>
                    <div className="mt-4 text-purple-700 font-medium group-hover:underline inline-flex items-center">
                      Start Challenge
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
        
        {/* Debug Components (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className={`transition-all duration-1000 transform ${visibilityClasses} mt-8`}>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Debug & Testing</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DatabaseVerification />
              <LevelCompletionTest />
              <DailyQuestsTest />
              <AchievementsTest />
              <StreaksTest />
            </div>
          </div>
        )}
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