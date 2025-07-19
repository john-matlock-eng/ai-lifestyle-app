import React, { useState, useEffect, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { registerSchema } from "../utils/validation";
import type { RegisterFormData } from "../utils/validation";
import { authService } from "../services/authService";
import { isValidationError } from "../../../api/client";
import Input from "../../../components/common/Input";
import Button from "../../../components/common/Button";
import PasswordInput from "./PasswordInput";
import PasswordStrengthMeter from "./PasswordStrengthMeter";
import type { useAuthShihTzu } from "../../../hooks/useAuthShihTzu";

interface RegistrationFormProps {
  companion?: ReturnType<typeof useAuthShihTzu>;
}

const RegistrationForm: React.FC<RegistrationFormProps> = ({ companion }) => {
  const navigate = useNavigate();
  const [generalError, setGeneralError] = useState<string>("");
  const [completedFields, setCompletedFields] = useState<Set<string>>(new Set());
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const totalFields = 5; // firstName, lastName, email, password, confirmPassword

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, touchedFields },
    setError,
    getFieldState,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    criteriaMode: "all",
  });

  // Get all watched values
  const watchedValues = watch();

  // Track completed fields based on valid state
  useEffect(() => {
    const fields: (keyof RegisterFormData)[] = ['firstName', 'lastName', 'email', 'password', 'confirmPassword'];
    const newCompletedFields = new Set<string>();
    
    fields.forEach(fieldName => {
      const fieldState = getFieldState(fieldName);
      const fieldValue = watchedValues[fieldName];
      
      // Field is completed if it has a value and either:
      // 1. It hasn't been touched yet (no validation run), OR
      // 2. It has been touched and has no errors
      if (fieldValue && fieldValue.toString().trim() !== '') {
        if (!touchedFields[fieldName] || !fieldState.error) {
          newCompletedFields.add(fieldName);
        }
      }
    });
    
    // Only update if there's a change to avoid infinite loops
    if (newCompletedFields.size !== completedFields.size || 
        Array.from(newCompletedFields).sort().join(',') !== Array.from(completedFields).sort().join(',')) {
      setCompletedFields(newCompletedFields);
      
      // Celebrate each new field completion
      if (newCompletedFields.size > completedFields.size && companion) {
        companion.handleFieldComplete();
      }
    }
  }, [watchedValues, errors, getFieldState, completedFields, companion, touchedFields]);

  // React to form progress
  useEffect(() => {
    if (companion) {
      const progress = completedFields.size / totalFields;
      
      if (progress === 0) {
        companion.setMood('idle');
      } else if (progress < 0.4) {
        companion.setMood('curious');
      } else if (progress < 0.8) {
        // Getting excited
        if (companion.mood !== 'happy') {
          companion.setMood('happy');
          setTimeout(() => companion.setMood('curious'), 2000);
        }
      } else if (progress >= 0.8) {
        // Very happy, almost done!
        companion.setMood('happy');
      }

      // Move companion based on progress
      if (progress > 0 && progress < 1) {
        const formRect = formRef.current?.getBoundingClientRect();
        if (formRect) {
          companion.setPosition({
            x: formRect.right + 20,
            y: formRect.top + (formRect.height * progress),
          });
        }
      }
    }
  }, [completedFields, companion]);

  // Track password strength
  const password = watch("password");
  
  useEffect(() => {
    if (password) {
      // Simple password strength calculation
      let strength: 'weak' | 'medium' | 'strong' = 'weak';
      
      if (password.length >= 8) {
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSpecial = /[^A-Za-z0-9]/.test(password);
        
        const criteriaCount = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
        
        if (criteriaCount >= 4 && password.length >= 12) {
          strength = 'strong';
        } else if (criteriaCount >= 3) {
          strength = 'medium';
        }
      }
      
      setPasswordStrength(strength);
      companion?.handlePasswordStrength(strength);
    }
  }, [password, companion]);

  // Handle companion interactions
  const handleInputFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    if (companion && e.target) {
      companion.handleInputFocus(e.target);
    }
  }, [companion]);

  const handleInputChange = useCallback(() => {
    if (companion) {
      companion.handleTyping();
    }
  }, [companion]);

  // React to errors (only when there are actual errors shown)
  useEffect(() => {
    const visibleErrors = Object.keys(errors).filter(key => {
      const fieldName = key as keyof typeof errors;
      return touchedFields[fieldName] && errors[fieldName]?.message;
    });
    if (visibleErrors.length > 0 && companion) {
      companion.handleError();
    }
  }, [errors, companion, touchedFields]);

  const registerMutation = useMutation({
    mutationFn: (data: Omit<RegisterFormData, "confirmPassword">) =>
      authService.register(data),
    onMutate: () => {
      if (companion) {
        companion.handleLoading();
      }
    },
    onSuccess: (data) => {
      if (companion) {
        // Major celebration for successful registration!
        companion.handleSuccess();
        
        // Extra celebration animations
        setTimeout(() => {
          companion.setMood('happy');
          // Do a little dance (move in a pattern)
          const celebrationPath = [
            { x: window.innerWidth / 2 - 50, y: window.innerHeight / 2 - 100 },
            { x: window.innerWidth / 2 + 50, y: window.innerHeight / 2 - 100 },
            { x: window.innerWidth / 2 + 50, y: window.innerHeight / 2 },
            { x: window.innerWidth / 2 - 50, y: window.innerHeight / 2 },
            { x: window.innerWidth / 2, y: window.innerHeight / 2 - 50 },
          ];
          companion.followPath(celebrationPath);
        }, 500);
      }
      
      // Navigate to success page after celebration
      setTimeout(() => {
        navigate("/register/success", {
          state: {
            email: data.email,
            message: data.message,
          },
        });
      }, 2500);
    },
    onError: (error) => {
      console.error("Registration error:", error);
      
      if (companion) {
        if (error.toString().includes("ERR_NETWORK")) {
          companion.handleSpecificError('network');
        } else {
          companion.handleError();
        }
      }
      
      if (isValidationError(error)) {
        // Handle field-specific validation errors from the API
        error.response?.data.validation_errors.forEach((validationError) => {
          const field = validationError.field as keyof RegisterFormData;
          if (
            field === "email" ||
            field === "password" ||
            field === "firstName" ||
            field === "lastName" ||
            field === "confirmPassword"
          ) {
            setError(field, {
              message: validationError.message,
            });
          }
        });
      } else {
        // Type guard for axios-like errors
        const axiosError = error as {
          response?: {
            status?: number;
            data?: {
              message?: string;
            };
          };
          code?: string;
        };

        if (axiosError.response?.status === 409) {
          // Email already exists
          setError("email", {
            message: "An account with this email already exists",
          });
        } else if (
          axiosError.code === "ERR_NETWORK" ||
          axiosError.code === "ERR_CONNECTION_REFUSED"
        ) {
          // Network error - backend not available
          setGeneralError(
            "Unable to connect to the server. Make sure the backend is running or MSW is properly configured.",
          );
        } else {
          // General error
          setGeneralError(
            axiosError.response?.data?.message ||
              "Something went wrong. Please try again.",
          );
        }
      }
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setGeneralError("");
    
    // Check if terms are accepted
    if (!termsAccepted) {
      setGeneralError("Please accept the Terms and Conditions to continue.");
      return;
    }
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmPassword, ...registerData } = data;
    await registerMutation.mutateAsync(registerData);
  };

  // Show form completion percentage
  const completionPercentage = Math.round((completedFields.size / totalFields) * 100);

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-[var(--surface)] py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
        <div className="mb-6">
          <h2 className="text-center text-3xl font-extrabold text-[var(--text)]">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-muted">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
              onMouseEnter={() => companion?.showCuriosity()}
              onMouseLeave={() => companion?.setMood('idle')}
            >
              Sign in
            </Link>
          </p>
          
          {/* Progress indicator */}
          {completedFields.size > 0 && (
            <div className="mt-4">
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-primary-600 bg-primary-200">
                      Progress
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block text-primary-600">
                      {completionPercentage}%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-primary-200">
                  <div 
                    style={{ width: `${completionPercentage}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary-500 transition-all duration-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <form ref={formRef} onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
          {generalError && (
            <div
              className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm"
              role="alert"
            >
              <div>{generalError}</div>
              {generalError.includes("Unable to connect") && (
                <div className="mt-2 text-xs">
                  <strong>Quick Fix:</strong> Restart the dev server (Ctrl+C
                  then npm run dev)
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Input
              label="First name"
              isRequired
              {...register("firstName")}
              error={touchedFields.firstName ? errors.firstName?.message : undefined}
              autoComplete="given-name"
              onFocus={handleInputFocus}
              onChange={handleInputChange}
            />

            <Input
              label="Last name"
              isRequired
              {...register("lastName")}
              error={touchedFields.lastName ? errors.lastName?.message : undefined}
              autoComplete="family-name"
              onFocus={handleInputFocus}
              onChange={handleInputChange}
            />
          </div>

          <Input
            label="Email address"
            type="email"
            isRequired
            {...register("email")}
            error={touchedFields.email ? errors.email?.message : undefined}
            autoComplete="email"
            onFocus={handleInputFocus}
            onChange={handleInputChange}
            leftIcon={
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
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
              {...register("password")}
              error={touchedFields.password ? errors.password?.message : undefined}
              autoComplete="new-password"
              hint="Must be at least 8 characters with uppercase, lowercase, number, and special character"
              onFocus={handleInputFocus}
              onChange={handleInputChange}
            />
            <PasswordStrengthMeter password={password || ""} />
            {passwordStrength === 'strong' && companion && (
              <p className="mt-1 text-sm text-green-600">
                Great password! Your companion is impressed! 🎉
              </p>
            )}
          </div>

          <PasswordInput
            label="Confirm password"
            isRequired
            {...register("confirmPassword")}
            error={touchedFields.confirmPassword ? errors.confirmPassword?.message : undefined}
            autoComplete="new-password"
            onFocus={handleInputFocus}
            onChange={handleInputChange}
          />

          <div className="space-y-4">
            <div className="flex items-start">
              <input
                id="terms"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-[color:var(--surface-muted)] rounded"
                checked={termsAccepted}
                onChange={(e) => {
                  setTermsAccepted(e.target.checked);
                  if (e.target.checked && companion) {
                    companion.setMood('happy');
                    setTimeout(() => companion.setMood('idle'), 1500);
                  }
                }}
              />
              <label
                htmlFor="terms"
                className="ml-2 block text-sm text-[var(--text)]"
              >
                I agree to the{" "}
                <Link
                  to="/terms"
                  className="font-medium text-primary-600 hover:text-primary-500"
                  target="_blank"
                >
                  Terms and Conditions
                </Link>{" "}
                and{" "}
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
              <div className="w-full border-t border-[color:var(--surface-muted)]" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[var(--surface)] text-gray-500">
                Or continue with
              </span>
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
