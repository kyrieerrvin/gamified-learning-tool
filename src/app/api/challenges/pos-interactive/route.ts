// src/app/api/challenges/pos-interactive/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { API_ENDPOINTS } from '@/lib/config';

type AnalyzeToken = { text: string; pos?: string };

function isPunctuationToken(text: string, pos?: string) {
  if (pos && pos.toUpperCase() === 'PUNCT') return true;
  return /^[\p{P}\p{S}]+$/u.test(text);
}

const POS_TL_LABEL: Record<string, string> = {
  NOUN: 'Pangngalan',
  PROPN: 'Pangalang Pantangi',
  VERB: 'Pandiwa',
  AUX: 'Kainugnay na Pandiwa',
  ADJ: 'Pang-uri',
  ADV: 'Pang-abay',
  PRON: 'Panghalip',
  ADP: 'Pang-ukol',
  CCONJ: 'Pang-ugnay',
  SCONJ: 'Pang-ugnay',
  CONJ: 'Pang-ugnay',
  DET: 'Pantukoy',
  NUM: 'Pang-bilang',
  INTJ: 'Padamdam',
};

async function analyze(sentence: string): Promise<{ tokens: AnalyzeToken[] }> {
  const resp = await fetch(API_ENDPOINTS.ANALYZE_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ sentence }),
    cache: 'no-store',
  });
  if (!resp.ok) {
    // try Next proxy
    const proxy = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sentence }),
      cache: 'no-store',
    }).catch(() => null);
    if (!proxy || !proxy.ok) throw new Error('Analyze service unavailable');
    return proxy.json();
  }
  return resp.json();
}

