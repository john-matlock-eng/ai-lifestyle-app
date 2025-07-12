import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, X } from 'lucide-react';
import { JournalEditorWithSections } from '../../features/journal/components';
import { useTemplateRegistry } from '../../features/journal/hooks/useTemplateRegistry';
import { createEntry } from '../../api/journal';
import type { CreateJournalEntryRequest, JournalTemplate } from '../../types/journal';
import type { Goal } from '../../features/goals/types/api.types';

// Template prompts for different journal types
const TEMPLATE_PROMPTS: Record<string, { name: string; description: string; prompts: string[] }> = {
  daily_reflection: {
    name: 'Daily Reflection',
    description: 'Reflect on your day and capture important moments',
    prompts: [
      'What were the highlights of today?',
      'What challenges did you face and how did you handle them?',
      'What did you learn today?',
      'What are you grateful for?',
    ],
  },
  gratitude: {
    name: 'Gratitude Journal',
    description: 'Focus on the positive aspects of your life',
    prompts: [
      'List three things you\'re grateful for today',
      'Who made a positive impact on your day?',
      'What small moments brought you joy?',
      'How can you spread gratitude to others?',
    ],
  },
  goal_progress: {
    name: 'Goal Progress',
    description: 'Track your progress towards your goals',
    prompts: [
      'Which goals did you work on today?',
      'What progress did you make?',
      'What obstacles did you encounter?',
      'What\'s your plan for tomorrow?',
    ],
  },
  mood_tracker: {
    name: 'Mood Tracker',
    description: 'Monitor your emotional well-being',
    prompts: [
      'How would you rate your mood today (1-10)?',
      'What influenced your mood?',
      'What emotions did you experience?',
      'What self-care activities did you do?',
    ],
  },
  habit_tracker: {
    name: 'Habit Tracker',
    description: 'Monitor your daily habits and routines',
    prompts: [
      'Which habits did you complete today?',
      'What made it easy or difficult to stick to your habits?',
      'How do you feel about your progress?',
      'What adjustments would help tomorrow?',
    ],
  },
  creative_writing: {
    name: 'Creative Writing',
    description: 'Express yourself through creative writing',
    prompts: [
      'Write a short story or poem',
      'Describe a scene using all five senses',
      'Create a dialogue between two characters',
      'Write about a "what if" scenario',
    ],
  },
  blank: {
    name: 'Blank Journal',
    description: 'Start with a blank canvas',
    prompts: ['Write freely about whatever is on your mind'],
  },
};

// Map frontend template types to the actual template IDs
const TEMPLATE_MAPPING: Record<string, string> = {
  daily_reflection: 'daily_log',
  gratitude: 'gratitude_daily',
  goal_progress: 'daily_log',
  mood_tracker: 'daily_log',
  habit_tracker: 'daily_log',
  creative_writing: 'daily_log',
  blank: 'daily_log',
};

const CreateJournalPage: React.FC = () => {
  const navigate = useNavigate();
  const { templates, loading: templatesLoading } = useTemplateRegistry();
  
  const [title, setTitle] = useState('');
  const [selectedTemplateType, setSelectedTemplateType] = useState<string>('daily_reflection');
  const [linkedGoalIds, setLinkedGoalIds] = useState<string[]>([]);
  const [mood, setMood] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Get the actual template based on the selected type
  const actualTemplateId = TEMPLATE_MAPPING[selectedTemplateType] || 'daily_log';
  const currentTemplate = templates.find(t => t.id === actualTemplateId);

  // Mock goals query - replace with actual API call when available
  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ['goals'],
    queryFn: async () => {
      // TODO: Replace with actual API call
      return [];
    },
  });

  const createEntryMutation = useMutation({
    mutationFn: async (data: CreateJournalEntryRequest) => {
      return await createEntry(data);
    },
    onSuccess: (entry) => {
      navigate(`/journal/${entry.entryId}`);
    },
  });

  const handleSave = async (editorData: {
    templateId: string;
    sections: { id: string; title: string; markdown: string }[];
    markdownExport: string;
  }) => {
    const content = editorData.markdownExport;
    
    await createEntryMutation.mutateAsync({
      title: title || `${TEMPLATE_PROMPTS[selectedTemplateType].name} - ${new Date().toLocaleDateString()}`,
      content,
      template: selectedTemplateType as JournalTemplate,
      tags,
      mood: mood || undefined,
      linkedGoalIds: linkedGoalIds.length > 0 ? linkedGoalIds : undefined,
      isShared: false,
    });
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  if (templatesLoading || !currentTemplate) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-4xl mx-auto px-4">
          <p>Loading templates...</p>
        </div>
      </div>
    );
  }

  const templateInfo = TEMPLATE_PROMPTS[selectedTemplateType];

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4">
        <button
          onClick={() => navigate('/journal')}
          className="inline-flex items-center text-muted hover:text-theme mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Journal
        </button>
        
        <h1 className="text-3xl font-bold text-theme mb-8">New Journal Entry</h1>

        <div className="bg-surface rounded-lg p-6 mb-6">
          <div className="space-y-6">
            {/* Title Field */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title (Optional)
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your entry a title..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Template Selector */}
            <div>
              <label htmlFor="template" className="block text-sm font-medium text-gray-700 mb-1">
                Template
              </label>
              <select
                id="template"
                value={selectedTemplateType}
                onChange={(e) => setSelectedTemplateType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {Object.entries(TEMPLATE_PROMPTS).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.name} - {value.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Template Prompts */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Writing Prompts:</p>
              <ul className="list-disc list-inside space-y-1">
                {templateInfo.prompts.map((prompt, index) => (
                  <li key={index} className="text-sm text-gray-600">
                    {prompt}
                  </li>
                ))}
              </ul>
            </div>

            {/* Mood Field */}
            <div>
              <label htmlFor="mood" className="block text-sm font-medium text-gray-700 mb-1">
                Mood (Optional)
              </label>
              <input
                type="text"
                id="mood"
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                placeholder="How are you feeling?"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Tags */}
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <input
                type="text"
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="Press Enter to add tags..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="text-xs text-gray-500 mt-1">Add tags to organize your entries</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 text-gray-500 hover:text-gray-700"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Linked Goals */}
            {goals.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Link to Goals:</p>
                <div className="space-y-2">
                  {goals.map((goal) => (
                    <label key={goal.goalId} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={linkedGoalIds.includes(goal.goalId)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setLinkedGoalIds([...linkedGoalIds, goal.goalId]);
                          } else {
                            setLinkedGoalIds(linkedGoalIds.filter(id => id !== goal.goalId));
                          }
                        }}
                        className="h-4 w-4 text-primary-600 rounded focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{goal.title}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {createEntryMutation.isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">Failed to create journal entry. Please try again.</p>
          </div>
        )}

        {/* Journal Editor */}
        <div className="bg-surface rounded-lg p-6">
          <JournalEditorWithSections
            template={currentTemplate}
            onSave={handleSave}
            readOnly={false}
          />
        </div>

        {/* Loading State */}
        {createEntryMutation.isPending && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-surface rounded-lg p-6">
              <p>Creating journal entry...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateJournalPage;