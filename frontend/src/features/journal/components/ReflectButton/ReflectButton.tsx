import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';

interface ReflectButtonProps {
  onClick: () => void;
  privacy: 'private' | 'ai' | 'shared' | 'public';
}

const ReflectButton: React.FC<ReflectButtonProps> = ({ onClick, privacy }) => {
  const [showTip, setShowTip] = useState(false);
  if (privacy !== 'ai') return null;
  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={onClick}
        onMouseEnter={() => setShowTip(true)}
        onMouseLeave={() => setShowTip(false)}
        onFocus={() => setShowTip(true)}
        onBlur={() => setShowTip(false)}
        aria-label="Reflect with AI"
        className="p-1 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <MessageCircle className="w-4 h-4" />
      </button>
      {showTip && (
        <div role="tooltip" className="absolute z-10 px-2 py-1 text-xs text-white bg-gray-900 rounded -top-1 left-6 transform -translate-y-full">
          Reflect with AI
        </div>
      )}
    </div>
  );
};

export default ReflectButton;
