'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import {
  createOrUpdateUser,
  getUserData,
  updateUserProgress,
  addUserAchievement,
  addChallengeResult as addChallengeResultService,
  updateUserPreferences,
} from '@/services/user/userService';
import { 
  UserData,
  UserProgress, 
  UserAchievement, 
  ChallengeResult,
  UserContextType
} from '@/types/user';

// Create the context with default values
const UserContext = createContext<UserContextType>({
  userData: null,
  loading: true,
  error: null,
  updateUserProgress: async () => {},
  updateUserAchievements: async () => {},
  addChallengeResult: async () => {},
  updateUserPreferences: async () => {},
});

// Custom hook to use the user context
export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch user data when auth state changes
  useEffect(() => {
    let isMounted = true;

    const fetchUserData = async () => {
      try {
        if (!user) {
          if (isMounted) {
            setUserData(null);
            setLoading(false);
          }
          return;
        }

        // First, create or update the user in Firestore
        const updatedUserData = await createOrUpdateUser(user);
        
        // Then get the full user data
        if (isMounted) {
          setUserData(updatedUserData);
          setLoading(false);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch user data'));
          setLoading(false);
        }
      }
    };

    // Only fetch user data if auth is not loading
    if (!authLoading) {
      setLoading(true);
      fetchUserData();
    }

    return () => {
      isMounted = false;
    };
  }, [user, authLoading]);

  // Update user progress
  const handleUpdateUserProgress = async (progressUpdate: Partial<UserProgress>) => {
    if (!user || !userData) return;

    try {
      await updateUserProgress(user.uid, progressUpdate);
      
      // Update local state
      setUserData(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          progress: {
            ...prev.progress,
            ...progressUpdate,
          },
          updatedAt: new Date().toISOString(),
        };
      });
    } catch (err) {
      console.error('Error updating user progress:', err);
      setError(err instanceof Error ? err : new Error('Failed to update user progress'));
    }
  };

  // Add new achievement
  const handleUpdateUserAchievements = async (achievement: UserAchievement) => {
    if (!user || !userData) return;

    try {
      await addUserAchievement(user.uid, achievement);
      
      // Update local state
      setUserData(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          achievements: [...prev.achievements, achievement],
          updatedAt: new Date().toISOString(),
        };
      });
    } catch (err) {
      console.error('Error adding achievement:', err);
      setError(err instanceof Error ? err : new Error('Failed to add achievement'));
    }
  };

  // Add challenge result
  const handleAddChallengeResult = async (result: ChallengeResult) => {
    if (!user || !userData) return;

    try {
      await addChallengeResultService(user.uid, result);
      
      // Instead of manually updating the state, fetch the latest user data
      // This ensures all calculated fields (streaks, levels, etc.) are accurate
      const updatedUserData = await getUserData(user.uid);
      if (updatedUserData) {
        setUserData(updatedUserData);
      }
    } catch (err) {
      console.error('Error adding challenge result:', err);
      setError(err instanceof Error ? err : new Error('Failed to add challenge result'));
    }
  };

  // Update user preferences
  const handleUpdateUserPreferences = async (preferencesUpdate: Partial<UserData['preferences']>) => {
    if (!user || !userData) return;

    try {
      await updateUserPreferences(user.uid, preferencesUpdate);
      
      // Update local state
      setUserData(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          preferences: {
            ...prev.preferences,
            ...preferencesUpdate,
          },
          updatedAt: new Date().toISOString(),
        };
      });
    } catch (err) {
      console.error('Error updating preferences:', err);
      setError(err instanceof Error ? err : new Error('Failed to update preferences'));
    }
  };

  const value = {
    userData,
    loading: loading || authLoading,
    error,
    updateUserProgress: handleUpdateUserProgress,
    updateUserAchievements: handleUpdateUserAchievements,
    addChallengeResult: handleAddChallengeResult,
    updateUserPreferences: handleUpdateUserPreferences,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
