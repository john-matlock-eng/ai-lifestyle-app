// Search Components
export { JournalSearchBar } from "./JournalSearchBar";
export { SearchResultsSummary } from "./SearchResultsSummary";
export { JournalSearchSettings } from "./JournalSearchSettings";

// Journal Display Components
export { default as JournalCard } from "./JournalCard";
export { default as JournalEntryDetail } from "./JournalEntryDetail";
export { JournalEntryRenderer } from "./JournalEntryRenderer";
export { JournalActions } from "./JournalActions";
export { JournalImporter } from "./JournalImporter";

// Enhanced Editor Components
export { EnhancedJournalEditor, SectionEditor } from "./EnhancedEditor";
export type {
  EnhancedJournalEditorProps,
  SectionEditorProps,
} from "./EnhancedEditor";

// Template Components
export { default as EnhancedTemplatePicker } from "./EnhancedTemplatePicker";
export { default as DraftManager } from "./DraftManager";
export { default as TemplatePickerTest } from "./TemplatePickerTest";
export { default as JournalEntryRendererDemo } from "./JournalEntryRendererDemo";

// Emotion Components
export {
  EmotionSelector,
  EmotionWheel,
  EmotionDrillDown,
} from "./EmotionSelector";
export type { Emotion } from "./EmotionSelector";

// Re-export types
export type {
  EnhancedTemplate,
  SectionDefinition,
  SectionResponse,
  JournalDraft,
} from "../types/enhanced-template.types";
