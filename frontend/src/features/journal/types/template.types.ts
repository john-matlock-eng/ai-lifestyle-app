export interface SectionDefinition {
  id: string;
  title: string;
  prompt: string;
  type?: string;
  defaultPrivacy?: 'private' | 'ai' | 'shared' | 'public';
  aiPrompt?: string;
}

export interface JournalTemplate {
  id: string;
  name: string;
  description?: string;
  version: number;
  sections: SectionDefinition[];
}
