// template-utils.ts
import { JournalTemplate } from '@/types/journal';
import { enhancedTemplates } from './enhanced-templates';

export function getTemplateIcon(templateId: JournalTemplate): string {
  return enhancedTemplates[templateId]?.icon || '📝';
}

export function getTemplateColor(templateId: JournalTemplate): string {
  return enhancedTemplates[templateId]?.color || '#6b7280';
}

export function getTemplateDescription(templateId: JournalTemplate): string {
  return enhancedTemplates[templateId]?.description || 'Journal entry';
}

export function getTemplateName(templateId: JournalTemplate): string {
  return enhancedTemplates[templateId]?.name || 'Journal';
}

export function getTemplateEstimatedTime(templateId: JournalTemplate): number {
  // Estimate based on number of sections and their types
  const template = enhancedTemplates[templateId];
  if (!template) return 5;
  
  let minutes = 0;
  template.sections.forEach(section => {
    switch (section.type) {
      case 'text':
        minutes += section.required ? 3 : 2;
        break;
      case 'mood':
      case 'scale':
      case 'choice':
        minutes += 0.5;
        break;
      case 'tags':
      case 'goals':
        minutes += 1;
        break;
      case 'checklist':
        minutes += 1.5;
        break;
    }
  });
  
  return Math.ceil(minutes);
}