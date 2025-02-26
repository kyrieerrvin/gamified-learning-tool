// src/app/login/page.tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signInWithEmail, signInWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      await signInWithEmail(email, password);
      // No need to redirect here - it's handled in the auth context
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      
      await signInWithGoogle();
      // No need to redirect here - it's handled in the auth context
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') { // Only set error for non-user-cancelled actions
        setError(err.message || 'Failed to sign in with Google');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Logo section */}
      <div className="p-6">
        <Link href="/" className="flex items-center">
          <div className="text-2xl font-bold text-blue-600">TagalogLearn</div>
        </Link>
      </div>

      {/* Main content */}
      <div className="flex-grow flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold text-center mb-6">
            {isLogin ? 'Log in' : 'Sign up'}
          </h1>
          
          {isLogin && (
            <p className="text-center mb-6 text-gray-600">
              Don't have an account? 
              <button 
                className="text-blue-600 ml-1 hover:underline" 
                onClick={() => setIsLogin(false)}
              >
                Sign up
              </button>
            </p>
          )}
          
          {!isLogin && (
            <p className="text-center mb-6 text-gray-600">
              Already have an account? 
              <button 
                className="text-blue-600 ml-1 hover:underline" 
                onClick={() => setIsLogin(true)}
              >
                Log in
              </button>
            </p>
          )}
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {/* Social login buttons */}
          <div className="space-y-3 mb-4">
            <button 
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-full py-3 px-4 hover:bg-gray-50 transition-colors text-gray-700"
              disabled={loading}
            >
              <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
                <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
                <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
              </svg>
              <span>{loading ? 'Signing in...' : 'Continue with Google'}</span>
            </button>
          </div>
          
          {/* Divider */}
          <div className="relative flex items-center justify-center mb-4">
            <div className="border-t border-gray-300 absolute w-full"></div>
            <div className="bg-gray-50 px-4 z-10 text-sm text-gray-500">OR</div>
          </div>
          
          {/* Email/Password form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email"
                required
                disabled={loading}
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
                required
                disabled={loading}
              />
              <div className="mt-1 text-xs text-blue-600">
                <Link href="/forgot-password" className="hover:underline">
                  Forgot your password?
                </Link>
              </div>
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-600 text-white rounded-full py-3 px-4 font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-400"
              disabled={loading}
            >
              {loading ? 'Signing in...' : (isLogin ? 'Log in' : 'Sign up')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}