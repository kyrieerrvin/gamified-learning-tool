'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { useGameStore, ChallengeResult, UserProfile } from '@/store/gameStore';

// Simplified interface that matches gameStore data structure
export interface UserContextType {
  userData: UserProfile | null;
  loading: boolean;
  error: Error | null;
  updateUserProgress: (score: number) => Promise<void>;
  updateUserAchievements: (achievementId: string) => Promise<void>;
  addChallengeResult: (result: ChallengeResult) => Promise<void>;
  updateUserPreferences: (preferences: Partial<UserProfile['preferences']>) => Promise<void>;
}

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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Get all needed functions and data from gameStore
  const { 
    profile, 
    addPoints, 
    addChallengeResult: gameStoreAddChallengeResult,
    updateUserProfile,
    loadUserProgress,
    saveUserProgress
  } = useGameStore();

  // Load user data when auth state changes
  useEffect(() => {
    let isMounted = true;

    const initializeUserData = async () => {
      try {
        if (!user) {
          if (isMounted) {
            setLoading(false);
          }
          return;
        }

        // Load user progress from gameStore
        await loadUserProgress();
        
        // Update profile with latest user info
        updateUserProfile({
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          joinDate: profile?.joinDate || new Date().toISOString(),
          lastActiveDate: new Date().toISOString(),
          preferences: profile?.preferences || {
            emailNotifications: false,
            dailyReminder: true,
          }
        });
        
        if (isMounted) {
          setLoading(false);
          setError(null);
        }
      } catch (err) {
        console.error('Error initializing user data:', err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to initialize user data'));
          setLoading(false);
        }
      }
    };

    // Only initialize user data if auth is not loading
    if (!authLoading) {
      setLoading(true);
      initializeUserData();
    }

    return () => {
      isMounted = false;
    };
  }, [user, authLoading]);

  // Update user progress (add points)
  const handleUpdateUserProgress = async (score: number) => {
    if (!user) return;

    try {
      addPoints(score, 'general');
      await saveUserProgress();
    } catch (err) {
      console.error('Error updating user progress:', err);
      setError(err instanceof Error ? err : new Error('Failed to update user progress'));
    }
  };

  // Add new achievement (simplified - just add to store)
  const handleUpdateUserAchievements = async (achievementId: string) => {
    if (!user) return;

    try {
      // The gameStore handles achievement logic internally
      // Just save to persist the changes
      await saveUserProgress();
    } catch (err) {
      console.error('Error adding achievement:', err);
      setError(err instanceof Error ? err : new Error('Failed to add achievement'));
    }
  };

  // Add challenge result
  const handleAddChallengeResult = async (result: ChallengeResult) => {
    if (!user) return;

    try {
      gameStoreAddChallengeResult(result);
      await saveUserProgress();
    } catch (err) {
      console.error('Error adding challenge result:', err);
      setError(err instanceof Error ? err : new Error('Failed to add challenge result'));
    }
  };

  // Update user preferences
  const handleUpdateUserPreferences = async (preferencesUpdate: Partial<UserProfile['preferences']>) => {
    if (!user || !profile) return;

    try {
      updateUserProfile({
        ...profile,
        preferences: {
          ...profile.preferences,
          ...preferencesUpdate,
        }
      });
      await saveUserProgress();
    } catch (err) {
      console.error('Error updating preferences:', err);
      setError(err instanceof Error ? err : new Error('Failed to update preferences'));
    }
  };

  const value = {
    userData: profile,
    loading: loading || authLoading,
    error,
    updateUserProgress: handleUpdateUserProgress,
    updateUserAchievements: handleUpdateUserAchievements,
    addChallengeResult: handleAddChallengeResult,
    updateUserPreferences: handleUpdateUserPreferences,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
