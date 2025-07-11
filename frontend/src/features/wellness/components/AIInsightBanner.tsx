import React, { useState } from 'react';
import { X } from 'lucide-react';

const AIInsightBanner: React.FC = () => {
  const [hidden, setHidden] = useState(() => localStorage.getItem('hide-ai-banner') === '1');

  if (hidden) return null;

  const handleClose = () => {
    setHidden(true);
    localStorage.setItem('hide-ai-banner', '1');
  };

  return (
    <div className="relative p-4 rounded-lg bg-[var(--color-surface)] text-[var(--color-text)] shadow">
      <button
        aria-label="Dismiss insights"
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        onClick={handleClose}
      >
        <X className="w-4 h-4" />
      </button>
      <h3 className="font-semibold mb-1">AI Insight</h3>
      <p className="text-sm">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
    </div>
  );
};

export default AIInsightBanner;
