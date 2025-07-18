import React, { useState, useEffect } from "react";
import { Shield, Lock, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { Button } from "../../components/common";
import { getEncryptionService } from "../../services/encryption";
import { useAuth } from "../../contexts";
import { useEncryption } from "../../contexts/useEncryption";
import { useMutation, useQuery } from "@tanstack/react-query";
import apiClient from "../../api/client";
import type { UserProfile as BaseUserProfile } from "../../features/auth/services/authService";

interface UserProfile extends BaseUserProfile {
  encryptionEnabled: boolean;
  encryptionSetupDate?: string;
  encryptionKeyId?: string;
}

// Setup Wizard Component - Defined outside to prevent recreation
interface SetupWizardProps {
  setupStep: number;
  setSetupStep: (step: number) => void;
  masterPassword: string;
  setMasterPassword: (password: string) => void;
  confirmPassword: string;
  setConfirmPassword: (password: string) => void;
  setupError: string;
  setShowSetupWizard: (show: boolean) => void;
  handleSetupComplete: () => Promise<void>;
}

const SetupWizard: React.FC<SetupWizardProps> = ({
  setupStep,
  setSetupStep,
  masterPassword,
  setMasterPassword,
  confirmPassword,
  setConfirmPassword,
  setupError,
  setShowSetupWizard,
  handleSetupComplete,
}) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-[var(--surface)] rounded-lg max-w-md w-full p-6 shadow-[var(--shadow-lg)] border border-[var(--surface-muted)]">
      <div className="flex items-center mb-4">
        <Shield className="h-8 w-8 text-[var(--accent)] mr-3" />
        <h2 className="text-2xl font-bold text-[var(--text)]">
          Set Up Encryption
        </h2>
      </div>

      {setupStep === 1 && (
        <div className="space-y-4">
          <div className="bg-[var(--warning-bg)] border border-[var(--warning)] border-opacity-30 rounded-lg p-4">
            <p className="text-sm text-[var(--text)]">
              <strong>Important:</strong> Your master encryption password is
              separate from your login password. Store it securely - you'll need
              it to decrypt your data on other devices.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2 text-[var(--text)]">
              How it works:
            </h3>
            <ul className="space-y-2 text-sm text-[var(--text-muted)]">
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-[var(--success)] mt-0.5 mr-2 flex-shrink-0" />
                <span>
                  Your journal entries will be encrypted before leaving your
                  device
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-[var(--success)] mt-0.5 mr-2 flex-shrink-0" />
                <span>Only you can decrypt them with your master password</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-[var(--success)] mt-0.5 mr-2 flex-shrink-0" />
                <span>
                  We cannot recover your data if you lose this password
                </span>
              </li>
            </ul>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setShowSetupWizard(false)}>
              Cancel
            </Button>
            <Button onClick={() => setSetupStep(2)}>Continue</Button>
          </div>
        </div>
      )}

      {setupStep === 2 && (
        <div className="space-y-4">
          <div>
            <label
              htmlFor="master-password"
              className="block text-sm font-medium text-[var(--text)] mb-1"
            >
              Master Encryption Password
            </label>
            <input
              id="master-password"
              type="password"
              value={masterPassword}
              onChange={(e) => setMasterPassword(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--surface-muted)] rounded-md focus:ring-2 focus:ring-[var(--accent)] bg-[var(--surface)] text-[var(--text)]"
              placeholder="Enter a strong password"
              autoComplete="new-password"
            />
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Use a unique password you'll remember. Min 12 characters.
            </p>
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="block text-sm font-medium text-[var(--text)] mb-1"
            >
              Confirm Password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--surface-muted)] rounded-md focus:ring-2 focus:ring-[var(--accent)] bg-[var(--surface)] text-[var(--text)]"
              placeholder="Confirm your password"
              autoComplete="new-password"
            />
          </div>

          {setupError && (
            <div className="bg-[var(--error-bg)] border border-[var(--error)] border-opacity-30 rounded p-3">
              <p className="text-sm text-[var(--error)]">{setupError}</p>
            </div>
          )}

          <div className="bg-[var(--warning-bg)] border border-[var(--warning)] border-opacity-30 rounded-lg p-3">
            <p className="text-sm text-[var(--text)]">
              <strong>Remember:</strong> This password cannot be recovered.
              Consider using a password manager.
            </p>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setSetupStep(1)}>
              Back
            </Button>
            <Button
              onClick={handleSetupComplete}
              disabled={!masterPassword || !confirmPassword}
            >
              Complete Setup
            </Button>
          </div>
        </div>
      )}
    </div>
  </div>
);

