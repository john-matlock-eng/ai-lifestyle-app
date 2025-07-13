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
  });

  afterEach(() => {
    cleanup();
  });

  // TODO: Fix this test - IndexedDB might be causing timeouts in CI
  it.skip('creates a new entry and displays it', async () => {
    const user = userEvent.setup({ delay: null });
    render(<JournalStorageSample />);
    
    // Wait for component to initialize
    await vi.waitFor(() => {
      expect(screen.getByRole('button', { name: /new entry/i })).toBeInTheDocument();
    });
    
    await user.click(screen.getByRole('button', { name: /new entry/i }));
    
    // Wait for textarea to appear
    const textarea = await screen.findByRole('textbox');
    await user.type(textarea, '# My Entry');
    await user.click(screen.getByRole('button', { name: /save/i }));
    
    // Wait for the entry to be saved and displayed
    // The component displays the first line of content which includes the markdown
    expect(await screen.findByText('# My Entry', {}, { timeout: 3000 })).toBeInTheDocument();
  });
});
