import React, { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './index';
import { getEncryptionService } from '../services/encryption';
import apiClient from '../api/client';
import { EncryptionContext } from './EncryptionContextType';
import type { EncryptionContextValue } from './EncryptionContextType';
import type { UserProfile as BaseUserProfile } from '../features/auth/services/authService';

interface UserProfile extends BaseUserProfile {
  encryptionEnabled: boolean;
  encryptionSetupDate?: string;
  encryptionKeyId?: string;
}

interface EncryptionProviderProps {
  children: ReactNode;
}

export const EncryptionProvider: React.FC<EncryptionProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [isEncryptionSetup, setIsEncryptionSetup] = useState(false);
  const [isEncryptionLocked, setIsEncryptionLocked] = useState(true);
  const [encryptionKeyId, setEncryptionKeyId] = useState<string | null>(null);

  // Fetch user profile to check encryption status
  const { data: profile } = useQuery<UserProfile>({
    queryKey: ['userProfile', user?.userId],
    queryFn: async () => {
      const { data } = await apiClient.get<UserProfile>('/users/profile');
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