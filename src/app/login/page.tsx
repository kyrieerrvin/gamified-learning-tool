// src/app/login/page.tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Basic login handling - would be connected to Firebase in future
    console.log('Login attempt with:', email);
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="p-4 border-b">
        <Link href="/" className="text-xl font-bold text-blue-600">
          TagalogLearn
        </Link>
      </header>

      {/* Login form */}
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold text-center mb-6">Log in</h1>
        
        {/* Social login */}
        <button 
          onClick={() => router.push('/auth/google')}
          className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-md p-2 mb-4"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" fill="#4285F4"/>
          </svg>
          <span>Continue with Google</span>
        </button>
        
        {/* Divider */}
        <div className="relative flex items-center justify-center mb-4">
          <div className="border-t border-gray-300 absolute w-full"></div>
          <div className="bg-white px-4 z-10 text-sm text-gray-500">or</div>
        </div>
        
        {/* Email login form */}
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
            <div className="mt-1 text-xs text-blue-600">
              <Link href="/forgot-password">Forgot your password?</Link>
            </div>
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-600 text-white rounded-md py-2 px-4 hover:bg-blue-700"
          >
            Log in
          </button>
        </form>
        
        {/* Sign up link */}
        <div className="mt-6 text-center text-sm">
          <p>
            Don't have an account?{' '}
            <Link href="/signup" className="text-blue-600">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}