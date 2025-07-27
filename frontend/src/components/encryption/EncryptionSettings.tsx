import React from "react";
import { Shield, Trash2 } from "lucide-react";
import { Button } from "../common";
import { useEncryption } from "../../contexts/useEncryption";
import { securePasswordStorage } from "../../services/encryption/securePasswordStorage";

export const EncryptionSettings: React.FC = () => {
  const { isEncryptionEnabled } = useEncryption();
  const [hasStoredPassword, setHasStoredPassword] = React.useState(false);

  React.useEffect(() => {
    // Check if password is stored
    setHasStoredPassword(securePasswordStorage.hasStoredPassword());
  }, []);

  const handleClearStoredPassword = () => {
    if (
      window.confirm(
        "Are you sure you want to clear the stored password? You will need to enter it again next time.",
      )
    ) {
      securePasswordStorage.clearStoredPassword();
      setHasStoredPassword(false);
    }
  };

  if (!isEncryptionEnabled) {
    return null;
  }

  return (
    <div className="bg-[var(--surface)] rounded-lg shadow p-6">
      <div className="flex items-center mb-4">
        <Shield className="h-6 w-6 text-[var(--accent)] mr-2" />
        <h2 className="text-xl font-semibold text-[var(--text)]">
          Encryption Settings
        </h2>
      </div>

      <div className="space-y-4">
        {/* Stored Password Management */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-medium mb-2">Password Storage</h3>

          {hasStoredPassword ? (
            <div className="bg-[var(--accent-bg)] border border-[var(--accent)]/20 rounded-lg p-4">
              <p className="text-sm text-[var(--text)] mb-3">
                Your master password is securely stored on this device. It will
                automatically expire after 30 days for security.
              </p>
              <Button
                variant="danger"
                size="sm"
                onClick={handleClearStoredPassword}
                className="flex items-center"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Stored Password
              </Button>
            </div>
          ) : (
            <div className="bg-[var(--surface-muted)] border border-[var(--surface-muted)] rounded-lg p-4">
              <p className="text-sm text-[var(--text)]">
                No password is stored on this device. You can choose to remember
                your password when unlocking encryption.
              </p>
            </div>
          )}
        </div>

        {/* Security Information */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-medium mb-2">Security Information</h3>
          <div className="space-y-2 text-sm text-[var(--text-muted)]">
            <p>• Stored passwords are encrypted using device-specific keys</p>
            <p>• Passwords expire automatically after 30 days</p>
            <p>• Clearing browser data will remove stored passwords</p>
            <p>• Each device stores its own password independently</p>
          </div>
        </div>
      </div>
    </div>
  );
};
