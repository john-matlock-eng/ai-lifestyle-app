import React from 'react';
import { Shield, Lock, Unlock, AlertCircle } from 'lucide-react';

interface EncryptionIndicatorProps {
  status: 'encrypted' | 'unencrypted' | 'partial' | 'error';
  module?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

const statusConfig = {
  encrypted: {
    icon: Shield,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    label: 'Fully encrypted',
  },
  unencrypted: {
    icon: Unlock,
    color: 'text-gray-400',
    bgColor: 'bg-[var(--surface-muted)]',
    label: 'Not encrypted',
  },
  partial: {
    icon: Lock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    label: 'Partially encrypted',
  },
  error: {
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    label: 'Encryption error',
  },
};

export const EncryptionIndicator: React.FC<EncryptionIndicatorProps> = ({
  status,
  module,
  size = 'md',
  showLabel = false,
  className = '',
}) => {
  const config = statusConfig[status];
  const Icon = config.icon;
  const iconSize = sizeClasses[size];

  const label = module ? `${module}: ${config.label}` : config.label;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`inline-flex items-center justify-center rounded-full p-1 ${config.bgColor}`}
        role="img"
        aria-label={label}
      >
        <Icon className={`${iconSize} ${config.color}`} aria-hidden="true" />
      </div>
      
      {showLabel && (
        <span className={`text-sm font-medium ${config.color}`}>
          {config.label}
        </span>
      )}
    </div>
  );
};

// Compound component for showing multiple module statuses
interface ModuleEncryptionStatus {
  moduleId: string;
  moduleName: string;
  status: 'encrypted' | 'unencrypted' | 'partial' | 'error';
}

interface EncryptionStatusListProps {
  modules: ModuleEncryptionStatus[];
  className?: string;
}

export const EncryptionStatusList: React.FC<EncryptionStatusListProps> = ({
  modules,
  className = '',
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <h3 className="text-sm font-semibold text-gray-700">Encryption Status</h3>
      <ul className="space-y-1">
        {modules.map((module) => (
          <li
            key={module.moduleId}
            className="flex items-center justify-between py-1"
          >
            <span className="text-sm text-muted">{module.moduleName}</span>
            <EncryptionIndicator
              status={module.status}
              size="sm"
              showLabel={true}
            />
          </li>
        ))}
      </ul>
    </div>
  );
};
