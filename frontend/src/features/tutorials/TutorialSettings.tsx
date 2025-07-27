import React from "react";
import { useTutorialManager } from "./useTutorialManager";
import Button from "../../components/common/Button";
import { CheckCircle, XCircle, RefreshCw, Eye, EyeOff } from "lucide-react";
import { clsx } from "clsx";

export const TutorialSettings: React.FC = () => {
  const {
    tutorialPrefs,
    isLoading,
    enableTutorials,
    disableTutorials,
    resetTutorials,
    getProgress,
  } = useTutorialManager();

  const progress = getProgress();

  const handleToggleTutorials = async () => {
    if (tutorialPrefs.enabled) {
      await disableTutorials();
    } else {
      await enableTutorials();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-theme">
            Tutorial Preferences
          </h3>
          <p className="text-sm text-muted mt-1">
            Manage your onboarding experience
          </p>
        </div>
        <button
          onClick={handleToggleTutorials}
          disabled={isLoading}
          className={clsx(
            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
            tutorialPrefs.enabled
              ? "bg-accent"
              : "bg-surface-muted",
            isLoading && "opacity-50 cursor-not-allowed"
          )}
        >
          <span
            className={clsx(
              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
              tutorialPrefs.enabled ? "translate-x-6" : "translate-x-1"
            )}
          />
          <span className="sr-only">
            {tutorialPrefs.enabled ? "Disable" : "Enable"} tutorials
          </span>
        </button>
      </div>

      {/* Progress Overview */}
      <div className="glass rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-theme">
            Tutorial Progress
          </span>
          <span className="text-sm text-muted">
            {progress.progressPercentage}% Complete
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full h-2 bg-surface-muted rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-gradient-to-r from-accent to-success rounded-full transition-all duration-500"
            style={{ width: `${progress.progressPercentage}%` }}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-semibold text-theme">
              {progress.completedCount}
            </div>
            <div className="text-xs text-muted flex items-center justify-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Completed
            </div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-theme">
              {progress.skippedCount}
            </div>
            <div className="text-xs text-muted flex items-center justify-center gap-1">
              <XCircle className="w-3 h-3" />
              Skipped
            </div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-theme">
              {progress.totalSteps - progress.doneCount}
            </div>
            <div className="text-xs text-muted">Remaining</div>
          </div>
        </div>
      </div>

      {/* Tutorial Status */}
      <div className="glass rounded-lg p-4">
        <div className="flex items-center gap-3 mb-4">
          {tutorialPrefs.enabled ? (
            <>
              <Eye className="w-5 h-5 text-success" />
              <div className="flex-1">
                <p className="text-sm font-medium text-theme">
                  Tutorials Enabled
                </p>
                <p className="text-xs text-muted">
                  You'll see helpful tips as you explore new features
                </p>
              </div>
            </>
          ) : (
            <>
              <EyeOff className="w-5 h-5 text-muted" />
              <div className="flex-1">
                <p className="text-sm font-medium text-theme">
                  Tutorials Disabled
                </p>
                <p className="text-xs text-muted">
                  You won't see onboarding tips for new features
                </p>
              </div>
            </>
          )}
        </div>

        {/* Last shown info */}
        {tutorialPrefs.lastShownStep && (
          <div className="text-xs text-muted border-t border-surface-muted pt-3">
            Last tutorial shown:{" "}
            <span className="font-medium">{tutorialPrefs.lastShownStep}</span>
            {tutorialPrefs.lastShownAt && (
              <span className="block">
                on {new Date(tutorialPrefs.lastShownAt).toLocaleDateString()}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {/* Reset Progress */}
        {progress.doneCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetTutorials}
            disabled={isLoading}
            fullWidth
            className="justify-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset Tutorial Progress
          </Button>
        )}

        {/* Info */}
        <div className="text-xs text-muted text-center">
          {progress.isComplete ? (
            <p>
              🎉 You've completed all tutorials! Reset to see them again.
            </p>
          ) : tutorialPrefs.enabled ? (
            <p>
              Tutorials will appear automatically as you discover new features.
            </p>
          ) : (
            <p>
              Enable tutorials to get helpful guidance for new features.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TutorialSettings;
