// src/app/challenges/multiple-choice/page.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import dynamic from 'next/dynamic';

// Dynamically import the game component to avoid module not found errors
const PartsOfSpeechGame = dynamic(
  () => import('@/components/challenges/multiple-choice/PartsOfSpeechGame'),
  { 
    loading: () => <div className="min-h-[400px] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>,
    ssr: false // Disable server-side rendering for this component
  }
);
import { useRouter } from 'next/navigation';
import { testPOSTagging, POSToken } from '@/services/gameService';
import Button from '@/components/ui/Button';

export default function MultipleChoicePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // Animation states
  const [isVisible, setIsVisible] = useState(false);
  
  // NLP test states
  const [testSentence, setTestSentence] = useState('Ako ay masaya ngayon.');
  const [testResult, setTestResult] = useState<{ 
    sentence: string; 
    tokens: POSToken[]; 
    method: string;
  } | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);
  const [showNLPTest, setShowNLPTest] = useState(false);

  // Protect this route - redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  // Show animation after component mounts
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Function to test the NLP model
  const handleTestNLP = async () => {
    if (!testSentence.trim()) return;
    
    setTestLoading(true);
    setTestError(null);
    
    // Make sure we're in a browser environment
    if (typeof window === 'undefined') {
      setTestError("This function is only available in the browser");
      setTestLoading(false);
      return;
    }
    
    try {
      console.log('Testing sentence:', testSentence);
      
      // Wrap in a try-catch to handle any potential errors
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If we're redirecting, show nothing
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className={`transition-all duration-700 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        } mb-8`}>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Multiple Choice Challenge</h1>
          <p className="text-gray-600 mb-4">
            Identify the parts of speech in Tagalog sentences. This exercise will help you understand 
            the structure of Tagalog grammar.
          </p>
          
          {/* NLP Test Toggle Button */}
          <button 
            onClick={() => setShowNLPTest(!showNLPTest)}
            className="text-sm text-blue-600 hover:underline"
          >
            {showNLPTest ? 'Hide NLP Test' : 'Show NLP Test (Developer Tool)'}
          </button>
          
          {/* NLP Testing UI */}
          {showNLPTest && (
            <div className="bg-white rounded-lg shadow p-4 mb-6 mt-2">
              <h3 className="font-semibold mb-2">Test CalamanCy NLP Model</h3>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col">
                  <label className="text-sm text-gray-600 mb-1">Enter a Tagalog sentence:</label>
                  <input
                    type="text"
                    value={testSentence}
                    onChange={(e) => setTestSentence(e.target.value)}
                    className="border rounded px-3 py-2"
                    placeholder="Ako ay masaya ngayon."
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={handleTestNLP} disabled={testLoading}>
                    {testLoading ? 'Testing...' : 'Analyze Sentence'}
                  </Button>
                </div>
                
                {testError && (
                  <div className="bg-red-50 text-red-700 p-3 rounded">
                    Error: {testError}
                  </div>
                )}
                
                {testResult && (
                  <div className="mt-2">
                    <div className="flex items-center mb-2">
                      <p className="text-sm mr-2">Method:</p>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        testResult.method === 'calamancy' 
                          ? 'bg-green-100 text-green-800' 
                          : testResult.method === 'fallback'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}>
                        {testResult.method === 'calamancy' 
                          ? '🧠 CalamanCy NLP' 
                          : testResult.method === 'fallback'
                            ? '📚 Python Fallback'
                            : '🔄 JavaScript Fallback'}
                      </span>
                    </div>
                    <p className="text-sm mb-2">Sentence: <span className="font-medium">{testResult.sentence}</span></p>
                    
                    <table className="min-w-full border rounded">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Word</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">POS Tag</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {testResult.tokens.map((token, i) => (
                          <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-2 text-sm font-medium">{token.text}</td>
                            <td className="px-4 py-2 text-sm">
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                                {token.pos}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm">{token.description || 'Unknown'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    {testResult.method !== 'calamancy' && (
                      <p className="text-xs text-gray-500 mt-2 italic">
                        Note: This result was generated using a fallback method because the CalamanCy NLP model is not currently available.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Game Container */}
        <div className={`transition-all duration-700 delay-200 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}>
          <PartsOfSpeechGame difficulty="medium" />
        </div>
      </main>
    </div>
  );
}