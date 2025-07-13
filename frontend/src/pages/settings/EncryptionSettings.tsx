import React, { useState, useEffect } from 'react';
import { Shield, Lock, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Button } from '../../components/common';
import { getEncryptionService } from '../../services/encryption';
import { useAuth } from '../../contexts';
import { useMutation, useQuery } from '@tanstack/react-query';
import apiClient from '../../api/client';
import type { UserProfile as BaseUserProfile } from '../../features/auth/services/authService';

interface UserProfile extends BaseUserProfile {
  encryptionEnabled: boolean;
  encryptionSetupDate?: string;
  encryptionKeyId?: string;
}

// Setup Wizard Component - Defined outside to prevent recreation
interface SetupWizardProps {
  setupStep: number;
  setSetupStep: (step: number) => void;
  masterPassword: string;
  setMasterPassword: (password: string) => void;
  confirmPassword: string;
  setConfirmPassword: (password: string) => void;
  setupError: string;
  setShowSetupWizard: (show: boolean) => void;
  handleSetupComplete: () => Promise<void>;
}

const SetupWizard: React.FC<SetupWizardProps> = ({
  setupStep,
  setSetupStep,
  masterPassword,
  setMasterPassword,
  confirmPassword,
  setConfirmPassword,
  setupError,
  setShowSetupWizard,
  handleSetupComplete,
}) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-lg max-w-md w-full p-6">
      <div className="flex items-center mb-4">
        <Shield className="h-8 w-8 text-blue-600 mr-3" />
        <h2 className="text-2xl font-bold">Set Up Encryption</h2>
      </div>

      {setupStep === 1 && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Important:</strong> Your master encryption password is separate from your login password. 
              Store it securely - you'll need it to decrypt your data on other devices.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">How it works:</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <span>Your journal entries will be encrypted before leaving your device</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <span>Only you can decrypt them with your master password</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <span>We cannot recover your data if you lose this password</span>
              </li>
            </ul>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setShowSetupWizard(false)}>
              Cancel
            </Button>
            <Button onClick={() => setSetupStep(2)}>
              Continue
            </Button>
          </div>
        </div>
      )}

      {setupStep === 2 && (
        <div className="space-y-4">
          <div>
            <label htmlFor="master-password" className="block text-sm font-medium text-gray-700 mb-1">
              Master Encryption Password
            </label>
            <input
              id="master-password"
              type="password"
              value={masterPassword}
              onChange={(e) => setMasterPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Enter a strong password"
              autoComplete="new-password"
            />
            <p className="text-xs text-gray-500 mt-1">
              Use a unique password you'll remember. Min 12 characters.
            </p>
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Confirm your password"
              autoComplete="new-password"
            />
          </div>

          {setupError && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-sm text-red-700">{setupError}</p>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <strong>Remember:</strong> This password cannot be recovered. Consider using a password manager.
            </p>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setSetupStep(1)}>
              Back
            </Button>
            <Button onClick={handleSetupComplete} disabled={!masterPassword || !confirmPassword}>
              Complete Setup
            </Button>
          </div>
        </div>
      )}
    </div>
  </div>
);

