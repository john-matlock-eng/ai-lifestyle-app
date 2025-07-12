import { render } from '@testing-library/react';
import { expect, test } from 'vitest';
import { ThemeProvider } from '../contexts';
import App from '../App';
import { MemoryRouter } from 'react-router-dom';

test('applies midnight theme to html and body', () => {
  localStorage.setItem('theme-preference', 'midnight');
  render(
    <ThemeProvider>
      <MemoryRouter>
        <App />
      </MemoryRouter>
    </ThemeProvider>
  );
  const html = document.documentElement;
  expect(html.dataset.theme).toBe('midnight');
  const bodyBg = getComputedStyle(document.body).backgroundColor;
  expect(bodyBg).not.toBe('rgb(255, 255, 255)');
});
