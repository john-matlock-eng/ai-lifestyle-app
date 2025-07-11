export interface AiClient {
  /** Section-level reflection (prompted by section.aiPrompt) */
  reflect(input: {
    entryId: string;
    sectionId: string;
    text: string;
    prompt: string;
  }): Promise<{ reply: string }>;

  /** Entry-level mood / sentiment classification */
  analyzeMood(input: {
    entryId: string;
    markdown: string;
  }): Promise<{ emotions: Record<string, number> }>;

  /** Weekly digest summary */
  summarizeWeek(input: {
    userId: string;
    entries: { id: string; markdown: string }[];
  }): Promise<{ summary: string; highlights: string[] }>;
}
