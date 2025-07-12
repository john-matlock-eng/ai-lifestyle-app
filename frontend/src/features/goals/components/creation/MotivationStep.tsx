import React, { useState } from 'react';
import type { GoalContext } from '../../types/api.types';
import Button from '../../../../components/common/Button';

interface MotivationStepProps {
  initialValues?: GoalContext;
  onComplete: (context?: GoalContext) => void;
}

const MotivationStep: React.FC<MotivationStepProps> = ({ initialValues, onComplete }) => {
  const [context, setContext] = useState<GoalContext>({
    motivation: initialValues?.motivation || '',
    importanceLevel: initialValues?.importanceLevel || 3,
    obstacles: initialValues?.obstacles || [],
    successFactors: initialValues?.successFactors || [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(context);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-[var(--text)] mb-4">Your Motivation</h3>
        <p className="text-sm text-muted">
          Understanding why this goal matters will help you stay committed.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-theme mb-1">
          Why is this goal important to you?
        </label>
        <textarea
          value={context.motivation}
          onChange={(e) => setContext({ ...context, motivation: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-[color:var(--surface-muted)] rounded-lg focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-theme mb-1">
          Importance Level: {context.importanceLevel}
        </label>
        <input
          type="range"
          min="1"
          max="5"
          value={context.importanceLevel}
          onChange={(e) =>
            setContext({
              ...context,
              importanceLevel: Number(e.target.value),
            })
          }
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-theme mb-1">
          Obstacles (comma separated)
        </label>
        <input
          type="text"
          value={context.obstacles?.join(', ') || ''}
          onChange={(e) => setContext({ ...context, obstacles: e.target.value ? e.target.value.split(/,\s*/) : [] })}
          className="w-full px-3 py-2 border border-[color:var(--surface-muted)] rounded-lg focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-theme mb-1">
          Success Factors (comma separated)
        </label>
        <input
          type="text"
          value={context.successFactors?.join(', ') || ''}
          onChange={(e) => setContext({ ...context, successFactors: e.target.value ? e.target.value.split(/,\s*/) : [] })}
          className="w-full px-3 py-2 border border-[color:var(--surface-muted)] rounded-lg focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit">Continue</Button>
      </div>
    </form>
  );
};

export default MotivationStep;
