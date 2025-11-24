// src/app/api/challenges/make-sentence/words/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { API_ENDPOINTS } from '@/lib/config';
import G1_WORDS from '../../../../../../words/grade1_make_a_sentence.json';
import G2_WORDS from '../../../../../../words/grade2_make_a_sentence.json';
import G3_WORDS from '../../../../../../words/grade3_make_a_sentence.json';

type GradeKey = 'G1' | 'G2' | 'G3';

type RawWordEntry = {
  word?: string;
  easy?: string;
  difficult?: string;
  easy_alternates?: string[] | string;
  easyAlternates?: string[] | string;
  difficult_alternates?: string[] | string;
  difficultAlternates?: string[] | string;
};

const LOCAL_WORD_BANK: Record<GradeKey, RawWordEntry[]> = {
  G1: G1_WORDS as RawWordEntry[],
  G2: G2_WORDS as RawWordEntry[],
  G3: G3_WORDS as RawWordEntry[],
};

const NORMALIZE_GRADE: Record<string, GradeKey> = {
  G1_2: 'G1',
  G3_4: 'G2',
  G5_6: 'G3',
};

const FALLBACK_MAP: Record<GradeKey, Map<string, RawWordEntry>> = {
  G1: new Map<string, RawWordEntry>(),
  G2: new Map<string, RawWordEntry>(),
  G3: new Map<string, RawWordEntry>(),
};

const ALL_FALLBACK = new Map<string, RawWordEntry>();

const normalizeKey = (word?: string) => (word || '').trim().toLowerCase();

function recordFallbackEntries() {
  (Object.keys(LOCAL_WORD_BANK) as GradeKey[]).forEach((grade) => {
    LOCAL_WORD_BANK[grade].forEach((entry) => {
      const key = normalizeKey(entry.word);
      if (!key) return;
      FALLBACK_MAP[grade].set(key, entry);
      if (!ALL_FALLBACK.has(key)) {
        ALL_FALLBACK.set(key, entry);
      }
    });
  });
}

recordFallbackEntries();

function normalizeGradeParam(grade?: string | null): GradeKey | undefined {
  if (!grade) return undefined;
  if (grade === 'G1' || grade === 'G2' || grade === 'G3') return grade;
  return NORMALIZE_GRADE[grade] ?? undefined;
}

function collectAlternateList(entry: any, fieldNames: string[]): string[] {
  if (!entry) return [];
  const seen = new Set<string>();
  const results: string[] = [];
  for (const field of fieldNames) {
    const raw = entry?.[field];
    if (Array.isArray(raw)) {
      raw.forEach((val) => {
        if (typeof val === 'string') {
          const trimmed = val.trim();
          if (trimmed && !seen.has(trimmed)) {
            seen.add(trimmed);
            results.push(trimmed);
          }
        }
      });
    } else if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (trimmed && !seen.has(trimmed)) {
        seen.add(trimmed);
        results.push(trimmed);
      }
    }
  }
  return results;
}

function ensureAlternates(word: any, fallback?: RawWordEntry) {
  if (!fallback) return word;

  const existingEasy = collectAlternateList(word, ['easyAlternates', 'easy_alternates']);
  if (!existingEasy.length) {
    const fallbackEasy = collectAlternateList(fallback, ['easyAlternates', 'easy_alternates']);
    if (fallbackEasy.length) {
      word.easy_alternates = fallbackEasy;
      word.easyAlternates = fallbackEasy;
    }
  }

  const existingDifficult = collectAlternateList(word, ['difficultAlternates', 'difficult_alternates']);
  if (!existingDifficult.length) {
    const fallbackDifficult = collectAlternateList(fallback, ['difficultAlternates', 'difficult_alternates']);
    if (fallbackDifficult.length) {
      word.difficult_alternates = fallbackDifficult;
      word.difficultAlternates = fallbackDifficult;
    }
  }

  return word;
}

function mergeAlternates(words: any[], grade?: GradeKey) {
  if (!Array.isArray(words)) return words;
  return words.map((word) => {
    const normalizedKey = normalizeKey(word?.word);
    if (!normalizedKey) return word;
    const gradeFallback = grade ? FALLBACK_MAP[grade].get(normalizedKey) : undefined;
    const fallbackEntry = gradeFallback || ALL_FALLBACK.get(normalizedKey);
    if (!fallbackEntry) return word;
    return ensureAlternates({ ...word }, fallbackEntry);
  });
}

/**
 * API endpoint to get words for Make a Sentence game
 */
export async function GET(request: NextRequest) {
  try {
    // Forward user's grade level if provided
    const gradeParam = request.nextUrl.searchParams.get('grade') || '';
    // Create a URL for the API request with optional grade
    const url = `${API_ENDPOINTS.API_BASE_URL}/api/make-sentence/words${gradeParam ? `?grade=${encodeURIComponent(gradeParam)}` : ''}`;
    console.log(`Fetching Make a Sentence words from: ${url}`);
    
    // Set a timeout for the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    try {
      // Make the request to the Python backend
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch words (Status: ${response.status})`);
      }
      
      const data = await response.json();
      if (Array.isArray(data?.words)) {
        const normalizedGrade = normalizeGradeParam(gradeParam);
        data.words = mergeAlternates(data.words, normalizedGrade);
      }
      console.log(`Successfully received ${data.count} words for Make a Sentence game`);
      
      return NextResponse.json(data);
    } catch (fetchError) {
      console.error('Error fetching from Python API:', fetchError);
      
      // Do not return fallback data; surface the error so issues are visible
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch words from the JSON word bank. Ensure the backend is reachable and the word files exist.'
        },
        { status: 502 }
      );
    }
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
}