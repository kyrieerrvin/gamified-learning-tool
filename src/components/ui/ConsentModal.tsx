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
          <h2 id="consent-modal-title" className="text-xl font-bold">Data Privacy Notice</h2>
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
          <h3 className="text-lg font-semibold">Terms and Conditions & Privacy Notice</h3>
          <p>
            Welcome to TagalogLearn, a gamified learning platform that helps users practice Tagalog through interactive translation and conversation challenges. Please read these terms carefully before using the game.
          </p>
          <h4 className="font-semibold">1. Purpose</h4>
          <p>
            This platform is designed for educational and research use to promote Tagalog language learning through gamified experiences powered by Natural Language Processing (NLP). By using this application, you agree to participate in gameplay that involves automated responses and progress tracking.
          </p>
          <h4 className="font-semibold">2. Data Collection</h4>
          <p>To enhance user experience and monitor learning progress, the game may collect non-personal data, including:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Gameplay scores and achievements</li>
            <li>Level progression</li>
            <li>Completion data</li>
          </ul>
          <p>
            All data collected are anonymous and cannot identify individual users. We do not collect or store real names, email addresses, or other personal identifiers within the game environment.
          </p>
          <h4 className="font-semibold">3. Data Privacy and Compliance</h4>
          <p>
            This application complies with the Data Privacy Act of 2012 (Republic Act No. 10173) and the regulations of the National Privacy Commission (NPC) of the Philippines. Anonymous gameplay data are processed solely for research, analytics, and educational improvement purposes.
          </p>
          <h4 className="font-semibold">4. User Consent</h4>
          <p>
            By selecting “I Agree” or continuing to play, you voluntarily consent to the collection and processing of your anonymous gameplay data as described in this notice. If you do not wish to provide consent, you may close the game or select “Cancel.”
          </p>
          <h4 className="font-semibold">5. Data Security</h4>
          <p>
            All stored data are protected using secure systems and encryption through Firebase and related backend services. Access to data is limited to authorized developers and researchers for analysis and improvement of the system.
          </p>
          <h4 className="font-semibold">6. Third-Party Services</h4>
          <p>
            The game may use external services (such as Firebase Authentication and NLP APIs) that follow their own privacy and security standards. These services comply with global and Philippine data-protection principles.
          </p>
          <h4 className="font-semibold">7. Contact Information</h4>
          <p>
            For questions, feedback, or data concerns, you may contact the project team at: 📧 email@gmail.com
          </p>
          <p className="text-sm text-gray-600">
            Digital Compliance Note: This notice is issued in accordance with the Data Privacy Act of 2012 (R.A. 10173) and the Implementing Rules and Regulations of the National Privacy Commission (NPC), Philippines.
          </p>

        </div>

        <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200">
          <button
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            onClick={onDecline}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            onClick={onAccept}
            ref={lastFocusableRef}
          >
            I Agree and Confirm
          </button>
        </div>
      </div>
    </div>
  );
}






