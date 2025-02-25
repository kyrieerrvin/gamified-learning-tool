// src/app/page.tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-10">
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

      {/* Main content */}
      <main>
        {/* Hero Section */}
        <div className="bg-white py-16">
          <div className="container mx-auto px-6 text-center">
            <h1 className="text-4xl font-bold mb-6">Learn Tagalog!</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              A fun way to learn the Philippine language through gamified challenges
            </p>
            <button 
              onClick={() => router.push('/login')}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Start Learning
            </button>
          </div>
        </div>

        {/* Challenge cards */}
        <div className="py-16 bg-gray-50">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-12">Choose Your Challenge</h2>
            
            <div className="flex flex-wrap justify-center gap-8">
              {/* Card 1 */}
              <div className="bg-white rounded-lg shadow-md p-6 w-64">
                <div className="text-xl font-bold mb-2 text-blue-600">Conversation</div>
                <p className="text-gray-600 mb-4">
                  Practice real-world dialogues with context-aware AI feedback
                </p>
              </div>

              {/* Card 2 */}
              <div className="bg-white rounded-lg shadow-md p-6 w-64">
                <div className="text-xl font-bold mb-2 text-indigo-600">Make a Sentence</div>
                <p className="text-gray-600 mb-4">
                  Create meaningful sentences with Tagalog words and phrases
                </p>
              </div>

              {/* Card 3 */}
              <div className="bg-white rounded-lg shadow-md p-6 w-64">
                <div className="text-xl font-bold mb-2 text-purple-600">Multiple Choice</div>
                <p className="text-gray-600 mb-4">
                  Test your knowledge with adaptive quizzes and instant feedback
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* How it works section */}
        <div className="py-16 bg-white">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-blue-600 font-bold">1</div>
                <h3 className="text-xl font-semibold mb-2">Choose a Challenge</h3>
                <p className="text-gray-600 text-center">Select from three different challenge types</p>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4 text-indigo-600 font-bold">2</div>
                <h3 className="text-xl font-semibold mb-2">Learn and Practice</h3>
                <p className="text-gray-600 text-center">Complete challenges to learn new words and phrases</p>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4 text-purple-600 font-bold">3</div>
                <h3 className="text-xl font-semibold mb-2">Build Your Skills</h3>
                <p className="text-gray-600 text-center">Earn points and track your progress</p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to action */}
        <div className="py-16 bg-blue-600 text-white">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Learn Tagalog?</h2>
            <p className="text-blue-100 mb-8 max-w-lg mx-auto">
              Join our community of learners and start building your Tagalog skills today
            </p>
            <button 
              onClick={() => router.push('/login')}
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-medium hover:bg-blue-50"
            >
              Get Started Now
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-8">
        <div className="container mx-auto px-6 text-center">
          <p>© {new Date().getFullYear()} TagalogLearn. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}