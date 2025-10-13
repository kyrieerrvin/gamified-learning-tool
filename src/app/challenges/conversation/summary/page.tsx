'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

type Entry = { user?: string; bot?: string; entities?: [string, string][] };

export default function ConversationSummaryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [summary, setSummary] = useState<{ points: number; level: number; entities: [string, string][]; conversation: Entry[] } | null>(null);
  const [lifetimePoints, setLifetimePoints] = useState<number>(0);
  const [sessionPoints, setSessionPoints] = useState<number>(0);

  useEffect(() => {
    const load = async () => {
      try {
        // Try live summary first
        const resp = await fetch('/api/challenges/conversation/summary', { cache: 'no-store' });
        if (resp.ok) {
          const data = await resp.json();
          setSummary({
            points: Number(data?.points || 0),
            level: Number(data?.level || 0),
            entities: Array.isArray(data?.entities) ? data.entities : [],
            conversation: Array.isArray(data?.conversation) ? data.conversation : []
          });
        }
      } catch {}
      // Fallback to snapshot stored by play page
      try {
        const uid = (user as any)?.uid || 'anon';
        const key = `conv_summary_snapshot:${uid}`;
        const raw = typeof window !== 'undefined' ? sessionStorage.getItem(key) : null;
        if (raw && !summary) {
          const snap = JSON.parse(raw);
          setSummary({
            points: Number(snap?.points || 0),
            level: Number(snap?.level || 0),
            entities: Array.isArray(snap?.entities) ? snap.entities : [],
            conversation: Array.isArray(snap?.conversation) ? snap.conversation : []
          });
          setLifetimePoints(Number(snap?.lifetimePoints || 0));
          setSessionPoints(Number(snap?.points || 0));
        }
      } catch {}
    };
    load();
  }, [user]);

  const entities = useMemo(() => summary?.entities || [], [summary]);
  const conversation = useMemo(() => summary?.conversation || [], [summary]);

  // Chip color classes for NER tags (unified PH red with white text)
  const getChipClasses = (label: string) => {
    return 'bg-[#CE1126] text-white';
  };

  return (
    <div className="relative min-h-screen bg-[#FFF9F2]">
      {/* Subtle festive accents */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-10 -left-10 w-64 h-64 rounded-full bg-blue-600 opacity-[0.06]" />
        <div className="absolute bottom-0 -right-10 w-56 h-56 rounded-full bg-red-600 opacity-[0.06]" />
        <div className="absolute top-1/3 right-1/3 w-40 h-40 rounded-full bg-yellow-400 opacity-[0.06]" />
      </div>

      <div className="container mx-auto px-4 py-10">
        <div className="max-w-3xl mx-auto rounded-2xl bg-white border border-[#1E40AF] shadow-lg overflow-hidden" style={{ boxShadow: '0px 4px 12px rgba(37, 99, 235, 0.15)' }}>
          {/* Top band */}
          <div className="bg-[#F0F6FF] p-6 border-b-2 border-[#1E40AF]">
            <h1 className="text-3xl font-extrabold text-center mb-2 text-[#1E40AF]">🎉 Salamat sa Pakikipag-usap!</h1>
            <p className="text-center text-[#64748B]">Ang galing mo! Nakumpleto mo ang iyong sesyon kay PinoyPal 🎈</p>
            <div className="mt-5 rounded-xl p-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-full px-6 py-4 text-center shadow bg-[#22C55E] text-white border-2 border-white">
                  <span className="text-sm font-bold">🧩 Final Points</span>
                  <div className="text-3xl font-extrabold drop-shadow-sm">{sessionPoints || summary?.points || 0}</div>
                </div>
                <div className="rounded-full px-6 py-4 text-center shadow bg-[#2563EB] text-white border-2 border-white">
                  <span className="text-sm font-bold">🌟 Total Lifetime Points</span>
                  <div className="text-3xl font-extrabold drop-shadow-sm">{lifetimePoints}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Lower content */}
          <div className="p-6 bg-white">
            {/* Entities */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Mga Nabanggit na Entities:</h2>
              <div className="rounded-2xl p-4 bg-white border border-gray-200 max-h-48 overflow-y-auto">
                {entities.length === 0 ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-yellow-800 italic">Walang nahanap na entity</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {entities.map(([ent, label], idx) => (
                      <span key={idx} className={`inline-flex items-center gap-2 px-3 py-1 rounded-full shadow ${getChipClasses(label)}`}>
                        <span className="font-semibold">{ent}</span>
                        <span className="text-xs opacity-90">({label})</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Conversation */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-2">Buong Usapan:</h2>
              <div className="rounded-2xl p-4 bg-white border border-gray-200 max-h-[60vh] overflow-y-auto space-y-4">
                {conversation.length === 0 ? (
                  <p className="text-gray-600 text-sm">Wala pang laman ang usapan.</p>
                ) : (
                  conversation.map((entry, i) => (
                    <div key={i} className="text-sm space-y-1">
                      {/* PinoyPal turn: label then bubble */}
                      {entry.bot && (
                        <>
                          <div className="text-[#1E40AF] font-semibold">PinoyPal</div>
                          <div className="text-left">
                            <span className="inline-block bg-[#EFF6FF] text-[#1E40AF] px-4 py-3 rounded-2xl shadow border border-[#BFDBFE]">{entry.bot}</span>
                          </div>
                        </>
                      )}
                      {/* User turn: label then bubble */}
                      {entry.user && (
                        <>
                          <div className="text-green-700 text-right font-semibold">Ikaw</div>
                          <div className="text-right">
                            <span className="inline-block bg-[#FFF7CC] text-[#3B3B3B] px-4 py-3 rounded-2xl shadow border border-[#FDE68A]">{entry.user}</span>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-center">
              <Button onClick={() => router.push('/dashboard')} className="bg-[#1E3A8A] hover:bg-[#3B82F6] text-white font-bold rounded-full shadow px-7 py-3 transition-all duration-200 ease-in-out hover:scale-105">
                Balik sa Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


