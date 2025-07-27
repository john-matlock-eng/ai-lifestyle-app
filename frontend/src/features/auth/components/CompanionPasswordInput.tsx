import React, { forwardRef, useRef, useImperativeHandle } from 'react';
import PasswordInput from './PasswordInput';
import type { PasswordInputProps } from './PasswordInput';
import type { useEnhancedAuthShihTzu } from '../../../hooks/useEnhancedAuthShihTzu';

interface CompanionPasswordInputProps extends PasswordInputProps {
  companion?: ReturnType<typeof useEnhancedAuthShihTzu>;
  fieldName: 'password' | 'confirmPassword' | 'currentPassword';
  watchPassword?: string; // For confirmPassword validation
  onFieldComplete?: () => void;
}

/**
 * Enhanced PasswordInput component that integrates with the Shih Tzu companion
 * Provides password strength feedback and validation animations
 */
const CompanionPasswordInput = forwardRef<HTMLInputElement, CompanionPasswordInputProps>(
  ({ companion, fieldName, watchPassword, onFieldComplete, onFocus, onChange, onBlur, ...props }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const hasValueRef = useRef(false);

    // Forward ref to parent
    useImperativeHandle(ref, () => inputRef.current!);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      // Call original handler if exists
      onFocus?.(e);

      if (!companion) return;

      // Move companion to the input
      companion.handleInputFocus(e.target);

      // Field-specific thoughts and moods
      switch (fieldName) {
        case 'password':
          companion.showThought("Create a strong password! 🔐", 2500);
          companion.setMood('protective' as Parameters<typeof companion.setMood>[0]);
          break;
        case 'confirmPassword':
          companion.showThought("Let's make sure they match! 🔄", 2500);
          companion.setMood('encouraging' as Parameters<typeof companion.setMood>[0]);
          break;
        case 'currentPassword':
          companion.showThought("Type carefully... 🔒", 2500);
          companion.setMood('zen' as Parameters<typeof companion.setMood>[0]);
          break;
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Call original handler if exists
      onChange?.(e);

      if (!companion) return;

      // Clear previous typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Show typing animation
      companion.handleTyping();

      const value = e.target.value;
      const hasValue = value.length > 0;

      // For confirmPassword, check if it matches
      if (fieldName === 'confirmPassword' && watchPassword) {
        if (value === watchPassword && value.length > 0) {
          companion.showThought("Passwords match! 🎯", 1500);
          companion.triggerParticleEffect('hearts');
          companion.setMood('celebrating' as Parameters<typeof companion.setMood>[0]);
        } else if (value.length >= watchPassword.length && value !== watchPassword) {
          companion.showThought("Not matching yet... 🤔", 1500);
          companion.setMood('concerned' as Parameters<typeof companion.setMood>[0]);
        }
      }

      // Set timeout to return to idle
      typingTimeoutRef.current = setTimeout(() => {
        if (companion.companionState === 'typing') {
          companion.setMood('idle');
        }
      }, 1500);

      hasValueRef.current = hasValue;
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      // Call original handler if exists
      onBlur?.(e);

      if (!companion) return;

      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      companion.handleInputBlur();

      // If field has valid value and no error, celebrate
      if (hasValueRef.current && !props.error && e.target.value) {
        companion.handleFieldComplete();

        // Field-specific celebrations
        if (fieldName === 'confirmPassword' && watchPassword === e.target.value) {
          companion.showThought("Perfect match! ✅", 1500);
          companion.triggerParticleEffect('sparkles');
          companion.setMood('proud' as Parameters<typeof companion.setMood>[0]);
        }

        onFieldComplete?.();
      }
    };

    // React to errors
    React.useEffect(() => {
      if (props.error && companion && hasValueRef.current) {
        // Field-specific error messages
        switch (fieldName) {
          case 'password':
            if (props.error.includes('8 characters')) {
              companion.showThought("Make it longer! 📏", 3000);
            } else {
              companion.showThought("Let's strengthen this! 💪", 3000);
            }
            break;
          case 'confirmPassword':
            companion.showThought("Passwords don't match! 🔄", 3000);
            companion.setMood('concerned' as Parameters<typeof companion.setMood>[0]);
            break;
          case 'currentPassword':
            companion.showThought("That doesn't look right... 🤔", 3000);
            break;
        }
      }
    }, [props.error, companion, fieldName]);

    return (
      <PasswordInput
        ref={inputRef}
        {...props}
        onFocus={handleFocus}
        onChange={handleChange}
        onBlur={handleBlur}
      />
    );
  }
);

CompanionPasswordInput.displayName = 'CompanionPasswordInput';

export default CompanionPasswordInput;
