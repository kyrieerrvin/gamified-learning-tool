// src/app/profile/page.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  
  // Dummy data
  const [userStats, setUserStats] = useState({
    totalScore: 0,
    challengesCompleted: 0,
    joinDate: new Date(),
    level: 1,
    nextLevelPoints: 100,
    completedChallenges: {
      conversation: 0,
      makeSentence: 0,
      multipleChoice: 0
    }
  });
  
  // Animation state
  const [isVisible, setIsVisible] = useState(false);
  
  // States for toggles
  // const [emailNotifications, setEmailNotifications] = useState(false);
  // const [dailyReminder, setDailyReminder] = useState(true);

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
                <p className="text-gray-500 text-sm mt-1">Member since {userStats.joinDate.toLocaleDateString()}</p>
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
                  <div className="text-3xl font-bold text-gray-800">{userStats.totalScore} points</div>
                  <div className="mt-4">
                    <div className="text-sm text-gray-500 mb-1">Progress to next level</div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${Math.min(100, (userStats.totalScore / userStats.nextLevelPoints) * 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Level {userStats.level} • {userStats.totalScore}/{userStats.nextLevelPoints} points to Level {userStats.level + 1}</div>
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
                  <div className="text-3xl font-bold text-gray-800">{userStats.challengesCompleted}</div>
                  
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm font-medium text-gray-600 mb-1">Conversation</div>
                      <div className="text-lg font-semibold text-gray-800">{userStats.completedChallenges.conversation}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm font-medium text-gray-600 mb-1">Make a Sentence</div>
                      <div className="text-lg font-semibold text-gray-800">{userStats.completedChallenges.makeSentence}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm font-medium text-gray-600 mb-1">Multiple Choice</div>
                      <div className="text-lg font-semibold text-gray-800">{userStats.completedChallenges.multipleChoice}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        

        {/* Settings if MERON */}
      </main>
    </div>
  );
}