import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, BarChart3, Trophy, Target } from 'lucide-react';
import { clsx } from 'clsx';

export const QuickActions: React.FC = () => {
  const navigate = useNavigate();
  
  const actions = [
    {
      icon: <Plus className="w-5 h-5" />,
      label: 'New Habit',
      description: 'Create a new habit',
      onClick: () => navigate('/habits/new'),
      gradient: 'from-purple-500 to-pink-500',
      iconBg: 'bg-purple-500/20',
      emoji: '🌱'
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      label: 'Analytics',
      description: 'View your progress',
      onClick: () => navigate('/habits/analytics'),
      gradient: 'from-blue-500 to-cyan-500',
      iconBg: 'bg-blue-500/20',
      emoji: '📊'
    },
    {
      icon: <Trophy className="w-5 h-5" />,
      label: 'Rewards',
      description: 'Check your rewards',
      onClick: () => navigate('/habits/rewards'),
      gradient: 'from-yellow-500 to-orange-500',
      iconBg: 'bg-yellow-500/20',
      emoji: '🏆'
    },
    {
      icon: <Target className="w-5 h-5" />,
      label: 'Goals',
      description: 'Manage your goals',
      onClick: () => navigate('/goals'),
      gradient: 'from-emerald-500 to-teal-500',
      iconBg: 'bg-emerald-500/20',
      emoji: '🎯'
    }
  ];
  
  return (
    <div className="rounded-xl bg-[var(--surface)] border border-[var(--surface-muted)] p-4">
      <h3 className="text-lg font-semibold mb-4">
        <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Quick Actions
        </span>
      </h3>
      <div className="space-y-3">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className={clsx(
              "w-full relative overflow-hidden rounded-lg p-4 text-left transition-all duration-300",
              "bg-gradient-to-br hover:scale-[1.02] hover:shadow-lg group",
              "border border-[var(--surface-muted)] hover:border-transparent"
            )}
            style={{
              background: `linear-gradient(135deg, ${action.gradient.includes('purple') ? 'rgba(168, 85, 247, 0.1)' : action.gradient.includes('blue') ? 'rgba(59, 130, 246, 0.1)' : action.gradient.includes('yellow') ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)'} 0%, transparent 100%)`
            }}
          >
            <div className="relative z-10 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{action.emoji}</span>
                <div className={clsx("p-2 rounded-lg", action.iconBg)}>
                  <div className={clsx("bg-gradient-to-br", action.gradient, "text-white")}>
                    {action.icon}
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <p className={clsx(
                  "font-medium mb-0.5 bg-gradient-to-r bg-clip-text text-transparent",
                  action.gradient
                )}>
                  {action.label}
                </p>
                <p className="text-xs text-[var(--text-muted)]">{action.description}</p>
              </div>
              <svg className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--text)] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <div className={clsx(
              "absolute -bottom-10 -right-10 h-24 w-24 rounded-full bg-gradient-to-br opacity-10 group-hover:opacity-20 transition-opacity blur-xl",
              action.gradient
            )} />
          </button>
        ))}
      </div>
    </div>
  );
};
