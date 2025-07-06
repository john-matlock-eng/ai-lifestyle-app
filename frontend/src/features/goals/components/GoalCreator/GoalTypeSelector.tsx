import React from 'react';
import { Target, Repeat, Trophy, Flame, ShieldAlert } from 'lucide-react';
import type { GoalPattern, GoalPatternConfig } from '../../types/goal.types';
import { GOAL_PATTERN_COLORS } from '../../types/goal.types';

interface GoalTypeSelectorProps {
  onSelectType: (pattern: GoalPattern) => void;
  className?: string;
}

const goalPatternConfigs: GoalPatternConfig[] = [
  {
    pattern: 'recurring',
    title: 'Recurring Goal',
    description: 'Do something regularly',
    icon: Repeat,
    color: GOAL_PATTERN_COLORS.recurring,
    example: 'Exercise 3 times per week',
  },
  {
    pattern: 'milestone',
    title: 'Milestone Goal',
    description: 'Reach a total amount',
    icon: Trophy,
    color: GOAL_PATTERN_COLORS.milestone,
    example: 'Write 50,000 words',
  },
  {
    pattern: 'target',
    title: 'Target Goal',
    description: 'Achieve by a specific date',
    icon: Target,
    color: GOAL_PATTERN_COLORS.target,
    example: 'Lose 20 lbs by summer',
  },
  {
    pattern: 'streak',
    title: 'Streak Goal',
    description: 'Build consecutive habits',
    icon: Flame,
    color: GOAL_PATTERN_COLORS.streak,
    example: '100 days of meditation',
  },
  {
    pattern: 'limit',
    title: 'Limit Goal',
    description: 'Stay within boundaries',
    icon: ShieldAlert,
    color: GOAL_PATTERN_COLORS.limit,
    example: 'Screen time under 2 hours/day',
  },
];

export const GoalTypeSelector: React.FC<GoalTypeSelectorProps> = ({
  onSelectType,
  className = '',
}) => {
  return (
    <div className={`space-y-6 ${className}`}>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          What type of goal do you want to set?
        </h2>
        <p className="text-gray-600">
          Choose the pattern that best fits what you want to achieve
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {goalPatternConfigs.map((config) => {
          const Icon = config.icon;
          return (
            <button
              key={config.pattern}
              onClick={() => onSelectType(config.pattern)}
              className="group relative bg-white rounded-xl border-2 border-gray-200 p-6 text-left hover:border-gray-300 hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              aria-label={`Select ${config.title}`}
            >
              {/* Pattern indicator */}
              <div
                className="absolute top-0 right-0 w-20 h-20 opacity-10 rounded-bl-full"
                style={{ backgroundColor: config.color }}
              />

              <div className="relative space-y-3">
                <div
                  className="inline-flex p-3 rounded-lg"
                  style={{ backgroundColor: `${config.color}20` }}
                >
                  <Icon
                    className="h-6 w-6"
                    style={{ color: config.color }}
                    aria-hidden={true}
                  />
                </div>

                <div>
                  <h3
                    className="font-semibold text-gray-900 mb-1"
                    style={{ color: config.color }}
                  >
                    {config.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {config.description}
                  </p>
                  <p className="text-xs text-gray-500 italic">
                    "{config.example}"
                  </p>
                </div>
              </div>

              {/* Hover effect */}
              <div
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-5 transition-opacity"
                style={{ backgroundColor: config.color }}
              />
            </button>
          );
        })}
      </div>

      <div className="text-center text-sm text-gray-500">
        <p>
          💡 <strong>Tip:</strong> Not sure which type to choose? Think about{' '}
          <span className="font-medium">how you'll measure success</span>
        </p>
      </div>
    </div>
  );
};
