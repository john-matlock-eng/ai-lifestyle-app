import React, { useState } from "react";
import { Shield, ShieldOff, Info } from "lucide-react";

interface EncryptionToggleProps {
  value: boolean;
  onChange: (encrypted: boolean) => void;
  moduleId: string;
  disabled?: boolean;
  showInfo?: boolean;
  className?: string;
}

export const EncryptionToggle: React.FC<EncryptionToggleProps> = ({
  value,
  onChange,
  moduleId,
  disabled = false,
  showInfo = true,
  className = "",
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleToggle = () => {
    if (!disabled) {
      onChange(!value);
    }
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label={`${value ? "Disable" : "Enable"} encryption for ${moduleId}`}
        onClick={handleToggle}
        disabled={disabled}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors
          ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
          ${value ? "bg-[var(--accent)]" : "bg-[var(--surface-muted)]"}
        `}
      >
        <span
          className={`
            ${value ? "translate-x-6" : "translate-x-1"}
            inline-block h-4 w-4 transform rounded-full bg-[var(--surface)] transition-transform
          `}
        />
      </button>

      <div className="flex items-center gap-2">
        {value ? (
          <Shield className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
        ) : (
          <ShieldOff
            className="h-5 w-5 text-[var(--text-muted)]"
            aria-hidden="true"
          />
        )}

        <span
          className={`text-sm font-medium ${value ? "text-[var(--text)]" : "text-[var(--text-muted)]"}`}
        >
          {value ? "Encrypted" : "Not encrypted"}
        </span>
      </div>

      {showInfo && (
        <div className="relative">
          <button
            type="button"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onFocus={() => setShowTooltip(true)}
            onBlur={() => setShowTooltip(false)}
            className="text-[var(--text-muted)] hover:text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg)] rounded"
            aria-label="Encryption information"
          >
            <Info className="h-4 w-4" />
          </button>

          {showTooltip && (
            <div
              role="tooltip"
              className="absolute z-10 w-64 px-3 py-2 text-sm text-white bg-[var(--tooltip-bg)] rounded-lg shadow-lg -top-2 left-6 transform -translate-y-full"
            >
              <div className="relative">
                <p>
                  When enabled, your {moduleId} data is encrypted locally before
                  being stored. Only you can decrypt this data with your
                  encryption key.
                </p>
                <div className="absolute w-2 h-2 bg-[var(--tooltip-bg)] transform rotate-45 -bottom-1 left-2" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
