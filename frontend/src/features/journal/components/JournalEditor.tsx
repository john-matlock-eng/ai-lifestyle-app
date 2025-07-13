import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import Placeholder from '@tiptap/extension-placeholder';
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
  Save,
  RotateCcw,
  Trash2,
  Check
} from 'lucide-react';
import { Button } from '@/components/common';
import '../styles/journal-editor.css';

interface JournalEditorProps {
  initialContent: string;
  onSave: (markdown: string) => void | Promise<void>;
  readOnly?: boolean;
  className?: string;
  /**
   * Identifier for draft storage. Allows multiple drafts in parallel.
   */
  draftId?: string;
}

const JournalEditor: React.FC<JournalEditorProps> = ({
  initialContent,
  onSave,
  readOnly = false,
  className = '',
  draftId,
}) => {
  const DRAFT_KEY = `journal-draft-${draftId ?? 'default'}`;
  const [wordCount, setWordCount] = useState(0);
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Markdown,
      Placeholder.configure({
        placeholder: 'Start your journal entry...',
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: initialContent,
    editable: !readOnly,
    onCreate: ({ editor }) => {
      setWordCount(editor.getText().split(/\s+/).filter(word => word.length > 0).length);
    },
    onUpdate: ({ editor }) => {
      setWordCount(editor.getText().split(/\s+/).filter(word => word.length > 0).length);
    },
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastSaved, setLastSaved] = useState(initialContent);
  const [restoreDraft, setRestoreDraft] = useState<string | null>(null);
  
  useEffect(() => {
    if (!editor || readOnly) return;
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
  }, [editor, lastSaved, readOnly, DRAFT_KEY]);

  useEffect(() => {
    setLastSaved(initialContent);
  }, [initialContent]);
  
  const handleSave = async () => {
    if (!editor) return;
    setIsSaving(true);
    try {
      const markdown = (editor.storage.markdown as { getMarkdown: () => string }).getMarkdown();
      await Promise.resolve(onSave(markdown));
      localStorage.removeItem(DRAFT_KEY);
      setLastSaved(markdown);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestore = () => {
    if (!editor || !restoreDraft) return;
    editor.commands.setContent(restoreDraft);
    setRestoreDraft(null);
  };

  const handleDiscard = () => {
    localStorage.removeItem(DRAFT_KEY);
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

  if (readOnly) {
    return (
      <div className={`prose prose-lg max-w-none dark:prose-invert ${className}`}>
        <ReactMarkdown>{initialContent}</ReactMarkdown>
      </div>
    );
  }

  if (!editor) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Draft restore notification */}
      {restoreDraft && (
        <div className="flex items-center justify-between glass p-3 rounded-lg border border-warning/30 animate-fadeInUp">
          <span className="text-warning font-medium flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-warning animate-pulse" />
            Unsaved draft found
          </span>
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

      {/* Editor Card */}
      <div className="rounded-2xl overflow-hidden shadow-lg border border-surface-muted/50 bg-surface">
        {/* Toolbar */}
        <div className="px-6 py-3 border-b border-surface-muted/30 bg-gradient-to-r from-transparent via-surface-muted/20 to-transparent">
          <div className="flex items-center justify-between">
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

            {/* Word count */}
            <div className="text-sm text-muted">
              {wordCount} words
            </div>
          </div>
        </div>

        {/* Editor */}
        <div className="p-6">
          <EditorContent
            editor={editor}
            className="journal-editor"
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className={`
            px-6 py-2.5 rounded-lg font-medium
            bg-gradient text-white shadow-lg
            transform transition-all duration-200
            hover:scale-105 hover:shadow-xl hover:shadow-accent/20
            active:scale-95
            disabled:opacity-50 disabled:cursor-not-allowed
            ${showSuccess ? 'save-success ring-4 ring-success/50' : ''}
          `}
        >
          {isSaving ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </span>
          ) : showSuccess ? (
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              Saved!
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default JournalEditor;