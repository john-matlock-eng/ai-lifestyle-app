import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { MiniProgressRing } from '../../goals/components/GoalProgress/ProgressRing';

interface StatTileProps {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  progress?: number;
}

const StatTile: React.FC<StatTileProps> = ({ icon: Icon, label, value, progress }) => {
  return (
    <div
      data-testid="stat-tile"
      className="flex flex-col items-center p-4 rounded-xl shadow bg-[var(--color-surface)]"
    >
      {progress !== undefined ? (
        <MiniProgressRing progress={progress} size={48} color="var(--color-accent-start)" />
      ) : (
        <Icon className="w-8 h-8 text-primary-600" aria-hidden="true" />
      )}
      <div className="mt-2 text-xl font-bold text-[var(--color-text)]">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
};

export default StatTile;
