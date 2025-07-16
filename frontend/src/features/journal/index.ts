// Re-export all components from the components barrel
export * from "./components";

// Re-export hooks
export * from "./hooks";

// Re-export services
export { journalStorage } from "./services/JournalStorageService";
export type {
  SearchFilters,
  SearchResult,
  JournalSettings,
} from "./services/JournalStorageService";

// Re-export templates
export { enhancedTemplates } from "./templates/enhanced-templates";

// Re-export utilities
export { purgeOldDrafts } from "./utils/drafts";
