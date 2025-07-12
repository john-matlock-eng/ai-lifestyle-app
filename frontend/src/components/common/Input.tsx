import React from "react";
import { clsx } from "clsx";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isRequired?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      isRequired,
      id,
      type = "text",
      ...props
    },
    ref,
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    const inputClasses = clsx(
      "block w-full rounded-md shadow-sm transition-all duration-200 sm:text-sm text-theme bg-surface placeholder-text-muted",
      leftIcon && "pl-10",
      rightIcon && "pr-10",
      error
        ? "border-error-theme text-error-theme placeholder-error-theme focus:outline-none focus:shadow-[0_0_0_3px_rgba(239,68,68,0.2)]"
        : "border-surface-muted focus:outline-none focus:border-accent focus:shadow-focus hover:border-accent/50",
      className,
    );

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-theme mb-1"
          >
            {label}
            {isRequired && <span className="text-error-theme ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-text-muted sm:text-sm">{leftIcon}</span>
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={type}
            className={inputClasses}
            aria-invalid={!!error}
            aria-describedby={
              error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
            }
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <span className="text-text-muted sm:text-sm">{rightIcon}</span>
            </div>
          )}
        </div>
        {hint && !error && (
          <p id={`${inputId}-hint`} className="mt-1 text-sm text-text-muted">
            {hint}
          </p>
        )}
        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-1 text-sm text-error-theme"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
