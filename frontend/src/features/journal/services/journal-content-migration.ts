// journal-content-migration.ts
import { useState, useCallback } from "react";
import type { JournalEntry } from "@/types/journal";
import { enhancedTemplates } from "../templates/enhanced-templates";
import {
  hasEnhancedSectionMarkers,
  migrateToEnhancedFormat,
} from "../templates/enhanced-template-content-utils";

/**
 * Service to migrate journal entries to the enhanced content format
 */
export class JournalContentMigrationService {
  /**
   * Check if a journal entry needs migration
   */
  static needsMigration(entry: JournalEntry): boolean {
    // Skip encrypted entries - they need to be decrypted first
    if (entry.isEncrypted) {
      return false;
    }

    // Check if content already has enhanced section markers
    return !hasEnhancedSectionMarkers(entry.content);
  }

  /**
   * Migrate a single journal entry to enhanced format
   */
  static migrateEntry(entry: JournalEntry): JournalEntry {
    // Skip if doesn't need migration
    if (!this.needsMigration(entry)) {
      return entry;
    }

    // Get the template
    const template = enhancedTemplates[entry.template];
    if (!template) {
      console.warn(
        `Template not found for entry ${entry.entryId}: ${entry.template}`,
      );
      return entry;
    }

    // Migrate the content
    const enhancedContent = migrateToEnhancedFormat(template, entry.content);

    return {
      ...entry,
      content: enhancedContent,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Migrate multiple journal entries
   */
  static async migrateEntries(
    entries: JournalEntry[],
    onProgress?: (current: number, total: number) => void,
  ): Promise<{
    migrated: JournalEntry[];
    skipped: JournalEntry[];
    errors: Array<{ entry: JournalEntry; error: Error }>;
  }> {
    const migrated: JournalEntry[] = [];
    const skipped: JournalEntry[] = [];
    const errors: Array<{ entry: JournalEntry; error: Error }> = [];

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];

      try {
        if (!this.needsMigration(entry)) {
          skipped.push(entry);
        } else {
          const migratedEntry = this.migrateEntry(entry);
          migrated.push(migratedEntry);
        }
      } catch (error) {
        errors.push({
          entry,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }

      // Report progress
      if (onProgress) {
        onProgress(i + 1, entries.length);
      }
    }

    return { migrated, skipped, errors };
  }

  /**
   * Generate a migration report
   */
  static generateReport(
    result: Awaited<
      ReturnType<typeof JournalContentMigrationService.migrateEntries>
    >,
  ): string {
    const { migrated, skipped, errors } = result;
    const total = migrated.length + skipped.length + errors.length;

    let report = `Journal Content Migration Report\n`;
    report += `================================\n\n`;
    report += `Total entries processed: ${total}\n`;
    report += `Successfully migrated: ${migrated.length}\n`;
    report += `Skipped (already migrated or encrypted): ${skipped.length}\n`;
    report += `Errors: ${errors.length}\n\n`;

    if (errors.length > 0) {
      report += `Error Details:\n`;
      report += `--------------\n`;
      errors.forEach(({ entry, error }) => {
        report += `Entry ${entry.entryId} (${entry.title}): ${error.message}\n`;
      });
    }

    return report;
  }
}

/**
 * React hook for migrating journal entries
 */
export function useJournalMigration() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [result, setResult] = useState<Awaited<
    ReturnType<typeof JournalContentMigrationService.migrateEntries>
  > | null>(null);

  const migrateEntries = useCallback(async (entries: JournalEntry[]) => {
    setIsRunning(true);
    setProgress({ current: 0, total: entries.length });

    try {
      const migrationResult =
        await JournalContentMigrationService.migrateEntries(
          entries,
          (current, total) => setProgress({ current, total }),
        );

      setResult(migrationResult);
      return migrationResult;
    } finally {
      setIsRunning(false);
    }
  }, []);

  const reset = useCallback(() => {
    setProgress({ current: 0, total: 0 });
    setResult(null);
  }, []);

  return {
    migrateEntries,
    isRunning,
    progress,
    result,
    reset,
  };
}

// Example usage in a component:
/*
import { useJournalMigration } from './journal-content-migration';

function JournalMigrationTool() {
  const { migrateEntries, isRunning, progress, result } = useJournalMigration();
  const { data: entries } = useJournalEntries(); // Your journal entries hook
  
  const handleMigrate = async () => {
    if (entries) {
      const result = await migrateEntries(entries);
      
      // Save migrated entries back to the database
      for (const entry of result.migrated) {
        await updateJournalEntry(entry.entryId, entry);
      }
      
      // Show report
      console.log(JournalContentMigrationService.generateReport(result));
    }
  };
  
  return (
    <div>
      <button onClick={handleMigrate} disabled={isRunning}>
        {isRunning 
          ? `Migrating... (${progress.current}/${progress.total})` 
          : 'Migrate Journal Entries'}
      </button>
      
      {result && (
        <div>
          <p>Migration complete!</p>
          <p>Migrated: {result.migrated.length}</p>
          <p>Skipped: {result.skipped.length}</p>
          <p>Errors: {result.errors.length}</p>
        </div>
      )}
    </div>
  );
}
*/
