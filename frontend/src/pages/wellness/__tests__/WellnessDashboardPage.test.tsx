import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import WellnessDashboardPage from '../WellnessDashboardPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const renderPage = () =>
  render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <WellnessDashboardPage />
      </BrowserRouter>
    </QueryClientProvider>
  );

describe('WellnessDashboardPage', () => {
  it('renders hero and stat tiles', () => {
    const { asFragment } = renderPage();
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    expect(screen.getAllByTestId('stat-tile').length).toBeGreaterThanOrEqual(4);
    expect(asFragment()).toMatchSnapshot();
  });
});
