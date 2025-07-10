import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import JournalEditorWithSections from '../JournalEditorWithSections';
import type { JournalTemplate } from '../../types/template.types';

const template: JournalTemplate = {
  id: 'daily',
  name: 'Daily',
  sections: [
    { id: 'feelings', title: 'Feelings', prompt: 'How do you feel?' },
    { id: 'thoughts', title: 'Thoughts', prompt: 'What are you thinking?' },
  ],
};

describe('JournalEditorWithSections', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders sections based on template', () => {
    render(<JournalEditorWithSections template={template} onSave={vi.fn()} />);
    expect(screen.getByText('1. Feelings')).toBeInTheDocument();
    expect(screen.getByText('2. Thoughts')).toBeInTheDocument();
  });

  it('calls onSave with structured output', async () => {
    const user = userEvent.setup();
    const handleSave = vi.fn();
    render(<JournalEditorWithSections template={template} onSave={handleSave} />);
    await user.click(screen.getByRole('button', { name: /save entry/i }));
    expect(handleSave).toHaveBeenCalledWith(
      expect.objectContaining({
        templateId: 'daily',
      })
    );
  });

  it('clears drafts after saving', async () => {
    const user = userEvent.setup();
    localStorage.setItem('journal-draft-myday-feelings', '# Draft');
    render(
      <JournalEditorWithSections template={template} onSave={vi.fn()} draftId="myday" />
    );
    await user.click(screen.getByRole('button', { name: /save entry/i }));
    expect(localStorage.getItem('journal-draft-myday-feelings')).toBeNull();
  });
});
