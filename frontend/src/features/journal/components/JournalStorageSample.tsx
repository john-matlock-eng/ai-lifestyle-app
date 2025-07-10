import React, { useEffect, useState } from 'react';
import JournalEditor from './JournalEditor';
import type { JournalEntry } from '../hooks/useJournalStorage';
import { getAllEntries, addEntry, updateEntry, deleteEntry } from '../hooks/useJournalStorage';
import { Button } from '@/components/common';

const JournalStorageSample: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [current, setCurrent] = useState<JournalEntry | null>(null);

  const loadEntries = async () => {
    const all = await getAllEntries();
    setEntries(all);
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const handleSave = async (markdown: string) => {
    if (current?.id) {
      await updateEntry({ ...current, content: markdown });
    } else {
      const created = await addEntry(markdown);
      setCurrent(created);
    }
    await loadEntries();
  };

  const handleDelete = async (id: number) => {
    await deleteEntry(id);
    if (current?.id === id) setCurrent(null);
    await loadEntries();
  };

  return (
    <div className="flex gap-4">
      <div className="w-1/3 space-y-2">
        <Button type="button" onClick={() => setCurrent({ content: '' })}>
          New Entry
        </Button>
        <ul className="space-y-1">
          {entries.map((e) => (
            <li key={e.id} className="flex justify-between items-center border p-2 rounded">
              <button type="button" onClick={() => setCurrent(e)} className="text-left flex-1">
                {e.content.split('\n')[0] || 'Untitled'}
              </button>
              <Button size="sm" variant="ghost" onClick={() => handleDelete(e.id!)}>
                Delete
              </Button>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex-1">
        {current && (
          <JournalEditor
            initialContent={current.content}
            onSave={handleSave}
          />
        )}
      </div>
    </div>
  );
};

export default JournalStorageSample;
