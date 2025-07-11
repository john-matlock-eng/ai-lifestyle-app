import React, { useState } from 'react';
import { X } from 'lucide-react';

const AIInsightBanner: React.FC = () => {
  const [hidden, setHidden] = useState(() => localStorage.getItem('hideBanner') === '1');

  if (hidden) return null;

  const handleClose = () => {
    setHidden(true);
    localStorage.setItem('hideBanner', '1');
  };

  return (
    <div className="relative p-4 rounded-lg bg-[var(--color-surface)] text-[var(--color-text)] shadow" role="region" aria-label="AI insight">
      <button
        aria-label="Dismiss insights"
        className="absolute top-2 right-2 text-[color:var(--color-text-muted,theme(colors.gray.500))] hover:text-[var(--color-text)]"
        onClick={handleClose}
      >
        <X className="w-4 h-4" />
      </button>
      <h3 className="font-semibold mb-1">AI Insight</h3>
      <p className="text-sm">💡 Tip: People who journal 5×/week see higher mood scores.</p>
    </div>
  );
};

export default AIInsightBanner;
