import React, { useState } from 'react';
import { 
  ArrowLeft, Calendar, TrendingUp, MoreVertical, Edit2, Pause, Play, 
  Archive, Trash2, Plus, CheckCircle, XCircle, Clock, Target, Trophy,
  Flame, ShieldAlert, BarChart3, Share2
} from 'lucide-react';
import type { Goal, GoalActivity, GoalStatistics } from '../types/api.types';
import { GOAL_PATTERN_COLORS } from '../types/goal.types';
import { GoalProgressRing } from './GoalProgress/ProgressRing';
import ProgressCharts from './GoalProgress/ProgressCharts';
import { StreakCalendar } from './GoalProgress/StreakCalendar';
import ActivityHistory from './GoalProgress/ActivityHistory';
import { useEncryption } from '../../../hooks/useEncryption';
import type { ShareableItem, ShareToken } from '../../../components/encryption';
import { ShareDialog } from '../../../components/encryption';

interface GoalDetailProps {
  goal: Goal;
  activities: GoalActivity[];
  onBack: () => void;
  onEdit: (goal: Goal) => void;
  onUpdateStatus: (status: 'active' | 'paused' | 'completed' | 'archived') => void;
  onDelete: () => void;
  onLogActivity: (activity: Partial<GoalActivity>) => void;
  className?: string;
}

