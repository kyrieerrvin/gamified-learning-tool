'use client';

import { useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useGameStore } from '@/store/gameStore';

/**
 * DatabaseSyncWrapper - Client component that handles database synchronization
 * This component listens for authentication state changes and loads user data from Firestore
 */
export function DatabaseSyncWrapper({ children }: { children: React.ReactNode }) {
  const { loadUserProgress, checkStreakReset } = useGameStore();
  
  useEffect(() => {
    console.log('[App] Setting up auth state listener');
    
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log(`[App] User authenticated: ${user.uid}`);
        
        // Load user data from Firestore when user is authenticated
        await loadUserProgress();
        
        // Check if streak needs to be reset AFTER loading is complete
        checkStreakReset();
      } else {
        console.log('[App] No authenticated user');
      }
    });
    
    // Clean up listener on unmount
    return () => {
      console.log('[App] Cleaning up auth listener');
      unsubscribe();
    };
  }, [loadUserProgress, checkStreakReset]);
  
  return <>{children}</>;
}
