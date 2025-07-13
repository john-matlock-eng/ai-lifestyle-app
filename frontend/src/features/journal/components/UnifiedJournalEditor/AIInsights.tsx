// AIInsights.tsx
import React, { useState } from 'react';
import { 
  Brain, 
  Target, 
  Lightbulb,
  ChevronRight,
  Sparkles,
  Heart,
  AlertCircle
} from 'lucide-react';
import type { JournalEntry } from '../../types/template.types';

interface AIInsightsProps {
  insights: JournalEntry['insights'];
  className?: string;
  onActionClick?: (action: string) => void;
}

const AIInsights: React.FC<AIInsightsProps> = ({
  insights,
  className = '',
  onActionClick
}) => {
  const [expandedSection, setExpandedSection] = useState<string | null>('themes');

  if (!insights) return null;

  const sentimentIcon = {
    positive: <Heart className="w-5 h-5 text-green-500" />,
    neutral: <AlertCircle className="w-5 h-5 text-yellow-500" />,
    negative: <AlertCircle className="w-5 h-5 text-red-500" />
  };

  const sentimentLabel = {
    positive: 'Positive',
    neutral: 'Neutral', 
    negative: 'Needs attention'
  };

  const sections = [
    {
      id: 'sentiment',
      title: 'Emotional Tone',
      icon: sentimentIcon[insights.sentiment || 'neutral'],
      content: (
        <div className="flex items-center gap-3">
          <div className={`
            px-3 py-1 rounded-full text-sm font-medium
            ${insights.sentiment === 'positive' ? 'bg-green-500/10 text-green-500' : ''}
            ${insights.sentiment === 'neutral' ? 'bg-yellow-500/10 text-yellow-500' : ''}
            ${insights.sentiment === 'negative' ? 'bg-red-500/10 text-red-500' : ''}
          `}>
            {sentimentLabel[insights.sentiment || 'neutral']}
          </div>
          <p className="text-sm text-muted">
            Your writing reflects a {insights.sentiment} emotional state
          </p>
        </div>
      )
    },
    {
      id: 'themes',
      title: 'Key Themes',
      icon: <Brain className="w-5 h-5 text-purple-500" />,
      content: insights.themes && (
        <div className="flex flex-wrap gap-2">
          {insights.themes.map((theme, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-purple-500/10 text-purple-500 rounded-full text-sm"
            >
              {theme}
            </span>
          ))}
        </div>
      )
    },
    {
      id: 'actions',
      title: 'Suggested Actions',
      icon: <Target className="w-5 h-5 text-blue-500" />,
      content: insights.actionItems && (
        <ul className="space-y-2">
          {insights.actionItems.map((action, index) => (
            <li 
              key={index}
              className="flex items-start gap-2 text-sm cursor-pointer hover:text-accent transition-colors"
              onClick={() => onActionClick?.(action)}
            >
              <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{action}</span>
            </li>
          ))}
        </ul>
      )
    },
    {
      id: 'suggestions',
      title: 'Insights & Tips',
      icon: <Lightbulb className="w-5 h-5 text-amber-500" />,
      content: insights.suggestions && (
        <ul className="space-y-2">
          {insights.suggestions.map((suggestion, index) => (
            <li key={index} className="text-sm text-muted">
              • {suggestion}
            </li>
          ))}
        </ul>
      )
    }
  ];

  return (
    <div className={`ai-insights ${className}`}>
      <div className="glass rounded-2xl p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20">
            <Sparkles className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-theme">AI Insights</h3>
            <p className="text-xs text-muted">Personalized analysis of your journal entry</p>
          </div>
        </div>

        {/* Insight Sections */}
        <div className="space-y-3">
          {sections.map(section => {
            if (!section.content) return null;
            
            const isExpanded = expandedSection === section.id;
            
            return (
              <div 
                key={section.id}
                className="border border-surface-muted/50 rounded-xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-surface-muted/20 transition-colors"
                >
                  <div className="p-1.5 rounded-lg bg-surface-muted">
                    {section.icon}
                  </div>
                  <span className="font-medium text-sm flex-1 text-left">
                    {section.title}
                  </span>
                  <ChevronRight 
                    className={`
                      w-4 h-4 text-muted transition-transform duration-200
                      ${isExpanded ? 'rotate-90' : ''}
                    `}
                  />
                </button>
                
                <div className={`
                  transition-all duration-300 overflow-hidden
                  ${isExpanded ? 'max-h-96' : 'max-h-0'}
                `}>
                  <div className="px-4 pb-4">
                    {section.content}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Confidence Indicator */}
        <div className="pt-4 border-t border-surface-muted/30">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>AI Confidence: High</span>
            <span>Based on {insights.themes?.length || 0} identified patterns</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInsights;