import React from 'react';
import type { JournalTemplate } from '../../types/template.types';
import { useTemplateRegistry } from '../../hooks/useTemplateRegistry';

interface TemplatePickerProps {
  onSelect: (template: JournalTemplate | null) => void;
}

const TemplatePicker: React.FC<TemplatePickerProps> = ({ onSelect }) => {
  const { templates, loading, error } = useTemplateRegistry();
  if (loading) {
    return <div className="p-4" role="status">Loading templates...</div>;
  }
  if (error) {
    return (
      <div className="p-4" role="alert">
        Failed to load templates. Using defaults.
      </div>
    );
  }
  if (templates.length === 0) {
    return (
      <div className="p-4" role="status">
        No templates found.
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <button
        type="button"
        className="border rounded p-2 w-full text-left hover:bg-gray-50"
        onClick={() => onSelect(null)}
        aria-label="Start from scratch"
      >
        Start from Scratch
      </button>
      {templates.map((t) => (
        <button
          key={t.id}
          type="button"
          className="border rounded p-2 w-full text-left hover:bg-gray-50"
          onClick={() => onSelect(t)}
          aria-label={`${t.name} template`}
        >
          <div className="font-semibold">{t.name}</div>
          <div className="text-sm text-gray-500">{t.description}</div>
        </button>
      ))}
    </div>
  );
};

export default TemplatePicker;
