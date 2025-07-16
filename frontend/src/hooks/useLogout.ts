import { useAuth } from '../contexts/useAuth';
import { useEncryption } from '../contexts/useEncryption';
import { getEncryptionService } from '../services/encryption';
import { securePasswordStorage } from '../services/encryption/securePasswordStorage';

export const useLogout = () => {
  const { logout: authLogout } = useAuth();
  const { lockEncryption } = useEncryption();

  const logout = async (clearStoredPassword = false) => {
    try {
      // Clear encryption state
      const encryptionService = getEncryptionService();
      await encryptionService.clear();
      
      // Lock encryption
      lockEncryption();
      
      // Optionally clear stored password
      if (clearStoredPassword) {
        securePasswordStorage.clearStoredPassword();
      }
      
      // Perform auth logout
      await authLogout();
    } catch (error) {
      console.error('Error during logout:', error);
      // Still try to logout even if encryption cleanup fails
      await authLogout();
    }
  };

  return { logout };
};