import { createContext } from 'react';

export interface EncryptionContextValue {
  isEncryptionEnabled: boolean;
  isEncryptionSetup: boolean;
  isEncryptionLocked: boolean;
  encryptionKeyId: string | null;
  unlockEncryption: (password: string) => Promise<void>;
  lockEncryption: () => void;
  checkEncryptionStatus: () => Promise<void>;
}

export const EncryptionContext = createContext<EncryptionContextValue | undefined>(undefined);