export const GoalDetail: React.FC<GoalDetailProps> = ({
  goal,
  activities,
  onBack,
  onEdit,
  onUpdateStatus,
  onDelete,
  onLogActivity,
  className = '',
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);
  const [activityValue, setActivityValue] = useState(1);
  const [activityNote, setActivityNote] = useState('');
  const [showShareDialog, setShowShareDialog] = useState(false);
  const { decrypt } = useEncryption('goals');

  // Get private notes if encrypted
  const [privateNotes, setPrivateNotes] = useState<string | null>(null);
  React.useEffect(() => {
    if (goal.metadata?.encryptedNotes) {
      decrypt(goal.metadata.encryptedNotes).then((decrypted) => {
        if (typeof decrypted === 'object' && decrypted !== null && 'notes' in decrypted) {
          setPrivateNotes(decrypted.notes as string);
        }
      }).catch(err => {
        console.error('Failed to decrypt notes:', err);
      });
    }
  }, [goal.metadata, decrypt]);

  const handleLogActivity = () => {
    onLogActivity({
      goalId: goal.goalId,
      value: activityValue,
      unit: goal.target.unit,
      activityType: 'progress',
      note: activityNote || undefined,
    });
    setShowLogForm(false);
    setActivityValue(1);
    setActivityNote('');
  };

  const handleShare = (tokens: ShareToken[]) => {
    console.log('Shared goal with tokens:', tokens);
    setShowShareDialog(false);
  };

  const getPatternIcon = () => {
    const icons = {
      recurring: Calendar,
      milestone: Trophy,
      target: Target,
      streak: Flame,
      limit: ShieldAlert,
    };
    return icons[goal.goalPattern] || Target;
  };

  const PatternIcon = getPatternIcon();
  const color = GOAL_PATTERN_COLORS[goal.goalPattern];

  // Calculate streak data for streak goals
  const streakData = goal.goalPattern === 'streak' ? {
    completedDates: activities
      .filter(a => a.activityType === 'completed' || a.activityType === 'progress')
      .map(a => a.activityDate.split('T')[0]),
    skippedDates: activities
      .filter(a => a.activityType === 'skipped')
      .map(a => a.activityDate.split('T')[0]),
  } : null;

  // Recent activities
  const recentActivities = activities.slice(0, 5);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-[var(--surface)] rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-muted hover:text-[var(--text)]"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Goals
          </button>
          
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Goal actions"
            >
              <MoreVertical className="h-5 w-5 text-gray-500" />
            </button>
            
            {showActions && (
              <div className="absolute right-0 top-10 z-10 w-48 bg-[var(--surface)] rounded-lg shadow-lg border border-gray-200 py-1">
                <button
                  onClick={() => {
                    onEdit(goal);
                    setShowActions(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit Goal
                </button>
                
                <button
                  onClick={() => {
                    setShowShareDialog(true);
                    setShowActions(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  Share Goal
                </button>
                
                {goal.status === 'active' ? (
                  <button
                    onClick={() => {
                      onUpdateStatus('paused');
                      setShowActions(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Pause className="h-4 w-4" />
                    Pause Goal
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onUpdateStatus('active');
                      setShowActions(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Resume Goal
                  </button>
                )}
                
                <button
                  onClick={() => {
                    onUpdateStatus('completed');
                    setShowActions(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Mark Complete
                </button>
                
                <button
                  onClick={() => {
                    onUpdateStatus('archived');
                    setShowActions(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <Archive className="h-4 w-4" />
                  Archive Goal
                </button>
                
                <hr className="my-1" />
                
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this goal?')) {
                      onDelete();
                      setShowActions(false);
                    }
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Goal
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div
            className="p-3 rounded-lg"
            style={{ backgroundColor: `${color}20` }}
          >
            <PatternIcon className="h-8 w-8" style={{ color }} />
          </div>
          
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-[var(--text)] mb-2">{goal.title}</h1>
            {goal.description && (
              <p className="text-muted">{goal.description}</p>
            )}
            
            <div className="flex items-center gap-4 mt-3">
              <span
                className="text-sm font-medium px-3 py-1 rounded-full"
                style={{
                  backgroundColor: `${color}20`,
                  color: color,
                }}
              >
                {goal.goalPattern}
              </span>
              <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                goal.status === 'active' ? 'bg-green-100 text-green-700' :
                goal.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                goal.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {goal.status}
              </span>
              {goal.target.targetDate && (
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Due {new Date(goal.target.targetDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          
          <div className="text-center">
            <GoalProgressRing
              current={goal.progress.currentPeriodValue || goal.progress.totalAccumulated || goal.progress.currentStreak || 0}
              target={goal.target.value}
              unit={goal.target.unit}
              goalType={goal.goalPattern}
              color={color}
              size={120}
            />
            <p className="text-sm text-muted mt-2">
              {goal.progress.trend} trend
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-[var(--surface)] rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Quick Actions</h2>
        
        {!showLogForm ? (
          <button
            onClick={() => setShowLogForm(true)}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            style={{ borderColor: color }}
          >
            <Plus className="h-5 w-5" style={{ color }} />
            <span className="font-medium" style={{ color }}>Log Progress</span>
          </button>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={activityValue}
                    onChange={(e) => setActivityValue(parseFloat(e.target.value) || 0)}
                    min={0}
                    step="0.1"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <span className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-muted">
                    {goal.target.unit}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  When
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                  <option>Today</option>
                  <option>Yesterday</option>
                  <option>Custom date...</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note (optional)
              </label>
              <textarea
                value={activityNote}
                onChange={(e) => setActivityNote(e.target.value)}
                placeholder="How did it go?"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleLogActivity}
                className="flex-1 py-2 px-4 text-white rounded-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: color }}
              >
                Save Progress
              </button>
              <button
                onClick={() => {
                  setShowLogForm(false);
                  setActivityValue(1);
                  setActivityNote('');
                }}
                className="px-4 py-2 text-muted hover:text-[var(--text)]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Progress Visualization */}
      <ProgressCharts
        goal={goal}
        activities={activities}
          progress={{
            goalId: goal.goalId,
            period: 'current',
            progress: goal.progress,
            statistics: {} as GoalStatistics,
          }}
      />

      {goal.goalPattern === 'streak' && streakData && (
        <StreakCalendar
          currentStreak={goal.progress.currentStreak || 0}
          longestStreak={goal.progress.longestStreak || 0}
          completedDates={streakData.completedDates}
          skippedDates={streakData.skippedDates}
          color={color}
        />
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[var(--surface)] rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-muted" />
            </div>
            <div>
              <p className="text-sm text-muted">Success Rate</p>
              <p className="text-2xl font-bold text-[var(--text)]">
                {goal.progress.successRate}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[var(--surface)] rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Clock className="h-6 w-6 text-muted" />
            </div>
            <div>
              <p className="text-sm text-muted">Last Activity</p>
              <p className="text-2xl font-bold text-[var(--text)]">
                {goal.progress.lastActivityDate 
                  ? new Date(goal.progress.lastActivityDate).toLocaleDateString()
                  : 'Never'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[var(--surface)] rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-muted" />
            </div>
            <div>
              <p className="text-sm text-muted">Projected Completion</p>
              <p className="text-2xl font-bold text-[var(--text)]">
                {goal.progress.projectedCompletion
                  ? new Date(goal.progress.projectedCompletion).toLocaleDateString()
                  : 'TBD'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-[var(--surface)] rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Recent Activities</h2>
        
        {recentActivities.length > 0 ? (
          <div className="space-y-3">
            {recentActivities.map((activity) => (
              <div
                key={activity.activityId}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    activity.activityType === 'completed' ? 'bg-green-100' :
                    activity.activityType === 'progress' ? 'bg-blue-100' :
                    activity.activityType === 'skipped' ? 'bg-yellow-100' :
                    'bg-gray-100'
                  }`}>
                    {activity.activityType === 'completed' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : activity.activityType === 'skipped' ? (
                      <XCircle className="h-5 w-5 text-yellow-600" />
                    ) : (
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-[var(--text)]">
                      {activity.value} {activity.unit}
                    </p>
                    {activity.note && (
                      <p className="text-sm text-muted">{activity.note}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-[var(--text)]">
                    {new Date(activity.activityDate).toLocaleDateString()}
                  </p>
                    <p className="text-xs text-gray-500">
                      {activity.context?.timeOfDay}
                    </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            No activities logged yet. Start tracking your progress!
          </p>
        )}
      </div>

      {/* Full Activity History */}
      <ActivityHistory goalId={goal.goalId} className="mt-6" />

      {/* Private Notes */}
      {privateNotes && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            🔒 Private Notes (Encrypted)
          </h3>
          <p className="text-muted whitespace-pre-wrap">{privateNotes}</p>
        </div>
      )}

      {/* Share Dialog */}
      <ShareDialog
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
          items={[{
            id: goal.goalId,
            title: goal.title,
            type: 'goal',
            createdAt: goal.createdAt,
            encrypted: !!goal.metadata?.encryptedNotes,
          }] as ShareableItem[]}
        onShare={handleShare}
      />
    </div>
  );
};
