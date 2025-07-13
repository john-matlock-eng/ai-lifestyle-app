// RichTextEditor.tsx - Fixed to prevent DOM manipulation errors and menu overlapping
import React, { useCallback, useRef } from 'react';
import { useEditor, EditorContent, BubbleMenu, FloatingMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Markdown } from 'tiptap-markdown';
import { CharacterCount } from './extensions';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Undo,
  Redo,
  CheckSquare,
  Minus,
  ListChecks
} from 'lucide-react';
import './rich-text-editor.css';

export interface RichTextEditorProps {
  content: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  maxHeight?: string;
  readOnly?: boolean;
  showToolbar?: boolean;
  showFloatingMenu?: boolean;
  showBubbleMenu?: boolean;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder = 'Start writing...',
  className = '',
  minHeight = '200px',
  maxHeight = '500px',
  readOnly = false,
  showToolbar = true,
  showFloatingMenu = false, // Disabled by default to prevent overlap
  showBubbleMenu = false, // Disabled by default to prevent issues
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = React.useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-accent hover:underline cursor-pointer',
        },
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: 'task-list',
        },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: 'task-item',
        },
      }),
      Markdown.configure({
        html: false,
        transformCopiedText: true,
        bulletListMarker: '-',
      }),
      CharacterCount,
    ],
    content,
    editable: !readOnly,
    editorProps: {
      attributes: {
        class: `prose prose-sm sm:prose-base dark:prose-invert max-w-none focus:outline-none ${className}`,
        style: `min-height: ${minHeight}; max-height: ${maxHeight}; overflow-y: auto;`,
      },
      handleKeyDown: () => {
        // Set typing state
        setIsTyping(true);
        
        // Clear any existing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        
        // Reset typing state after user stops typing
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
        }, 1500);
      },
    },
    onUpdate: ({ editor }) => {
      const markdown = editor.storage.markdown.getMarkdown();
      onChange(markdown);
    },
    onCreate: ({ editor }) => {
      // Focus the editor on creation
      setTimeout(() => {
        editor.commands.focus();
      }, 100);
    },
  });

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const setLink = useCallback(() => {
    if (!editor) return;
    
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  // Focus editor when clicking toolbar buttons
  const executeCommand = useCallback((command: () => boolean | void) => {
    // Ensure editor has focus before executing command
    editor?.chain().focus();
    command();
  }, [editor]);

  if (!editor) {
    return null;
  }

  const ToolbarButton = ({ 
    onClick, 
    isActive = false, 
    disabled = false,
    children, 
    title 
  }: { 
    onClick: () => void; 
    isActive?: boolean; 
    disabled?: boolean;
    children: React.ReactNode; 
    title: string;
  }) => (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault(); // Prevent focus loss
      }}
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      disabled={disabled}
      title={title}
      className={`
        journal-toolbar-btn
        ${isActive ? 'active' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {children}
    </button>
  );

  return (
    <div className="rich-text-editor relative" ref={editorRef}>
      {/* Main Toolbar */}
      {showToolbar && !readOnly && (
        <div className="toolbar sticky top-0 z-10 mb-2 p-2 bg-surface rounded-lg border border-surface-muted shadow-sm">
          <div className="flex items-center gap-1 flex-wrap">
            {/* Text Formatting */}
            <div className="flex items-center gap-1 pr-2 border-r border-surface-muted">
              <ToolbarButton
                onClick={() => executeCommand(() => editor.chain().focus().toggleBold().run())}
                isActive={editor.isActive('bold')}
                title="Bold (⌘B)"
              >
                <Bold className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => executeCommand(() => editor.chain().focus().toggleItalic().run())}
                isActive={editor.isActive('italic')}
                title="Italic (⌘I)"
              >
                <Italic className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => executeCommand(() => editor.chain().focus().toggleStrike().run())}
                isActive={editor.isActive('strike')}
                title="Strikethrough"
              >
                <Strikethrough className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => executeCommand(() => editor.chain().focus().toggleCode().run())}
                isActive={editor.isActive('code')}
                title="Inline Code (⌘E)"
              >
                <Code className="w-4 h-4" />
              </ToolbarButton>
            </div>

            {/* Headings */}
            <div className="flex items-center gap-1 px-2 border-r border-surface-muted">
              <ToolbarButton
                onClick={() => executeCommand(() => editor.chain().focus().toggleHeading({ level: 1 }).run())}
                isActive={editor.isActive('heading', { level: 1 })}
                title="Heading 1 (⌘⌥1)"
              >
                <Heading1 className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => executeCommand(() => editor.chain().focus().toggleHeading({ level: 2 }).run())}
                isActive={editor.isActive('heading', { level: 2 })}
                title="Heading 2 (⌘⌥2)"
              >
                <Heading2 className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => executeCommand(() => editor.chain().focus().toggleHeading({ level: 3 }).run())}
                isActive={editor.isActive('heading', { level: 3 })}
                title="Heading 3 (⌘⌥3)"
              >
                <Heading3 className="w-4 h-4" />
              </ToolbarButton>
            </div>

            {/* Lists */}
            <div className="flex items-center gap-1 px-2 border-r border-surface-muted">
              <ToolbarButton
                onClick={() => executeCommand(() => editor.chain().focus().toggleBulletList().run())}
                isActive={editor.isActive('bulletList')}
                title="Bullet List (⌘⇧8)"
              >
                <List className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => executeCommand(() => editor.chain().focus().toggleOrderedList().run())}
                isActive={editor.isActive('orderedList')}
                title="Numbered List (⌘⇧7)"
              >
                <ListOrdered className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => executeCommand(() => editor.chain().focus().toggleTaskList().run())}
                isActive={editor.isActive('taskList')}
                title="Task List (⌘⇧9)"
              >
                <ListChecks className="w-4 h-4" />
              </ToolbarButton>
            </div>

            {/* Block Elements */}
            <div className="flex items-center gap-1 px-2 border-r border-surface-muted">
              <ToolbarButton
                onClick={() => executeCommand(() => editor.chain().focus().toggleBlockquote().run())}
                isActive={editor.isActive('blockquote')}
                title="Quote (⌘⇧B)"
              >
                <Quote className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => executeCommand(() => editor.chain().focus().toggleCodeBlock().run())}
                isActive={editor.isActive('codeBlock')}
                title="Code Block (⌘⌥C)"
              >
                <Code className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => executeCommand(() => editor.chain().focus().setHorizontalRule().run())}
                title="Divider (---)"
              >
                <Minus className="w-4 h-4" />
              </ToolbarButton>
            </div>

            {/* Links and History */}
            <div className="flex items-center gap-1 px-2">
              <ToolbarButton
                onClick={() => executeCommand(setLink)}
                isActive={editor.isActive('link')}
                title="Insert Link (⌘K)"
              >
                <LinkIcon className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => executeCommand(() => editor.chain().focus().undo().run())}
                disabled={!editor.can().undo()}
                title="Undo (⌘Z)"
              >
                <Undo className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => executeCommand(() => editor.chain().focus().redo().run())}
                disabled={!editor.can().redo()}
                title="Redo (⌘⇧Z)"
              >
                <Redo className="w-4 h-4" />
              </ToolbarButton>
            </div>
          </div>

          {/* Markdown shortcuts guide */}
          <div className="text-xs text-muted mt-2 px-2">
            <span className="mr-4">**bold**</span>
            <span className="mr-4">*italic*</span>
            <span className="mr-4">`code`</span>
            <span className="mr-4">[link](url)</span>
            <span className="mr-4"># Heading</span>
            <span className="mr-4">&gt; Quote</span>
            <span className="mr-4">- List</span>
            <span className="mr-4">- [ ] Task</span>
          </div>
        </div>
      )}

      {/* Bubble Menu - appears when text is selected */}
      {showBubbleMenu && !readOnly && !isTyping && (
        <BubbleMenu 
          editor={editor} 
          tippyOptions={{ 
            duration: 100,
            delay: [1000, 0], // Long delay to avoid interference
            interactive: true,
            placement: 'top',
            offset: [0, 15], // Add offset to avoid overlapping text
            zIndex: 9999,
          }}
          className="bg-surface border border-surface-muted rounded-lg shadow-lg p-1 flex items-center gap-1"
          shouldShow={({ from, to, editor }) => {
            // Only show if there's actually a selection and not typing
            return from !== to && !isTyping && editor.isEditable;
          }}
        >
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Bold"
          >
            <Bold className="w-3 h-3" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Italic"
          >
            <Italic className="w-3 h-3" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            title="Strikethrough"
          >
            <Strikethrough className="w-3 h-3" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={editor.isActive('code')}
            title="Code"
          >
            <Code className="w-3 h-3" />
          </ToolbarButton>
          <div className="w-px h-4 bg-surface-muted mx-1" />
          <ToolbarButton
            onClick={setLink}
            isActive={editor.isActive('link')}
            title="Link"
          >
            <LinkIcon className="w-3 h-3" />
          </ToolbarButton>
        </BubbleMenu>
      )}

      {/* Floating Menu - appears for new lines */}
      {showFloatingMenu && !readOnly && !isTyping && (
        <FloatingMenu 
          editor={editor} 
          tippyOptions={{ 
            duration: 100,
            placement: 'left',
            offset: [-20, 0], // Offset to the left to avoid text area
            zIndex: 9999,
          }}
          className="bg-surface border border-surface-muted rounded-lg shadow-lg p-1 flex items-center gap-1"
          shouldShow={({ editor }) => {
            // Only show for empty paragraphs
            const { $from } = editor.state.selection;
            const node = $from.parent;
            return node.type.name === 'paragraph' && node.content.size === 0 && !isTyping;
          }}
        >
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title="Heading 1"
          >
            <Heading1 className="w-3 h-3" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
          >
            <Heading2 className="w-3 h-3" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Bullet List"
          >
            <List className="w-3 h-3" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Ordered List"
          >
            <ListOrdered className="w-3 h-3" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            isActive={editor.isActive('taskList')}
            title="Task List"
          >
            <CheckSquare className="w-3 h-3" />
          </ToolbarButton>
        </FloatingMenu>
      )}

      {/* Editor Content */}
      <div className="journal-editor">
        <EditorContent editor={editor} />
      </div>

      {/* Character/Word count */}
      <div className="flex items-center justify-between mt-2 text-xs text-muted">
        <span>{editor.storage.characterCount.characters()} characters</span>
        <span>{editor.storage.characterCount.words()} words</span>
      </div>
    </div>
  );
};

export default RichTextEditor;
