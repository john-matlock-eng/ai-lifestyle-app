import React, { useMemo } from 'react';
import { useAuth } from '../../../contexts';

const QUOTES = [
  'Wellness is the natural state of my body.',
  'Take a deep breath and start again.',
  'Small steps each day add up to big results.',
  'Consistency builds habits, habits build wellness.',
];

const HeroGreeting: React.FC = () => {
  const { user } = useAuth();
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
  const hours = new Date().getHours();
  const part = hours < 12 ? 'morning' : hours < 18 ? 'afternoon' : 'evening';
  const greeting = `Good ${part}, ${user?.firstName ?? ''} \u{1F44B}`;

  return (
    <div className="text-center py-6 space-y-1" id="wellness-dashboard-heading">
      <p className="text-sm text-[color:var(--color-text-muted,theme(colors.gray.500))]">{today}</p>
      <h1 className="text-3xl font-bold text-[var(--color-text)]">{greeting}</h1>
      <p className="text-[color:var(--color-text-muted,theme(colors.gray.600))] italic">“{quote}”</p>
    </div>
  );
};

export default HeroGreeting;
