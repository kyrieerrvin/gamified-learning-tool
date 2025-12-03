// src/components/layout/Header.tsx
import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white shadow-sm">
      <nav className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="font-bold text-xl">
            Filipino Learning
          </Link>
          <div className="flex gap-4">
            <Link href="/challenges/conversation" className="hover:text-blue-600">
              Conversation
            </Link>
            <Link href="/challenges/make-sentence" className="hover:text-blue-600">
              Make a Sentence
            </Link>
            <Link href="/challenges/multiple-choice" className="hover:text-blue-600">
              Multiple Choice
            </Link>
            <Link href="/profile" className="hover:text-blue-600">
              Profile
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}