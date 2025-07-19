import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHabits } from '../hooks/useHabits';
import { HABIT_CATEGORIES } from '@/types/habits';
import Button from '@/components/common/Button';
import { HabitCard } from '../components/HabitCard';
import { 
  Plus, 
  Filter, 
  TrendingUp,
  Calendar,
  Target,
  Award,
  ChevronRight,
  BarChart3,
  Settings
} from 'lucide-react';

export const HabitsPage: React.FC = () => {
  const navigate = useNavigate();
  const { habits, stats, checkInHabit, skipHabit, isLoading } = useHabits();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  
  // Filter habits based on selected criteria
  const filteredHabits = habits.filter(habit => {
    if (selectedCategory !== 'all' && habit.category !== selectedCategory) {
      return false;
    }
    if (showOnlyActive && habit.currentStreak === 0) {
      return false;
    }
    return true;
  });
  
  const handleHabitToggle = async (habitId: string, completed: boolean) => {
    try {
      await checkInHabit(habitId, completed);
    } catch (error) {
      console.error('Failed to check in habit:', error);
    }
  };
  
  const handleViewDetails = (habitId: string) => {
    navigate(`/habits/${habitId}`);
  };
  
  const handleEditHabit = (habitId: string) => {
    navigate(`/habits/${habitId}/edit`);
  };
  
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 -mx-4 -mt-6 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-6">
        <div className="md:flex md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Habits</h1>
            <p className="mt-1 text-sm text-gray-500">
              Track your daily progress and build lasting routines
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <Button
              variant="outline"
              onClick={() => navigate('/habits/analytics')}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </Button>
            <Button
              onClick={() => navigate('/habits/new')}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Habit
            </Button>
          </div>
        </div>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          label="Total Habits"
          value={stats.totalHabits}
          icon={<Target className="w-6 h-6 text-blue-500" />}
          onClick={() => {}}
        />
        <StatsCard
          label="Completed Today"
          value={`${stats.habitsCompletedToday}/${stats.totalHabits}`}
          icon={<Calendar className="w-6 h-6 text-green-500" />}
          onClick={() => {}}
        />
        <StatsCard
          label="Current Level"
          value={`Level ${stats.currentLevel}`}
          subValue={`${Math.round(stats.nextLevelProgress)}% to next`}
          icon={<TrendingUp className="w-6 h-6 text-purple-500" />}
          onClick={() => navigate('/habits/rewards')}
        />
        <StatsCard
          label="Total Points"
          value={stats.totalPoints.toLocaleString()}
          icon={<Award className="w-6 h-6 text-yellow-500" />}
          onClick={() => navigate('/habits/rewards')}
        />
      </div>
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter:</span>
          </div>
          
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            {HABIT_CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.icon} {cat.label}
              </option>
            ))}
          </select>
          
          {/* Active Filter */}
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={showOnlyActive}
              onChange={(e) => setShowOnlyActive(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-gray-700">Active habits only</span>
          </label>
          
          <div className="ml-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/habits/manage')}
            >
              <Settings className="w-4 h-4 mr-2" />
              Manage
            </Button>
          </div>
        </div>
      </div>
      
      {/* Habits Grid */}
      {filteredHabits.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          {habits.length === 0 ? (
            <>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No habits yet</h3>
              <p className="text-gray-500 mb-4">Start building better routines today!</p>
              <Button onClick={() => navigate('/habits/new')}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Habit
              </Button>
            </>
          ) : (
            <>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No habits match filters</h3>
              <p className="text-gray-500">Try adjusting your filters to see more habits.</p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHabits.map(habit => (
            <div key={habit.id} className="relative group">
              <HabitCard 
                habit={habit} 
                onToggle={(completed) => handleHabitToggle(habit.id, completed)}
                onSkip={() => skipHabit(habit.id)}
                onViewDetails={() => handleViewDetails(habit.id)}
              />
              
              {/* Edit button overlay */}
              <button
                onClick={() => handleEditHabit(habit.id)}
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md"
                title="Edit habit"
              >
                <Settings className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Quick Actions */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Quick Tips</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Complete habits daily to build streaks and earn points</li>
          <li>• Link habits to your goals for better tracking</li>
          <li>• Set reminders to stay consistent</li>
          <li>• Check analytics to see your progress patterns</li>
        </ul>
      </div>
    </div>
  );
};

// Stats Card Component
const StatsCard: React.FC<{
  label: string;
  value: string | number;
  subValue?: string;
  icon: React.ReactNode;
  onClick: () => void;
}> = ({ label, value, subValue, icon, onClick }) => (
  <button
    onClick={onClick}
    className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 hover:shadow-md transition-all text-left group"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-lg font-bold text-gray-900">{value}</p>
        {subValue && (
          <p className="text-xs text-gray-600 mt-1">{subValue}</p>
        )}
      </div>
      <div className="flex items-center">
        {icon}
        <ChevronRight className="w-4 h-4 text-gray-400 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  </button>
);
