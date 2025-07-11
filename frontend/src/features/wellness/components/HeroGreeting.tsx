import React, { useMemo } from 'react';

const QUOTES = [
  'Wellness is the natural state of my body.',
  'Take a deep breath and start again.',
  'Small steps each day add up to big results.',
  'Consistency builds habits, habits build wellness.',
];

const HeroGreeting: React.FC = () => {
  const today = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
    []
  );
  const quote = useMemo(() => QUOTES[Math.floor(Math.random() * QUOTES.length)], []);

  return (
    <div className="text-center py-6 space-y-1">
      <p className="text-sm text-gray-500">{today}</p>
      <h1 className="text-3xl font-bold text-[var(--color-text)]">Welcome back</h1>
      <p className="text-gray-600 italic">“{quote}”</p>
    </div>
  );
};

export default HeroGreeting;
