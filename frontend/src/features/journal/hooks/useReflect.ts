import { useState, useCallback } from 'react';
import type { Editor } from '@tiptap/react';
import { useAi } from '@/services/ai';
import type { SectionDefinition } from '../types/template.types';
import { filterTemplateSections } from '../utils/ai';

export interface ReflectResult {
  reply: string | null;
  collapsed: boolean;
  run: () => Promise<void>;
  toggle: () => void;
}

export default function useReflect(
  editor: Editor | null,
  section: Pick<SectionDefinition, 'id' | 'aiPrompt'>,
): ReflectResult {
  const ai = useAi();
  const [reply, setReply] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(true);

  const run = useCallback(async () => {
    if (!editor || !section.aiPrompt) return;
    const entryId = (editor.storage as Record<string, string>).entryId || 'draft';
    filterTemplateSections(editor.getJSON());
    const markdown = (editor.storage.markdown as { getMarkdown: () => string }).getMarkdown();
    const result = await ai.reflect({
      entryId,
      sectionId: section.id,
      text: markdown,
      prompt: section.aiPrompt,
    });
    const res = result as unknown;
    if (res && (res as AsyncIterable<string>)[Symbol.asyncIterator]) {
      let full = '';
      for await (const token of res as AsyncIterable<string>) {
        full += token;
        setReply(full);
      }
    } else {
      setReply((res as { reply: string }).reply);
    }
    setCollapsed(false);
  }, [ai, editor, section]);

  const toggle = useCallback(() => setCollapsed((c) => !c), []);

  return { reply, collapsed, run, toggle };
}
