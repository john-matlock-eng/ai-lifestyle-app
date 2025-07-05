import React from 'react';
import { clsx } from 'clsx';
import { checkPasswordStrength, getPasswordStrengthLabel, getPasswordStrengthColor } from '../utils/passwordStrength';

interface PasswordStrengthMeterProps {
  password: string;
  showFeedback?: boolean;
}

const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ 
  password, 
  showFeedback = true 
}) => {
  if (!password) return null;

  const strength = checkPasswordStrength(password);
  const label = getPasswordStrengthLabel(strength.score);
  const colorClass = getPasswordStrengthColor(strength.score);

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-600">Password strength:</span>
        <span className={clsx(
          'text-sm font-medium',
          strength.score === 0 && 'text-red-600',
          strength.score === 1 && 'text-orange-600',
          strength.score === 2 && 'text-yellow-600',
          strength.score === 3 && 'text-blue-600',
          strength.score === 4 && 'text-green-600'
        )}>
          {label}
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={clsx(
            'h-full transition-all duration-300',
            colorClass
          )}
          style={{ width: `${(strength.score + 1) * 20}%` }}
          role="progressbar"
          aria-valuenow={strength.score}
          aria-valuemin={0}
          aria-valuemax={4}
          aria-label={`Password strength: ${label}`}
        />
      </div>

      {showFeedback && strength.feedback.length > 0 && (
        <ul className="mt-2 space-y-1">
          {strength.feedback.map((feedback, index) => (
            <li key={index} className="text-xs text-gray-600 flex items-start">
              <svg
                className="h-3 w-3 text-gray-400 mt-0.5 mr-1 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              {feedback}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PasswordStrengthMeter;
