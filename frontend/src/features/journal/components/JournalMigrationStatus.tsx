// JournalMigrationStatus.tsx
import React from 'react';
import { 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/common';
import { useJournalMigration, JournalContentMigrationService } from '../services/journal-content-migration';
import { useJournalEntries } from '../hooks';
import { updateEntry as updateJournalEntry } from '@/api/journal';

export const JournalMigrationStatus: React.FC = () => {
  const { migrateEntries, isRunning, progress, result, reset } = useJournalMigration();
  const { data: entriesData, refetch } = useJournalEntries();
  const [showDetails, setShowDetails] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  
  const entries = entriesData?.entries || [];
  const needsMigration = entries.filter(entry => 
    JournalContentMigrationService.needsMigration(entry)
  );
  
  const handleMigrate = async () => {
    if (needsMigration.length === 0) return;
    
    const migrationResult = await migrateEntries(needsMigration);
    
    // Auto-save migrated entries
    if (migrationResult.migrated.length > 0) {
      setIsSaving(true);
      try {
        // Save all migrated entries
        await Promise.all(
          migrationResult.migrated.map(entry =>
            updateJournalEntry(entry.entryId, {
              content: entry.content
            })
          )
        );
        
        // Refresh the entries list
        await refetch();
      } catch (error) {
        console.error('Failed to save migrated entries:', error);
      } finally {
        setIsSaving(false);
      }
    }
  };
  
  const getStatusIcon = () => {
    if (isRunning || isSaving) return <RefreshCw className="w-5 h-5 animate-spin" />;
    if (result?.errors.length) return <AlertTriangle className="w-5 h-5 text-warning" />;
    if (needsMigration.length === 0) return <CheckCircle2 className="w-5 h-5 text-success" />;
    return <AlertCircle className="w-5 h-5 text-info" />;
  };
  
  const getStatusMessage = () => {
    if (isRunning) return `Migrating entries... (${progress.current}/${progress.total})`;
    if (isSaving) return 'Saving migrated entries...';
    if (result) {
      if (result.errors.length > 0) {
        return `Migration completed with ${result.errors.length} errors`;
      }
      return `Successfully migrated ${result.migrated.length} entries`;
    }
    if (needsMigration.length === 0) return 'All entries are up to date';
    return `${needsMigration.length} entries need migration`;
  };
  
  // Don't show if no entries or all entries are already migrated (unless we have results)
  if (entries.length === 0 || (needsMigration.length === 0 && !result)) {
    return null;
  }
  
  return (
    <div className="glass rounded-xl p-4 mb-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          {getStatusIcon()}
          <div className="flex-1">
            <h3 className="font-medium mb-1">Journal Format Update</h3>
            <p className="text-sm text-muted">{getStatusMessage()}</p>
            
            {needsMigration.length > 0 && !isRunning && !result && (
              <p className="text-xs text-muted mt-1">
                Updates journal entries to support enhanced template features
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {result && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Hide' : 'Show'} Details
            </Button>
          )}
          
          {needsMigration.length > 0 && !isRunning && !isSaving && (
            <Button
              size="sm"
              onClick={handleMigrate}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Update Entries
            </Button>
          )}
          
          {result && result.migrated.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={reset}
            >
              Dismiss
            </Button>
          )}
        </div>
      </div>
      
      {/* Progress Bar */}
      {(isRunning || isSaving) && progress.total > 0 && (
        <div className="mt-3">
          <div className="w-full bg-surface-muted rounded-full h-2 overflow-hidden">
            <div 
              className="bg-accent h-full transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}
      
      {/* Details */}
      {showDetails && result && (
        <div className="mt-4 pt-4 border-t border-surface-muted">
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted">Total processed:</span>
              <span className="font-medium">
                {result.migrated.length + result.skipped.length + result.errors.length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Successfully migrated:</span>
              <span className="font-medium text-success">{result.migrated.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Already up to date:</span>
              <span className="font-medium">{result.skipped.length}</span>
            </div>
            {result.errors.length > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted">Errors:</span>
                <span className="font-medium text-error">{result.errors.length}</span>
              </div>
            )}
          </div>
          
          {/* Error Details */}
          {result.errors.length > 0 && (
            <div className="mt-3 p-3 bg-error/10 rounded-lg">
              <h4 className="text-sm font-medium text-error mb-2">Migration Errors</h4>
              <div className="space-y-1">
                {result.errors.map(({ entry, error }, index) => (
                  <div key={index} className="text-xs text-muted">
                    <FileText className="w-3 h-3 inline mr-1" />
                    {entry.title}: {error.message}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Success Message */}
          {result.migrated.length > 0 && result.errors.length === 0 && (
            <div className="mt-3 p-3 bg-success/10 rounded-lg">
              <p className="text-sm text-success flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                All entries successfully updated!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Usage in your journal page:
// import { JournalMigrationStatus } from './JournalMigrationStatus';
//
// function JournalPage() {
//   return (
//     <div>
//       <JournalMigrationStatus />
//       {/* Rest of your journal UI */}
//     </div>
//   );
// }