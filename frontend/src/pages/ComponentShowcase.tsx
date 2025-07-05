import React, { useState } from 'react';
import {
  // Encryption Components
  EncryptionToggle,
  EncryptionIndicator,
  ShareDialog,
  KeyManagement,
  EncryptionOnboarding,
  ShareableItem,
  ShareToken,
} from '../components/encryption';

import {
  // Goal Components
  GoalTypeSelector,
  RecurringGoalForm,
  MilestoneGoalForm,
  TargetGoalForm,
  StreakGoalForm,
  LimitGoalForm,
  GoalList,
  GoalDetail,
  ProgressRing,
  GoalProgressRing,
  StreakCalendar,
  MilestoneChart,
  TrendLine,
  
  // Types
  Goal,
  GoalPattern,
} from '../features/goals';

// Mock data for demonstrations
const mockGoals: Goal[] = [
  {
    goalId: '1',
    userId: 'demo',
    title: 'Daily Exercise',
    description: 'Stay active every day',
    category: 'health',
    goalPattern: 'recurring',
    target: {
      metric: 'count',
      value: 1,
      unit: 'workout',
      period: 'day',
      direction: 'increase',
      targetType: 'minimum',
    },
    schedule: {
      frequency: 'daily',
      checkInFrequency: 'daily',
    },
    progress: {
      percentComplete: 75,
      currentPeriodValue: 1,
      successRate: 85,
      trend: 'improving',
      lastActivityDate: new Date(),
    },
    context: {
      importanceLevel: 4,
    },
    rewards: {
      pointsPerActivity: 10,
      milestoneRewards: [],
      badges: ['🏃', '💪'],
    },
    status: 'active',
    visibility: 'private',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
  },
  {
    goalId: '2',
    userId: 'demo',
    title: 'Write 50,000 Words',
    category: 'creative',
    goalPattern: 'milestone',
    target: {
      metric: 'count',
      value: 50000,
      unit: 'words',
      currentValue: 15000,
      direction: 'increase',
      targetType: 'exact',
    },
    schedule: {
      checkInFrequency: 'weekly',
    },
    progress: {
      percentComplete: 30,
      totalAccumulated: 15000,
      remainingToGoal: 35000,
      successRate: 100,
      trend: 'stable',
    },
    context: {
      importanceLevel: 5,
    },
    rewards: {
      pointsPerActivity: 50,
      milestoneRewards: [
        { value: 10000, reward: 'Novice Writer', unlockedAt: new Date('2024-02-01') },
        { value: 25000, reward: 'Dedicated Writer' },
        { value: 50000, reward: 'Novel Complete!' },
      ],
      badges: ['✍️'],
    },
    status: 'active',
    visibility: 'private',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
  },
  {
    goalId: '3',
    userId: 'demo',
    title: '30 Days of Meditation',
    category: 'wellness',
    goalPattern: 'streak',
    target: {
      metric: 'count',
      value: 1,
      unit: 'session',
      period: 'day',
      direction: 'maintain',
      targetType: 'minimum',
    },
    schedule: {
      frequency: 'daily',
      checkInFrequency: 'daily',
    },
    progress: {
      percentComplete: 40,
      currentStreak: 12,
      longestStreak: 15,
      targetStreak: 30,
      successRate: 80,
      trend: 'improving',
    },
    context: {
      importanceLevel: 4,
    },
    rewards: {
      pointsPerActivity: 20,
      milestoneRewards: [],
      badges: ['🧘'],
    },
    status: 'active',
    visibility: 'private',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
  },
];

const mockActivities = [
  {
    activityId: '1',
    goalId: '1',
    userId: 'demo',
    value: 1,
    unit: 'workout',
    activityType: 'completed' as const,
    activityDate: new Date(),
    loggedAt: new Date(),
    timezone: 'America/New_York',
    context: {
      timeOfDay: 'morning' as const,
      dayOfWeek: 'Monday',
      isWeekend: false,
      isHoliday: false,
      withOthers: false,
    },
    source: 'manual' as const,
  },
];

const mockMilestoneData = [
  { date: new Date('2024-01-01'), value: 0 },
  { date: new Date('2024-01-15'), value: 5000 },
  { date: new Date('2024-02-01'), value: 10000 },
  { date: new Date('2024-02-15'), value: 12000 },
  { date: new Date('2024-03-01'), value: 15000 },
];

