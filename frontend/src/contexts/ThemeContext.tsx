import React, { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { ThemeContext } from './ThemeContextType';
import type { Theme } from './ThemeContextType';

interface ThemeProviderProps {
  children: ReactNode;
}

const THEME_KEY = 'theme-preference';
const themes: Theme[] = [
  'light',
  'dark',
  'serene',
  'vibrant',
  'midnight',
  'solarized',
];

const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem(THEME_KEY) as Theme) || 'dark'
  );

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark', 'serene', 'vibrant', 'midnight', 'solarized');
    root.classList.add(theme);
    root.classList.toggle('dark', theme === 'dark');
    root.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    if (themes.includes(newTheme)) {
      setThemeState(newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
