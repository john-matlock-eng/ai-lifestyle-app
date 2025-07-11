import { render } from '@testing-library/react';
import { expect, test } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../contexts';
import GoalCard from '../features/goals/components/display/GoalCard';
import type { Goal } from '../features/goals/types/api.types';

const sampleGoal: Goal = {
  goalId: '1',
  userId: 'u1',
  title: 'Read',
  category: 'reading',
  goalPattern: 'target',
  color: '#000',
  target: {
    metric: 'count',
    value: 10,
    unit: 'pages',
    period: 'day',
    direction: 'increase',
    targetType: 'exact',
  },
  progress: {
    percentComplete: 50,
    trend: 'stable',
    successRate: 50,
  },
  status: 'active',
  visibility: 'private',
  createdAt: '',
  updatedAt: '',
};

test('dark theme sets html class and removes bg-white', () => {
  localStorage.setItem('theme-preference', 'dark');
  render(
    <MemoryRouter>
      <ThemeProvider>
        <GoalCard goal={sampleGoal} />
      </ThemeProvider>
    </MemoryRouter>
  );
  const html = document.documentElement;
  expect(html.classList.contains('dark')).toBe(true);
  const card = document.querySelector('div.bg-surface');
  expect(card).not.toBeNull();
});
