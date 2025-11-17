'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useGameProgress } from '@/hooks/useGameProgress';
import Button from '@/components/ui/Button';
import { motion } from 'framer-motion';

export default function GradeSelectionPage() {
  const { user } = useAuth();
  const { data, updateData } = useGameProgress(); // Use `data` to access existing profile
  const router = useRouter();
  const [selection, setSelection] = useState<'G1' | 'G2' | 'G3' | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.profile?.gradeLevel) {
      router.replace('/dashboard');
    }
  }, [user?.profile?.gradeLevel, router]);

  const handleSelection = async () => {
    if (user && selection && data?.profile) {
      try {
        setSaving(true);
        await updateData({
          profile: {
            ...data.profile, // Preserve existing profile data
            gradeLevel: selection,
          },
        });
        router.replace('/dashboard');
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white w-full max-w-md p-6 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Ano ang iyong grade level?</h1>
        <p className="text-gray-600 mb-6">I-aangkop namin ang mga salita at tanong ayon sa iyong antas.</p>

        <div className="space-y-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={() => setSelection('G1')}
            className={`w-full p-4 rounded-xl border text-left ${selection === 'G1' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200'}`}
          >
            <h3 className="font-bold text-lg">Grade 1</h3>
            <p className="text-gray-600">Mga simpleng salita at estruktura ng pangungusap.</p>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={() => setSelection('G2')}
            className={`w-full p-4 rounded-xl border text-left ${selection === 'G2' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200'}`}
          >
            <h3 className="font-bold text-lg">Grade 2</h3>
            <p className="text-gray-600">Mas malawak na bokabularyo at mas kumplikadong mga pangungusap.</p>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={() => setSelection('G3')}
            className={`w-full p-4 rounded-xl border text-left ${selection === 'G3' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200'}`}
          >
            <h3 className="font-bold text-lg">Grade 3</h3>
            <p className="text-gray-600">Mas mahihirap na salita at estruktura ng pangungusap.</p>
          </motion.button>
        </div>
        
        <div className="mt-8">
          <Button onClick={handleSelection} disabled={!selection || saving} loading={saving} className="flex-1">Ipagpatuloy</Button>
        </div>
      </div>
    </div>
  );
}




