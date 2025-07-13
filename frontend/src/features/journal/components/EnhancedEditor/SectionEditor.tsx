// SectionEditor.tsx
import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import {
  ChevronDown,
  Check,
  Plus,
  X,
  Tag,
  Target
} from 'lucide-react';
import type { SectionDefinition } from '../../types/enhanced-template.types';

import type { Goal } from '@/features/goals/types/api.types';

export interface SectionEditorProps {
  section: SectionDefinition;
  value: string | number | string[] | Record<string, boolean>;
  onChange: (value: string | number | string[] | Record<string, boolean>) => void;
  isCompleted?: boolean;
  availableGoals?: Goal[];
}

export const SectionEditor: React.FC<SectionEditorProps> = ({
  section,
  value,
  onChange,
  isCompleted = false,
  availableGoals = []
}) => {
  const [isExpanded, setIsExpanded] = React.useState(true);

  const renderInput = () => {
    switch (section.type) {
      case 'text':
        return <TextInput section={section} value={value as string} onChange={onChange} />;
      case 'scale':
        return <ScaleInput section={section} value={value as number} onChange={onChange} />;
      case 'mood':
        return <MoodInput section={section} value={value as string} onChange={onChange} />;
      case 'choice':
        return <ChoiceInput section={section} value={value as string} onChange={onChange} />;
      case 'tags':
        return <TagsInput section={section} value={value as string[]} onChange={onChange} />;
      case 'goals':
        return <GoalsInput section={section} value={value as string[]} onChange={onChange} availableGoals={availableGoals} />;
      case 'checklist':
        return <ChecklistInput section={section} value={value as Record<string, boolean>} onChange={onChange} />;
      default:
        return <div>Unsupported input type: {section.type}</div>;
    }
  };

  return (
    <div className={`
      section-editor rounded-xl border transition-all duration-300
      ${isCompleted ? 'border-success/50 bg-success/5' : 'border-surface-muted bg-surface'}
      ${isExpanded ? 'shadow-sm' : ''}
    `}>
      <div
        className="px-4 py-3 flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          {isCompleted && <Check className="w-4 h-4 text-success" />}
          <h3 className="font-medium text-theme">
            {section.title}
            {section.required && <span className="text-error ml-1">*</span>}
          </h3>
        </div>
        <ChevronDown className={`
          w-4 h-4 text-muted transition-transform
          ${isExpanded ? 'rotate-180' : ''}
        `} />
      </div>

      {isExpanded && (
        <div className="px-4 pb-4">
          <p className="text-sm text-muted mb-3">{section.prompt}</p>
          {renderInput()}
        </div>
      )}
    </div>
  );
};

// Text Input with TipTap
const TextInput: React.FC<{
  section: SectionDefinition;
  value: string;
  onChange: (value: string | number | string[] | Record<string, boolean>) => void;
}> = ({ section, value, onChange }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: section.prompt,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getText());
    },
  });

  if (!editor) return null;

  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <EditorContent 
        editor={editor} 
        className="min-h-[100px] p-3 bg-surface-hover rounded-lg border border-surface-muted focus-within:border-accent transition-colors"
      />
    </div>
  );
};

