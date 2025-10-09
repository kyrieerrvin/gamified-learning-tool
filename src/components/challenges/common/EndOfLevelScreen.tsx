'use client';

import React, { useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import { playSound, preloadSounds } from '@/utils/sounds';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import congratulations from '../../../../assets/congratulations.gif';

export interface EndOfLevelScreenProps {
  title?: string;
  message?: string;
  xp: number;
  sectionPct: number;
  primaryCta?: {
    label: string;
    onClick: () => void;
    autoFocus?: boolean;
  } | null;
  secondaryCta?: {
    label: string;
    onClick: () => void;
  };
}

export default function EndOfLevelScreen({
  title = 'Mahusay!',
  message = 'Napakahusay mo! Nakumpleto mo ang level na ito.',
  xp,
  sectionPct,
  primaryCta,
  secondaryCta
}: EndOfLevelScreenProps) {
  const prefersReduced = useReducedMotion();

  const clampedPct = Math.max(0, Math.min(100, Math.round(sectionPct)));

  useEffect(() => {
    preloadSounds(['victory']);
    playSound('victory');
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-2xl shadow-xl p-8 md:p-10 max-w-xl w-full mx-auto text-center"
      >
        <div className="relative mb-6 flex items-center justify-center">
          {!prefersReduced && (
            <div className="absolute inset-0 -z-10 overflow-hidden">
              {[...Array(14)].map((_, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 12, x: (i % 2 === 0 ? -1 : 1) * 10 }}
                  animate={{ opacity: [0, 1, 0], y: [-8, -18, -28] }}
                  transition={{ duration: 0.9 + (i % 3) * 0.15, delay: i * 0.03, ease: 'easeOut' }}
                  className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full"
                  style={{ background: i % 3 === 0 ? '#22c55e' : i % 3 === 1 ? '#3b82f6' : '#f59e0b' }}
                />
              ))}
            </div>
          )}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}>
            <Image src={congratulations} alt="Celebration" width={140} height={140} className="rounded-xl" />
          </motion.div>
        </div>

        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600 mb-6">{message}</p>

        <div className="space-y-4 mb-6">
          <div className="text-xl font-extrabold text-green-600">+ {xp} XP</div>
          <div>
            <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
              <span>Section progress</span>
              <span>{clampedPct}%</span>
            </div>
            <div className="w-full h-2.5 bg-gray-200/80 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${clampedPct}%`, transition: 'width 300ms ease' }} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {primaryCta && (
            <Button
              autoFocus={primaryCta.autoFocus}
              onClick={primaryCta.onClick}
              className="w-full py-3 rounded-full bg-duolingo-green hover:bg-duolingo-darkGreen text-white font-bold shadow-md"
            >
              {primaryCta.label}
            </Button>
          )}
          {secondaryCta && (
            <Button
              onClick={secondaryCta.onClick}
              variant="secondary"
              className="w-full py-3 rounded-full border border-gray-300 text-gray-800 bg-white hover:bg-gray-50"
            >
              {secondaryCta.label}
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}


