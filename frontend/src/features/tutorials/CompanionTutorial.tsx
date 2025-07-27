import React, { useEffect, useState } from "react";
import { useTutorialManager } from "./useTutorialManager";
import type { useEnhancedAuthShihTzu } from "../../hooks/useEnhancedAuthShihTzu";
import Button from "../../components/common/Button";
import { ChevronRight, EyeOff } from "lucide-react";

interface CompanionTutorialProps {
  companion?: ReturnType<typeof useEnhancedAuthShihTzu>;
  pageId?: string;
}

export const CompanionTutorial: React.FC<CompanionTutorialProps> = ({
  companion,
  pageId,
}) => {
  const {
    tutorialState,
    tutorialPrefs,
    completeTutorial,
    skipTutorial,
    disableTutorials,
    checkPageTutorials,
    getProgress,
  } = useTutorialManager();

  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  // Check for page-specific tutorials on mount
  useEffect(() => {
    if (pageId && tutorialPrefs.enabled) {
      // Small delay to let page render
      const timer = setTimeout(() => {
        checkPageTutorials(pageId);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [pageId, tutorialPrefs.enabled, checkPageTutorials]);

  // Handle companion reactions to tutorial state
  useEffect(() => {
    if (!companion || !tutorialState.currentStep) return;

    if (tutorialState.isActive) {
      // Show companion thought for current tutorial
      companion.showThought(
        tutorialState.currentStep.companionThoughts.intro,
        tutorialState.currentStep.duration || 5000
      );

      // Set appropriate mood
      if (tutorialState.currentStep.id === "encryption_setup") {
        companion.setMood("protective" as Parameters<typeof companion.setMood>[0]);
      } else {
        companion.setMood("curious");
      }

      // Move companion to highlighted element if specified
      if (tutorialState.currentStep.targetElement) {
        const element = document.querySelector(
          tutorialState.currentStep.targetElement
        );
        if (element) {
          companion.moveToElement(
            element as HTMLElement,
            tutorialState.currentStep.placement
          );
        }
      }
    }
  }, [companion, tutorialState]);

  // Handle auto-progress countdown
  useEffect(() => {
    if (
      !tutorialState.currentStep?.autoProgressAfter ||
      !tutorialState.isActive
    ) {
      setTimeRemaining(null);
      return;
    }

    const endTime = Date.now() + tutorialState.currentStep.autoProgressAfter;
    
    const interval = setInterval(() => {
      const remaining = Math.max(0, endTime - Date.now());
      setTimeRemaining(Math.ceil(remaining / 1000));
      
      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [tutorialState]);

  // Handle tutorial completion
  const handleComplete = async () => {
    if (!tutorialState.currentStep || !companion) return;

    const stepId = tutorialState.currentStep.id;
    
    // Show success thought
    if (tutorialState.currentStep.companionThoughts.success) {
      companion.showThought(
        tutorialState.currentStep.companionThoughts.success,
        3000
      );
      companion.triggerParticleEffect("sparkles");
      companion.setMood("happy");
    }

    await completeTutorial(stepId);
  };

  // Handle tutorial skip
  const handleSkip = async () => {
    if (!tutorialState.currentStep || !companion) return;

    const stepId = tutorialState.currentStep.id;
    
    // Show skip thought
    if (tutorialState.currentStep.companionThoughts.skip) {
      companion.showThought(
        tutorialState.currentStep.companionThoughts.skip,
        2500
      );
      companion.setMood("idle");
    }

    await skipTutorial(stepId);
  };

  // Handle disabling tutorials
  const handleDisableTutorials = async () => {
    if (companion) {
      companion.showThought(
        "No problem! You can re-enable tutorials in settings anytime 👍",
        3000
      );
    }
    await disableTutorials();
    setShowDisableConfirm(false);
  };

  // Don't render if tutorials are disabled or no active tutorial
  if (!tutorialPrefs.enabled || !tutorialState.isActive || !tutorialState.currentStep) {
    return null;
  }

  const progress = getProgress();
  const isLastStep = progress.doneCount === progress.totalSteps - 1;

  return (
    <>
      {/* Tutorial Control Panel */}
      <div className="fixed bottom-4 right-4 z-40 max-w-sm">
        <div className="glass glass-hover rounded-xl p-4 shadow-lg">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-theme flex items-center gap-2">
                <span className="animate-pulse">✨</span>
                {tutorialState.currentStep.name}
              </h3>
              <p className="text-xs text-muted mt-1">
                Tutorial {progress.doneCount + 1} of {progress.totalSteps}
              </p>
            </div>
            <button
              onClick={() => setShowDisableConfirm(true)}
              className="text-muted hover:text-theme transition-colors p-1 rounded-lg hover:bg-surface-muted"
              title="Tutorial settings"
            >
              <EyeOff className="w-4 h-4" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-surface-muted rounded-full mb-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent to-success rounded-full transition-all duration-500"
              style={{ width: `${progress.progressPercentage}%` }}
            />
          </div>

          {/* Description */}
          <p className="text-sm text-theme mb-4">
            {tutorialState.currentStep.description}
          </p>

          {/* Auto-progress countdown */}
          {timeRemaining !== null && (
            <div className="text-xs text-muted mb-3 flex items-center gap-1">
              <span className="animate-pulse">⏱️</span>
              Auto-continuing in {timeRemaining}s...
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="flex-1"
            >
              Skip
            </Button>
            {tutorialState.currentStep.requiresAction ? (
              <Button
                variant="primary"
                size="sm"
                onClick={handleComplete}
                className="flex-1 shine-effect"
              >
                {isLastStep ? "Finish" : "Got it"}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={handleComplete}
                className="flex-1 shine-effect"
              >
                {isLastStep ? "Finish Tour" : "Next"}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Disable Confirmation Modal */}
      {showDisableConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="glass rounded-xl p-6 max-w-sm w-full animate-scale-in">
            <h3 className="text-lg font-semibold text-theme mb-2">
              Disable Tutorials?
            </h3>
            <p className="text-sm text-muted mb-4">
              You can always re-enable tutorials from your settings. Are you
              sure you want to turn them off?
            </p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDisableConfirm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleDisableTutorials}
                className="flex-1"
              >
                Disable
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Highlight overlay for target elements */}
      {tutorialState.currentStep.targetElement && (
        <TutorialHighlight selector={tutorialState.currentStep.targetElement} />
      )}
    </>
  );
};

// Component to highlight target elements
const TutorialHighlight: React.FC<{ selector: string }> = ({ selector }) => {
  const [bounds, setBounds] = useState<DOMRect | null>(null);

  useEffect(() => {
    const element = document.querySelector(selector);
    if (!element) return;

    const updateBounds = () => {
      setBounds(element.getBoundingClientRect());
    };

    updateBounds();
    
    // Update on scroll/resize
    window.addEventListener("scroll", updateBounds);
    window.addEventListener("resize", updateBounds);

    // Add highlight class
    element.classList.add("tutorial-highlight");

    return () => {
      window.removeEventListener("scroll", updateBounds);
      window.removeEventListener("resize", updateBounds);
      element.classList.remove("tutorial-highlight");
    };
  }, [selector]);

  if (!bounds) return null;

  return (
    <div
      className="fixed pointer-events-none z-30"
      style={{
        top: bounds.top - 8,
        left: bounds.left - 8,
        width: bounds.width + 16,
        height: bounds.height + 16,
      }}
    >
      <div className="absolute inset-0 rounded-lg ring-4 ring-accent ring-opacity-50 animate-pulse" />
      <div className="absolute inset-0 rounded-lg ring-2 ring-accent" />
    </div>
  );
};

export default CompanionTutorial;
