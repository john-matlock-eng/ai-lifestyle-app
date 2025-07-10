import React from 'react';
import type { JournalTemplate } from '../JournalEditorWithSections';
import { useTemplateRegistry } from '../../hooks/useTemplateRegistry';

interface TemplatePickerProps {
  onSelect: (template: JournalTemplate | null) => void;
}

const TemplatePicker: React.FC<TemplatePickerProps> = ({ onSelect }) => {
  const templates = useTemplateRegistry();
  return (
    <div className="space-y-2">
      <button
        type="button"
        className="border rounded p-2 w-full text-left hover:bg-gray-50"
        onClick={() => onSelect(null)}
      >
        Start from Scratch
      </button>
      {templates.map((t) => (
        <button
          key={t.id}
          type="button"
          className="border rounded p-2 w-full text-left hover:bg-gray-50"
          onClick={() => onSelect(t)}
        >
          <div className="font-semibold">{t.name}</div>
          <div className="text-sm text-gray-500">{t.description}</div>
        </button>
      ))}
    </div>
  );
};

export default TemplatePicker;
