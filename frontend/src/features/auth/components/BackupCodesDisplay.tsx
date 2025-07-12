import React, { useState } from 'react';
import Button from '../../../components/common/Button';

interface BackupCodesDisplayProps {
  codes: string[];
  onComplete: () => void;
}

const BackupCodesDisplay: React.FC<BackupCodesDisplayProps> = ({
  codes,
  onComplete,
}) => {
  const [downloaded, setDownloaded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDownload = () => {
    const content = `AI Lifestyle App - Two-Factor Authentication Backup Codes
Generated on: ${new Date().toLocaleString()}

IMPORTANT: Keep these codes in a safe place. Each code can only be used once.

Your backup codes:
${codes.map((code, index) => `${index + 1}. ${code}`).join('\n')}

Use these codes if you lose access to your authenticator app.
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai-lifestyle-2fa-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    setDownloaded(true);
  };

  const handleCopy = async () => {
    const content = codes.join('\n');
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>2FA Backup Codes - AI Lifestyle App</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { font-size: 24px; margin-bottom: 10px; }
              .warning { background: #fef3c7; padding: 10px; margin: 20px 0; border: 1px solid #f59e0b; }
              .codes { margin: 20px 0; }
              .code { font-family: monospace; font-size: 14px; margin: 5px 0; padding: 5px; background: #f3f4f6; }
              @media print { .no-print { display: none; } }
            </style>
          </head>
          <body>
            <h1>Two-Factor Authentication Backup Codes</h1>
            <p>AI Lifestyle App - Generated on ${new Date().toLocaleString()}</p>
            <div class="warning">
              <strong>⚠️ Important:</strong> Keep these codes in a safe place. Each code can only be used once.
            </div>
            <div class="codes">
              ${codes.map((code, index) => `<div class="code">${index + 1}. ${code}</div>`).join('')}
            </div>
            <p>Use these codes if you lose access to your authenticator app.</p>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-6">
      {/* Warning Message */}
      <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-amber-800">
              Save Your Backup Codes
            </h3>
            <p className="mt-2 text-sm text-amber-700">
              Store these codes somewhere safe. You'll need them if you lose access to your authenticator app.
              Each code can only be used once.
            </p>
          </div>
        </div>
      </div>

      {/* Backup Codes Grid */}
      <div className="bg-[var(--surface-muted)] rounded-lg p-4">
        <div className="grid grid-cols-2 gap-3">
          {codes.map((code, index) => (
            <div
              key={index}
              className="bg-[var(--surface)] px-3 py-2 rounded border border-[color:var(--surface-muted)] font-mono text-sm text-center"
            >
              {code}
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          className="flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Download
          {downloaded && <span className="ml-1 text-green-600">✓</span>}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          {copied ? 'Copied!' : 'Copy All'}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handlePrint}
          className="flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
            />
          </svg>
          Print
        </Button>
      </div>

      {/* Confirmation */}
      <div className="border-t pt-6">
        <div className="flex items-start">
          <input
            type="checkbox"
            id="confirm-saved"
            className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-[color:var(--surface-muted)] rounded"
            onChange={() => {
              // Could track this state if needed
            }}
          />
          <label htmlFor="confirm-saved" className="ml-2 text-sm text-gray-700">
            I have saved my backup codes in a secure location
          </label>
        </div>

        <Button
          fullWidth
          className="mt-4"
          onClick={onComplete}
        >
          Complete Setup
        </Button>
      </div>
    </div>
  );
};

export default BackupCodesDisplay;
