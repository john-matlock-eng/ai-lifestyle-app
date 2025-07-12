import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import type { Editor, UseEditorOptions } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import Placeholder from '@tiptap/extension-placeholder';
import ReactMarkdown from 'react-markdown';
import {
  Bold,
  Italic,
  Heading,
  List,
  Strikethrough,
  CheckSquare,
  Quote,
  Code,
  Minus,
  Link as LinkIcon,
  Image as ImageIcon,
} from 'lucide-react';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Image from '@tiptap/extension-image';
import useLinkModal from '../hooks/useLinkModal';
import { Button } from '@/components/common';
import type { SectionDefinition } from '../types/template.types';
import TemplateSection from '../extensions/TemplateSection';

export interface EditorSectionProps {
  section: SectionDefinition;
  initialContent?: string;
  readOnly?: boolean;
  draftId?: string;
  onChange?: (markdown: string) => void;
  saveSignal?: number;
}

const EditorSection: React.FC<EditorSectionProps> = ({
  section,
  initialContent = '',
  readOnly = false,
  draftId,
  onChange,
  saveSignal = 0,
}) => {
  const DRAFT_KEY = draftId ? `journal-draft-${draftId}` : undefined;

  const editor = useEditor({
    extensions: [
      TemplateSection.configure({ defaultPrivacy: section.defaultPrivacy ?? 'private' }),
      StarterKit,
      TaskList,
      TaskItem,
      Link,
      Image,
      Markdown,
      Placeholder.configure({
        placeholder: section.prompt,
      }),
    ],
    content: initialContent,
    editable: !readOnly,
    keyboardShortcuts: {
      'Mod-b': () => editor?.commands.toggleBold(),
      'Mod-i': () => editor?.commands.toggleItalic(),
      'Mod-Shift-7': () => editor?.commands.toggleOrderedList(),
      'Mod-Shift-8': () => editor?.commands.toggleBulletList(),
      'Mod-Shift-x': () => editor?.commands.toggleStrike(),
      'Mod-Shift-c': () => editor?.commands.toggleTaskList(),
      'Mod-Shift-b': () => editor?.commands.toggleBlockquote(),
      'Mod-Shift-k': () => editor?.commands.toggleCodeBlock(),
      'Mod-Shift-h': () => editor?.commands.setHorizontalRule(),
      'Mod-k': () => {
        openLink();
        return true;
      },
      'Mod-Shift-i': () => {
        insertImage();
        return true;
      },
    },
    onCreate({ editor }: { editor: Editor }) {
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
    },
  } as UseEditorOptions & {
    keyboardShortcuts: Record<string, () => boolean | void>;
  });

  const openLink = useLinkModal(editor);
  const insertImage = () => {
    if (!editor) return;
    const url = window.prompt('Enter image URL');
    if (url) {
      editor.chain().focus().insertContent({ type: 'image', attrs: { src: url } }).run();
    }
  };

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
  }, [editor, saveSignal]);

  useEffect(() => {
    if (!editor) return;
    const handleUpdate = ({ editor: updatedEditor }: { editor: Editor; transaction: unknown }) => {
      const markdown = (updatedEditor.storage.markdown as { getMarkdown: () => string }).getMarkdown();
      onChange?.(markdown);
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

  if (readOnly) {
    return (
      <div className="prose max-w-none">
        <ReactMarkdown>{initialContent}</ReactMarkdown>
      </div>
    );
  }

  if (!editor) return null;

  return (
    <div className="space-y-2">
      {restoreDraft && (
        <div className="flex items-center justify-between bg-warning-bg border border-warning-theme rounded p-2 text-sm text-warning-theme">
          <span>Unsaved draft found.</span>
          <div className="space-x-2">
            <Button size="sm" variant="outline" onClick={handleRestore}>
              Restore
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDiscard}>
              Discard
            </Button>
          </div>
        </div>
      )}
      {section.prompt && (
        <div className="flex items-start gap-2 bg-surface-muted p-2 rounded text-sm italic text-text-muted">
          <span role="img" aria-label="prompt">
            💡
          </span>
          <p>{section.prompt}</p>
        </div>
      )}
      <div className="flex gap-2 border-b border-surface-muted pb-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1 rounded hover:bg-button-hover-bg transition-colors ${editor.isActive('bold') ? 'bg-accent text-white' : 'text-text-secondary'}`}
          aria-label="Toggle bold"
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1 rounded hover:bg-button-hover-bg transition-colors ${editor.isActive('italic') ? 'bg-accent text-white' : 'text-text-secondary'}`}
          aria-label="Toggle italic"
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1 rounded hover:bg-button-hover-bg transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-accent text-white' : 'text-text-secondary'}`}
          aria-label="Toggle heading"
          title="Heading"
        >
          <Heading className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1 rounded hover:bg-button-hover-bg transition-colors ${editor.isActive('bulletList') ? 'bg-accent text-white' : 'text-text-secondary'}`}
          aria-label="Toggle bullet list"
          title="Bullet list"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-1 rounded hover:bg-gray-200 ${editor.isActive('strike') ? 'bg-gray-300' : ''}`}
          aria-label="Toggle strikethrough"
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={`p-1 rounded hover:bg-gray-200 ${editor.isActive('taskList') ? 'bg-gray-300' : ''}`}
          aria-label="Toggle checklist"
          title="Checklist"
        >
          <CheckSquare className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1 rounded hover:bg-gray-200 ${editor.isActive('blockquote') ? 'bg-gray-300' : ''}`}
          aria-label="Toggle blockquote"
          title="Blockquote"
        >
          <Quote className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`p-1 rounded hover:bg-gray-200 ${editor.isActive('codeBlock') ? 'bg-gray-300' : ''}`}
          aria-label="Toggle code block"
          title="Code block"
        >
          <Code className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="p-1 rounded hover:bg-gray-200"
          aria-label="Insert horizontal rule"
          title="Horizontal rule"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={openLink}
          className={`p-1 rounded hover:bg-gray-200 ${editor.isActive('link') ? 'bg-gray-300' : ''}`}
          aria-label="Add link"
          title="Link"
        >
          <LinkIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={insertImage}
          className="p-1 rounded hover:bg-gray-200"
          aria-label="Insert image"
          title="Image"
        >
          <ImageIcon className="w-4 h-4" />
        </button>
      </div>
      <EditorContent
        editor={editor}
        className="border border-surface-muted bg-surface rounded-lg p-4 min-h-[300px] focus-visible:outline-none focus-visible:shadow-focus transition-all"
      />
    </div>
  );
};

export default EditorSection;
