// enhanced-template-content-utils.ts
import type { EnhancedTemplate, SectionResponse } from '../types/enhanced-template.types';

/**
 * Enhanced utilities to convert between section-based editing and JournalEntry format
 * Now supports both HTML and markdown section markers with improved error handling
 */

// HTML section format from saved entries
const HTML_SECTION_REGEX = /<!--SECTION:([^:]+):([^:]+):({.*?})-->([\s\S]*?)<!--\/SECTION-->/g;

// Markdown section format for new entries
const SECTION_START_MARKER = '<!--SECTION:';
const SECTION_END_MARKER = '<!--/SECTION-->';

// Debug logging
const DEBUG = true;
const log = (message: string, data?: unknown) => {
  if (DEBUG) {
    console.log(`[ContentUtils] ${message}`, data || '');
  }
};

// Version announcement
console.log('%c[ContentUtils v2] MODULE LOADED - NEW VERSION WITHOUT DIV WRAPPER', 'background: #4CAF50; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold');
console.log('[ContentUtils v2] This version saves text content WITHOUT <div class="section-content"> wrapper');

// Global version check function for debugging
if (typeof window !== 'undefined') {
  (window as unknown as { checkJournalVersion: () => void }).checkJournalVersion = () => {
    console.log('\n=== JOURNAL SYSTEM VERSION CHECK ===');
    console.log('ContentUtils Version: 2.0 (No div wrapper)');
    console.log('Expected save format: <h3>Title</h3>\\nContent');
    console.log('Old format: <h3>Title</h3>\\n<div class="section-content">Content</div>');
    console.log('Parser supports: BOTH formats');
    console.log('Loaded at:', new Date().toISOString());
    console.log('===================================\n');
    return 'Version 2.0';
  };
  console.log('[ContentUtils v2] Run checkJournalVersion() in console to verify version');
}

