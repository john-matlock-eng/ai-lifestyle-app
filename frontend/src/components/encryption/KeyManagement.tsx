import React, { useState } from "react";
import { Download, Upload, Key, AlertCircle, CheckCircle } from "lucide-react";

interface KeyManagementProps {
  hasBackup: boolean;
  onBackup: () => Promise<void>;
  onRestore: (key: string) => Promise<void>;
}

const KeyManagement: React.FC<KeyManagementProps> = ({
  hasBackup,
  onBackup,
  onRestore,
}) => {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [restoreKey, setRestoreKey] = useState("");
  const [backupSuccess, setBackupSuccess] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBackup = async () => {
    setIsBackingUp(true);
    setError(null);
    setBackupSuccess(false);

    try {
      await onBackup();
      setBackupSuccess(true);
      setTimeout(() => setBackupSuccess(false), 3000);
    } catch {
      setError("Failed to create backup. Please try again.");
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestore = async () => {
    if (!restoreKey.trim()) {
      setError("Please enter your backup key");
      return;
    }

    setIsRestoring(true);
    setError(null);
    setRestoreSuccess(false);

    try {
      await onRestore(restoreKey);
      setRestoreSuccess(true);
      setShowRestoreDialog(false);
      setRestoreKey("");
      setTimeout(() => setRestoreSuccess(false), 3000);
    } catch {
      setError(
        "Failed to restore from backup. Please check your key and try again.",
      );
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="bg-[var(--surface)] rounded-lg shadow-sm border border-[var(--surface-muted)] p-6">
      <div className="flex items-center gap-3 mb-4">
        <Key className="w-6 h-6 text-[var(--accent)]" />
        <h3 className="text-lg font-semibold text-[var(--text)]">
          Key Management
        </h3>
      </div>

      <p className="text-sm text-[var(--text-muted)] mb-6">
        Backup your encryption keys to ensure you never lose access to your
        encrypted data. Store your backup in a secure location.
      </p>

      {error && (
        <div className="mb-4 flex items-start gap-2 p-3 bg-[var(--error-bg)] text-[var(--error)] rounded-md text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {backupSuccess && (
        <div className="mb-4 flex items-start gap-2 p-3 bg-[var(--success-bg)] text-[var(--success)] rounded-md text-sm">
          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>Backup created successfully!</span>
        </div>
      )}

      {restoreSuccess && (
        <div className="mb-4 flex items-start gap-2 p-3 bg-[var(--success-bg)] text-[var(--success)] rounded-md text-sm">
          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>Keys restored successfully!</span>
        </div>
      )}

      <div className="space-y-4">
        {/* Backup Status */}
        <div className="flex items-center justify-between p-4 bg-[var(--surface-muted)] rounded-lg">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${hasBackup ? "bg-[var(--success)]" : "bg-[var(--warning)]"}`}
            />
            <div>
              <p className="text-sm font-medium text-[var(--text)]">
                {hasBackup ? "Backup exists" : "No backup found"}
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                {hasBackup
                  ? "Your keys are backed up securely"
                  : "Create a backup to protect your data"}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleBackup}
            disabled={isBackingUp}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-md hover:bg-[var(--accent)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            {isBackingUp ? "Creating backup..." : "Create Backup"}
          </button>

          <button
            onClick={() => setShowRestoreDialog(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-[var(--surface-muted)] text-[var(--text)] rounded-md hover:bg-[var(--surface-muted)] transition-colors"
          >
            <Upload className="w-4 h-4" />
            Restore from Backup
          </button>
        </div>
      </div>

      {/* Restore Dialog */}
      {showRestoreDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[var(--surface)] rounded-lg p-6 max-w-md w-full mx-4">
            <h4 className="text-lg font-semibold text-[var(--text)] mb-4">
              Restore from Backup
            </h4>

            <p className="text-sm text-[var(--text-muted)] mb-4">
              Enter your backup key to restore your encryption keys. This will
              replace your current keys.
            </p>

            <textarea
              value={restoreKey}
              onChange={(e) => setRestoreKey(e.target.value)}
              placeholder="Paste your backup key here..."
              className="w-full h-32 px-3 py-2 border border-[var(--surface-muted)] rounded-md focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] resize-none bg-[var(--surface)] text-[var(--text)]"
              disabled={isRestoring}
            />

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowRestoreDialog(false);
                  setRestoreKey("");
                  setError(null);
                }}
                disabled={isRestoring}
                className="flex-1 px-4 py-2 border border-[var(--surface-muted)] text-[var(--text)] rounded-md hover:bg-[var(--surface-muted)] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRestore}
                disabled={isRestoring || !restoreKey.trim()}
                className="flex-1 px-4 py-2 bg-[var(--accent)] text-white rounded-md hover:bg-[var(--accent)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRestoring ? "Restoring..." : "Restore"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KeyManagement;
