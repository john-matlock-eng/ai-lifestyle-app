import type { Theme } from "../contexts/ThemeContextType";

// Centralized theme configuration
export interface ThemeOption {
  value: Theme;
  label: string;
  icon: string;
  description?: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    value: "balloon",
    label: "Balloon",
    icon: "🎈",
    description: "Festive and colorful theme",
  },
  {
    value: "light",
    label: "Light",
    icon: "☀️",
    description: "Clean and bright theme",
  },
  {
    value: "dark",
    label: "Dark",
    icon: "🌙",
    description: "Easy on the eyes for night use",
  },
  {
    value: "serene",
    label: "Serene",
    icon: "🌿",
    description: "Calm and peaceful colors",
  },
  {
    value: "vibrant",
    label: "Vibrant",
    icon: "🎨",
    description: "Bold and energetic colors",
  },
  {
    value: "midnight",
    label: "Midnight",
    icon: "🌌",
    description: "Deep blues and purples",
  },
  {
    value: "solarized",
    label: "Solarized",
    icon: "🌅",
    description: "Classic solarized color scheme",
  },
];

// Helper function to get theme option by value
export const getThemeOption = (value: Theme): ThemeOption | undefined => {
  return THEME_OPTIONS.find((option) => option.value === value);
};

// Helper function to get theme label
export const getThemeLabel = (value: Theme): string => {
  return getThemeOption(value)?.label || value;
};

// Helper function to get theme icon
export const getThemeIcon = (value: Theme): string => {
  return getThemeOption(value)?.icon || "";
};
