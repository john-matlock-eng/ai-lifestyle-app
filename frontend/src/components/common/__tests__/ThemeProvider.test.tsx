import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { test, expect } from 'vitest';
import { ThemeProvider, useTheme } from '../../../contexts';

test('toggles dark class on html element', async () => {
  localStorage.setItem('theme-preference', 'light');
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
