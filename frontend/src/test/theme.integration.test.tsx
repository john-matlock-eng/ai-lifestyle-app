import { render } from '@testing-library/react';
import { expect, test } from 'vitest';
import { ThemeProvider } from '../contexts';
import App from '../App';

test('applies reading theme to html and body', () => {
  localStorage.setItem('theme-preference', 'reading');
  render(
    <ThemeProvider>
      <App />
    </ThemeProvider>
  );
  const html = document.documentElement;
  expect(html.dataset.theme).toBe('reading');
  const bodyBg = getComputedStyle(document.body).backgroundColor;
  expect(bodyBg).not.toBe('rgb(255, 255, 255)');
});
