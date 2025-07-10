import React, { useState } from 'react';
import TemplatePicker from './TemplatePicker';
import JournalEditor from './JournalEditor';
import JournalEditorWithSections from './JournalEditorWithSections';
import type { JournalTemplate } from './JournalEditorWithSections';

const JournalTemplateDemo: React.FC = () => {
  const [template, setTemplate] = useState<JournalTemplate | null>(null);
  return (
    <div className="space-y-4">
      {!template && (
        <TemplatePicker onSelect={setTemplate} />
      )}
      {template === null && (
        <JournalEditor initialContent="" onSave={() => {}} />
      )}
      {template && (
        <JournalEditorWithSections template={template} onSave={() => {}} />
      )}
    </div>
  );
};

export default JournalTemplateDemo;
