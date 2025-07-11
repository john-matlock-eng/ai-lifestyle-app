import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { ThemeProvider, useTheme } from '../../../contexts';

test('toggles dark class on html element', async () => {
  const TestComp = () => {
    const { setTheme } = useTheme();
    return <button onClick={() => setTheme('dark')}>switch</button>;
  };

  const user = userEvent.setup();
  render(
    <ThemeProvider>
      <TestComp />
    </ThemeProvider>
  );

  expect(document.documentElement.classList.contains('dark')).toBe(false);
  await user.click(screen.getByText('switch'));
  expect(document.documentElement.classList.contains('dark')).toBe(true);
});
