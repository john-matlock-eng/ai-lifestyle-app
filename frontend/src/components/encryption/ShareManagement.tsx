import React, { useState, useEffect } from "react";
import {
  Share2,
  Shield,
  Clock,
  Users,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { getEncryptionService } from "../../services/encryption";
import { formatDistanceToNow } from "date-fns";

interface ShareData {
  shareId: string;
  itemType: string;
  itemId: string;
  recipientId: string;
  recipientName?: string;
  permissions: string[];
  createdAt: string;
  expiresAt?: string;
  accessCount: number;
  maxAccesses?: number;
  isActive: boolean;
}

interface ShareManagementProps {
  itemType?: string;
  onShareRevoked?: (shareId: string) => void;
}

const ShareManagement: React.FC<ShareManagementProps> = ({
  itemType,
  onShareRevoked,
}) => {
  const [shares, setShares] = useState<ShareData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedShare, setSelectedShare] = useState<ShareData | null>(null);
  const [isRevoking, setIsRevoking] = useState<string | null>(null);

  useEffect(() => {
    loadShares();
  }, [itemType]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadShares = async () => {
    try {
      setIsLoading(true);
      const encryptionService = getEncryptionService();
      const shareData = await encryptionService.getShares(itemType);
      // Map the API response to ShareData format
      const mappedShares: ShareData[] = shareData.map((share) => ({
        shareId: share.id,
        itemType: share.itemType,
        itemId: share.itemId,
        recipientId: share.recipientId,
        recipientName: undefined,
        permissions: [],
        createdAt: share.createdAt,
        expiresAt: share.expiresAt,
        accessCount: 0,
        maxAccesses: undefined,
        isActive: true,
      }));
      setShares(mappedShares);
    } catch (error) {
      console.error("Failed to load shares:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const revokeShare = async (shareId: string) => {
    if (
      !confirm(
        "Are you sure you want to revoke this share? The recipient will immediately lose access.",
      )
    ) {
      return;
    }

    try {
      setIsRevoking(shareId);
      const encryptionService = getEncryptionService();
      const success = await encryptionService.revokeShare(shareId);

      if (success) {
        setShares((prev) => prev.filter((s) => s.shareId !== shareId));
        onShareRevoked?.(shareId);
      }
    } catch (error) {
      console.error("Failed to revoke share:", error);
    } finally {
      setIsRevoking(null);
    }
  };

  const getShareStatus = (share: ShareData) => {
    if (!share.isActive)
      return { text: "Revoked", color: "text-[var(--error)]" };

    if (share.expiresAt) {
      const expiresDate = new Date(share.expiresAt);
      if (expiresDate < new Date()) {
        return { text: "Expired", color: "text-[var(--text-muted)]" };
      }
    }

    if (share.maxAccesses && share.accessCount >= share.maxAccesses) {
      return { text: "Used", color: "text-[var(--text-muted)]" };
    }

    return { text: "Active", color: "text-[var(--success)]" };
  };

  const getPermissionLabel = (permission: string) => {
    const labels: Record<string, string> = {
      read: "View",
      comment: "Comment",
      reshare: "Share",
    };
    return labels[permission] || permission;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (shares.length === 0) {
    return (
      <div className="text-center py-12">
        <Share2 className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
        <h3 className="text-lg font-medium text-[var(--text)] mb-2">
          No active shares
        </h3>
        <p className="text-sm text-[var(--text-muted)]">
          When you share encrypted items, they'll appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-[var(--text)]">
          Active Shares
        </h3>
        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <Shield className="w-4 h-4" />
          <span>
            {shares.length} active {shares.length === 1 ? "share" : "shares"}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {shares.map((share) => {
          const status = getShareStatus(share);
          const isExpiringSoon =
            share.expiresAt &&
            new Date(share.expiresAt).getTime() - Date.now() <
              24 * 60 * 60 * 1000;

          return (
            <div
              key={share.shareId}
              className="bg-[var(--surface)] border border-[var(--surface-muted)] rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Share2 className="w-5 h-5 text-[var(--accent)]" />
                    <h4 className="font-medium text-[var(--text)]">
                      {share.itemType} shared with{" "}
                      {share.recipientName || share.recipientId}
                    </h4>
                    <span className={`text-xs font-medium ${status.color}`}>
                      {status.text}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-[var(--text-muted)]">
                      <Clock className="w-4 h-4" />
                      <span>
                        Created{" "}
                        {formatDistanceToNow(new Date(share.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>

                    {share.expiresAt && (
                      <div
                        className={`flex items-center gap-2 ${isExpiringSoon ? "text-[var(--warning)]" : "text-[var(--text-muted)]"}`}
                      >
                        <Clock className="w-4 h-4" />
                        <span>
                          Expires{" "}
                          {formatDistanceToNow(new Date(share.expiresAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-[var(--text-muted)]">
                      <Users className="w-4 h-4" />
                      <span>
                        Permissions:{" "}
                        {share.permissions.map(getPermissionLabel).join(", ")}
                      </span>
                    </div>

                    {share.maxAccesses && (
                      <div className="flex items-center gap-2 text-[var(--text-muted)]">
                        <ExternalLink className="w-4 h-4" />
                        <span>
                          Accessed {share.accessCount} / {share.maxAccesses}{" "}
                          times
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {share.isActive && (
                  <button
                    onClick={() => revokeShare(share.shareId)}
                    disabled={isRevoking === share.shareId}
                    className="ml-4 p-2 text-[var(--error)] hover:bg-[var(--error-bg)] rounded-md transition-colors disabled:opacity-50"
                    title="Revoke share"
                  >
                    {isRevoking === share.shareId ? (
                      <div className="w-5 h-5 border-2 border-[var(--error)] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </button>
                )}
              </div>

              {selectedShare?.shareId === share.shareId && (
                <div className="mt-4 pt-4 border-t border-[var(--surface-muted)]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-[var(--text-muted)]">
                        Share ID:
                      </span>
                      <span className="ml-2 font-mono text-xs text-[var(--text)]">
                        {share.shareId}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)]">Item ID:</span>
                      <span className="ml-2 font-mono text-xs text-[var(--text)]">
                        {share.itemId}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() =>
                  setSelectedShare(
                    selectedShare?.shareId === share.shareId ? null : share,
                  )
                }
                className="mt-3 text-sm text-[var(--accent)] hover:text-[var(--accent)]/80 transition-colors"
              >
                {selectedShare?.shareId === share.shareId
                  ? "Hide details"
                  : "Show details"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ShareManagement;
