import { createContext } from "react";

export interface EncryptionContextValue {
  isEncryptionEnabled: boolean;
  isEncryptionSetup: boolean;
  isEncryptionLocked: boolean;
  encryptionKeyId: string | null;
  isCheckingAutoUnlock: boolean;
  needsEncryptionReset: boolean;
  unlockEncryption: (password: string) => Promise<void>;
  lockEncryption: () => void;
  checkEncryptionStatus: () => Promise<void>;
  clearStoredPassword: () => void;
  resetEncryption: (password: string) => Promise<void>;
}

export const EncryptionContext = createContext<
  EncryptionContextValue | undefined
>(undefined);
