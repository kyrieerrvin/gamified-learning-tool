// src/context/AuthContext.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithEmail: async () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper function to set a session cookie for the middleware
  function setSessionCookie(token: string) {
    // Set a session cookie that expires in 7 days
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);
    
    document.cookie = `session=${token}; expires=${expires.toUTCString()}; path=/;`;
  }

  // Helper to clear session cookie
  function clearSessionCookie() {
    document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  }

  useEffect(() => {
    console.log("Setting up auth state listener");
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("Auth state changed:", currentUser?.email || "no user");
      setUser(currentUser);
      
      // Set or clear session cookie based on auth state
      if (currentUser) {
        // For security purposes in a real app, this should be done by your backend
        // This is a simplified approach for demonstration
        currentUser.getIdToken().then(token => {
          setSessionCookie(token);
        });
      } else {
        clearSessionCookie();
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Login successful:", userCredential.user.email);
      
      // Direct browser navigation
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Error signing in with email:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      // Add additional OAuth scopes
      provider.addScope('email');
      provider.addScope('profile');
      // Enable one-tap sign-in
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const result = await signInWithPopup(auth, provider);
      console.log("Google login successful:", result.user.email);
      
      // Get the auth token 
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        // Set the user in state to ensure it's available immediately
        setUser(result.user);
        
        // Set the session cookie immediately
        await result.user.getIdToken().then(token => {
          setSessionCookie(token);
        });
        
        // Wait a moment to ensure the cookie is set and user state is updated
        setTimeout(() => {
          console.log("Redirecting to dashboard after Google login");
          window.location.href = '/dashboard';
        }, 300);
      } else {
        console.error("No credential returned from Google login");
      }
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      if (error.code !== 'auth/popup-closed-by-user') {
        throw error;
      }
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      clearSessionCookie();
      console.log("Signed out successfully");
      
      // Direct browser navigation
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signInWithEmail,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};