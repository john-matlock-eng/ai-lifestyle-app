import React, { useState } from "react";
import { Lock } from "lucide-react";
import { useEncryption } from "../contexts/useEncryption";
import { Button } from "./common";
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
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center mb-4">
          <Lock className="h-8 w-8 text-yellow-600 mr-3" />
          <h2 className="text-2xl font-bold">Unlock Encryption</h2>
        </div>

        <div className="space-y-4">
          {isEncryptionSetup ? (
            <>
              <p className="text-gray-600">
                Enter your master encryption password to access encrypted
                content.
              </p>

              <form onSubmit={handleUnlock} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Master Encryption Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your master password"
                    autoFocus
                    required
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="rememberPassword"
                    checked={rememberPassword}
                    onChange={(e) => setRememberPassword(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="rememberPassword"
                    className="ml-2 text-sm text-gray-700"
                  >
                    Remember password on this device (30 days)
                  </label>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={handleGoToSettings}
                    className="text-sm text-blue-600 hover:text-blue-700"
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
              <p className="text-gray-600">
                Your encryption is set up on another device. Enter your master
                password to access encrypted content on this device.
              </p>

              <form onSubmit={handleUnlock} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Master Encryption Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your master password"
                    autoFocus
                    required
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="rememberPassword"
                    checked={rememberPassword}
                    onChange={(e) => setRememberPassword(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="rememberPassword"
                    className="ml-2 text-sm text-gray-700"
                  >
                    Remember password on this device (30 days)
                  </label>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={handleGoToSettings}
                    className="text-sm text-red-600 hover:text-red-700"
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
