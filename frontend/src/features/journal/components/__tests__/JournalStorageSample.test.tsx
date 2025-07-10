import { describe, it, beforeEach, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import JournalStorageSample from '../JournalStorageSample';
import { indexedDB } from 'fake-indexeddb';

// @ts-expect-error global assignment for test env
global.indexedDB = indexedDB;

describe('JournalStorageSample', () => {
  beforeEach(() => {
    const req = indexedDB.deleteDatabase('journal-db');
    req.onsuccess = () => {};
  });

  it('creates a new entry and displays it', async () => {
    const user = userEvent.setup();
    render(<JournalStorageSample />);
    await user.click(screen.getByRole('button', { name: /new entry/i }));
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, '# My Entry');
    await user.click(screen.getByRole('button', { name: /save/i }));
    expect(await screen.findByText('My Entry')).toBeInTheDocument();
  });
});
