import React, { useState } from "react";
import { AlertTriangle, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/common";
import { getEncryptionService } from "@/services/encryption";
import { useAuth } from "@/contexts";

interface EncryptionResetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  needsFullReset?: boolean;
}

export const EncryptionResetDialog: React.FC<EncryptionResetDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  needsFullReset = false,
}) => {
  const { user } = useAuth();
  const [password, setPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleReset = async () => {
    if (!password || !user?.userId) {
      setError("Please enter your password");
      return;
    }

    setIsResetting(true);
    setError(null);

    try {
      const encryptionService = getEncryptionService();
      await encryptionService.forceResync(password, user.userId);

      // Success
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to reset encryption:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to reset encryption. Please check your password and try again.",
      );
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-surface rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b border-surface-muted">
          <div className="p-2 bg-orange-100 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-theme">
              Encryption Keys Out of Sync
            </h2>
            <p className="text-sm text-muted mt-1">
              Your encryption needs to be reset
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-theme transition-colors"
            disabled={isResetting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <p className="text-sm text-muted mb-4">
              Your local encryption keys don't match what's stored on the
              server. This can happen if you've logged in from multiple devices
              or if there was an issue during setup.
            </p>

            {needsFullReset ? (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-orange-800">
                  <strong>Important:</strong> Resetting encryption will:
                </p>
                <ul className="list-disc list-inside text-sm text-orange-700 mt-2 space-y-1">
                  <li>Generate new encryption keys</li>
                  <li>Make previously encrypted journals inaccessible</li>
                  <li>
                    Make previously shared journals inaccessible to recipients
                  </li>
                  <li>
                    Require you to re-share any journals you want to share
                  </li>
                </ul>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> This will sync your local encryption
                  with the server. Your existing encrypted content will remain
                  accessible.
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-theme mb-2">
              Enter your password to continue
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your account password"
              className="w-full px-3 py-2 border border-surface-muted rounded-lg focus:ring-2 focus:ring-accent focus:border-accent"
              disabled={isResetting}
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={onClose} disabled={isResetting}>
              Cancel
            </Button>
            <Button
              onClick={handleReset}
              disabled={isResetting || !password}
              className="flex items-center gap-2"
            >
              {isResetting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  {needsFullReset ? "Reset Encryption" : "Sync Encryption"}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EncryptionResetDialog;
