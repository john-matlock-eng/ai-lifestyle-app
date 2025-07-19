// JournalDecryptionErrorHandler.tsx
import React, { useState } from "react";
import { AlertTriangle, RefreshCw, HelpCircle } from "lucide-react";
import { useReencryptEntry } from "../hooks/useReencryptEntry";
import { useNavigate } from "react-router-dom";
import EncryptionResetDialog from "@/components/encryption/EncryptionResetDialog";
import type { JournalEntry } from "@/types/journal";

interface JournalDecryptionErrorHandlerProps {
  entry: JournalEntry;
  error: Error;
  onRetry: () => void;
  onSuccess: () => void;
}

export const JournalDecryptionErrorHandler: React.FC<
  JournalDecryptionErrorHandlerProps
> = ({ entry, error, onRetry, onSuccess }) => {
  const navigate = useNavigate();
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [isResettingEntry, setIsResettingEntry] = useState(false);

  const reencryptMutation = useReencryptEntry({
    onSuccess: () => {
      onSuccess();
    },
    onError: (error) => {
      console.error("Re-encryption failed:", error);
    },
  });

  const isKeyMismatch =
    error.message.includes("encryption keys are out of sync") ||
    error.message.includes("Unable to decrypt content");

  const handleQuickReencrypt = async () => {
    setIsResettingEntry(true);
    try {
      await reencryptMutation.mutateAsync(entry.entryId);
      onSuccess();
    } catch (error) {
      console.error("Quick re-encrypt failed:", error);
    } finally {
      setIsResettingEntry(false);
    }
  };

  return (
    <div className="bg-surface rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
          <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Unable to Decrypt Entry
        </h2>
      </div>

      {/* Error Message */}
      <div className="mb-6">
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {error.message.includes("encryption keys are out of sync")
            ? error.message
            : "We couldn't decrypt this journal entry. This usually happens when:"}
        </p>
        {!error.message.includes("encryption keys are out of sync") && (
          <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-2">
            <li>Your encryption keys have changed</li>
            <li>The entry was encrypted with an older key</li>
            <li>You've logged in from a different device</li>
          </ul>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {isKeyMismatch && (
          <button
            onClick={handleQuickReencrypt}
            disabled={isResettingEntry || reencryptMutation.isPending}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isResettingEntry || reencryptMutation.isPending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Re-encrypting...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Fix Encryption (Recommended)
              </>
            )}
          </button>
        )}

        <button
          onClick={onRetry}
          className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>

      {/* Help Section */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <details className="text-sm">
          <summary className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-2">
            <HelpCircle className="w-4 h-4" />
            Need more help?
          </summary>
          <div className="mt-3 space-y-3 text-gray-600 dark:text-gray-400">
            <p>If the above options don't work, you can:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                <button
                  onClick={() => setShowResetDialog(true)}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Reset your encryption entirely
                </button>{" "}
                (last resort)
              </li>
              <li>
                <button
                  onClick={() => navigate("/settings/security")}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Check your encryption settings
                </button>
              </li>
              <li>Contact support if the issue persists</li>
            </ul>
          </div>
        </details>
      </div>

      {/* Reset Dialog */}
      <EncryptionResetDialog
        isOpen={showResetDialog}
        onClose={() => setShowResetDialog(false)}
        onSuccess={() => {
          setShowResetDialog(false);
          // After reset, user will need to log in again
          navigate("/login");
        }}
        needsFullReset={true}
      />
    </div>
  );
};

export default JournalDecryptionErrorHandler;
