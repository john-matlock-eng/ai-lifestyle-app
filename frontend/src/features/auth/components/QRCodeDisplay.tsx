import React, { useState } from 'react';
import Button from '../../../components/common/Button';

interface QRCodeDisplayProps {
  qrCode: string;
  secret: string;
  onContinue: () => void;
  onBack: () => void;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  qrCode,
  secret,
  onContinue,
  onBack,
}) => {
  const [showSecret, setShowSecret] = useState(false);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm text-muted mb-4">
          Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
        </p>
        
        {/* QR Code Image */}
        <div className="inline-block p-4 bg-[var(--surface)] border-2 border-[color:var(--surface-muted)] rounded-lg">
          <img
            src={qrCode}
            alt="2FA QR Code"
            className="w-48 h-48"
          />
        </div>
      </div>

      {/* Manual Entry Option */}
      <div className="border-t pt-4">
        <button
          type="button"
          onClick={() => setShowSecret(!showSecret)}
          className="text-sm text-primary-600 hover:text-primary-500 font-medium"
        >
          Can't scan? Enter code manually
        </button>
        
        {showSecret && (
          <div className="mt-3 p-3 bg-[var(--surface-muted)] rounded-md">
            <p className="text-xs text-muted mb-2">
              Enter this secret key in your authenticator app:
            </p>
            <div className="flex items-center justify-between">
              <code className="text-sm font-mono bg-[var(--surface)] px-3 py-1 rounded border border-[color:var(--surface-muted)]">
                {secret}
              </code>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(secret)}
                className="ml-2 p-1 text-gray-400 hover:text-muted"
                title="Copy to clipboard"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Popular Authenticator Apps */}
      <div className="bg-blue-50 p-4 rounded-md">
        <h4 className="text-sm font-medium text-blue-900 mb-2">
          Recommended Authenticator Apps:
        </h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Google Authenticator</li>
          <li>• Microsoft Authenticator</li>
          <li>• Authy</li>
          <li>• 1Password</li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onContinue}>
          I've Added It
        </Button>
      </div>
    </div>
  );
};

export default QRCodeDisplay;
