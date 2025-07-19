import React from "react";
import { useTheme } from "../contexts/useTheme";
import type { Theme } from "../contexts/ThemeContextType";

interface ThemeOption {
  value: Theme;
  label: string;
  description: string;
  preview: {
    bg: string;
    accent: string;
    surface: string;
  };
}

const themes: ThemeOption[] = [
  {
    value: "dark",
    label: "Dark",
    description: "Modern dark theme with blue accents",
    preview: {
      bg: "#0A0E1A",
      accent: "#60A5FA",
      surface: "#1A1F2E",
    },
  },
  {
    value: "light",
    label: "Light",
    description: "Clean and professional",
    preview: {
      bg: "#FFFFFF",
      accent: "#3B82F6",
      surface: "#F8FAFC",
    },
  },
  {
    value: "serene",
    label: "Serene",
    description: "Calm and natural green tones",
    preview: {
      bg: "#E6F4F1",
      accent: "#10B981",
      surface: "#FFFFFF",
    },
  },
  {
    value: "vibrant",
    label: "Vibrant",
    description: "Bold and energetic with neon accents",
    preview: {
      bg: "#0A0F1C",
      accent: "#FF006E",
      surface: "#1A1F2E",
    },
  },
  {
    value: "midnight",
    label: "Midnight",
    description: "Deep ocean blues with cyan highlights",
    preview: {
      bg: "#000814",
      accent: "#00B4D8",
      surface: "#001D3D",
    },
  },
  {
    value: "solarized",
    label: "Solarized",
    description: "Warm and comfortable amber tones",
    preview: {
      bg: "#FDF6E3",
      accent: "#B58900",
      surface: "#EEE8D5",
    },
  },
];

const ThemeSelector: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface-hover rounded-lg transition-all duration-200 hover:shadow-md"
        aria-label="Select theme"
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-accent animate-pulse-glow" />
          <span className="text-sm font-medium text-theme">
            {themes.find((t) => t.value === theme)?.label}
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-surface rounded-xl shadow-lg border border-surface-muted overflow-hidden z-20 glass">
            <div className="p-2">
              {themes.map((themeOption) => (
                <button
                  key={themeOption.value}
                  onClick={() => {
                    setTheme(themeOption.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-3 rounded-lg transition-all duration-200 hover:bg-surface-hover group ${
                    theme === themeOption.value ? "bg-button-hover-bg" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex gap-1 mt-1">
                      <div
                        className="w-4 h-4 rounded-full border-2 border-surface-muted"
                        style={{ backgroundColor: themeOption.preview.bg }}
                      />
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: themeOption.preview.accent }}
                      />
                      <div
                        className="w-4 h-4 rounded-full border-2 border-surface-muted"
                        style={{ backgroundColor: themeOption.preview.surface }}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-theme group-hover:text-accent transition-colors">
                          {themeOption.label}
                        </span>
                        {theme === themeOption.value && (
                          <svg
                            className="w-4 h-4 text-accent"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                      <p className="text-xs text-muted mt-0.5">
                        {themeOption.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ThemeSelector;
