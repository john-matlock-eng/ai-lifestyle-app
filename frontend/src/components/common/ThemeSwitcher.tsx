import React from "react";
import { useTheme } from "../../contexts";
import type { Theme } from "../../contexts";

// Define all available themes with their display labels
const THEME_OPTIONS: Record<Theme, { label: string; emoji?: string }> = {
  balloon: { label: "Balloon", emoji: "🎈" },
  light: { label: "Light" },
  dark: { label: "Dark" },
  serene: { label: "Serene" },
  vibrant: { label: "Vibrant" },
  midnight: { label: "Midnight" },
  solarized: { label: "Solarized" },
};

// Generate options array from the theme definitions
const options = (Object.keys(THEME_OPTIONS) as Theme[]).map((value) => ({
  value,
  label: THEME_OPTIONS[value].label,
  emoji: THEME_OPTIONS[value].emoji,
}));

const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <select
      value={theme}
      onChange={(e) => setTheme(e.target.value as Theme)}
      className="border-[color:var(--surface-muted)] rounded-md text-sm"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.emoji ? `${opt.emoji} ${opt.label}` : opt.label}
        </option>
      ))}
    </select>
  );
};

export default ThemeSwitcher;