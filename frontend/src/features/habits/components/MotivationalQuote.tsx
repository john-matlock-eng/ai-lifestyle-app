import React, { useState, useEffect } from 'react';
import { Quote, RefreshCcw } from 'lucide-react';
import { clsx } from 'clsx';

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
  
  const handleNewQuote = () => {
    const currentIndex = quotes.indexOf(quote);
    let newIndex = Math.floor(Math.random() * quotes.length);
    // Ensure we get a different quote
    while (newIndex === currentIndex && quotes.length > 1) {
      newIndex = Math.floor(Math.random() * quotes.length);
    }
    setQuote(quotes[newIndex]);
  };
  
  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-600/10 via-pink-600/10 to-blue-600/10 p-6 border border-purple-500/20">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 opacity-10 rounded-full blur-2xl" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
              <Quote className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Daily Inspiration
            </h3>
          </div>
          <button
            onClick={handleNewQuote}
            className={clsx(
              "p-2 rounded-lg transition-all duration-300",
              "hover:bg-purple-500/10 hover:scale-110",
              "text-[var(--text-muted)] hover:text-purple-600"
            )}
            title="Get new quote"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
        </div>
        
        <div className="space-y-3">
          <p className="text-lg text-[var(--text)] font-medium italic leading-relaxed">
            "{quote.text}"
          </p>
          <p className="text-sm text-[var(--text-muted)] flex items-center gap-2">
            <span className="text-lg">✨</span>
            <span>— {quote.author}</span>
          </p>
        </div>
      </div>
    </div>
  );
};
