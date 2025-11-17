'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useGameProgress } from '@/hooks/useGameProgress';
import { cn } from '@/utils/cn';

// Import the types from useGameProgress
interface DailyQuest {
  id: string;
  title: string;
  description: string;
  reward: number;
  progress: number;
  target: number;
  isCompleted: boolean;
  expiresAt: string;
}

interface DailyQuestsProps {
  gameType: 'make-sentence' | 'multiple-choice';
}

export default function DailyQuests({ gameType }: DailyQuestsProps) {
  const { progress, updateData, data } = useGameProgress();
  const [quests, setQuests] = useState<DailyQuest[]>([]);
  const [totalXP, setTotalXP] = useState(0);
  
  useEffect(() => {
    const checkProgress = () => {
      const gameProgress = progress[gameType];
      if (gameProgress) {
        const filtered = (gameProgress.quests || []).filter(q => q.id !== 'daily-xp');
        setQuests(filtered);
        // Daily total XP should reflect the sum of completed quest rewards for today
        const dailyTotal = filtered
          .filter(q => q.isCompleted)
          .reduce((sum, q) => sum + (q.reward || 0), 0);
        setTotalXP(dailyTotal);
      } else {
        setQuests([]);
        setTotalXP(0);
      }
    };
    
    checkProgress();
  }, [gameType, progress]);
  
  // Handle quest completion
  const handleCompleteQuest = async (questId: string) => {
    if (!data?.progress[gameType]?.quests) return;
    
    const quests = [...data.progress[gameType].quests];
    const quest = quests.find(q => q.id === questId);
    
    if (quest && !quest.isCompleted && quest.progress >= quest.target) {
      quest.isCompleted = true;
      
      await updateData({
        progress: {
          ...data.progress,
          [gameType]: {
            ...data.progress[gameType],
            quests
          }
        }
      });
    }
  };
  
  if (!quests.length) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-duolingo-yellow"></div>
      </div>
    );
  }
  
  // Calculate total available XP from quests
  const totalAvailableXP = quests.reduce((total, quest) => total + quest.reward, 0);
  
  // Calculate how many quests are completed
  const completedQuests = quests.filter(quest => quest.isCompleted).length;
  
  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Pang-araw-araw na Misyon</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-duolingo-yellow text-duolingo-darkYellow font-bold py-1 px-2 rounded-full">
            {completedQuests}/{quests.length} Completed
          </span>
        </div>
      </div>
      
      <div className="space-y-4">
        {quests.map((quest) => (
          <QuestCard key={quest.id} quest={quest} gameType={gameType} onComplete={() => handleCompleteQuest(quest.id)} />
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Kabuuang XP</span>
          <span className="font-bold text-duolingo-orange">{totalXP} XP</span>
        </div>
        
        <div className="mt-2 text-center">
          <motion.div
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="inline-block bg-gradient-to-r from-duolingo-yellow to-duolingo-orange text-white font-bold py-2 px-4 rounded-lg shadow-lg"
          >
            Tapusin lahat ng mga misyon upang makakuha ng {totalAvailableXP} XP!
          </motion.div>
        </div>
      </div>
    </div>
  );
}

interface QuestCardProps {
  quest: DailyQuest;
  gameType: string;
  onComplete: () => void;
}

function QuestCard({ quest, gameType, onComplete }: QuestCardProps) {
  // Calculate progress percentage
  const progressPercent = Math.round((quest.progress / quest.target) * 100);
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-gray-50 rounded-lg p-4 border transition-all",
        quest.isCompleted 
          ? "border-duolingo-green bg-green-50" 
          : "border-gray-200 hover:border-duolingo-yellow"
      )}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-gray-800">{quest.title}</h3>
          <p className="text-xs text-gray-600 mt-1">{quest.description}</p>
          
          <div className="mt-3">
            <div className="skill-progress">
              <div 
                className={cn(
                  "skill-progress-bar",
                  quest.isCompleted ? "bg-duolingo-green" : ""
                )}
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-gray-600">{quest.progress}/{quest.target}</span>
              <span className="font-medium text-duolingo-orange">+{quest.reward} XP</span>
            </div>
          </div>
        </div>
        
        {quest.isCompleted ? (
          <div className="badge-glow">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-duolingo-green" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        ) : (
          <button
            onClick={onComplete}
            disabled={quest.progress < quest.target}
            className={cn(
              "text-xs px-3 py-1 rounded-full font-bold",
              quest.progress >= quest.target
                ? "bg-duolingo-green text-white hover:bg-duolingo-darkGreen cursor-pointer"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            )}
          >
            {quest.progress >= quest.target ? "Claim" : "In Progress"}
          </button>
        )}
      </div>
    </motion.div>
  );
}
