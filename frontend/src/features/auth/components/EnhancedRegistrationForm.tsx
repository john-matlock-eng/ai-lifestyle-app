import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { registerSchema } from "../utils/validation";
import type { RegisterFormData } from "../utils/validation";
import { authService } from "../services/authService";
import { checkPasswordStrength } from "../utils/passwordStrength";
import Button from "../../../components/common/Button";
import PasswordStrengthMeter from "./PasswordStrengthMeter";
import CompanionInput from "./CompanionInput";
import CompanionPasswordInput from "./CompanionPasswordInput";
import type { useEnhancedAuthShihTzu } from "../../../hooks/useEnhancedAuthShihTzu";

type FormData = RegisterFormData;

interface EnhancedRegistrationFormProps {
  companion?: ReturnType<typeof useEnhancedAuthShihTzu>;
}

/**
 * Enhanced Registration Form with full Shih Tzu companion integration
 * Features an animated companion that guides users through registration with
 * encouragement, celebrations, and helpful feedback
 * Note: Companion is provided by AuthLayout, not created internally
 */
const EnhancedRegistrationForm: React.FC<EnhancedRegistrationFormProps> = ({ companion }) => {
  const navigate = useNavigate();
  const [generalError, setGeneralError] = useState<string>("");
  const [completedFields, setCompletedFields] = useState<Set<string>>(new Set());
  const formRef = useRef<HTMLFormElement>(null);
  const passwordStrengthDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastPasswordStrength = useRef<number>(-1);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, touchedFields },
    setError,
  } = useForm<FormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
    defaultValues: {
      termsAccepted: false,
    }
  });

  const password = watch("password");
  const watchedValues = watch();

  // Greet new user on mount (only if companion exists)
  useEffect(() => {
    if (!companion) return;
    
    const greetTimer = setTimeout(() => {
      companion.setMood('excited' as Parameters<typeof companion.setMood>[0]);
      companion.showThought("Hi there! Let's create your account! 🌟", 4000);
      companion.triggerParticleEffect('sparkles');
      
      // Move to a welcoming position
      const formWidth = 400;
      const formCenterX = window.innerWidth / 2;
      const welcomeX = Math.min(formCenterX - formWidth / 2 - 100, window.innerWidth - 150);
      companion.setPosition({ x: welcomeX, y: 150 });
      
      setTimeout(() => {
        companion.setMood('happy');
        // Move to default position
        const defaultX = Math.min(formCenterX + formWidth / 2 + 100, window.innerWidth - 150);
        companion.setPosition({ x: defaultX, y: 200 });
      }, 3000);
    }, 500);

    return () => clearTimeout(greetTimer);
  }, [companion]);

  // Enhanced password strength reactions
  useEffect(() => {
    if (password && companion && touchedFields.password) {
      if (passwordStrengthDebounceRef.current) {
        clearTimeout(passwordStrengthDebounceRef.current);
      }
      
      passwordStrengthDebounceRef.current = setTimeout(() => {
        const strength = checkPasswordStrength(password);
        
        if (strength.score !== lastPasswordStrength.current) {
          lastPasswordStrength.current = strength.score;
          
          if (strength.score <= 1) {
            companion.handlePasswordStrength('weak');
          } else if (strength.score <= 3) {
            companion.handlePasswordStrength('medium');
          } else {
            companion.handlePasswordStrength('strong');
            // Extra celebration for strong password
            setTimeout(() => {
              companion.setMood('proud' as Parameters<typeof companion.setMood>[0]);
            }, 1000);
          }
        }
      }, 500);
    }
  }, [password, companion, touchedFields.password]);

  // React to form errors
  useEffect(() => {
    const errorCount = Object.keys(errors).length;
    if (errorCount > 0 && companion && companion.companionState !== 'error') {
      companion.handleError();
      
      // Specific error guidance
      if (errors.email) {
        companion.showThought("Let's check that email format 📧", 3000);
      } else if (errors.password) {
        companion.showThought("Password needs improvement 🔐", 3000);
      } else if (errors.confirmPassword) {
        companion.showThought("Passwords must match exactly! 🔄", 3000);
      } else if (errors.termsAccepted) {
        companion.showThought("Don't forget the terms! 📄", 3000);
      }
    }
  }, [errors, companion]);

  // React to general errors
  useEffect(() => {
    if (generalError && companion) {
      companion.handleSpecificError('server');
    }
  }, [generalError, companion]);

  // Track progress and encourage
  useEffect(() => {
    if (!companion) return;
    
    const filledFields = [
      watchedValues.firstName,
      watchedValues.lastName,
      watchedValues.email,
      watchedValues.password,
      watchedValues.confirmPassword,
      watchedValues.termsAccepted
    ].filter(Boolean).length;

    const progress = (filledFields / 6) * 100;

    // Progress milestones
    if (progress === 50 && completedFields.size === 3) {
      companion.showThought("Halfway there! Keep going! 🎯", 2000);
      companion.triggerParticleEffect('sparkles');
    } else if (progress === 83 && completedFields.size === 5) {
      companion.setMood('excited' as Parameters<typeof companion.setMood>[0]);
      companion.showThought("Almost done! Just one more! 🏁", 2000);
    }
  }, [watchedValues, completedFields, companion]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (passwordStrengthDebounceRef.current) {
        clearTimeout(passwordStrengthDebounceRef.current);
      }
    };
  }, []);

  const handleFieldComplete = (fieldName: string) => {
    setCompletedFields(prev => new Set([...prev, fieldName]));
  };

  const registerMutation = useMutation({
    mutationFn: (data: Omit<FormData, "confirmPassword">) => 
      authService.register(data),
    onMutate: () => {
      if (companion) {
        companion.handleLoading();
        companion.showThought("Creating your account... 🚀", 3000);
      }
    },
    onSuccess: (data) => {
      if (companion) {
        companion.handleSuccess();
        companion.showThought("Welcome to the family! 🎊", 4000);
        
        // Epic celebration sequence
        setTimeout(() => {
          companion.triggerParticleEffect('hearts');
        }, 500);
        setTimeout(() => {
          companion.triggerParticleEffect('sparkles');
        }, 1000);
        setTimeout(() => {
          companion.setMood('celebrating' as Parameters<typeof companion.setMood>[0]);
          companion.showThought("Let's start your journey! 🌈", 3000);
        }, 1500);
      }
      
      setTimeout(() => {
        navigate("/register/success", {
          state: {
            email: data.email,
            message: data.message,
          },
        });
      }, 3000);
    },
    onError: (error: unknown) => {
      console.error("Registration error:", error);
      
      const errorData = error as { response?: { data?: { validation_errors?: Array<{ field: string; message: string }>; message?: string }; status?: number }; code?: string };
      
      if (errorData.response?.data?.validation_errors) {
        errorData.response.data.validation_errors.forEach((validationError) => {
          const field = validationError.field as keyof FormData;
          if (field in errors) {
            setError(field, {
              message: validationError.message,
            });
          }
        });
        
        if (companion) {
          companion.showThought("Let's fix these issues... 📝", 3000);
        }
      } else if (errorData.response?.status === 409) {
        setError("email", {
          message: "An account with this email already exists",
        });
        
        if (companion) {
          companion.showThought("This email is already taken! 🤷", 3000);
        }
      } else if (errorData.code === "ERR_NETWORK") {
        setGeneralError(
          "Unable to connect to the server. Make sure the backend is running."
        );
      } else {
        setGeneralError(
          errorData.response?.data?.message || "Something went wrong. Please try again."
        );
      }
    },
  });

  const onSubmit = async (data: FormData) => {
    setGeneralError("");
    
    // Pre-submit celebration
    if (companion) {
      companion.encourage();
      companion.showThought("Here we go! Creating your account! 🎉", 2000);
    }
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmPassword, ...registerData } = data;
    await registerMutation.mutateAsync(registerData);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-[var(--surface)] py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
        <h2 className="text-center text-3xl font-extrabold text-[var(--text)] mb-6">
          Create your account
        </h2>
        
        <p className="text-center text-sm text-muted mb-6">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-primary-600 hover:text-primary-500"
            onMouseEnter={() => {
              companion?.showCuriosity();
              companion?.showThought("Already a member? 🤔", 2000);
            }}
            onMouseLeave={() => companion?.setMood('idle')}
          >
            Sign in
          </Link>
        </p>

        <form ref={formRef} onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {generalError && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">
              {generalError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <CompanionInput
              label="First name"
              isRequired
              {...register("firstName")}
              error={errors.firstName?.message}
              autoComplete="given-name"
              companion={companion}
              fieldName="firstName"
              onFieldComplete={() => handleFieldComplete("firstName")}
            />

            <CompanionInput
              label="Last name"
              isRequired
              {...register("lastName")}
              error={errors.lastName?.message}
              autoComplete="family-name"
              companion={companion}
              fieldName="lastName"
              onFieldComplete={() => handleFieldComplete("lastName")}
            />
          </div>

          <CompanionInput
            label="Email address"
            type="email"
            isRequired
            {...register("email")}
            error={errors.email?.message}
            autoComplete="email"
            companion={companion}
            fieldName="email"
            onFieldComplete={() => handleFieldComplete("email")}
          />

          <div>
            <CompanionPasswordInput
              label="Password"
              isRequired
              {...register("password")}
              error={errors.password?.message}
              autoComplete="new-password"
              companion={companion}
              fieldName="password"
              onFieldComplete={() => handleFieldComplete("password")}
            />
            {password && (
              <PasswordStrengthMeter
                password={password}
                showFeedback={touchedFields.password || !!errors.password}
              />
            )}
          </div>

          <CompanionPasswordInput
            label="Confirm password"
            isRequired
            {...register("confirmPassword")}
            error={errors.confirmPassword?.message}
            autoComplete="new-password"
            companion={companion}
            fieldName="confirmPassword"
            watchPassword={password}
            onFieldComplete={() => handleFieldComplete("confirmPassword")}
          />

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="termsAccepted"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-[color:var(--surface-muted)] rounded"
                {...register("termsAccepted")}
                onChange={async (e) => {
                  const registration = register("termsAccepted");
                  await registration.onChange(e);
                  
                  // Celebrate terms acceptance
                  if (e.target.checked && companion && companion.companionState !== 'error') {
                    handleFieldComplete("termsAccepted");
                    companion.handleFieldComplete();
                    companion.showThought("Great! Almost ready! ✅", 1500);
                    companion.triggerParticleEffect('sparkles');
                    companion.setMood('excited' as Parameters<typeof companion.setMood>[0]);
                  }
                }}
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="termsAccepted" className="font-medium text-[var(--text)]">
                I agree to the{" "}
                <Link
                  to="/terms"
                  className="text-primary-600 hover:text-primary-500"
                  target="_blank"
                  onMouseEnter={() => {
                    companion?.showCuriosity();
                    companion?.showThought("Good to read these! 📄", 2000);
                  }}
                  onMouseLeave={() => companion?.setMood('idle')}
                >
                  Terms and Conditions
                </Link>{" "}
                and{" "}
                <Link
                  to="/privacy"
                  className="text-primary-600 hover:text-primary-500"
                  target="_blank"
                  onMouseEnter={() => {
                    companion?.showCuriosity();
                    companion?.showThought("Privacy matters! 🔒", 2000);
                  }}
                  onMouseLeave={() => companion?.setMood('idle')}
                >
                  Privacy Policy
                </Link>
              </label>
              {errors.termsAccepted && (
                <p className="mt-1 text-red-600 text-xs">{errors.termsAccepted.message}</p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            fullWidth
            size="lg"
            isLoading={isSubmitting || registerMutation.isPending}
            loadingText="Creating account..."
            disabled={!watchedValues.termsAccepted}
            onMouseEnter={() => {
              if (watchedValues.termsAccepted && !isSubmitting && !registerMutation.isPending && companion) {
                companion.showThought("Ready to join? 🚀", 1500);
                companion.setMood('excited' as Parameters<typeof companion.setMood>[0]);
              }
            }}
            onMouseLeave={() => {
              if (!isSubmitting && !registerMutation.isPending && companion) {
                companion.setMood('idle');
              }
            }}
          >
            Create account
          </Button>
        </form>
      </div>
    </div>
  );
};

export default EnhancedRegistrationForm;
