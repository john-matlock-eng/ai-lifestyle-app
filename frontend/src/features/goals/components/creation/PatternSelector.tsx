import React from 'react';
import type { GoalPattern } from '../../types/api.types';
import { GOAL_PATTERNS } from '../../types/ui.types';

interface PatternSelectorProps {
  onSelect: (pattern: GoalPattern) => void;
  selectedPattern?: GoalPattern;
}

const PatternSelector: React.FC<PatternSelectorProps> = ({ onSelect, selectedPattern }) => {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-[var(--text)]">What kind of goal do you want to set?</h2>
        <p className="mt-2 text-muted">Choose the pattern that best fits what you want to achieve</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Object.values(GOAL_PATTERNS).map((pattern) => (
          <button
            key={pattern.id}
            onClick={() => onSelect(pattern.id)}
            className={`
              relative p-6 rounded-lg border-2 transition-all text-left
              hover:shadow-lg hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[color:var(--bg)]
              ${
                selectedPattern === pattern.id
                  ? `${pattern.borderColor} ${pattern.bgColor} ring-2 ring-offset-2`
                  : 'border-[color:var(--surface-muted)] hover:border-[color:var(--surface-muted)] bg-[var(--surface)]'
              }
            `}
            style={{
              borderColor: selectedPattern === pattern.id ? pattern.color : undefined,
              ...({ '--tw-ring-color': pattern.color } as React.CSSProperties),
            }}
          >
            {/* Pattern Icon */}
            <div className="text-4xl mb-3">{pattern.icon}</div>

            {/* Pattern Title */}
            <h3 className="text-lg font-semibold text-[var(--text)] mb-1">
              {pattern.title}
            </h3>

            {/* Pattern Description */}
            <p className="text-sm text-muted mb-3">
              {pattern.description}
            </p>

            {/* Examples */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Examples:</p>
              <ul className="text-sm text-gray-700 space-y-1">
                {pattern.examples.map((example, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-gray-400 mr-1">•</span>
                    <span>{example}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Selected Indicator */}
            {selectedPattern === pattern.id && (
              <div
                className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ backgroundColor: pattern.color }}
              >
                <svg
                  className="w-4 h-4 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Help Section */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h4 className="text-sm font-medium text-blue-900">Not sure which to choose?</h4>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <strong>Recurring</strong> - Best for daily habits and routines
                </li>
                <li>
                  <strong>Milestone</strong> - Great for long-term achievements
                </li>
                <li>
                  <strong>Target</strong> - Perfect when you have a specific deadline
                </li>
                <li>
                  <strong>Streak</strong> - Ideal for building consistency
                </li>
                <li>
                  <strong>Limit</strong> - Helpful for reducing or controlling something
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatternSelector;
