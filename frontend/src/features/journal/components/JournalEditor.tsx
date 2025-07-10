import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import ReactMarkdown from 'react-markdown';
import { Bold, Italic, Heading, List } from 'lucide-react';

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
  const editor = useEditor({
    extensions: [StarterKit, Markdown],
    content: initialContent,
    editable: !readOnly,
  });

  const handleSave = () => {
    if (!editor) return;
    const markdown = (editor.storage.markdown as { getMarkdown: () => string }).getMarkdown();
    onSave(markdown);
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
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1 rounded hover:bg-gray-200 ${editor.isActive('italic') ? 'bg-gray-300' : ''}`}
          aria-label="Toggle italic"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1 rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-300' : ''}`}
          aria-label="Toggle heading"
        >
          <Heading className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1 rounded hover:bg-gray-200 ${editor.isActive('bulletList') ? 'bg-gray-300' : ''}`}
          aria-label="Toggle bullet list"
        >
          <List className="w-4 h-4" />
        </button>
      </div>
      <EditorContent editor={editor} className="border rounded p-3 min-h-[200px]" />
      <div className="text-right">
        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default JournalEditor;
