// SharedJournalsPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Share2,
  Users,
  Clock,
  Lock,
  Calendar,
  Filter,
  ChevronDown
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/common';
import { useJournalEntries } from '../hooks';
import JournalCard from '../components/JournalCard';
import ShareDialog from '@/components/encryption/ShareDialog';
import type { JournalEntry, SharedJournalItem } from '@/types/journal';

type FilterType = 'all' | 'shared-with-me' | 'shared-by-me';

export const SharedJournalsPage: React.FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterType>('all');
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Fetch shared journals
  const { data, isLoading, error } = useJournalEntries({
    filter: filter,
    limit: 50
  });

  // Filter entries based on current filter
  const filteredEntries = React.useMemo(() => {
    if (!data?.entries) return [];
    
    // Separate shared entries from owned entries
    const entries = data.entries.filter(item => {
      if (filter === 'all') {
        // For 'all', show only items that are actually shared
        if ('shareInfo' in item) {
          return true;
        }
        const entry = item as JournalEntry;
        return entry.sharedWith && entry.sharedWith.length > 0;
      }
      
      if (filter === 'shared-with-me') {
        return 'shareInfo' in item && (item as SharedJournalItem).isIncoming;
      }
      
      if (filter === 'shared-by-me') {
        if ('shareInfo' in item) {
          return !(item as SharedJournalItem).isIncoming;
        }
        const entry = item as JournalEntry;
        return entry.sharedWith && entry.sharedWith.length > 0;
      }
      
      return false;
    });
    
    return entries;
  }, [data, filter]);

  const handleShare = (tokens: Array<{ id: string; recipientEmail: string; permissions: string[]; expiresAt: string }>) => {
    console.log('Created shares:', tokens);
    setShowShareDialog(false);
    setSelectedEntry(null);
    // Refresh the list
    window.location.reload();
  };

  const renderSharedJournalCard = (item: JournalEntry | SharedJournalItem) => {
    const entry = 'entry' in item ? item.entry : item;
    const shareInfo = 'shareInfo' in item ? item.shareInfo : null;
    const isIncoming = 'isIncoming' in item ? item.isIncoming : false;
    
    return (
      <div key={entry.entryId} className="relative">
        {/* Share indicator badge */}
        <div className="absolute -top-2 -right-2 z-10">
          <div className={`
            px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1
            ${isIncoming 
              ? 'bg-info/20 text-info border border-info/30' 
              : 'bg-success/20 text-success border border-success/30'
            }
          `}>
            {isIncoming ? (
              <>
                <Users className="w-3 h-3" />
                Shared with me
              </>
            ) : (
              <>
                <Share2 className="w-3 h-3" />
                Shared by me
              </>
            )}
          </div>
        </div>
        
        <JournalCard
          entry={entry}
          onClick={() => navigate(`/journal/${entry.entryId}`)}
          onShare={!isIncoming ? () => {
            setSelectedEntry(entry);
            setShowShareDialog(true);
          } : undefined}
        />
        
        {/* Share metadata */}
        {shareInfo && (
          <div className="mt-3 px-4 py-3 bg-surface/50 rounded-lg text-sm">
            <div className="flex items-center justify-between text-muted">
              <span className="flex items-center gap-2">
                <Calendar className="w-3 h-3" />
                Shared {format(new Date(shareInfo.sharedAt), 'MMM d, yyyy')}
              </span>
              {shareInfo.expiresAt && (
                <span className="flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  Expires {format(new Date(shareInfo.expiresAt), 'MMM d')}
                </span>
              )}
            </div>
            <div className="mt-1 text-xs">
              {isIncoming 
                ? `Shared by ${shareInfo.sharedBy || 'Unknown'}`
                : `Shared with ${shareInfo.sharedWith || 'Unknown'}`
              }
            </div>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
          <p className="text-muted mt-4">Loading shared journals...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          <div className="text-center py-12">
            <p className="text-error mb-4">Failed to load shared journals</p>
            <Button onClick={() => navigate('/journal')}>
              Back to Journals
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/journal')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            <div>
              <h1 className="text-3xl font-bold text-theme">Shared Journals</h1>
              <p className="text-muted">Journals you've shared or received</p>
            </div>
          </div>
          
          {/* Filter Dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="min-w-[200px] justify-between"
            >
              <span className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                {filter === 'all' && 'All Shared'}
                {filter === 'shared-with-me' && 'Shared with Me'}
                {filter === 'shared-by-me' && 'Shared by Me'}
              </span>
              <ChevronDown className="w-4 h-4" />
            </Button>
            
            {showFilterDropdown && (
              <div className="absolute right-0 mt-2 w-full bg-surface rounded-lg shadow-lg border border-surface-muted z-20">
                <button
                  onClick={() => {
                    setFilter('all');
                    setShowFilterDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-surface-muted transition-colors ${
                    filter === 'all' ? 'text-accent font-medium' : ''
                  }`}
                >
                  All Shared
                </button>
                <button
                  onClick={() => {
                    setFilter('shared-with-me');
                    setShowFilterDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-surface-muted transition-colors ${
                    filter === 'shared-with-me' ? 'text-accent font-medium' : ''
                  }`}
                >
                  Shared with Me
                </button>
                <button
                  onClick={() => {
                    setFilter('shared-by-me');
                    setShowFilterDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-surface-muted transition-colors ${
                    filter === 'shared-by-me' ? 'text-accent font-medium' : ''
                  }`}
                >
                  Shared by Me
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10 text-accent">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-theme">{filteredEntries.length}</p>
                <p className="text-xs text-muted">Total Shared</p>
              </div>
            </div>
          </div>
          
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-info/10 text-info">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-theme">
                  {filteredEntries.filter(item => 
                    'isIncoming' in item && (item as SharedJournalItem).isIncoming
                  ).length}
                </p>
                <p className="text-xs text-muted">Shared with Me</p>
              </div>
            </div>
          </div>
          
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10 text-success">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-theme">
                  {filteredEntries.filter(item => {
                    if ('isIncoming' in item) {
                      return !(item as SharedJournalItem).isIncoming;
                    }
                    const entry = item as JournalEntry;
                    return entry.sharedWith && entry.sharedWith.length > 0;
                  }).length}
                </p>
                <p className="text-xs text-muted">Shared by Me</p>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        {filteredEntries.length === 0 ? (
          <div className="text-center py-12">
            <Share2 className="w-16 h-16 text-muted mx-auto mb-4" />
            <p className="text-muted mb-4">
              {filter === 'shared-with-me' 
                ? "No journals have been shared with you yet"
                : filter === 'shared-by-me'
                ? "You haven't shared any journals yet"
                : "No shared journals yet"
              }
            </p>
            <Button onClick={() => navigate('/journal')}>
              Go to Journal
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEntries.map(renderSharedJournalCard)}
          </div>
        )}
        
        {/* Share Dialog */}
        {showShareDialog && selectedEntry && (
          <ShareDialog
            isOpen={showShareDialog}
            onClose={() => {
              setShowShareDialog(false);
              setSelectedEntry(null);
            }}
            items={[{
              id: selectedEntry.entryId,
              title: selectedEntry.title,
              type: 'journal',
              createdAt: selectedEntry.createdAt,
              encrypted: selectedEntry.isEncrypted,
            }]}
            onShare={handleShare}
          />
        )}
      </div>
    </div>
  );
};

export default SharedJournalsPage;