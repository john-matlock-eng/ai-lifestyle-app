import { useEffect, useState } from 'react';
import type { JournalTemplate } from '../components/JournalEditorWithSections';

export function useTemplateRegistry() {
  const [templates, setTemplates] = useState<JournalTemplate[]>([]);

  useEffect(() => {
    const modules = import.meta.glob('../templates/*.json', { as: 'json' });
    Promise.all(
      Object.values(modules).map((load) => load() as Promise<JournalTemplate>)
    ).then(setTemplates);
  }, []);

  return templates;
}
