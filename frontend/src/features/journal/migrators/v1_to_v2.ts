import type { JournalTemplate } from '../types/template.types';

export default function migrateV1toV2(template: JournalTemplate): JournalTemplate {
  // Placeholder migration. Future versions can transform fields here.
  return {
    ...template,
    version: 1,
  };
}
