import React from 'react';
import { X } from 'lucide-react';
import type { SearchFilters } from '../services/JournalStorageService';
import { JournalTemplate } from '../../../types/journal';

interface SearchResultsSummaryProps {
  filters: SearchFilters;
  total: number;
  onClearFilter: (filterType: keyof SearchFilters) => void;
  onClearAll: () => void;
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

export const SearchResultsSummary: React.FC<SearchResultsSummaryProps> = ({
  filters,
  total,
  onClearFilter,
  onClearAll,
}) => {
  const activeFilters: Array<{ type: keyof SearchFilters; label: string; value: string }> = [];

  if (filters.query) {
    activeFilters.push({ type: 'query', label: 'Search', value: filters.query });
  }

  if (filters.tags && filters.tags.length > 0) {
    filters.tags.forEach(tag => {
      activeFilters.push({ type: 'tags', label: 'Tag', value: tag });
    });
  }

  if (filters.template) {
    activeFilters.push({ 
      type: 'template', 
      label: 'Template', 
      value: templateLabels[filters.template] || filters.template 
    });
  }

  if (filters.mood) {
    activeFilters.push({ type: 'mood', label: 'Mood', value: filters.mood });
  }

  if (filters.startDate) {
    activeFilters.push({ 
      type: 'startDate', 
      label: 'From', 
      value: filters.startDate.toLocaleDateString() 
    });
  }

  if (filters.endDate) {
    activeFilters.push({ 
      type: 'endDate', 
      label: 'To', 
      value: filters.endDate.toLocaleDateString() 
    });
  }

  if (filters.isEncrypted !== undefined) {
    activeFilters.push({ 
      type: 'isEncrypted', 
      label: 'Encryption', 
      value: filters.isEncrypted ? 'Encrypted' : 'Unencrypted' 
    });
  }

  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-700">
          Found <span className="font-semibold">{total}</span> {total === 1 ? 'entry' : 'entries'}
        </span>
        <button
          onClick={onClearAll}
          className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
        >
          Clear all
          <X className="h-3 w-3" />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {activeFilters.map((filter, index) => (
          <span
            key={`${filter.type}-${index}`}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-white border border-gray-200 rounded-full"
          >
            <span className="text-gray-500">{filter.label}:</span>
            <span className="font-medium">{filter.value}</span>
            <button
              onClick={() => {
                if (filter.type === 'tags' && filters.tags) {
                  // Special handling for tags array
                  const newTags = filters.tags.filter(t => t !== filter.value);
                  onClearFilter(newTags.length > 0 ? 'tags' : 'tags');
                } else {
                  onClearFilter(filter.type);
                }
              }}
              className="ml-1 text-gray-400 hover:text-gray-600"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
};