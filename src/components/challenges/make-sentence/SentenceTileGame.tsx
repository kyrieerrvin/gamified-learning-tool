'use client';

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Button from '@/components/ui/Button';
import * as nlpService from '@/services/nlp';
import { motion, AnimatePresence, LayoutGroup, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
// static import of project root image
// from src/components/challenges/make-sentence -> project root is ../../../../
// Next.js supports static image imports from anywhere in the project
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - allow importing asset
import mascot from '../../../../assets/bata.gif';

interface SentenceTileGameProps {
  sampleSentence?: string;
  focusWord?: string;
  onComplete?: (score: number, levelCompleted: boolean) => void;
}

type TokenItem = {
  id: string;
  text: string;
};

function generateId(prefix: string, index: number): string {
  return `${prefix}-${index}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,!?;:]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function SentenceTileGame({
  sampleSentence = 'Ang bata ay mahilig mag laro sa ulan.',
  focusWord = 'bata',
  onComplete
}: SentenceTileGameProps) {
  const [expectedSentence, setExpectedSentence] = useState<string>(sampleSentence);
  // Fixed, randomized tokens for this round (order never changes)
  const [tokens, setTokens] = useState<TokenItem[]>([]);
  // Ordered list of selected token ids (sequence chosen by player)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  // Measured dimensions for each token to keep placeholders identical
  const [tokenDims, setTokenDims] = useState<Record<string, { width: number; height: number }>>({});
  const measureRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const prefersReducedMotion = useReducedMotion();
  const crispTransition = prefersReducedMotion 
    ? { duration: 0.16, ease: 'linear' as const }
    : { type: 'tween' as const, ease: [0.25, 1, 0.5, 1] as const, duration: 0.2 };
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<null | { correct: boolean; message: string }>(null);

  const expectedNormalized = useMemo(() => normalize(expectedSentence), [expectedSentence]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const analysis = await nlpService.analyzeSentence(sampleSentence);
        const rawTokens = analysis.tokens.map(t => t.text).filter(Boolean);
        const cleaned = rawTokens
          .map(t => t.replace(/[\u200B-\u200D\uFEFF]/g, '')) // zero-width chars
          .join(' ');
        const tokenTexts = cleaned.trim().length > 0
          ? cleaned.split(/\s+/)
          : sampleSentence.split(/\s+/);

        const tokenObjs: TokenItem[] = tokenTexts.map((text, idx) => ({ id: generateId('tok', idx), text }));
        const randomized = shuffle(tokenObjs);
        if (!cancelled) {
          setExpectedSentence(sampleSentence);
          setTokens(randomized);
          setSelectedIds([]);
          setResult(null);
        }
      } catch (e) {
        const fallback = sampleSentence.split(/\s+/).map((text, idx) => ({ id: generateId('tok', idx), text }));
        if (!cancelled) {
          setExpectedSentence(sampleSentence);
          setTokens(shuffle(fallback));
          setSelectedIds([]);
          setResult(null);
        }
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [sampleSentence]);

  const isComplete = selectedIds.length === tokens.length && tokens.length > 0;

  function handleSelect(id: string) {
    setSelectedIds(prev => (prev.includes(id) ? prev : [...prev, id]));
    setResult(null);
  }

  function handleRemoveSelected(id: string) {
    setSelectedIds(prev => prev.filter(x => x !== id));
    setResult(null);
  }

  function handleClear() {
    setSelectedIds([]);
    setResult(null);
  }

  async function handleCheck() {
    try {
      setChecking(true);
      const idToToken: Record<string, TokenItem> = Object.fromEntries(tokens.map(t => [t.id, t]));
      const userSentence = selectedIds.map(id => idToToken[id]?.text ?? '').join(' ');
      const isCorrect = normalize(userSentence) === expectedNormalized;
      const feedback = isCorrect ? 'Tama! Naayos mo nang wasto ang pangungusap.' : 'Subukan muli. Hindi tugma ang pagkakasunod-sunod.';
      setResult({ correct: isCorrect, message: feedback });
      if (onComplete && isCorrect) {
        onComplete(100, true);
      }
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="relative p-2 md:p-4 max-w-5xl mx-auto flex flex-col">
      <div className="grid grid-cols-1 md:grid-cols-[160px,1fr] gap-6 items-center mb-2">
        <motion.div initial={{ rotate: -5, scale: 0.9, opacity: 0 }} animate={{ rotate: 0, scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 12 }} className="mx-auto md:mx-0">
          <Image src={mascot} alt="Mascot" className="rounded-xl shadow-md" width={140} height={140} />
        </motion.div>
        <div className="text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2 text-gray-900">Buuin ang pangungusap</h1>
          <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-2xl px-4 py-2 shadow-sm">
            <span className="text-orange-700 text-sm font-semibold">Salitang Pokus:</span>
            <span className="text-orange-900 font-bold capitalize">{focusWord}</span>
          </div>
        </div>
      </div>

      <div className="h-px bg-gray-200 my-6" />

      <LayoutGroup>
        {/* Answer area (top) - selected tiles with shared layoutIds for FLIP */}
        <div className="min-h-[68px] flex flex-wrap gap-4 mb-8">
          <AnimatePresence initial={false}>
            {selectedIds.length === 0 ? (
              <span className="text-gray-400">Pumili ng mga salita sa baba upang bumuo ng pangungusap.</span>
            ) : (
              selectedIds.map(id => {
                const token = tokens.find(t => t.id === id)!;
                return (
                  <motion.button
                    layout
                    layoutId={id}
                    key={id}
                    onClick={() => handleRemoveSelected(id)}
                    className="px-6 py-3 rounded-2xl bg-white border border-gray-300 text-gray-900 text-lg shadow-sm"
                    transition={crispTransition}
                    whileTap={{ scale: 0.95 }}
                    style={{ willChange: 'transform', transform: 'translateZ(0)' }}
                  >
                    {token.text}
                  </motion.button>
                );
              })
            )}
          </AnimatePresence>
        </div>

        <div className="h-px bg-gray-200 my-6" />

        {/* Word bank (bottom) with reserved slots */}
        <div className="mb-2 text-sm text-gray-500">Mga salita</div>
        <div className="flex flex-wrap gap-4 mb-6">
          {tokens.map((t) => {
            const isUsed = selectedIds.includes(t.id);
            return (
              <div key={t.id} className="relative">
                {isUsed ? (
                  <div
                    className="rounded-2xl border border-gray-300 bg-gray-50 opacity-60"
                    style={{
                      width: tokenDims[t.id]?.width ?? undefined,
                      height: tokenDims[t.id]?.height ?? undefined,
                    }}
                  />
                ) : (
                  <motion.button
                    layout
                    layoutId={t.id}
                    ref={(el: HTMLButtonElement | null) => {
                      measureRefs.current[t.id] = el;
                      if (el) {
                        const rect = el.getBoundingClientRect();
                        setTokenDims((prev) =>
                          prev[t.id] && prev[t.id].width === rect.width && prev[t.id].height === rect.height
                            ? prev
                            : { ...prev, [t.id]: { width: rect.width, height: rect.height } }
                        );
                      }
                    }}
                    onClick={() => handleSelect(t.id)}
                    className="px-6 py-3 rounded-2xl bg-white border border-gray-300 text-gray-900 text-lg shadow-sm"
                    whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={crispTransition}
                    style={{ willChange: 'transform', transform: 'translateZ(0)' }}
                  >
                    {t.text}
                  </motion.button>
                )}
              </div>
            );
          })}
        </div>
      </LayoutGroup>

      <AnimatePresence>
        {result && (
          <motion.div
            key={result.correct ? 'ok' : 'err'}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={`mb-6 p-4 rounded-xl border ${result.correct ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}
          >
            {result.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom action bar */}
      <div className="mt-auto pt-6 border-t border-gray-200">
        <div className="flex items-center justify-end">
          <motion.div
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02 }}
            transition={crispTransition}
          >
            <Button
              onClick={handleCheck}
              loading={checking}
              disabled={!isComplete || checking}
              className="font-sans tracking-tight rounded-[24px] px-8 py-4 text-white font-extrabold text-[16px] md:text-[18px] bg-[#3B82F6] hover:bg-[#2563EB] shadow-md shadow-blue-200"
            >
              I-check
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}


