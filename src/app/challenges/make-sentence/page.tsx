'use client';

import React from 'react';
import ProgressionMap from '@/components/challenges/ProgressionMap';
import { useRouter } from 'next/navigation';

export default function MakeSentencePage() {
  const router = useRouter();
  
  return (
    <div className="container mx-auto px-4 py-8">
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
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center">Gumawa ng Pangungusap</h1>
        <p className="text-center text-gray-600 mt-2">
          Gamitin ang salitang binigay sa paggawa ng pangungusap sa Tagalog.
        </p>
      </div>
      
      <ProgressionMap 
        gameType="make-sentence"
        title="Paggawa ng Pangungusap"
        description="Magsanay sa paggawa ng pangungusap gamit ang mga salitang Tagalog. May 5 level na dapat tapusin."
      />
    </div>
  );
}