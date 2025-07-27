// Enhanced version of useAuthShihTzu with improved positioning and reduced floating
import { useEffect, useCallback, useRef, useState } from "react";
import { useShihTzuCompanion } from "./useShihTzuCompanion";

type CompanionState =
  | "idle"
  | "focused"
  | "typing"
  | "validating"
  | "error"
  | "success";
type EnhancedMood =
  | "idle"
  | "happy"
  | "sleeping"
  | "curious"
  | "walking"
  | "excited"
  | "playful"
  | "zen"
  | "proud"
  | "concerned"
  | "celebrating"
  | "encouraging"
  | "protective";

interface CompanionPersonality {
  traits: {
    happiness: number;
    energy: number;
    curiosity: number;
  };
  needs: {
    attention: number;
    rest: number;
    exercise: number;
  };
  bond: {
    level: number;
    interactions: number;
  };
}

interface ThoughtBubble {
  show: boolean;
  text: string;
}

export const useEnhancedAuthShihTzu = () => {
  // Calculate initial position based on viewport with proper companion sizing
  const getInitialPosition = () => {
    const isMobile = window.innerWidth < 640; // sm breakpoint
    const isTablet = window.innerWidth < 1024; // lg breakpoint

    // Companion size in pixels (including thought bubble space)
    const companionSize = isMobile ? 60 : 80;
    const thoughtBubbleHeight = 60; // Extra space for thought bubble
    const padding = 30; // Increased padding from screen edges

    if (isMobile) {
      // On mobile, position at bottom right to avoid content
      return {
        x: window.innerWidth - companionSize - padding,
        y: window.innerHeight - companionSize - padding - 100, // Above potential fixed footer
      };
    } else if (isTablet) {
      // On tablet, position to the right of form area with safe margins
      const formWidth = 448; // max-w-md = 28rem = 448px
      const formCenterX = window.innerWidth / 2;
      const rightEdge = formCenterX + formWidth / 2 + 80;

      return {
        x: Math.min(rightEdge, window.innerWidth - companionSize - padding),
        y: window.innerHeight / 2 - companionSize, // Centered vertically
      };
    } else {
      // On desktop, position to the right with dynamic vertical centering
      const formWidth = 448;
      const formCenterX = window.innerWidth / 2;
      const rightEdge = formCenterX + formWidth / 2 + 100;

      return {
        x: Math.min(rightEdge, window.innerWidth - companionSize - padding),
        y: Math.max(
          thoughtBubbleHeight + padding,
          window.innerHeight / 2 - companionSize,
        ),
      };
    }
  };

  const companion = useShihTzuCompanion({
    initialPosition: getInitialPosition(),
    idleTimeout: 15000, // Increased timeout for less movement
    enableAutoIdle: true,
  });

  // Enhanced state
  const [companionState, setCompanionState] = useState<CompanionState>("idle");
  const [currentField, setCurrentField] = useState<string | null>(null);
  const [personality, setPersonality] = useState<CompanionPersonality>({
    traits: { happiness: 75, energy: 60, curiosity: 70 },
    needs: { attention: 50, rest: 50, exercise: 50 },
    bond: { level: 1, interactions: 0 },
  });
  const [thoughtBubble, setThoughtBubble] = useState<ThoughtBubble>({
    show: false,
    text: "",
  });
  const [particleEffect, setParticleEffect] = useState<
    "hearts" | "sparkles" | "treats" | "zzz" | null
  >(null);
  const [accessories, setAccessories] = useState<string[]>([]);

  // Refs
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const moodTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const thoughtTimerRef = useRef<NodeJS.Timeout | null>(null);
  const particleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastPasswordStrength = useRef<"weak" | "medium" | "strong" | null>(
    null,
  );
  const hasGreeted = useRef(false);
  const isMovingToField = useRef(false);

  // Update position on window resize with debouncing
  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout;

    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        // Only reposition if companion is in default/idle position and not moving to a field
        if (
          companionState === "idle" &&
          !currentField &&
          !isMovingToField.current
        ) {
          const newPosition = getInitialPosition();
          companion.setPosition(newPosition);
        }
      }, 300); // Debounce resize events
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [companionState, currentField, companion]);

  // Show thought bubble
  const showThought = useCallback((text: string, duration = 3000) => {
    if (thoughtTimerRef.current) {
      clearTimeout(thoughtTimerRef.current);
    }

    setThoughtBubble({ show: true, text });

    thoughtTimerRef.current = setTimeout(() => {
      setThoughtBubble({ show: false, text: "" });
    }, duration);
  }, []);

  // Trigger particle effect
  const triggerParticleEffect = useCallback(
    (effect: "hearts" | "sparkles" | "treats" | "zzz") => {
      if (particleTimerRef.current) {
        clearTimeout(particleTimerRef.current);
      }

      setParticleEffect(effect);

      particleTimerRef.current = setTimeout(() => {
        setParticleEffect(null);
      }, 3000);
    },
    [],
  );

  // Enhanced greet with subtle animation
  useEffect(() => {
    if (!hasGreeted.current) {
      hasGreeted.current = true;
      const greetTimeout = setTimeout(() => {
        companion.setMood("excited" as Parameters<typeof companion.setMood>[0]);
        showThought("Welcome! Let's get started 👋", 3500);
        triggerParticleEffect("sparkles");

        setTimeout(() => {
          companion.setMood("idle");
        }, 3000);
      }, 800);

      return () => clearTimeout(greetTimeout);
    }
  }, [companion, showThought, triggerParticleEffect]);

  // Update personality needs over time (less frequently)
  useEffect(() => {
    const interval = setInterval(() => {
      setPersonality((prev) => ({
        ...prev,
        needs: {
          attention: Math.max(0, prev.needs.attention - 1),
          rest: Math.min(
            100,
            prev.needs.rest + (companion.mood === "sleeping" ? 3 : -0.5),
          ),
          exercise: Math.max(0, prev.needs.exercise - 0.5),
        },
      }));
    }, 60000); // Every minute (doubled from 30s)

    return () => clearInterval(interval);
  }, [companion.mood]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (moodTimeoutRef.current) clearTimeout(moodTimeoutRef.current);
      if (thoughtTimerRef.current) clearTimeout(thoughtTimerRef.current);
      if (particleTimerRef.current) clearTimeout(particleTimerRef.current);
    };
  }, []);

  // Enhanced input focus with improved positioning
  const handleInputFocus = useCallback(
    (inputElement: HTMLInputElement | HTMLElement) => {
      const fieldName =
        inputElement.getAttribute("name") ||
        inputElement.getAttribute("id") ||
        "field";
      setCurrentField(fieldName);
      setCompanionState("focused");
      isMovingToField.current = true;

      // Use appropriate positioning based on screen size
      const isMobile = window.innerWidth < 640;
      const placement = isMobile ? "above" : "right";

      companion.moveToElement(inputElement, placement);

      // Field-specific thoughts
      if (fieldName === "email") {
        showThought("Your email address 📧", 2500);
        companion.setMood("curious");
      } else if (fieldName === "password") {
        showThought("Keep it secure 🔒", 2500);
        companion.setMood(
          "protective" as Parameters<typeof companion.setMood>[0],
        );
      }

      // Update personality
      setPersonality((prev) => ({
        ...prev,
        bond: { ...prev.bond, interactions: prev.bond.interactions + 1 },
      }));

      // Reset moving flag after animation
      setTimeout(() => {
        isMovingToField.current = false;
      }, 1500);
    },
    [companion, showThought],
  );

  // Enhanced typing with less frequent encouragements
  const handleTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (companionState !== "error" && companionState !== "success") {
      setCompanionState("typing");

      // Reduced chance of encouragements
      if (Math.random() < 0.05) {
        // 5% chance (reduced from 10%)
        const encouragements = [
          "You're doing great! 💪",
          "Almost there! ⭐",
          "Looking good! 👍",
        ];
        showThought(
          encouragements[Math.floor(Math.random() * encouragements.length)],
          1500,
        );
      }
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (companionState === "typing") {
        setCompanionState("idle");
        companion.setMood("idle");
      }
    }, 2000); // Increased delay
  }, [companion, companionState, showThought]);

  // Enhanced error without excessive shaking
  const handleError = useCallback(() => {
    setCompanionState("error");
    companion.setMood("concerned" as Parameters<typeof companion.setMood>[0]);
    showThought("Let's try again 🤝", 3000);

    // Subtle head shake only (no position movement)
    // The concerned mood already has a head tilt animation

    // Update personality
    setPersonality((prev) => ({
      ...prev,
      traits: {
        ...prev.traits,
        happiness: Math.max(0, prev.traits.happiness - 5),
      },
    }));

    moodTimeoutRef.current = setTimeout(() => {
      setCompanionState("idle");
      companion.setMood("idle");
    }, 3000);
  }, [companion, showThought]);

  // Enhanced success celebration with controlled positioning
  const handleSuccess = useCallback(() => {
    setCompanionState("success");
    companion.setMood("celebrating" as Parameters<typeof companion.setMood>[0]);
    setAccessories(["party-hat"]);

    showThought("Welcome aboard! 🎊", 4000);
    triggerParticleEffect("sparkles");

    // Move to center-top area (less intrusive)
    const isMobile = window.innerWidth < 640;
    const companionSize = isMobile ? 60 : 80;

    companion.setPosition({
      x: window.innerWidth / 2 - companionSize / 2,
      y: isMobile ? 100 : 150,
    });

    // Update personality
    setPersonality((prev) => ({
      ...prev,
      traits: { ...prev.traits, happiness: 100 },
      bond: {
        ...prev.bond,
        level: Math.min(10, prev.bond.level + 0.1),
        interactions: prev.bond.interactions + 5,
      },
    }));

    // Celebration sequence
    setTimeout(() => {
      triggerParticleEffect("hearts");
    }, 1000);

    setTimeout(() => {
      setAccessories([]);
      // Return to default position after celebration
      const defaultPosition = getInitialPosition();
      companion.setPosition(defaultPosition);
    }, 5000);
  }, [companion, showThought, triggerParticleEffect]);

  // Enhanced loading with minimal movement
  const handleLoading = useCallback(() => {
    setCompanionState("validating");
    companion.setMood("curious"); // Changed from walking to reduce movement
    showThought("Checking... 🔍", 2000);

    // No pacing animation - just mood change
  }, [companion, showThought]);

  // Enhanced password strength feedback
  const handlePasswordStrength = useCallback(
    (strength: "weak" | "medium" | "strong") => {
      if (
        lastPasswordStrength.current !== strength &&
        companionState !== "error" &&
        companionState !== "success"
      ) {
        lastPasswordStrength.current = strength;

        switch (strength) {
          case "weak":
            companion.setMood(
              "concerned" as Parameters<typeof companion.setMood>[0],
            );
            showThought("Add more characters 💪", 2000);
            break;
          case "medium":
            companion.setMood("curious");
            showThought("Getting better! 🔐", 2000);
            triggerParticleEffect("sparkles");
            break;
          case "strong":
            companion.setMood(
              "proud" as Parameters<typeof companion.setMood>[0],
            );
            showThought("Strong password! 🛡️", 2000);
            triggerParticleEffect("hearts");
            // Update personality for achievement
            setPersonality((prev) => ({
              ...prev,
              bond: { ...prev.bond, interactions: prev.bond.interactions + 2 },
            }));
            break;
        }
      }
    },
    [companion, companionState, showThought, triggerParticleEffect],
  );

  // Enhanced field completion without excessive movement
  const handleFieldComplete = useCallback(() => {
    if (companionState !== "error" && companionState !== "success") {
      companion.setMood("happy");
      triggerParticleEffect("sparkles");

      // No position animation - just mood and particles

      // Personality update
      setPersonality((prev) => ({
        ...prev,
        needs: {
          ...prev.needs,
          attention: Math.min(100, prev.needs.attention + 10),
        },
      }));

      moodTimeoutRef.current = setTimeout(() => {
        companion.setMood("idle");
      }, 1500);
    }
  }, [companion, companionState, triggerParticleEffect]);

  // Enhanced specific error handling with minimal animations
  const handleSpecificError = useCallback(
    (errorType: "network" | "unauthorized" | "rate-limit" | "server") => {
      setCompanionState("error");

      switch (errorType) {
        case "network":
          companion.setMood("sleeping");
          showThought("Connection lost... 😴", 4000);
          triggerParticleEffect("zzz");
          break;
        case "unauthorized":
          companion.setMood(
            "concerned" as Parameters<typeof companion.setMood>[0],
          );
          showThought("Check your details 🤔", 3000);
          break;
        case "rate-limit":
          companion.setMood("zen" as Parameters<typeof companion.setMood>[0]);
          showThought("Let's take a break ⏱️", 5000);
          // No dizzy animation - zen mode is calmer
          break;
        case "server":
          companion.setMood("curious");
          showThought("Technical difficulties 🔧", 4000);
          break;
      }

      moodTimeoutRef.current = setTimeout(() => {
        setCompanionState("idle");
        companion.setMood("idle");
      }, 5000);
    },
    [companion, showThought, triggerParticleEffect],
  );

  const handleInputBlur = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (companionState === "typing" || companionState === "focused") {
      setCompanionState("idle");
      companion.setMood("idle");

      // Return to default position after a delay
      setTimeout(() => {
        if (!currentField && !isMovingToField.current) {
          const defaultPosition = getInitialPosition();
          companion.setPosition(defaultPosition);
        }
      }, 3000); // Increased delay
    }

    setCurrentField(null);
  }, [companion, companionState, currentField]);

  // Interactive features
  const pet = useCallback(() => {
    companion.setMood("happy");
    triggerParticleEffect("hearts");
    showThought("Thanks! 🥰", 2000);

    // Update personality
    setPersonality((prev) => ({
      ...prev,
      traits: {
        ...prev.traits,
        happiness: Math.min(100, prev.traits.happiness + 10),
      },
      needs: {
        ...prev.needs,
        attention: Math.min(100, prev.needs.attention + 20),
      },
      bond: { ...prev.bond, interactions: prev.bond.interactions + 1 },
    }));
  }, [companion, showThought, triggerParticleEffect]);

  const celebrate = useCallback(() => {
    companion.setMood("celebrating" as Parameters<typeof companion.setMood>[0]);
    triggerParticleEffect("sparkles");
    showThought("Yay! 🎉", 2000);

    // No jump animation - just mood and effects
  }, [companion, showThought, triggerParticleEffect]);

  const encourage = useCallback(() => {
    companion.setMood("happy"); // Changed from 'encouraging' to use existing mood
    showThought("You got this! 💪", 3000);
    triggerParticleEffect("sparkles");
  }, [companion, showThought, triggerParticleEffect]);

  // Override moveToElement for better positioning
  const moveToElement = useCallback(
    (
      element: HTMLElement,
      placement?: "above" | "below" | "left" | "right",
    ) => {
      const rect = element.getBoundingClientRect();
      const isMobile = window.innerWidth < 640;
      const companionSize = isMobile ? 60 : 80;
      const thoughtBubbleHeight = 60;
      const offset = isMobile ? 20 : 35; // Larger offset to prevent overlap

      let x: number;
      let y: number;

      // Smart placement based on available space
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceLeft = rect.left;
      const spaceRight = window.innerWidth - rect.right;

      // Determine best placement if not specified
      if (!placement) {
        if (isMobile) {
          // On mobile, prefer above/below to save horizontal space
          placement =
            spaceAbove > spaceBelow + thoughtBubbleHeight ? "above" : "below";
        } else {
          // On desktop, prefer sides but check available space
          if (spaceRight >= companionSize + offset + 20) {
            placement = "right";
          } else if (spaceLeft >= companionSize + offset + 20) {
            placement = "left";
          } else {
            placement =
              spaceAbove > spaceBelow + thoughtBubbleHeight ? "above" : "below";
          }
        }
      }

      // Calculate position based on placement
      switch (placement) {
        case "above":
          x = rect.left + rect.width / 2 - companionSize / 2;
          y = rect.top - companionSize - offset - thoughtBubbleHeight;
          // Ensure enough space for thought bubble
          if (y < thoughtBubbleHeight + 20) {
            // Not enough space above, switch to below
            y = rect.bottom + offset;
            placement = "below";
          }
          break;

        case "below":
          x = rect.left + rect.width / 2 - companionSize / 2;
          y = rect.bottom + offset;
          // Check if it goes off bottom
          if (y + companionSize > window.innerHeight - 20) {
            y = window.innerHeight - companionSize - 20;
          }
          break;

        case "left":
          x = rect.left - companionSize - offset;
          y = rect.top + rect.height / 2 - companionSize / 2;
          if (x < 20) {
            // Not enough space on left, switch to right
            x = rect.right + offset;
            placement = "right";
          }
          break;

        case "right":
        default:
          x = rect.right + offset;
          y = rect.top + rect.height / 2 - companionSize / 2;
          if (x + companionSize > window.innerWidth - 20) {
            // Not enough space on right, try left
            x = rect.left - companionSize - offset;
            if (x < 20) {
              // No space on sides, go above
              x = rect.left + rect.width / 2 - companionSize / 2;
              y = rect.top - companionSize - offset - thoughtBubbleHeight;
              placement = "above";
            }
          }
          break;
      }

      // Final bounds check with thought bubble consideration
      x = Math.max(20, Math.min(x, window.innerWidth - companionSize - 20));
      y = Math.max(
        thoughtBubbleHeight + 20,
        Math.min(y, window.innerHeight - companionSize - 20),
      );

      companion.setPosition({ x, y });

      // Subtle walking animation
      if (companion.mood !== "happy" && companion.mood !== "curious") {
        companion.setMood("walking");
        setTimeout(() => {
          companion.setMood("idle");
        }, 1000);
      }
    },
    [companion],
  );

  return {
    ...companion,
    moveToElement, // Override with our custom implementation
    handleInputFocus,
    handleInputBlur,
    handleTyping,
    handleError,
    handleSuccess,
    handleLoading,
    handlePasswordStrength,
    handleFieldComplete,
    handleSpecificError,
    companionState,
    currentField,
    // Enhanced features
    personality,
    thoughtBubble,
    particleEffect,
    accessories,
    showThought,
    triggerParticleEffect,
    pet,
    celebrate,
    encourage,
    mood: companion.mood as EnhancedMood,
  };
};
