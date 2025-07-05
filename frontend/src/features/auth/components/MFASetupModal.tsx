import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/authService';
import QRCodeDisplay from './QRCodeDisplay';
import BackupCodesDisplay from './BackupCodesDisplay';
import SetupInstructions from './SetupInstructions';
import MfaCodeInput from './MfaCodeInput';
import Button from '../../../components/common/Button';
import { isApiError } from '../../../api/client';

interface MFASetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type SetupStep = 'instructions' | 'qrcode' | 'verify' | 'backup-codes';

const MFASetupModal: React.FC<MFASetupModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<SetupStep>('instructions');
  const [setupData, setSetupData] = useState<{
    secret: string;
    qrCode: string;
    backupCodes?: string[];
  } | null>(null);
  const [error, setError] = useState<string>('');

  // Setup MFA mutation
  const setupMutation = useMutation({
    mutationFn: authService.setupMfa,
    onSuccess: (data) => {
      setSetupData({
        secret: data.secret,
        qrCode: data.qrCodeUrl,
        backupCodes: data.backupCodes,
      });
      setStep('qrcode');
      setError('');
    },
    onError: (error) => {
      if (isApiError(error)) {
        if (error.response?.status === 409) {
          setError('Two-factor authentication is already enabled.');
        } else {
          setError(error.response?.data?.message || 'Failed to setup 2FA. Please try again.');
        }
      } else {
        setError('Unable to connect to the server. Please try again.');
      }
    },
  });

  // Verify setup mutation
  const verifyMutation = useMutation({
    mutationFn: authService.verifyMfaSetup,
    onSuccess: () => {
      setStep('backup-codes');
      setError('');
    },
    onError: (error) => {
      if (isApiError(error)) {
        setError('Invalid verification code. Please try again.');
      } else {
        setError('Unable to verify. Please try again.');
      }
    },
  });

  const handleStart = () => {
    setupMutation.mutate();
  };

  const handleVerify = (code: string) => {
    verifyMutation.mutate(code);
  };

  const handleComplete = () => {
    onSuccess();
    handleClose();
  };

  const handleClose = () => {
    setStep('instructions');
    setSetupData(null);
    setError('');
    onClose();
  };

  const renderStepContent = () => {
    switch (step) {
      case 'instructions':
        return (
          <>
            <SetupInstructions />
            <div className="mt-6 flex justify-end space-x-3">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleStart} isLoading={setupMutation.isPending}>
                Get Started
              </Button>
            </div>
          </>
        );

      case 'qrcode':
        return setupData ? (
          <>
            <QRCodeDisplay
              qrCode={setupData.qrCode}
              secret={setupData.secret}
              onContinue={() => setStep('verify')}
              onBack={() => setStep('instructions')}
            />
          </>
        ) : null;

      case 'verify':
        return (
          <>
            <div className="text-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                Verify Your Setup
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Enter the 6-digit code from your authenticator app to complete setup
              </p>
            </div>
            <MfaCodeInput
              onSubmit={handleVerify}
              onCancel={() => setStep('qrcode')}
              isLoading={verifyMutation.isPending}
              error={error}
            />
          </>
        );

      case 'backup-codes':
        return setupData?.backupCodes ? (
          <BackupCodesDisplay
            codes={setupData.backupCodes}
            onComplete={handleComplete}
          />
        ) : null;
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => {}}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 mb-4"
                >
                  {step === 'instructions' && 'Set Up Two-Factor Authentication'}
                  {step === 'qrcode' && 'Scan QR Code'}
                  {step === 'verify' && 'Verify Your Setup'}
                  {step === 'backup-codes' && 'Save Your Backup Codes'}
                </Dialog.Title>

                {error && step !== 'verify' && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                {renderStepContent()}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default MFASetupModal;
