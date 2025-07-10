import { useEffect, useState } from 'react';
import { z } from 'zod';
import type { JournalTemplate } from '../types/template.types';

const SectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.string().optional(),
  placeholder: z.string(),
  aiPrompt: z.string().optional(),
  defaultPrivacy: z.enum(['private', 'ai', 'shared', 'public']).optional(),
});

const TemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  version: z.number(),
  sections: z.array(SectionSchema),
});

const SUPPORTED_VERSION = 1;

export function useTemplateRegistry() {
  const [templates, setTemplates] = useState<JournalTemplate[]>([]);

  useEffect(() => {
    const useFetch = (window as unknown as Record<string, unknown>).__USE_FETCH_TEMPLATES__ || !import.meta.env.DEV;
    async function load() {
      try {
        let loaded: unknown[] = [];
        if (!useFetch) {
          const modules = import.meta.glob('../templates/*.json', { as: 'json' });
          loaded = await Promise.all(Object.values(modules).map((l) => l()));
        } else {
          const res = await fetch('/templates/registry.json');
          const registry: string[] = await res.json();
          loaded = await Promise.all(registry.map((p) => fetch(p).then((r) => r.json())));
        }

        const valid: JournalTemplate[] = [];
        for (const data of loaded) {
          const parsed = TemplateSchema.safeParse(data);
          if (!parsed.success) {
            console.error('Template validation failed', parsed.error);
            continue;
          }
          if (parsed.data.version !== SUPPORTED_VERSION) {
            console.warn('Unsupported template version', parsed.data.version);
            continue;
          }
          const { sections, ...rest } = parsed.data;
          valid.push({
            ...rest,
            sections: sections.map((s) => ({
              id: s.id,
              title: s.title,
              prompt: s.placeholder,
              type: s.type,
              defaultPrivacy: s.defaultPrivacy,
              aiPrompt: s.aiPrompt,
            })),
          });
        }
        setTemplates(valid);
      } catch (err) {
        console.error('Failed to load templates', err);
      }
    }

    load();
  }, []);

  return templates;
}
