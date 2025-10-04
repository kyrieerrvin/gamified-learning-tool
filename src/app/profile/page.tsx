// src/app/profile/page.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import { useGameProgress } from '@/hooks/useGameProgress';
import { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  // Use real-time game progress for consistent XP across app
  const { score, streak, achievements, progress, profile, recentChallenges } = useGameProgress();
  
  // Animation state
  const [isVisible, setIsVisible] = useState(false);

  // Show animation after component mounts
  useEffect(() => {
    setIsVisible(true);
  }, []);

  const loading = authLoading;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Calculate total game completions across all game types
  const totalGameCompletions = Object.values(progress).reduce((total, gameData) => {
    return total + (gameData.completedLevels?.length || 0);
  }, 0);

  // Get total XP across all game types
  const totalXP = Object.values(progress).reduce((total, gameData) => {
    return total + (gameData.xp || 0);
  }, 0);
  const totalChallengesCompleted = (recentChallenges?.length || 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className={`transition-all duration-700 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Your Profile</h1>
          
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center">
              <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center text-blue-600 text-2xl font-bold mb-4 md:mb-0 md:mr-6">
                {user?.displayName ? user.displayName[0].toUpperCase() : "U"}
              </div>
              <div>
                <h2 className="text-xl font-semibold">{user?.displayName || "Tagalog Learner"}</h2>
                <p className="text-gray-600">{user?.email}</p>
                <p className="text-gray-500 text-sm mt-1">
                  Member since {profile?.joinDate 
                    ? new Date(profile.joinDate).toLocaleDateString() 
                    : new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Stats Section */}
        <div className={`transition-all duration-700 delay-200 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        } mb-8`}>
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Your Statistics</h2>
          
          <div className="space-y-6">
            {/* Total Score Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center">
                <div className="bg-blue-100 p-4 rounded-lg mb-4 md:mb-0 md:mr-6 flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div className="flex-grow">
                  <div className="text-gray-500 mb-1">Total Score</div>
                  <div className="text-3xl font-bold text-gray-800">
                    {score || 0} points
                  </div>
                  <div className="mt-4">
                    <div className="text-sm text-gray-500 mb-2">Total XP Earned</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (totalXP / 1000) * 100)}%` }}
                      />
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      {totalXP || 0} XP • Next milestone: 1000 XP
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-xl shadow-sm text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  {totalChallengesCompleted || 0}
                </div>
                <div className="text-gray-500">Total Challenges</div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm text-center">
                <div className="text-2xl font-bold text-green-600 mb-2">
                  {totalGameCompletions || 0}
                </div>
                <div className="text-gray-500">Games Completed</div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm text-center">
                <div className="text-2xl font-bold text-purple-600 mb-2">
                  {totalXP || 0}
                </div>
                <div className="text-gray-500">Total XP</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Streak Section */}
        <div className={`transition-all duration-700 delay-300 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        } mb-8`}>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Current Streak</h3>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-sm font-medium text-orange-600">
                  {streak || 0} days
                </span>
              </div>
            </div>
            <p className="text-gray-600 text-sm">
              Last active: {profile?.lastActiveDate
                ? new Date(profile.lastActiveDate).toLocaleDateString()
                : 'Never'}
            </p>
          </div>
        </div>
        
        {/* Achievements Section */}
        <div className={`transition-all duration-700 delay-400 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}>
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Achievements</h3>
          
          {achievements && achievements.length > 0 ? (
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-sm text-gray-500 mb-4">
                You have earned {achievements.length} achievement{achievements.length !== 1 ? 's' : ''}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((achievementId) => (
                  <div key={achievementId} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium text-gray-800 capitalize">
                        {achievementId.replace('-', ' ')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {getAchievementDescription(achievementId)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="text-gray-400 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-500">No achievements yet. Start playing to earn your first achievement!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function to get achievement descriptions
function getAchievementDescription(achievementId: string): string {
  switch (achievementId) {
    case 'first-steps':
      return 'Completed your first game';
    case 'perfect-score':
      return 'Achieved a perfect score';
    case 'streak-master':
      return 'Maintained a 7-day streak';
    case 'xp-master':
      return 'Earned 1000 XP';
    default:
      return 'Achievement unlocked';
  }
}