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
  onSave: (markdown: string) => void;
  readOnly?: boolean;
  className?: string;
}

const JournalEditor: React.FC<JournalEditorProps> = ({
  initialContent,
  onSave,
  readOnly = false,
  className = '',
}) => {
  const DRAFT_KEY = 'journalEditorDraft';
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

  useEffect(() => {
    if (!editor || readOnly) return;

    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved && saved !== initialContent) {
      const restore = window.confirm('You have an unsaved draft \u2013 restore?');
      if (restore) {
        editor.commands.setContent(saved);
      } else {
        localStorage.removeItem(DRAFT_KEY);
      }
    }

    const interval = setInterval(() => {
      const markdown = (editor.storage.markdown as { getMarkdown: () => string }).getMarkdown();
      localStorage.setItem(DRAFT_KEY, markdown);
    }, 5000);

    return () => clearInterval(interval);
  }, [editor, initialContent, readOnly]);

  const handleSave = async () => {
    if (!editor) return;
    setIsSaving(true);
    const markdown = (editor.storage.markdown as { getMarkdown: () => string }).getMarkdown();
    await Promise.resolve(onSave(markdown));
    localStorage.removeItem(DRAFT_KEY);
    setIsSaving(false);
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
