// src/components/layout/Navbar.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import { testPOSTagging } from '@/services/game';
import StreakWidget from '@/components/ui/StreakWidget';

export default function Navbar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNlpTest, setShowNlpTest] = useState(false);
  const [testSentence, setTestSentence] = useState('Ako ay masaya ngayon.');
  const [testResult, setTestResult] = useState<{ 
    sentence: string; 
    tokens: { text: string; pos: string; description: string }[]; 
    method: string;
  } | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);
  
  // Close the mobile menu when changing routes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);
  
  // Function to test the NLP model
  const handleTestNLP = async () => {
    if (!testSentence.trim()) return;
    
    setTestLoading(true);
    setTestError(null);
    
    try {
      console.log('Testing sentence:', testSentence);
      
      const result = await testPOSTagging(testSentence);
      console.log('NLP test result:', result);
      
      // Show a method badge based on which processing engine was used
      if (result.method) {
        let methodType = result.method;
        console.log(`NLP processing used: ${methodType}`);
      }
      
      setTestResult(result);
    } catch (error) {
      console.error('NLP test error:', error);
      setTestError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link href="/dashboard" className="text-2xl font-bold text-blue-600 flex items-center">
            TagalogLearn
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-4">
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
            
            {/* NLP Test Button (DEV ONLY) */}
            <button
              onClick={() => setShowNlpTest(true)}
              className="text-sm font-medium px-3 py-1 text-yellow-800 bg-yellow-100 rounded-full hover:bg-yellow-200 transition-colors"
            >
              Test NLP
            </button>
            
            {/* Streak Widget */}
            <div className="mx-2">
              <StreakWidget />
            </div>
            
            {/* User Info & Sign Out */}
            <div className="flex items-center ml-2 pl-4 border-l border-gray-200">
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
              
              {/* NLP Test Button (Mobile) */}
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  setShowNlpTest(true);
                }}
                className="px-2 py-1 text-sm font-medium rounded text-yellow-800 bg-yellow-100 hover:bg-yellow-200"
              >
                Test NLP
              </button>
              
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
      
      {/* NLP Test Modal */}
      {showNlpTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  NLP Test Interface
                  <span className="ml-2 text-xs px-2 py-1 bg-yellow-300 text-yellow-800 rounded-full">DEV ONLY</span>
                </h2>
                <button 
                  onClick={() => setShowNlpTest(false)}
                  className="text-gray-600 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="testSentence" className="block text-sm font-medium text-gray-700 mb-1">
                    Enter a Tagalog sentence to analyze:
                  </label>
                  <textarea
                    id="testSentence"
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    rows={3}
                    value={testSentence}
                    onChange={(e) => setTestSentence(e.target.value)}
                    placeholder="Type a Tagalog sentence here..."
                    disabled={testLoading}
                  />
                </div>
                
                <div>
                  <Button
                    onClick={handleTestNLP}
                    loading={testLoading}
                    disabled={testLoading || !testSentence.trim()}
                  >
                    Analyze Sentence
                  </Button>
                </div>
                
                {testError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    <p className="text-sm font-medium">Error: {testError}</p>
                  </div>
                )}
                
                {testResult && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">Analysis Results</h3>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                        Method: {testResult.method}
                      </span>
                    </div>
                    
                    <p className="mb-3 italic">"{testResult.sentence}"</p>
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Word</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">POS</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {testResult.tokens.map((token, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">{token.text}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm">
                                <span className="px-2 py-1 text-xs rounded-full bg-indigo-100 text-indigo-800">
                                  {token.pos}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-500">{token.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}