import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { registerSchema } from "../utils/validation";
import type { RegisterFormData } from "../utils/validation";
import { authService } from "../services/authService";
import { checkPasswordStrength } from "../utils/passwordStrength";
import Input from "../../../components/common/Input";
import Button from "../../../components/common/Button";
import PasswordInput from "./PasswordInput";
import PasswordStrengthMeter from "./PasswordStrengthMeter";
import type { useEnhancedAuthShihTzu } from "../../../hooks/useEnhancedAuthShihTzu";

type FormData = RegisterFormData;

interface RegistrationFormProps {
  companion?: ReturnType<typeof useEnhancedAuthShihTzu>;
}

const RegistrationForm: React.FC<RegistrationFormProps> = ({ companion }) => {
  const navigate = useNavigate();
  const [generalError, setGeneralError] = useState<string>("");
  const [hasInteracted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const typingDebounceRef = useRef<NodeJS.Timeout | null>(null);
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

  // Enhanced password strength reactions
  useEffect(() => {
    if (password && companion && hasInteracted) {
      if (passwordStrengthDebounceRef.current) {
        clearTimeout(passwordStrengthDebounceRef.current);
      }
      
      passwordStrengthDebounceRef.current = setTimeout(() => {
        const strength = checkPasswordStrength(password);
        
        if (strength.score !== lastPasswordStrength.current) {
          lastPasswordStrength.current = strength.score;
          
          // Enhanced reactions with thoughts and particles
          if (strength.score <= 1) {
            companion.handlePasswordStrength('weak');
            companion.showThought("Let's make it stronger! 💪", 2000);
          } else if (strength.score <= 3) {
            companion.handlePasswordStrength('medium');
            companion.showThought("Getting better! 🔐", 2000);
            companion.triggerParticleEffect('sparkles');
          } else {
            companion.handlePasswordStrength('strong');
            companion.showThought("Perfect password! 🛡️", 2000);
            companion.triggerParticleEffect('hearts');
          }
        }
      }, 500);
    }
  }, [password, companion, hasInteracted]);

  // React to form errors with enhanced companion
  useEffect(() => {
    const errorCount = Object.keys(errors).length;
    if (errorCount > 0 && companion && hasInteracted && companion.companionState !== 'error') {
      companion.handleError();
      
      // Specific error messages
      if (errors.email) {
        companion.showThought("Check your email format 📧", 3000);
      } else if (errors.password) {
        companion.showThought("Password needs work 🔐", 3000);
      } else if (errors.confirmPassword) {
        companion.showThought("Passwords must match! 🔄", 3000);
      }
    }
  }, [errors, companion, hasInteracted]);

  // React to general errors
  useEffect(() => {
    if (generalError && companion) {
      companion.handleSpecificError('server');
      companion.showThought("Hmm, let me check... 🤔", 3000);
    }
  }, [generalError, companion]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
      if (passwordStrengthDebounceRef.current) clearTimeout(passwordStrengthDebounceRef.current);
    };
  }, []);

  // Enhanced field props with companion interactions
  // Commented out - not compatible with current form field type expectations
  /*
  const createEnhancedFieldProps = (fieldName: keyof FormData) => {
    const fieldRegistration = register(fieldName);
    
    return {
      ...fieldRegistration,
      onFocus: async (e: React.FocusEvent<HTMLInputElement>) => {
        setHasInteracted(true);
        
        if (fieldRegistration.onFocus) {
          await fieldRegistration.onFocus(e);
        }
        
        if (companion && e.target) {
          companion.handleInputFocus(e.target);
          
          // Field-specific welcome messages
          switch (fieldName) {
            case 'firstName':
              companion.showThought("Let's start with your name! 👋", 2000);
              break;
            case 'lastName':
              companion.showThought("And your last name... ✍️", 2000);
              break;
            case 'email':
              companion.showThought("Your email address please! 📧", 2000);
              break;
            case 'password':
              companion.showThought("Choose a strong password! 🔐", 2000);
              break;
            case 'confirmPassword':
              companion.showThought("One more time! 🔄", 2000);
              break;
          }
        }
      },
      onChange: async (e: React.ChangeEvent<HTMLInputElement>) => {
        await fieldRegistration.onChange(e);
        
        if (hasInteracted) {
          await trigger(fieldName);
        }
        
        // Typing animation for non-password fields
        if (companion && hasInteracted && fieldName !== 'password') {
          if (typingDebounceRef.current) {
            clearTimeout(typingDebounceRef.current);
          }
          
          typingDebounceRef.current = setTimeout(() => {
            companion.handleTyping();
            
            // Random encouragement
            if (Math.random() < 0.15) {
              const encouragements = [
                "Looking good! 👍",
                "Keep going! ⭐",
                "You're doing great! 🌟",
                "Almost there! 🎯"
              ];
              companion.showThought(
                encouragements[Math.floor(Math.random() * encouragements.length)],
                1500
              );
            }
          }, 100);
        }
      },
      onBlur: async (e: React.FocusEvent<HTMLInputElement>) => {
        if (fieldRegistration.onBlur) {
          await fieldRegistration.onBlur(e);
        }
        
        if (typingDebounceRef.current) {
          clearTimeout(typingDebounceRef.current);
        }
        
        if (companion) {
          companion.handleInputBlur();
          
          const fieldError = errors[fieldName];
          const fieldValue = e.target.value;
          
          // Celebrate valid fields
          if (!fieldError && fieldValue && touchedFields[fieldName]) {
            companion.handleFieldComplete();
            
            // Special celebrations for specific fields
            if (fieldName === 'email' && fieldValue.includes('@')) {
              companion.showThought("Great email! ✅", 1500);
              companion.triggerParticleEffect('sparkles');
            } else if (fieldName === 'confirmPassword' && password === fieldValue) {
              companion.showThought("Passwords match! 🎯", 1500);
              companion.triggerParticleEffect('hearts');
            }
          }
        }
      }
    };
  };
  */

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
        companion.showThought("Account created! Welcome! 🎊", 4000);
        
        // Extra celebration for new users
        setTimeout(() => {
          companion.triggerParticleEffect('hearts');
        }, 500);
        setTimeout(() => {
          companion.triggerParticleEffect('sparkles');
        }, 1000);
      }
      
      setTimeout(() => {
        navigate("/register/success", {
          state: {
            email: data.email,
            message: data.message,
          },
        });
      }, 2000);
    },
    onError: (error: any) => {
      console.error("Registration error:", error);
      
      if (error.response?.data?.validation_errors) {
        error.response.data.validation_errors.forEach((validationError: any) => {
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
      } else if (error.response?.status === 409) {
        setError("email", {
          message: "An account with this email already exists",
        });
        
        if (companion) {
          companion.showThought("This email is taken! 🤷", 3000);
        }
      } else if (error.code === "ERR_NETWORK") {
        setGeneralError(
          "Unable to connect to the server. Make sure the backend is running."
        );
      } else {
        setGeneralError(
          error.response?.data?.message || "Something went wrong. Please try again."
        );
      }
    },
  });

  const onSubmit = async (data: FormData) => {
    setGeneralError("");
    
    // Enhanced: pre-submit encouragement
    if (companion) {
      companion.encourage();
      companion.showThought("Here we go! 🎉", 1500);
    }
    
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
              companion?.showThought("Have an account? 🤔", 2000);
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
            <Input
              label="First name"
              isRequired
              {...register("firstName")}
              error={errors.firstName?.message}
              autoComplete="given-name"
            />

            <Input
              label="Last name"
              isRequired
              {...register("lastName")}
              error={errors.lastName?.message}
              autoComplete="family-name"
            />
          </div>

          <Input
            label="Email address"
            type="email"
            isRequired
            {...register("email")}
            error={errors.email?.message}
            autoComplete="email"
          />

          <div>
            <PasswordInput
              label="Password"
              isRequired
              {...register("password")}
              error={errors.password?.message}
              autoComplete="new-password"
            />
            {password && (
              <PasswordStrengthMeter
                password={password}
                showFeedback={touchedFields.password || !!errors.password}
              />
            )}
          </div>

          <PasswordInput
            label="Confirm password"
            isRequired
            {...register("confirmPassword")}
            error={errors.confirmPassword?.message}
            autoComplete="new-password"
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
                  
                  // Enhanced: celebrate terms acceptance
                  if (e.target.checked && companion && companion.companionState !== 'error') {
                    companion.handleFieldComplete();
                    companion.showThought("Almost ready! ✔️", 1500);
                    companion.triggerParticleEffect('sparkles');
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
              if (watchedValues.termsAccepted && companion) {
                companion.showThought("Ready to join? 🚀", 1500);
                companion.setMood('excited' as any);
              }
            }}
            onMouseLeave={() => companion?.setMood('idle')}
          >
            Create account
          </Button>
        </form>
      </div>
    </div>
  );
};

export default RegistrationForm;