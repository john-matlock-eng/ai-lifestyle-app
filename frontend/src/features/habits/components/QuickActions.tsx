import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, BarChart3, Trophy, Target } from 'lucide-react';

export const QuickActions: React.FC = () => {
  const navigate = useNavigate();
  
  const actions = [
    {
      icon: <Plus className="w-5 h-5" />,
      label: 'New Habit',
      description: 'Create a new habit',
      onClick: () => navigate('/habits/new'),
      color: 'accent'
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      label: 'Analytics',
      description: 'View your progress',
      onClick: () => navigate('/habits/analytics'),
      color: 'success'
    },
    {
      icon: <Trophy className="w-5 h-5" />,
      label: 'Rewards',
      description: 'Check your rewards',
      onClick: () => navigate('/habits/rewards'),
      color: 'warning'
    },
    {
      icon: <Target className="w-5 h-5" />,
      label: 'Goals',
      description: 'Manage your goals',
      onClick: () => navigate('/goals'),
      color: 'accent'
    }
  ];
  
  return (
    <div className="glass rounded-lg p-4 border border-surface-muted hover-lift">
      <h3 className="text-sm font-semibold text-theme mb-3">Quick Actions</h3>
      <div className="space-y-2">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-surface-muted transition-colors text-left"
          >
            <div className={`p-2 rounded-lg bg-${action.color === 'accent' ? 'accent' : action.color === 'success' ? 'success-bg' : 'warning-bg'}`}>
              <div className={`text-${action.color === 'accent' ? 'white' : action.color}`}>
                {action.icon}
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-theme">{action.label}</p>
              <p className="text-xs text-muted">{action.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
