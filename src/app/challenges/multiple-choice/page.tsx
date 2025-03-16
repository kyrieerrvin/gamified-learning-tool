// src/app/challenges/multiple-choice/page.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import ProgressionMap from '@/components/challenges/ProgressionMap';
import { useRouter } from 'next/navigation';

export default function MultipleChoicePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // Animation states
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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
        {/* Exit button */}
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
        
        {/* Page Header */}
        <div className={`transition-all duration-700 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        } mb-8`}>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Bahagi ng Pangungusap</h1>
          <p className="text-gray-600 mb-4">
            Tukuyin ang bahagi ng pangungusap sa Tagalog. May 5 level na dapat tapusin.
          </p>
        </div>
        
        {/* Progression Map */}
        <div className={`transition-all duration-700 delay-200 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}>
          <ProgressionMap 
            gameType="multiple-choice"
            title="Bahagi ng Pangungusap"
            description="Magsanay sa pagtukoy ng mga bahagi ng pangungusap sa Tagalog. May 5 level na dapat tapusin."
          />
        </div>
      </main>
    </div>
  );
}