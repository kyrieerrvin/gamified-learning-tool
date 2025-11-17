/* eslint-disable no-console */
// Usage: node scripts/collect-metrics.mjs --base https://tagaloglearn.vercel.app --runs 100 --grade G3_4 --difficulty medium
const args = Object.fromEntries(process.argv.slice(2).map((v, i, a) => v.startsWith('--') ? [v.slice(2), a[i+1]] : []).filter(Boolean));
const BASE = args.base || process.env.BASE_URL || 'http://localhost:3000';
const RUNS = parseInt(args.runs || '100', 10);
const GRADE = args.grade || 'G3_4';
const DIFFICULTY = args.difficulty || 'medium';

function now() { return performance.now(); }
function pct(arr, p) { if (!arr.length) return 0; const s = [...arr].sort((a,b)=>a-b); const idx = Math.min(s.length - 1, Math.floor((p/100) * s.length)); return s[idx]; }
function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

async function timedFetch(url, opts) {
  const t0 = now();
  const res = await fetch(url, opts);
  const t1 = now();
  return { res, ms: t1 - t0 };
}

async function analyze(sentence) {
  const { res, ms } = await timedFetch(`${BASE}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type':'application/json', 'Accept':'application/json' },
    body: JSON.stringify({ sentence }),
    cache: 'no-store',
  });
  const ok = res.ok;
  const data = ok ? await res.json() : { error: await res.text().catch(()=>String(res.status)) };
  return { ok, ms, data };
}

async function getPosInteractiveItem(grade, difficulty) {
  const { res, ms } = await timedFetch(`${BASE}/api/challenges/pos-interactive?grade=${encodeURIComponent(grade)}&difficulty=${encodeURIComponent(difficulty)}`, { cache:'no-store' });
  const ok = res.ok;
  const data = ok ? await res.json() : { error: await res.text().catch(()=>String(res.status)) };
  return { ok, ms, data };
}

function isPunct(text) { return /^[\p{P}\p{S}]+$/u.test(text || ''); }

async function postPosInteractiveVerify(sentence, target, selections) {
  const { res, ms } = await timedFetch(`${BASE}/api/challenges/pos-interactive`, {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({ sentence, target, selections }),
  });
  const ok = res.ok;
  const data = ok ? await res.json() : { error: await res.text().catch(()=>String(res.status)) };
  return { ok, ms, data };
}

async function fetchMakeSentenceWords(grade) {
  const { res, ms } = await timedFetch(`${BASE}/api/challenges/make-sentence/words?grade=${encodeURIComponent(grade)}`, { cache:'no-store' });
  const ok = res.ok;
  const data = ok ? await res.json() : { error: await res.text().catch(()=>String(res.status)) };
  return { ok, ms, data };
}

async function verifyMakeSentence(word, sentence) {
  const { res, ms } = await timedFetch(`${BASE}/api/challenges/make-sentence/verify`, {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({ word, sentence }),
  });
  const ok = res.ok;
  const data = ok ? await res.json() : { error: await res.text().catch(()=>String(res.status)) };
  return { ok, ms, data };
}

async function postConversation(message) {
  const { res, ms } = await timedFetch(`${BASE}/api/challenges/conversation`, {
    method: 'POST',
    headers: { 'Content-Type':'application/json', 'Accept':'application/json' },
    body: JSON.stringify({ message }),
    cache: 'no-store'
  });
  const ok = res.ok;
  const data = ok ? await res.json() : { error: await res.text().catch(()=>String(res.status)) };
  return { ok, ms, data };
}

async function main() {
  console.log(`Collecting metrics from ${BASE} runs=${RUNS} grade=${GRADE} difficulty=${DIFFICULTY}`);

  // Analyze metrics
  const sentences = [
    'Ang bata ay kumakain ng mansanas.',
    'Si Maria ay nagbabasa ng libro sa silid-aklatan.',
    'Magluluto ako ng adobo mamaya.',
    'Tumakbo siya papunta sa parke kahapon.',
  ];
  const analyzeLat = [], analyzeOk = [], methods = {};
  for (let i=0;i<RUNS;i++) {
    const s = sentences[i % sentences.length];
    const { ok, ms, data } = await analyze(s);
    analyzeLat.push(ms);
    analyzeOk.push(ok);
    const m = data?.method || 'unknown';
    methods[m] = (methods[m] || 0) + 1;
    await sleep(100);
  }

  // POS interactive metrics (GET + POST with computed correct indices)
  const posGetLat = [], posPostLat = [], posPostOk = [], posStatuses = {};
  for (let i=0;i<RUNS;i++) {
    const g = await getPosInteractiveItem(GRADE, DIFFICULTY);
    posGetLat.push(g.ms);
    if (!g.ok || !g.data?.sentence || !Array.isArray(g.data.tokens) || !Array.isArray(g.data.targets) || !g.data.targets.length) {
      posPostOk.push(false);
      continue;
    }
    const sentence = g.data.sentence;
    const target = g.data.targets[0]; // take first target
    const a = await analyze(sentence);
    if (!a.ok || !Array.isArray(a.data?.tokens)) {
      posPostOk.push(false);
      continue;
    }
    const tokens = a.data.tokens.map(t => t.text);
    const pos = a.data.tokens.map(t => String(t.pos || '').toUpperCase());
    const allCorrect = pos
      .map((p, i) => ({ p, i }))
      .filter(({ p, i }) => p === String(target.pos || '').toUpperCase() && !isPunct(tokens[i]))
      .map(({ i }) => i);

    let selections = [];
    if (target.mode === 'all') {
      selections = allCorrect;
    } else {
      const req = Math.max(1, target.required || 1);
      selections = allCorrect.slice(0, req);
    }
    const v = await postPosInteractiveVerify(sentence, target, selections);
    posPostLat.push(v.ms);
    posPostOk.push(v.ok && (v.data?.status === 'complete'));
    posStatuses[v.data?.status || 'unknown'] = (posStatuses[v.data?.status || 'unknown'] || 0) + 1;
    await sleep(100);
  }

  // Make-a-Sentence words + verify
  const wordsLat = [], wordsOk = [];
  for (let i=0;i < RUNS; i++) {
    const r = await fetchMakeSentenceWords(GRADE);
    wordsLat.push(r.ms);
    wordsOk.push(r.ok);
    await sleep(50);
  }
  // Verify check (heuristic: sentence with/without word)
  const testWord = 'bata';
  const withWord = `Gamitin ang salitang ${testWord} sa pangungusap.`;
  const noWord = `Gamitin ang salitang guro sa pangungusap.`;
  const v1 = await verifyMakeSentence(testWord, withWord);
  const v2 = await verifyMakeSentence(testWord, noWord);

  // Summaries
  const summary = {
    analyze: {
      runs: RUNS,
      success_rate: (analyzeOk.filter(Boolean).length / RUNS).toFixed(3),
      p50_ms: Math.round(pct(analyzeLat, 50)),
      p95_ms: Math.round(pct(analyzeLat, 95)),
      methods
    },
    pos_interactive: {
      get: {
        runs: RUNS,
        p50_ms: Math.round(pct(posGetLat, 50)),
        p95_ms: Math.round(pct(posGetLat, 95)),
      },
      verify: {
        runs: posPostLat.length,
        success_rate_complete: (posPostOk.filter(Boolean).length / (posPostOk.length || 1)).toFixed(3),
        p50_ms: Math.round(pct(posPostLat, 50)),
        p95_ms: Math.round(pct(posPostLat, 95)),
        statuses: posStatuses
      }
    },
    make_sentence: {
      words_fetch: {
        runs: wordsLat.length,
        success_rate: (wordsOk.filter(Boolean).length / (wordsOk.length || 1)).toFixed(3),
        p50_ms: Math.round(pct(wordsLat, 50)),
        p95_ms: Math.round(pct(wordsLat, 95)),
      },
      verify: {
        with_word: { ok: v1.ok, ms: Math.round(v1.ms), isCorrect: v1.data?.isCorrect, feedback: v1.data?.feedback },
        without_word: { ok: v2.ok, ms: Math.round(v2.ms), isCorrect: v2.data?.isCorrect, feedback: v2.data?.feedback }
      }
    },
    conversation: await (async () => {
      const prompts = [
        'Magandang araw! Kumusta ka?',
        'Ang pangalan ko ay si Carl.',
        'Nagaaral ako sa DLSU.',
        'Sa Alabang ako nakatira.'
      ];
      const lat = [], okArr = [], score = [];
      for (let i=0;i<RUNS;i++) {
        const m = prompts[i % prompts.length];
        const r = await postConversation(m);
        lat.push(r.ms);
        okArr.push(r.ok && typeof (r.data?.reply || '') === 'string');
        if (typeof r.data?.scoreDelta === 'number') score.push(r.data.scoreDelta);
        await sleep(50);
      }
      return {
        runs: lat.length,
        success_rate: (okArr.filter(Boolean).length / (okArr.length || 1)).toFixed(3),
        p50_ms: Math.round(pct(lat, 50)),
        p95_ms: Math.round(pct(lat, 95)),
      };
    })()
  };

  console.log('\n=== METRICS SUMMARY ===');
  console.log(JSON.stringify(summary, null, 2));
}

main().catch(err => {
  console.error('Metric script failed:', err);
  process.exit(1);
});