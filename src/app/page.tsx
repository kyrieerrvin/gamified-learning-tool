// src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';

export default function Home() {
  const router = useRouter();
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show content with animation after page loads
    setIsVisible(true);

    // Parallax effect on scroll
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculate parallax positions based on scroll
  const calculateParallax = (factor: any) => {
    return {
      transform: `translateY(${scrollY * factor}px)`,
    };
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Fixed navigation */}
      <nav className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="text-2xl font-bold text-blue-600">TagalogLearn</div>
            <div className="flex items-center space-x-6">
              <Link 
                href="/about" 
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                About
              </Link>
              <Link 
                href="/contact" 
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                Contact
              </Link>
              <button 
                onClick={() => router.push('/login')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Learn Now
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content with top padding for fixed nav */}
      <main className="pt-20">
        {/* Hero Section with parallax background */}
        <div 
          className="relative h-screen flex items-center justify-center overflow-hidden"
          style={{
            background: "linear-gradient(rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.8))",
          }}
        >
          {/* Parallax floating shapes */}
          <div 
            className="absolute inset-0 pointer-events-none" 
            style={calculateParallax(0.05)}
          >
            <div className="absolute top-20 left-40 w-40 h-40 bg-blue-200 rounded-full opacity-20"></div>
            <div className="absolute top-40 right-20 w-60 h-60 bg-indigo-200 rounded-full opacity-20"></div>
            <div className="absolute bottom-20 right-40 w-40 h-40 bg-purple-200 rounded-full opacity-20"></div>
            <div className="absolute bottom-40 left-20 w-60 h-60 bg-green-200 rounded-full opacity-20"></div>
          </div>

          <div className="container mx-auto px-6 text-center relative z-10">
            <div 
              className={`transition-all duration-1000 transform ${
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
              }`}
            >
              <h1 className="text-4xl md:text-6xl font-bold mb-6">Learn Tagalog!</h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
                A fun and interactive way to learn the Philippine language through gamified challenges
              </p>
              <button 
                onClick={() => router.push('/login')}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-all hover:scale-105 text-lg"
              >
                Start Learning
              </button>
            </div>
          </div>

          {/* Bouncing down arrow */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>

        {/* Challenge cards with parallax effect */}
        <div 
          className="py-20 bg-white relative overflow-hidden"
          style={{ 
            boxShadow: "0 -10px 15px -5px rgba(0, 0, 0, 0.05) inset" 
          }}
        >
          <div className="container mx-auto px-6">
            <h2 
              className="text-3xl font-bold text-center mb-16"
              style={calculateParallax(-0.03)}
            >
              Fun Learning Challenges
            </h2>
            
            <div className="relative max-w-4xl mx-auto">
              {/* Triangle connecting lines */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 400" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ zIndex: 0 }}>
                <path d="M200 120 L600 120 L400 320 L200 120" stroke="rgba(37, 99, 235, 0.1)" strokeWidth="2" strokeDasharray="6 4" />
                <circle cx="200" cy="120" r="8" fill="rgba(37, 99, 235, 0.2)" />
                <circle cx="600" cy="120" r="8" fill="rgba(37, 99, 235, 0.2)" />
                <circle cx="400" cy="320" r="8" fill="rgba(37, 99, 235, 0.2)" />
              </svg>

              {/* Cards */}
              <div className="flex flex-wrap justify-center gap-8 relative z-10">
                {/* Card 1 with parallax */}
                <div 
                  className="bg-white rounded-2xl shadow-md p-6 w-64 transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  style={{
                    ...calculateParallax(-0.02),
                    transitionProperty: "transform, box-shadow, background-color",
                  }}
                >
                  <div className="text-sm text-gray-500 mb-1">Challenge 1</div>
                  <div className="text-xl font-bold mb-2 text-blue-600">Conversation</div>
                  <p className="text-gray-600 mb-4">
                    Practice real-world dialogues with context-aware AI feedback
                  </p>
                  <div className="flex justify-end">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Card 2 with parallax */}
                <div 
                  className="bg-white rounded-2xl shadow-md p-6 w-64 transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  style={{
                    ...calculateParallax(-0.01),
                    transitionProperty: "transform, box-shadow, background-color",
                  }}
                >
                  <div className="text-sm text-gray-500 mb-1">Challenge 2</div>
                  <div className="text-xl font-bold mb-2 text-indigo-600">Make a Sentence</div>
                  <p className="text-gray-600 mb-4">
                    Create meaningful sentences with Tagalog words and phrases
                  </p>
                  <div className="flex justify-end">
                    <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Card 3 with parallax */}
                <div 
                  className="bg-white rounded-2xl shadow-md p-6 w-64 transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  style={{
                    ...calculateParallax(-0.03),
                    transitionProperty: "transform, box-shadow, background-color",
                  }}
                >
                  <div className="text-sm text-gray-500 mb-1">Challenge 3</div>
                  <div className="text-xl font-bold mb-2 text-purple-600">Multiple Choice</div>
                  <p className="text-gray-600 mb-4">
                    Test your knowledge with adaptive quizzes and instant feedback
                  </p>
                  <div className="flex justify-end">
                    <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How it works section with parallax */}
        <div className="py-20 bg-gray-50 relative overflow-hidden">
          <div 
            className="absolute inset-0 pointer-events-none" 
            style={calculateParallax(0.03)}
          >
            <div className="absolute top-20 left-1/4 w-20 h-20 bg-blue-300 rounded-full opacity-10"></div>
            <div className="absolute top-40 right-1/4 w-32 h-32 bg-indigo-300 rounded-full opacity-10"></div>
            <div className="absolute bottom-20 right-1/3 w-24 h-24 bg-purple-300 rounded-full opacity-10"></div>
            <div className="absolute bottom-40 left-1/3 w-32 h-32 bg-green-300 rounded-full opacity-10"></div>
          </div>

          <div className="container mx-auto px-6">
            <h2 
              className="text-3xl font-bold text-center mb-16"
              style={calculateParallax(-0.02)}
            >
              How It Works
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto relative z-10">
              <div 
                className="flex flex-col items-center transform transition-all duration-500 hover:scale-105"
                style={calculateParallax(-0.01)}
              >
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6 text-blue-600 font-bold text-2xl shadow-md">1</div>
                <h3 className="text-xl font-semibold mb-3">Choose a Challenge</h3>
                <p className="text-gray-600 text-center">Select from three different challenge types to practice different aspects of Tagalog</p>
              </div>
              
              <div 
                className="flex flex-col items-center transform transition-all duration-500 hover:scale-105"
                style={calculateParallax(-0.02)}
              >
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-6 text-indigo-600 font-bold text-2xl shadow-md">2</div>
                <h3 className="text-xl font-semibold mb-3">Learn and Practice</h3>
                <p className="text-gray-600 text-center">Complete challenges to learn new words and phrases with helpful feedback</p>
              </div>
              
              <div 
                className="flex flex-col items-center transform transition-all duration-500 hover:scale-105"
                style={calculateParallax(-0.03)}
              >
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-6 text-purple-600 font-bold text-2xl shadow-md">3</div>
                <h3 className="text-xl font-semibold mb-3">Build Your Skills</h3>
                <p className="text-gray-600 text-center">Earn points, track your progress, and watch your Tagalog skills improve</p>
              </div>
            </div>
          </div>
        </div>

        {/* Fun Tagalog Facts */}
        <div className="py-20 bg-white relative overflow-hidden">
          <div className="container mx-auto px-6">
            <h2 
              className="text-3xl font-bold text-center mb-16"
              style={calculateParallax(-0.02)}
            >
              Fun Tagalog Facts
            </h2>
            
            <div className="flex flex-wrap justify-center gap-8">
              <div 
                className="bg-blue-50 rounded-xl p-6 max-w-xs transform transition-all duration-500 hover:scale-105 hover:rotate-1"
                style={calculateParallax(-0.01)}
              >
                <div className="text-blue-600 text-4xl font-bold mb-2">22M+</div>
                <p className="text-gray-700">Tagalog is spoken by over 22 million people worldwide</p>
              </div>
              
              <div 
                className="bg-indigo-50 rounded-xl p-6 max-w-xs transform transition-all duration-500 hover:scale-105 hover:-rotate-1"
                style={calculateParallax(-0.02)}
              >
                <div className="text-indigo-600 text-4xl font-bold mb-2">1937</div>
                <p className="text-gray-700">Tagalog was made the national language of the Philippines in 1937</p>
              </div>
              
              <div 
                className="bg-purple-50 rounded-xl p-6 max-w-xs transform transition-all duration-500 hover:scale-105 hover:rotate-1"
                style={calculateParallax(-0.03)}
              >
                <div className="text-purple-600 text-4xl font-bold mb-2">8</div>
                <p className="text-gray-700">Tagalog has 8 major dialect groups across different regions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to action */}
        <div className="py-20 bg-gradient-to-r from-blue-500 to-indigo-600 text-white relative overflow-hidden">
          <div 
            className="absolute inset-0 pointer-events-none" 
            style={calculateParallax(0.05)}
          >
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-white rounded-full opacity-5"></div>
            <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-white rounded-full opacity-5"></div>
          </div>

          <div className="container mx-auto px-6 text-center relative z-10">
            <h2 
              className="text-3xl md:text-4xl font-bold mb-6"
              style={calculateParallax(-0.01)}
            >
              Ready to Learn Tagalog?
            </h2>
            <p 
              className="text-blue-100 mb-8 max-w-lg mx-auto"
              style={calculateParallax(-0.02)}
            >
              Join our community of learners and start building your Tagalog skills today
            </p>
            <button 
              onClick={() => router.push('/login')}
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-medium hover:bg-blue-50 transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
              style={calculateParallax(-0.03)}
            >
              Get Started Now
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-2xl font-bold text-white mb-6 md:mb-0">TagalogLearn</div>
            <div className="flex flex-wrap justify-center gap-6">
              <Link href="/about" className="hover:text-white transition-colors">About</Link>
              <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 text-center text-sm">
            <p> {new Date().getFullYear()} TagalogLearn. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}