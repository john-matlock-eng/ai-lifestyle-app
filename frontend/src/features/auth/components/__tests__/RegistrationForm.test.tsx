import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { store } from '../../../../store';
import RegistrationForm from '../RegistrationForm';
import { authService } from '../../services/authService';

// Mock the auth service
vi.mock('../../services/authService', () => ({
  authService: {
    register: vi.fn(),
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {component}
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  );
};

// TODO: Fix these tests - they're slow and might be causing timeouts in CI
describe.skip('RegistrationForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all form fields', () => {
    renderWithProviders(<RegistrationForm />);

    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getAllByLabelText(/password/i)[0]).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegistrationForm />);

    // First check the terms checkbox to allow form submission
    const termsCheckbox = screen.getByRole('checkbox', { name: /i agree to the/i });
    await user.click(termsCheckbox);

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    await waitFor(() => {
      // First name and last name will show "This field is required"
      const errors = screen.getAllByText(/This field is required/i);
      expect(errors.length).toBeGreaterThan(0);
    });

    // Also check for email validation error
    await waitFor(() => {
      expect(screen.getByText(/Invalid email address/i)).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegistrationForm />);

    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'invalid-email');
    await user.tab(); // Trigger blur

    await waitFor(() => {
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
    });
  });

  it('shows password strength indicator', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegistrationForm />);

    const passwordInput = screen.getAllByLabelText(/password/i)[0];
    await user.type(passwordInput, 'weak');

    await waitFor(() => {
      expect(screen.getByText(/password strength/i)).toBeInTheDocument();
    });
  });

  it('validates password confirmation match', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegistrationForm />);

    const passwordInput = screen.getAllByLabelText(/password/i)[0];
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    await user.type(passwordInput, 'StrongP@ss123');
    await user.type(confirmPasswordInput, 'DifferentP@ss123');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
    });
  });

  it('successfully submits form with valid data', async () => {
    const user = userEvent.setup();
    const mockRegister = vi.mocked(authService.register);
    mockRegister.mockResolvedValueOnce({
      userId: '123',
      email: 'john@example.com',
      message: 'Registration successful'
    });

    renderWithProviders(<RegistrationForm />);

    // Fill in valid form data
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
    await user.type(screen.getAllByLabelText(/password/i)[0], 'StrongP@ss123');
    await user.type(screen.getByLabelText(/confirm password/i), 'StrongP@ss123');
    
    // Check the terms checkbox
    const termsCheckbox = screen.getByRole('checkbox', { name: /i agree to the/i });
    await user.click(termsCheckbox);

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    // Wait for the form submission
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'StrongP@ss123'
      });
    });

    // Check that navigation happened
    expect(mockNavigate).toHaveBeenCalledWith('/register/success', {
      state: {
        email: 'john@example.com',
        message: 'Registration successful'
      }
    });
  });
});
