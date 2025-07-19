// JournalPageWithSync.tsx - Example integration
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/common";
import {
  JournalSearchBar,
  JournalCard,
  SearchResultsSummary,
} from "../components";
import { useJournalSearch, useJournalSync } from "../hooks";
import type { SearchFilters } from "../services/JournalStorageService";
import type { JournalEntry } from "../../../types/journal";

export const JournalPageWithSync: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = React.useState<SearchFilters>({});

  // Initialize journal sync - this will sync entries and maintain the cache
  const {
    isLoading: isSyncing,
    forceSync,
    lastSync,
  } = useJournalSync({
    enabled: true,
    syncInterval: 5 * 60 * 1000, // 5 minutes
  });

  // Use local search with the synced data
  const {
    entries,
    total,
    availableTags,
    availableMoods,
    availableTemplates,
    setFilters: updateFilters,
  } = useJournalSearch();

  // Update search filters
  useEffect(() => {
    updateFilters(filters);
  }, [filters, updateFilters]);

  // Force sync on mount
  useEffect(() => {
    forceSync();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreateNew = () => {
    navigate("/journal/new");
  };

  const handleRefresh = async () => {
    await forceSync();
  };

  // Show loading state only on initial load
  if (isSyncing && !entries) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
          <p className="text-muted mt-4">Syncing journal entries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-theme">My Journal</h1>
            {lastSync && (
              <p className="text-sm text-muted mt-1">
                Last synced: {lastSync.toLocaleTimeString()}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={handleRefresh}
              disabled={isSyncing}
              title="Sync with server"
            >
              <RefreshCw
                className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`}
              />
            </Button>
            <Button onClick={handleCreateNew}>
              <Plus className="w-4 h-4 mr-2" />
              New Entry
            </Button>
          </div>
        </div>

        {/* Search Bar with Settings */}
        <JournalSearchBar
          filters={filters}
          onFiltersChange={setFilters}
          availableTags={availableTags || []}
          availableMoods={availableMoods || []}
          availableTemplates={availableTemplates || []}
        />

        {/* Search Results Summary */}
        {(filters.query || Object.keys(filters).length > 1) && (
          <SearchResultsSummary
            total={total}
            filters={filters}
            onClearFilter={(key) => {
              const newFilters = { ...filters };
              delete newFilters[key as keyof SearchFilters];
              setFilters(newFilters);
            }}
            onClearAll={() => setFilters({})}
          />
        )}

        {/* Results */}
        {entries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted mb-4">
              {filters.query || Object.keys(filters).length > 1
                ? "No entries match your search criteria"
                : "No journal entries yet"}
            </p>
            {!filters.query && Object.keys(filters).length <= 1 && (
              <Button onClick={handleCreateNew}>Create Your First Entry</Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {entries.map((entry: JournalEntry) => (
              <JournalCard
                key={entry.entryId}
                entry={entry}
                onClick={() => navigate(`/journal/${entry.entryId}`)}
              />
            ))}
          </div>
        )}

        {/* Floating Action Button on Mobile */}
        <div className="md:hidden fixed bottom-6 right-6">
          <button
            onClick={handleCreateNew}
            className="w-14 h-14 bg-accent text-white rounded-full shadow-lg flex items-center justify-center hover:bg-accent-dark transition-colors"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default JournalPageWithSync;
