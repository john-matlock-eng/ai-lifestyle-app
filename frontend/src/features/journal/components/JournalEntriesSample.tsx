import React, { useEffect, useState } from "react";
import JournalEditor from "./JournalEditor";
import { Button } from "@/components/common";
import type { JournalEntry } from "../storage/journalDb";
import {
  listEntries,
  addEntry,
  updateEntry,
  deleteEntry,
} from "../storage/journalDb";

const JournalEntriesSample: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selected, setSelected] = useState<JournalEntry | null>(null);

  const load = async () => {
    setEntries(await listEntries());
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (markdown: string) => {
    if (selected) {
      await updateEntry({ ...selected, content: markdown });
    } else {
      await addEntry(markdown);
    }
    setSelected(null);
    load();
  };

  const handleEdit = (entry: JournalEntry) => {
    setSelected(entry);
  };

  const handleDelete = async (id: string) => {
    await deleteEntry(id);
    if (selected?.id === id) setSelected(null);
    load();
  };

  return (
    <div className="flex gap-4">
      <div className="w-1/3 space-y-2">
        <Button type="button" onClick={() => setSelected(null)}>
          New Entry
        </Button>
        <ul className="space-y-1" aria-label="entry list">
          {entries.map((e) => (
            <li
              key={e.id}
              className="flex justify-between items-center border p-2 rounded"
            >
              <button
                type="button"
                onClick={() => handleEdit(e)}
                className="flex-1 text-left"
                aria-label="Edit entry"
              >
                {new Date(e.updatedAt).toLocaleString()}
              </button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(e.id)}
                aria-label="Delete entry"
              >
                Delete
              </Button>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex-1">
        <JournalEditor
          initialContent={selected?.content ?? ""}
          onSave={handleSave}
          draftId={selected?.id ?? "new"}
        />
      </div>
    </div>
  );
};

export default JournalEntriesSample;
