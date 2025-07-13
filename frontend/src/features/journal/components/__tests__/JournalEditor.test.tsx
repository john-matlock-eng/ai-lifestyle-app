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

  it('restores draft when user chooses restore', async () => {
    const user = userEvent.setup();
    localStorage.setItem('journal-draft-test', '# Saved');
    render(<JournalEditor initialContent="" onSave={vi.fn()} draftId="test" />);
    expect(screen.getByText('Unsaved draft found')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /restore/i }));
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });

  it('clears draft after saving', async () => {
    const user = userEvent.setup();
    localStorage.setItem('journal-draft-clear', '# Draft');
    const handleSave = vi.fn();
    render(<JournalEditor initialContent="" onSave={handleSave} draftId="clear" />);
    await user.click(screen.getByRole('button', { name: /restore/i }));
    await user.click(screen.getByRole('button', { name: /save/i }));
    expect(handleSave).toHaveBeenCalled();
    expect(localStorage.getItem('journal-draft-clear')).toBeNull();
  });

});