export const enhancedJournalContentUtils = {
  /**
   * Convert section responses to HTML content with section markers
   */
  sectionsToContent(template: EnhancedTemplate, sections: SectionResponse[]): string {
    console.log('[ContentUtils v2] === VERSION CHECK: NEW CODE WITHOUT DIV WRAPPER ===');
    console.log('[ContentUtils v2] sectionsToContent called at:', new Date().toISOString());
    log('Converting sections to content', { template: template.name, sectionCount: sections.length });
    
    const htmlSections = sections
      .map(section => {
        const sectionDef = template.sections.find(s => s.id === section.sectionId);
        if (!sectionDef) {
          log(`Warning: Section definition not found for ID: ${section.sectionId}`);
          return '';
        }
        
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
            // Store text content directly without wrapping
            console.log('[ContentUtils v2] SAVING TEXT WITHOUT DIV WRAPPER - New Version Active!');
            console.log('[ContentUtils v2] Text content:', section.value);
            html += section.value || '';
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
   * Enhanced with better error handling and text extraction
   */
  contentToSections(template: EnhancedTemplate, content: string): SectionResponse[] {
    log('Parsing content to sections', { template: template.name, contentLength: content.length });
    
    const sections: SectionResponse[] = [];
    
    try {
      // Reset regex to start from beginning
      HTML_SECTION_REGEX.lastIndex = 0;
      
      // Find all sections with markers
      let match;
      let matchCount = 0;
      
      while ((match = HTML_SECTION_REGEX.exec(content)) !== null) {
        matchCount++;
        const [, sectionId, sectionType, metadataStr, sectionContent] = match;
        
        log(`Found section match ${matchCount}`, { 
          sectionId, 
          sectionType, 
          contentLength: sectionContent.length 
        });
        
        // Parse metadata
        let metadata = {};
        try {
          metadata = JSON.parse(metadataStr);
        } catch {
          log('Failed to parse section metadata:', metadataStr);
          // Continue with empty metadata
        }
        
        // Find the section definition
        const sectionDef = template.sections.find(s => s.id === sectionId);
        if (!sectionDef) {
          log(`Section definition not found for ID: ${sectionId}`);
          continue;
        }
        
        // Parse the value based on section type
        let value: string | number | string[] | Record<string, boolean> = '';
        
        try {
          value = extractSectionValue(sectionType, sectionContent, sectionDef);
          log(`Extracted value for section ${sectionId}:`, value);
        } catch (error) {
          log(`Error extracting value for section ${sectionId}:`, error);
          value = getDefaultValue(sectionType);
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
      
      log(`Parsed ${matchCount} sections with markers`);
      
      // If no sections found, try alternative parsing
      if (sections.length === 0) {
        log('No section markers found, attempting alternative parsing');
        
        // Try to extract raw text content
        const textContent = extractTextFromHtml(content);
        if (textContent && textContent.trim()) {
          log('Found raw text content, creating default text section');
          
          // Find the first text section in the template
          const textSection = template.sections.find(s => s.type === 'text');
          if (textSection) {
            sections.push({
              sectionId: textSection.id,
              value: textContent,
              metadata: {
                wordCount: textContent.split(/\s+/).filter(w => w).length
              }
            });
          }
        }
      }
      
    } catch (error) {
      log('Error in contentToSections:', error);
    }
    
    // Ensure all template sections are represented
    template.sections.forEach(sectionDef => {
      if (!sections.find(s => s.sectionId === sectionDef.id)) {
        log(`Adding default value for missing section: ${sectionDef.id}`);
        sections.push({
          sectionId: sectionDef.id,
          value: getDefaultValue(sectionDef.type),
          metadata: {}
        });
      }
    });
    
    log('Final sections:', sections);
    return sections;
  }
};

/**
 * Extract section value based on type with improved parsing
 */
function extractSectionValue(
  sectionType: string, 
  sectionContent: string, 
  sectionDef: { options?: { moods?: Array<{ value: string; label: string; emoji: string }>; choices?: Array<{ value: string; label: string }> } }
): string | number | string[] | Record<string, boolean> {
  
  // Remove the section title first
  const contentWithoutTitle = sectionContent.replace(/<h3>.*?<\/h3>\s*/i, '');
  
  switch (sectionType) {
    case 'text': {
      // Try multiple extraction methods
      let textValue = '';
      
      // Method 1: Extract from div.section-content
      const divMatch = contentWithoutTitle.match(/<div[^>]*class="section-content"[^>]*>([\s\S]*?)<\/div>/i);
      if (divMatch) {
        console.log('[ContentUtils v2] PARSING: Found old format with div wrapper');
        textValue = divMatch[1];
      } else {
        // Method 2: Extract from any div
        const anyDivMatch = contentWithoutTitle.match(/<div[^>]*>([\s\S]*?)<\/div>/i);
        if (anyDivMatch) {
          textValue = anyDivMatch[1];
        } else {
          // Method 3: Use all content after stripping HTML
          textValue = contentWithoutTitle;
        }
      }
      
      // Clean up the text
      textValue = textValue
        .replace(/<br\s*\/?>/gi, '\n') // Convert BR tags to newlines
        .replace(/<\/p>\s*<p>/gi, '\n\n') // Convert paragraph breaks
        .replace(/<[^>]+>/g, '') // Remove remaining HTML tags
        .replace(/&nbsp;/g, ' ') // Replace nbsp
        .replace(/&amp;/g, '&') // Decode ampersands
        .replace(/&lt;/g, '<') // Decode less than
        .replace(/&gt;/g, '>') // Decode greater than
        .replace(/&quot;/g, '"') // Decode quotes
        .replace(/&#39;/g, "'") // Decode apostrophes
        .trim();
      
      return textValue;
    }
    
    case 'scale': {
      const ratingMatch = contentWithoutTitle.match(/Rating:\s*(\d+)\s*\//);
      return ratingMatch ? parseInt(ratingMatch[1]) : 5;
    }
    
    case 'mood': {
      const moodMatch = contentWithoutTitle.match(/<p>([^<]+)<\/p>/);
      if (moodMatch) {
        const moodText = moodMatch[1].trim();
        // Try to extract emoji and label
        const emojiMatch = moodText.match(/^([^\s]+)\s+(.+)$/);
        if (emojiMatch && sectionDef.options?.moods) {
          const mood = sectionDef.options.moods.find(m => m.label === emojiMatch[2]);
          return mood?.value || moodText;
        }
        return moodText;
      }
      return '';
    }
    
    case 'emotions': {
      const emotionsMatch = contentWithoutTitle.match(/Emotions:\s*([^<]+)/);
      if (emotionsMatch) {
        return emotionsMatch[1].split(/,\s*/).map(e => e.trim()).filter(e => e);
      }
      return [];
    }
    
    case 'tags': {
      const tags: string[] = [];
      const tagRegex = /<span[^>]*>#(\w+)<\/span>/g;
      let tagMatch;
      while ((tagMatch = tagRegex.exec(contentWithoutTitle)) !== null) {
        tags.push(tagMatch[1]);
      }
      return tags;
    }
    
    case 'checklist': {
      const checklistItems: Record<string, boolean> = {};
      const listItemRegex = /<li>([☑☐])\s+(.+?)<\/li>/g;
      let itemMatch;
      while ((itemMatch = listItemRegex.exec(contentWithoutTitle)) !== null) {
        checklistItems[itemMatch[2]] = itemMatch[1] === '☑';
      }
      return checklistItems;
    }
    
    case 'choice': {
      const choiceMatch = contentWithoutTitle.match(/<p>([^<]+)<\/p>/);
      if (choiceMatch && sectionDef.options?.choices) {
        const choiceText = choiceMatch[1].trim();
        const choice = sectionDef.options.choices.find(c => c.label === choiceText);
        return choice?.value || choiceText;
      }
      return '';
    }
    
    case 'goals':
      return [];
      
    default:
      // Fallback to extracting text content
      return contentWithoutTitle.replace(/<[^>]+>/g, '').trim();
  }
}

/**
 * Extract plain text from HTML content
 */
function extractTextFromHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/**
 * Get default value for section type
 */
function getDefaultValue(type: string): string | number | string[] | Record<string, boolean> {
  switch (type) {
    case 'text': return '';
    case 'scale': return 5;
    case 'mood': return '';
    case 'choice': return '';
    case 'tags': return [];
    case 'goals': return [];
    case 'emotions': return [];
    case 'checklist': return {};
    default: return '';
  }
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
  log('Migrating content to enhanced format');
  
  // First try to parse as sections
  const sections = enhancedJournalContentUtils.contentToSections(template, content);
  
  // Then convert back to ensure proper format
  return enhancedJournalContentUtils.sectionsToContent(template, sections);
}