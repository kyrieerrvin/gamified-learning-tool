// src/app/dashboard/page.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Dashboard() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  // Protect this route - redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If we get here and there's no user, we're being redirected
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-600">TagalogLearn</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              {user.email}
            </div>
            <button
              onClick={signOut}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-2xl font-semibold mb-6">Welcome to your Dashboard</h1>
          
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Your Statistics</h2>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-gray-500">Total Score</div>
                  <div className="mt-1 text-3xl font-semibold text-gray-900">0</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-gray-500">Current Streak</div>
                  <div className="mt-1 text-3xl font-semibold text-gray-900">0</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-gray-500">Challenges Completed</div>
                  <div className="mt-1 text-3xl font-semibold text-gray-900">0</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Available Challenges</h2>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <Link href="/challenges/conversation" className="group">
                  <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-medium text-blue-600 mb-2">Conversation</h3>
                    <p className="text-sm text-gray-600">Practice dialogue with context-aware feedback</p>
                  </div>
                </Link>
                <Link href="/challenges/make-sentence" className="group">
                  <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-100 hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-medium text-indigo-600 mb-2">Make a Sentence</h3>
                    <p className="text-sm text-gray-600">Create meaningful sentences with Tagalog words and phrases</p>
                  </div>
                </Link>
                <Link href="/challenges/multiple-choice" className="group">
                  <div className="bg-purple-50 p-6 rounded-lg border border-purple-100 hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-medium text-purple-600 mb-2">Multiple Choice</h3>
                    <p className="text-sm text-gray-600">Test your knowledge with adaptive quizzes</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}