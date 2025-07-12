import { describe, it, beforeEach, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditorSection from '@features/journal/components/EditorSection';
import type { SectionDefinition } from '@features/journal/types/template.types';
import type { Editor } from '@tiptap/react';

const section: SectionDefinition = { id: 'sec', title: 'Sec', prompt: '' };

describe('EditorSection toolbar', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('applies strikethrough via button', async () => {
    render(
      <EditorSection section={section} initialContent="text" onChange={() => {}} />
    );
    const editorEl = screen.getByRole('textbox') as HTMLElement & { editor: Editor };
    const instance = editorEl.editor;
    act(() => {
      instance.commands.selectAll();
    });
    await userEvent.click(screen.getByRole('button', { name: /strikethrough/i }));
    expect(instance.getHTML()).toContain('<s>text</s>');
  });

  it('blockquote shortcut works', async () => {
    render(
      <EditorSection section={section} initialContent="text" onChange={() => {}} />
    );
    const editorEl = screen.getByRole('textbox') as HTMLElement & { editor: Editor };
    const instance = editorEl.editor;
    act(() => {
      instance.commands.selectAll();
      instance.commands.keyboardShortcut('Mod-Shift-b');
    });
    expect(instance.getHTML().trim().startsWith('<blockquote')).toBe(true);
  });
});
