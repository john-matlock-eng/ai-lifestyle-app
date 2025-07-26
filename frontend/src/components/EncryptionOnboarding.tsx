import React, { useState } from "react";
import { Shield, Lock, X, ChevronRight, Eye } from "lucide-react";
import { Button } from "./common";
import { useNavigate } from "react-router-dom";
import { useEncryption } from "../contexts/useEncryption";

interface EncryptionOnboardingProps {
  onDismiss?: () => void;
  variant?: "banner" | "modal";
}

export const EncryptionOnboarding: React.FC<EncryptionOnboardingProps> = ({
  onDismiss,
  variant = "banner",
}) => {
  const navigate = useNavigate();
  const { isEncryptionEnabled } = useEncryption();
  const [showDetails, setShowDetails] = useState(false);

  // Don't show if encryption is already enabled
  if (isEncryptionEnabled) {
    return null;
  }

  const handleSetupClick = () => {
    navigate("/settings", { state: { openEncryption: true } });
  };

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss();
    }
  };

  if (variant === "banner") {
    return (
      <div className="bg-[var(--accent-bg)] border-b border-[var(--accent)]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between flex-wrap">
            <div className="flex items-center flex-1">
              <Shield className="h-5 w-5 text-[var(--accent)] mr-3 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--text)]">
                  Secure your journal entries with end-to-end encryption
                </p>
                {showDetails && (
                  <p className="text-sm text-[var(--text-muted)] mt-1">
                    Your entries will be encrypted before leaving your device.
                    Only you can decrypt them with your master password.
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2 mt-2 sm:mt-0">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] px-2 py-1"
              >
                {showDetails ? "Less info" : "Learn more"}
              </button>
              <Button
                size="sm"
                onClick={handleSetupClick}
                className="flex items-center"
              >
                Set up encryption
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
              {onDismiss && (
                <button
                  onClick={handleDismiss}
                  className="text-[var(--accent)] hover:text-[var(--accent-hover)] p-1"
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Modal variant
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-[var(--surface)] rounded-lg max-w-md w-full p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-[var(--accent)] mr-3" />
            <div>
              <h2 className="text-xl font-bold text-[var(--text)]">Protect Your Privacy</h2>
              <p className="text-sm text-[var(--text-muted)]">
                Set up encryption for your journal
              </p>
            </div>
          </div>
          {onDismiss && (
            <button
              onClick={handleDismiss}
              className="text-[var(--text-muted)] hover:text-[var(--text)]"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-[var(--accent-bg)] rounded-lg p-4">
            <h3 className="font-semibold text-[var(--accent)] mb-2">
              Why use encryption?
            </h3>
            <ul className="space-y-2 text-sm text-[var(--text)]">
              <li className="flex items-start">
                <Lock className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
                <span>
                  Your journal entries are encrypted before leaving your device
                </span>
              </li>
              <li className="flex items-start">
                <Eye className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
                <span>
                  Only you can read your entries with your master password
                </span>
              </li>
              <li className="flex items-start">
                <Shield className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
                <span>We cannot access or recover your encrypted data</span>
              </li>
            </ul>
          </div>

          <div className="bg-[var(--warning-bg)] border border-[var(--warning)] rounded-lg p-3">
            <p className="text-sm text-[var(--warning)]">
              <strong>Important:</strong> You'll create a master password
              separate from your login password. Store it safely - we cannot
              recover encrypted entries if you forget it.
            </p>
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              onClick={handleDismiss}
              className="text-[var(--text-muted)] hover:text-[var(--text)]"
            >
              Maybe later
            </button>
            <Button onClick={handleSetupClick} className="flex items-center">
              Set up encryption
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
