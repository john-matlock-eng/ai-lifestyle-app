import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import JournalEditorWithSections from '@/features/journal/components/JournalEditorWithSections';
import type { JournalTemplate } from '@/features/journal/types/template.types';

vi.mock('@/services/ai', () => ({
  useAi: () => ({
    reflect: vi.fn().mockResolvedValue({ reply: 'Mock reply' }),
    analyzeMood: vi.fn(),
    summarizeWeek: vi.fn(),
  }),
}));

const template: JournalTemplate = {
  id: 'tmp',
  name: 'Temp',
  version: 1,
  sections: [
    {
      id: 's1',
      title: 'One',
      prompt: '',
      defaultPrivacy: 'ai',
      aiPrompt: 'Prompt',
    },
  ],
};

describe('AI reflection', () => {
  it('shows AI callout text', async () => {
    const user = userEvent.setup();
    render(<JournalEditorWithSections template={template} onSave={() => {}} />);
    const button = screen.getByRole('button', { name: /reflect with ai/i });
    await user.click(button);
    expect(await screen.findByText('Mock reply')).toBeInTheDocument();
  });
});
