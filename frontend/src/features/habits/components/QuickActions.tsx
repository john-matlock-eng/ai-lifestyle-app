import React from 'react';
import { Plus, BarChart3, Settings, Gift } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const QuickActions: React.FC = () => {
  const navigate = useNavigate();

  const actions = [
    {
      icon: <Plus className="w-5 h-5" />,
      label: 'Add Habit',
      color: 'bg-blue-500 hover:bg-blue-600',
      onClick: () => navigate('/habits/new')
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      label: 'View Analytics',
      color: 'bg-purple-500 hover:bg-purple-600',
      onClick: () => navigate('/habits/analytics')
    },
    {
      icon: <Settings className="w-5 h-5" />,
      label: 'Manage Habits',
      color: 'bg-gray-500 hover:bg-gray-600',
      onClick: () => navigate('/habits/manage')
    },
    {
      icon: <Gift className="w-5 h-5" />,
      label: 'Rewards',
      color: 'bg-pink-500 hover:bg-pink-600',
      onClick: () => navigate('/habits/rewards')
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className={`${action.color} text-white rounded-lg p-3 flex flex-col items-center justify-center space-y-2 transition-colors transform hover:scale-[1.02] active:scale-[0.98]`}
          >
            {action.icon}
            <span className="text-xs font-medium">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
