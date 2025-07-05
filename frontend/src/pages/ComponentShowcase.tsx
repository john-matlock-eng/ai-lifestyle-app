import React, { useState } from 'react';
import {
  // Encryption Components
  EncryptionToggle,
  EncryptionIndicator,
  ShareDialog,
  KeyManagement,
  EncryptionOnboarding,
} from '../components/encryption';

import {
  // Goal Components (only what we've built so far)
  GoalList,
  GoalCard,
  GoalWizard,
  PatternSelector,
  QuickLogModal,
  
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
    category: 'fitness',
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
      lastActivityDate: new Date().toISOString(),
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
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    goalId: '2',
    userId: 'demo',
    title: 'Write 50,000 Words',
    category: 'creativity',
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
        { value: 10000, reward: 'Novice Writer', unlockedAt: new Date('2024-02-01').toISOString() },
        { value: 25000, reward: 'Dedicated Writer' },
        { value: 50000, reward: 'Novel Complete!' },
      ],
      badges: ['✍️'],
    },
    status: 'active',
    visibility: 'private',
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date().toISOString(),
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
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

interface ShareToken {
  id: string;
  recipientEmail: string;
  permissions: string[];
  expiresAt: string;
}

interface ShareableItem {
  id: string;
  title: string;
  type: string;
  createdAt: string;
  encrypted: boolean;
}

export const ComponentShowcase: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [selectedGoalPattern, setSelectedGoalPattern] = useState<GoalPattern | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [encryptionEnabled, setEncryptionEnabled] = useState(false);
  const [showQuickLog, setShowQuickLog] = useState<string | null>(null);

  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'encryption', label: 'Encryption Components' },
    { id: 'goal-components', label: 'Goal Components' },
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
                      Beautiful charts and progress indicators (coming soon)
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Implementation Status
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">✅</div>
                    <div className="text-sm text-gray-600">2FA Complete</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">🔄</div>
                    <div className="text-sm text-gray-600">Goals In Progress</div>
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

          {activeSection === 'goal-components' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-gray-900">Goal Components</h2>
              
              {/* Pattern Selector */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pattern Selector</h3>
                <PatternSelector 
                  onSelect={(pattern) => {
                    console.log('Selected pattern:', pattern);
                    setSelectedGoalPattern(pattern);
                  }}
                  selectedPattern={selectedGoalPattern}
                />
              </div>

              {/* Goal List */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Goal List</h3>
                <GoalList 
                  goals={mockGoals}
                  isLoading={false}
                  onQuickLog={(goalId) => setShowQuickLog(goalId)}
                />
              </div>

              {/* Goal Cards */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Goal Cards</h3>
                <div className="space-y-4">
                  {mockGoals.map(goal => (
                    <GoalCard 
                      key={goal.goalId}
                      goal={goal}
                      onQuickLog={(goalId) => setShowQuickLog(goalId)}
                    />
                  ))}
                </div>
              </div>

              {/* Quick Log Modal */}
              {showQuickLog && (
                <QuickLogModal
                  goalId={showQuickLog}
                  isOpen={!!showQuickLog}
                  onClose={() => setShowQuickLog(null)}
                />
              )}
            </div>
          )}
        </main>
      </div>
  );
};
