import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import JournalEditor from '../JournalEditor';

const initial = '# Hello';

describe('JournalEditor', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });
  it('renders initial markdown content', () => {
    render(<JournalEditor initialContent={initial} onSave={vi.fn()} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('calls onSave when save button clicked', async () => {
    const user = userEvent.setup({ delay: null });
    const handleSave = vi.fn();
    render(<JournalEditor initialContent={initial} onSave={handleSave} />);
    
    // Wait for editor to be ready
    await vi.waitFor(() => {
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    });
    
    await user.click(screen.getByRole('button', { name: /save/i }));
    expect(handleSave).toHaveBeenCalledWith(initial);
  });

  it('renders markdown in readOnly mode', () => {
    render(<JournalEditor initialContent={initial} onSave={vi.fn()} readOnly />);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('restores draft when user chooses restore', async () => {
    const user = userEvent.setup({ delay: null });
    localStorage.setItem('journal-draft-test', '# Saved');
    render(<JournalEditor initialContent="" onSave={vi.fn()} draftId="test" />);
    
    // Wait for draft message to appear
    await vi.waitFor(() => {
      expect(screen.getByText('Unsaved draft found')).toBeInTheDocument();
    });
    
    await user.click(screen.getByRole('button', { name: /restore/i }));
    
    // Wait for restored content
    await vi.waitFor(() => {
      expect(screen.getByText('Saved')).toBeInTheDocument();
    });
  });

  it('clears draft after saving', async () => {
    const user = userEvent.setup({ delay: null });
    localStorage.setItem('journal-draft-clear', '# Draft');
    const handleSave = vi.fn();
    render(<JournalEditor initialContent="" onSave={handleSave} draftId="clear" />);
    
    // Wait for draft message
    await vi.waitFor(() => {
      expect(screen.getByText('Unsaved draft found')).toBeInTheDocument();
    });
    
    await user.click(screen.getByRole('button', { name: /restore/i }));
    
    // Wait for restored content and save button
    await vi.waitFor(() => {
      expect(screen.getByText('Draft')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    });
    
    await user.click(screen.getByRole('button', { name: /save/i }));
    
    expect(handleSave).toHaveBeenCalledWith('# Draft');
    expect(localStorage.getItem('journal-draft-clear')).toBeNull();
  });

});
