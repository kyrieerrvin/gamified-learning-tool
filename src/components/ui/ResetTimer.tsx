'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getTimeToNextReset, 
  formatTimeToReset, 
  getNextResetTimeString, 
  isResetImminent,
  getTimezoneAbbreviation,
  getDayProgress,
  type TimeToReset 
} from '@/utils/timer';
import { useGameStore } from '@/store/gameStore';

interface ResetTimerProps {
  showLabel?: boolean;
  showTimezone?: boolean;
  showProgress?: boolean;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

export default function ResetTimer({
  showLabel = true,
  showTimezone = true,
  showProgress = false,
  className = '',
  size = 'medium'
}: ResetTimerProps) {
  const [timeToReset, setTimeToReset] = useState<TimeToReset>({ 
    hours: 0, 
    minutes: 0, 
    seconds: 0, 
    totalSeconds: 0, 
    isToday: true 
  });
  const [isVisible, setIsVisible] = useState(false);
  
  // Get streak information from game store
  const { streakState, streak } = useGameStore();
  
  // Determine if user has completed streak today
  const hasCompletedStreakToday = streakState === 'active';

  // Update timer every second
  useEffect(() => {
    const updateTimer = () => {
      setTimeToReset(getTimeToNextReset());
    };

    // Initial update
    updateTimer();
    setIsVisible(true);

    // Set up interval to update every second
    const interval = setInterval(updateTimer, 1000);

    // Cleanup
    return () => clearInterval(interval);
  }, []);

  // Check if reset is imminent (less than 1 hour)
  const isImminent = isResetImminent();
  const dayProgress = getDayProgress();
  
  // Determine color scheme based on streak completion and urgency
  const getColorScheme = () => {
    if (hasCompletedStreakToday) {
      return {
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
        timerColor: 'text-green-600',
        indicatorColor: 'bg-green-400',
        progressColor: 'from-green-500 to-emerald-500'
      };
    } else if (isImminent) {
      return {
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600',
        timerColor: 'text-red-600',
        indicatorColor: 'bg-red-400',
        progressColor: 'from-red-500 to-orange-500'
      };
    } else {
      return {
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600',
        timerColor: 'text-red-600',
        indicatorColor: 'bg-red-400',
        progressColor: 'from-red-500 to-orange-500'
      };
    }
  };
  
  const colorScheme = getColorScheme();

  // Size-based styling with responsive considerations
  const sizeClasses = {
    small: 'text-xs px-2 py-1.5 sm:px-3 sm:py-2',
    medium: 'text-sm px-3 py-2 sm:px-4 sm:py-2.5',
    large: 'text-base px-4 py-3 sm:px-6 sm:py-4'
  };

  const timerClasses = {
    small: 'text-base font-bold sm:text-lg',
    medium: 'text-lg font-bold sm:text-xl',
    large: 'text-xl font-bold sm:text-2xl lg:text-3xl'
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          className={`relative bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden ${sizeClasses[size]} ${className}`}
        >
          {/* Progress bar at top if enabled */}
          {showProgress && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200">
              <motion.div
                className={`h-full bg-gradient-to-r ${colorScheme.progressColor}`}
                initial={{ width: `${dayProgress}%` }}
                animate={{ width: `${dayProgress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          )}

          {/* Main content */}
          <div className="flex items-center justify-between gap-2 min-w-0">
            {/* Timer display */}
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              {/* Clock icon */}
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${colorScheme.iconBg} ${colorScheme.iconColor}`}>
                <motion.svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5"
                  animate={(!hasCompletedStreakToday || isImminent) ? { 
                    rotate: [0, -10, 10, 0],
                    scale: [1, 1.1, 1]
                  } : {}}
                  transition={{ 
                    repeat: (!hasCompletedStreakToday || isImminent) ? Infinity : 0,
                    duration: isImminent ? 0.8 : 1.5,
                    ease: "easeInOut"
                  }}
                >
                  <path 
                    fillRule="evenodd" 
                    d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" 
                    clipRule="evenodd" 
                  />
                </motion.svg>
              </div>

              {/* Timer text */}
              <div className="flex flex-col">
                <motion.div
                  className={`${timerClasses[size]} ${colorScheme.timerColor}`}
                  key={formatTimeToReset(timeToReset)}
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {formatTimeToReset(timeToReset)}
                </motion.div>
                
                {showLabel && (
                  <div className="text-xs text-gray-500 mt-1 truncate">
                    <span className="hidden sm:inline">Reset at </span>
                    {getNextResetTimeString()}
                    {showTimezone && (
                      <span className="ml-1 text-gray-400 hidden md:inline">
                        ({getTimezoneAbbreviation()})
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Status indicator */}
            <div className="flex items-center space-x-2">
              {/* Streak/Urgency indicator */}
              <motion.div
                className={`w-2 h-2 rounded-full ${colorScheme.indicatorColor}`}
                animate={(!hasCompletedStreakToday || isImminent) ? {
                  scale: [1, 1.2, 1],
                  opacity: [1, 0.7, 1]
                } : {}}
                transition={{
                  repeat: (!hasCompletedStreakToday || isImminent) ? Infinity : 0,
                  duration: isImminent ? 0.8 : 1.2,
                  ease: "easeInOut"
                }}
              />

              {/* Info tooltip */}
              <div className="relative group">
                <div className="w-4 h-4 text-gray-400 cursor-help">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="currentColor" 
                    className="w-full h-full"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                </div>
                
                {/* Tooltip */}
                <div className="absolute right-0 top-6 w-48 sm:w-64 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 
                               sm:right-0 max-w-[calc(100vw-2rem)]">
                  <div className="space-y-2">
                    <p className="font-semibold">Daily Reset Timer</p>
                    <p>Streaks and daily quests reset at midnight in your local timezone.</p>
                    
                    {hasCompletedStreakToday ? (
                      <p className="text-green-300 font-semibold">
                        ✅ Great job! You've completed your streak today.
                        {streak > 0 && ` Current streak: ${streak} day${streak !== 1 ? 's' : ''}`}
                      </p>
                    ) : (
                      <p className="text-orange-300 font-semibold">
                        📈 Complete a challenge to maintain your streak!
                        {streak > 0 && ` Current streak: ${streak} day${streak !== 1 ? 's' : ''}`}
                      </p>
                    )}
                    
                    {isImminent && !hasCompletedStreakToday && (
                      <p className="text-red-300 font-semibold">
                        ⚠️ Reset is imminent! Complete your daily goals now to keep your streak.
                      </p>
                    )}
                  </div>
                  
                  {/* Arrow */}
                  <div className="absolute top-[-4px] right-4 w-2 h-2 bg-gray-800 rotate-45"></div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 