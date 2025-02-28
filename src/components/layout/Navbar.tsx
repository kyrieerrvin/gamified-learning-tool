// src/components/layout/Navbar.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Close the mobile menu when changing routes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link href="/dashboard" className="text-2xl font-bold text-blue-600 flex items-center">
            TagalogLearn
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link 
              href="/dashboard" 
              className={`text-sm font-medium transition-colors ${pathname === '/dashboard' ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
            >
              Home
            </Link>
            <Link 
              href="/profile" 
              className={`text-sm font-medium transition-colors ${pathname === '/profile' ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
            >
              Profile
            </Link>
            <Link 
              href="/streak" 
              className={`text-sm font-medium transition-colors ${pathname === '/streak' ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
            >
              Streak
            </Link>
            <Link 
              href="/achievements" 
              className={`text-sm font-medium transition-colors ${pathname === '/achievements' ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
            >
              Achievements
            </Link>
            <Link 
              href="/feedback" 
              className={`text-sm font-medium transition-colors ${pathname === '/feedback' ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
            >
              Feedback
            </Link>
            
            {/* User Info & Sign Out */}
            <div className="flex items-center ml-4 pl-4 border-l border-gray-200">
              <div className="text-sm text-gray-600 mr-4">
                {user?.email}
              </div>
              <button
                onClick={signOut}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-blue-600 hover:bg-gray-100 focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-4">
              <Link 
                href="/dashboard" 
                className={`px-2 py-1 text-sm font-medium rounded ${pathname === '/dashboard' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'}`}
              >
                Home
              </Link>
              <Link 
                href="/profile" 
                className={`px-2 py-1 text-sm font-medium rounded ${pathname === '/profile' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'}`}
              >
                Profile
              </Link>
              <Link 
                href="/streak" 
                className={`px-2 py-1 text-sm font-medium rounded ${pathname === '/streak' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'}`}
              >
                Streak
              </Link>
              <Link 
                href="/achievements" 
                className={`px-2 py-1 text-sm font-medium rounded ${pathname === '/achievements' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'}`}
              >
                Achievements
              </Link>
              <Link 
                href="/feedback" 
                className={`px-2 py-1 text-sm font-medium rounded ${pathname === '/feedback' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'}`}
              >
                Feedback
              </Link>
              <div className="pt-4 mt-2 border-t border-gray-200">
                <div className="text-sm text-gray-600 mb-2">
                  {user?.email}
                </div>
                <button
                  onClick={signOut}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}