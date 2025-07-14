// JournalEntryRenderer.tsx
import React from 'react';
import { Calendar, FileText, Hash, Target } from 'lucide-react';
import type { JournalEntry } from '@/types/journal';
import type { SectionDefinition } from '../types/enhanced-template.types';
import { enhancedTemplates } from '../templates/enhanced-templates';
import { enhancedJournalContentUtils } from '../templates/enhanced-template-content-utils';
import { getEmotionById, getEmotionEmoji } from './EmotionSelector/emotionData';

interface JournalEntryRendererProps {
  entry: JournalEntry;
  showMetadata?: boolean;
}

export const JournalEntryRenderer: React.FC<JournalEntryRendererProps> = ({ 
  entry, 
  showMetadata = true 
}) => {
  // Get the template definition
  const template = enhancedTemplates[entry.template] || enhancedTemplates.blank;
  
  // Parse content back to sections
  const sections = React.useMemo(() => {
    try {
      return enhancedJournalContentUtils.contentToSections(template, entry.content);
    } catch (error) {
      console.error('Failed to parse journal sections:', error);
      return [];
    }
  }, [template, entry.content]);
  
  const renderSectionValue = (sectionDef: SectionDefinition, value: string | number | string[] | Record<string, boolean>) => {
    switch (sectionDef.type) {
      case 'text':
        return (
          <div className="prose prose-lg max-w-none">
            {value ? <div dangerouslySetInnerHTML={{ __html: value }} /> : (
              <p className="text-muted italic">No content</p>
            )}
          </div>
        );
        
      case 'scale':
        return (
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-surface-muted rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-accent transition-all duration-300"
                style={{ width: `${((value as number) / (sectionDef.options?.max || 10)) * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium">{value as number}/{sectionDef.options?.max || 10}</span>
          </div>
        );
        
      case 'mood': {
        const mood = sectionDef.options?.moods?.find((m) => m.value === value);
        if (!mood && !value) return <p className="text-muted italic">No mood selected</p>;
        
        return (
          <div className="flex items-center gap-2">
            <span className="text-2xl">{mood?.emoji || getEmotionEmoji(value as string)}</span>
            <span className="text-lg">{mood?.label || value as string}</span>
          </div>
        );
      }
      
      case 'emotions': {
        const emotions = Array.isArray(value) ? value : [];
        if (emotions.length === 0) return <p className="text-muted italic">No emotions selected</p>;
        
        return (
          <div className="flex flex-wrap gap-2">
            {emotions.map((emotionId: string) => {
              const emotion = getEmotionById(emotionId);
              return (
                <span key={emotionId} className="px-3 py-1 bg-surface-muted rounded-full text-sm">
                  {getEmotionEmoji(emotionId)} {emotion?.label || emotionId}
                </span>
              );
            })}
          </div>
        );
      }
      
      case 'choice': {
        const choice = sectionDef.options?.choices?.find((c) => c.value === value);
        return (
          <p className="text-lg">{choice?.label || (value as string) || <span className="text-muted italic">No choice selected</span>}</p>
        );
      }
      
      case 'tags': {
        const tags = Array.isArray(value) ? value : [];
        if (tags.length === 0) return <p className="text-muted italic">No tags</p>;
        
        return (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag: string) => (
              <span key={tag} className="tag">
                <Hash className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        );
      }
      
      case 'checklist': {
        const items = value as Record<string, boolean>;
        const entries = Object.entries(items);
        if (entries.length === 0) return <p className="text-muted italic">No items</p>;
        
        return (
          <ul className="space-y-2">
            {entries.map(([item, checked]) => (
              <li key={item} className="flex items-center gap-2">
                <span className={`text-lg ${checked ? 'text-success' : 'text-muted'}`}>
                  {checked ? '✓' : '○'}
                </span>
                <span className={checked ? 'line-through text-muted' : ''}>{item}</span>
              </li>
            ))}
          </ul>
        );
      }
      
      default:
        return <p>{String(value || '')}</p>;
    }
  };
  
  return (
    <div className="journal-entry-renderer">
      {/* Entry Header */}
      {showMetadata && (
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-theme mb-4">{entry.title}</h1>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(entry.createdAt).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
            <span className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              {entry.wordCount} words
            </span>
            {entry.linkedGoalIds.length > 0 && (
              <span className="flex items-center gap-1 text-accent">
                <Target className="w-4 h-4" />
                {entry.linkedGoalIds.length} linked goals
              </span>
            )}
          </div>
          
          {/* Global tags */}
          {entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {entry.tags.map(tag => (
                <span key={tag} className="tag">
                  <Hash className="w-3 h-3" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Template Sections */}
      <div className="space-y-8">
        {template.sections.map((sectionDef) => {
          const section = sections.find(s => s.sectionId === sectionDef.id);
          if (!section || !section.value || 
              (Array.isArray(section.value) && section.value.length === 0) ||
              (typeof section.value === 'object' && Object.keys(section.value).length === 0)) {
            return null; // Skip empty sections
          }
          
          return (
            <section key={sectionDef.id} className="journal-section">
              <h2 className="text-xl font-semibold text-theme mb-3 flex items-center gap-2">
                {/* sectionDef.icon && <span>{sectionDef.icon}</span> */}
                {sectionDef.title}
              </h2>
              
              {/* sectionDef.description && (
                <p className="text-sm text-muted mb-3">{sectionDef.description}</p>
              ) */}
              
              <div className="section-content">
                {renderSectionValue(sectionDef, section.value)}
              </div>
            </section>
          );
        })}
      </div>
      
      {/* Fallback for entries without sections */}
      {sections.length === 0 && (
        <div className="prose prose-lg max-w-none">
          <div dangerouslySetInnerHTML={{ __html: entry.content }} />
        </div>
      )}
    </div>
  );
};

export default JournalEntryRenderer;