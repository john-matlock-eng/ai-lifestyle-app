import type { JournalTemplate } from "../types/template.types";

export interface SectionContent {
  id: string;
  markdown: string;
}

/**
 * Filter sections to those with defaultPrivacy === 'ai'.
 */
export function filterAiSections(
  template: JournalTemplate,
  sections: SectionContent[],
): SectionContent[] {
  const aiIds = new Set(
    template.sections.filter((s) => s.defaultPrivacy === "ai").map((s) => s.id),
  );
  return sections.filter((s) => aiIds.has(s.id));
}
