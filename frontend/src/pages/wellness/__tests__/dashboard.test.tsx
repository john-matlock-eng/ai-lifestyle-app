import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import WellnessDashboardPage from '../WellnessDashboardPage';

// Mock wellness hooks
vi.mock('../../../features/wellness/hooks', () => ({
  useTodayMealsCount: () => ({ data: 2 }),
  useWeekWorkoutsCount: () => ({ data: 3 }),
  useWellnessScore: () => ({ data: 80 }),
  useActiveRoutines: () => ({ data: 1 }),
}));
vi.mock('../../../features/goals/hooks/useGoals', () => ({
  useGoals: () => ({ data: { goals: [
    { goalId: '1', title: 'A', icon: '📓', goalPattern: 'streak', progress: { currentStreak: 2, percentComplete: 50, successRate: 100 } },
    { goalId: '2', title: 'B', icon: '🏃', goalPattern: 'recurring', progress: { currentStreak: 0, percentComplete: 75, successRate: 80 }, schedule: { frequency: 'daily' } },
    { goalId: '3', title: 'C', icon: '🍎', goalPattern: 'recurring', progress: { currentStreak: 0, percentComplete: 25, successRate: 60 }, schedule: { frequency: 'daily' } },
  ] }, isLoading: false })
}));
vi.mock('../../../contexts', () => ({
  useAuth: () => ({ user: { firstName: 'Test' }, isAuthenticated: true, isLoading: false }),
}));

const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const renderPage = () =>
  render(
    <QueryClientProvider client={client}>
      <BrowserRouter>
        <WellnessDashboardPage />
      </BrowserRouter>
    </QueryClientProvider>
  );

describe('WellnessDashboardPage', () => {
  it('shows stat tiles and cta buttons', () => {
    renderPage();
    expect(screen.getAllByTestId('stat-tile')).toHaveLength(4);
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('80')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /log/i })).toHaveLength(3);
  });
});
