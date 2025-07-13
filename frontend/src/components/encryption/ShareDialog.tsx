import React, { useState } from 'react';
import { Share2, Shield, X, AlertCircle } from 'lucide-react';
import { getEncryptionService } from '../../services/encryption';
import apiClient from '../../api/client';

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

  const getExpirationHours = (duration: string): number => {
    const durations: Record<string, number> = {
      '1h': 1,
      '24h': 24,
      '7d': 7 * 24,
      '30d': 30 * 24,
    };
    return durations[duration] || 24;
  };

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
      const encryptionService = getEncryptionService();
      const tokens: ShareToken[] = [];

      // First, try to find the user by email
      let recipientUserId: string;
      try {
        const userResponse = await apiClient.get(`/users/by-email/${encodeURIComponent(recipientEmail)}`);
        recipientUserId = userResponse.data.userId;
      } catch {
        setError('User not found. Make sure they have an account and have set up encryption.');
        setIsSharing(false);
        return;
      }

      // Share each selected item
      for (const itemId of selectedItems) {
        const item = items.find(i => i.id === itemId);
        if (!item || !item.encrypted) continue;

        try {
          // Get the encrypted key for this item
          const entryResponse = await apiClient.get(`/journal/entries/${itemId}`);
          const entry = entryResponse.data;
          
          if (!entry.encryptedKey) {
            console.error('No encrypted key found for entry:', itemId);
            continue;
          }

          // Share with the recipient
          const shareResult = await encryptionService.shareWithUser(
            'journal',
            itemId,
            recipientUserId,
            entry.encryptedKey,
            getExpirationHours(expiresIn),
            permissions
          );

          tokens.push({
            id: shareResult.shareId,
            recipientEmail,
            permissions,
            expiresAt: new Date(Date.now() + getExpirationHours(expiresIn) * 60 * 60 * 1000).toISOString(),
          });
        } catch (err) {
          console.error('Failed to share item:', itemId, err);
        }
      }

      if (tokens.length > 0) {
        onShare(tokens);
        resetForm();
        onClose();
      } else {
        setError('Failed to create any shares. Please try again.');
      }
    } catch (err) {
      console.error('Share error:', err);
      setError('Failed to create share. Please try again.');
    } finally {
      setIsSharing(false);
    }
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
      <div className="bg-[var(--surface)] rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Share2 className="w-6 h-6 text-[var(--accent)]" />
            <h2 className="text-xl font-semibold text-[var(--text)]">Share Items</h2>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {error && (
            <div className="mb-4 flex items-start gap-2 p-3 bg-[var(--error-bg)] text-[var(--error)] rounded-md text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Items Selection */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-[var(--text-muted)] mb-3">
              Select items to share
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {items.map(item => (
                <label
                  key={item.id}
                  className="flex items-center gap-3 p-3 bg-[var(--surface-muted)] rounded-lg hover:bg-[var(--surface)] cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => toggleItemSelection(item.id)}
                    className="w-4 h-4 text-[var(--accent)] rounded focus:ring-[var(--accent)]"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--text)]">
                      {item.title}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {item.type} • {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {item.encrypted && (
                    <Shield className="w-4 h-4 text-[var(--success)]" />
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Recipient */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
              Share with
            </label>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="recipient@example.com"
              className="w-full px-3 py-2 border border-[var(--surface-muted)] rounded-md focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
            />
          </div>

          {/* Permissions */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-[var(--text-muted)] mb-3">
              Permissions
            </h3>
            <div className="flex gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={permissions.includes('read')}
                  onChange={() => togglePermission('read')}
                  className="w-4 h-4 text-[var(--accent)] rounded focus:ring-[var(--accent)]"
                />
                <span className="text-sm text-[var(--text-muted)]">Read</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={permissions.includes('write')}
                  onChange={() => togglePermission('write')}
                  className="w-4 h-4 text-[var(--accent)] rounded focus:ring-[var(--accent)]"
                />
                <span className="text-sm text-[var(--text-muted)]">Write</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={permissions.includes('share')}
                  onChange={() => togglePermission('share')}
                  className="w-4 h-4 text-[var(--accent)] rounded focus:ring-[var(--accent)]"
                />
                <span className="text-sm text-[var(--text-muted)]">Share</span>
              </label>
            </div>
          </div>

          {/* Expiration */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
              Expires in
            </label>
            <select
              value={expiresIn}
              onChange={(e) => setExpiresIn(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--surface-muted)] rounded-md focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
            >
              <option value="1h">1 hour</option>
              <option value="24h">24 hours</option>
              <option value="7d">7 days</option>
              <option value="30d">30 days</option>
            </select>
          </div>

          {/* Security Notice */}
          <div className="p-4 bg-[var(--accent-bg)] rounded-lg">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-[var(--accent)] mt-0.5" />
              <div className="text-sm text-[var(--text)]">
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
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-[var(--surface-muted)]">
          <button
            onClick={onClose}
            disabled={isSharing}
            className="px-4 py-2 text-[var(--text)] hover:bg-[var(--surface)] rounded-md transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleShare}
            disabled={isSharing || selectedItems.length === 0 || !recipientEmail}
            className="px-4 py-2 bg-[var(--accent)] text-white rounded-md hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
