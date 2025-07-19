// JournalActions.tsx
import React from "react";
import {
  MoreVertical,
  Share2,
  Brain,
  Users,
  Lock,
  Download,
  Copy,
} from "lucide-react";
import { Menu } from "@headlessui/react";
import type { JournalEntry } from "@/types/journal";

interface JournalActionsProps {
  entry: JournalEntry;
  onShare: () => void;
  onAIAnalyze: () => void;
  onManageShares: () => void;
  onExport?: () => void;
  onDuplicate?: () => void;
}

export const JournalActions: React.FC<JournalActionsProps> = ({
  entry,
  onShare,
  onAIAnalyze,
  onManageShares,
  onExport,
  onDuplicate,
}) => {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button className="inline-flex items-center justify-center p-2 text-sm font-medium text-theme hover:bg-surface-muted rounded-lg transition-colors">
        <MoreVertical className="w-5 h-5" />
      </Menu.Button>

      <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right bg-surface rounded-lg shadow-lg border border-surface-muted focus:outline-none z-10">
        <div className="py-1">
          <Menu.Item>
            {({ active }) => (
              <button
                className={`${
                  active ? "bg-surface-muted" : ""
                } flex items-center gap-3 px-4 py-2 text-sm text-theme w-full hover:text-accent transition-colors`}
                onClick={onShare}
              >
                <Share2 className="w-4 h-4" />
                Share with User
              </button>
            )}
          </Menu.Item>

          <Menu.Item>
            {({ active }) => (
              <button
                className={`${
                  active ? "bg-surface-muted" : ""
                } flex items-center gap-3 px-4 py-2 text-sm text-theme w-full hover:text-accent transition-colors`}
                onClick={onAIAnalyze}
              >
                <Brain className="w-4 h-4" />
                AI Analysis
              </button>
            )}
          </Menu.Item>

          {entry.sharedWith && entry.sharedWith.length > 0 && (
            <Menu.Item>
              {({ active }) => (
                <button
                  className={`${
                    active ? "bg-surface-muted" : ""
                  } flex items-center gap-3 px-4 py-2 text-sm text-theme w-full hover:text-accent transition-colors`}
                  onClick={onManageShares}
                >
                  <Users className="w-4 h-4" />
                  Manage Shares ({entry.sharedWith.length})
                </button>
              )}
            </Menu.Item>
          )}

          <div className="h-px bg-surface-muted my-1" />

          {onExport && (
            <Menu.Item>
              {({ active }) => (
                <button
                  className={`${
                    active ? "bg-surface-muted" : ""
                  } flex items-center gap-3 px-4 py-2 text-sm text-theme w-full hover:text-accent transition-colors`}
                  onClick={onExport}
                >
                  <Download className="w-4 h-4" />
                  Export Entry
                </button>
              )}
            </Menu.Item>
          )}

          {onDuplicate && (
            <Menu.Item>
              {({ active }) => (
                <button
                  className={`${
                    active ? "bg-surface-muted" : ""
                  } flex items-center gap-3 px-4 py-2 text-sm text-theme w-full hover:text-accent transition-colors`}
                  onClick={onDuplicate}
                >
                  <Copy className="w-4 h-4" />
                  Duplicate Entry
                </button>
              )}
            </Menu.Item>
          )}

          <div className="h-px bg-surface-muted my-1" />

          <div className="px-4 py-2">
            <div className="flex items-center gap-2 text-xs text-muted">
              <Lock className="w-3 h-3" />
              <span>End-to-end encrypted</span>
            </div>
          </div>
        </div>
      </Menu.Items>
    </Menu>
  );
};
