// enhanced-template-content-utils.ts
import type { EnhancedTemplate, SectionResponse } from '../types/enhanced-template.types';

/**
 * Enhanced utilities to convert between section-based editing and JournalEntry format
 * Now supports both HTML and markdown section markers
 */

// HTML section format from saved entries
const HTML_SECTION_REGEX = /<!--SECTION:([^:]+):([^:]+):({.*?})-->([\s\S]*?)<!--\/SECTION-->/g;

// Markdown section format for new entries
const SECTION_START_MARKER = '<!--SECTION:';
const SECTION_END_MARKER = '<!--/SECTION-->';

export const enhancedJournalContentUtils = {
  /**
   * Convert section responses to HTML content with section markers
   */
  sectionsToContent(template: EnhancedTemplate, sections: SectionResponse[]): string {
    const htmlSections = sections
      .map(section => {
        const sectionDef = template.sections.find(s => s.id === section.sectionId);
        if (!sectionDef) return '';
        
        // Create section metadata
        const metadata = {
          title: sectionDef.title,
          type: sectionDef.type,
          completedAt: section.metadata?.completedAt || new Date().toISOString(),
          ...(section.metadata || {})
        };
        
        // Build HTML section
        let html = `${SECTION_START_MARKER}${section.sectionId}:${sectionDef.type}:${JSON.stringify(metadata)}-->\n`;
        html += `<h3>${sectionDef.title}</h3>\n`;
        
        // Add section content based on type
        switch (sectionDef.type) {
          case 'text':
            // For text content, wrap in div to preserve formatting
            html += `<div class="section-content">${section.value || ''}</div>`;
            break;
            
          case 'scale':
            html += `<p>Rating: ${section.value}/${sectionDef.options?.max || 10}</p>`;
            break;
            
          case 'mood': {
            const mood = sectionDef.options?.moods?.find(m => m.value === section.value);
            html += `<p>${mood ? `${mood.emoji} ${mood.label}` : (section.value || '')}</p>`;
            break;
          }
          
          case 'emotions': {
            const emotions = Array.isArray(section.value) ? section.value : [];
            if (emotions.length > 0) {
              html += `<p>Emotions: ${emotions.join(', ')}</p>`;
            }
            break;
          }
          
          case 'choice': {
            const choice = sectionDef.options?.choices?.find(c => c.value === section.value);
            html += `<p>${choice ? choice.label : (section.value || '')}</p>`;
            break;
          }
          
          case 'tags': {
            const tags = Array.isArray(section.value) ? section.value : [];
            if (tags.length > 0) {
              html += `<div class="tags">${tags.map(tag => `<span class="tag">#${tag}</span>`).join(' ')}</div>`;
            }
            break;
          }
          
          case 'goals':
            if (Array.isArray(section.value) && section.value.length > 0) {
              html += '<p>Linked goals tracked in this entry</p>';
            }
            break;
            
          case 'checklist': {
            const items = section.value as Record<string, boolean>;
            const checklistHtml = Object.entries(items)
              .map(([item, checked]) => 
                `<li>${checked ? '☑' : '☐'} ${item}</li>`
              )
              .join('\n');
            if (checklistHtml) {
              html += `<ul class="checklist">\n${checklistHtml}\n</ul>`;
            }
            break;
          }
        }
        
        html += `\n${SECTION_END_MARKER}`;
        return html;
      })
      .filter(Boolean)
      .join('\n\n');
    
    // Wrap in article tag for semantic structure
    return `<article class="journal-entry">\n${htmlSections}\n</article>`;
  },
  
  /**
   * Parse content with section markers back to sections
   * Now handles both HTML and markdown formats
   */
  contentToSections(template: EnhancedTemplate, content: string): SectionResponse[] {
    const sections: SectionResponse[] = [];
    
    // Reset regex to start from beginning
    HTML_SECTION_REGEX.lastIndex = 0;
    
    // Find all sections with markers
    let match;
    while ((match = HTML_SECTION_REGEX.exec(content)) !== null) {
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
      
      // Parse the value based on section type and HTML content
      let value: string | number | string[] | Record<string, boolean> = '';
      
      switch (sectionType) {
        case 'text': {
          // Extract text from div or direct content
          const textMatch = sectionContent.match(/<div[^>]*>([\s\S]*?)<\/div>/);
          value = textMatch ? textMatch[1].trim() : sectionContent.replace(/<h3>.*?<\/h3>/, '').trim();
          // Clean up any remaining HTML tags for plain text
          value = value.replace(/<[^>]+>/g, '');
          break;
        }
        
        case 'scale': {
          const ratingMatch = sectionContent.match(/Rating: (\d+)\//);
          value = ratingMatch ? parseInt(ratingMatch[1]) : 5;
          break;
        }
        
        case 'mood': {
          // Extract mood from paragraph
          const moodMatch = sectionContent.match(/<p>([^<]+)<\/p>/);
          if (moodMatch) {
            const moodText = moodMatch[1].trim();
            // Try to extract emoji and label
            const emojiMatch = moodText.match(/^[^\s]+ (.+)$/);
            if (emojiMatch) {
              const mood = sectionDef.options?.moods?.find(m => m.label === emojiMatch[1]);
              value = mood?.value || moodText;
            } else {
              value = moodText;
            }
          }
          break;
        }
        
        case 'emotions': {
          const emotionsMatch = sectionContent.match(/Emotions: ([^<]+)/);
          if (emotionsMatch) {
            value = emotionsMatch[1].split(', ').map(e => e.trim()).filter(e => e);
          } else {
            value = [];
          }
          break;
        }
        
        case 'tags': {
          const tagMatches = sectionContent.match(/<span[^>]*>#(\w+)<\/span>/g);
          value = tagMatches ? tagMatches.map(tag => {
            const tagMatch = tag.match(/#(\w+)/);
            return tagMatch ? tagMatch[1] : '';
          }).filter(t => t) : [];
          break;
        }
        
        case 'checklist': {
          const checklistItems: Record<string, boolean> = {};
          const listItems = sectionContent.match(/<li>([^<]+)<\/li>/g);
          if (listItems) {
            listItems.forEach(item => {
              const itemMatch = item.match(/<li>([☑☐]) (.+)<\/li>/);
              if (itemMatch) {
                checklistItems[itemMatch[2]] = itemMatch[1] === '☑';
              }
            });
          }
          value = checklistItems;
          break;
        }
        
        case 'choice': {
          const choiceMatch = sectionContent.match(/<p>([^<]+)<\/p>/);
          if (choiceMatch) {
            const choiceText = choiceMatch[1].trim();
            const choice = sectionDef.options?.choices?.find(c => c.label === choiceText);
            value = choice?.value || choiceText;
          }
          break;
        }
        
        case 'goals':
          // Goals are handled separately through linkedGoalIds
          value = [];
          break;
          
        default:
          // Fallback to extracting text content
          value = sectionContent.replace(/<[^>]+>/g, '').trim();
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
    
    // If no sections found, try legacy format
    if (sections.length === 0) {
      console.warn('No section markers found, attempting legacy parsing');
      return legacyContentToSections(template, content);
    }
    
    // Ensure all template sections are represented
    template.sections.forEach(sectionDef => {
      if (!sections.find(s => s.sectionId === sectionDef.id)) {
        sections.push({
          sectionId: sectionDef.id,
          value: getDefaultValue(sectionDef.type),
          metadata: {}
        });
      }
    });
    
    return sections;
  }
};

function getDefaultValue(type: string): string | number | string[] | Record<string, boolean> {
  switch (type) {
    case 'text': return '';
    case 'scale': return 5;
    case 'mood': return '';
    case 'choice': return '';
    case 'tags': return [];
    case 'goals': return [];
    case 'checklist': return {};
    default: return '';
  }
}

/**
 * Legacy parser for older content formats
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
  
  // If no sections found through legacy parsing, initialize with defaults
  if (sections.length === 0) {
    template.sections.forEach(sectionDef => {
      sections.push({
        sectionId: sectionDef.id,
        value: getDefaultValue(sectionDef.type),
        metadata: {}
      });
    });
  }
  
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