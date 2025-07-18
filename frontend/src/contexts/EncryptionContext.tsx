import React, { useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./index";
import { getEncryptionService } from "../services/encryption";
import apiClient from "../api/client";
import { EncryptionContext } from "./EncryptionContextType";
import type { EncryptionContextValue } from "./EncryptionContextType";
import type { UserProfile as BaseUserProfile } from "../features/auth/services/authService";
import { securePasswordStorage } from "../services/encryption/securePasswordStorage";

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
  }, [user?.userId]);

  // Check local encryption setup on mount and when profile changes
  useEffect(() => {
    if (profile) {
      checkEncryptionStatus();
    }
  }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-unlock with stored password when encryption is setup but locked
  useEffect(() => {
    if (
      isEncryptionSetup &&
      isEncryptionLocked &&
      !hasAttemptedAutoUnlock &&
      user?.userId
    ) {
      attemptAutoUnlock();
    }
  }, [
    isEncryptionSetup,
    isEncryptionLocked,
    hasAttemptedAutoUnlock,
    user?.userId,
    attemptAutoUnlock,
  ]);

  const checkEncryptionStatus = async () => {
    try {
      const encryptionService = getEncryptionService();
      const hasLocalSetup = await encryptionService.checkSetup();

      setIsEncryptionSetup(hasLocalSetup);

      if (hasLocalSetup) {
        // Get the key ID
        const keyId = await encryptionService.getPublicKeyId();
        setEncryptionKeyId(keyId);

        const isInitialized = encryptionService.isInitialized();

        // Set lock state based on initialization
        setIsEncryptionLocked(!isInitialized);

        // Trigger auto-unlock if encryption isn't initialized yet
        if (!isInitialized && !hasAttemptedAutoUnlock && user?.userId) {
          attemptAutoUnlock();
        }
      } else if (profile?.encryptionEnabled) {
        // Profile says encryption is enabled but no local setup
        // User needs to enter password to set up locally
        setIsEncryptionLocked(true);
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

      const encryptionService = getEncryptionService();
      await encryptionService.initialize(password, user.userId);

      const keyId = await encryptionService.getPublicKeyId();
      setEncryptionKeyId(keyId);
      setIsEncryptionSetup(true);
      setIsEncryptionLocked(false);
    } catch (error) {
      // If we get a 409 error, it means encryption is already set up
      // This can happen due to state sync issues - just continue
      if (error instanceof Error && "response" in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 409) {
          console.log(
            "[Encryption] Handling 409 during unlock - encryption already exists",
          );
          // Since we got a 409, it means the password was correct and encryption is already set up
          // Get the key ID from the service
          const encryptionService = getEncryptionService();
          const keyId = await encryptionService.getPublicKeyId();
          setEncryptionKeyId(keyId);
          setIsEncryptionSetup(true);
          setIsEncryptionLocked(false);
          return; // Don't throw the error
        }
      }
      console.error("Failed to unlock encryption:", error);
      throw error;
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
      const encryptionService = getEncryptionService();
      await encryptionService.initialize(password, user.userId);

      // Update local state
      const keyId = await encryptionService.getPublicKeyId();
      setEncryptionKeyId(keyId);
      setIsEncryptionSetup(true);
      setIsEncryptionLocked(false); // Important: unlock after setup
    } catch (error) {
      console.error("Failed to setup encryption:", error);
      throw error;
    }
  };

  const resetEncryption = async (password: string) => {
    if (!user?.userId) throw new Error("User not authenticated");

    try {
      const encryptionService = getEncryptionService();
      await encryptionService.forceResync(password, user.userId);

      // Update local state
      const keyId = await encryptionService.getPublicKeyId();
      setEncryptionKeyId(keyId);
      setIsEncryptionSetup(true);
      setIsEncryptionLocked(false);
    } catch (error) {
      console.error("Failed to reset encryption:", error);
      throw error;
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
