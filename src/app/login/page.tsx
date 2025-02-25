// src/app/login/page.tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: any) => {
    e.preventDefault();
    // Handle login/signup logic here
    router.push('/dashboard');
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
          
          {/* Social login buttons */}
          <div className="space-y-3 mb-4">
            <button 
              onClick={() => router.push('/auth/google')}
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-full py-3 px-4 hover:bg-gray-50 transition-colors text-gray-700"
            >
              <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1, 0, 0, 1, 0, 0)">
                  <path d="M21.35,11.1H12v3.2h5.59c-0.51,2.83-2.94,4.95-5.59,4.95c-3.31,0-6-2.69-6-6s2.69-6,6-6c1.52,0,2.9,0.57,3.95,1.5 l2.55-2.55C16.98,4.83,14.73,4,12,4c-4.97,0-9,4.03-9,9s4.02,9,9,9c7.01,0,9.45-6.38,8.35-10.9C20.35,11.1,21.35,11.1,21.35,11.1z" fill="#EA4335"/>
                  <path d="M21.35,11.1H12v3.2h5.59c-0.25,1.42-1.01,2.61-2.12,3.4v0.02h0.02c1.47-0.85,2.75-2.31,3.43-4.12 C18.92,13.6,21.35,11.1,21.35,11.1z" fill="#FBBC05"/>
                  <path d="M12,19.2c3.31,0,6-2.69,6-6s-2.69-6-6-6s-6,2.69-6,6S8.69,19.2,12,19.2z M12,7.2c-3.31,0-6,2.69-6,6s2.69,6,6,6 s6-2.69,6-6S15.31,7.2,12,7.2z" fill="#34A853"/>
                  <path d="M6,12c0-0.39,0.04-0.77,0.12-1.14l-4.04-3.06C1.4,9.04,1,10.48,1,12s0.4,2.96,1.07,4.2l4.04-3.06 C6.04,12.77,6,12.39,6,12z" fill="#4285F4"/>
                </g>
              </svg>
              <span>Continue with Google</span>
            </button>
            
            <button 
              onClick={() => router.push('/auth/apple')}
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-full py-3 px-4 hover:bg-gray-50 transition-colors text-gray-700"
            >
              <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.569 12.6254C17.597 15.4237 20.2179 16.3088 20.247 16.3216C20.2248 16.4014 19.8959 17.5356 19.1439 18.6827C18.5205 19.6559 17.8713 20.6228 16.8402 20.6483C15.8283 20.6738 15.4922 20.0177 14.3311 20.0177C13.1636 20.0177 12.8021 20.6228 11.8599 20.6738C10.8598 20.7249 10.0994 19.6431 9.47946 18.6761C8.19673 16.6913 7.23465 12.9457 8.53668 10.4269C9.17265 9.17695 10.3147 8.3701 11.5715 8.3446C12.5524 8.31911 13.4891 9.03815 14.1058 9.03815C14.7289 9.03815 15.8667 8.17381 17.0598 8.34969C17.6642 8.38028 18.7886 8.61856 19.5196 9.68571C19.4442 9.73139 17.5471 10.7999 17.569 12.6254ZM15.3131 6.56311C15.8219 5.93152 16.1508 5.06719 16.0435 4.21024C15.3259 4.24083 14.4445 4.71077 13.9102 5.33727C13.4378 5.8881 13.0325 6.77803 13.1591 7.61409C13.9616 7.67486 14.8043 7.19129 15.3131 6.56311Z" fill="black"/>
              </svg>
              <span>Continue with Apple</span>
            </button>
            
            <button 
              onClick={() => router.push('/auth/facebook')}
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-full py-3 px-4 hover:bg-gray-50 transition-colors text-gray-700"
            >
              <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96C18.34 21.21 22 17.06 22 12.06C22 6.53 17.5 2.04 12 2.04Z" fill="#1877F2"/>
              </svg>
              <span>Continue with Facebook</span>
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
              />
              <div className="mt-1 text-xs text-blue-600">
                <Link href="/phone-login" className="hover:underline">
                  Use your cell phone number
                </Link>
              </div>
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
              />
              <div className="mt-1 text-xs text-blue-600">
                <Link href="/forgot-password" className="hover:underline">
                  Forgot your password?
                </Link>
              </div>
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-600 text-white rounded-full py-3 px-4 font-medium hover:bg-blue-700 transition-colors"
            >
              {isLogin ? 'Log in' : 'Sign up'}
            </button>
          </form>
          
          {/* SSO login */}
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>
              Does your company use single sign-on?{' '}
              <Link href="/sso-login" className="text-blue-600 hover:underline">
                Log in with SSO
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}