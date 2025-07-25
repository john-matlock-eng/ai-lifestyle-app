import { createContext } from "react";

export type Theme =
  | "light"
  | "dark"
  | "serene"
  | "vibrant"
  | "midnight"
  | "solarized";

export interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(
  undefined,
);
