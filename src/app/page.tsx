// src/app/page.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ConsentModal from '@/components/ui/ConsentModal';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { attachSparkles, initHeroThree } from '@/utils/animationController';

export default function Home() {
  const router = useRouter();
  const { prefersReduced, setReduced } = useReducedMotion();
  const [consentOpen, setConsentOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const startRef = useRef<HTMLButtonElement | null>(null);

  const openConsent = () => setConsentOpen(true);
  const handleConsentAccept = () => {
    setConsentOpen(false);
    router.push('/login');
  };
  const handleConsentDecline = () => setConsentOpen(false);

  useEffect(() => {
    // Hero Three.js init with graceful fallback
    if (!canvasRef.current) return;
    let dispose: (() => void) | undefined;
    (async () => {
      dispose = await initHeroThree(canvasRef.current as HTMLCanvasElement, {
        pastelColors: ['#0032A0', '#BF0D3E', '#FED141', '#0032A0', '#BF0D3E'],
        maxMeshes: 6,
      });
    })();
    return () => {
      if (dispose) dispose();
    };
  }, [prefersReduced]);

  useEffect(() => {
    // Simple reveal on scroll
    const els = document.querySelectorAll<HTMLElement>('[data-reveal]');
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('opacity-100', 'translate-y-0');
          }
        });
      },
      { threshold: 0.15 }
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  const challengeCards = useMemo(
    () => [
      {
        title: 'Conversation',
        desc: 'Magsanay makipag-usap gamit ang mga palakaibigang tanong at sagot.',
        color: 'from-[#EAF3FF] to-white border-blue-200',
        href: '/challenges/conversation',
      },
      {
        title: 'Make a Sentence',
        desc: 'Ayusin ang mga salita para makabuo ng pangungusap.',
        color: 'from-[#FFF7CC] to-white border-yellow-200',
        href: '/challenges/make-sentence',
      },
      {
        title: 'Multiple Choice',
        desc: 'Hanapin ang tamang salita at mapraktis nang mabilis.',
        color: 'from-[#FCE7F3] to-white border-pink-200',
        href: '/challenges/multiple-choice',
      },
    ],
    []
  );

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Page-wide playful pastel background */}
      <div
        aria-hidden
        className="absolute inset-0 -z-20"
        style={{
          background:
            'radial-gradient(1200px circle at 10% 10%, #EAF3FF 0%, rgba(234,243,255,0) 60%),\
             radial-gradient(900px circle at 90% 18%, #FFF7CC 0%, rgba(255,247,204,0) 55%),\
             radial-gradient(1000px circle at 22% 85%, #E8FBF0 0%, rgba(232,251,240,0) 55%),\
             radial-gradient(900px circle at 85% 88%, #FCE7F3 0%, rgba(252,231,243,0) 55%)',
          backgroundColor: '#ffffff',
        }}
      />
      {/* Fixed navigation */}
      <nav className="bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/50 fixed top-0 left-0 right-0 z-50 border-b border-slate-100">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="text-2xl font-extrabold" style={{ color: 'var(--brand-primary)' }}>TagalogLearn</div>
            <div className="flex items-center gap-6">
              {/* <Link href="/about" className="text-slate-600 hover:text-slate-900 transition-colors">About</Link>
              <Link href="/contact" className="text-slate-600 hover:text-slate-900 transition-colors">Contact</Link> */}
              <button
                onClick={openConsent}
                ref={startRef}
                className="btn-primary hover-scale"
                onMouseEnter={(e) => attachSparkles(e.currentTarget)}
              >
                Simulan na
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content with top padding for fixed nav */}
      <main className="pt-24">
        {/* Hero */}
        <section className="relative overflow-hidden">
          {/* Hero gradient underlay for extra color depth */}
          <div
            className="absolute inset-0 -z-20"
            aria-hidden
            style={{
              background: 'linear-gradient(180deg, #EAF3FF 0%, #FCE7F3 38%, #FFFFFF 100%)',
            }}
          />
          <div className="absolute inset-0 -z-10">
            <canvas ref={canvasRef} className="w-full h-[56vh] md:h-[64vh] motion-safe-only" aria-hidden="true" />
          </div>
          <div className="container mx-auto px-6 py-16 md:py-24">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div data-reveal className="opacity-0 translate-y-6 transition-all duration-700">
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
                  Matuto ng Tagalog — sa paraang masaya!
                </h1>
                <p className="text-lg text-slate-700 mb-8">
                Tuklasin ang Tagalog sa mga masasayang hamon para sa mga bata!
                </p>
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={openConsent}
                    className="btn-primary accent-glow"
                    onMouseEnter={(e) => attachSparkles(e.currentTarget)}
                  >
                    Simulan na
                  </button>
                  <Link href="#how" className="btn-secondary" aria-label="Explore Challenges">
                    Tuklasin ang mga laro
                  </Link>
                </div>
              </div>
              <div className="relative" aria-hidden="true">
                <div className="mx-auto w-64 h-64 md:w-80 md:h-80 rounded-full flex items-center justify-center shadow-sm"
                  style={{ background: 'var(--tint-blue)' }}>
                  <div className="text-7xl md:text-8xl" role="img" aria-label="Friendly mascot waving">👋</div>
                </div>
                <div className="absolute -top-3 right-2 md:-top-2 md:-right-8 bg-white rounded-2xl px-4 py-2 shadow accent-glow border border-slate-100">
                  <span className="text-sm md:text-base">“Tara, mag-aral tayo!”</span>
                </div>
                {/* Sun and stars */}
                <div className="absolute right-8 -bottom-4 w-3 h-3 rotate-12" style={{ color: 'var(--ph-yellow)' }}>⭐</div>
                <div className="absolute right-16 bottom-6 w-3 h-3 -rotate-12" style={{ color: 'var(--ph-yellow)' }}>⭐</div>
                <div className="absolute right-24 bottom-2 w-3 h-3 -rotate-12" style={{ color: 'var(--ph-yellow)' }}>⭐</div>
              </div>
            </div>
          </div>
        </section>

        {/* Fun Learning Challenges */}
        <section id="challenges" className="py-16 md:py-24" style={{ background: 'linear-gradient(180deg, #EAF3FF 0%, #E8FBF0 100%)' }}>
          <div className="container mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Mga Hamon sa TagalogLearn</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {challengeCards.map((c) => (
                <div
                  key={c.title}
                  className={`tilt-hover rounded-2xl border p-6 bg-gradient-to-br ${c.color} cursor-default`}
                >
                  <div className="flex items-start mb-4">
                    <div className="text-xl font-bold">{c.title}</div>
                  </div>
                  <p className="text-slate-600">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Explore Challenges */}
        <section id="how" className="py-16 md:py-24" style={{ background: 'var(--ph-beige)' }}>
          <div className="container mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Paano Simulan?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
              {[1, 2, 3].map((n, i) => (
                <div key={n} data-reveal className="opacity-0 translate-y-6 transition-all duration-700">
                  <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center font-extrabold text-xl shadow-md mb-4"
                    style={{ background: 'white', color: i===0?'var(--ph-blue)':i===1?'var(--ph-yellow)':'var(--ph-red)' }}>{n}</div>
                  <h3 className="text-xl font-semibold text-center mb-2">
                    {i === 0 ? 'Pumili ng larong gusto mong subukan' : i === 1 ? 'Sagutin, magturo, at matuto!' : 'Makakuha ng XP at mag-unlock ng mga bagong salita!'}
                  </h3>
                  <p className="text-slate-600 text-center">
                    {i === 0 && 'Simulan mo kahit saan—bawat laro ay may bagong kasanayang matututunan.'}
                    {i === 1 && 'Mag-enjoy habang nag-eensayo ng mga salita at parirala!'}
                    {i === 2 && 'Kumita ng mga gantimpala at ipagpatuloy ang iyong learning streak!'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Fun Tagalog Facts */}
        <section className="py-16 md:py-24 relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #FCE7F3 0%, #EDE9FE 100%)' }}>
          {/* drifting glyphs behind cards */}
          <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
            <div className="absolute left-8 top-10 text-3xl opacity-30 levitate">⭐</div>
            <div className="absolute right-12 top-16 text-3xl opacity-30 levitate" style={{ animationDelay: '800ms' }}>💬</div>
            <div className="absolute left-1/2 bottom-10 -translate-x-1/2 text-3xl opacity-30 levitate" style={{ animationDelay: '400ms' }}>🇵🇭</div>
          </div>
          <div className="container mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Masayang Kaalaman Tungkol sa Tagalog</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {[
                {front: '⭐ 90M+ na tagapagsalita', back: 'Mahigit 90 milyong tao sa buong mundo ang nagsasalita ng Tagalog.'},
                {front: '💬 Salitang Tagalog', back: 'May mga salitang Tagalog na hindi kayang isalin nang direkta sa Ingles.'},
                {front: '🇵🇭 Mabuhay!', back: 'Ang ‘Mabuhay’ ay ibig sabihin ay ‘long live’—isang masayang pagbati ng mga Pilipino!'},
              ].map((fact, idx) => (
                <button key={idx} className="flip-card h-44 bg-transparent" aria-pressed="false" onClick={(e) => {
                  const pressed = e.currentTarget.getAttribute('aria-pressed') === 'true';
                  e.currentTarget.setAttribute('aria-pressed', (!pressed).toString());
                }}>
                  <div className="flip-card-inner">
                    <div className="flip-card-front bg-white border border-slate-200 p-6 flex items-center justify-center">
                      <span className="text-lg font-semibold text-slate-800 text-center">{fact.front}</span>
                    </div>
                    <div className="flip-card-back bg-white border border-slate-200 p-6 flex items-center justify-center">
                      <span className="text-slate-700 text-center">{fact.back}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Banner */}
        <section className="py-16 md:py-24 text-white relative" style={{ background: 'linear-gradient(90deg, #3B82F6 0%, #6366F1 100%)' }}>
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Handa ka na bang matuto ng Tagalog?</h2>
            <p className="text-blue-100 mb-8 max-w-xl mx-auto">Simulan na at paghusayin ang iyong kakayahan sa bawat laro.</p>
            <button
              onClick={openConsent}
              className="btn-secondary bg-white text-slate-900"
              onMouseEnter={(e) => attachSparkles(e.currentTarget)}
            >
              Simulan Na
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-200 py-12">
        <div className="container mx-auto px-6">
          {/* <div className="text-2xl font-bold text-white mb-6 md:mb-0">TagalogLearn</div>
            <div className="flex flex-wrap justify-center gap-6">
              <Link href="/about" className="hover:text-white transition-colors">About</Link>
              <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 text-center text-sm">
            <p> {new Date().getFullYear()} TagalogLearn. All rights reserved.</p> */}
          
          {/* Other footer links and controls intentionally hidden per request */}
          <div className="flex justify-center items-center mb-6">
            <span className="text-xl md:text-2xl font-bold text-white text-center">👋 Salamat! Hanggang sa muli.</span>
          </div>
          <div className="pt-6 border-t border-slate-700 text-center text-sm">
            <p>2025 TagalogLearn. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <ConsentModal
        open={consentOpen}
        onAccept={handleConsentAccept}
        onDecline={handleConsentDecline}
      />
    </div>
  );
}