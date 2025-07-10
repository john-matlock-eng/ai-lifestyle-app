import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import Placeholder from '@tiptap/extension-placeholder';
import ReactMarkdown from 'react-markdown';
import { Bold, Italic, Heading, List } from 'lucide-react';
import { Button } from '@/components/common';

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
  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown,
      Placeholder.configure({
        placeholder: 'Start your journal entry...',
      }),
    ],
    content: initialContent,
    editable: !readOnly,
  });

  const [isSaving, setIsSaving] = useState(false);
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
    const markdown = (editor.storage.markdown as { getMarkdown: () => string }).getMarkdown();
    await Promise.resolve(onSave(markdown));
    localStorage.removeItem(DRAFT_KEY);
    setLastSaved(markdown);
    setIsSaving(false);
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

  if (readOnly) {
    return (
      <div className={`prose max-w-none ${className}`}>
        <ReactMarkdown>{initialContent}</ReactMarkdown>
      </div>
    );
  }

  if (!editor) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {restoreDraft && (
        <div className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded p-2 text-sm">
          <span>Unsaved draft found.</span>
          <div className="space-x-2">
            <Button size="sm" variant="outline" onClick={handleRestore}>Restore</Button>
            <Button size="sm" variant="ghost" onClick={handleDiscard}>Discard</Button>
          </div>
        </div>
      )}
      <div className="flex gap-2 border-b pb-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1 rounded hover:bg-gray-200 ${editor.isActive('bold') ? 'bg-gray-300' : ''}`}
          aria-label="Toggle bold"
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1 rounded hover:bg-gray-200 ${editor.isActive('italic') ? 'bg-gray-300' : ''}`}
          aria-label="Toggle italic"
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1 rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-300' : ''}`}
          aria-label="Toggle heading"
          title="Heading"
        >
          <Heading className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1 rounded hover:bg-gray-200 ${editor.isActive('bulletList') ? 'bg-gray-300' : ''}`}
          aria-label="Toggle bullet list"
          title="Bullet list"
        >
          <List className="w-4 h-4" />
        </button>
      </div>
      <EditorContent
        editor={editor}
        className="border rounded p-4 min-h-[300px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
      />
      <div className="text-right">
        <Button type="button" onClick={handleSave} isLoading={isSaving}
          className="px-4 py-2">
          Save
        </Button>
      </div>
    </div>
  );
};

export default JournalEditor;
