// src/app/profile/page.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import { useUser } from '@/context/UserContext';
import { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { userData, loading: userDataLoading } = useUser();
  
  // Animation state
  const [isVisible, setIsVisible] = useState(false);

  // Show animation after component mounts
  useEffect(() => {
    setIsVisible(true);
  }, []);

  const loading = authLoading || userDataLoading;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className={`transition-all duration-700 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        } mb-8`}>
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
                  Member since {userData?.progress.joinDate 
                    ? new Date(userData.progress.joinDate).toLocaleDateString() 
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
                    {userData?.progress.totalScore || 0} points
                  </div>
                  <div className="mt-4">
                    <div className="text-sm text-gray-500 mb-1">Progress to next level</div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ 
                          width: `${userData 
                            ? Math.min(100, (userData.progress.totalScore / userData.progress.nextLevelPoints) * 100) 
                            : 0}%` 
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Level {userData?.progress.level || 1} • 
                      {userData?.progress.totalScore || 0}/{userData?.progress.nextLevelPoints || 100} points to 
                      Level {(userData?.progress.level || 1) + 1}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Challenges Completed Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center">
                <div className="bg-green-100 p-4 rounded-lg mb-4 md:mb-0 md:mr-6 flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-grow">
                  <div className="text-gray-500 mb-1">Challenges Completed</div>
                  <div className="text-3xl font-bold text-gray-800">
                    {userData?.progress.challengesCompleted || 0}
                  </div>
                  
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm font-medium text-gray-600 mb-1">Conversation</div>
                      <div className="text-lg font-semibold text-gray-800">
                        {userData?.progress.completedChallenges.conversation || 0}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm font-medium text-gray-600 mb-1">Make a Sentence</div>
                      <div className="text-lg font-semibold text-gray-800">
                        {userData?.progress.completedChallenges.makeSentence || 0}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm font-medium text-gray-600 mb-1">Multiple Choice</div>
                      <div className="text-lg font-semibold text-gray-800">
                        {userData?.progress.completedChallenges.multipleChoice || 0}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Streak Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center">
                <div className="bg-yellow-100 p-4 rounded-lg mb-4 md:mb-0 md:mr-6 flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                  </svg>
                </div>
                <div className="flex-grow">
                  <div className="text-gray-500 mb-1">Current Streak</div>
                  <div className="text-3xl font-bold text-gray-800">
                    {userData?.progress.streakDays || 0} days
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Last active: {userData?.progress.lastActiveDate 
                      ? new Date(userData.progress.lastActiveDate).toLocaleDateString() 
                      : 'Today'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Achievements Section */}
        {userData?.achievements && userData.achievements.length > 0 && (
          <div className={`transition-all duration-700 delay-300 transform ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          } mb-8`}>
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Your Achievements</h2>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {userData.achievements.map((achievement) => (
                  <div key={achievement.id} className="bg-gray-50 p-4 rounded-lg text-center">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center bg-blue-100">
                      <span className="text-xl">{achievement.iconName}</span>
                    </div>
                    <div className="font-medium text-gray-800">{achievement.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{achievement.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Settings Section (if needed) */}
      </main>
    </div>
  );
}