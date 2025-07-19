import { useAuth } from "../contexts/useAuth";
import { useEncryption } from "../contexts/useEncryption";
import { getEncryptionService } from "../services/encryption";
import { securePasswordStorage } from "../services/encryption/securePasswordStorage";

export const useLogout = () => {
  const { logout: authLogout } = useAuth();
  const { lockEncryption } = useEncryption();

  const logout = async (clearStoredPassword = false) => {
    try {
      // Clear encryption state and IndexedDB
      const encryptionService = getEncryptionService();
      // Clear the service state
      await encryptionService.clear();
      // Also reset the keyStore to clear IndexedDB
      // This prevents keys from one user affecting another user
      await encryptionService.reset();

      // Lock encryption
      lockEncryption();

      // Always clear stored password on logout for security
      securePasswordStorage.clearStoredPassword();

      // Perform auth logout
      await authLogout();
    } catch (error) {
      console.error("Error during logout:", error);
      // Still try to logout even if encryption cleanup fails
      await authLogout();
    }
  };

  return { logout };
};
