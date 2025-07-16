import React from 'react';
import ReactMarkdown from 'react-markdown';
import { JournalTemplate } from '@/types/journal';
import { enhancedTemplates } from '../templates/enhanced-templates';
import { getEmotionById, getEmotionEmoji } from './EmotionSelector/emotionData';
import type { EnhancedTemplate, SectionDefinition } from '../types/enhanced-template.types';
import '../styles/journal-content.css';

interface JournalEntry {
  content: string;
  template?: string;
  wordCount?: number;
}

interface JournalEntryRendererProps {
  entry: JournalEntry;
  className?: string;
}

interface ParsedSection {
  sectionId: string;
  type: string;
  metadata: Record<string, unknown>;
  content: unknown;
}

export const JournalEntryRenderer: React.FC<JournalEntryRendererProps> = ({
  entry,
  className = ''
}) => {
  // Debug logging
  console.log('[JournalEntryRenderer] Raw content:', entry.content);
  console.log('[JournalEntryRenderer] Template:', entry.template);

  // Parse sections from HTML comments
  const parseSectionMarkers = (html: string): ParsedSection[] => {
    const sections: ParsedSection[] = [];
    const regex = /<!--SECTION:([^:]+):([^:]+):({.*?})-->([\s\S]*?)<!--\/SECTION-->/g;
    
    let match;
    while ((match = regex.exec(html)) !== null) {
      const [, sectionId, type, metadataStr, content] = match;
      
      try {
        const metadata = JSON.parse(metadataStr);
        const extractedContent = extractSectionContent(content.trim(), type);
        
        sections.push({
          sectionId,
          type,
          metadata,
          content: extractedContent
        });
        
        console.log('[parseSectionMarkers] Parsed section:', { sectionId, type, content: extractedContent });
      } catch (e) {
        console.error('[parseSectionMarkers] Error parsing section:', e);
      }
    }
    
    return sections;
  };

  // Extract content from HTML section based on type
  const extractSectionContent = (html: string, type: string): unknown => {
    // Create a temporary div to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Remove the h3 title as it's already in the template
    const h3 = tempDiv.querySelector('h3');
    if (h3) h3.remove();
    
    switch (type) {
      case 'emotions': {
        // Look for emotion list items or spans
        const emotionElements = tempDiv.querySelectorAll('li, span.emotion-item');
        if (emotionElements.length > 0) {
          return Array.from(emotionElements).map(el => el.textContent?.trim()).filter(Boolean);
        }
        // Fallback to text content split by commas
        const emotionText = tempDiv.textContent?.trim() || '';
        return emotionText.split(/[,;]/).map(e => e.trim()).filter(Boolean);
      }
        
      case 'scale': {
        // Look for numeric value
        const scaleText = tempDiv.textContent?.trim() || '';
        const scaleMatch = scaleText.match(/\d+/);
        return scaleMatch ? parseInt(scaleMatch[0]) : null;
      }
        
      case 'checklist': {
        // Look for checkbox items
        const checklistItems: Record<string, boolean> = {};
        const listItems = tempDiv.querySelectorAll('li');
        listItems.forEach(li => {
          const text = li.textContent?.trim() || '';
          const isChecked = li.innerHTML.includes('✓') || li.innerHTML.includes('✅') || li.classList.contains('checked');
          if (text) {
            const cleanText = text.replace(/[✓✅]/g, '').trim();
            checklistItems[cleanText] = isChecked;
          }
        });
        return checklistItems;
      }
        
      case 'tags': {
        // Look for tag elements or parse comma-separated text
        const tagElements = tempDiv.querySelectorAll('.tag, span.tag-item');
        if (tagElements.length > 0) {
          return Array.from(tagElements).map(el => el.textContent?.trim()).filter(Boolean);
        }
        const tagText = tempDiv.textContent?.trim() || '';
        return tagText.split(/[,;#]/).map(t => t.trim()).filter(Boolean);
      }
        
      case 'goals': {
        // Extract goal IDs from the content
        const goalLinks = tempDiv.querySelectorAll('a[href*="goal"], .goal-link');
        if (goalLinks.length > 0) {
          return Array.from(goalLinks).map(link => {
            const href = link.getAttribute('href') || '';
            const goalIdMatch = href.match(/goal[/-]([a-zA-Z0-9-]+)/);
            return goalIdMatch ? goalIdMatch[1] : null;
          }).filter(Boolean);
        }
        // Fallback to text parsing
        return [];
      }
        
      case 'choice': {
        // Extract selected choice
        const selectedChoice = tempDiv.querySelector('.selected, .active, [selected]');
        return selectedChoice?.textContent?.trim() || tempDiv.textContent?.trim() || '';
      }
        
      case 'text':
      default: {
        // For text sections, preserve paragraph structure
        const paragraphs = tempDiv.querySelectorAll('p');
        if (paragraphs.length > 0) {
          return Array.from(paragraphs).map(p => p.textContent?.trim()).filter(Boolean).join('\n\n');
        }
        return tempDiv.textContent?.trim() || '';
      }
    }
  };

  // Legacy HTML parser for backward compatibility
  const parseHTMLContent = (html: string): Record<string, string> | null => {
    const data: Record<string, string> = {};
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    const h3Elements = tempDiv.querySelectorAll('h3');
    
    h3Elements.forEach((h3) => {
      const title = h3.textContent?.trim() || '';
      let content = '';
      
      let nextNode = h3.nextSibling;
      const contentParts: string[] = [];
      
      while (nextNode) {
        if (nextNode.nodeType === Node.ELEMENT_NODE && (nextNode as Element).tagName === 'H3') {
          break;
        }
        if (nextNode.nodeType === Node.COMMENT_NODE && nextNode.textContent?.trim() === '/SECTION') {
          break;
        }
        
        if (nextNode.nodeType === Node.TEXT_NODE) {
          const text = nextNode.textContent?.trim();
          if (text) contentParts.push(text);
        } else if (nextNode.nodeType === Node.ELEMENT_NODE) {
          const text = nextNode.textContent?.trim();
          if (text) contentParts.push(text);
        }
        
        nextNode = nextNode.nextSibling;
      }
      
      content = contentParts.join(' ').trim();
      
      // Map section titles to data keys for daily reflection
      const titleLower = title.toLowerCase();
      if (titleLower.includes('emotion')) {
        data.emotions = content || '';
      } else if (titleLower.includes('grateful')) {
        data.gratitude = content || '';
      } else if (titleLower.includes('highlight')) {
        data.highlights = content || '';
      } else if (titleLower.includes('challenge') || titleLower.includes('lesson')) {
        data.challenges = content || '';
      } else if (titleLower.includes('tomorrow')) {
        data.tomorrow = content || '';
      } else if (titleLower.includes('additional') || titleLower.includes('notes')) {
        data.notes = content || '';
      }
    });
    
    return Object.keys(data).length > 0 ? data : null;
  };

  // Render section based on type and template
  const renderSection = (section: ParsedSection, template: EnhancedTemplate | null) => {
    const sectionDef = template?.sections?.find((s) => s.id === section.sectionId);
    if (!sectionDef) {
      // Fallback rendering if no definition found
      return renderTextSection(section.content);
    }
    
    switch (section.type) {
      case 'text':
        return renderTextSection(section.content);
        
      case 'emotions':
        return renderEmotionsSection(section.content as string[]);
        
      case 'scale':
        return renderScaleSection(section.content as number, sectionDef);
        
      case 'checklist':
        return renderChecklistSection(section.content as Record<string, boolean>, sectionDef);
        
      case 'tags':
        return renderTagsSection(section.content as string[]);
        
      case 'goals':
        return renderGoalsSection(section.content as string[]);
        
      case 'choice':
        return renderChoiceSection(section.content as string, sectionDef);
        
      default:
        return renderTextSection(section.content);
    }
  };

  // Section type renderers
  const renderTextSection = (content: unknown) => {
    if (!content || content === '') {
      return <p className="journal-empty-content">No content added</p>;
    }
    
    const text = typeof content === 'string' ? content : String(content);
    
    // If content has line breaks, render as separate paragraphs
    if (text.includes('\n\n')) {
      return (
        <div className="space-y-4">
          {text.split('\n\n').map((paragraph, index) => (
            <p key={index} className="leading-relaxed">{paragraph}</p>
          ))}
        </div>
      );
    }
    
    return <p className="leading-relaxed">{text}</p>;
  };

  const renderEmotionsSection = (emotions: string[]) => {
    if (!emotions || emotions.length === 0) {
      return <p className="journal-empty-content">No emotions recorded</p>;
    }
    
    return (
      <div className="emotion-display">
        <div className="flex flex-wrap gap-3">
          {emotions.map((emotionId, index) => {
            const emotion = getEmotionById(emotionId);
            const emoji = getEmotionEmoji(emotionId);
            
            if (emotion) {
              return (
                <span 
                  key={index} 
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
                  style={{ 
                    backgroundColor: emotion.color + '20',
                    color: emotion.color,
                    borderColor: emotion.color,
                    borderWidth: '1px',
                    borderStyle: 'solid'
                  }}
                >
                  <span className="text-lg">{emoji}</span>
                  <span>{emotion.label}</span>
                </span>
              );
            }
            
            // Fallback for unknown emotions
            return (
              <span key={index} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-700 text-sm">
                <span>{emotionId}</span>
              </span>
            );
          })}
        </div>
      </div>
    );
  };

  const renderScaleSection = (value: number | null, sectionDef: SectionDefinition) => {
    if (value === null || value === undefined) {
      return <p className="journal-empty-content">No rating provided</p>;
    }
    
    const min = sectionDef.options?.min || 1;
    const max = sectionDef.options?.max || 10;
    const percentage = ((value - min) / (max - min)) * 100;
    
    return (
      <div className="scale-display">
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl font-bold text-accent">{value}</span>
          <span className="text-sm text-muted">out of {max}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-accent h-3 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  const renderChecklistSection = (items: Record<string, boolean>, sectionDef: SectionDefinition) => {
    const checklistItems = sectionDef.options?.items || [];
    
    if (checklistItems.length === 0) {
      return <p className="journal-empty-content">No checklist items</p>;
    }
    
    return (
      <ul className="space-y-3">
        {checklistItems.map((item) => {
          const isChecked = items[item.label] || items[item.id] || false;
          
          return (
            <li key={item.id} className="flex items-start gap-3">
              <span className={`text-lg ${isChecked ? 'text-green-500' : 'text-gray-400'}`}>
                {isChecked ? '✅' : '⬜'}
              </span>
              <span className={`flex-1 ${isChecked ? 'line-through text-muted' : ''}`}>
                {item.label}
              </span>
            </li>
          );
        })}
      </ul>
    );
  };

  const renderTagsSection = (tags: string[]) => {
    if (!tags || tags.length === 0) {
      return <p className="journal-empty-content">No tags added</p>;
    }
    
    return (
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, index) => (
          <span 
            key={index} 
            className="px-3 py-1 bg-accent/10 text-accent rounded-full text-sm font-medium"
          >
            #{tag}
          </span>
        ))}
      </div>
    );
  };

  const renderGoalsSection = (goalIds: string[]) => {
    if (!goalIds || goalIds.length === 0) {
      return <p className="journal-empty-content">No goals linked</p>;
    }
    
    return (
      <ul className="space-y-2">
        {goalIds.map((goalId, index) => (
          <li key={index} className="flex items-center gap-2">
            <span className="text-accent">🎯</span>
            <span className="text-sm">Goal: {goalId}</span>
          </li>
        ))}
      </ul>
    );
  };

  const renderChoiceSection = (choice: string, sectionDef: SectionDefinition) => {
    if (!choice) {
      return <p className="journal-empty-content">No choice selected</p>;
    }
    
    const choiceOption = sectionDef.options?.choices?.find((c) => c.value === choice || c.label === choice);
    
    return (
      <div className="inline-flex items-center px-4 py-2 bg-accent/10 text-accent rounded-full">
        {choiceOption?.icon && <span className="mr-2">{choiceOption.icon}</span>}
        <span className="font-medium">{choiceOption?.label || choice}</span>
      </div>
    );
  };

  // Template-aware content renderer
  const renderTemplateContent = (sections: ParsedSection[], template: EnhancedTemplate | null) => {
    if (!template) {
      // Fallback to generic rendering
      return (
        <div className="space-y-8">
          {sections.map((section, index) => (
            <section key={index} className="journal-section">
              <h3>{(section.metadata.title as string) || section.sectionId}</h3>
              {renderSection(section, null)}
            </section>
          ))}
        </div>
      );
    }
    
    return (
      <div className="space-y-8">
        {sections.map((section) => {
          const sectionDef = template.sections.find((s) => s.id === section.sectionId);
          if (!sectionDef) return null;
          
          return (
            <section key={section.sectionId} className="journal-section">
              <h3>{sectionDef.title}</h3>
              {renderSection(section, template)}
            </section>
          );
        })}
      </div>
    );
  };

  // Legacy structured content renderer (for backward compatibility)
  const renderStructuredContent = (data: Record<string, unknown>) => {
    // Check if it's a daily reflection format
    if ('emotions' in data || 'gratitude' in data || 'highlights' in data) {
      return renderDailyReflectionContent(data);
    }
    
    // Otherwise render as generic sections
    return (
      <div className="space-y-6">
        {Object.entries(data).map(([key, value]) => (
          <section key={key} className="journal-section">
            <h3 className="capitalize">{key.replace(/_/g, ' ')}</h3>
            {Array.isArray(value) ? (
              <ul className="space-y-2">
                {value.map((item: unknown, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-accent">•</span>
                    <span className="flex-1">{String(item)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="leading-relaxed">{String(value)}</p>
            )}
          </section>
        ))}
      </div>
    );
  };

  // Daily reflection renderer (legacy)
  interface DailyReflectionData {
    emotions?: string;
    gratitude?: string[] | string;
    highlights?: string[] | string;
    challenges?: string;
    tomorrow?: string;
    notes?: string;
  }

  const renderDailyReflectionContent = (data: unknown) => {
    const reflectionData = data as DailyReflectionData;
    return (
      <div className="space-y-8">
        <section className="journal-section">
          <h3>Today's Emotions</h3>
          <p className="emotion-display">{reflectionData.emotions || <span className="journal-empty-content">No emotions recorded</span>}</p>
        </section>
        
        <section className="journal-section">
          <h3>Three Things I'm Grateful For</h3>
          {Array.isArray(reflectionData.gratitude) && reflectionData.gratitude.length > 0 ? (
            <ul className="space-y-3">
              {reflectionData.gratitude.map((item: string, index: number) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="list-icon">🙏</span>
                  <span className="flex-1">{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>{(typeof reflectionData.gratitude === 'string' && reflectionData.gratitude.trim() !== '') ? reflectionData.gratitude : <span className="journal-empty-content">No gratitude items added</span>}</p>
          )}
        </section>
        
        <section className="journal-section">
          <h3>Today's Highlights</h3>
          {Array.isArray(reflectionData.highlights) && reflectionData.highlights.length > 0 ? (
            <ul className="space-y-3">
              {reflectionData.highlights.map((item: string, index: number) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="list-icon">✨</span>
                  <span className="flex-1">{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>{(typeof reflectionData.highlights === 'string' && reflectionData.highlights.trim() !== '') ? reflectionData.highlights : <span className="journal-empty-content">No highlights added</span>}</p>
          )}
        </section>
        
        <section className="journal-section">
          <h3>Challenges & Lessons</h3>
          <p>{(typeof reflectionData.challenges === 'string' && reflectionData.challenges.trim() !== '') ? reflectionData.challenges : <span className="journal-empty-content">No challenges noted</span>}</p>
        </section>
        
        <section className="journal-section">
          <h3>Tomorrow's Focus</h3>
          <p>{(typeof reflectionData.tomorrow === 'string' && reflectionData.tomorrow.trim() !== '') ? reflectionData.tomorrow : <span className="journal-empty-content">No focus set for tomorrow</span>}</p>
        </section>
        
        {reflectionData.notes && (
          <section className="journal-section">
            <h3>Additional Notes</h3>
            <p>{reflectionData.notes}</p>
          </section>
        )}
      </div>
    );
  };

  // Main parsing logic
  const parseContent = (content: string) => {
    // First, try to parse SECTION markers
    if (content.includes('<!--SECTION:')) {
      const sections = parseSectionMarkers(content);
      if (sections.length > 0) {
        // Get the template definition
        const templateKey = entry.template as JournalTemplate;
        const template = templateKey ? enhancedTemplates[templateKey] : null;
        
        return renderTemplateContent(sections, template);
      }
    }
    
    // Try JSON parsing
    try {
      const parsed = JSON.parse(content);
      if (typeof parsed === 'object' && parsed !== null) {
        return renderStructuredContent(parsed);
      }
    } catch {
      // Not JSON, continue with other parsing methods
    }
    
    // Try legacy HTML parsing
    if (content.includes('<h3') || content.includes('<H3')) {
      const htmlData = parseHTMLContent(content);
      if (htmlData) {
        return renderStructuredContent(htmlData);
      }
    }
    
    // If all else fails, render as markdown
    return content;
  };

  const renderedContent = parseContent(entry.content);

  // If content is a string, render as markdown
  if (typeof renderedContent === 'string') {
    // Strip HTML tags if they exist
    const cleanContent = renderedContent.replace(/<[^>]*>/g, '').replace(/<!--[\s\S]*?-->/g, '').trim();
    
    return (
      <div className={`journal-content ${className}`}>
        <ReactMarkdown
          components={{
            h1: ({ children }) => <h1 className="text-3xl font-bold mt-8 mb-4">{children}</h1>,
            h2: ({ children }) => <h2 className="text-2xl font-semibold mt-6 mb-3">{children}</h2>,
            h3: ({ children }) => <h3 className="text-xl font-semibold mt-4 mb-2">{children}</h3>,
            h4: ({ children }) => <h4 className="text-lg font-medium mt-3 mb-2">{children}</h4>,
            p: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
            ul: ({ children }) => <ul className="mb-4 space-y-2 ml-6">{children}</ul>,
            ol: ({ children }) => <ol className="mb-4 space-y-2 ml-6 list-decimal">{children}</ol>,
            li: ({ children }) => <li className="leading-relaxed">{children}</li>,
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-accent pl-4 py-2 my-4 italic opacity-90">
                {children}
              </blockquote>
            ),
            code: ({ children, ...props }) => {
              return (
                <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm" {...props}>
                  {children}
                </code>
              );
            },
            hr: () => <hr className="my-8 border-t border-gray-200" />,
            a: ({ href, children }) => (
              <a href={href} className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            ),
          }}
        >
          {cleanContent}
        </ReactMarkdown>
      </div>
    );
  }

  // Otherwise, content has already been rendered
  return <div className={`journal-content ${className}`}>{renderedContent}</div>;
};

export default JournalEntryRenderer;