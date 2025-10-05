'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useGameProgress } from '@/hooks/useGameProgress';

type Message = { role: 'user' | 'bot'; text: string };

export default function ConversationPlayPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { progress, addPoints } = useGameProgress();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionPoints, setSessionPoints] = useState(0);
  const [sessionStreak, setSessionStreak] = useState(0);

  // Lifetime points come from Firestore progress (conversation.xp)
  const lifetimePoints = useMemo(() => {
    try {
      // @ts-ignore flexible schema
      const conv = (progress as any)?.['conversation'];
      return (conv?.xp as number) || 0;
    } catch {
      return 0;
    }
  }, [progress]);

  // Initialize/reset session counters when entering page; reset again on unmount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const uid = (user as any)?.uid || 'anon';
    const pointsKey = `conv_session_points:${uid}`;
    const streakKey = `conv_session_streak:${uid}`;
    try {
      sessionStorage.setItem(pointsKey, '0');
      sessionStorage.setItem(streakKey, '0');
    } catch {}
    setSessionPoints(0);
    setSessionStreak(0);
    return () => {
      try {
        sessionStorage.setItem(pointsKey, '0');
        sessionStorage.setItem(streakKey, '0');
      } catch {}
    };
  }, [user]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', text }]);
    setLoading(true);
    try {
      const resp = await fetch('/api/challenges/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      const data = await resp.json();
      const reply = data?.reply ?? '...';
      const replyParts: string[] | undefined = Array.isArray(data?.replyParts) ? data.replyParts : undefined;
      const delta = Number(data?.scoreDelta || 0);

      // Persist lifetime points to Firestore
      if (!Number.isNaN(delta) && delta > 0) {
        try { await addPoints(delta, 'conversation'); } catch {}
        // Track session points in sessionStorage
        if (typeof window !== 'undefined') {
          const uid = (user as any)?.uid || 'anon';
          const key = `conv_session_points:${uid}`;
          const newSession = sessionPoints + delta;
          setSessionPoints(newSession);
          try { sessionStorage.setItem(key, String(newSession)); } catch {}
        }
        // Update streak: increment on scoring turn
        const uid = (user as any)?.uid || 'anon';
        const streakKey = `conv_session_streak:${uid}`;
        const newStreak = sessionStreak + 1;
        setSessionStreak(newStreak);
        try { sessionStorage.setItem(streakKey, String(newStreak)); } catch {}
      } else {
        // Reset streak on non-scoring turn
        const uid = (user as any)?.uid || 'anon';
        const streakKey = `conv_session_streak:${uid}`;
        setSessionStreak(0);
        try { sessionStorage.setItem(streakKey, '0'); } catch {}
      }

      // Use backend reply as-is to avoid duplicate "Puntos"
      // Append client-side gamification feedback (no points text)
      let feedback = '';
      const nextStreak = (!Number.isNaN(delta) && delta > 0) ? (sessionStreak + 1) : 0;
      if (nextStreak >= 2) {
        // feedback = ` 🔥 Streak Bonus! ${nextStreak} sunod-sunod na puntos.`;
        feedback =  `🔥 Ang galing mo gumawa ng pangungusap!`;
      }
      // If we received split parts, render each as its own bubble
      if (replyParts && replyParts.length > 0) {
        setMessages((m) => [
          ...m,
          ...replyParts.map((p) => ({ role: 'bot' as const, text: p })),
          ...(feedback ? [{ role: 'bot' as const, text: feedback.trim() }] : [])
        ]);
      } else {
        setMessages((m) => [...m, { role: 'bot', text: (reply + feedback).trim() }]);
      }
    } catch (e) {
      setMessages((m) => [...m, { role: 'bot', text: 'Nagka-error. Subukan muli.' }]);
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') send();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/dashboard')}
              className="mr-4 text-gray-600 hover:text-gray-900 bg-white p-2 rounded-full shadow hover:shadow-md transition-all"
              aria-label="Go back to dashboard"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </motion.button>
            <h2 className="text-xl font-bold">PinoyPal</h2>
          </div>
          <span className="text-sm font-semibold text-duolingo-green">Puntos: {lifetimePoints}</span>
        </div>
        <div className="h-80 overflow-y-auto border rounded-lg p-3 bg-gray-50 space-y-2">
          {messages.map((m, i) => (
            <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
              <span className={
                'inline-block px-3 py-2 rounded-lg ' +
                (m.role === 'user' ? 'bg-duolingo-green text-white' : 'bg-gray-200 text-gray-900')
              }>
                {m.text}
              </span>
            </div>
          ))}
          {messages.length === 0 && (
            <p className="text-gray-500 text-sm">Kausapin mo ako!</p>
          )}
        </div>
        <div className="mt-4 flex gap-2">
          <input
            className="flex-1 border rounded-lg px-3 py-2"
            placeholder="I-type ang iyong mensahe..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            disabled={loading}
          />
          <Button onClick={send} disabled={loading} className="bg-duolingo-green text-white">
            {loading ? '...' : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  );
}
