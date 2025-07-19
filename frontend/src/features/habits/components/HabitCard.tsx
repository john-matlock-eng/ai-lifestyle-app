import React, { useState } from 'react';
import type { Habit } from '@/types/habits';
import { 
  Check, 
  Trophy, 
  ChevronRight,
  SkipForward
} from 'lucide-react';
import { StreakBadge } from './StreakBadge';
import { ProgressRing } from './ProgressRing';

interface HabitCardProps {
  habit: Habit;
  onToggle: (completed: boolean) => void;
  onSkip: () => void;
  onViewDetails?: () => void;
}

export const HabitCard: React.FC<HabitCardProps> = ({ 
  habit, 
  onToggle, 
  onSkip,
  onViewDetails 
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  
  const handleToggle = () => {
    const newStatus = !habit.completedToday;
    onToggle(newStatus);
    
    if (newStatus) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 600);
      
      // Check for milestone
      if ((habit.currentStreak + 1) % 7 === 0) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 2000);
      }
    }
  };
  
  const progressPercentage = habit.targetDays > 0 
    ? Math.min((habit.currentStreak / habit.targetDays) * 100, 100) 
    : 0;
  
  return (
    <div className={`
      relative bg-white rounded-xl shadow-sm border-2 transition-all duration-300
      ${habit.completedToday 
        ? 'border-green-400 shadow-lg transform scale-[1.02]' 
        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'}
    `}>
      {/* Celebration Sparkles */}
      {showCelebration && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-float-up"
              style={{
                left: `${20 + i * 12}%`,
                animationDelay: `${i * 0.1}s`
              }}
            >
              <Trophy className="w-4 h-4 text-yellow-400" />
            </div>
          ))}
        </div>
      )}
      
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div 
              className={`
                w-12 h-12 rounded-lg flex items-center justify-center text-2xl
                transition-transform ${isAnimating ? 'animate-bounce' : ''}
              `}
              style={{ backgroundColor: `${habit.color}20` }}
            >
              {habit.icon}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{habit.title}</h3>
              <p className="text-sm text-gray-500">{habit.category}</p>
            </div>
          </div>
          
          {habit.currentStreak > 0 && (
            <StreakBadge streak={habit.currentStreak} milestone={7} />
          )}
        </div>
        
        {/* Progress Section */}
        <div className="mb-4 flex items-center space-x-4">
          <ProgressRing 
            progress={progressPercentage}
            color={habit.color}
            size={50}
          />
          <div className="flex-1">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>{habit.currentStreak}/{habit.targetDays} days</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full transition-all duration-500 ease-out"
                style={{ 
                  width: `${progressPercentage}%`,
                  backgroundColor: habit.color
                }}
              />
            </div>
          </div>
        </div>
        
        {/* Week Progress */}
        <div className="flex justify-between mb-4">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => {
            const isToday = index === new Date().getDay();
            const isCompleted = habit.weekProgress[index];
            
            return (
              <div key={index} className="flex flex-col items-center">
                <span className="text-xs text-gray-500 mb-1">{day}</span>
                <div 
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all
                    ${isCompleted
                      ? 'bg-green-500 border-green-500'
                      : isToday && !habit.completedToday
                      ? 'border-blue-400 border-dashed animate-pulse'
                      : 'border-gray-300'}
                  `}
                >
                  {isCompleted && <Check className="w-4 h-4 text-white" />}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Action Buttons */}
        <div className="flex space-x-2">
          {!habit.completedToday ? (
            <>
              <button
                onClick={handleToggle}
                className="flex-1 py-3 px-4 rounded-lg font-medium text-white transition-all duration-200 
                         transform hover:scale-[1.02] active:scale-[0.98] button-press"
                style={{ backgroundColor: habit.color }}
              >
                Mark Complete
              </button>
              <button
                onClick={onSkip}
                className="px-4 py-3 rounded-lg border border-gray-300 text-gray-600 
                         hover:bg-gray-50 transition-colors"
                title="Skip today"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={handleToggle}
              className="flex-1 py-3 px-4 rounded-lg font-medium bg-green-500 text-white
                       flex items-center justify-center space-x-2"
            >
              <Check className="w-5 h-5" />
              <span>Completed!</span>
            </button>
          )}
        </div>
        
        {/* Motivational Text */}
        {!habit.completedToday && habit.motivationalText && (
          <p className="mt-3 text-sm text-gray-600 italic text-center">
            "{habit.motivationalText}"
          </p>
        )}
        
        {/* View Details */}
        {onViewDetails && (
          <button
            onClick={onViewDetails}
            className="mt-3 w-full flex items-center justify-center space-x-1 
                     text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <span>View Details</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
