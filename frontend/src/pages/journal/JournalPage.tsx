import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Plus, Search, Calendar, FileText, Edit2, Lock } from 'lucide-react';
import { Button } from '../../components/common';
import { listEntries, getStats } from '../../api/journal';

const JournalPage: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const limit = 12;

  // Fetch journal entries
  const { data: entriesData, isLoading: entriesLoading, error: entriesError } = useQuery({
    queryKey: ['journal', 'entries', page, limit],
    queryFn: () => listEntries({ page, limit }),
  });

  // Fetch journal stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['journal', 'stats'],
    queryFn: getStats,
  });

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleCreateNew = () => {
    navigate('/journal/new');
  };

  const handleEntryClick = (entryId: string) => {
    navigate(`/journal/${entryId}`);
  };

  const renderStats = () => {
    if (statsLoading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-surface rounded-lg p-4 animate-pulse">
              <div className="h-8 bg-gray-300 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      );
    }

    if (!stats) return null;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-surface rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-primary-600">{stats.totalEntries}</p>
          <p className="text-sm text-muted">Total Entries</p>
        </div>
        <div className="bg-surface rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-primary-600">{stats.currentStreak}</p>
          <p className="text-sm text-muted">Current Streak</p>
        </div>
        <div className="bg-surface rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-primary-600">{stats.totalWords.toLocaleString()}</p>
          <p className="text-sm text-muted">Total Words</p>
        </div>
        <div className="bg-surface rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-primary-600">{stats.entriesThisWeek}</p>
          <p className="text-sm text-muted">This Week</p>
        </div>
      </div>
    );
  };

  const renderEntries = () => {
    if (entriesLoading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-surface rounded-lg p-6 animate-pulse">
              <div className="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
              <div className="h-20 bg-gray-300 rounded mb-4"></div>
              <div className="flex gap-2">
                <div className="h-6 bg-gray-300 rounded-full w-16"></div>
                <div className="h-6 bg-gray-300 rounded-full w-16"></div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (entriesError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">Failed to load journal entries. Please try again.</p>
        </div>
      );
    }

    if (!entriesData?.entries.length) {
      return (
        <div className="bg-surface rounded-lg p-8 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No journal entries yet</h3>
          <p className="text-muted mb-4">Start your journaling journey by creating your first entry</p>
          <Button onClick={handleCreateNew} leftIcon={<Plus className="h-4 w-4" />}>
            Create First Entry
          </Button>
        </div>
      );
    }

    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {entriesData.entries.map((entry) => (
            <div
              key={entry.entryId}
              className="bg-surface rounded-lg p-6 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleEntryClick(entry.entryId)}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold truncate flex-1">{entry.title}</h3>
                {entry.isEncrypted && (
                  <div className="flex-shrink-0 ml-2" title="End-to-End Encrypted">
                    <Lock className="h-4 w-4 text-blue-600" />
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted mb-2">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(entry.createdAt), 'MMM d, yyyy')}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted mb-4">
                <FileText className="h-4 w-4" />
                <span>{entry.wordCount} words</span>
              </div>

              <p className="text-muted text-sm mb-4 line-clamp-3">
                {entry.isEncrypted 
                  ? "🔒 This entry is encrypted. Click to view."
                  : entry.content}
              </p>

              {entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {entry.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                      {tag}
                    </span>
                  ))}
                  {entry.tags.length > 3 && (
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                      +{entry.tags.length - 3}
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/journal/${entry.entryId}`);
                  }}
                  className="text-primary-600 hover:text-primary-700"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                {entry.mood && (
                  <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                    {entry.mood}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {entriesData.total > limit && (
          <div className="flex justify-center mt-8">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="px-4 py-2 text-sm">
                Page {page} of {Math.ceil(entriesData.total / limit)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= Math.ceil(entriesData.total / limit)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-theme">My Journal</h1>
            <p className="text-muted mt-1">Track your thoughts, progress, and reflections</p>
          </div>
          <Button onClick={handleCreateNew} leftIcon={<Plus className="h-4 w-4" />} size="lg">
            New Entry
          </Button>
        </div>

        {/* Stats */}
        {renderStats()}

        {/* Search Bar */}
        <div className="bg-surface rounded-lg p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search journal entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        {/* Entries Grid */}
        {renderEntries()}
      </div>
    </div>
  );
};

export default JournalPage;