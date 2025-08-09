'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useGameProgress } from '@/hooks/useGameProgress';

export default function StreakWidget() {
  const { streak, streakState, data } = useGameProgress();
  
  // Streak status is automatically handled by the real-time hook

  // Get tooltip text based on streak state
  const getTooltipText = () => {
    switch (streakState) {
      case 'active':
        return "You've completed your streak for today!";
      case 'inactive':
        return "Keep your streak going by completing a game today!";
      case 'none':
        return "Start a streak by playing today!";
      default:
        return "Keep learning daily to build your streak!";
    }
  };

  return (
    <motion.div 
      className="relative flex items-center bg-white rounded-full shadow-md p-2 cursor-pointer"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={getTooltipText()}
    >
      <div className="relative">
        {/* Flame container */}
        <div className="w-8 h-8 flex items-center justify-center">
          {/* No streak or inactive streak (gray) */}
          {(streakState === 'none' || streakState === 'inactive') && (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" 
              className="w-6 h-6 text-gray-400">
              <path fillRule="evenodd" d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.177A7.547 7.547 0 016.648 6.61a.75.75 0 00-1.152.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248zM15.75 14.25a3.75 3.75 0 11-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 011.925-3.545 3.75 3.75 0 013.255 3.717z" clipRule="evenodd" />
            </svg>
          )}
          
          {/* Active streak (red/orange gradient) */}
          {streakState === 'active' && (
            <motion.svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="url(#fire-gradient)"
              className="w-6 h-6"
              initial={{ scale: 0.8 }}
              animate={{ 
                scale: [0.9, 1.1, 0.9],
                opacity: [0.9, 1, 0.9]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 2,
                ease: "easeInOut"
              }}
            >
              <defs>
                <linearGradient id="fire-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
              </defs>
              <path fillRule="evenodd" d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.177A7.547 7.547 0 016.648 6.61a.75.75 0 00-1.152.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248zM15.75 14.25a3.75 3.75 0 11-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 011.925-3.545 3.75 3.75 0 013.255 3.717z" clipRule="evenodd" />
            </motion.svg>
          )}
        </div>
      </div>
      
      {/* Streak count - gray for none/inactive, red for active */}
      <div className="ml-1 mr-1 font-medium text-sm">
        <span className={streakState === 'active' ? "text-orange-500" : "text-gray-500"}>
          {streak} {streak === 1 ? 'day' : 'days'}
        </span>
      </div>
    </motion.div>
  );
}
