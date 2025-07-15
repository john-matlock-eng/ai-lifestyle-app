// Enhanced theme configuration for journal reader
// Place this in your theme configuration file

import { useState, useEffect, useCallback } from 'react';

export const readerThemes = {
  dark: {
    name: 'Dark',
    background: '#0a0a0a',
    surface: '#1a1a1a',
    surfaceMuted: '#2a2a2a',
    text: {
      primary: '#e5e5e5',
      secondary: '#a3a3a3',
      muted: '#737373',
      accent: '#60a5fa'
    },
    glass: {
      background: 'rgba(0, 0, 0, 0.5)',
      border: 'rgba(255, 255, 255, 0.1)',
      blur: 'backdrop-blur-md'
    },
    prose: {
      body: '#e5e5e5',
      headings: '#ffffff',
      lead: '#d4d4d4',
      links: '#60a5fa',
      bold: '#ffffff',
      counters: '#a3a3a3',
      bullets: '#737373',
      hr: '#404040',
      quotes: '#d4d4d4',
      quoteBorders: '#60a5fa',
      captions: '#a3a3a3',
      code: '#ffffff',
      preCode: '#e5e5e5',
      preBg: '#1a1a1a',
      thBorders: '#525252',
      tdBorders: '#404040'
    }
  },
  light: {
    name: 'Light',
    background: '#ffffff',
    surface: '#f9fafb',
    surfaceMuted: '#f3f4f6',
    text: {
      primary: '#111827',
      secondary: '#4b5563',
      muted: '#6b7280',
      accent: '#2563eb'
    },
    glass: {
      background: 'rgba(255, 255, 255, 0.8)',
      border: 'rgba(0, 0, 0, 0.1)',
      blur: 'backdrop-blur-sm'
    },
    prose: {
      body: '#374151',
      headings: '#111827',
      lead: '#4b5563',
      links: '#2563eb',
      bold: '#111827',
      counters: '#6b7280',
      bullets: '#9ca3af',
      hr: '#e5e7eb',
      quotes: '#4b5563',
      quoteBorders: '#d1d5db',
      captions: '#6b7280',
      code: '#111827',
      preCode: '#e5e7eb',
      preBg: '#1f2937',
      thBorders: '#d1d5db',
      tdBorders: '#e5e7eb'
    }
  },
  sepia: {
    name: 'Sepia',
    background: '#f4ecd8',
    surface: '#ede4d0',
    surfaceMuted: '#e6dcc0',
    text: {
      primary: '#5c4b37',
      secondary: '#6d5a48',
      muted: '#8b7355',
      accent: '#8b6914'
    },
    glass: {
      background: 'rgba(244, 236, 216, 0.9)',
      border: 'rgba(92, 75, 55, 0.2)',
      blur: 'backdrop-blur-sm'
    },
    prose: {
      body: '#5c4b37',
      headings: '#4a3929',
      lead: '#6d5a48',
      links: '#8b6914',
      bold: '#4a3929',
      counters: '#8b7355',
      bullets: '#a68b6f',
      hr: '#d4c4aa',
      quotes: '#6d5a48',
      quoteBorders: '#c4b5a0',
      captions: '#8b7355',
      code: '#4a3929',
      preCode: '#ede4d0',
      preBg: '#3a2f23',
      thBorders: '#c4b5a0',
      tdBorders: '#d4c4aa'
    }
  }
};

// Utility function to apply theme
export const applyReaderTheme = (theme: keyof typeof readerThemes) => {
  const selectedTheme = readerThemes[theme];
  const root = document.documentElement;
  
  // Apply CSS variables
  root.style.setProperty('--reader-bg', selectedTheme.background);
  root.style.setProperty('--reader-surface', selectedTheme.surface);
  root.style.setProperty('--reader-surface-muted', selectedTheme.surfaceMuted);
  root.style.setProperty('--reader-text-primary', selectedTheme.text.primary);
  root.style.setProperty('--reader-text-secondary', selectedTheme.text.secondary);
  root.style.setProperty('--reader-text-muted', selectedTheme.text.muted);
  root.style.setProperty('--reader-text-accent', selectedTheme.text.accent);
  
  // Apply prose colors
  Object.entries(selectedTheme.prose).forEach(([key, value]) => {
    root.style.setProperty(`--reader-prose-${key}`, value);
  });
  
  return selectedTheme;
};

// Enhanced Tailwind config for reader mode
export const readerTailwindConfig = {
  extend: {
    colors: {
      reader: {
        bg: 'var(--reader-bg)',
        surface: 'var(--reader-surface)',
        'surface-muted': 'var(--reader-surface-muted)',
        text: {
          primary: 'var(--reader-text-primary)',
          secondary: 'var(--reader-text-secondary)',
          muted: 'var(--reader-text-muted)',
          accent: 'var(--reader-text-accent)'
        }
      }
    },
    typography: () => ({
      reader: {
        css: {
          '--tw-prose-body': 'var(--reader-prose-body)',
          '--tw-prose-headings': 'var(--reader-prose-headings)',
          '--tw-prose-lead': 'var(--reader-prose-lead)',
          '--tw-prose-links': 'var(--reader-prose-links)',
          '--tw-prose-bold': 'var(--reader-prose-bold)',
          '--tw-prose-counters': 'var(--reader-prose-counters)',
          '--tw-prose-bullets': 'var(--reader-prose-bullets)',
          '--tw-prose-hr': 'var(--reader-prose-hr)',
          '--tw-prose-quotes': 'var(--reader-prose-quotes)',
          '--tw-prose-quote-borders': 'var(--reader-prose-quoteBorders)',
          '--tw-prose-captions': 'var(--reader-prose-captions)',
          '--tw-prose-code': 'var(--reader-prose-code)',
          '--tw-prose-pre-code': 'var(--reader-prose-preCode)',
          '--tw-prose-pre-bg': 'var(--reader-prose-preBg)',
          '--tw-prose-th-borders': 'var(--reader-prose-thBorders)',
          '--tw-prose-td-borders': 'var(--reader-prose-tdBorders)',
        }
      }
    })
  }
};

// Hook for managing reader theme
export const useReaderTheme = () => {
  const [currentTheme, setCurrentTheme] = useState<keyof typeof readerThemes>('dark');
  
  const changeTheme = useCallback((theme: keyof typeof readerThemes) => {
    setCurrentTheme(theme);
    applyReaderTheme(theme);
    
    // Save preference
    localStorage.setItem('journal-reader-theme', theme);
  }, []);
  
  // Load saved preference on mount
  useEffect(() => {
    const saved = localStorage.getItem('journal-reader-theme') as keyof typeof readerThemes;
    if (saved && readerThemes[saved]) {
      changeTheme(saved);
    }
  }, [changeTheme]);
  
  return {
    currentTheme,
    changeTheme,
    themes: readerThemes
  };
};