import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import React, { useCallback, useEffect, useState } from "react";
import apiClient from "../api/client";
import type { UserProfile as BaseUserProfile } from "../features/auth/services/authService";
import { getEncryptionService } from "../services/encryption";
import { securePasswordStorage } from "../services/encryption/securePasswordStorage";
import type { EncryptionContextValue } from "./EncryptionContextType";
import { EncryptionContext } from "./EncryptionContextType";
import { useAuth } from "./index";

interface UserProfile extends BaseUserProfile {
  encryptionEnabled: boolean;
  encryptionSetupDate?: string;
  encryptionKeyId?: string;
}

interface EncryptionProviderProps {
  children: ReactNode;
}

export const EncryptionProvider: React.FC<EncryptionProviderProps> = ({
  children,
}) => {
  const { user } = useAuth();
  const [isEncryptionSetup, setIsEncryptionSetup] = useState(false);
  const [isEncryptionLocked, setIsEncryptionLocked] = useState(true);
  const [encryptionKeyId, setEncryptionKeyId] = useState<string | null>(null);
  const [hasAttemptedAutoUnlock, setHasAttemptedAutoUnlock] = useState(false);
  const [isCheckingAutoUnlock, setIsCheckingAutoUnlock] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  // Fetch user profile to check encryption status
  const { data: profile } = useQuery<UserProfile>({
    queryKey: ["userProfile", user?.userId],
    queryFn: async () => {
      const { data } = await apiClient.get<UserProfile>("/users/profile");
      return data;
    },
    enabled: !!user,
  });

  const attemptAutoUnlock = useCallback(async () => {
    if (hasAttemptedAutoUnlock || isCheckingAutoUnlock) {
      return;
    }

    setHasAttemptedAutoUnlock(true);
    setIsCheckingAutoUnlock(true);

    try {
      // Check if we have a stored password
      if (securePasswordStorage.hasStoredPassword()) {
        const storedPassword = await securePasswordStorage.retrievePassword();

        if (storedPassword && user?.userId) {
          try {
            // Try to unlock with stored password
            const encryptionService = getEncryptionService();
            await encryptionService.initialize(storedPassword, user.userId);

            const keyId = await encryptionService.getPublicKeyId();
            setEncryptionKeyId(keyId);
            setIsEncryptionSetup(true);
            setIsEncryptionLocked(false);

            // Extend expiration on successful unlock
            await securePasswordStorage.extendExpiration();
          } catch (error) {
            // Stored password is invalid, clear it
            console.error("Stored password is invalid:", error);
            securePasswordStorage.clearStoredPassword();
          }
        }
      }
    } catch (error) {
      console.error("Failed to auto-unlock encryption:", error);
    } finally {
      setIsCheckingAutoUnlock(false);
    }
  }, [user?.userId, hasAttemptedAutoUnlock, isCheckingAutoUnlock]);

  // Check local encryption setup on mount and when profile changes
  useEffect(() => {
    if (profile && !isInitializing) {
      checkEncryptionStatus();
    }
  }, [profile, isInitializing]); // eslint-disable-line react-hooks/exhaustive-deps

  // Prevent unlock prompt from showing immediately after setup
  useEffect(() => {
    if (isEncryptionSetup && !isEncryptionLocked) {
      // If encryption is setup and unlocked, ensure we don't show unlock prompt
      setHasAttemptedAutoUnlock(true);
    }
  }, [isEncryptionSetup, isEncryptionLocked]);

  // Auto-unlock with stored password when encryption is setup but locked
  useEffect(() => {
    if (
      isEncryptionSetup &&
      isEncryptionLocked &&
      !hasAttemptedAutoUnlock &&
      !isCheckingAutoUnlock &&
      !isInitializing &&
      user?.userId
    ) {
      attemptAutoUnlock();
    }
  }, [
    isEncryptionSetup,
    isEncryptionLocked,
    hasAttemptedAutoUnlock,
    isCheckingAutoUnlock,
    isInitializing,
    user?.userId,
    attemptAutoUnlock,
  ]);

  const checkEncryptionStatus = async () => {
    try {
      const encryptionService = getEncryptionService();
      const hasLocalSetup = await encryptionService.checkSetup();

      // Check if profile says encryption is enabled
      const profileHasEncryption = profile?.encryptionEnabled || false;

      if (hasLocalSetup) {
        // We have local keys - check if they match the current user's encryption status
        const localKeyId = await encryptionService.getPublicKeyId();

        if (profileHasEncryption) {
          // Both local and profile have encryption - this is the normal case
          setIsEncryptionSetup(true);
          setEncryptionKeyId(localKeyId);

          const isInitialized = encryptionService.isInitialized();
          setIsEncryptionLocked(!isInitialized);

          // Trigger auto-unlock if needed
          if (
            !isInitialized &&
            !hasAttemptedAutoUnlock &&
            !isCheckingAutoUnlock &&
            user?.userId
          ) {
            attemptAutoUnlock();
          }
        } else {
          // Local keys exist but profile says no encryption
          // This means we have keys from a different user - clear them
          console.log(
            "[Encryption] Found local keys but user profile has no encryption - clearing old keys",
          );
          await encryptionService.reset();
          setIsEncryptionSetup(false);
          setIsEncryptionLocked(false);
          setEncryptionKeyId(null);
        }
      } else {
        // No local setup
        if (profileHasEncryption) {
          // Profile says encryption is enabled but no local setup
          // User needs to enter password to set up locally
          setIsEncryptionSetup(false);
          setIsEncryptionLocked(true);
        } else {
          // No encryption anywhere - this is a new user
          setIsEncryptionSetup(false);
          setIsEncryptionLocked(false);
          setEncryptionKeyId(null);
        }
      }
    } catch (error) {
      console.error("Failed to check encryption status:", error);
    }
  };

  const unlockEncryption = async (password: string) => {
    try {
      if (!user?.userId) {
        throw new Error("User ID not available");
      }

      setIsInitializing(true);
      const encryptionService = getEncryptionService();
      await encryptionService.initialize(password, user.userId);

      const keyId = await encryptionService.getPublicKeyId();
      setEncryptionKeyId(keyId);
      setIsEncryptionSetup(true);
      setIsEncryptionLocked(false);

      // Mark that we've attempted unlock to prevent auto-unlock from triggering
      setHasAttemptedAutoUnlock(true);
    } catch (error) {
      console.error("Failed to unlock encryption:", error);
      throw error;
    } finally {
      setIsInitializing(false);
    }
  };

  const lockEncryption = () => {
    setIsEncryptionLocked(true);
    // Reset auto-unlock flag so it can try again if needed
    setHasAttemptedAutoUnlock(false);
  };

  const clearStoredPassword = () => {
    securePasswordStorage.clearStoredPassword();
  };

  const setupEncryption = async (password: string) => {
    if (!user?.userId) throw new Error("User not authenticated");

    try {
      setIsInitializing(true);
      const encryptionService = getEncryptionService();
      await encryptionService.initialize(password, user.userId);

      // Update local state
      const keyId = await encryptionService.getPublicKeyId();
      setEncryptionKeyId(keyId);
      setIsEncryptionSetup(true);
      setIsEncryptionLocked(false); // Important: unlock after setup

      // Mark that setup is complete to prevent unlock prompt
      setHasAttemptedAutoUnlock(true);
    } catch (error) {
      console.error("Failed to setup encryption:", error);
      throw error;
    } finally {
      setIsInitializing(false);
    }
  };

  const resetEncryption = async (password: string) => {
    if (!user?.userId) throw new Error("User not authenticated");

    try {
      setIsInitializing(true);
      const encryptionService = getEncryptionService();
      await encryptionService.forceResync(password, user.userId);

      // Update local state
      const keyId = await encryptionService.getPublicKeyId();
      setEncryptionKeyId(keyId);
      setIsEncryptionSetup(true);
      setIsEncryptionLocked(false);

      // Mark that we've completed the reset
      setHasAttemptedAutoUnlock(true);
    } catch (error) {
      console.error("Failed to reset encryption:", error);
      throw error;
    } finally {
      setIsInitializing(false);
    }
  };

  const value: EncryptionContextValue = {
    isEncryptionEnabled: profile?.encryptionEnabled || false,
    isEncryptionSetup,
    isEncryptionLocked,
    encryptionKeyId,
    isCheckingAutoUnlock,
    needsEncryptionReset: false, // This will be determined by the mismatch detection hook
    unlockEncryption,
    lockEncryption,
    checkEncryptionStatus,
    clearStoredPassword,
    setupEncryption,
    resetEncryption,
  };

  return (
    <EncryptionContext.Provider value={value}>
      {children}
    </EncryptionContext.Provider>
  );
};

export default EncryptionProvider;
