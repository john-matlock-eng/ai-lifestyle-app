import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LoginPage from '../LoginPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      {children}
    </BrowserRouter>
  </QueryClientProvider>
);

describe('Companion Mobile Positioning', () => {
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;

  beforeEach(() => {
    // Reset window size after each test
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: originalInnerHeight,
    });
  });

  it('positions companion correctly on mobile screens', async () => {
    // Set mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375, // iPhone size
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 667,
    });

    const { container } = render(<LoginPage />, { wrapper });
    
    // Wait for companion to be rendered
    await vi.waitFor(() => {
      const companion = container.querySelector('[style*="position"]');
      expect(companion).toBeTruthy();
      
      if (companion) {
        const style = window.getComputedStyle(companion);
        const left = parseInt(style.left);
        const top = parseInt(style.top);
        
        // Should be positioned at top right on mobile
        expect(left).toBeGreaterThan(200); // Near right edge
        expect(top).toBeLessThan(100); // Near top
      }
    });
  });

  it('positions companion correctly on tablet screens', async () => {
    // Set tablet viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768, // iPad size
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    const { container } = render(<LoginPage />, { wrapper });
    
    await vi.waitFor(() => {
      const companion = container.querySelector('[style*="position"]');
      expect(companion).toBeTruthy();
      
      if (companion) {
        const style = window.getComputedStyle(companion);
        const left = parseInt(style.left);
        
        // Should be positioned to the right of form
        expect(left).toBeGreaterThan(400); // Right of center
      }
    });
  });

  it('keeps companion within viewport bounds', async () => {
    // Set small mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 320, // Small phone
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 568,
    });

    const { container } = render(<LoginPage />, { wrapper });
    
    await vi.waitFor(() => {
      const companion = container.querySelector('[style*="position"]');
      expect(companion).toBeTruthy();
      
      if (companion) {
        const style = window.getComputedStyle(companion);
        const left = parseInt(style.left);
        const top = parseInt(style.top);
        
        // Should stay within bounds
        expect(left).toBeGreaterThan(10);
        expect(left).toBeLessThan(window.innerWidth - 90); // Companion size + margin
        expect(top).toBeGreaterThan(10);
      }
    });
  });

  it('adjusts position when window resizes', async () => {
    const { container } = render(<LoginPage />, { wrapper });
    
    // Initial desktop size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1200,
    });
    
    // Trigger resize event
    fireEvent(window, new Event('resize'));
    
    // Change to mobile size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    
    // Trigger resize event again
    fireEvent(window, new Event('resize'));
    
    await vi.waitFor(() => {
      const companion = container.querySelector('[style*="position"]');
      expect(companion).toBeTruthy();
    });
  });
});