const mockTrendData = [
  { date: new Date('2024-01-01'), value: 180 },
  { date: new Date('2024-01-15'), value: 178 },
  { date: new Date('2024-02-01'), value: 175 },
  { date: new Date('2024-02-15'), value: 174 },
  { date: new Date('2024-03-01'), value: 172 },
];

export const ComponentShowcase: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [selectedGoalPattern, setSelectedGoalPattern] = useState<GoalPattern | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [encryptionEnabled, setEncryptionEnabled] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'encryption', label: 'Encryption Components' },
    { id: 'goal-forms', label: 'Goal Forms' },
    { id: 'visualizations', label: 'Progress Visualizations' },
    { id: 'goal-management', label: 'Goal Management' },
  ];

  const handleShare = (tokens: ShareToken[]) => {
    console.log('Shared with tokens:', tokens);
    setShowShareDialog(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-900">
                  AI Lifestyle App - Component Showcase
                </h1>
              </div>
              <div className="flex items-center gap-4">
                {sections.map(section => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeSection === section.id
                        ? 'bg-purple-100 text-purple-700'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {section.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </nav>

        {/* Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeSection === 'overview' && (
            <div className="space-y-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Welcome to the Component Showcase
                </h2>
                <p className="text-gray-600 mb-6">
                  This is a demonstration of all the UI components built for the AI Lifestyle App.
                  Navigate through the sections above to explore different component categories.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-purple-50 rounded-lg p-6">
                    <h3 className="font-semibold text-purple-900 mb-2">
                      🔐 Encryption Components
                    </h3>
                    <p className="text-sm text-purple-700">
                      Universal encryption UI for privacy-first data management
                    </p>
                  </div>
                  
                  <div className="bg-blue-50 rounded-lg p-6">
                    <h3 className="font-semibold text-blue-900 mb-2">
                      🎯 Goal System
                    </h3>
                    <p className="text-sm text-blue-700">
                      5 goal patterns covering 100% of lifestyle goals
                    </p>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-6">
                    <h3 className="font-semibold text-green-900 mb-2">
                      📊 Visualizations
                    </h3>
                    <p className="text-sm text-green-700">
                      Beautiful charts and progress indicators
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Quick Stats
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">16</div>
                    <div className="text-sm text-gray-600">Components Built</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">5</div>
                    <div className="text-sm text-gray-600">Goal Patterns</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">100%</div>
                    <div className="text-sm text-gray-600">TypeScript</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600">A11y</div>
                    <div className="text-sm text-gray-600">Accessible</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'encryption' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-gray-900">Encryption Components</h2>
              
              {/* Encryption Toggle */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Encryption Toggle</h3>
                <EncryptionToggle
                  value={encryptionEnabled}
                  onChange={setEncryptionEnabled}
                  moduleId="demo"
                />
              </div>
              
              {/* Encryption Indicators */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Encryption Indicators</h3>
                <div className="flex items-center gap-4">
                  <EncryptionIndicator status="encrypted" module="Journal" showLabel />
                  <EncryptionIndicator status="unencrypted" module="Goals" showLabel />
                  <EncryptionIndicator status="partial" module="Health" showLabel />
                  <EncryptionIndicator status="error" module="Finance" showLabel />
                </div>
              </div>
              
              {/* Share Dialog Demo */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Share Dialog</h3>
                <button
                  onClick={() => setShowShareDialog(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Open Share Dialog
                </button>
                <ShareDialog
                  isOpen={showShareDialog}
                  onClose={() => setShowShareDialog(false)}
                  items={[
                    {
                      id: '1',
                      title: 'My Private Journal Entry',
                      type: 'journal',
                      createdAt: new Date().toISOString(),
                      encrypted: true,
                    },
                  ]}
                  onShare={handleShare}
                />
              </div>
              
              {/* Key Management */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Management</h3>
                <KeyManagement
                  hasBackup={false}
                  onBackup={async () => console.log('Backup created')}
                  onRestore={async (key) => console.log('Restored with key:', key)}
                />
              </div>
            </div>
          )}

          {activeSection === 'goal-forms' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-gray-900">Goal Creation Forms</h2>
              
              {/* Goal Type Selector */}
              {!selectedGoalPattern ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <GoalTypeSelector onSelectType={setSelectedGoalPattern} />
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <button
                    onClick={() => setSelectedGoalPattern(null)}
                    className="mb-4 text-purple-600 hover:text-purple-700"
                  >
                    ← Back to selection
                  </button>
                  
                  {selectedGoalPattern === 'recurring' && (
                    <RecurringGoalForm
                      onSubmit={(data) => {
                        console.log('Recurring goal created:', data);
                        setSelectedGoalPattern(null);
                      }}
                      onCancel={() => setSelectedGoalPattern(null)}
                    />
                  )}
                  
                  {selectedGoalPattern === 'milestone' && (
                    <MilestoneGoalForm
                      onSubmit={(data) => {
                        console.log('Milestone goal created:', data);
                        setSelectedGoalPattern(null);
                      }}
                      onCancel={() => setSelectedGoalPattern(null)}
                    />
                  )}
                  
                  {selectedGoalPattern === 'target' && (
                    <TargetGoalForm
                      onSubmit={(data) => {
                        console.log('Target goal created:', data);
                        setSelectedGoalPattern(null);
                      }}
                      onCancel={() => setSelectedGoalPattern(null)}
                    />
                  )}
                  
                  {selectedGoalPattern === 'streak' && (
                    <StreakGoalForm
                      onSubmit={(data) => {
                        console.log('Streak goal created:', data);
                        setSelectedGoalPattern(null);
                      }}
                      onCancel={() => setSelectedGoalPattern(null)}
                    />
                  )}
                  
                  {selectedGoalPattern === 'limit' && (
                    <LimitGoalForm
                      onSubmit={(data) => {
                        console.log('Limit goal created:', data);
                        setSelectedGoalPattern(null);
                      }}
                      onCancel={() => setSelectedGoalPattern(null)}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {activeSection === 'visualizations' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-gray-900">Progress Visualizations</h2>
              
              {/* Progress Rings */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress Rings</h3>
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <ProgressRing progress={25} color="#3B82F6" />
                    <p className="mt-2 text-sm text-gray-600">25% Complete</p>
                  </div>
                  <div className="text-center">
                    <ProgressRing progress={75} color="#8B5CF6" />
                    <p className="mt-2 text-sm text-gray-600">75% Complete</p>
                  </div>
                  <div className="text-center">
                    <ProgressRing progress={100} color="#10B981" />
                    <p className="mt-2 text-sm text-gray-600">Goal Complete!</p>
                  </div>
                  <div className="text-center">
                    <GoalProgressRing
                      current={15}
                      target={20}
                      unit="miles"
                      color="#F59E0B"
                    />
                    <p className="mt-2 text-sm text-gray-600">Goal Progress</p>
                  </div>
                </div>
              </div>
              
              {/* Streak Calendar */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Streak Calendar</h3>
                <StreakCalendar
                  currentStreak={12}
                  longestStreak={15}
                  completedDates={[
                    '2024-03-01', '2024-03-02', '2024-03-03', '2024-03-04',
                    '2024-03-05', '2024-03-06', '2024-03-08', '2024-03-09',
                    '2024-03-10', '2024-03-11', '2024-03-12', '2024-03-13',
                  ]}
                  skippedDates={['2024-03-07']}
                />
              </div>
              
              {/* Milestone Chart */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Milestone Chart</h3>
                <MilestoneChart
                  data={mockMilestoneData}
                  targetValue={50000}
                  currentValue={15000}
                  unit="words"
                  color="#8B5CF6"
                />
              </div>
              
              {/* Trend Line */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Trend Line</h3>
                <TrendLine
                  data={mockTrendData}
                  startValue={180}
                  targetValue={160}
                  targetDate={new Date('2024-06-01')}
                  unit="lbs"
                  direction="decrease"
                  color="#10B981"
                />
              </div>
            </div>
          )}

          {activeSection === 'goal-management' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-gray-900">Goal Management</h2>
              
              {!selectedGoal ? (
                <GoalList
                  goals={mockGoals}
                  onSelectGoal={setSelectedGoal}
                  onCreateGoal={() => setActiveSection('goal-forms')}
                  onEditGoal={(goal) => console.log('Edit goal:', goal)}
                  onUpdateStatus={(goalId, status) => console.log('Update status:', goalId, status)}
                  onDeleteGoal={(goalId) => console.log('Delete goal:', goalId)}
                />
              ) : (
                <GoalDetail
                  goal={selectedGoal}
                  activities={mockActivities}
                  onBack={() => setSelectedGoal(null)}
                  onEdit={(goal) => console.log('Edit goal:', goal)}
                  onUpdateStatus={(status) => console.log('Update status:', status)}
                  onDelete={() => {
                    console.log('Delete goal');
                    setSelectedGoal(null);
                  }}
                  onLogActivity={(activity) => console.log('Log activity:', activity)}
                />
              )}
            </div>
          )}
        </main>
      </div>
  );
};
