import { describe, it, expect } from 'vitest';
import { filterAiSections } from '../ai';
import type { JournalTemplate } from '../../types/template.types';

describe('filterAiSections', () => {
  it('returns only ai sections', () => {
    const template: JournalTemplate = {
      id: 't',
      name: 'Temp',
      version: 1,
      sections: [
        { id: 'a', title: 'A', prompt: '', defaultPrivacy: 'ai' },
        { id: 'b', title: 'B', prompt: '', defaultPrivacy: 'private' },
      ],
    };
    const sections = [
      { id: 'a', markdown: 'one' },
      { id: 'b', markdown: 'two' },
    ];
    const result = filterAiSections(template, sections);
    expect(result).toEqual([{ id: 'a', markdown: 'one' }]);
  });
});
