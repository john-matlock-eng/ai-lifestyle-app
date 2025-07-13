import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../../features/auth/services/authService';
import type { UserProfile } from '../../features/auth/services/authService';
import MFASetupModal from '../../features/auth/components/MFASetupModal';
import Button from '../common/Button';
import { isApiError } from '../../api/client';

interface SecuritySectionProps {
  user: UserProfile;
}

const SecuritySection: React.FC<SecuritySectionProps> = ({ user }) => {
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const disableMfaMutation = useMutation({
    mutationFn: (password: string) => authService.disableMfa(password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setShowDisableConfirm(false);
      setPassword('');
      setError('');
    },
    onError: (error) => {
      if (isApiError(error)) {
        if (error.response?.status === 400) {
          setError('Incorrect password. Please try again.');
        } else {
          setError('Failed to disable 2FA. Please try again.');
        }
      }
    },
  });

  const handleSetupSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    setShowSetupModal(false);
  };

  const handleDisableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password) {
      disableMfaMutation.mutate(password);
    }
  };

  return (
    <div className="bg-[var(--surface)] shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-[var(--text)]">
          Security Settings
        </h3>
        
        {/* Two-Factor Authentication */}
        <div className="mt-6 border-t border-[color:var(--surface-muted)] pt-6">
          <div className="sm:flex sm:items-start sm:justify-between">
            <div>
              <h4 className="text-base font-medium text-[var(--text)]">
                Two-Factor Authentication
              </h4>
              <p className="mt-1 text-sm text-muted">
                Add an extra layer of security to your account by requiring a verification code in addition to your password.
              </p>
            </div>
            <div className="mt-5 sm:mt-0 sm:ml-6 sm:flex-shrink-0">
              {user.mfaEnabled ? (
                <div className="flex items-center space-x-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <svg className="mr-1.5 h-2 w-2 text-green-400" fill="currentColor" viewBox="0 0 8 8">
                      <circle cx="4" cy="4" r="3" />
                    </svg>
                    Enabled
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDisableConfirm(true)}
                  >
                    Disable
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setShowSetupModal(true)}
                >
                  Enable 2FA
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Login History */}
        <div className="mt-6 border-t border-[color:var(--surface-muted)] pt-6">
          <h4 className="text-base font-medium text-[var(--text)]">
            Recent Login Activity
          </h4>
          <p className="mt-1 text-sm text-muted">
            Monitor recent login attempts to your account.
          </p>
          <div className="mt-4">
            <Button variant="outline" size="sm">
              View Login History
            </Button>
          </div>
        </div>

        {/* Password */}
        <div className="mt-6 border-t border-[color:var(--surface-muted)] pt-6">
          <h4 className="text-base font-medium text-[var(--text)]">
            Password
          </h4>
          <p className="mt-1 text-sm text-muted">
            Keep your account secure by using a strong, unique password.
          </p>
          <div className="mt-4">
            <Button variant="outline" size="sm">
              Change Password
            </Button>
          </div>
        </div>
      </div>

      {/* MFA Setup Modal */}
      <MFASetupModal
        isOpen={showSetupModal}
        onClose={() => setShowSetupModal(false)}
        onSuccess={handleSetupSuccess}
      />

      {/* Disable MFA Confirmation Dialog */}
      {showDisableConfirm && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-black/60"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-[var(--surface)] rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-[var(--text)]">
                    Disable Two-Factor Authentication
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-[var(--text-muted)]">
                      Are you sure you want to disable two-factor authentication? This will make your account less secure.
                    </p>
                  </div>

                  <form onSubmit={handleDisableSubmit} className="mt-4">
                    <label htmlFor="password" className="block text-sm font-medium text-[var(--text)]">
                      Enter your password to confirm
                    </label>
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-1 block w-full border border-[var(--surface-muted)] rounded-md shadow-sm focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] bg-[var(--surface)] text-[var(--text)] sm:text-sm"
                      required
                    />
                    {error && (
                      <p className="mt-2 text-sm text-[var(--error)]">{error}</p>
                    )}
                  </form>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <Button
                  type="submit"
                  variant="danger"
                  onClick={handleDisableSubmit}
                  disabled={!password || disableMfaMutation.isPending}
                  isLoading={disableMfaMutation.isPending}
                  className="w-full sm:ml-3 sm:w-auto"
                >
                  Disable 2FA
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowDisableConfirm(false);
                    setPassword('');
                    setError('');
                  }}
                  className="mt-3 w-full sm:mt-0 sm:w-auto"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecuritySection;
