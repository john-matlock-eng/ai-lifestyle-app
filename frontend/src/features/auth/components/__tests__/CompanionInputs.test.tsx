import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CompanionInput from '../CompanionInput';
import CompanionPasswordInput from '../CompanionPasswordInput';
import type { useEnhancedAuthShihTzu } from '../../../../hooks/useEnhancedAuthShihTzu';

// Mock the companion hook
const mockCompanion: ReturnType<typeof useEnhancedAuthShihTzu> = {
  mood: 'idle',
  position: { x: 100, y: 100 },
  setMood: vi.fn(),
  setPosition: vi.fn(),
  celebrate: vi.fn(),
  showCuriosity: vi.fn(),
  startJournaling: vi.fn(),
  walk: vi.fn(),
  moveToElement: vi.fn(),
  followPath: vi.fn(),
  handleInputFocus: vi.fn(),
  handleInputBlur: vi.fn(),
  handleTyping: vi.fn(),
  handleError: vi.fn(),
  handleSuccess: vi.fn(),
  handleLoading: vi.fn(),
  handlePasswordStrength: vi.fn(),
  handleFieldComplete: vi.fn(),
  handleSpecificError: vi.fn(),
  companionState: 'idle',
  currentField: null,
  personality: {
    traits: { happiness: 75, energy: 60, curiosity: 70 },
    needs: { attention: 50, rest: 50, exercise: 50 },
    bond: { level: 1, interactions: 0 }
  },
  thoughtBubble: { show: false, text: '' },
  particleEffect: null,
  accessories: [],
  showThought: vi.fn(),
  triggerParticleEffect: vi.fn(),
  pet: vi.fn(),
  encourage: vi.fn(),
};

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

describe('CompanionInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders input with companion integration', () => {
    render(
      <CompanionInput
        label="Email"
        name="email"
        companion={mockCompanion}
        fieldName="email"
      />,
      { wrapper }
    );

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('triggers companion interactions on focus', async () => {
    const user = userEvent.setup();
    
    render(
      <CompanionInput
        label="Email"
        name="email"
        companion={mockCompanion}
        fieldName="email"
      />,
      { wrapper }
    );

    const input = screen.getByLabelText('Email');
    await user.click(input);

    expect(mockCompanion.handleInputFocus).toHaveBeenCalledWith(input);
    expect(mockCompanion.showThought).toHaveBeenCalledWith(
      "Let's start with your email! 📧",
      2500
    );
    expect(mockCompanion.setMood).toHaveBeenCalledWith('curious');
  });

  it('shows typing animation on input change', async () => {
    const user = userEvent.setup();
    
    render(
      <CompanionInput
        label="Email"
        name="email"
        companion={mockCompanion}
        fieldName="email"
      />,
      { wrapper }
    );

    const input = screen.getByLabelText('Email');
    await user.type(input, 'test@example.com');

    await waitFor(() => {
      expect(mockCompanion.handleTyping).toHaveBeenCalled();
    });
  });

  it('celebrates valid email on blur', async () => {
    const user = userEvent.setup();
    
    render(
      <CompanionInput
        label="Email"
        name="email"
        companion={mockCompanion}
        fieldName="email"
      />,
      { wrapper }
    );

    const input = screen.getByLabelText('Email');
    await user.type(input, 'test@example.com');
    fireEvent.blur(input);

    expect(mockCompanion.handleFieldComplete).toHaveBeenCalled();
    expect(mockCompanion.showThought).toHaveBeenCalledWith("Valid email! ✅", 1500);
    expect(mockCompanion.triggerParticleEffect).toHaveBeenCalledWith('sparkles');
  });
});

describe('CompanionPasswordInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows password-specific thoughts on focus', async () => {
    const user = userEvent.setup();
    
    render(
      <CompanionPasswordInput
        label="Password"
        name="password"
        companion={mockCompanion}
        fieldName="password"
      />,
      { wrapper }
    );

    const input = screen.getByLabelText('Password');
    await user.click(input);

    expect(mockCompanion.showThought).toHaveBeenCalledWith(
      "Create a strong password! 🔐",
      2500
    );
    expect(mockCompanion.setMood).toHaveBeenCalledWith('protective');
  });

  it('validates password match for confirm password field', async () => {
    const user = userEvent.setup();
    
    render(
      <CompanionPasswordInput
        label="Confirm Password"
        name="confirmPassword"
        companion={mockCompanion}
        fieldName="confirmPassword"
        watchPassword="test123"
      />,
      { wrapper }
    );

    const input = screen.getByLabelText('Confirm Password');
    await user.type(input, 'test123');

    expect(mockCompanion.showThought).toHaveBeenCalledWith("Passwords match! 🎯", 1500);
    expect(mockCompanion.triggerParticleEffect).toHaveBeenCalledWith('hearts');
    expect(mockCompanion.setMood).toHaveBeenCalledWith('celebrating');
  });

  it('shows concern when passwords do not match', async () => {
    const user = userEvent.setup();
    
    render(
      <CompanionPasswordInput
        label="Confirm Password"
        name="confirmPassword"
        companion={mockCompanion}
        fieldName="confirmPassword"
        watchPassword="test123"
      />,
      { wrapper }
    );

    const input = screen.getByLabelText('Confirm Password');
    await user.type(input, 'test456');

    expect(mockCompanion.showThought).toHaveBeenCalledWith("Not matching yet... 🤔", 1500);
    expect(mockCompanion.setMood).toHaveBeenCalledWith('concerned');
  });
});
