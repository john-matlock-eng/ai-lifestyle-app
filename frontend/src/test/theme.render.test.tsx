import { render, screen } from '@testing-library/react';
import { ThemeProvider, AuthProvider } from '../contexts';
import AppLayout from '../components/layout/AppLayout';
import { MemoryRouter } from 'react-router-dom';
import { test, expect } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

test('renders navbar', () => {
  const client = new QueryClient();
  render(
    <ThemeProvider>
      <MemoryRouter>
        <QueryClientProvider client={client}>
          <AuthProvider>
            <AppLayout />
          </AuthProvider>
        </QueryClientProvider>
      </MemoryRouter>
    </ThemeProvider>
  );
  expect(screen.getByRole('navigation')).toBeInTheDocument();
});
