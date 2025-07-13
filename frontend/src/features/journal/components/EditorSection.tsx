import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import type { Editor } from '@tiptap/react';
import type { Transaction } from '@tiptap/pm/state';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import Placeholder from '@tiptap/extension-placeholder';
import { Extension } from '@tiptap/core';
import ReactMarkdown from 'react-markdown';
import { 
  Bold, 
  Italic, 
  Heading, 
  List,
  ListOrdered,
  Quote,
  Code,
  Minus,
  Lock,
  Globe,
  Users,
  Sparkles,
  ChevronDown,
  RotateCcw,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/common';
import type { SectionDefinition } from '../types/template.types';
import TemplateSection from '../extensions/TemplateSection';
import '../styles/journal-editor.css';

export interface EditorSectionProps {
  section: SectionDefinition;
  initialContent?: string;
  readOnly?: boolean;
  draftId?: string;
  onChange?: (markdown: string) => void;
  saveSignal?: number;
  icon?: React.ReactNode;
}

const EditorSection: React.FC<EditorSectionProps> = ({
  section,
  initialContent = '',
  readOnly = false,
  draftId,
  onChange,
  saveSignal = 0,
  icon,
}) => {
  const DRAFT_KEY = draftId ? `journal-draft-${draftId}` : undefined;
  const [isExpanded, setIsExpanded] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  const ExtraShortcuts = Extension.create({
    addKeyboardShortcuts() {
      return {
        'Mod-b': () => this.editor.commands.toggleBold(),
        'Mod-i': () => this.editor.commands.toggleItalic(),
        'Mod-Shift-7': () => this.editor.commands.toggleOrderedList(),
        'Mod-Shift-8': () => this.editor.commands.toggleBulletList(),
      };
    },
  });

  const editor = useEditor({
    extensions: [
      TemplateSection.configure({ defaultPrivacy: section.defaultPrivacy ?? 'private' }),
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Markdown,
      Placeholder.configure({
        placeholder: section.prompt,
        emptyEditorClass: 'is-editor-empty',
      }),
      ExtraShortcuts,
    ],
    content: initialContent,
    editable: !readOnly,
    onCreate({ editor }) {
      const doc = editor.getJSON().content ?? [];
      editor.commands.setContent({
        type: 'doc',
        content: [
          {
            type: 'template_section',
            attrs: {
              id: section.id,
              title: section.title,
              privacy: section.defaultPrivacy ?? 'private',
            },
            content: doc,
          },
        ],
      });
      // Set initial word count
      setWordCount(editor.getText().split(/\s+/).filter(word => word.length > 0).length);
    },
  });

  const [lastSaved, setLastSaved] = useState(initialContent);
  const [restoreDraft, setRestoreDraft] = useState<string | null>(null);

  useEffect(() => {
    if (!editor || readOnly || !DRAFT_KEY) return;

    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft && draft !== lastSaved) {
      setRestoreDraft(draft);
    }

    const interval = setInterval(() => {
      const markdown = (editor.storage.markdown as { getMarkdown: () => string }).getMarkdown();
      if (markdown !== lastSaved) {
        localStorage.setItem(DRAFT_KEY, markdown);
      } else {
        localStorage.removeItem(DRAFT_KEY);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [editor, readOnly, DRAFT_KEY, lastSaved]);

  useEffect(() => {
    setLastSaved(initialContent);
  }, [initialContent]);

  useEffect(() => {
    if (!editor) return;
    const markdown = (editor.storage.markdown as { getMarkdown: () => string }).getMarkdown();
    setLastSaved(markdown);
    setHasUnsavedChanges(false);
  }, [editor, saveSignal]);

  useEffect(() => {
    if (!editor) return;
    const handleUpdate = ({ editor: updatedEditor }: { editor: Editor; transaction: Transaction }) => {
      const markdown = (updatedEditor.storage.markdown as { getMarkdown: () => string }).getMarkdown();
      onChange?.(markdown);
      setHasUnsavedChanges(true);
      setWordCount(updatedEditor.getText().split(/\s+/).filter(word => word.length > 0).length);
    };
    editor.on('update', handleUpdate);
    return () => {
      editor.off('update', handleUpdate);
    };
  }, [editor, onChange]);

  const handleRestore = () => {
    if (!editor || !restoreDraft) return;
    editor.commands.setContent(restoreDraft);
    setRestoreDraft(null);
  };

  const handleDiscard = () => {
    if (DRAFT_KEY) localStorage.removeItem(DRAFT_KEY);
    setRestoreDraft(null);
  };

  // Toolbar button component
  const ToolbarButton = ({ 
    onClick, 
    isActive = false, 
    children, 
    title 
  }: { 
    onClick: () => void; 
    isActive?: boolean; 
    children: React.ReactNode; 
    title: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`
        journal-toolbar-btn
        ${isActive ? 'active' : ''}
      `}
    >
      {children}
    </button>
  );

  const privacyIcons = {
    private: <Lock className="w-4 h-4" />,
    ai: <Sparkles className="w-4 h-4" />,
    shared: <Users className="w-4 h-4" />,
    public: <Globe className="w-4 h-4" />
  };

  const privacyLabels = {
    private: 'Private',
    ai: 'AI Analysis',
    shared: 'Shared',
    public: 'Public'
  };

  if (!editor) return null;

  return (
    <div className={`
      journal-section
      relative overflow-hidden rounded-2xl
      bg-gradient-to-br from-surface via-surface to-surface-hover
      border border-surface-muted/50
      shadow-lg hover:shadow-xl
      transition-all duration-300
      ${!readOnly && hasUnsavedChanges ? 'ring-2 ring-accent/50' : ''}
    `}>
      {/* Section Header */}
      <div 
        className={`
          px-6 py-4 
          journal-section-header
          border-b border-surface-muted/30
          cursor-pointer select-none
          ${!isExpanded ? 'hover:bg-surface-muted/30' : ''}
        `}
        onClick={() => !readOnly && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="p-2 rounded-lg bg-accent/10 text-accent">
                {icon}
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-theme flex items-center gap-2">
                {section.title}
                {hasUnsavedChanges && (
                  <span className="unsaved-indicator" />
                )}
              </h3>
              {wordCount > 0 && (
                <p className="text-sm text-muted mt-0.5">
                  {wordCount} words
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {section.defaultPrivacy && (
              <div className={`privacy-badge ${section.defaultPrivacy}`}>
                {privacyIcons[section.defaultPrivacy]}
                <span>{privacyLabels[section.defaultPrivacy]}</span>
              </div>
            )}
            {!readOnly && (
              <ChevronDown 
                className={`
                  w-5 h-5 text-muted transition-transform duration-200
                  ${isExpanded ? 'rotate-180' : ''}
                `}
              />
            )}
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className={`
        journal-section-content ${isExpanded ? 'expanded' : 'collapsed'}
      `}>
        {restoreDraft && (
          <div className="mx-6 mt-4 flex items-center justify-between bg-warning/10 border border-warning rounded-lg p-3 text-sm">
            <span className="text-warning font-medium">Unsaved draft found</span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={handleRestore} className="hover:bg-warning/20">
                <RotateCcw className="w-3 h-3 mr-1" />
                Restore
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDiscard} className="hover:bg-error/20">
                <Trash2 className="w-3 h-3 mr-1" />
                Discard
              </Button>
            </div>
          </div>
        )}

        {!readOnly && (
          <div className="px-6 py-3 border-b border-surface-muted/30">
            <div className="flex items-center gap-1 flex-wrap">
              <div className="flex items-center gap-1 mr-3">
                <ToolbarButton
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  isActive={editor.isActive('bold')}
                  title="Bold (Cmd+B)"
                >
                  <Bold className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  isActive={editor.isActive('italic')}
                  title="Italic (Cmd+I)"
                >
                  <Italic className="w-4 h-4" />
                </ToolbarButton>
              </div>

              <div className="flex items-center gap-1 mr-3">
                <ToolbarButton
                  onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                  isActive={editor.isActive('heading', { level: 2 })}
                  title="Heading"
                >
                  <Heading className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                  isActive={editor.isActive('bulletList')}
                  title="Bullet List"
                >
                  <List className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                  onClick={() => editor.chain().focus().toggleOrderedList().run()}
                  isActive={editor.isActive('orderedList')}
                  title="Ordered List"
                >
                  <ListOrdered className="w-4 h-4" />
                </ToolbarButton>
              </div>

              <div className="flex items-center gap-1">
                <ToolbarButton
                  onClick={() => editor.chain().focus().toggleBlockquote().run()}
                  isActive={editor.isActive('blockquote')}
                  title="Quote"
                >
                  <Quote className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                  onClick={() => editor.chain().focus().toggleCode().run()}
                  isActive={editor.isActive('code')}
                  title="Code"
                >
                  <Code className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                  onClick={() => editor.chain().focus().setHorizontalRule().run()}
                  title="Divider"
                >
                  <Minus className="w-4 h-4" />
                </ToolbarButton>
              </div>
            </div>
          </div>
        )}

        <div className="px-6 py-4">
          {readOnly ? (
            <div className="prose prose-lg max-w-none dark:prose-invert">
              <ReactMarkdown>{initialContent}</ReactMarkdown>
            </div>
          ) : (
            <EditorContent 
              editor={editor}
              className="journal-editor"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default EditorSection;