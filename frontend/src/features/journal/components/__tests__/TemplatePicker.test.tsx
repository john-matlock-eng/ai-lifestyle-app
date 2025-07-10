import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TemplatePicker from '../TemplatePicker';
import { JournalTemplate } from '../JournalEditorWithSections';

vi.mock('../../hooks/useTemplateRegistry', () => ({
  useTemplateRegistry: () => [
    {
      id: 't1',
      name: 'Template 1',
      description: 'Desc',
      sections: [],
    } as JournalTemplate,
  ],
}));

describe('TemplatePicker', () => {
  it('calls onSelect when template clicked', async () => {
    const user = userEvent.setup();
    const handle = vi.fn();
    render(<TemplatePicker onSelect={handle} />);
    await user.click(screen.getByText('Template 1'));
    expect(handle).toHaveBeenCalled();
  });
});