const EncryptionSettings: React.FC = () => {
  const { user } = useAuth();
  const [isSetup, setIsSetup] = useState(false);
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  // Setup wizard state
  const [masterPassword, setMasterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [setupStep, setSetupStep] = useState(1);
  const [setupError, setSetupError] = useState('');
  
  // Password prompt state
  const [unlockPassword, setUnlockPassword] = useState('');
  const [unlockError, setUnlockError] = useState('');

  // Check user profile for encryption status
  const { data: profile, refetch: refetchProfile } = useQuery<UserProfile>({
    queryKey: ['userProfile', user?.userId],
    queryFn: async () => {
      const response = await apiClient.get('/users/profile');
      // Handle both direct data and wrapped response
      if (response.data && typeof response.data === 'object' && 'body' in response.data) {
        // If response is wrapped with statusCode and body
        const parsed = typeof response.data.body === 'string' 
          ? JSON.parse(response.data.body) 
          : response.data.body;
        return parsed;
      }
      return response.data;
    },
    enabled: !!user,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      const { data } = await apiClient.put('/users/profile', updates);
      return data;
    },
    onSuccess: () => {
      refetchProfile();
    },
  });

  // Check local encryption setup
  useEffect(() => {
    const checkEncryption = async () => {
      try {
        console.log('Profile data:', profile); // Debug log
        const encryptionService = getEncryptionService();
        const hasLocalSetup = await encryptionService.checkSetup();
        setIsSetup(hasLocalSetup);

        // If profile says encryption is enabled but local setup is missing
        if (profile?.encryptionEnabled && !hasLocalSetup) {
          setShowPasswordPrompt(true);
        }
      } catch (error) {
        console.error('Failed to check encryption status:', error);
      }
    };
    
    if (profile) {
      checkEncryption();
    }
  }, [profile]);

  const handleSetupEncryption = async () => {
    if (masterPassword !== confirmPassword) {
      setSetupError('Passwords do not match');
      return;
    }

    if (masterPassword.length < 12) {
      setSetupError('Password must be at least 12 characters long');
      return;
    }

    try {
      const encryptionService = getEncryptionService();
      await encryptionService.initialize(masterPassword, user?.userId || '');
      
      // Update user profile
      const keyId = await encryptionService.getPublicKeyId();
      await updateProfileMutation.mutateAsync({
        encryptionEnabled: true,
        encryptionSetupDate: new Date().toISOString(),
        encryptionKeyId: keyId || undefined,
      });

      setIsSetup(true);
      setShowSetupWizard(false);
      setSetupStep(1);
      setMasterPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Setup failed:', error);
      setSetupError('Failed to set up encryption. Please try again.');
    }
  };

  const handleUnlock = async () => {
    try {
      const encryptionService = getEncryptionService();
      await encryptionService.initialize(unlockPassword, user?.userId || '');
      
      setIsSetup(true);
      setShowPasswordPrompt(false);
      setUnlockPassword('');
      setUnlockError('');
    } catch (error) {
      console.error('Unlock failed:', error);
      setUnlockError('Invalid password. Please try again.');
    }
  };

  const handleReset = async () => {
    try {
      const encryptionService = getEncryptionService();
      await encryptionService.reset();
      
      // Update profile
      await updateProfileMutation.mutateAsync({
        encryptionEnabled: false,
        encryptionSetupDate: undefined,
        encryptionKeyId: undefined,
      });

      setIsSetup(false);
      setShowResetConfirm(false);
      setShowPasswordPrompt(false);
    } catch (error) {
      console.error('Reset failed:', error);
    }
  };

  // Password Prompt Component
  const PasswordPrompt = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center mb-4">
          <Lock className="h-8 w-8 text-yellow-600 mr-3" />
          <h2 className="text-2xl font-bold">Unlock Encryption</h2>
        </div>

        <div className="space-y-4">
          <p className="text-gray-600">
            Your encryption is set up on another device. Enter your master password to access encrypted content.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Master Encryption Password
            </label>
            <input
              type="password"
              value={unlockPassword}
              onChange={(e) => setUnlockPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your master password"
              onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
            />
          </div>

          {unlockError && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-sm text-red-700">{unlockError}</p>
            </div>
          )}

          <div className="flex justify-between items-center">
            <button
              onClick={() => setShowResetConfirm(true)}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Forgot password?
            </button>
            <Button onClick={handleUnlock} disabled={!unlockPassword}>
              Unlock
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  // Reset Confirmation Component
  const ResetConfirmation = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center mb-4">
          <AlertTriangle className="h-8 w-8 text-red-600 mr-3" />
          <h2 className="text-2xl font-bold text-red-600">Reset Encryption?</h2>
        </div>

        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800 font-semibold mb-2">
              WARNING: This action cannot be undone!
            </p>
            <p className="text-sm text-red-700">
              Resetting encryption will permanently delete all encrypted journal entries. 
              You will lose access to any content that was encrypted with your current master password.
            </p>
          </div>

          <p className="text-gray-600 text-sm">
            Only proceed if you understand that all encrypted data will be lost.
          </p>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setShowResetConfirm(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              className="bg-red-600 hover:bg-red-700"
              onClick={handleReset}
            >
              Reset & Delete Encrypted Data
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h2 className="text-2xl font-bold">Encryption Settings</h2>
                <p className="text-gray-600">Manage your end-to-end encryption</p>
              </div>
            </div>
            {isSetup && (
              <div className="flex items-center text-green-600">
                <CheckCircle className="h-5 w-5 mr-2" />
                <span className="font-medium">Active</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {!isSetup && !profile?.encryptionEnabled && (
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Encryption Not Set Up</h3>
              <p className="text-gray-600 mb-4 max-w-md mx-auto">
                Enable end-to-end encryption to secure your journal entries. 
                Only you will be able to read encrypted content.
              </p>
              <Button onClick={() => setShowSetupWizard(true)} size="lg">
                Set Up Encryption
              </Button>
            </div>
          )}

          {isSetup && (
            <>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-green-800">Encryption is active</p>
                    <p className="text-sm text-green-700 mt-1">
                      Your journal entries are being encrypted before storage.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Encryption Details</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Encryption Type:</span>
                    <span className="font-medium">AES-256-GCM + RSA-4096</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Setup Date:</span>
                    <span className="font-medium">
                      {profile?.encryptionSetupDate 
                        ? new Date(profile.encryptionSetupDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : 'Unknown'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Key ID:</span>
                    <span className="font-mono text-xs">
                      {profile?.encryptionKeyId 
                        ? `${profile.encryptionKeyId.substring(0, 12)}...`
                        : 'Not available'}
                    </span>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Using encryption on another device?</p>
                      <p>Enter the same master password you used when setting up encryption.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h4 className="font-medium text-red-600 mb-2">Danger Zone</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Resetting encryption will permanently delete all encrypted entries.
                  </p>
                  <Button 
                    variant="outline" 
                    className="border-red-300 text-red-600 hover:bg-red-50"
                    onClick={() => setShowResetConfirm(true)}
                  >
                    Reset Encryption
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {showSetupWizard && (
        <SetupWizard
          setupStep={setupStep}
          setSetupStep={setSetupStep}
          masterPassword={masterPassword}
          setMasterPassword={setMasterPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          setupError={setupError}
          setShowSetupWizard={setShowSetupWizard}
          handleSetupComplete={handleSetupEncryption}
        />
      )}
      {showPasswordPrompt && <PasswordPrompt />}
      {showResetConfirm && <ResetConfirmation />}
    </div>
  );
};

export default EncryptionSettings;