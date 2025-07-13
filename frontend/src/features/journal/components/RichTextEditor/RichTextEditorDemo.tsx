// RichTextEditorDemo.tsx
import React, { useState } from 'react';
import RichTextEditor from './RichTextEditor';
import { Copy, Eye, Code } from 'lucide-react';
import { Button } from '@/components/common';

const initialContent = `# Welcome to the Rich Text Editor!

This is a **powerful markdown editor** with *real-time formatting* that actually renders!

## Features

### Text Formatting
- **Bold text** with \`**text**\` or Cmd+B
- *Italic text* with \`*text*\` or Cmd+I
- ~~Strikethrough~~ with \`~~text~~\`
- \`Inline code\` with backticks
- [Links](https://example.com) with \`[text](url)\` or Cmd+K

### Lists

#### Bullet Lists
- First item
- Second item
  - Nested item
  - Another nested item
- Third item

#### Numbered Lists
1. First step
2. Second step
   1. Sub-step A
   2. Sub-step B
3. Third step

#### Task Lists
- [x] Completed task
- [ ] Pending task
- [ ] Another task to do

### Block Elements

> This is a beautifully styled blockquote. It stands out with a special border and background.
> 
> It can span multiple paragraphs too!

### Code Blocks

\`\`\`javascript
// Code blocks with syntax highlighting
function greet(name) {
  console.log(\`Hello, \${name}!\`);
  return { 
    message: "Welcome to journaling!",
    timestamp: new Date()
  };
}
\`\`\`

### Horizontal Rules

Use three dashes for a divider:

---

### Markdown Shortcuts

Type these shortcuts and they'll automatically format:
- \`#\` for heading
- \`>\` for blockquote
- \`-\` for bullet list
- \`1.\` for numbered list
- \`- [ ]\` for task list

Try editing this content to see all the features in action!`;

export const RichTextEditorDemo: React.FC = () => {
  const [content, setContent] = useState(initialContent);
  const [showMarkdown, setShowMarkdown] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    alert('Markdown copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-theme mb-2">Rich Text Editor Demo</h1>
          <p className="text-muted">
            A beautiful TipTap editor with full markdown support and real-time formatting
          </p>
        </div>

        {/* Controls */}
        <div className="flex justify-end gap-2 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMarkdown(!showMarkdown)}
          >
            <Code className="w-4 h-4 mr-2" />
            {showMarkdown ? 'Hide' : 'Show'} Markdown
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="w-4 h-4 mr-2" />
            {showPreview ? 'Hide' : 'Show'} Preview
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={copyToClipboard}
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy Markdown
          </Button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Editor */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-theme">Editor</h2>
            <div className="glass rounded-xl p-6">
              <RichTextEditor
                content={content}
                onChange={setContent}
                placeholder="Start writing your journal entry..."
                minHeight="600px"
                maxHeight="800px"
                showToolbar={true}
                showBubbleMenu={true}
                showFloatingMenu={true}
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Markdown Output */}
            {showMarkdown && (
              <div>
                <h2 className="text-xl font-semibold text-theme mb-4">Markdown Output</h2>
                <div className="glass rounded-xl p-6">
                  <pre className="whitespace-pre-wrap text-sm font-mono text-muted overflow-auto max-h-96">
                    {content}
                  </pre>
                </div>
              </div>
            )}

            {/* Preview */}
            {showPreview && (
              <div>
                <h2 className="text-xl font-semibold text-theme mb-4">Preview</h2>
                <div className="glass rounded-xl p-6">
                  <div className="prose prose-lg dark:prose-invert max-w-none">
                    <div dangerouslySetInnerHTML={{ 
                      __html: content
                        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.+?)\*/g, '<em>$1</em>')
                        .replace(/~~(.+?)~~/g, '<del>$1</del>')
                        .replace(/`(.+?)`/g, '<code>$1</code>')
                        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
                        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
                        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
                        .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
                        .replace(/^- (.+)$/gm, '<li>$1</li>')
                        .replace(/\n/g, '<br />')
                    }} />
                  </div>
                </div>
              </div>
            )}

            {/* Features */}
            <div>
              <h2 className="text-xl font-semibold text-theme mb-4">Features</h2>
              <div className="glass rounded-xl p-6">
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <span className="text-accent">✓</span>
                    <span className="text-sm">Full markdown support with live preview</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent">✓</span>
                    <span className="text-sm">Keyboard shortcuts for all formatting</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent">✓</span>
                    <span className="text-sm">Bubble menu for selected text</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent">✓</span>
                    <span className="text-sm">Floating menu for new paragraphs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent">✓</span>
                    <span className="text-sm">Task lists with checkboxes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent">✓</span>
                    <span className="text-sm">Code blocks with syntax highlighting</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent">✓</span>
                    <span className="text-sm">Beautiful blockquotes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent">✓</span>
                    <span className="text-sm">Character and word count</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Keyboard Shortcuts */}
            <div>
              <h2 className="text-xl font-semibold text-theme mb-4">Keyboard Shortcuts</h2>
              <div className="glass rounded-xl p-6">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="font-mono">⌘ + B</div>
                  <div>Bold</div>
                  <div className="font-mono">⌘ + I</div>
                  <div>Italic</div>
                  <div className="font-mono">⌘ + E</div>
                  <div>Code</div>
                  <div className="font-mono">⌘ + K</div>
                  <div>Link</div>
                  <div className="font-mono">⌘ + ⌥ + 1</div>
                  <div>Heading 1</div>
                  <div className="font-mono">⌘ + ⌥ + 2</div>
                  <div>Heading 2</div>
                  <div className="font-mono">⌘ + ⇧ + 7</div>
                  <div>Ordered List</div>
                  <div className="font-mono">⌘ + ⇧ + 8</div>
                  <div>Bullet List</div>
                  <div className="font-mono">⌘ + ⇧ + 9</div>
                  <div>Task List</div>
                  <div className="font-mono">⌘ + Z</div>
                  <div>Undo</div>
                  <div className="font-mono">⌘ + ⇧ + Z</div>
                  <div>Redo</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RichTextEditorDemo;