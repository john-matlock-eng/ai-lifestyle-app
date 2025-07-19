import { useEffect, useState } from "react";
import { z } from "zod";
import type { JournalTemplate } from "../types/template.types";
import migrateV1toV2 from "../migrators/v1_to_v2";

const SectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.string().optional(),
  placeholder: z.string(),
  aiPrompt: z.string().optional(),
  defaultPrivacy: z.enum(["private", "ai", "shared", "public"]).optional(),
});

const TemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  version: z.number(),
  sections: z.array(SectionSchema),
});

type RawTemplate = z.infer<typeof TemplateSchema>;

function convert(raw: RawTemplate): JournalTemplate {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    version: raw.version,
    sections: raw.sections.map((s) => ({
      id: s.id,
      title: s.title,
      prompt: s.placeholder,
      type: s.type,
      defaultPrivacy: s.defaultPrivacy,
      aiPrompt: s.aiPrompt,
    })),
  };
}

const SUPPORTED_VERSION = 1;
const MIGRATORS: Record<number, (t: JournalTemplate) => JournalTemplate> = {
  2: migrateV1toV2,
};

export function useTemplateRegistry() {
  const [templates, setTemplates] = useState<JournalTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const useFetch =
      (window as unknown as Record<string, unknown>).__USE_FETCH_TEMPLATES__ ||
      !import.meta.env.DEV;
    async function load() {
      try {
        let loaded: unknown[] = [];
        if (!useFetch) {
          const modules = import.meta.glob("../templates/*.json", {
            query: "?json",
          });
          loaded = await Promise.all(Object.values(modules).map((l) => l()));
        } else {
          const res = await fetch("/templates/registry.json");
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const registry: string[] = await res.json();
          loaded = await Promise.all(
            registry.map((p) =>
              fetch(p).then((r) => {
                if (!r.ok) throw new Error(p);
                return r.json();
              }),
            ),
          );
        }

        const valid: JournalTemplate[] = [];
        for (const data of loaded) {
          const parsed = TemplateSchema.safeParse(data);
          if (!parsed.success) {
            console.error("Template validation failed", parsed.error);
            continue;
          }
          let template = convert(parsed.data);
          if (template.version !== SUPPORTED_VERSION) {
            const migrator = MIGRATORS[template.version];
            if (migrator) {
              template = migrator(template);
            } else {
              console.warn("Unsupported template version", template.version);
              continue;
            }
          }
          valid.push(template);
        }
        setTemplates(valid);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load templates", err);
        setError("Failed to load templates");
        try {
          const modules = import.meta.glob("../templates/*.json", {
            query: "?json",
          });
          const fallback = await Promise.all(
            Object.values(modules).map((l) => l()),
          );
          const valid: JournalTemplate[] = [];
          for (const data of fallback) {
            const parsed = TemplateSchema.safeParse(data);
            if (parsed.success) {
              let template = convert(parsed.data);
              if (template.version !== SUPPORTED_VERSION) {
                const migrator = MIGRATORS[template.version];
                if (migrator) {
                  template = migrator(template);
                } else {
                  continue;
                }
              }
              valid.push(template);
            }
          }
          setTemplates(valid);
          setLoading(false);
        } catch (e) {
          console.error("Fallback template load failed", e);
          setLoading(false);
        }
      }
    }

    load();
  }, []);

  return { templates, loading, error };
}
