import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import JournalEditor from '../JournalEditor';

const initial = '# Hello';

describe('JournalEditor', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });
  it('renders initial markdown content', () => {
    render(<JournalEditor initialContent={initial} onSave={vi.fn()} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('calls onSave when save button clicked', async () => {
    const user = userEvent.setup();
    const handleSave = vi.fn();
    render(<JournalEditor initialContent={initial} onSave={handleSave} />);
    await user.click(screen.getByRole('button', { name: /save/i }));
    expect(handleSave).toHaveBeenCalled();
  });

  it('renders markdown in readOnly mode', () => {
    render(<JournalEditor initialContent={initial} onSave={vi.fn()} readOnly />);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });


  it('restores draft from localStorage if confirmed', () => {
    localStorage.setItem('journalEditorDraft', '# Saved');
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<JournalEditor initialContent="" onSave={vi.fn()} />);
    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(window.confirm).toHaveBeenCalledWith('You have an unsaved draft – restore?');
  });

});