// Scale Input
const ScaleInput: React.FC<{
  section: SectionDefinition;
  value: number;
  onChange: (value: string | number | string[] | Record<string, boolean>) => void;
}> = ({ section, value, onChange }) => {
  const min = section.options?.min || 1;
  const max = section.options?.max || 10;

  return (
    <div className="space-y-3">
      <input
        type="range"
        min={min}
        max={max}
        value={value || min}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-surface-muted rounded-lg appearance-none cursor-pointer slider"
      />
      <div className="flex justify-between">
        {Array.from({ length: max - min + 1 }, (_, i) => min + i).map(n => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`
              w-10 h-10 rounded-full text-sm font-medium transition-all
              ${value === n 
                ? 'bg-accent text-white scale-110' 
                : 'bg-surface-muted hover:bg-surface-hover'
              }
            `}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
};

// Mood Input
const MoodInput: React.FC<{
  section: SectionDefinition;
  value: string;
  onChange: (value: string | number | string[] | Record<string, boolean>) => void;
}> = ({ section, value, onChange }) => {
  const moods = section.options?.moods || [];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
      {moods.map(mood => (
        <button
          key={mood.value}
          onClick={() => onChange(mood.value)}
          className={`
            p-3 rounded-xl text-center transition-all
            ${value === mood.value 
              ? 'bg-accent/10 ring-2 ring-accent scale-105' 
              : 'bg-surface-muted hover:bg-surface-hover'
            }
          `}
        >
          <div className="text-2xl mb-1">{mood.emoji}</div>
          <div className="text-xs">{mood.label}</div>
        </button>
      ))}
    </div>
  );
};

// Choice Input
const ChoiceInput: React.FC<{
  section: SectionDefinition;
  value: string;
  onChange: (value: string | number | string[] | Record<string, boolean>) => void;
}> = ({ section, value, onChange }) => {
  const choices = section.options?.choices || [];

  return (
    <div className="space-y-2">
      {choices.map(choice => (
        <label
          key={choice.value}
          className={`
            block p-3 rounded-lg cursor-pointer transition-all
            ${value === choice.value 
              ? 'bg-accent/10 ring-2 ring-accent' 
              : 'bg-surface-muted hover:bg-surface-hover'
            }
          `}
        >
          <input
            type="radio"
            name={section.id}
            value={choice.value}
            checked={value === choice.value}
            onChange={() => onChange(choice.value)}
            className="sr-only"
          />
          <div className="flex items-center gap-2">
            {choice.icon && <span>{choice.icon}</span>}
            <span className="flex-1">{choice.label}</span>
            {value === choice.value && <Check className="w-4 h-4 ml-auto text-accent" />}
          </div>
        </label>
      ))}
    </div>
  );
};

// Tags Input
const TagsInput: React.FC<{
  section: SectionDefinition;
  value: string[];
  onChange: (value: string | number | string[] | Record<string, boolean>) => void;
}> = ({ value = [], onChange }) => {
  const [inputValue, setInputValue] = React.useState('');

  const addTag = () => {
    const trimmed = inputValue.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
      setInputValue('');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {value.map(tag => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-3 py-1 bg-accent/10 text-accent rounded-full text-sm"
          >
            <Tag className="w-3 h-3" />
            {tag}
            <button
              onClick={() => onChange(value.filter(t => t !== tag))}
              className="ml-1 hover:text-error"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
          placeholder="Add a tag..."
          className="flex-1 px-3 py-2 rounded-lg bg-surface-hover border border-surface-muted focus:border-accent outline-none"
        />
        <button
          onClick={addTag}
          className="px-4 py-2 rounded-lg bg-accent text-white hover:bg-accent/90"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Goals Input
const GoalsInput: React.FC<{
  section: SectionDefinition;
  value: string[];
  onChange: (value: string | number | string[] | Record<string, boolean>) => void;
  availableGoals: Goal[];
}> = ({ value = [], onChange, availableGoals }) => {
  return (
    <div className="space-y-2">
      {availableGoals.length === 0 ? (
        <p className="text-sm text-muted">No active goals available. Create some goals first!</p>
      ) : (
        <>
          {availableGoals.map(goal => (
            <label
              key={goal.goalId}
              className={`
                flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all
                ${value.includes(goal.goalId) 
                  ? 'bg-accent/10 ring-2 ring-accent' 
                  : 'bg-surface-muted hover:bg-surface-hover'
                }
              `}
            >
              <input
                type="checkbox"
                checked={value.includes(goal.goalId)}
                onChange={(e) => {
                  if (e.target.checked) {
                    onChange([...value, goal.goalId]);
                  } else {
                    onChange(value.filter(id => id !== goal.goalId));
                  }
                }}
                className="sr-only"
              />
              <Target className="w-4 h-4 text-accent" />
              <div className="flex-1">
                <div className="font-medium">{goal.title}</div>
                {goal.category && <div className="text-xs text-muted">{goal.category}</div>}
              </div>
              {value.includes(goal.goalId) && <Check className="w-4 h-4 text-accent" />}
            </label>
          ))}
        </>
      )}
    </div>
  );
};

// Checklist Input
const ChecklistInput: React.FC<{
  section: SectionDefinition;
  value: Record<string, boolean>;
  onChange: (value: string | number | string[] | Record<string, boolean>) => void;
}> = ({ section, value = {}, onChange }) => {
  const items = section.options?.items || [];

  return (
    <div className="space-y-2">
      {items.map(item => (
        <label
          key={item.id}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-muted cursor-pointer"
        >
          <input
            type="checkbox"
            checked={value[item.id] || false}
            onChange={(e) => onChange({ ...value, [item.id]: e.target.checked })}
            className="w-4 h-4 rounded border-surface-muted text-accent focus:ring-accent"
          />
          <span className={value[item.id] ? 'line-through text-muted' : ''}>
            {item.label}
          </span>
        </label>
      ))}
    </div>
  );
};

export default SectionEditor;