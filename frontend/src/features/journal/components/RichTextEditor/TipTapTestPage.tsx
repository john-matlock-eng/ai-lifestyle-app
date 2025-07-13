// TipTapTestPage.tsx - Test page for the fixed editor
import React, { useState } from 'react';
import RichTextEditor from './RichTextEditor';

const TipTapTestPage: React.FC = () => {
  const [content, setContent] = useState(`# Welcome to the Fixed Editor!

This editor now properly handles:

## Text Selection and Replacement
Try selecting any word in this sentence and typing to replace it.

## Working Toolbar
All the buttons in the toolbar above should work properly:
- **Bold text** (Ctrl/Cmd+B)
- *Italic text* (Ctrl/Cmd+I)
- ~~Strikethrough~~
- \`Inline code\`

### Lists Work Too
- Bullet point one
- Bullet point two
  - Nested bullet

1. Numbered item
2. Another numbered item

### Task Lists
- [ ] Unchecked task
- [x] Checked task

> Blockquotes are styled nicely

\`\`\`javascript
// Code blocks work too
const greeting = "Hello, World!";
console.log(greeting);
\`\`\`

---

## Bubble Menu
Select any text to see the bubble menu with quick formatting options.

## Floating Menu
Start a new line to see the floating menu for quick block insertions.
`);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-theme mb-2">
            TipTap Editor Test Page
          </h1>
          <p className="text-muted">
            Testing the fixes for text selection and toolbar functionality
          </p>
        </div>

        <div className="bg-surface rounded-lg shadow-lg p-6 border border-surface-muted">
          <h2 className="text-xl font-semibold mb-4">Fixed Issues:</h2>
          <ul className="list-disc list-inside space-y-2 text-muted mb-6">
            <li>✅ Text selection and replacement now works properly</li>
            <li>✅ Toolbar buttons execute commands correctly</li>
            <li>✅ Bubble menu has delay to not interfere with selection</li>
            <li>✅ Focus is properly maintained when using toolbar</li>
            <li>✅ All formatting options work as expected</li>
          </ul>

          <h2 className="text-xl font-semibold mb-4">Editor Demo:</h2>
          <RichTextEditor
            content={content}
            onChange={setContent}
            placeholder="Start typing to test the editor..."
            minHeight="300px"
            maxHeight="600px"
            showToolbar={true}
            showBubbleMenu={true}
            showFloatingMenu={true}
          />
        </div>

        <div className="bg-surface rounded-lg shadow-lg p-6 border border-surface-muted">
          <h2 className="text-xl font-semibold mb-4">Markdown Output:</h2>
          <pre className="bg-surface-hover p-4 rounded-lg overflow-x-auto text-sm">
            <code>{content}</code>
          </pre>
        </div>

        <div className="bg-surface rounded-lg shadow-lg p-6 border border-surface-muted">
          <h2 className="text-xl font-semibold mb-4">Test Instructions:</h2>
          <ol className="list-decimal list-inside space-y-2 text-muted">
            <li>Select any word and type to replace it</li>
            <li>Try all toolbar buttons - they should all work</li>
            <li>Select text to see the bubble menu (with delay)</li>
            <li>Create a new line to see the floating menu</li>
            <li>Test keyboard shortcuts (Cmd/Ctrl+B for bold, etc.)</li>
            <li>Try nested lists and task lists</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default TipTapTestPage;