'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useGameProgress } from '@/hooks/useGameProgress';
import { cn } from '@/utils/cn';

type QuestsListProps = {
  gameType: string;
};

export function QuestsList({ gameType }: QuestsListProps) {
  const { progress, updateData, data } = useGameProgress();
  const [quests, setQuests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Update local quests state when progress changes
    const updateQuests = () => {
      if (progress && progress[gameType] && progress[gameType].quests) {
        setQuests(progress[gameType].quests);
      } else {
        setQuests([]);
      }
      setIsLoading(false);
    };
    
    updateQuests();
  }, [gameType, progress]);

  const handleClaimReward = async (questId: string) => {
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!quests || quests.length === 0) {
    return (
      <div className="text-center py-4 text-gray-600">
        No quests available right now. Check back later!
      </div>
    );
  }

  // Get today's date to show expiration info
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  return (
    <div className="space-y-4">
      {quests.map((quest) => {
        const expiryDate = new Date(quest.expiresAt);
        const isExpiringSoon = expiryDate.getTime() - today.getTime() < 24 * 60 * 60 * 1000;
        const progressPercentage = Math.min(100, (quest.progress / quest.target) * 100);
        
        return (
          <div 
            key={quest.id}
            className={cn(
              "border rounded-lg p-4 bg-white transition-all",
              quest.isCompleted ? "border-green-200 bg-green-50" : "border-gray-200",
              isExpiringSoon && !quest.isCompleted ? "border-yellow-200 bg-yellow-50" : ""
            )}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium text-gray-800">{quest.title}</h3>
              <div className="text-sm text-gray-500">
                {isExpiringSoon ? "Expires today" : "Expires tomorrow"}
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-2">{quest.description}</p>
            
            <div className="mb-2">
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div 
                  className={cn(
                    "h-2.5 rounded-full transition-all duration-500",
                    quest.isCompleted ? "bg-green-500" : "bg-blue-500"
                  )}
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <div className="mt-1 text-xs text-gray-500 flex justify-between">
                <span>{quest.progress} / {quest.target} completed</span>
                <span>+{quest.reward} XP</span>
              </div>
            </div>
            
            {quest.isCompleted && !quest.rewardClaimed && (
              <button
                onClick={() => handleClaimReward(quest.id)}
                className="mt-2 w-full py-2 bg-green-500 hover:bg-green-600 text-white rounded-md text-sm font-medium transition-colors"
              >
                Claim Reward
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
