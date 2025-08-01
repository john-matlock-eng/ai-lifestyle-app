import React, { useState } from "react";
import {
  Shield,
  Lock,
  Key,
  ArrowRight,
  Check,
  AlertTriangle,
} from "lucide-react";

interface EncryptionOnboardingProps {
  onComplete: (settings: OnboardingSettings) => void;
  onSkip?: () => void;
  showSkip?: boolean;
}

export interface OnboardingSettings {
  enableEncryption: boolean;
  createBackup: boolean;
  modules: string[];
}

const steps = [
  {
    id: "intro",
    title: "Welcome to Encryption",
    icon: Shield,
  },
  {
    id: "setup",
    title: "Choose Your Settings",
    icon: Lock,
  },
  {
    id: "backup",
    title: "Backup Your Key",
    icon: Key,
  },
];

const availableModules = [
  {
    id: "journal",
    name: "Journal Entries",
    description: "Personal thoughts and reflections",
  },
  {
    id: "health",
    name: "Health Records",
    description: "Medical information and vitals",
  },
  {
    id: "finance",
    name: "Financial Data",
    description: "Transactions and budgets",
  },
  {
    id: "wellness",
    name: "Wellness Tracking",
    description: "Mental health and habits",
  },
];

export const EncryptionOnboarding: React.FC<EncryptionOnboardingProps> = ({
  onComplete,
  onSkip,
  showSkip = true,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [settings, setSettings] = useState<OnboardingSettings>({
    enableEncryption: true,
    createBackup: true,
    modules: ["journal", "health"], // Default selections
  });

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(settings);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const toggleModule = (moduleId: string) => {
    setSettings((prev) => ({
      ...prev,
      modules: prev.modules.includes(moduleId)
        ? prev.modules.filter((id) => id !== moduleId)
        : [...prev.modules, moduleId],
    }));
  };

  const CurrentIcon = steps[currentStep].icon;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center ${index < steps.length - 1 ? "flex-1" : ""}`}
              >
                <div
                  className={`
                    flex items-center justify-center w-10 h-10 rounded-full
                    ${
                      index <= currentStep
                        ? "bg-[var(--accent)] text-white"
                        : "bg-[var(--surface-muted)] text-[var(--text-muted)]"
                    }
                  `}
                >
                  {index < currentStep ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      index < currentStep
                        ? "bg-[var(--accent)]"
                        : "bg-[var(--surface-muted)]"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm">
            {steps.map((step) => (
              <span key={step.id} className="text-[var(--text-muted)]">
                {step.title}
              </span>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-[var(--surface)] rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-[var(--accent-bg)] rounded-full flex items-center justify-center mb-4">
              <CurrentIcon className="h-8 w-8 text-[var(--accent)]" />
            </div>
            <h2 className="text-2xl font-bold text-[var(--text)] mb-2">
              {steps[currentStep].title}
            </h2>
          </div>

          {/* Step content */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div className="text-center space-y-4">
                <p className="text-[var(--text-muted)]">
                  Protect your personal data with end-to-end encryption. Only
                  you can decrypt your information.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="bg-[var(--accent-bg)] rounded-lg p-4">
                  <Shield className="h-8 w-8 text-[var(--accent)] mb-2" />
                  <h3 className="font-semibold text-[var(--text)] mb-1">
                    Private & Secure
                  </h3>
                  <p className="text-sm text-[var(--text-muted)]">
                    Your data is encrypted locally before storage
                  </p>
                </div>
                <div className="bg-[var(--accent-bg)] rounded-lg p-4">
                  <Lock className="h-8 w-8 text-[var(--accent)] mb-2" />
                  <h3 className="font-semibold text-[var(--text)] mb-1">
                    You Control Access
                  </h3>
                  <p className="text-sm text-[var(--text-muted)]">
                    Share specific data temporarily when needed
                  </p>
                </div>
                <div className="bg-[var(--accent-bg)] rounded-lg p-4">
                  <Key className="h-8 w-8 text-[var(--accent)] mb-2" />
                  <h3 className="font-semibold text-[var(--text)] mb-1">
                    Backup Available
                  </h3>
                  <p className="text-sm text-[var(--text-muted)]">
                    Secure key backup ensures you never lose access
                  </p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-[var(--text)] mb-4">
                  Choose what to encrypt
                </h3>
                <div className="space-y-3">
                  {availableModules.map((module) => (
                    <label
                      key={module.id}
                      className="flex items-start p-4 border border-[var(--surface-muted)] rounded-lg hover:bg-[var(--surface-muted)] cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={settings.modules.includes(module.id)}
                        onChange={() => toggleModule(module.id)}
                        className="h-5 w-5 text-[var(--accent)] rounded border-[var(--surface-muted)] mt-0.5"
                      />
                      <div className="ml-3 flex-1">
                        <div className="font-medium text-[var(--text)]">
                          {module.name}
                        </div>
                        <div className="text-sm text-[var(--text-muted)]">
                          {module.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-[var(--info-bg)] rounded-lg">
                <p className="text-sm text-[var(--info)]">
                  <strong>Tip:</strong> You can always change these settings
                  later. Start with the most sensitive data.
                </p>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="p-4 bg-[var(--warning-bg)] rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-[var(--warning)] mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-[var(--text)] mb-1">
                      Important: Backup your encryption key
                    </h3>
                    <p className="text-sm text-[var(--warning-text)]">
                      Without a backup, you could lose access to your encrypted
                      data if you forget your password or lose your device. We
                      strongly recommend creating a backup now.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="flex items-start p-4 border-2 border-[var(--accent)] bg-[var(--accent-bg)] rounded-lg">
                  <input
                    type="checkbox"
                    checked={settings.createBackup}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        createBackup: e.target.checked,
                      })
                    }
                    className="h-5 w-5 text-[var(--accent)] rounded border-[var(--surface-muted)] mt-0.5"
                  />
                  <div className="ml-3">
                    <div className="font-medium text-[var(--text)]">
                      Create a backup key (recommended)
                    </div>
                    <div className="text-sm text-[var(--text-muted)] mt-1">
                      You'll receive a recovery key to store in a safe place
                    </div>
                  </div>
                </label>

                {!settings.createBackup && (
                  <div className="p-4 bg-[var(--error-bg)] rounded-lg">
                    <p className="text-sm text-[var(--error)]">
                      <strong>Warning:</strong> Without a backup, you risk
                      permanent data loss. Are you sure you want to continue
                      without creating a backup?
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-8 flex items-center justify-between">
            <div>
              {currentStep > 0 && (
                <button
                  onClick={handleBack}
                  className="text-[var(--text-muted)] hover:text-[var(--text)]"
                >
                  Back
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {showSkip && currentStep === 0 && onSkip && (
                <button
                  onClick={onSkip}
                  className="px-4 py-2 text-[var(--text-muted)] hover:text-[var(--text)]"
                >
                  Skip for now
                </button>
              )}

              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg)] transition-colors"
              >
                {currentStep === steps.length - 1
                  ? "Complete Setup"
                  : "Continue"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
