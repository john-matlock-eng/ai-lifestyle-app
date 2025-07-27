import React, { forwardRef, useRef, useImperativeHandle } from "react";
import Input from "../../../components/common/Input";
import type { InputProps } from "../../../components/common/Input";
import type { useEnhancedAuthShihTzu } from "../../../hooks/useEnhancedAuthShihTzu";

interface CompanionInputProps extends InputProps {
  companion?: ReturnType<typeof useEnhancedAuthShihTzu>;
  fieldName: string;
  onFieldComplete?: () => void;
}

/**
 * Enhanced Input component that integrates with the Shih Tzu companion
 * Provides visual feedback, animations, and thought bubbles based on user interaction
 */
const CompanionInput = forwardRef<HTMLInputElement, CompanionInputProps>(
  (
    {
      companion,
      fieldName,
      onFieldComplete,
      onFocus,
      onChange,
      onBlur,
      ...props
    },
    ref,
  ) => {
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
        case "email":
          companion.showThought("Let's start with your email! 📧", 2500);
          companion.setMood("curious");
          break;
        case "password":
          companion.showThought("Keep it secure! 🔒", 2500);
          companion.setMood(
            "protective" as Parameters<typeof companion.setMood>[0],
          );
          break;
        case "firstName":
          companion.showThought("Nice to meet you! 👋", 2500);
          companion.setMood(
            "excited" as Parameters<typeof companion.setMood>[0],
          );
          break;
        case "lastName":
          companion.showThought("And your last name... ✍️", 2500);
          companion.setMood("happy");
          break;
        case "confirmPassword":
          companion.showThought("One more time! 🔄", 2500);
          companion.setMood(
            "encouraging" as Parameters<typeof companion.setMood>[0],
          );
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

      // Check if field has value
      const hasValue = e.target.value.length > 0;

      // Random encouragements while typing (10% chance)
      if (hasValue && Math.random() < 0.1) {
        const encouragements = [
          "You're doing great! 💪",
          "Keep going! ⭐",
          "Looking good! 👍",
          "Almost there! 🎯",
        ];
        const randomEncouragement =
          encouragements[Math.floor(Math.random() * encouragements.length)];
        companion.showThought(randomEncouragement, 1500);
      }

      // Set timeout to return to idle
      typingTimeoutRef.current = setTimeout(() => {
        if (companion.companionState === "typing") {
          companion.setMood("idle");
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
        switch (fieldName) {
          case "email":
            if (e.target.value.includes("@") && e.target.value.includes(".")) {
              companion.showThought("Valid email! ✅", 1500);
              companion.triggerParticleEffect("sparkles");
            }
            break;
          case "firstName":
          case "lastName":
            companion.showThought("Nice name! 😊", 1500);
            companion.triggerParticleEffect("hearts");
            break;
        }

        onFieldComplete?.();
      }
    };

    // React to errors
    React.useEffect(() => {
      if (props.error && companion && hasValueRef.current) {
        // Field-specific error messages
        switch (fieldName) {
          case "email":
            companion.showThought("Check the email format 📧", 3000);
            break;
          case "password":
            companion.showThought("Password needs work 🔐", 3000);
            break;
          case "confirmPassword":
            companion.showThought("Passwords must match! 🔄", 3000);
            break;
          default:
            companion.showThought("Let's fix this... 📝", 3000);
        }
      }
    }, [props.error, companion, fieldName]);

    return (
      <Input
        ref={inputRef}
        {...props}
        onFocus={handleFocus}
        onChange={handleChange}
        onBlur={handleBlur}
      />
    );
  },
);

CompanionInput.displayName = "CompanionInput";

export default CompanionInput;
