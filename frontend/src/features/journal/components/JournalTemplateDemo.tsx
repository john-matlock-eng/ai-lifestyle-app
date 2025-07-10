import React, { useState, useEffect } from 'react';
import TemplatePicker from './TemplatePicker';
import JournalEditor from './JournalEditor';
import JournalEditorWithSections from './JournalEditorWithSections';
import type { JournalTemplate } from '../types/template.types';
import { purgeOldDrafts } from '../utils/drafts';

type SelectionState = { template: JournalTemplate } | 'scratch' | null;

const JournalTemplateDemo: React.FC = () => {
  const [selection, setSelection] = useState<SelectionState>(null);

  useEffect(() => {
    purgeOldDrafts();
  }, []);

  if (selection === null) {
    return (
      <div className="space-y-4">
        <TemplatePicker
          onSelect={(t) => setSelection(t ? { template: t } : 'scratch')}
        />
      </div>
    );
  }

  if (selection === 'scratch') {
    return (
      <div className="space-y-4">
        <JournalEditor initialContent="" onSave={() => setSelection(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <JournalEditorWithSections
        template={selection.template}
        onSave={() => setSelection(null)}
      />
    </div>
  );
};

export default JournalTemplateDemo;
