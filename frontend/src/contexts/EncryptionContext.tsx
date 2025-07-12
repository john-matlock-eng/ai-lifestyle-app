import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../features/auth/contexts/AuthContext';
import { getEncryptionService } from '../services/encryption';
import apiClient from '../api/client';

interface EncryptionContextValue {
  isEncryptionEnabled: boolean;
  isEncryptionSetup: boolean;
  isEncryptionLocked: boolean;
  encryptionKeyId: string | null;
  unlockEncryption: (password: string) => Promise<void>;
  lockEncryption: () => void;
  checkEncryptionStatus: () => Promise<void>;
}

const EncryptionContext = createContext<EncryptionContextValue | undefined>(undefined);

export const useEncryption = () => {
  const context = useContext(EncryptionContext);
  if (!context) {
    throw new Error('useEncryption must be used within an EncryptionProvider');
  }
  return context;
};

interface EncryptionProviderProps {
  children: ReactNode;
}

export const EncryptionProvider: React.FC<EncryptionProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [isEncryptionSetup, setIsEncryptionSetup] = useState(false);
  const [isEncryptionLocked, setIsEncryptionLocked] = useState(true);
  const [encryptionKeyId, setEncryptionKeyId] = useState<string | null>(null);

  // Fetch user profile to check encryption status
  const { data: profile } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: async () => {
      const { data } = await apiClient.get('/users/profile');
      return data;
    },
    enabled: !!user,
  });

  // Check local encryption setup on mount and when profile changes
  useEffect(() => {
    if (profile) {
      checkEncryptionStatus();
    }
  }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps

  const checkEncryptionStatus = async () => {
    try {
      const encryptionService = getEncryptionService();
      const hasLocalSetup = await encryptionService.checkSetup();
      
      setIsEncryptionSetup(hasLocalSetup);
      
      if (hasLocalSetup) {
        // Get the key ID
        const keyId = await encryptionService.getPublicKeyId();
        setEncryptionKeyId(keyId);
        
        // If profile says encryption is enabled but we haven't unlocked yet
        if (profile?.encryptionEnabled && isEncryptionLocked) {
          // The user will need to unlock encryption
          setIsEncryptionLocked(true);
        } else if (hasLocalSetup && !isEncryptionLocked) {
          // Already unlocked
          setIsEncryptionLocked(false);
        }
      } else if (profile?.encryptionEnabled) {
        // Profile says encryption is enabled but no local setup
        // User needs to enter password to set up locally
        setIsEncryptionLocked(true);
      }
    } catch (error) {
      console.error('Failed to check encryption status:', error);
    }
  };

  const unlockEncryption = async (password: string) => {
    try {
      const encryptionService = getEncryptionService();
      await encryptionService.initialize(password);
      
      const keyId = await encryptionService.getPublicKeyId();
      setEncryptionKeyId(keyId);
      setIsEncryptionSetup(true);
      setIsEncryptionLocked(false);
    } catch (error) {
      console.error('Failed to unlock encryption:', error);
      throw error;
    }
  };

  const lockEncryption = () => {
    setIsEncryptionLocked(true);
  };

  const value: EncryptionContextValue = {
    isEncryptionEnabled: profile?.encryptionEnabled || false,
    isEncryptionSetup,
    isEncryptionLocked,
    encryptionKeyId,
    unlockEncryption,
    lockEncryption,
    checkEncryptionStatus,
  };

  return (
    <EncryptionContext.Provider value={value}>
      {children}
    </EncryptionContext.Provider>
  );
};

export default EncryptionProvider;