// JournalPageEnhanced.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Plus,
  FileText,
  Edit3,
  Sparkles,
  Clock,
  TrendingUp
} from 'lucide-react';
import { JournalTemplate } from '@/types/journal';
import { Button } from '@/components/common';
import { createEntry } from '@/api/journal';
import { journalStorage } from '../services/JournalStorageService';
import { useJournalSearch } from '../hooks/useJournalSearch';
import { EnhancedJournalEditor } from '../components/EnhancedEditor';
import { EnhancedTemplatePicker } from '../components/EnhancedTemplatePicker';
import { DraftManager } from '../components/DraftManager';
import JournalSearchBar from '../components/JournalSearchBar';
import JournalCard from '../components/JournalCard';
import SearchResultsSummary from '../components/SearchResultsSummary';

type ViewMode = 'list' | 'create' | 'drafts';

export const JournalPageEnhanced: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedTemplate, setSelectedTemplate] = useState<JournalTemplate | null>(null);

  // Search functionality
  const {
    entries,
    total,
    isLoading,
    error,
    filters,
    setFilters,
    availableTags,
    availableMoods,
    availableTemplates,
    page,
    setPage,
    hasMore
  } = useJournalSearch({ limit: 12 });

  // Stats query
  const { data: stats } = useQuery({
    queryKey: ['journal', 'stats'],
    queryFn: async () => {
      // This would fetch from your API
      return {
        totalEntries: total,
        totalWords: 0,
        currentStreak: 3,
        longestStreak: 15,
        goalsTracked: 5,
        goalsCompleted: 2,
        entriesThisWeek: 7,
        entriesThisMonth: 23,
        averageWordsPerEntry: 350
      };
    }
  });

  // Create entry mutation
  const createMutation = useMutation({
    mutationFn: createEntry,
    onSuccess: async (data) => {
      // Save to IndexedDB for search
      await journalStorage.saveEntry(data);
      
      // Reset view and show success
      setViewMode('list');
      setSelectedTemplate(null);
      
      // Refresh the search results
      window.location.reload(); // In production, you'd invalidate the query
    }
  });

  // Handle template selection
  const handleTemplateSelect = (templateId: JournalTemplate) => {
    setSelectedTemplate(templateId);
    setViewMode('create');
  };

  // Handle draft selection
  const handleDraftSelect = (draftKey: string) => {
    setSelectedDraftKey(draftKey);
    setViewMode('create');
    
    // Load draft data
    const draftData = localStorage.getItem(draftKey);
    if (draftData) {
      const draft = JSON.parse(draftData);
      setSelectedTemplate(draft.template);
    }
  };

  // Clean up old drafts on mount
  useEffect(() => {
    const cleanupDrafts = () => {
      const draftsList = JSON.parse(localStorage.getItem('journal-drafts-list') || '[]');
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const filtered = draftsList.filter((d: {key: string; lastSaved: string}) => {
        const lastSaved = new Date(d.lastSaved);
        if (lastSaved < thirtyDaysAgo) {
          localStorage.removeItem(d.key);
          return false;
        }
        return true;
      });
      
      localStorage.setItem('journal-drafts-list', JSON.stringify(filtered));
    };
    
    cleanupDrafts();
  }, []);

  // Render based on view mode
  if (viewMode === 'create' && selectedTemplate) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          <EnhancedJournalEditor
            templateId={selectedTemplate}
            onSave={createMutation.mutate}
            onCancel={() => {
              setViewMode('list');
              setSelectedTemplate(null);
              setSelectedDraftKey(null);
            }}
            autoSave={true}
            showEncryption={true}
          />
        </div>
      </div>
    );
  }

  if (viewMode === 'create' && !selectedTemplate) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          <EnhancedTemplatePicker
            onSelect={handleTemplateSelect}
            onCancel={() => setViewMode('list')}
          />
        </div>
      </div>
    );
  }

  if (viewMode === 'drafts') {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => setViewMode('list')}
              className="mb-4"
            >
              ← Back to Journals
            </Button>
            <h1 className="text-3xl font-bold text-theme">Your Drafts</h1>
          </div>
          
          <DraftManager
            onSelectDraft={handleDraftSelect}
          />
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-theme mb-2">My Journal</h1>
            <p className="text-muted">Document your journey, track your progress</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Button
              variant="ghost"
              onClick={() => setViewMode('drafts')}
              className="hover-lift"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Drafts
            </Button>
            <Button
              onClick={() => setViewMode('create')}
              className="bg-gradient hover-lift"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Entry
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="glass rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10 text-accent">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-theme">{stats.totalEntries}</p>
                  <p className="text-xs text-muted">Total Entries</p>
                </div>
              </div>
            </div>
            
            <div className="glass rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10 text-success">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-theme">{stats.currentStreak}</p>
                  <p className="text-xs text-muted">Day Streak</p>
                </div>
              </div>
            </div>
            
            <div className="glass rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10 text-warning">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-theme">{stats.entriesThisWeek}</p>
                  <p className="text-xs text-muted">This Week</p>
                </div>
              </div>
            </div>
            
            <div className="glass rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-theme">{stats.averageWordsPerEntry}</p>
                  <p className="text-xs text-muted">Avg Words</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-6">
          <JournalSearchBar
            filters={filters}
            onFiltersChange={setFilters}
            availableTags={availableTags}
            availableMoods={availableMoods}
            availableTemplates={availableTemplates}
          />
        </div>

        {/* Search Results Summary */}
        {(filters.query || filters.tags?.length || filters.mood || filters.template || filters.startDate || filters.endDate) && (
          <SearchResultsSummary
            filters={filters}
            total={total}
            onClearFilter={(filterType) => {
              if (filterType === 'all') {
                setFilters({});
              } else {
                setFilters({ ...filters, [filterType]: undefined });
              }
            }}
          />
        )}

        {/* Results */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
            <p className="text-muted mt-4">Loading entries...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-error">Failed to load entries</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-muted mx-auto mb-4" />
            <p className="text-muted mb-4">
              {filters.query || Object.keys(filters).length > 0
                ? 'No entries match your search'
                : 'No journal entries yet'}
            </p>
            <Button onClick={() => setViewMode('create')}>
              Create Your First Entry
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {entries.map(entry => (
                <JournalCard
                  key={entry.entryId}
                  entry={entry}
                  onClick={() => navigate(`/journal/${entry.entryId}`)}
                />
              ))}
            </div>

            {/* Pagination */}
            {hasMore && (
              <div className="text-center mt-8">
                <Button
                  variant="outline"
                  onClick={() => setPage(page + 1)}
                  disabled={isLoading}
                >
                  Load More
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default JournalPageEnhanced;