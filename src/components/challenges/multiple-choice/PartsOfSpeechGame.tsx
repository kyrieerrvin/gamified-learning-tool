// src/components/challenges/multiple-choice/PartsOfSpeechGame.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import Button from '@/components/ui/Button';
import { useGameProgress } from '@/hooks/useGameProgress';

type GradeLevel = 'G1_2' | 'G3_4' | 'G5_6';

type Target = {
  pos: string;
  label_tl: string;
  mode: 'exact' | 'all';
  required?: number;
};

type InteractiveItem = {
  item_id: string;
  sentence: string;
  tokens: string[];
  selectable_mask: boolean[];
  targets: Target[];
  target_index: number;
};

// Interface for component props
interface PartsOfSpeechGameProps {
  levelNumber?: number;
  onComplete?: (score: number, levelCompleted: boolean) => void;
  onProgressChange?: (completed: number, total: number) => void;
  onHeartsChange?: (hearts: number) => void;
}
export default function PartsOfSpeechGame({
  levelNumber = 0,
  onComplete,
  onProgressChange,
  onHeartsChange
}: PartsOfSpeechGameProps) {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const crisp = prefersReducedMotion
    ? { duration: 0.16, ease: 'linear' as const }
    : { type: 'tween' as const, ease: [0.25, 1, 0.5, 1] as const, duration: 0.2 };

  const { data: gameData } = useGameProgress();
  // Lock the user's grade level for the entire session to prevent cross-grade leakage
  const [sessionGrade, setSessionGrade] = useState<GradeLevel | null>(null);
  const sectionIndex = Math.floor(levelNumber / 10);
  const difficulty: 'easy' | 'medium' | 'hard' = sectionIndex === 0 ? 'easy' : sectionIndex === 2 ? 'hard' : 'medium';

  const [item, setItem] = useState<InteractiveItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [targetIndex, setTargetIndex] = useState<number>(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [locked, setLocked] = useState<Set<number>>(new Set());
  const [wrong, setWrong] = useState<Set<number>>(new Set());
  const [sheet, setSheet] = useState<null | { kind: 'correct' | 'wrong'; cheer?: string }>(null);
  const [completed, setCompleted] = useState<number>(0);
  // Hearts system
  const [hearts, setHearts] = useState<number>(3);
  const [outOfHearts, setOutOfHearts] = useState<boolean>(false);

  const totalGoal = 5;

  async function loadNewItem() {
    try {
      setLoading(true);
      setError(null);
      setSelected(new Set());
      setLocked(new Set());
      setWrong(new Set());
      setSheet(null);
      setTargetIndex(0);
      const qs = new URLSearchParams();
      if (sessionGrade) qs.set('grade', sessionGrade);
      if (difficulty) qs.set('difficulty', difficulty);
      const resp = await fetch(`/api/challenges/pos-interactive?${qs.toString()}`, { cache: 'no-store' });
      if (!resp.ok) throw new Error('Hindi ma-load ang laro');
      const data = (await resp.json()) as InteractiveItem;
      if (!data?.tokens?.length || !data?.targets?.length) throw new Error('Walang pos na pwedeng laruin, nagre-retry...');
      setItem(data);
      setTargetIndex(data.target_index || 0);
    } catch (e: any) {
      setError(e?.message || 'May nangyaring error.');
    } finally {
      setLoading(false);
    }
  }

  // Initialize sessionGrade once when profile data is available, then keep it stable
  useEffect(() => {
    const g = gameData?.profile?.gradeLevel as GradeLevel | undefined;
    if (!sessionGrade && (g === 'G1_2' || g === 'G3_4' || g === 'G5_6')) {
      setSessionGrade(g);
    }
  }, [gameData?.profile?.gradeLevel, sessionGrade]);

  useEffect(() => {
    if (!sessionGrade) return;
    // Reset hearts at the beginning of each session/level
    setHearts(3);
    setOutOfHearts(false);
    loadNewItem();
  }, [sessionGrade, difficulty]);

  // Propagate heart changes to the parent after render
  useEffect(() => {
    if (onHeartsChange) onHeartsChange(hearts);
  }, [hearts, onHeartsChange]);

  const currentTarget: Target | null = useMemo(() => {
    if (!item) return null;
    return item.targets[targetIndex] || null;
  }, [item, targetIndex]);

  const required = currentTarget?.mode === 'exact' ? Math.max(1, currentTarget?.required || 1) : undefined;
  const selectedCount = selected.size;
  const lockedCount = locked.size;

  async function toggleIndex(i: number) {
    if (!item || !currentTarget) return;
    if (!item.selectable_mask[i]) return; // disabled/punctuation
    if (locked.has(i) || wrong.has(i)) return; // locked states are not interactive

    // Pending selection prior to I-check for all difficulties
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(i)) {
        next.delete(i);
      } else {
        // For exact quota difficulties (e.g., medium), cap to required
        if (currentTarget.mode === 'exact' && typeof required === 'number' && next.size >= required) {
          return next;
        }
        next.add(i);
      }
      return next;
    });
  }

  function clearTransientMarks() {
    setWrong(new Set());
  }

  async function handleCheck() {
    if (!item || !currentTarget) return;
    if (selected.size === 0 || outOfHearts) return; // enable only when pending exists
    try {
      const resp = await fetch('/api/challenges/pos-interactive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentence: item.sentence, target: currentTarget, selections: Array.from(selected) }),
      });
      if (!resp.ok) throw new Error('Hindi ma-verify. Pakisubukan muli.');
      const result: {
        status: 'complete' | 'partial' | 'incorrect';
        correct_indices: number[];
        incorrect_indices: number[];
        all_correct_indices: number[];
      } = await resp.json();
      // Apply locks
      const prevLockedSize = locked.size;
      const uniqueNewCorrect = result.correct_indices.filter(idx => !locked.has(idx));
      let newLockedCount = prevLockedSize + uniqueNewCorrect.length;
      setLocked(prev => {
        const next = new Set(prev);
        for (const idx of result.correct_indices) next.add(idx);
        return next;
      });
      setWrong(prev => {
        const next = new Set(prev);
        for (const idx of result.incorrect_indices) next.add(idx);
        return next;
      });
      // Clear all pending selections after evaluation
      setSelected(new Set());

      // Determine completion for current target
      const isExact = currentTarget.mode === 'exact' && typeof required === 'number';
      const exactSatisfied = isExact ? newLockedCount >= (required as number) : false;
      const allSatisfied = !isExact && Array.isArray(result.all_correct_indices)
        ? result.all_correct_indices.every(idx => new Set(Array.from(new Set([...locked, ...result.correct_indices]))).has(idx))
        : false;

      if (exactSatisfied || allSatisfied || result.status === 'complete') {
        const cheers = ['Galing!', 'Tama!', 'Mahusay!'];
        setSheet({ kind: 'correct', cheer: cheers[Math.floor(Math.random() * cheers.length)] });
        setCompleted(prev => Math.min(totalGoal, prev + 1));
      } else if (result.incorrect_indices.length > 0) {
        // Deduct a heart for a mistake
        setHearts((prev) => {
          const next = Math.max(0, prev - 1);
          if (next === 0) {
            setOutOfHearts(true);
          }
          return next;
        });
        setSheet({ kind: 'wrong' });
      }
      // Otherwise, partial correct with no wrong: continue without sheet
    } catch (e: any) {
      setError(e?.message || 'Error habang nagche-check.');
    }
  }

  function handleNext() {
    if (!item || !currentTarget) return;
    setSheet(null);
    setSelected(new Set());
    setWrong(new Set());
    // Progress within same sentence for medium/hard; for easy always fetch new
    // For easy: only move on when user taps Sunod from the sheet (sheet.correct)
    const nextIndex = targetIndex + 1;
    if (nextIndex < item.targets.length) {
      setTargetIndex(nextIndex);
      setLocked(new Set());
    } else {
      // Exhausted targets — fetch new sentence
      loadNewItem();
    }
  }

  useEffect(() => {
    if (completed >= totalGoal && onComplete) {
      const score = Math.round((completed / totalGoal) * 100);
      onComplete(score, score >= 80);
    }
  }, [completed, onComplete]);

  useEffect(() => {
    if (onProgressChange) onProgressChange(completed, totalGoal);
  }, [completed, totalGoal, onProgressChange]);

  const instruction = useMemo(() => {
    if (!currentTarget) return '';
    if (currentTarget.mode === 'all') return `Piliin lahat ng ${currentTarget.label_tl}`;
    const req = Math.max(1, currentTarget.required || 1);
    return req > 1 ? `Pumili ng ${req} ${currentTarget.label_tl}` : `Piliin ang ${currentTarget.label_tl}`;
  }, [currentTarget]);

  const canSubmit = useMemo(() => {
    if (!currentTarget) return false;
    // Enable when at least one pending selection exists
    return selected.size > 0;
  }, [currentTarget, selected.size]);

  if (loading) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-duolingo-purple"></div>
        <p className="mt-4 text-gray-600">Naglo-load…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto bg-red-50 border border-red-200 rounded-xl p-4 text-red-800">
        {error}
        <div className="mt-3">
          <Button onClick={loadNewItem} className="bg-red-100 text-red-800 hover:bg-red-200">Subukan muli</Button>
        </div>
      </div>
    );
  }

  if (!item || !currentTarget) {
    return null;
  }

  return (
    <div className="relative p-2 md:p-4 max-w-5xl mx-auto flex flex-col">
      {/* Out of hearts screen */}
      {outOfHearts && (
        <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm rounded-2xl border flex flex-col items-center justify-center p-6 text-center">
          <div className="text-2xl md:text-3xl font-extrabold mb-4">Naubos na ang buhay mo!</div>
          <div className="flex gap-3 text-4xl mb-6">
            <span className="text-gray-300">💔</span>
            <span className="text-gray-300">💔</span>
            <span className="text-gray-300">💔</span>
          </div>
          <Button
            onClick={() => router.push('/challenges/multiple-choice')}
            className="rounded-full px-8 py-3 bg-duolingo-green text-white hover:bg-green-600"
          >
            Bumalik sa Main Menu
          </Button>
        </div>
      )}
      {/* Hero: image + title + helper */}
      <div className="grid grid-cols-1 md:grid-cols-[128px,1fr] gap-4 md:gap-6 items-center mb-4 md:mb-6">
        <div className="flex items-center justify-center md:justify-start">
          <img
            src="/assets/mulcho.gif"
            alt="Mascot"
            className="w-[112px] h-[112px] md:w-[120px] md:h-[120px] object-cover rounded-xl shadow-md"
          />
        </div>
        <div className="text-center md:text-left">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-gray-900">{instruction}</h1>
          {currentTarget.mode === 'exact' && typeof required === 'number' && (
            <div className="mt-2 text-sm md:text-base text-gray-600">
              {lockedCount}/{required} {currentTarget.label_tl} tama
            </div>
          )}
        </div>
      </div>

      {/* Sentence strip */}
      <div className="w-full rounded-2xl px-5 md:px-6 py-4 text-[14px] md:text-[16px] leading-relaxed mb-5 md:mb-6 border shadow-sm" style={{ backgroundColor: '#fff7ed', borderColor: '#feebd3', color: '#c3420d' }}>
        {item.sentence}
      </div>

      {/* Faint grouping line before tiles */}
      <div className="h-px bg-gray-200 my-4 md:my-5" />

      {/* Sentence tokens */}
      <div className={sheet ? 'pointer-events-none opacity-100' : ''} aria-hidden={!!sheet}>
        <div className="flex flex-wrap gap-3 md:gap-4 items-start justify-center md:justify-start">
          {item.tokens.map((t, i) => {
            const isSelectable = item.selectable_mask[i];
            const isSelected = selected.has(i);
            const isLocked = locked.has(i);
            const isWrong = wrong.has(i);
            return (
              <motion.button
                key={`${i}-${t}`}
                onClick={() => toggleIndex(i)}
                disabled={!isSelectable || isLocked || isWrong}
                whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={crisp}
                className={`min-h-[44px] px-5 py-3 rounded-2xl border text-base md:text-lg shadow-sm select-none ${
                  !isSelectable
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                    : isLocked
                      ? 'bg-green-50 text-green-800 border-green-300'
                      : isWrong
                        ? 'bg-red-50 text-red-700 border-red-300'
                        : isSelected
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-900 border-gray-300'
                }`}
                style={{ willChange: 'transform', transform: 'translateZ(0)' }}
              >
                {t}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="mt-auto pt-6 border-t border-gray-200">
        <div className="flex items-center justify-end min-h-[72px]">
          <AnimatePresence mode="wait">
            {!sheet && (
              <motion.div
                key="check-cta"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.div whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.02 }} transition={crisp}>
                  <Button
                    id="check-btn"
                    onClick={handleCheck}
                    disabled={!canSubmit}
                    className="font-sans tracking-tight rounded-[24px] px-8 py-4 text-white font-extrabold text-[16px] md:text-[18px] bg-[#3B82F6] hover:bg-[#2563EB] shadow-md shadow-blue-200"
                  >
                    I-check
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom feedback sheet */}
      <AnimatePresence>
        {sheet && (
          <motion.div
            initial={prefersReducedMotion ? { opacity: 0 } : { y: 20, opacity: 0 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { y: 20, opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0.16 : 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-0 right-0 bottom-0 z-50"
            aria-live="polite"
          >
            <div className="max-w-5xl mx-auto px-3 md:px-4 pb-4">
              <div className={`rounded-2xl shadow-xl px-5 py-4 md:px-6 md:py-5 text-white ${sheet.kind === 'correct' ? 'bg-green-500' : 'bg-red-500'}`}>
                <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between gap-3">
                  <div className="text-lg md:text-xl font-extrabold tracking-tight">
                    {sheet.kind === 'correct' ? (sheet.cheer || 'Mahusay!') : 'Subukan muli. Hindi tugma ang iyong sagot.'}
                  </div>
                  <div className="flex items-center gap-3">
                    {sheet.kind === 'wrong' && (
                      <motion.div whileTap={{ scale: 0.97 }}>
                        <Button
                          onClick={() => setSheet(null)}
                          variant="secondary"
                          className="rounded-[28px] px-6 py-3 bg-white/10 hover:bg-white/15 text-white font-extrabold text-base md:text-lg shadow-md"
                        >
                          Subukan Muli
                        </Button>
                      </motion.div>
                    )}
                    {sheet.kind === 'correct' && (
                      <motion.div whileTap={{ scale: 0.97 }}>
                        <Button
                          onClick={handleNext}
                          id="sheet-primary-btn"
                          className="rounded-[28px] px-8 py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-extrabold text-base md:text-lg shadow-md"
                        >
                          Sunod
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}