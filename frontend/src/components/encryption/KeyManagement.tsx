import React, { useState } from 'react';
import { Key, Download, Upload, Shield, AlertTriangle, Check, Copy } from 'lucide-react';

interface KeyManagementProps {
  hasBackup: boolean;
  lastBackupDate?: string;
  onBackup: () => Promise<void>;
  onRestore: (key: string) => Promise<void>;
  className?: string;
}

export const KeyManagement: React.FC<KeyManagementProps> = ({
  hasBackup,
  lastBackupDate,
  onBackup,
  onRestore,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'backup' | 'restore'>('backup');
  const [isProcessing, setIsProcessing] = useState(false);
  const [backupKey, setBackupKey] = useState<string | null>(null);
  const [restoreKey, setRestoreKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleBackup = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      await onBackup();
      // In real implementation, this would receive the backup key from the service
      const mockKey = `backup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setBackupKey(mockKey);
    } catch (err) {
      setError('Failed to create backup. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestore = async () => {
    if (!restoreKey.trim()) {
      setError('Please enter a backup key');
      return;
    }

    setIsProcessing(true);
    setError(null);
    try {
      await onRestore(restoreKey);
      setRestoreKey('');
      setActiveTab('backup');
    } catch (err) {
      setError('Invalid backup key. Please check and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyKey = async () => {
    if (backupKey) {
      await navigator.clipboard.writeText(backupKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadKey = () => {
    if (backupKey) {
      const element = document.createElement('a');
      const file = new Blob([backupKey], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `encryption-backup-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Key className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Encryption Key Management</h3>
            <p className="text-sm text-gray-600">Backup and restore your encryption keys</p>
          </div>
        </div>

        {/* Status Banner */}
        {hasBackup && lastBackupDate && (
          <div className="mb-6 p-4 bg-green-50 rounded-lg flex items-start gap-3">
            <Check className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">Backup exists</p>
              <p className="text-sm text-green-700">Last backup: {new Date(lastBackupDate).toLocaleDateString()}</p>
            </div>
          </div>
        )}

        {!hasBackup && (
          <div className="mb-6 p-4 bg-yellow-50 rounded-lg flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-900">No backup found</p>
              <p className="text-sm text-yellow-700">Create a backup to protect your encrypted data</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => setActiveTab('backup')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'backup'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Download className="inline h-4 w-4 mr-1" />
            Backup
          </button>
          <button
            onClick={() => setActiveTab('restore')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'restore'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Upload className="inline h-4 w-4 mr-1" />
            Restore
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Backup Tab */}
        {activeTab === 'backup' && (
          <div className="space-y-4">
            {!backupKey ? (
              <>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Before you backup:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Store your backup key in a secure location</li>
                    <li>• Never share your backup key with anyone</li>
                    <li>• Consider using a password manager</li>
                  </ul>
                </div>

                <button
                  onClick={handleBackup}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <Shield className="h-4 w-4" />
                      Create Backup Key
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="text-sm font-medium text-green-900 mb-2">Backup created successfully!</h4>
                  <p className="text-sm text-green-700 mb-3">Save this key securely. You'll need it to restore your encrypted data.</p>
                  
                  <div className="p-3 bg-white rounded border border-green-200 font-mono text-xs break-all">
                    {backupKey}
                  </div>
                  
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={handleCopyKey}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          Copy
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleDownloadKey}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setBackupKey(null)}
                  className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  Create another backup
                </button>
              </>
            )}
          </div>
        )}

        {/* Restore Tab */}
        {activeTab === 'restore' && (
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-700">
                  <p className="font-medium mb-1">Warning:</p>
                  <p>Restoring will replace your current encryption key. Make sure you have the correct backup key.</p>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="restore-key" className="block text-sm font-medium text-gray-700 mb-2">
                Enter backup key
              </label>
              <textarea
                id="restore-key"
                value={restoreKey}
                onChange={(e) => setRestoreKey(e.target.value)}
                placeholder="Paste your backup key here..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 font-mono text-sm"
                rows={3}
              />
            </div>

            <button
              onClick={handleRestore}
              disabled={isProcessing || !restoreKey.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>Processing...</>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Restore from Backup
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
