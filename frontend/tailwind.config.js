/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e3f2fd',
          100: '#bbdefb',
          200: '#90caf9',
          300: '#64b5f6',
          400: '#42a5f5',
          500: '#2196f3',
          600: '#1e88e5',
          700: '#1976d2',
          800: '#1565c0',
          900: '#0d47a1',
        },
        error: {
          50: '#ffebee',
          100: '#ffcdd2',
          200: '#ef9a9a',
          300: '#e57373',
          400: '#ef5350',
          500: '#f44336',
          600: '#e53935',
          700: '#d32f2f',
          800: '#c62828',
          900: '#b71c1c',
        },
        success: {
          50: '#e8f5e9',
          100: '#c8e6c9',
          200: '#a5d6a7',
          300: '#81c784',
          400: '#66bb6a',
          500: '#4caf50',
          600: '#43a047',
          700: '#388e3c',
          800: '#2e7d32',
          900: '#1b5e20',
        },
        // Theme variables
        bg: 'var(--bg)',
        'bg-gradient': 'var(--bg-gradient)',
        text: 'var(--text)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        'text-disabled': 'var(--text-disabled)',
        surface: 'var(--surface)',
        'surface-hover': 'var(--surface-hover)',
        'surface-muted': 'var(--surface-muted)',
        'surface-glass': 'var(--surface-glass)',
        accent: 'var(--accent)',
        'accent-hover': 'var(--accent-hover)',
        'button-hover-bg': 'var(--button-hover-bg)',
        'button-active-bg': 'var(--button-active-bg)',
        'success-theme': 'var(--success)',
        'success-bg': 'var(--success-bg)',
        'warning-theme': 'var(--warning)',
        'warning-bg': 'var(--warning-bg)',
        'error-theme': 'var(--error)',
        'error-bg': 'var(--error-bg)'
      },
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'glow': 'var(--shadow-glow)',
        'focus': 'var(--focus-ring)'
      },
      backgroundImage: {
        'accent-gradient': 'var(--accent-gradient)',
        'bg-gradient': 'var(--bg-gradient)'
      },
      transitionProperty: {
        'base': 'var(--transition-base)',
        'smooth': 'var(--transition-smooth)'
      },
      borderRadius: {
        'sm': 'var(--radius-sm)',
        'DEFAULT': 'var(--radius)',
        'lg': 'var(--radius-lg)',
        'xl': 'var(--radius-xl)'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
