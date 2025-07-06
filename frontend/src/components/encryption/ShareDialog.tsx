import React, { useState } from 'react';
import { Share2, Shield, X, AlertCircle } from 'lucide-react';

interface ShareableItem {
  id: string;
  title: string;
  type: string;
  createdAt: string;
  encrypted: boolean;
}

interface ShareToken {
  id: string;
  recipientEmail: string;
  permissions: string[];
  expiresAt: string;
}

interface SharePermissions {
  read: boolean;
  write: boolean;
  share: boolean;
  delete?: boolean;
}

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  items: ShareableItem[];
  onShare: (tokens: ShareToken[]) => void;
}

const ShareDialog: React.FC<ShareDialogProps> = ({
  isOpen,
  onClose,
  items,
  onShare,
}) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [permissions, setPermissions] = useState<string[]>(['read']);
  const [expiresIn, setExpiresIn] = useState('24h');
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleShare = async () => {
    if (selectedItems.length === 0) {
      setError('Please select at least one item to share');
      return;
    }

    if (!recipientEmail || !recipientEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSharing(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      const tokens: ShareToken[] = selectedItems.map(itemId => ({
        id: `token-${itemId}-${Date.now()}`,
        recipientEmail,
        permissions,
        expiresAt: new Date(Date.now() + getExpirationMs()).toISOString(),
      }));

      onShare(tokens);
      resetForm();
      onClose();
    } catch {
      setError('Failed to create share. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  const getExpirationMs = () => {
    const durations: Record<string, number> = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    };
    return durations[expiresIn] || durations['24h'];
  };

  const resetForm = () => {
    setSelectedItems([]);
    setRecipientEmail('');
    setPermissions(['read']);
    setExpiresIn('24h');
    setError(null);
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const togglePermission = (permission: string) => {
    setPermissions(prev =>
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Share2 className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900">Share Items</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {error && (
            <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 text-red-800 rounded-md text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Items Selection */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Select items to share
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {items.map(item => (
                <label
                  key={item.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => toggleItemSelection(item.id)}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {item.title}
                    </p>
                    <p className="text-xs text-gray-600">
                      {item.type} • {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {item.encrypted && (
                    <Shield className="w-4 h-4 text-green-600" />
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Recipient */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Share with
            </label>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="recipient@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          {/* Permissions */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Permissions
            </h3>
            <div className="flex gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={permissions.includes('read')}
                  onChange={() => togglePermission('read')}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">Read</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={permissions.includes('write')}
                  onChange={() => togglePermission('write')}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">Write</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={permissions.includes('share')}
                  onChange={() => togglePermission('share')}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">Share</span>
              </label>
            </div>
          </div>

          {/* Expiration */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expires in
            </label>
            <select
              value={expiresIn}
              onChange={(e) => setExpiresIn(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="1h">1 hour</option>
              <option value="24h">24 hours</option>
              <option value="7d">7 days</option>
              <option value="30d">30 days</option>
            </select>
          </div>

          {/* Security Notice */}
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-purple-600 mt-0.5" />
              <div className="text-sm text-purple-800">
                <p className="font-medium mb-1">End-to-end encrypted</p>
                <p>
                  Shared items remain encrypted. Only the recipient with the
                  correct permissions can access them.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            disabled={isSharing}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleShare}
            disabled={isSharing || selectedItems.length === 0 || !recipientEmail}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSharing && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {isSharing ? 'Sharing...' : 'Share'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareDialog;
export type { ShareableItem, ShareToken, SharePermissions };
