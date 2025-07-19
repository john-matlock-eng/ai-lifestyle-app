import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';

interface Quote {
  text: string;
  author: string;
}

const MOTIVATIONAL_QUOTES: Quote[] = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It's not about perfect. It's about effort.", author: "Jillian Michaels" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Ryun" },
  { text: "A year from now, you'll wish you had started today.", author: "Karen Lamb" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "Small daily improvements are the key to staggering long-term results.", author: "Robin Sharma" },
  { text: "Excellence is not a destination; it is a continuous journey that never ends.", author: "Brian Tracy" }
];

export const MotivationalQuote: React.FC = () => {
  const [currentQuote, setCurrentQuote] = useState<Quote>(MOTIVATIONAL_QUOTES[0]);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Set a random quote on mount
    const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
    setCurrentQuote(MOTIVATIONAL_QUOTES[randomIndex]);
  }, []);

  const getNewQuote = () => {
    setIsAnimating(true);
    
    setTimeout(() => {
      let newIndex;
      do {
        newIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
      } while (MOTIVATIONAL_QUOTES[newIndex].text === currentQuote.text);
      
      setCurrentQuote(MOTIVATIONAL_QUOTES[newIndex]);
      setIsAnimating(false);
    }, 300);
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-sm border border-purple-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Daily Inspiration</h3>
        </div>
        <button
          onClick={getNewQuote}
          className="p-2 rounded-lg hover:bg-white/50 transition-colors"
          aria-label="Get new quote"
        >
          <RefreshCw className={`w-4 h-4 text-purple-600 ${isAnimating ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className={`transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
        <blockquote className="relative">
          <svg
            className="absolute -top-2 -left-2 w-8 h-8 text-purple-200"
            fill="currentColor"
            viewBox="0 0 32 32"
          >
            <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
          </svg>
          <p className="relative text-lg text-gray-700 italic leading-relaxed">
            {currentQuote.text}
          </p>
          <footer className="mt-3 text-sm text-gray-600">
            — {currentQuote.author}
          </footer>
        </blockquote>
      </div>

      <div className="mt-4 pt-4 border-t border-purple-200">
        <p className="text-xs text-purple-700 text-center">
          Remember: Every small step counts towards your bigger goals! 🌟
        </p>
      </div>
    </div>
  );
};
