import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { MiniProgressRing } from '../../goals/components/GoalProgress/ProgressRing';

interface StatTileProps {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  percent?: number;
}

const StatTile: React.FC<StatTileProps> = ({ icon: Icon, label, value, percent }) => {
  return (
    <div
      data-testid="stat-tile"
      role="region"
      aria-label={`${label} stats`}
      className="flex flex-col items-center p-4 rounded-xl shadow bg-[var(--color-surface)] text-[var(--color-text)]"
    >
      {percent !== undefined ? (
        <div className="relative flex items-center justify-center" style={{ width: 48, height: 48 }}>
          <MiniProgressRing progress={percent} size={48} color="var(--color-accent-start)" />
          <Icon className="absolute w-6 h-6 text-primary-400" aria-hidden="true" />
        </div>
      ) : (
        <Icon className="w-8 h-8 text-primary-400" aria-hidden="true" />
      )}
      <div className="mt-2 text-xl font-bold">{value}</div>
      <div className="text-sm text-[color:var(--color-text-muted,theme(colors.gray.500))]">{label}</div>
    </div>
  );
};

export default StatTile;
