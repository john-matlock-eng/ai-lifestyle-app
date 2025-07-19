import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { loginSchema } from "../utils/validation";
import type { LoginFormData } from "../utils/validation";
import { authService } from "../services/authService";
import { isApiError } from "../../../api/client";
import { setRememberMe } from "../utils/tokenManager";
import Input from "../../../components/common/Input";
import Button from "../../../components/common/Button";
import PasswordInput from "./PasswordInput";
import MfaCodeInput from "./MfaCodeInput";

const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [generalError, setGeneralError] = useState<string>("");
  const [mfaSession, setMfaSession] = useState<{ sessionToken: string } | null>(
    null,
  );
  const [showMfa, setShowMfa] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: false,
    },
  });

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      if ("mfaRequired" in data) {
        // MFA is required
        setMfaSession({ sessionToken: data.sessionToken });
        setShowMfa(true);
      } else {
        // Login successful - refresh user data and redirect
        // The tokens are already stored by authService
        queryClient.invalidateQueries({ queryKey: ["currentUser"] });
        navigate("/dashboard", { replace: true });
      }
    },
    onError: (error) => {
      if (isApiError(error)) {
        if (error.response?.status === 401) {
          setError("password", {
            message: "Invalid email or password",
          });
        } else if (error.response?.status === 429) {
          setGeneralError("Too many login attempts. Please try again later.");
        } else {
          setGeneralError(
            error.response?.data?.message ||
              "Something went wrong. Please try again.",
          );
        }
      } else {
        setGeneralError("Unable to connect to the server. Please try again.");
      }
    },
  });

  const mfaMutation = useMutation({
    mutationFn: ({
      sessionToken,
      code,
    }: {
      sessionToken: string;
      code: string;
    }) => authService.verifyMfa(sessionToken, code),
    onSuccess: () => {
      // MFA verification successful
      // The tokens are stored by authService
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      navigate("/dashboard", { replace: true });
    },
    onError: (error) => {
      if (isApiError(error)) {
        if (error.response?.status === 400) {
          setGeneralError("Invalid verification code. Please try again.");
        } else if (error.response?.status === 401) {
          // Session expired
          setGeneralError("Your session has expired. Please log in again.");
          setShowMfa(false);
          setMfaSession(null);
        } else {
          setGeneralError(
            error.response?.data?.message ||
              "Verification failed. Please try again.",
          );
        }
      }
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setGeneralError("");
    // Set remember me preference before login
    if (data.rememberMe !== undefined) {
      setRememberMe(data.rememberMe);
    }
    await loginMutation.mutateAsync(data);
  };

  const handleMfaSubmit = async (code: string) => {
    if (!mfaSession) return;
    setGeneralError("");
    await mfaMutation.mutateAsync({
      sessionToken: mfaSession.sessionToken,
      code,
    });
  };

  const handleMfaCancel = () => {
    setShowMfa(false);
    setMfaSession(null);
    setGeneralError("");
  };

  if (showMfa && mfaSession) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-[var(--surface)] py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          <div className="mb-6">
            <h2 className="text-center text-3xl font-extrabold text-[var(--text)]">
              Two-Factor Authentication
            </h2>
            <p className="mt-2 text-center text-sm text-muted">
              Enter the 6-digit code from your authenticator app
            </p>
          </div>

          {generalError && (
            <div
              className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm"
              role="alert"
            >
              {generalError}
            </div>
          )}

          <MfaCodeInput
            onSubmit={handleMfaSubmit}
            onCancel={handleMfaCancel}
            isLoading={mfaMutation.isPending}
            error={generalError}
          />

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={handleMfaCancel}
              className="text-sm text-primary-600 hover:text-primary-500"
            >
              Use a different account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-[var(--surface)] py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
        <div className="mb-6">
          <h2 className="text-center text-3xl font-extrabold text-[var(--text)]">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-muted">
            Or{" "}
            <Link
              to="/register"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              create a new account
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {generalError && (
            <div
              className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm"
              role="alert"
            >
              {generalError}
            </div>
          )}

          <Input
            label="Email address"
            type="email"
            isRequired
            {...register("email")}
            error={errors.email?.message}
            autoComplete="email"
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

          <PasswordInput
            label="Password"
            isRequired
            {...register("password")}
            error={errors.password?.message}
            autoComplete="current-password"
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="rememberMe"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-[color:var(--surface-muted)] rounded"
                {...register("rememberMe")}
              />
              <label
                htmlFor="rememberMe"
                className="ml-2 block text-sm text-[var(--text)]"
              >
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link
                to="/forgot-password"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            fullWidth
            size="lg"
            isLoading={isSubmitting || loginMutation.isPending}
            loadingText="Signing in..."
          >
            Sign in
          </Button>
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
            Protected by two-factor authentication
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
