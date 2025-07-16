// JournalSearchSettings.tsx
import React, { useState, useEffect } from "react";
import {
  Settings,
  Shield,
  Search,
  RefreshCw,
  Trash2,
  Info,
  Check,
  AlertCircle,
} from "lucide-react";
import { journalStorage } from "../services/JournalStorageService";
import { Button } from "@/components/common";
import type { JournalSettings } from "../services/JournalStorageService";

interface JournalSearchSettingsProps {
  onClose?: () => void;
}

export const JournalSearchSettings: React.FC<JournalSearchSettingsProps> = ({
  onClose,
}) => {
  const [settings, setSettings] = useState<JournalSettings>({
    cacheDecryptedContent: false,
  });
  const [cacheStats, setCacheStats] = useState<{
    totalEntries: number;
    encryptedEntries: number;
    cachedEntries: number;
    cacheEnabled: boolean;
    lastCacheUpdate?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRebuilding, setIsRebuilding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSettingsAndStats();
  }, []);

  const loadSettingsAndStats = async () => {
    try {
      setIsLoading(true);
      const [currentSettings, stats] = await Promise.all([
        journalStorage.getSettings(),
        journalStorage.getCacheStats(),
      ]);
      setSettings(currentSettings);
      setCacheStats(stats);
    } catch (err) {
      console.error("Failed to load settings:", err);
      setError("Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleCache = async () => {
    try {
      setError(null);
      const newValue = !settings.cacheDecryptedContent;

      await journalStorage.updateSettings({ cacheDecryptedContent: newValue });
      setSettings({ ...settings, cacheDecryptedContent: newValue });

      // If enabling, offer to rebuild cache
      if (
        newValue &&
        cacheStats?.encryptedEntries &&
        cacheStats.encryptedEntries > 0
      ) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }

      // Reload stats
      const stats = await journalStorage.getCacheStats();
      setCacheStats(stats);
    } catch (err) {
      console.error("Failed to update settings:", err);
      setError("Failed to update settings");
    }
  };

  const handleRebuildCache = async () => {
    try {
      setIsRebuilding(true);
      setError(null);
      await journalStorage.rebuildDecryptedCache();

      // Reload stats
      const stats = await journalStorage.getCacheStats();
      setCacheStats(stats);

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to rebuild cache:", err);
      setError(
        "Failed to rebuild cache. Make sure you have your encryption keys set up.",
      );
    } finally {
      setIsRebuilding(false);
    }
  };

  const handleClearCache = async () => {
    if (
      !confirm(
        "Are you sure you want to clear all cached decrypted content? This will not affect your encrypted entries.",
      )
    ) {
      return;
    }

    try {
      setError(null);
      await journalStorage.clearDecryptedCache();

      // Reload stats
      const stats = await journalStorage.getCacheStats();
      setCacheStats(stats);

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to clear cache:", err);
      setError("Failed to clear cache");
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="journal-search-settings">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-6 h-6 text-accent" />
        <h2 className="text-xl font-semibold">Journal Search Settings</h2>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      {showSuccess && (
        <div className="mb-4 p-3 bg-success/10 border border-success/20 rounded-lg flex items-center gap-2">
          <Check className="w-5 h-5 text-success" />
          <p className="text-sm text-success">
            Operation completed successfully!
          </p>
        </div>
      )}

      {/* Cache Setting */}
      <div className="space-y-4">
        <div className="p-4 bg-surface-muted rounded-lg">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="font-medium flex items-center gap-2">
                <Search className="w-4 h-4" />
                Enable Encrypted Content Search
              </h3>
              <p className="text-sm text-muted mt-1">
                Cache decrypted journal content locally to enable full-text
                search on encrypted entries.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4">
              <input
                type="checkbox"
                checked={settings.cacheDecryptedContent}
                onChange={handleToggleCache}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-surface-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
            </label>
          </div>

          <div className="flex items-start gap-2 p-3 bg-info/10 border border-info/20 rounded">
            <Info className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
            <div className="text-xs text-muted">
              <p className="mb-1">
                <strong>Privacy Note:</strong> Cached content is stored locally
                in your browser's IndexedDB and never leaves your device.
              </p>
              <p>
                The cache is encrypted at rest by your browser and cleared when
                you clear browser data.
              </p>
            </div>
          </div>
        </div>

        {/* Cache Statistics */}
        {cacheStats && (
          <div className="p-4 bg-surface-muted rounded-lg">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Cache Statistics
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Total Entries:</span>
                <span className="font-medium">{cacheStats.totalEntries}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Encrypted Entries:</span>
                <span className="font-medium">
                  {cacheStats.encryptedEntries}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Cached for Search:</span>
                <span className="font-medium text-success">
                  {cacheStats.cachedEntries} / {cacheStats.encryptedEntries}
                </span>
              </div>
              {cacheStats.lastCacheUpdate && (
                <div className="flex justify-between">
                  <span className="text-muted">Last Updated:</span>
                  <span className="font-medium">
                    {new Date(cacheStats.lastCacheUpdate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cache Actions */}
        {settings.cacheDecryptedContent && cacheStats && (
          <div className="flex flex-col gap-2">
            {cacheStats.encryptedEntries > cacheStats.cachedEntries && (
              <Button
                variant="secondary"
                onClick={handleRebuildCache}
                disabled={isRebuilding}
                className="w-full"
              >
                {isRebuilding ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Rebuilding Cache...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Rebuild Cache (
                    {cacheStats.encryptedEntries -
                      cacheStats.cachedEntries}{" "}
                    missing)
                  </>
                )}
              </Button>
            )}

            {cacheStats.cachedEntries > 0 && (
              <Button
                variant="ghost"
                onClick={handleClearCache}
                className="w-full text-error hover:bg-error/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Cache
              </Button>
            )}
          </div>
        )}
      </div>

      {onClose && (
        <div className="mt-6 pt-4 border-t">
          <Button variant="primary" onClick={onClose} className="w-full">
            Done
          </Button>
        </div>
      )}
    </div>
  );
};

export default JournalSearchSettings;
