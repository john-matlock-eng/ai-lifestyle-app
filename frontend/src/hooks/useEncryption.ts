import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  selectModuleEncryption,
  selectIsModuleEncrypted,
  selectActiveSharesForModule,
  initializeModule,
  setEncryptionStatus,
  createShare,
  revokeShare,
  updateModuleBackup,
} from '../store/slices/encryptionSlice';

interface UseEncryptionOptions {
  autoInitialize?: boolean;
}

export const useEncryption = (moduleId: string, options: UseEncryptionOptions = {}) => {
  const dispatch = useAppDispatch();
  const moduleState = useAppSelector(selectModuleEncryption(moduleId));
  const isEncrypted = useAppSelector(selectIsModuleEncrypted(moduleId));
  const activeShares = useAppSelector(selectActiveSharesForModule(moduleId));

  const { autoInitialize = true } = options;

  // Auto-initialize module if needed
  useEffect(() => {
    if (autoInitialize && !moduleState) {
      dispatch(initializeModule({
        moduleId,
        isEnabled: false, // Default to disabled until user opts in
      }));
    }
  }, [moduleId, moduleState, autoInitialize, dispatch]);

  // Toggle encryption for the module
  const toggleEncryption = useCallback(async (enabled: boolean) => {
    try {
      // In real implementation, this would call the encryption service API
      // For now, just update the state
      dispatch(setEncryptionStatus({ moduleId, isEnabled: enabled }));
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return true;
    } catch (error) {
      console.error('Failed to toggle encryption:', error);
      return false;
    }
  }, [moduleId, dispatch]);

  // Create a share for items in this module
  const shareItems = useCallback(async (
    itemIds: string[],
    permissions: string[],
    expiresIn: '1h' | '24h' | '7d' | '30d'
  ) => {
    try {
      // Calculate expiration date
      const durations = {
        '1h': 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
      };
      
      const expiresAt = new Date(Date.now() + durations[expiresIn]).toISOString();
      const shareId = `share_${moduleId}_${Date.now()}`;
      
      dispatch(createShare({
        shareId,
        moduleId,
        itemIds,
        expiresAt,
        permissions,
      }));
      
      // In real implementation, this would call the API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return shareId;
    } catch (error) {
      console.error('Failed to create share:', error);
      throw error;
    }
  }, [moduleId, dispatch]);

  // Revoke a share
  const revokeShareById = useCallback(async (shareId: string) => {
    try {
      dispatch(revokeShare(shareId));
      
      // In real implementation, this would call the API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return true;
    } catch (error) {
      console.error('Failed to revoke share:', error);
      return false;
    }
  }, [dispatch]);

  // Create backup
  const createBackup = useCallback(async () => {
    try {
      // In real implementation, this would call the API and return a backup key
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const backupKey = `backup_${moduleId}_${Date.now()}`;
      
      dispatch(updateModuleBackup({
        moduleId,
        hasBackup: true,
        lastBackupDate: new Date().toISOString(),
      }));
      
      return backupKey;
    } catch (error) {
      console.error('Failed to create backup:', error);
      throw error;
    }
  }, [moduleId, dispatch]);

  // Encrypt data (mock implementation)
  const encrypt = useCallback(async <T = unknown>(data: T): Promise<T | EncryptedData> => {
    if (!isEncrypted) {
      return data; // Return unencrypted if module encryption is disabled
    }
    
    // In real implementation, this would use the encryption service
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      encrypted: true,
      data: btoa(JSON.stringify(data)), // Mock encryption with base64
      algorithm: 'AES-256-GCM',
      keyId: moduleState?.publicKeyId,
    };
  }, [isEncrypted, moduleState]);

  // Decrypt data (mock implementation)
  interface EncryptedData {
    encrypted: boolean;
    data: string;
    algorithm?: string;
    keyId?: string;
  }
  const decrypt = useCallback(async <T = unknown>(encryptedData: EncryptedData | T): Promise<T> => {
    if (!('encrypted' in encryptedData) || !encryptedData.encrypted) {
      return encryptedData as T;
    }
    
    // In real implementation, this would use the encryption service
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      return JSON.parse(atob(encryptedData.data)); // Mock decryption
    } catch (error) {
      console.error('Failed to decrypt data:', error);
      throw new Error('Decryption failed');
    }
  }, []);

  return {
    // State
    isInitialized: moduleState?.isInitialized || false,
    isEncrypted,
    hasBackup: moduleState?.hasBackup || false,
    lastBackupDate: moduleState?.lastBackupDate,
    activeShares,
    
    // Actions
    toggleEncryption,
    shareItems,
    revokeShare: revokeShareById,
    createBackup,
    encrypt,
    decrypt,
  };
};

// Hook for global encryption state
export const useEncryptionStatus = () => {
  const encryptionState = useAppSelector(state => state.encryption);
  
  const enabledModules = Object.entries(encryptionState.modules)
    .filter(([, module]) => module.isEnabled)
    .map(([moduleId]) => moduleId);
  
  const modulesNeedingBackup = Object.entries(encryptionState.modules)
    .filter(([, module]) => module.isEnabled && !module.hasBackup)
    .map(([moduleId]) => moduleId);
  
  return {
    isInitialized: encryptionState.initialized,
    isSettingUp: encryptionState.isSettingUp,
    enabledModules,
    modulesNeedingBackup,
    totalShares: Object.keys(encryptionState.activeShares).length,
  };
};
