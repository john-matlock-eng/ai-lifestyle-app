import React from 'react';
import { useTheme } from '../../contexts';
import type { Theme } from '../../contexts';

const options: { label: string; value: Theme }[] = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'Serene', value: 'serene' },
  { label: 'Vibrant', value: 'vibrant' },
];

const ThemePicker: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <select
      value={theme}
      onChange={(e) => setTheme(e.target.value as Theme)}
      className="border-gray-300 rounded-md text-sm"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
};

export default ThemePicker;
