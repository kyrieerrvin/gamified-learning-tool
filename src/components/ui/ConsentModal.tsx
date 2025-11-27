// src/components/ui/ConsentModal.tsx
'use client';

import { useEffect, useRef } from 'react';

type ConsentModalProps = {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
};

export default function ConsentModal({ open, onAccept, onDecline }: ConsentModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const firstFocusableRef = useRef<HTMLButtonElement | null>(null);
  const lastFocusableRef = useRef<HTMLButtonElement | null>(null);

  // Focus trap when open
  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusFirst = () => {
      firstFocusableRef.current?.focus();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onDecline();
      }
      if (e.key === 'Tab') {
        const first = firstFocusableRef.current;
        const last = lastFocusableRef.current;
        if (!first || !last) return;
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    focusFirst();
    document.addEventListener('keydown', handleKeyDown);
    // Prevent background scroll when modal is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open, onDecline]);

  if (!open) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-modal-title"
      className="fixed inset-0 z-[1000] flex items-center justify-center"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onDecline} />

      {/* Modal content */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-[92%] max-h-[85vh] flex flex-col">
        <div className="flex items-start justify-between p-5 border-b border-gray-200">
          <h2 id="consent-modal-title" className="text-xl font-bold">Paunawa sa Privacy ng Datos</h2>
          <button
            aria-label="Close"
            className="text-gray-500 hover:text-gray-700"
            onClick={onDecline}
            ref={firstFocusableRef}
          >
            ×
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4" aria-live="polite">
          <h3 className="text-lg font-semibold">Mga Tuntunin at Kundisyon at Paalala sa Pribasya</h3>
          <p>
            Maligayang pagdating sa FILIPINOnlayn, isang plataporma na may mga hamon na tumutulong sa mga gusto magsanay ng Tagalog. Mangyaring basahin nang mabuti ang mga tuntunin bago gamitin ang laro.
          </p>
          <h4 className="font-semibold">1. Layunin</h4>
          <p>
            Ang platform na ito ay ginawa para sa layuning pang-edukasyon at pananaliksik upang mapalawak ang pagkatuto ng wikang Tagalog sa masayang paraan gamit ang paraan ng pag-laro na pinapagana ng Natural Language Processing (NLP). Sa paggamit ng application, sumasang-ayon kang makilahok sa takbo ng laro na may kasamang progress tracking.
          </p>
          <h4 className="font-semibold">2. Koleksiyon ng Datos</h4>
          <p>Upang mapahusay ang karanasan ng gumagamit at masubaybayan ang pag-unlad sa pag-aaral, maaaring mangolekta ang laro ng hindi personal na datos gaya ng:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Mga puntos at mga parangal</li>
            <li>Pag-angat ng antas</li>
            <li>Datos ng natapos na gawain</li>
          </ul>
          <p>
            Lahat ng nakokolektang datos ay anonymous at hindi maaaring gamitin upang makilala ang sinumang indibidwal. Hindi kami nangongolekta o nag-iimbak ng tunay na pangalan, email address, o iba pang personal na impormasyon sa loob ng laro.
          </p>
          <h4 className="font-semibold">3. Pribasya at Pagsunod sa Batas</h4>
          <p>
            Ang application na ito ay sumusunod sa Data Privacy Act of 2012 (Republic Act No. 10173) at sa mga alituntunin ng National Privacy Commission (NPC). Ang anonymous na datos ay pinoproseso lamang para sa pananaliksik, pagsusuri, at pagpapabuti ng sistema.
          </p>
          <h4 className="font-semibold">4. Pahintulot ng Gumagamit</h4>
          <p>
            Sa pagpili ng “Sumasang-ayon Ako” o sa pagpapatuloy ng paglalaro, kusang loob mong pinapahintulutan ang pagkuha at pagproseso ng iyong anonymous gameplay data ayon sa nakasaad dito. Kung hindi ka sang-ayon, maaari mong pindutin ang “Kanselahin.”
          </p>
          <h4 className="font-semibold">5. Seguridad ng Datos</h4>
          <p>
            Lahat ng datos ay iniimbak gamit ang ligtas na sistema at encryption sa pamamagitan ng Firebase at iba pang backend services. Ang pag-suri sa datos ay limitado lamang sa awtorisadong tagapagunlad ng aplikasyon at mananaliksik para sa pagsusuri at pagpapabuti ng aplikasyon.
          </p>
          <h4 className="font-semibold">6. Mga Serbisyong Third-Party</h4>
          <p>
            Maaaring gumamit ang laro ng mga panlabas na serbisyo (tulad ng Firebase Authentication at mga NLP API) na may sarili nilang patakaran sa pribasya at seguridad. Ang mga serbisyong ito ay sumusunod sa mga pandaigdigan at pambansang prinsipyo sa proteksiyon ng datos.
          </p>
          <h4 className="font-semibold">7. Impormasyon para sa Pakikipag-ugnayan</h4>
          <p>
            Para sa mga katanungan, puna, o alalahanin tungkol sa datos, maaari kaming makontak sa: christopher_lamberte@dlsu.edu.ph
          </p>
          <p className="text-sm text-gray-600">
            Note: Ang paunang abisong ito ay alinsunod sa Data Privacy Act of 2012 (R.A. 10173) at sa Implementing Rules and Regulations ng National Privacy Commission (NPC), Pilipinas.
          </p>

        </div>

        <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200">
          <button
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            onClick={onDecline}
          >
            Di ako Sumasang-ayon
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            onClick={onAccept}
            ref={lastFocusableRef}
          >
            Sumasang-ayon Ako
          </button>
        </div>
      </div>
    </div>
  );
}








