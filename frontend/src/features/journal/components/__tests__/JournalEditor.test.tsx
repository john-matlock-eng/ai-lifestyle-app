import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import JournalEditor from '../JournalEditor';

const initial = '# Hello';

describe('JournalEditor', () => {
  it('renders initial markdown content', () => {
    render(<JournalEditor initialContent={initial} onSave={vi.fn()} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('calls onSave with updated markdown', async () => {
    const user = userEvent.setup();
    const handleSave = vi.fn();
    render(<JournalEditor initialContent={initial} onSave={handleSave} />);
    const textbox = screen.getByRole('textbox');
    await user.click(textbox);
    await user.type(textbox, '\nThis is a test');
    await user.click(screen.getByRole('button', { name: /save/i }));
    expect(handleSave).toHaveBeenCalledWith(expect.stringContaining('This is a test'));
  });

  it('renders markdown in readOnly mode', () => {
    render(<JournalEditor initialContent={initial} onSave={vi.fn()} readOnly />);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
