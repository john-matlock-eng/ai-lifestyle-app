import { useContext } from 'react';
import { EncryptionContext } from './EncryptionContextType';

export function useEncryption() {
  const context = useContext(EncryptionContext);
  if (!context) {
    throw new Error('useEncryption must be used within an EncryptionProvider');
  }
  return context;
}