// src/app/challenges/page.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import ChallengeSelection from '@/components/challenges/ChallengeSelection';

export default function ChallengesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Protect this route
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If we get here and there's no user, we're being redirected
  if (!user) {
    return null;
  }

  return <ChallengeSelection />;
}