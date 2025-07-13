// Enhanced template types that work with existing JournalEntry structure
import type { JournalTemplate as JournalTemplateEnum, GoalProgress } from '@/types/journal';

export interface EnhancedTemplate {
  id: JournalTemplateEnum;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  sections: SectionDefinition[];
  extractors?: {
    mood?: (responses: Record<string, SectionResponse>) => string | undefined;
    tags?: (responses: Record<string, SectionResponse>) => string[];
    goalProgress?: (responses: Record<string, SectionResponse>) => GoalProgress[];
  };
}

export interface SectionDefinition {
  id: string;
  title: string;
  prompt: string;
  type: 'text' | 'scale' | 'mood' | 'choice' | 'tags' | 'goals' | 'checklist' | 'emotions';
  required?: boolean;
  options?: {
    min?: number;
    max?: number;
    choices?: Array<{ value: string; label: string; icon?: string }>;
    moods?: Array<{ value: string; label: string; emoji: string }>;
    items?: Array<{ id: string; label: string }>;
    maxSelections?: number;
    mode?: 'wheel' | 'list' | 'both';
  };
}

export interface SectionResponse {
  sectionId: string;
  value: string | number | string[] | Record<string, boolean>;
  metadata?: {
    wordCount?: number;
    completedAt?: string;
  };
}

export interface JournalDraft {
  template: JournalTemplateEnum;
  title: string;
  sections: SectionResponse[];
  metadata: {
    startedAt: string;
    lastSavedAt: string;
    totalWordCount: number;
  };
}

// Utilities to convert between section-based editing and JournalEntry format
export const journalContentUtils = {
  // Convert section responses to markdown content
  sectionsToContent(template: EnhancedTemplate, sections: SectionResponse[]): string {
    return sections
      .map(section => {
        const sectionDef = template.sections.find(s => s.id === section.sectionId);
        if (!sectionDef) return '';
        
        let content = `## ${sectionDef.title}\n\n`;
        
        switch (sectionDef.type) {
          case 'text':
            content += section.value;
            break;
          case 'scale':
            content += `Rating: ${section.value}/${sectionDef.options?.max || 10}`;
            break;
          case 'mood': {
            const mood = sectionDef.options?.moods?.find(m => m.value === section.value);
            content += mood ? `${mood.emoji} ${mood.label}` : section.value;
            break;
          }
          case 'emotions': {
            const emotions = section.value as string[];
            content += `Emotions: ${emotions.join(', ')}`;
            break;
          }
          case 'choice': {
            const choice = sectionDef.options?.choices?.find(c => c.value === section.value);
            content += choice ? choice.label : section.value;
            break;
          }
          case 'tags':
            content += (section.value as string[]).map(tag => `#${tag}`).join(' ');
            break;
          case 'goals':
            content += 'Linked goals tracked in this entry';
            break;
          case 'checklist': {
            const items = section.value as Record<string, boolean>;
            content += Object.entries(items)
              .map(([item, checked]) => `- [${checked ? 'x' : ' '}] ${item}`)
              .join('\n');
            break;
          }
        }
        
        return content;
      })
      .filter(Boolean)
      .join('\n\n---\n\n');
  },
  
  // Parse content back to sections (for editing existing entries)
  contentToSections(template: EnhancedTemplate, content: string): SectionResponse[] {
    // This is a simplified parser - in production, you'd want more robust parsing
    const sections: SectionResponse[] = [];
    const contentSections = content.split('---').map(s => s.trim());
    
    contentSections.forEach(contentSection => {
      const lines = contentSection.split('\n');
      const titleLine = lines.find(line => line.startsWith('## '));
      if (!titleLine) return;
      
      const title = titleLine.replace('## ', '').trim();
      const sectionDef = template.sections.find(s => s.title === title);
      if (!sectionDef) return;
      
      // Extract the content after the title
      const contentStartIndex = lines.findIndex(line => line.startsWith('## ')) + 1;
      const sectionContent = lines.slice(contentStartIndex).join('\n').trim();
      
      // Parse based on section type
      let value: string | number | string[] | Record<string, boolean> = sectionContent;
      
      switch (sectionDef.type) {
        case 'scale': {
          const match = sectionContent.match(/Rating: (\d+)\//);
          value = match ? parseInt(match[1]) : 5;
          break;
        }
        case 'tags': {
          value = sectionContent.match(/#(\w+)/g)?.map(tag => tag.substring(1)) || [];
          break;
        }
        case 'checklist': {
          const checklistItems: Record<string, boolean> = {};
          sectionContent.split('\n').forEach(line => {
            const checkMatch = line.match(/- \[([ x])\] (.+)/);
            if (checkMatch) {
              checklistItems[checkMatch[2]] = checkMatch[1] === 'x';
            }
          });
          value = checklistItems;
          break;
        }
      }
      
      sections.push({
        sectionId: sectionDef.id,
        value,
        metadata: {
          wordCount: typeof value === 'string' ? value.split(/\s+/).filter(w => w).length : 0
        }
      });
    });
    
    return sections;
  }
};