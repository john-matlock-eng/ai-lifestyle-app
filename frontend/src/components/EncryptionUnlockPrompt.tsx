import React, { useState } from "react";
import { Lock } from "lucide-react";
import { useEncryption } from "../contexts/useEncryption";
import { Button, Input } from "./common";
import { useNavigate } from "react-router-dom";
import { securePasswordStorage } from "../services/encryption/securePasswordStorage";

export const EncryptionUnlockPrompt: React.FC = () => {
  const {
    isEncryptionEnabled,
    isEncryptionSetup,
    isEncryptionLocked,
    unlockEncryption,
  } = useEncryption();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [rememberPassword, setRememberPassword] = useState(false);
  const [error, setError] = useState("");
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Only show if encryption is enabled and locked
  if (!isEncryptionEnabled || !isEncryptionLocked) {
    return null;
  }

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsUnlocking(true);

    try {
      await unlockEncryption(password);

      // Store password if remember checkbox is checked
      if (rememberPassword) {
        try {
          await securePasswordStorage.storePassword(password);
        } catch (storageError) {
          console.error("Failed to store password:", storageError);
          // Don't block unlock if storage fails
        }
      }

      setPassword("");
    } catch {
      setError("Invalid password. Please try again.");
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleGoToSettings = () => {
    navigate("/settings");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-[var(--surface)] rounded-lg max-w-md w-full p-6">
        <div className="flex items-center mb-4">
          <Lock className="h-8 w-8 text-[var(--warning)] mr-3" />
          <h2 className="text-2xl font-bold text-[var(--text)]">Unlock Encryption</h2>
        </div>

        <div className="space-y-4">
          {isEncryptionSetup ? (
            <>
              <p className="text-[var(--text-muted)]">
                Enter your master encryption password to access encrypted
                content.
              </p>

              <form onSubmit={handleUnlock} className="space-y-4">
                <Input
                  label="Master Encryption Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your master password"
                  autoFocus
                  required
                />

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="rememberPassword"
                    checked={rememberPassword}
                    onChange={(e) => setRememberPassword(e.target.checked)}
                    className="h-4 w-4 text-[var(--accent)] focus:ring-[var(--accent)] border-[var(--surface-muted)] rounded"
                  />
                  <label
                    htmlFor="rememberPassword"
                    className="ml-2 text-sm text-[var(--text)]"
                  >
                    Remember password on this device (30 days)
                  </label>
                </div>

                {error && (
                  <div className="bg-[var(--error-bg)] border border-[var(--error)] rounded p-3">
                    <p className="text-sm text-[var(--error)]">{error}</p>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={handleGoToSettings}
                    className="text-sm text-[var(--accent)] hover:text-[var(--accent-hover)]"
                  >
                    Forgot password?
                  </button>
                  <Button
                    type="submit"
                    disabled={!password || isUnlocking}
                    isLoading={isUnlocking}
                  >
                    Unlock
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <>
              <p className="text-[var(--text-muted)]">
                Your encryption is set up on another device. Enter your master
                password to access encrypted content on this device.
              </p>

              <form onSubmit={handleUnlock} className="space-y-4">
                <Input
                  label="Master Encryption Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your master password"
                  autoFocus
                  required
                />

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="rememberPassword"
                    checked={rememberPassword}
                    onChange={(e) => setRememberPassword(e.target.checked)}
                    className="h-4 w-4 text-[var(--accent)] focus:ring-[var(--accent)] border-[var(--surface-muted)] rounded"
                  />
                  <label
                    htmlFor="rememberPassword"
                    className="ml-2 text-sm text-[var(--text)]"
                  >
                    Remember password on this device (30 days)
                  </label>
                </div>

                {error && (
                  <div className="bg-[var(--error-bg)] border border-[var(--error)] rounded p-3">
                    <p className="text-sm text-[var(--error)]">{error}</p>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={handleGoToSettings}
                    className="text-sm text-[var(--error)] hover:text-[var(--error)]/80"
                  >
                    Reset encryption
                  </button>
                  <Button
                    type="submit"
                    disabled={!password || isUnlocking}
                    isLoading={isUnlocking}
                  >
                    Unlock
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
