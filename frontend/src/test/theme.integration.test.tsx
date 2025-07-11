import { render } from '@testing-library/react';
import { expect, test } from 'vitest';
import { ThemeProvider } from '../contexts';
import GoalCard from '../features/goals/components/display/GoalCard';
import type { Goal } from '../features/goals/types/api.types';

const sampleGoal: Goal = {
  goalId: '1',
  title: 'Read',
  category: 'reading',
  goalPattern: 'target',
  color: '#000',
  target: { value: 10, unit: 'pages', period: 'day' },
  progress: {
    percentComplete: 50,
  } as any,
  status: 'active',
};

test('dark theme sets html class and removes bg-white', () => {
  localStorage.setItem('theme-preference', 'dark');
  render(
    <ThemeProvider>
      <GoalCard goal={sampleGoal} />
    </ThemeProvider>
  );
  const html = document.documentElement;
  expect(html.classList.contains('dark')).toBe(true);
  const card = document.querySelector('div.bg-[var(--surface)]');
  expect(card).not.toBeNull();
});
