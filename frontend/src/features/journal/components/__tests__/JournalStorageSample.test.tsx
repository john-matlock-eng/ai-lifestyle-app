import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import JournalStorageSample from '../JournalStorageSample';
import { indexedDB } from 'fake-indexeddb';

// assigning indexedDB to global for test environment
global.indexedDB = indexedDB as unknown as IDBFactory;

describe('JournalStorageSample', () => {
  beforeEach(() => {
    const req = indexedDB.deleteDatabase('journal-db');
    req.onsuccess = () => {};
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
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
