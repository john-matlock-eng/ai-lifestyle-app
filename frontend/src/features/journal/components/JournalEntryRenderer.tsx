import React from 'react';

interface JournalEntry {
  content: string;
  template?: string;
  wordCount?: number;
}

interface JournalEntryRendererProps {
  entry: JournalEntry;
  className?: string;
}

export const JournalEntryRenderer: React.FC<JournalEntryRendererProps> = ({
  entry,
  className = ''
}) => {
  // Parse structured content if it exists
  const parseContent = (content: string) => {
    try {
      // Check if content is JSON (for structured templates)
      const parsed = JSON.parse(content);
      if (typeof parsed === 'object' && parsed !== null) {
        return renderStructuredContent(parsed);
      }
    } catch {
      // If not JSON, treat as markdown/plain text
    }
    return content;
  };

  // Render structured content based on template type
  const renderStructuredContent = (data: Record<string, unknown>) => {
    switch (entry.template) {
      case 'gratitude':
        return renderGratitudeContent(data);
      case 'goals':
        return renderGoalsContent(data);
      case 'reflection':
        return renderReflectionContent(data);
      case 'dream':
        return renderDreamContent(data);
      case 'travel':
        return renderTravelContent(data);
      case 'creative':
        return renderCreativeContent(data);
      default:
        return renderDefaultContent(data);
    }
  };

  // Template-specific renderers
  interface GratitudeData {
    gratitudes?: string[];
    reflection?: string;
    intention?: string;
  }
  
  const renderGratitudeContent = (data: unknown) => {
    const gratitudeData = data as GratitudeData;
    return (
      <div className="space-y-6">
        {gratitudeData.gratitudes && (
          <section>
            <h3 className="text-xl font-semibold mb-3 text-accent">Things I'm Grateful For</h3>
            <ul className="space-y-2">
              {gratitudeData.gratitudes.map((item: string, index: number) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-accent text-lg">•</span>
                  <span className="flex-1">{item}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
        {gratitudeData.reflection && (
          <section>
            <h3 className="text-xl font-semibold mb-3 text-accent">Today's Reflection</h3>
            <p className="leading-relaxed">{gratitudeData.reflection}</p>
          </section>
        )}
        {gratitudeData.intention && (
          <section>
            <h3 className="text-xl font-semibold mb-3 text-accent">Tomorrow's Intention</h3>
            <p className="leading-relaxed italic">{gratitudeData.intention}</p>
          </section>
        )}
      </div>
    );
  };

  interface Goal {
    title: string;
    description?: string;
    milestones?: string[];
    progress?: number;
  }
  
  interface GoalsData {
    goals?: Goal[];
    notes?: string;
  }
  
  const renderGoalsContent = (data: unknown) => {
    const goalsData = data as GoalsData;
    return (
      <div className="space-y-6">
        {goalsData.goals && goalsData.goals.map((goal: Goal, index: number) => (
          <section key={index} className="border-l-4 border-accent pl-4">
            <h3 className="text-xl font-semibold mb-2">{goal.title}</h3>
            {goal.description && (
              <p className="mb-3 text-muted">{goal.description}</p>
            )}
            {goal.milestones && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm uppercase tracking-wide text-accent">Milestones</h4>
                <ul className="space-y-1">
                  {goal.milestones.map((milestone: string, idx: number) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-accent rounded-full"></span>
                      <span className="text-sm">{milestone}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {goal.progress && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm font-medium">{goal.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-accent h-2 rounded-full transition-all duration-500"
                    style={{ width: `${goal.progress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </section>
        ))}
        {goalsData.notes && (
          <section>
            <h3 className="text-xl font-semibold mb-3 text-accent">Additional Notes</h3>
            <p className="leading-relaxed">{goalsData.notes}</p>
          </section>
        )}
      </div>
    );
  };

  interface ReflectionData {
    situation?: string;
    thoughts?: string;
    feelings?: string;
    lessons?: string;
    actions?: string[];
  }
  
  const renderReflectionContent = (data: unknown) => {
    const reflectionData = data as ReflectionData;
    return (
      <div className="space-y-6">
        {reflectionData.situation && (
          <section>
            <h3 className="text-xl font-semibold mb-3 text-accent">The Situation</h3>
            <p className="leading-relaxed">{reflectionData.situation}</p>
          </section>
        )}
        {reflectionData.thoughts && (
          <section>
            <h3 className="text-xl font-semibold mb-3 text-accent">My Thoughts</h3>
            <p className="leading-relaxed">{reflectionData.thoughts}</p>
          </section>
        )}
        {reflectionData.feelings && (
          <section>
            <h3 className="text-xl font-semibold mb-3 text-accent">How I Felt</h3>
            <p className="leading-relaxed">{reflectionData.feelings}</p>
          </section>
        )}
        {reflectionData.lessons && (
          <section>
            <h3 className="text-xl font-semibold mb-3 text-accent">Lessons Learned</h3>
            <p className="leading-relaxed">{reflectionData.lessons}</p>
          </section>
        )}
        {reflectionData.actions && (
          <section>
            <h3 className="text-xl font-semibold mb-3 text-accent">Next Steps</h3>
            <ul className="space-y-2">
              {reflectionData.actions.map((action: string, index: number) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-accent">→</span>
                  <span className="flex-1">{action}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    );
  };

  interface DreamData {
    setting?: string;
    narrative?: string;
    symbols?: string[];
    emotions?: string;
    interpretation?: string;
  }
  
  const renderDreamContent = (data: unknown) => {
    const dreamData = data as DreamData;
    return (
      <div className="space-y-6">
        {dreamData.setting && (
          <section>
            <h3 className="text-xl font-semibold mb-3 text-accent">Dream Setting</h3>
            <p className="leading-relaxed italic">{dreamData.setting}</p>
          </section>
        )}
        {dreamData.narrative && (
          <section>
            <h3 className="text-xl font-semibold mb-3 text-accent">What Happened</h3>
            <p className="leading-relaxed">{dreamData.narrative}</p>
          </section>
        )}
        {dreamData.symbols && (
          <section>
            <h3 className="text-xl font-semibold mb-3 text-accent">Symbols & Themes</h3>
            <div className="flex flex-wrap gap-2">
              {dreamData.symbols.map((symbol: string, index: number) => (
                <span key={index} className="px-3 py-1 bg-accent/10 text-accent rounded-full text-sm">
                  {symbol}
                </span>
              ))}
            </div>
          </section>
        )}
        {dreamData.emotions && (
          <section>
            <h3 className="text-xl font-semibold mb-3 text-accent">Emotions Felt</h3>
            <p className="leading-relaxed">{dreamData.emotions}</p>
          </section>
        )}
        {dreamData.interpretation && (
          <section>
            <h3 className="text-xl font-semibold mb-3 text-accent">My Interpretation</h3>
            <p className="leading-relaxed">{dreamData.interpretation}</p>
          </section>
        )}
      </div>
    );
  };

  interface TravelHighlight {
    emoji?: string;
    title: string;
    description: string;
  }
  
  interface TravelData {
    location?: string;
    highlights?: TravelHighlight[];
    experiences?: string;
    people?: string;
    food?: string;
    thoughts?: string;
  }
  
  const renderTravelContent = (data: unknown) => {
    const travelData = data as TravelData;
    return (
      <div className="space-y-6">
        {travelData.location && (
          <section>
            <h3 className="text-xl font-semibold mb-3 text-accent">📍 {travelData.location}</h3>
          </section>
        )}
        {travelData.highlights && (
          <section>
            <h3 className="text-xl font-semibold mb-3 text-accent">Today's Highlights</h3>
            <ul className="space-y-3">
              {travelData.highlights.map((highlight: TravelHighlight, index: number) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-2xl">{highlight.emoji || '✨'}</span>
                  <div className="flex-1">
                    <h4 className="font-medium">{highlight.title}</h4>
                    <p className="text-sm text-muted mt-1">{highlight.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
        {travelData.experiences && (
          <section>
            <h3 className="text-xl font-semibold mb-3 text-accent">Experiences</h3>
            <p className="leading-relaxed">{travelData.experiences}</p>
          </section>
        )}
        {travelData.people && (
          <section>
            <h3 className="text-xl font-semibold mb-3 text-accent">People I Met</h3>
            <p className="leading-relaxed">{travelData.people}</p>
          </section>
        )}
        {travelData.food && (
          <section>
            <h3 className="text-xl font-semibold mb-3 text-accent">Food & Flavors</h3>
            <p className="leading-relaxed">{travelData.food}</p>
          </section>
        )}
        {travelData.thoughts && (
          <section>
            <h3 className="text-xl font-semibold mb-3 text-accent">Reflections</h3>
            <p className="leading-relaxed">{travelData.thoughts}</p>
          </section>
        )}
      </div>
    );
  };

  interface CreativeData {
    type?: string;
    title?: string;
    content?: string;
    inspiration?: string;
    notes?: string;
  }
  
  const renderCreativeContent = (data: unknown) => {
    const creativeData = data as CreativeData;
    return (
      <div className="space-y-6">
        {creativeData.type && (
          <section>
            <div className="inline-flex items-center px-3 py-1 bg-accent/10 text-accent rounded-full text-sm mb-4">
              {creativeData.type}
            </div>
          </section>
        )}
        {creativeData.title && (
          <section>
            <h2 className="text-2xl font-bold mb-4">{creativeData.title}</h2>
          </section>
        )}
        {creativeData.content && (
          <section className="prose prose-lg">
            <div className="whitespace-pre-wrap leading-relaxed">{creativeData.content}</div>
          </section>
        )}
        {creativeData.inspiration && (
          <section className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-xl font-semibold mb-3 text-accent">Inspiration</h3>
            <p className="leading-relaxed italic">{creativeData.inspiration}</p>
          </section>
        )}
        {creativeData.notes && (
          <section>
            <h3 className="text-xl font-semibold mb-3 text-accent">Creative Notes</h3>
            <p className="leading-relaxed">{creativeData.notes}</p>
          </section>
        )}
      </div>
    );
  };

  const renderDefaultContent = (data: unknown) => {
    const defaultData = data as Record<string, unknown>;
    return (
      <div className="space-y-6">
        {Object.entries(defaultData).map(([key, value]) => (
          <section key={key}>
            <h3 className="text-xl font-semibold mb-3 text-accent capitalize">
              {key.replace(/_/g, ' ')}
            </h3>
            {Array.isArray(value) ? (
              <ul className="space-y-2">
                {(value as unknown[]).map((item: unknown, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-accent">•</span>
                    <span className="flex-1">{typeof item === 'object' ? JSON.stringify(item) : String(item)}</span>
                  </li>
                ))}
              </ul>
            ) : typeof value === 'object' ? (
              <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
                <code>{JSON.stringify(value, null, 2)}</code>
              </pre>
            ) : (
              <p className="leading-relaxed">{String(value)}</p>
            )}
          </section>
        ))}
      </div>
    );
  };

  const content = parseContent(entry.content);

  // If content is a string, render as HTML
  if (typeof content === 'string') {
    return (
      <div className={`journal-content ${className} prose prose-theme max-w-none`}>
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    );
  }

  // Otherwise, it's already been rendered as structured content
  return <div className={`journal-content ${className}`}>{content}</div>;
};

export default JournalEntryRenderer;