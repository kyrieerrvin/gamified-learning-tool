'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
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
  const [sessionEntities, setSessionEntities] = useState<[string, string][]>([]);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [xpBursts, setXpBursts] = useState<{ id: number; text: string }[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const focusInput = () => {
    try { setTimeout(() => inputRef.current?.focus(), 0); } catch {}
  };

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
      // Reset backend conversation state for a fresh session
      fetch('/api/challenges/conversation/reset', { method: 'POST', cache: 'no-store' }).catch(() => {});
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

  // Greeting shown every time the conversation page is opened (per mount)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const greeting =
      'Kumusta! Ako si PinoyPal! Upang magkaroon ng puntos, gumamit ng tao, lugar, o organisasyon sa iyong mga pangungusap!';
    setMessages((m) => (m.length === 0 ? [{ role: 'bot', text: greeting }] : m));
    focusInput();
  }, []);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    focusInput();
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

        // Show floating +XP animation near header
        const id = Date.now();
        setXpBursts((b) => [...b, { id, text: `+${delta} XP 🎉` }]);
        setTimeout(() => {
          setXpBursts((b) => b.filter((x) => x.id !== id));
        }, 2000);
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

      // Parse and accumulate entities mentioned in this response
      try {
        const source = replyParts && replyParts.length > 0 ? replyParts.join(' ') : String(reply);
        const matches = Array.from(source.matchAll(/'([^']+)'\s*\(([A-Z]{2,})\)/g));
        if (matches.length > 0) {
          setSessionEntities((prev) => [
            ...prev,
            ...matches.map((m) => [m[1], m[2]] as [string, string])
          ]);
        }
      } catch {}
    } catch (e) {
      setMessages((m) => [...m, { role: 'bot', text: 'Nagka-error. Subukan muli.' }]);
    } finally {
      setLoading(false);
      focusInput();
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') send();
  };

  const endConversation = async () => {
    try {
      // Fetch latest summary to capture entities and log from backend
      const resp = await fetch('/api/challenges/conversation/summary', { cache: 'no-store' });
      const summary = await resp.json().catch(() => null);
      // Store minimal snapshot in session for the summary page
      if (typeof window !== 'undefined') {
        const uid = (user as any)?.uid || 'anon';
        const key = `conv_summary_snapshot:${uid}`;
        const snapshot = {
          // Prefer the client-tracked session points for this conversation
          points: sessionPoints,
          level: summary?.level ?? 0,
          // Prefer client-accumulated session entities and messages
          entities: sessionEntities,
          conversation: messages.map((m) => (m.role === 'user' ? { user: m.text } : { bot: m.text })),
          lifetimePoints
        };
        try { sessionStorage.setItem(key, JSON.stringify(snapshot)); } catch {}
      }
    } catch {}
    router.push('/challenges/conversation/summary');
  };

  // Auto-scroll to latest message when messages change
  useEffect(() => {
    try {
      if (bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        return;
      }
      if (scrollContainerRef.current) {
        const el = scrollContainerRef.current;
        el.scrollTop = el.scrollHeight;
      }
    } catch {}
  }, [messages]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#FFF9F2]">
      {/* Subtle festive accents to match summary */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-10 -left-10 w-64 h-64 rounded-full bg-blue-600 opacity-[0.06]" />
        <div className="absolute bottom-0 -right-10 w-56 h-56 rounded-full bg-red-600 opacity-[0.06]" />
        <div className="absolute top-1/3 right-1/3 w-40 h-40 rounded-full bg-yellow-400 opacity-[0.06]" />
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="mx-auto max-w-2xl rounded-2xl shadow-xl p-0 bg-white/70 backdrop-blur border border-blue-50 overflow-hidden">
          {/* Header with gradient bar */}
          <div className="bg-gradient-to-r from-blue-600 to-yellow-400 px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center text-2xl">👩‍🏫</div>
              <h2 className="text-white font-bold text-lg">💬 Practice with PinoyPal!</h2>
            </div>
            <div className="relative">
              <div className="flex items-center gap-2 text-white text-sm">
                <span className="hidden sm:inline">XP</span>
                <span className="text-base">🏅</span>
              </div>
              {/* XP progress bar */}
              <div className="mt-1 w-40 bg-white/30 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-300"
                  style={{ width: `${Math.min(100, ((lifetimePoints % 50) / 50) * 100)}%` }}
                />
              </div>
              <div className="text-[11px] text-white/90 mt-1">Lvl {Math.floor(lifetimePoints / 50) + 1} • {lifetimePoints} XP</div>
              {/* Floating XP bursts */}
              <div className="absolute top-6 right-2">
                <AnimatePresence>
                  {xpBursts.map((b) => (
                    <motion.div
                      key={b.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: -6 }}
                      exit={{ opacity: 0, y: -18 }}
                      transition={{ duration: 0.8 }}
                      className="text-white font-extrabold drop-shadow"
                    >
                      {b.text}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Top stats inside chatbox */}
          <div className="px-4 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl bg-blue-50 p-3 border border-blue-100">
                <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm md:text-base"><span className="text-lg">⭐️</span> XP ngayong sesyon</div>
                <div className="mt-1 text-2xl md:text-3xl font-bold text-blue-700">{sessionPoints}</div>
              </div>
              <div className="rounded-xl bg-yellow-50 p-3 border border-yellow-100">
                <div className="flex items-center gap-2 text-yellow-700 font-semibold text-sm md:text-base"><span className="text-lg">🔥</span> Sunod-sunod</div>
                <div className="mt-1 text-2xl md:text-3xl font-bold text-yellow-800">{sessionStreak}</div>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-700">Tip: Banggitin ang pangalan ng tao, lugar, o organisasyon para makakuha ng puntos!</div>
          </div>

          {/* Chat area */}
          <div className="p-4 pt-2">
            <div ref={scrollContainerRef} className="h-[35vh] sm:h-[40vh] lg:h-[45vh] xl:h-[50vh] overflow-y-auto rounded-xl p-4 bg-gradient-to-b from-blue-50 via-white to-yellow-50 border border-gray-100 space-y-4">
              <AnimatePresence initial={false}>
                {messages.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                    className={m.role === 'user' ? 'text-right' : 'text-left'}
                  >
                <span className={
                      'inline-block px-4 py-3 rounded-2xl shadow ' +
                      (m.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-yellow-50 text-gray-900 border border-yellow-100')
                    }>
                      {m.text}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
              {/* Typing indicator */}
              {loading && (
                <div className="text-left">
                  <span className="inline-block px-4 py-3 rounded-2xl bg-yellow-50 text-gray-900 border border-yellow-100">
                    <span className="inline-flex gap-1">
                      <motion.span animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block">
                        •
                      </motion.span>
                      <motion.span animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.15 }} className="inline-block">
                        •
                      </motion.span>
                      <motion.span animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.3 }} className="inline-block">
                        •
                      </motion.span>
                    </span>
                  </span>
                </div>
              )}
              {messages.length === 0 && (
                <p className="text-gray-500 text-sm">Kausapin mo ako!</p>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="mt-4 flex gap-3 items-center">
              <input
                ref={inputRef}
                className="flex-1 border rounded-full px-5 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-300 text-base lg:text-lg"
                placeholder="I-type ang iyong mensahe..."
                autoFocus
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKey}
              />
              <Button onClick={send} disabled={loading} className="bg-yellow-400 hover:bg-green-500 text-gray-900 font-semibold rounded-full px-6 py-3 text-base lg:text-lg">
                {loading ? '...' : 'Send'} <span className="ml-1">📨</span>
              </Button>
            </div>

            {/* End conversation */}
            <div className="mt-4 flex justify-center">
              <Button variant="secondary" onClick={endConversation} className="rounded-full bg-blue-100 hover:bg-blue-200 px-6 py-3 text-base">
                End Conversation
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
