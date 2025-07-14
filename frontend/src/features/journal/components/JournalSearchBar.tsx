import React, { useState } from 'react';
import { Search, Filter, X, Calendar, Tag, FileText, Heart, Settings } from 'lucide-react';
import { format } from 'date-fns';
import type { SearchFilters } from '../services/JournalStorageService';
import { JournalTemplate } from '../../../types/journal';
import { JournalSearchSettings } from './JournalSearchSettings';

interface JournalSearchBarProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  availableTags: string[];
  availableMoods: string[];
  availableTemplates: string[];
}

const templateLabels: Record<string, string> = {
  [JournalTemplate.DAILY_REFLECTION]: 'Daily Reflection',
  [JournalTemplate.GRATITUDE]: 'Gratitude',
  [JournalTemplate.GOAL_PROGRESS]: 'Goal Progress',
  [JournalTemplate.MOOD_TRACKER]: 'Mood Tracker',
  [JournalTemplate.HABIT_TRACKER]: 'Habit Tracker',
  [JournalTemplate.CREATIVE_WRITING]: 'Creative Writing',
  [JournalTemplate.BLANK]: 'Blank',
};

export const JournalSearchBar: React.FC<JournalSearchBarProps> = ({
  filters,
  onFiltersChange,
  availableTags,
  availableMoods,
  availableTemplates,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>(filters.tags || []);

  const handleSearchChange = (query: string) => {
    onFiltersChange({ ...filters, query });
  };

  const handleTagToggle = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    
    setSelectedTags(newTags);
    onFiltersChange({ ...filters, tags: newTags.length > 0 ? newTags : undefined });
  };

  const handleTemplateChange = (template: string) => {
    onFiltersChange({ 
      ...filters, 
      template: template === 'all' ? undefined : template 
    });
  };

  const handleMoodChange = (mood: string) => {
    onFiltersChange({ 
      ...filters, 
      mood: mood === 'all' ? undefined : mood 
    });
  };

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    const date = value ? new Date(value) : undefined;
    onFiltersChange({ ...filters, [field]: date });
  };

  const handleEncryptionToggle = (value: string) => {
    const isEncrypted = value === 'all' ? undefined : value === 'encrypted';
    onFiltersChange({ ...filters, isEncrypted });
  };

  const clearFilters = () => {
    setSelectedTags([]);
    onFiltersChange({});
    setShowAdvanced(false);
  };

  const hasActiveFilters = 
    filters.query ||
    (filters.tags && filters.tags.length > 0) ||
    filters.template ||
    filters.mood ||
    filters.startDate ||
    filters.endDate ||
    filters.isEncrypted !== undefined;

  return (
    <>
      <div className="bg-surface rounded-lg p-4 mb-6">
        {/* Main Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search journal entries..."
            value={filters.query || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-28 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="p-1 text-gray-500 hover:text-gray-700"
                title="Clear all filters"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`p-1 ${showAdvanced ? 'text-primary-600' : 'text-gray-500'} hover:text-primary-700`}
              title="Advanced filters"
            >
              <Filter className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-1 text-gray-500 hover:text-primary-700"
              title="Search settings"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="mt-4 space-y-4 border-t pt-4">
            {/* Tags */}
            {availableTags.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Tags</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => handleTagToggle(tag)}
                      className={`px-3 py-1 text-sm rounded-full transition-colors ${
                        selectedTags.includes(tag)
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Template and Mood */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Template Filter */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Template</span>
                </div>
                <select
                  value={filters.template || 'all'}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="all">All Templates</option>
                  {availableTemplates.map(template => (
                    <option key={template} value={template}>
                      {templateLabels[template] || template}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mood Filter */}
              {availableMoods.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Mood</span>
                  </div>
                  <select
                    value={filters.mood || 'all'}
                    onChange={(e) => handleMoodChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Moods</option>
                    {availableMoods.map(mood => (
                      <option key={mood} value={mood}>
                        {mood}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Date Range and Encryption */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Start Date */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">From</span>
                </div>
                <input
                  type="date"
                  value={filters.startDate ? format(filters.startDate, 'yyyy-MM-dd') : ''}
                  onChange={(e) => handleDateChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* End Date */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">To</span>
                </div>
                <input
                  type="date"
                  value={filters.endDate ? format(filters.endDate, 'yyyy-MM-dd') : ''}
                  onChange={(e) => handleDateChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Encryption Status */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-gray-700">Encryption</span>
                </div>
                <select
                  value={filters.isEncrypted === undefined ? 'all' : filters.isEncrypted ? 'encrypted' : 'unencrypted'}
                  onChange={(e) => handleEncryptionToggle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="all">All Entries</option>
                  <option value="encrypted">Encrypted Only</option>
                  <option value="unencrypted">Unencrypted Only</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <JournalSearchSettings onClose={() => setShowSettings(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};