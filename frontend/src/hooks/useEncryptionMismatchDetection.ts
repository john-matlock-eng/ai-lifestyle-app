import { useState, useEffect, useCallback } from "react";
import { keyStore } from "@/services/encryption/keyStore";
import apiClient from "@/api/client";
import { useAuth } from "@/contexts/useAuth";

interface EncryptionMismatchState {
  hasMismatch: boolean;
  isChecking: boolean;
  needsFullReset?: boolean; // Only true if server data is incomplete
  errorDetails?: {
    localPublicKeyId?: string;
    serverPublicKeyId?: string;
    hasSalt?: boolean;
    hasEncryptedPrivateKey?: boolean;
  };
}

export function useEncryptionMismatchDetection() {
  const [state, setState] = useState<EncryptionMismatchState>({
    hasMismatch: false,
    isChecking: false,
  });
  const { user } = useAuth();

  const checkForMismatch = useCallback(async () => {
    if (!user?.userId) return;

    setState((prev) => ({ ...prev, isChecking: true }));

    try {
      // Get local encryption data
      const localKeys = await keyStore.getPersonalKeys();
      const localPublicKeyId = localKeys?.publicKeyId;

      if (!localPublicKeyId) {
        // No local encryption setup, no mismatch
        setState({ hasMismatch: false, isChecking: false });
        return;
      }

      // Get server encryption data
      try {
        const response = await apiClient.get(`/encryption/user/${user.userId}`);
        const serverData = response.data;

        console.log("[EncryptionMismatch] Server response:", {
          data: serverData,
          dataKeys: Object.keys(serverData || {})
        });

        // Check if server has encryption data
        if (!serverData.hasEncryption) {
          // Server says no encryption, but we have local keys
          setState({
            hasMismatch: true,
            isChecking: false,
            needsFullReset: true,
            errorDetails: {
              localPublicKeyId,
              serverPublicKeyId: undefined,
              hasSalt: false,
              hasEncryptedPrivateKey: false,
            },
          });
          return;
        }

        // Extract server data
        const { salt, encryptedPrivateKey, publicKeyId } = serverData;
        
        console.log("[EncryptionMismatch] Comparison:", {
          localPublicKeyId,
          serverPublicKeyId: publicKeyId,
          hasSalt: !!salt,
          hasEncryptedPrivateKey: !!encryptedPrivateKey
        });

        // Check for mismatches
        const hasIncompleteData = !salt || !encryptedPrivateKey;
        const hasKeyMismatch = publicKeyId && localPublicKeyId && 
                             publicKeyId.toLowerCase().trim() !== localPublicKeyId.toLowerCase().trim();
        
        const hasMismatch = hasIncompleteData || hasKeyMismatch;

        if (hasMismatch) {
          setState({
            hasMismatch: true,
            isChecking: false,
            needsFullReset: hasIncompleteData,
            errorDetails: {
              localPublicKeyId,
              serverPublicKeyId: publicKeyId,
              hasSalt: !!salt,
              hasEncryptedPrivateKey: !!encryptedPrivateKey,
            },
          });
        } else {
          setState({ hasMismatch: false, isChecking: false });
        }
      } catch (error) {
        // Check if this is a legitimate error vs endpoint not found
        if (error instanceof Error && 'response' in error) {
          const axiosError = error as { response?: { status?: number } };
          if (axiosError.response?.status === 404) {
            // 404 could mean:
            // 1. The endpoint doesn't exist (not a mismatch)
            // 2. The user truly has no encryption data on server (potential mismatch)
            
            // Try to check if user has encryption enabled via profile
            try {
              const profileResponse = await apiClient.get('/users/profile');
              const profile = profileResponse.data;
              
              if (profile.encryptionEnabled) {
                // Profile says encryption is enabled but we can't get the keys
                // This is likely due to the endpoint only returning public key info
                // Don't treat this as a mismatch
                console.log("[EncryptionMismatch] Profile shows encryption enabled, assuming keys are in sync");
                setState({ hasMismatch: false, isChecking: false });
              } else {
                // Profile says no encryption, but we have local keys
                console.log("[EncryptionMismatch] Local keys exist but profile shows no encryption");
                setState({
                  hasMismatch: true,
                  isChecking: false,
                  needsFullReset: true,
                  errorDetails: {
                    localPublicKeyId,
                    serverPublicKeyId: undefined,
                    hasSalt: false,
                    hasEncryptedPrivateKey: false,
                  },
                });
              }
            } catch {
              // Can't check profile, assume no mismatch to avoid false positives
              console.log("[EncryptionMismatch] Can't verify encryption status, assuming no mismatch");
              setState({ hasMismatch: false, isChecking: false });
            }
          } else {
            // Other server errors - don't treat as mismatch
            console.log("[EncryptionMismatch] Server error checking encryption:", axiosError.response?.status);
            setState({ hasMismatch: false, isChecking: false });
          }
        } else {
          // Network error or other issue - don't treat as mismatch
          console.log("[EncryptionMismatch] Network error checking encryption");
          setState({ hasMismatch: false, isChecking: false });
        }
      }
    } catch (error) {
      console.error("[EncryptionMismatch] Error checking for mismatch:", error);
      // Default to no mismatch to avoid false positives
      setState({ hasMismatch: false, isChecking: false });
    }
  }, [user?.userId]);

  const resetMismatchState = useCallback(() => {
    setState({
      hasMismatch: false,
      isChecking: false,
    });
  }, []);

  useEffect(() => {
    checkForMismatch();
  }, [checkForMismatch]);

  return {
    ...state,
    checkForMismatch,
    resetMismatchState,
  };
}
