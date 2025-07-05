import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Types
interface EncryptionModuleState {
  isEnabled: boolean;
  isInitialized: boolean;
  hasBackup: boolean;
  lastBackupDate?: string;
  publicKeyId?: string;
}

interface ShareState {
  id: string;
  moduleId: string;
  itemIds: string[];
  expiresAt: string;
  permissions: string[];
  createdAt: string;
}

interface EncryptionState {
  initialized: boolean;
  isSettingUp: boolean;
  modules: Record<string, EncryptionModuleState>;
  activeShares: Record<string, ShareState>;
  globalSettings: {
    autoBackupEnabled: boolean;
    backupReminderDays: number;
    shareExpirationDefault: '1h' | '24h' | '7d' | '30d';
  };
}

// Initial state
const initialState: EncryptionState = {
  initialized: false,
  isSettingUp: false,
  modules: {},
  activeShares: {},
  globalSettings: {
    autoBackupEnabled: true,
    backupReminderDays: 30,
    shareExpirationDefault: '7d',
  },
};

// Slice
const encryptionSlice = createSlice({
  name: 'encryption',
  initialState,
  reducers: {
    // Global initialization
    initializeEncryption: (state) => {
      state.initialized = true;
    },

    setSetupStatus: (state, action: PayloadAction<boolean>) => {
      state.isSettingUp = action.payload;
    },

    // Module management
    initializeModule: (
      state,
      action: PayloadAction<{
        moduleId: string;
        isEnabled: boolean;
        hasBackup?: boolean;
        publicKeyId?: string;
      }>
    ) => {
      const { moduleId, isEnabled, hasBackup = false, publicKeyId } = action.payload;
      state.modules[moduleId] = {
        isEnabled,
        isInitialized: true,
        hasBackup,
        publicKeyId,
      };
    },

    setEncryptionStatus: (
      state,
      action: PayloadAction<{
        moduleId: string;
        isEnabled: boolean;
      }>
    ) => {
      const { moduleId, isEnabled } = action.payload;
      if (state.modules[moduleId]) {
        state.modules[moduleId].isEnabled = isEnabled;
      }
    },

    updateModuleBackup: (
      state,
      action: PayloadAction<{
        moduleId: string;
        hasBackup: boolean;
        lastBackupDate?: string;
      }>
    ) => {
      const { moduleId, hasBackup, lastBackupDate } = action.payload;
      if (state.modules[moduleId]) {
        state.modules[moduleId].hasBackup = hasBackup;
        if (lastBackupDate) {
          state.modules[moduleId].lastBackupDate = lastBackupDate;
        }
      }
    },

    // Share management
    createShare: (
      state,
      action: PayloadAction<{
        shareId: string;
        moduleId: string;
        itemIds: string[];
        expiresAt: string;
        permissions: string[];
      }>
    ) => {
      const { shareId, moduleId, itemIds, expiresAt, permissions } = action.payload;
      state.activeShares[shareId] = {
        id: shareId,
        moduleId,
        itemIds,
        expiresAt,
        permissions,
        createdAt: new Date().toISOString(),
      };
    },

    revokeShare: (state, action: PayloadAction<string>) => {
      delete state.activeShares[action.payload];
    },

    cleanupExpiredShares: (state) => {
      const now = new Date().getTime();
      Object.entries(state.activeShares).forEach(([shareId, share]) => {
        if (new Date(share.expiresAt).getTime() < now) {
          delete state.activeShares[shareId];
        }
      });
    },

    // Global settings
    updateGlobalSettings: (
      state,
      action: PayloadAction<Partial<EncryptionState['globalSettings']>>
    ) => {
      state.globalSettings = {
        ...state.globalSettings,
        ...action.payload,
      };
    },

    // Reset
    resetEncryption: () => initialState,
  },
});

// Actions
export const {
  initializeEncryption,
  setSetupStatus,
  initializeModule,
  setEncryptionStatus,
  updateModuleBackup,
  createShare,
  revokeShare,
  cleanupExpiredShares,
  updateGlobalSettings,
  resetEncryption,
} = encryptionSlice.actions;

// Selectors
export const selectEncryptionState = (state: { encryption: EncryptionState }) => state.encryption;

export const selectModuleEncryption = (moduleId: string) => (state: { encryption: EncryptionState }) => 
  state.encryption.modules[moduleId] || null;

export const selectIsModuleEncrypted = (moduleId: string) => (state: { encryption: EncryptionState }) => 
  state.encryption.modules[moduleId]?.isEnabled || false;

export const selectActiveSharesForModule = (moduleId: string) => (state: { encryption: EncryptionState }) => 
  Object.values(state.encryption.activeShares).filter(share => share.moduleId === moduleId);

export const selectNeedsBackupReminder = (state: { encryption: EncryptionState }) => {
  const { modules, globalSettings } = state.encryption;
  const reminderThreshold = Date.now() - (globalSettings.backupReminderDays * 24 * 60 * 60 * 1000);
  
  return Object.entries(modules).some(([, module]) => {
    if (!module.isEnabled || !module.hasBackup) return false;
    if (!module.lastBackupDate) return true;
    return new Date(module.lastBackupDate).getTime() < reminderThreshold;
  });
};

// Reducer
export default encryptionSlice.reducer;
