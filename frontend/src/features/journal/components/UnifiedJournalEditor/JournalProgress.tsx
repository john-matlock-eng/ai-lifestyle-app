// JournalProgress.tsx
import React from 'react';
import { CheckCircle, Circle } from 'lucide-react';

interface JournalProgressProps {
  completed: number;
  total: number;
  percentage: number;
  className?: string;
}

const JournalProgress: React.FC<JournalProgressProps> = ({
  completed,
  total,
  percentage,
  className = ''
}) => {
  return (
    <div className={`text-center ${className}`}>
      <div className="relative w-16 h-16 mx-auto mb-2">
        {/* Background circle */}
        <svg className="w-16 h-16 transform -rotate-90">
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="text-surface-muted"
          />
          {/* Progress circle */}
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 28}`}
            strokeDashoffset={`${2 * Math.PI * 28 * (1 - percentage / 100)}`}
            className="text-accent transition-all duration-300 ease-out"
            strokeLinecap="round"
          />
        </svg>
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          {percentage === 100 ? (
            <CheckCircle className="w-6 h-6 text-accent" />
          ) : (
            <Circle className="w-6 h-6 text-muted" />
          )}
        </div>
      </div>
      <div className="text-sm font-medium text-theme">
        {completed}/{total}
      </div>
      <div className="text-xs text-muted">
        {percentage === 100 ? 'Complete!' : 'Sections'}
      </div>
    </div>
  );
};

export default JournalProgress;