const EncryptionSettings: React.FC = () => {
  const { user } = useAuth();
  const { setupEncryption: contextSetupEncryption, isEncryptionSetup: contextIsSetup } = useEncryption();
  const [isSetup, setIsSetup] = useState(false);
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Setup wizard state
  const [masterPassword, setMasterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [setupStep, setSetupStep] = useState(1);
  const [setupError, setSetupError] = useState("");

  // Password prompt state
  const [unlockPassword, setUnlockPassword] = useState("");
  const [unlockError, setUnlockError] = useState("");

  // Reset state
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState("");

  // Check user profile for encryption status
  const { data: profile, refetch: refetchProfile } = useQuery<UserProfile>({
    queryKey: ["userProfile", user?.userId],
    queryFn: async () => {
      const response = await apiClient.get("/users/profile");
      // Handle both direct data and wrapped response
      if (
        response.data &&
        typeof response.data === "object" &&
        "body" in response.data
      ) {
        // If response is wrapped with statusCode and body
        const parsed =
          typeof response.data.body === "string"
            ? JSON.parse(response.data.body)
            : response.data.body;
        return parsed;
      }
      return response.data;
    },
    enabled: !!user,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      const { data } = await apiClient.put("/users/profile", updates);
      return data;
    },
    onSuccess: () => {
      refetchProfile();
    },
  });

  // Check local encryption setup
  useEffect(() => {
    const checkEncryption = async () => {
      try {
        console.log("Profile data:", profile); // Debug log
        const encryptionService = getEncryptionService();
        const hasLocalSetup = await encryptionService.checkSetup();
        setIsSetup(hasLocalSetup || contextIsSetup); // Use context state as fallback

        // If profile says encryption is enabled but local setup is missing
        if (profile?.encryptionEnabled && !hasLocalSetup && !contextIsSetup) {
          setShowPasswordPrompt(true);
        }
      } catch (error) {
        console.error("Failed to check encryption status:", error);
      }
    };

    if (profile) {
      checkEncryption();
    }
  }, [profile, contextIsSetup]);

  const { unlockEncryption } = useEncryption();

  const handleSetupEncryption = async () => {
    if (masterPassword !== confirmPassword) {
      setSetupError("Passwords do not match");
      return;
    }

    if (masterPassword.length < 12) {
      setSetupError("Password must be at least 12 characters long");
      return;
    }

    try {
      // Use the context to initialize and unlock encryption
      await unlockEncryption(masterPassword);
      const encryptionService = getEncryptionService();
      const keyId = await encryptionService.getPublicKeyId();
      
      // Update user profile
      await updateProfileMutation.mutateAsync({
        encryptionEnabled: true,
        encryptionSetupDate: new Date().toISOString(),
        encryptionKeyId: keyId || undefined,
      });

      setIsSetup(true);
      setShowSetupWizard(false);
      setSetupStep(1);
      setMasterPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Setup failed:", error);
      setSetupError("Failed to set up encryption. Please try again.");
    }
  };

  const handleUnlock = async () => {
    try {
      await unlockEncryption(unlockPassword);

      setIsSetup(true);
      setShowPasswordPrompt(false);
      setUnlockPassword("");
      setUnlockError("");
    } catch (error) {
      console.error("Unlock failed:", error);
      setUnlockError("Invalid password. Please try again.");
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    setResetError("");

    try {
      // Delete encryption keys from backend first
      await apiClient.delete("/encryption/keys");

      // Then clear local encryption data
      const encryptionService = getEncryptionService();
      await encryptionService.reset();

      // Refetch profile (backend already updated it)
      await refetchProfile();

      setIsSetup(false);
      setShowResetConfirm(false);
      setShowPasswordPrompt(false);
    } catch (error) {
      console.error("Reset failed:", error);
      setResetError("Failed to reset encryption. Please try again.");
    } finally {
      setIsResetting(false);
    }
  };

  // Password Prompt Component
  const PasswordPrompt = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-[var(--surface)] rounded-lg max-w-md w-full p-6 shadow-[var(--shadow-lg)] border border-[var(--surface-muted)]">
        <div className="flex items-center mb-4">
          <Lock className="h-8 w-8 text-[var(--warning)] mr-3" />
          <h2 className="text-2xl font-bold text-[var(--text)]">
            Unlock Encryption
          </h2>
        </div>

        <div className="space-y-4">
          <p className="text-[var(--text-muted)]">
            Your encryption is set up on another device. Enter your master
            password to access encrypted content.
          </p>

          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">
              Master Encryption Password
            </label>
            <input
              type="password"
              value={unlockPassword}
              onChange={(e) => setUnlockPassword(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--surface-muted)] rounded-md focus:ring-2 focus:ring-[var(--accent)] bg-[var(--surface)] text-[var(--text)]"
              placeholder="Enter your master password"
              onKeyPress={(e) => e.key === "Enter" && handleUnlock()}
            />
          </div>

          {unlockError && (
            <div className="bg-[var(--error-bg)] border border-[var(--error)] border-opacity-30 rounded p-3">
              <p className="text-sm text-[var(--error)]">{unlockError}</p>
            </div>
          )}

          <div className="flex justify-between items-center">
            <button
              onClick={() => setShowResetConfirm(true)}
              className="text-sm text-[var(--error)] hover:text-[var(--error)] hover:opacity-80 transition-opacity"
            >
              Forgot password?
            </button>
            <Button onClick={handleUnlock} disabled={!unlockPassword}>
              Unlock
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  // Reset Confirmation Component
  const ResetConfirmation = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-[var(--surface)] rounded-lg max-w-md w-full p-6 shadow-[var(--shadow-lg)] border border-[var(--surface-muted)]">
        <div className="flex items-center mb-4">
          <AlertTriangle className="h-8 w-8 text-[var(--error)] mr-3" />
          <h2 className="text-2xl font-bold text-[var(--error)]">
            Reset Encryption?
          </h2>
        </div>

        <div className="space-y-4">
          <div className="bg-[var(--error-bg)] border border-[var(--error)] border-opacity-30 rounded-lg p-4">
            <p className="text-sm text-[var(--error)] font-semibold mb-2">
              WARNING: This action cannot be undone!
            </p>
            <p className="text-sm text-[var(--error)]">
              Resetting encryption will permanently delete all encrypted journal
              entries. You will lose access to any content that was encrypted
              with your current master password.
            </p>
          </div>

          <p className="text-[var(--text-muted)] text-sm">
            Only proceed if you understand that all encrypted data will be lost.
          </p>

          {resetError && (
            <div className="bg-[var(--error-bg)] border border-[var(--error)] border-opacity-30 rounded p-3">
              <p className="text-sm text-[var(--error)]">{resetError}</p>
            </div>
          )}

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setShowResetConfirm(false);
                setResetError("");
              }}
              disabled={isResetting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-400"
              onClick={handleReset}
              disabled={isResetting}
            >
              {isResetting ? "Resetting..." : "Reset & Delete Encrypted Data"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-[var(--surface)] rounded-lg shadow-[var(--shadow-md)] border border-[var(--surface-muted)]">
        <div className="p-6 border-b border-[var(--surface-muted)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-[var(--accent)] mr-3" />
              <div>
                <h2 className="text-2xl font-bold text-[var(--text)]">
                  Encryption Settings
                </h2>
                <p className="text-[var(--text-muted)]">
                  Manage your end-to-end encryption
                </p>
              </div>
            </div>
            {isSetup && (
              <div className="flex items-center text-[var(--success)]">
                <CheckCircle className="h-5 w-5 mr-2" />
                <span className="font-medium">Active</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {!isSetup && !profile?.encryptionEnabled && (
            <div className="bg-[var(--surface-muted)] rounded-lg p-6 text-center">
              <Lock className="h-12 w-12 text-[var(--text-disabled)] mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-[var(--text)]">
                Encryption Not Set Up
              </h3>
              <p className="text-[var(--text-muted)] mb-4 max-w-md mx-auto">
                Enable end-to-end encryption to secure your journal entries.
                Only you will be able to read encrypted content.
              </p>
              <Button onClick={() => setShowSetupWizard(true)} size="lg">
                Set Up Encryption
              </Button>
            </div>
          )}

          {isSetup && (
            <>
              <div className="bg-[var(--success-bg)] border border-[var(--success)] border-opacity-30 rounded-lg p-4">
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-[var(--success)] mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-[var(--text)]">
                      Encryption is active
                    </p>
                    <p className="text-sm text-[var(--text-muted)] mt-1">
                      Your journal entries are being encrypted before storage.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-[var(--text)]">
                  Encryption Details
                </h3>
                <div className="bg-[var(--surface-muted)] rounded-lg p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-muted)]">
                      Encryption Type:
                    </span>
                    <span className="font-medium text-[var(--text)]">
                      AES-256-GCM + RSA-4096
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-muted)]">
                      Setup Date:
                    </span>
                    <span className="font-medium text-[var(--text)]">
                      {profile?.encryptionSetupDate
                        ? new Date(
                            profile.encryptionSetupDate,
                          ).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "Unknown"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-muted)]">Key ID:</span>
                    <span className="font-mono text-xs text-[var(--text)]">
                      {profile?.encryptionKeyId
                        ? `${profile.encryptionKeyId.substring(0, 12)}...`
                        : "Not available"}
                    </span>
                  </div>
                </div>

                <div className="bg-[var(--accent-bg)] border border-[var(--accent)] border-opacity-20 rounded-lg p-4">
                  <div className="flex items-start">
                    <Info className="h-5 w-5 text-[var(--accent)] mt-0.5 mr-3 flex-shrink-0" />
                    <div className="text-sm text-[var(--text)]">
                      <p className="font-medium mb-1">
                        Using encryption on another device?
                      </p>
                      <p>
                        Enter the same master password you used when setting up
                        encryption.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[var(--surface-muted)]">
                  <h4 className="font-medium text-[var(--error)] mb-2">
                    Danger Zone
                  </h4>
                  <p className="text-sm text-[var(--text-muted)] mb-3">
                    Resetting encryption will permanently delete all encrypted
                    entries.
                  </p>
                  <Button
                    variant="outline"
                    className="border-[var(--error)] text-[var(--error)] hover:bg-[var(--error-bg)]"
                    onClick={() => setShowResetConfirm(true)}
                  >
                    Reset Encryption
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {showSetupWizard && (
        <SetupWizard
          setupStep={setupStep}
          setSetupStep={setSetupStep}
          masterPassword={masterPassword}
          setMasterPassword={setMasterPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          setupError={setupError}
          setShowSetupWizard={setShowSetupWizard}
          handleSetupComplete={handleSetupEncryption}
        />
      )}
      {showPasswordPrompt && <PasswordPrompt />}
      {showResetConfirm && <ResetConfirmation />}
    </div>
  );
};

export default EncryptionSettings;
