// RichTextEditor Test Page - Verify the fixes work correctly
import React, { useState } from "react";
import RichTextEditor from "./RichTextEditor";

const RichTextEditorTestPage: React.FC = () => {
  const [content1, setContent1] = useState("");
  const [content2, setContent2] = useState(
    "# Test with menus enabled\n\nTry selecting text to see the bubble menu.",
  );
  const [content3] = useState(
    "## Readonly Example\n\nThis editor is in read-only mode.",
  );

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold mb-4">
            Rich Text Editor Test Page
          </h1>
          <p className="text-muted mb-8">
            Testing the fixes for the editor. The main issues were:
          </p>
          <ul className="list-disc list-inside text-muted mb-8 space-y-1">
            <li>Floating/bubble menus appearing over the text area</li>
            <li>DOM manipulation errors when typing</li>
          </ul>
        </div>

        {/* Test 1: Default Settings (Safest) */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-2">
              Test 1: Default Settings (Recommended)
            </h2>
            <p className="text-sm text-muted mb-4">
              This uses the default settings with menus disabled. This is the
              safest configuration.
            </p>
          </div>
          <div className="bg-surface rounded-lg p-4">
            <RichTextEditor
              content={content1}
              onChange={setContent1}
              placeholder="Start typing here... The menus are disabled by default to prevent issues."
              minHeight="150px"
            />
          </div>
          <div className="bg-surface-muted rounded p-3">
            <p className="text-xs font-mono">{content1 || "(empty)"}</p>
          </div>
        </div>

        {/* Test 2: With Bubble Menu Enabled */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-2">
              Test 2: With Bubble Menu Enabled
            </h2>
            <p className="text-sm text-muted mb-4">
              This has the bubble menu enabled. Select some text to see it
              appear. It should not interfere with typing.
            </p>
          </div>
          <div className="bg-surface rounded-lg p-4">
            <RichTextEditor
              content={content2}
              onChange={setContent2}
              placeholder="Select text to see bubble menu..."
              minHeight="150px"
              showBubbleMenu={true}
              showFloatingMenu={false}
            />
          </div>
        </div>

        {/* Test 3: Read Only */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-2">
              Test 3: Read-Only Mode
            </h2>
            <p className="text-sm text-muted mb-4">
              This editor is in read-only mode. No menus should appear.
            </p>
          </div>
          <div className="bg-surface rounded-lg p-4">
            <RichTextEditor
              content={content3}
              onChange={() => {}}
              readOnly={true}
              minHeight="100px"
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 mt-8">
          <h3 className="font-semibold mb-2">Testing Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>
              Try typing in the first editor - it should work without any issues
            </li>
            <li>
              Try using the toolbar buttons - they should apply formatting
              correctly
            </li>
            <li>
              In the second editor, select some text to see the bubble menu
            </li>
            <li>
              The bubble menu should appear above the selection, not over it
            </li>
            <li>Typing should hide any visible menus immediately</li>
            <li>No DOM errors should occur when typing</li>
          </ol>
        </div>

        {/* Markdown Reference */}
        <div className="bg-surface rounded-lg p-4">
          <h3 className="font-semibold mb-2">Markdown Shortcuts:</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p>
                <code>**bold**</code> → <strong>bold</strong>
              </p>
              <p>
                <code>*italic*</code> → <em>italic</em>
              </p>
              <p>
                <code>`code`</code> → <code>code</code>
              </p>
              <p>
                <code># Heading 1</code>
              </p>
            </div>
            <div>
              <p>
                <code>## Heading 2</code>
              </p>
              <p>
                <code>&gt; Quote</code>
              </p>
              <p>
                <code>- List item</code>
              </p>
              <p>
                <code>- [ ] Task</code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RichTextEditorTestPage;
