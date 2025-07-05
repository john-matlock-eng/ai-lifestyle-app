import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { RegisterFormData, registerSchema } from '../utils/validation';
import { authService } from '../services/authService';
import { isValidationError } from '../../../api/client';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import PasswordInput from './PasswordInput';
import PasswordStrengthMeter from './PasswordStrengthMeter';

const RegistrationForm: React.FC = () => {
  const navigate = useNavigate();
  const [generalError, setGeneralError] = useState<string>('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
  });

  const registerMutation = useMutation({
    mutationFn: (data: Omit<RegisterFormData, 'confirmPassword'>) => authService.register(data),
    onSuccess: (data) => {
      // Navigate to success page or show success message
      navigate('/register/success', { 
        state: { 
          email: data.email,
          message: data.message 
        } 
      });
    },
    onError: (error) => {
      console.error('Registration error:', error);
      if (isValidationError(error)) {
        // Handle field-specific validation errors from the API
        error.response?.data.validation_errors.forEach((validationError) => {
          if (validationError.field in registerSchema.shape) {
            setError(validationError.field as keyof RegisterFormData, {
              message: validationError.message,
            });
          }
        });
      } else if (error.response?.status === 409) {
        // Email already exists
        setError('email', {
          message: 'An account with this email already exists',
        });
      } else if (error.code === 'ERR_NETWORK' || error.code === 'ERR_CONNECTION_REFUSED') {
        // Network error - backend not available
        setGeneralError(
          'Unable to connect to the server. Make sure the backend is running or MSW is properly configured.'
        );
      } else {
        // General error
        setGeneralError(
          error.response?.data?.message || 
          'Something went wrong. Please try again.'
        );
      }
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setGeneralError('');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmPassword, ...registerData } = data;
    await registerMutation.mutateAsync(registerData);
  };

  const password = watch('password');

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
        <div className="mb-6">
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Sign in
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {generalError && (
            <div
              className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm"
              role="alert"
            >
              <div>{generalError}</div>
              {generalError.includes('Unable to connect') && (
                <div className="mt-2 text-xs">
                  <strong>Quick Fix:</strong> Restart the dev server (Ctrl+C then npm run dev)
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Input
              label="First name"
              isRequired
              {...register('firstName')}
              error={errors.firstName?.message}
              autoComplete="given-name"
            />

            <Input
              label="Last name"
              isRequired
              {...register('lastName')}
              error={errors.lastName?.message}
              autoComplete="family-name"
            />
          </div>

          <Input
            label="Email address"
            type="email"
            isRequired
            {...register('email')}
            error={errors.email?.message}
            autoComplete="email"
            leftIcon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            }
          />

          <div>
            <PasswordInput
              label="Password"
              isRequired
              {...register('password')}
              error={errors.password?.message}
              autoComplete="new-password"
              hint="Must be at least 8 characters with uppercase, lowercase, number, and special character"
            />
            <PasswordStrengthMeter password={password || ''} />
          </div>

          <PasswordInput
            label="Confirm password"
            isRequired
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
            autoComplete="new-password"
          />

          <div className="space-y-4">
            <div className="flex items-start">
              <input
                id="terms"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                required
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                I agree to the{' '}
                <Link
                  to="/terms"
                  className="font-medium text-primary-600 hover:text-primary-500"
                  target="_blank"
                >
                  Terms and Conditions
                </Link>{' '}
                and{' '}
                <Link
                  to="/privacy"
                  className="font-medium text-primary-600 hover:text-primary-500"
                  target="_blank"
                >
                  Privacy Policy
                </Link>
              </label>
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={isSubmitting || registerMutation.isPending}
              loadingText="Creating account..."
            >
              Create account
            </Button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            We'll send you a verification email to confirm your account
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationForm;
