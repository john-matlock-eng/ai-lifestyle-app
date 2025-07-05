import React, { useState } from 'react';
import { X, Share2, Clock, Users, Shield, Copy, Check } from 'lucide-react';

export interface ShareableItem {
  id: string;
  title: string;
  type: string;
  createdAt: string;
  encrypted: boolean;
}

export interface ShareToken {
  token: string;
  expiresAt: string;
  permissions: string[];
}

export interface SharePermissions {
  canView: boolean;
  canEdit: boolean;
  canShare: boolean;
  expiresIn: '1h' | '24h' | '7d' | '30d' | 'never';
}

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  items: ShareableItem[];
  onShare: (tokens: ShareToken[]) => void;
  maxShareDuration?: string;
}

export const ShareDialog: React.FC<ShareDialogProps> = ({
  isOpen,
  onClose,
  items,
  onShare,
  maxShareDuration = '30d',
}) => {
  const [permissions, setPermissions] = useState<SharePermissions>({
    canView: true,
    canEdit: false,
    canShare: false,
    expiresIn: '7d',
  });
  const [isSharing, setIsSharing] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleShare = async () => {
    setIsSharing(true);
    try {
      // Simulate API call - in real implementation, this would call the encryption service
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock share tokens
      const tokens: ShareToken[] = items.map(item => ({
        token: `share_${item.id}_${Date.now()}`,
        expiresAt: getExpirationDate(permissions.expiresIn),
        permissions: getPermissionsList(permissions),
      }));
      
      const mockShareLink = `https://app.ailifestyle.app/shared/${tokens[0].token}`;
      setShareLink(mockShareLink);
      
      onShare(tokens);
    } catch (error) {
      console.error('Failed to create share:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyLink = async () => {
    if (shareLink) {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getExpirationDate = (duration: string): string => {
    const now = new Date();
    const durations: Record<string, number> = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    };
    
    if (duration === 'never') {
      return new Date(now.getFullYear() + 100, 0, 1).toISOString();
    }
    
    return new Date(now.getTime() + durations[duration]).toISOString();
  };

  const getPermissionsList = (perms: SharePermissions): string[] => {
    const list = [];
    if (perms.canView) list.push('view');
    if (perms.canEdit) list.push('edit');
    if (perms.canShare) list.push('share');
    return list;
  };

  const expirationOptions = [
    { value: '1h', label: '1 hour' },
    { value: '24h', label: '24 hours' },
    { value: '7d', label: '7 days' },
    { value: '30d', label: '30 days' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
          <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              <span className="sr-only">Close</span>
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 sm:mx-0 sm:h-10 sm:w-10">
              <Share2 className="h-6 w-6 text-purple-600" />
            </div>
            
            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left flex-1">
              <h3 className="text-lg font-semibold leading-6 text-gray-900">
                Share {items.length === 1 ? 'Item' : `${items.length} Items`}
              </h3>
              
              {!shareLink ? (
                <>
                  <div className="mt-4">
                    <div className="mb-4 rounded-md bg-yellow-50 p-3">
                      <div className="flex">
                        <Shield className="h-5 w-5 text-yellow-400" />
                        <div className="ml-3">
                          <p className="text-sm text-yellow-800">
                            Shared items will be temporarily decrypted for the recipient.
                            {items.some(item => item.encrypted) && ' Your original data remains encrypted.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Clock className="inline h-4 w-4 mr-1" />
                          Share duration
                        </label>
                        <select
                          value={permissions.expiresIn}
                          onChange={(e) => setPermissions({
                            ...permissions,
                            expiresIn: e.target.value as any,
                          })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                        >
                          {expirationOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Users className="inline h-4 w-4 mr-1" />
                          Permissions
                        </label>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={permissions.canView}
                              disabled
                              className="h-4 w-4 rounded border-gray-300 text-purple-600"
                            />
                            <span className="ml-2 text-sm text-gray-700">Can view (required)</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={permissions.canEdit}
                              onChange={(e) => setPermissions({
                                ...permissions,
                                canEdit: e.target.checked,
                              })}
                              className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Can edit</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={permissions.canShare}
                              onChange={(e) => setPermissions({
                                ...permissions,
                                canShare: e.target.checked,
                              })}
                              className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Can reshare</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                    <button
                      type="button"
                      onClick={handleShare}
                      disabled={isSharing}
                      className="inline-flex w-full justify-center rounded-md bg-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSharing ? 'Creating share link...' : 'Create share link'}
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-3">
                      Share link created successfully! This link will expire {permissions.expiresIn === '1h' ? 'in 1 hour' : `in ${permissions.expiresIn}`}.
                    </p>
                    
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={shareLink}
                        className="flex-1 rounded-md border-gray-300 bg-gray-50 text-sm"
                      />
                      <button
                        onClick={handleCopyLink}
                        className="inline-flex items-center gap-1 rounded-md bg-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600"
                      >
                        {copied ? (
                          <>
                            <Check className="h-4 w-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 sm:mt-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="inline-flex w-full justify-center rounded-md bg-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600"
                    >
                      Done
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