async function pickSentence(grade: string | null): Promise<string | null> {
  try {
    const fs = await import('fs/promises');
    const path = (p: string) => `${process.cwd()}/${p}`;
    if (grade === 'G1_2') {
      const raw = await fs.readFile(path('words/grade_level_1-2_words.json'), 'utf8');
      const arr = JSON.parse(raw) as Array<{ difficult?: string; sentence?: string } & Record<string, unknown>>;
      // Prefer "difficult" sentences per refinement; fall back to "sentence" if present
      const pool = arr.map(x => (x as any).difficult || x.sentence).filter(Boolean) as string[];
      if (pool.length === 0) return null;
      return pool[Math.floor(Math.random() * pool.length)];
    }
    if (grade === 'G3_4') {
      const raw = await fs.readFile(path('words/mulcho_grade_3-4.json'), 'utf8');
      const arr = JSON.parse(raw) as Array<{ sentence?: string }>;
      const pool = arr.map(x => x.sentence).filter(Boolean) as string[];
      if (pool.length === 0) return null;
      return pool[Math.floor(Math.random() * pool.length)];
    }
    if (grade === 'G5_6') {
      const raw = await fs.readFile(path('words/mulcho_grade_5-6.json'), 'utf8');
      const arr = JSON.parse(raw) as Array<{ sentence?: string }>;
      const pool = arr.map(x => x.sentence).filter(Boolean) as string[];
      if (pool.length === 0) return null;
      return pool[Math.floor(Math.random() * pool.length)];
    }
    return null;
  } catch (e) {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const grade = searchParams.get('grade');
  const difficulty = (searchParams.get('difficulty') || 'medium').toLowerCase();
  let sentence = searchParams.get('sentence');

  // Pick sentence from pools if not provided
  if (!sentence) {
    sentence = await pickSentence(grade);
  }
  // If still none, bail early
  if (!sentence) {
    return NextResponse.json({ error: 'No sentence available' }, { status: 404 });
  }

  // Analyze to get tokens and POS
  const analysis = await analyze(sentence);
  const rawTokens = (analysis.tokens || []) as AnalyzeToken[];
  const tokens = rawTokens.map(t => t.text);
  const pos = rawTokens.map(t => (t.pos || '').toUpperCase());
  const selectable_mask = tokens.map((t, i) => !isPunctuationToken(t, pos[i]));

  // Build counts excluding punctuation
  const counts: Record<string, number> = {};
  pos.forEach((p, i) => {
    if (selectable_mask[i] && p) counts[p] = (counts[p] || 0) + 1;
  });

  // Determine targets per difficulty
  type Target = { pos: string; label_tl: string; mode: 'exact' | 'all'; required?: number };
  const entries = Object.entries(counts).filter(([p, c]) => c > 0);
  let targets: Target[] = [];
  if (difficulty === 'easy') {
    const pool = entries.filter(([_, c]) => c >= 1);
    if (pool.length === 0) {
      // try a new sentence immediately
      const url = new URL(request.url);
      url.searchParams.delete('sentence');
      return NextResponse.redirect(url);
    }
    const [p, c] = pool[Math.floor(Math.random() * pool.length)];
    targets = [{ pos: p, label_tl: POS_TL_LABEL[p] || p, mode: 'exact', required: 1 }];
  } else if (difficulty === 'hard') {
    targets = entries
      .filter(([_, c]) => c >= 2)
      .map(([p, c]) => ({ pos: p, label_tl: POS_TL_LABEL[p] || p, mode: 'all' as const, required: c }));
  } else {
    // medium (and difficult section)
    const multi = entries.filter(([_, c]) => c >= 2);
    if (multi.length === 0) {
      // no eligible POS with at least 2 occurrences; pick new sentence
      const url = new URL(request.url);
      url.searchParams.delete('sentence');
      return NextResponse.redirect(url);
    }
    targets = multi.map(([p, c]) => ({ pos: p, label_tl: POS_TL_LABEL[p] || p, mode: 'exact' as const, required: Math.min(2, c) }));
  }

  if (!targets.length) {
    // pick new sentence if none eligible
    const url = new URL(request.url);
    url.searchParams.delete('sentence');
    return NextResponse.redirect(url);
  }

  const item_id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return NextResponse.json({
    item_id,
    sentence,
    tokens,
    selectable_mask,
    targets,
    target_index: 0,
  });
}

export async function POST(request: NextRequest) {
  // Verify selections
  const body = await request.json().catch(() => null);
  const sentence: string | undefined = body?.sentence;
  const target: { pos: string; mode: 'exact' | 'all'; required?: number } | undefined = body?.target;
  const selections: number[] = Array.isArray(body?.selections) ? body.selections : [];

  if (!sentence || !target) {
    return NextResponse.json({ error: 'sentence and target are required' }, { status: 400 });
  }

  const analysis = await analyze(sentence);
  const rawTokens = (analysis.tokens || []) as AnalyzeToken[];
  const pos = rawTokens.map(t => (t.pos || '').toUpperCase());

  // Identify all correct indices for the target POS, excluding punctuation
  const allCorrect = pos
    .map((p, i) => ({ p, i }))
    .filter(({ p, i }) => p === target.pos.toUpperCase() && !isPunctuationToken(rawTokens[i]?.text || '', p))
    .map(({ i }) => i);

  const selectedSet = new Set(selections);
  const incorrectSelections: number[] = selections.filter(i => !allCorrect.includes(i));
  const correctSelections: number[] = selections.filter(i => allCorrect.includes(i));

  if (target.mode === 'all') {
    const allSet = new Set(allCorrect);
    const selectedAllCorrect = correctSelections.length === allCorrect.length && incorrectSelections.length === 0;
    const partial = correctSelections.length > 0 && !selectedAllCorrect;
    return NextResponse.json({
      status: selectedAllCorrect ? 'complete' : partial ? 'partial' : 'incorrect',
      correct_indices: correctSelections,
      incorrect_indices: incorrectSelections,
      all_correct_indices: allCorrect,
    });
  }

  // exact mode
  const required = Math.max(1, target.required || 1);
  const allPickedAreCorrect = incorrectSelections.length === 0;
  if (correctSelections.length >= required && allPickedAreCorrect) {
    // consider complete when they have required correct tokens (no wrongs)
    return NextResponse.json({
      status: 'complete',
      correct_indices: correctSelections,
      incorrect_indices: incorrectSelections,
      all_correct_indices: allCorrect,
    });
  }

  if (allPickedAreCorrect && correctSelections.length > 0) {
    // partial progress
    return NextResponse.json({
      status: 'partial',
      correct_indices: correctSelections,
      incorrect_indices: incorrectSelections,
      all_correct_indices: allCorrect,
    });
  }

  // incorrect
  return NextResponse.json({
    status: 'incorrect',
    correct_indices: correctSelections,
    incorrect_indices: incorrectSelections,
    all_correct_indices: allCorrect,
  });
}


