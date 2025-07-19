import React, { useState, useEffect } from 'react';
import { Quote } from 'lucide-react';

const quotes = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It's not about perfect. It's about effort.", author: "Jillian Michaels" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "A year from now, you'll wish you had started today.", author: "Karen Lamb" },
  { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
  { text: "Your limitation—it's only your imagination.", author: "Unknown" },
  { text: "Great things never come from comfort zones.", author: "Unknown" },
  { text: "Dream it. Wish it. Do it.", author: "Unknown" }
];

export const MotivationalQuote: React.FC = () => {
  const [quote, setQuote] = useState(quotes[0]);
  
  useEffect(() => {
    // Select a random quote on mount
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setQuote(randomQuote);
  }, []);
  
  return (
    <div className="glass rounded-lg p-6 border border-surface-muted hover-lift">
      <div className="flex items-start space-x-3">
        <div className="p-2 rounded-lg bg-accent" style={{ background: 'var(--button-hover-bg)' }}>
          <Quote className="w-5 h-5 text-accent" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-theme italic mb-2">"{quote.text}"</p>
          <p className="text-xs text-muted">— {quote.author}</p>
        </div>
      </div>
    </div>
  );
};
