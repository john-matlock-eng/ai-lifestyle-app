// SharedJournalsPage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Share2,
  Users,
  Clock,
  ArrowLeft,
  Shield,
  ChevronRight,
  Calendar,
  FileText,
  X,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { Button } from "@/components/common";
import ShareManagement from "@/components/encryption/ShareManagement";
import apiClient from "@/api/client";
import type { JournalEntry } from "@/types/journal";

interface SharedJournal {
  entry: JournalEntry;
  shareInfo: {
    sharedAt: string;
    sharedBy?: string;
    permissions: string[];
    expiresAt?: string;
  };
  isIncoming: boolean; // true if shared with me, false if I shared it
}

export const SharedJournalsPage: React.FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<
    "all" | "shared-by-me" | "shared-with-me"
  >("all");
  const [showManagement, setShowManagement] = useState(false);

  // Fetch shared journals
  const {
    data: sharedJournals,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["journals", "shared", filter],
    queryFn: async () => {
      const response = await apiClient.get("/journal/shared", {
        params: { filter },
      });
      return response.data as SharedJournal[];
    },
  });

  const getShareStatus = (shareInfo: SharedJournal["shareInfo"]) => {
    if (shareInfo.expiresAt) {
      const expiresDate = new Date(shareInfo.expiresAt);
      if (expiresDate < new Date()) {
        return { text: "Expired", color: "text-gray-600" };
      }
      const hoursUntilExpiry =
        (expiresDate.getTime() - Date.now()) / (1000 * 60 * 60);
      if (hoursUntilExpiry < 24) {
        return { text: "Expiring soon", color: "text-orange-600" };
      }
    }
    return { text: "Active", color: "text-green-600" };
  };

  const getPermissionBadges = (permissions: string[]) => {
    const badges = permissions.map((permission) => {
      const labels: Record<string, { text: string; color: string }> = {
        read: { text: "View", color: "bg-blue-100 text-blue-700" },
        write: { text: "Edit", color: "bg-purple-100 text-purple-700" },
        share: { text: "Share", color: "bg-green-100 text-green-700" },
      };
      return (
        labels[permission] || {
          text: permission,
          color: "bg-gray-100 text-gray-700",
        }
      );
    });
    return badges;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
          <p className="text-muted mt-4">Loading shared journals...</p>
        </div>
      </div>
    );
  }

  const filteredJournals = sharedJournals || [];
  const sharedByMe = filteredJournals.filter((j) => !j.isIncoming);
  const sharedWithMe = filteredJournals.filter((j) => j.isIncoming);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/journal")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Journals
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-theme flex items-center gap-3">
                <Share2 className="w-7 h-7 text-accent" />
                Shared Journals
              </h1>
              <p className="text-sm text-muted mt-1">
                Manage your encrypted journal shares
              </p>
            </div>
          </div>

          <Button variant="outline" onClick={() => setShowManagement(true)}>
            <Users className="w-4 h-4 mr-2" />
            Manage All Shares
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-6 p-1 bg-surface rounded-lg w-fit">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              filter === "all"
                ? "bg-accent text-white"
                : "text-muted hover:text-theme"
            }`}
          >
            All Shares
          </button>
          <button
            onClick={() => setFilter("shared-by-me")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              filter === "shared-by-me"
                ? "bg-accent text-white"
                : "text-muted hover:text-theme"
            }`}
          >
            Shared by Me ({sharedByMe.length})
          </button>
          <button
            onClick={() => setFilter("shared-with-me")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              filter === "shared-with-me"
                ? "bg-accent text-white"
                : "text-muted hover:text-theme"
            }`}
          >
            Shared with Me ({sharedWithMe.length})
          </button>
        </div>

        {/* Shared Journals List */}
        {filteredJournals.length === 0 ? (
          <div className="text-center py-12 glass rounded-2xl">
            <Share2 className="w-12 h-12 text-muted mx-auto mb-4" />
            <h3 className="text-lg font-medium text-theme mb-2">
              No shared journals
            </h3>
            <p className="text-sm text-muted">
              {filter === "shared-by-me"
                ? "You haven't shared any journals yet"
                : filter === "shared-with-me"
                  ? "No journals have been shared with you"
                  : "Start sharing encrypted journals with others"}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {(filter === "all" || filter === "shared-by-me") &&
              sharedByMe.length > 0 && (
                <>
                  <h2 className="text-lg font-semibold text-theme mt-4 flex items-center gap-2">
                    <Share2 className="w-5 h-5" />
                    Shared by Me
                  </h2>
                  {sharedByMe.map(({ entry, shareInfo }) => {
                    const status = getShareStatus(shareInfo);
                    return (
                      <div
                        key={entry.entryId}
                        className="glass rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer"
                        onClick={() => navigate(`/journal/${entry.entryId}`)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-start gap-3">
                              <Shield className="w-5 h-5 text-green-600 mt-1" />
                              <div className="flex-1">
                                <h3 className="font-semibold text-theme mb-1">
                                  {entry.title}
                                </h3>
                                <div className="flex items-center gap-4 text-xs text-muted mb-2">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    Created{" "}
                                    {format(
                                      new Date(entry.createdAt),
                                      "MMM d, yyyy",
                                    )}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    Shared{" "}
                                    {formatDistanceToNow(
                                      new Date(shareInfo.sharedAt),
                                      { addSuffix: true },
                                    )}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <FileText className="w-3 h-3" />
                                    {entry.wordCount} words
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="flex items-center gap-1 text-xs">
                                    <Users className="w-3 h-3" />
                                    Shared with {entry.sharedWith?.length ||
                                      0}{" "}
                                    people
                                  </span>
                                  <span
                                    className={`text-xs font-medium ${status.color}`}
                                  >
                                    • {status.text}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted" />
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

            {(filter === "all" || filter === "shared-with-me") &&
              sharedWithMe.length > 0 && (
                <>
                  <h2 className="text-lg font-semibold text-theme mt-6 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Shared with Me
                  </h2>
                  {sharedWithMe.map(({ entry, shareInfo }) => {
                    const status = getShareStatus(shareInfo);
                    const permissionBadges = getPermissionBadges(
                      shareInfo.permissions,
                    );

                    return (
                      <div
                        key={entry.entryId}
                        className="glass rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer"
                        onClick={() => navigate(`/journal/${entry.entryId}`)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-start gap-3">
                              <Shield className="w-5 h-5 text-blue-600 mt-1" />
                              <div className="flex-1">
                                <h3 className="font-semibold text-theme mb-1">
                                  {entry.title}
                                </h3>
                                <div className="flex items-center gap-4 text-xs text-muted mb-2">
                                  <span>
                                    Shared by {shareInfo.sharedBy || "Unknown"}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatDistanceToNow(
                                      new Date(shareInfo.sharedAt),
                                      { addSuffix: true },
                                    )}
                                  </span>
                                  <span
                                    className={`font-medium ${status.color}`}
                                  >
                                    {status.text}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                  {permissionBadges.map((badge, idx) => (
                                    <span
                                      key={idx}
                                      className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}
                                    >
                                      {badge.text}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted" />
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
          </div>
        )}

        {/* Security Notice */}
        <div className="mt-8 p-6 bg-accent/10 rounded-xl">
          <div className="flex items-start gap-3">
            <Shield className="w-6 h-6 text-accent mt-0.5" />
            <div>
              <h3 className="font-semibold text-theme mb-2">
                End-to-End Encryption
              </h3>
              <p className="text-sm text-muted">
                All shared journals remain encrypted. Only authorized recipients
                with the correct decryption keys can access the content. Share
                access can be revoked at any time.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Share Management Modal */}
      {showManagement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Manage All Shares</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowManagement(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <ShareManagement
              itemType="journal"
              onShareRevoked={() => refetch()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SharedJournalsPage;
