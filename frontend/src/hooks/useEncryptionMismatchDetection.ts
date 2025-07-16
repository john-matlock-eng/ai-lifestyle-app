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

        console.log("[EncryptionMismatch] Comparing keys:", {
          localPublicKeyId,
          serverPublicKeyId: serverData.publicKeyId,
          serverHasSalt: !!serverData.salt,
          serverHasPrivateKey: !!serverData.encryptedPrivateKey,
        });

        // Check for mismatches
        const hasIncompleteData = !serverData.salt || !serverData.encryptedPrivateKey;
        const hasKeyMismatch = serverData.publicKeyId && serverData.publicKeyId !== localPublicKeyId;
        const hasMismatch = hasIncompleteData || hasKeyMismatch;

        if (hasMismatch) {
          setState({
            hasMismatch: true,
            isChecking: false,
            needsFullReset: hasIncompleteData, // Only need full reset if data is incomplete
            errorDetails: {
              localPublicKeyId,
              serverPublicKeyId: serverData.publicKeyId,
              hasSalt: !!serverData.salt,
              hasEncryptedPrivateKey: !!serverData.encryptedPrivateKey,
            },
          });
        } else {
          setState({ hasMismatch: false, isChecking: false });
        }
      } catch {
        // Server doesn't have encryption data but we do locally
        console.log("[EncryptionMismatch] Server has no encryption data");
        setState({
          hasMismatch: true,
          isChecking: false,
          needsFullReset: true, // No server data means we need full reset
          errorDetails: {
            localPublicKeyId,
            serverPublicKeyId: undefined,
            hasSalt: false,
            hasEncryptedPrivateKey: false,
          },
        });
      }
    } catch (error) {
      console.error("[EncryptionMismatch] Error checking for mismatch:", error);
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
