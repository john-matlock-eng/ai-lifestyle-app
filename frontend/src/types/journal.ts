/**
 * TypeScript types for journal functionality
 * Matches backend models with camelCase property names
 */

export const JournalTemplate = {
  DAILY_REFLECTION: "daily_reflection",
  GRATITUDE: "gratitude",
  GOAL_PROGRESS: "goal_progress",
  MOOD_TRACKER: "mood_tracker",
  HABIT_TRACKER: "habit_tracker",
  CREATIVE_WRITING: "creative_writing",
  BLANK: "blank"
} as const;

export type JournalTemplate = typeof JournalTemplate[keyof typeof JournalTemplate];

export interface GoalProgress {
  goalId: string;
  progressValue?: number;
  notes?: string;
  completed: boolean;
}

export interface ShareAccess {
  shareId: string;
  permissions: string[];
  expiresAt: string | null;
}

export interface JournalEntry {
  // Identification
  entryId: string;
  userId: string;
  
  // Core Content
  title: string;
  content: string; // May be encrypted
  template: JournalTemplate;
  wordCount: number;
  
  // Organization
  tags: string[];
  mood?: string;
  
  // Goal Integration
  linkedGoalIds: string[];
  goalProgress: GoalProgress[];
  
  // Timestamps
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  
  // Privacy & Security
  isEncrypted: boolean;
  isShared: boolean;
  encryptedKey?: string; // Base64 encrypted content key
  encryptionIv?: string; // Base64 initialization vector
  sharedWith: string[]; // User IDs this entry is shared with
  
  // Share access info when accessing via share
  shareAccess?: ShareAccess;
}

export interface TemplateUsage {
  template: JournalTemplate;
  count: number;
  lastUsed?: string; // ISO string
}

export interface JournalStats {
  // Overall Statistics
  totalEntries: number;
  totalWords: number;
  
  // Streak Tracking
  currentStreak: number;
  longestStreak: number;
  lastEntryDate?: string; // ISO string
  
  // Goal Integration
  goalsTracked: number;
  goalsCompleted: number;
  
  // Template Usage
  templateUsage: TemplateUsage[];
  
  // Recent Activity
  entriesThisWeek: number;
  entriesThisMonth: number;
  averageWordsPerEntry: number;
}

export interface CreateJournalEntryRequest {
  title: string;
  content: string; // May be encrypted
  template?: JournalTemplate;
  wordCount?: number; // Required if content is encrypted
  
  tags?: string[];
  mood?: string;
  
  // Goal Integration
  linkedGoalIds?: string[];
  goalProgress?: GoalProgress[];
  
  // Privacy Settings
  isEncrypted: boolean;
  encryptedKey?: string; // Required if content is encrypted
  encryptionIv?: string; // Required if content is encrypted
  isShared?: boolean;
}

export interface UpdateJournalEntryRequest {
  title?: string;
  content?: string; // May be encrypted
  template?: JournalTemplate;
  wordCount?: number; // Required if content is encrypted
  
  tags?: string[];
  mood?: string;
  
  // Goal Integration
  linkedGoalIds?: string[];
  goalProgress?: GoalProgress[];
  
  // Privacy Settings
  isEncrypted?: boolean;
  encryptedKey?: string; // Required if content is encrypted
  encryptionIv?: string; // Required if content is encrypted
  isShared?: boolean;
}

export interface JournalListResponse {
  entries: JournalEntry[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ShareInfo {
  shareId: string;
  sharedAt: string;
  sharedBy?: string; // Email or user ID
  sharedWith?: string; // Email or user ID
  permissions: string[];
  expiresAt: string | null;
}

export interface SharedJournalItem {
  entry: JournalEntry;
  shareInfo: ShareInfo;
  isIncoming: boolean;
}

export interface SharedJournalsResponse {
  entries: (JournalEntry | SharedJournalItem)[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  filter: 'owned' | 'shared-with-me' | 'shared-by-me' | 'all';
}