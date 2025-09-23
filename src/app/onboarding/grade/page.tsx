'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameProgress } from '@/hooks/useGameProgress';
import Button from '@/components/ui/Button';

export default function GradeOnboardingPage() {
  const router = useRouter();
  const { data, updateData } = useGameProgress();
  const [selection, setSelection] = useState<'G1_2' | 'G3_4' | 'G5_6' | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data?.profile?.gradeLevel) {
      router.replace('/dashboard');
    }
  }, [data?.profile?.gradeLevel, router]);

  const save = async () => {
    if (!selection) return;
    try {
      setSaving(true);
      await updateData({
        profile: {
          ...(data?.profile || null),
          gradeLevel: selection
        } as any
      });
      router.replace('/dashboard');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white w-full max-w-md p-6 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Choose your grade level</h1>
        <p className="text-gray-600 mb-6">We’ll tailor words and questions to your level.</p>

        <div className="space-y-3">
          <button
            onClick={() => setSelection('G1_2')}
            className={`w-full p-4 rounded-xl border text-left ${selection === 'G1_2' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200'}`}
          >
            <div className="font-semibold text-gray-800">Grade 1–2</div>
            <div className="text-gray-500 text-sm">Foundational vocabulary and simple sentences</div>
          </button>

          <button
            onClick={() => setSelection('G3_4')}
            className={`w-full p-4 rounded-xl border text-left ${selection === 'G3_4' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200'}`}
          >
            <div className="font-semibold text-gray-800">Grade 3–4</div>
            <div className="text-gray-500 text-sm">Expanded vocabulary and moderate complexity</div>
          </button>

          <button
            onClick={() => setSelection('G5_6')}
            className={`w-full p-4 rounded-xl border text-left ${selection === 'G5_6' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200'}`}
          >
            <div className="font-semibold text-gray-800">Grade 5–6</div>
            <div className="text-gray-500 text-sm">Broader vocabulary and more complex structures</div>
          </button>
        </div>

        <div className="mt-6 flex gap-3">
          <Button onClick={save} disabled={!selection || saving} loading={saving} className="flex-1">Continue</Button>
        </div>
      </div>
    </div>
  );
}




