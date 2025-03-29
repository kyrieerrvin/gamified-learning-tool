'use client';

import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useAuth } from '@/context/AuthContext';

/**
 * Component that runs on app initialization to ensure user-specific game progress
 * is loaded from Firestore for the currently authenticated user.
 * This helps prevent progress from being mixed between different users.
 */
export default function GameProgressInitializer() {
  const { loadUserProgress } = useGameStore();
  const { user, loading } = useAuth();

  // Load user-specific game progress from Firestore when auth state is determined
  useEffect(() => {
    // Only attempt to load progress when auth is done loading and we have a user
    if (!loading && user) {
      console.log('GameProgressInitializer: Loading game progress for user:', user.uid);
      loadUserProgress().catch(err => {
        console.error('Error initializing user game progress:', err);
      });
    }
  }, [user, loading, loadUserProgress]);

  // This is a utility component that doesn't render anything visible
  return null;
}
