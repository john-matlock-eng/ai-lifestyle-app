// enhanced-template-content-utils.ts
import type { EnhancedTemplate, SectionResponse } from '../types/enhanced-template.types';

/**
 * Enhanced utilities to convert between section-based editing and JournalEntry format
 * Uses custom markdown markers to preserve section structure
 */

// Section marker format: <!--SECTION:id:type:metadata-->
const SECTION_START_MARKER = '<!--SECTION:';
const SECTION_END_MARKER = '<!--/SECTION-->';
const SECTION_CONTENT_REGEX = /<!--SECTION:([^:]+):([^:]+):(.+?)-->([\s\S]*?)<!--\/SECTION-->/g;

export const enhancedJournalContentUtils = {
  /**
   * Convert section responses to markdown content with section markers
   */
  sectionsToContent(template: EnhancedTemplate, sections: SectionResponse[]): string {
    return sections
      .map(section => {
        const sectionDef = template.sections.find(s => s.id === section.sectionId);
        if (!sectionDef) return '';
        
        // Create section metadata
        const metadata = {
          title: sectionDef.title,
          type: sectionDef.type,
          ...(section.metadata || {})
        };
        
        // Start with section marker
        let content = `${SECTION_START_MARKER}${section.sectionId}:${sectionDef.type}:${JSON.stringify(metadata)}-->\n`;
        
        // Add section title for readability
        content += `## ${sectionDef.title}\n\n`;
        
        // Add section content based on type
        switch (sectionDef.type) {
          case 'text':
            content += section.value || '';
            break;
            
          case 'scale':
            content += `Rating: ${section.value}/${sectionDef.options?.max || 10}`;
            break;
            
          case 'mood': {
            const mood = sectionDef.options?.moods?.find(m => m.value === section.value);
            content += mood ? `${mood.emoji} ${mood.label}` : (section.value || '');
            break;
          }
          
          case 'emotions': {
            const emotions = Array.isArray(section.value) ? section.value : [];
            content += emotions.length > 0 ? `Emotions: ${emotions.join(', ')}` : '';
            break;
          }
          
          case 'choice': {
            const choice = sectionDef.options?.choices?.find(c => c.value === section.value);
            content += choice ? choice.label : (section.value || '');
            break;
          }
          
          case 'tags': {
            const tags = Array.isArray(section.value) ? section.value : [];
            content += tags.map(tag => `#${tag}`).join(' ');
            break;
          }
          
          case 'goals':
            content += 'Linked goals tracked in this entry';
            break;
            
          case 'checklist': {
            const items = section.value as Record<string, boolean>;
            const checklistContent = Object.entries(items)
              .map(([item, checked]) => `- [${checked ? 'x' : ' '}] ${item}`)
              .join('\n');
            content += checklistContent || '';
            break;
          }
        }
        
        // End with section marker
        content += `\n${SECTION_END_MARKER}`;
        
        return content;
      })
      .filter(Boolean)
      .join('\n\n---\n\n');
  },
  
  /**
   * Parse content with section markers back to sections
   */
  contentToSections(template: EnhancedTemplate, content: string): SectionResponse[] {
    const sections: SectionResponse[] = [];
    
    // Find all sections with markers
    let match;
    while ((match = SECTION_CONTENT_REGEX.exec(content)) !== null) {
      const [, sectionId, sectionType, metadataStr, sectionContent] = match;
      
      // Parse metadata
      let metadata = {};
      try {
        metadata = JSON.parse(metadataStr);
      } catch (e) {
        console.warn('Failed to parse section metadata:', e);
      }
      
      // Find the section definition
      const sectionDef = template.sections.find(s => s.id === sectionId);
      if (!sectionDef) {
        console.warn(`Section definition not found for ID: ${sectionId}`);
        continue;
      }
      
      // Clean the section content (remove the title line)
      const cleanContent = sectionContent
        .replace(/^## .+\n\n/, '') // Remove title
        .trim();
      
      // Parse the value based on section type
      let value: string | number | string[] | Record<string, boolean> = cleanContent;
      
      switch (sectionType) {
        case 'scale': {
          const ratingMatch = cleanContent.match(/Rating: (\d+)\//);
          value = ratingMatch ? parseInt(ratingMatch[1]) : 5;
          break;
        }
        
        case 'mood': {
          // Extract mood value from emoji + label format or plain text
          const moodMatch = cleanContent.match(/^[^\s]+ (.+)$/);
          if (moodMatch) {
            // Find mood by label
            const mood = sectionDef.options?.moods?.find(m => m.label === moodMatch[1]);
            value = mood?.value || cleanContent;
          } else {
            value = cleanContent;
          }
          break;
        }
        
        case 'emotions': {
          const emotionsMatch = cleanContent.match(/^Emotions: (.+)$/);
          if (emotionsMatch) {
            value = emotionsMatch[1].split(', ').filter(e => e);
          } else {
            value = [];
          }
          break;
        }
        
        case 'tags': {
          const tags = cleanContent.match(/#(\w+)/g);
          value = tags ? tags.map(tag => tag.substring(1)) : [];
          break;
        }
        
        case 'checklist': {
          const checklistItems: Record<string, boolean> = {};
          cleanContent.split('\n').forEach(line => {
            const checkMatch = line.match(/- \[([ x])\] (.+)/);
            if (checkMatch) {
              checklistItems[checkMatch[2]] = checkMatch[1] === 'x';
            }
          });
          value = checklistItems;
          break;
        }
        
        case 'choice': {
          // Try to find the choice by label
          const choice = sectionDef.options?.choices?.find(c => c.label === cleanContent);
          value = choice?.value || cleanContent;
          break;
        }
        
        case 'goals':
          // Goals are handled separately through linkedGoalIds
          value = [];
          break;
          
        case 'text':
        default:
          value = cleanContent;
          break;
      }
      
      sections.push({
        sectionId,
        value,
        metadata: {
          ...metadata,
          wordCount: typeof value === 'string' ? value.split(/\s+/).filter(w => w).length : 0
        }
      });
    }
    
    // If no sections found with markers, fall back to legacy parsing
    if (sections.length === 0) {
      console.warn('No section markers found, attempting legacy parsing');
      return legacyContentToSections(template, content);
    }
    
    return sections;
  }
};

/**
 * Legacy parser for content without section markers
 * Used as fallback for older entries
 */
function legacyContentToSections(template: EnhancedTemplate, content: string): SectionResponse[] {
  const sections: SectionResponse[] = [];
  const contentSections = content.split('---').map(s => s.trim());
  
  contentSections.forEach(contentSection => {
    const lines = contentSection.split('\n');
    const titleLine = lines.find(line => line.startsWith('## '));
    if (!titleLine) return;
    
    const title = titleLine.replace('## ', '').trim();
    const sectionDef = template.sections.find(s => s.title === title);
    if (!sectionDef) return;
    
    const contentStartIndex = lines.findIndex(line => line.startsWith('## ')) + 1;
    const sectionContent = lines.slice(contentStartIndex).join('\n').trim();
    
    let value: string | number | string[] | Record<string, boolean> = sectionContent;
    
    // Parse based on section type (simplified version)
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

/**
 * Check if content has section markers
 */
export function hasEnhancedSectionMarkers(content: string): boolean {
  return content.includes(SECTION_START_MARKER);
}

/**
 * Migrate legacy content to enhanced format
 */
export function migrateToEnhancedFormat(
  template: EnhancedTemplate, 
  content: string
): string {
  // Parse using legacy method
  const sections = legacyContentToSections(template, content);
  
  // Convert back using enhanced format
  return enhancedJournalContentUtils.sectionsToContent(template, sections);
}