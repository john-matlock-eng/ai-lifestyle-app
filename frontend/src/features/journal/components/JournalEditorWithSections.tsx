import React, { useState, useRef } from 'react';
import { Button } from '@/components/common';
import EditorSection from './EditorSection';
import type { JournalTemplate } from '../types/template.types';

export interface JournalEditorWithSectionsProps {
  template: JournalTemplate;
  initialData?: Record<string, string>;
  onSave: (data: {
    templateId: string;
    sections: { id: string; title: string; markdown: string }[];
    markdownExport: string;
  }) => void | Promise<void>;
  draftId?: string;
  readOnly?: boolean;
  className?: string;
}

const JournalEditorWithSections: React.FC<JournalEditorWithSectionsProps> = ({
  template,
  initialData = {},
  onSave,
  draftId,
  readOnly = false,
  className = '',
}) => {
  const [content, setContent] = useState<Record<string, string>>(
    Object.fromEntries(template.sections.map((s) => [s.id, initialData[s.id] || '']))
  );
  const draftBase = useRef(draftId ?? `${template.id}-${Date.now()}`);
  const [saveCounter, setSaveCounter] = useState(0);

  const handleChange = (id: string) => (markdown: string) => {
    setContent((prev) => ({ ...prev, [id]: markdown }));
  };

  const handleSave = async () => {
    const sections = template.sections.map((s) => ({
      id: s.id,
      title: s.title,
      markdown: content[s.id] ?? '',
    }));
    const markdownExport = sections
      .map((s) => `## ${s.title}\n\n${s.markdown}`)
      .join('\n\n');

    await Promise.resolve(onSave({
      templateId: template.id,
      sections,
      markdownExport,
    }));

    template.sections.forEach((s) => {
      const key = `journal-draft-${draftBase.current}-${s.id}`;
      localStorage.removeItem(key);
    });
    setSaveCounter((c) => c + 1);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {template.sections.map((section, idx) => (
        <div key={section.id} className="space-y-2">
          <h2 className="font-semibold text-lg">
            {idx + 1}. {section.title}
          </h2>
          <EditorSection
            section={section}
            initialContent={content[section.id]}
            readOnly={readOnly}
            onChange={handleChange(section.id)}
            draftId={`${draftBase.current}-${section.id}`}
            saveSignal={saveCounter}
          />
        </div>
      ))}
      {!readOnly && (
        <div className="text-right">
          <Button type="button" onClick={handleSave}>
            Save Entry
          </Button>
        </div>
      )}
    </div>
  );
};

export default JournalEditorWithSections;
