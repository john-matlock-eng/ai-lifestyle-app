import React, { useState } from "react";
import { JournalEntryRenderer } from "./JournalEntryRenderer";
import { JournalTemplate } from "@/types/journal";

// Sample entries with section markers for different templates
const sampleEntries = {
  daily_reflection: {
    content: `<!--SECTION:emotions:emotions:{"title":"Today's Emotions"}-->
<h3>Today's Emotions</h3>
<ul>
  <li>happy</li>
  <li>content</li>
  <li>peaceful</li>
</ul>
<!--/SECTION-->
<!--SECTION:gratitude:text:{"title":"Three Things I'm Grateful For"}-->
<h3>Three Things I'm Grateful For</h3>
<p>1. A warm cup of coffee this morning
2. A productive work session
3. Quality time with family</p>
<!--/SECTION-->
<!--SECTION:highlights:text:{"title":"Today's Highlights"}-->
<h3>Today's Highlights</h3>
<p>Successfully completed the project presentation and received positive feedback from the team. Also had a great lunch with an old friend.</p>
<!--/SECTION-->
<!--SECTION:challenges:text:{"title":"Challenges & Lessons"}-->
<h3>Challenges & Lessons</h3>
<p>Faced some technical difficulties during the presentation but learned the importance of having backups ready. This experience taught me to always be prepared for unexpected issues.</p>
<!--/SECTION-->
<!--SECTION:tomorrow:text:{"title":"Tomorrow's Focus"}-->
<h3>Tomorrow's Focus</h3>
<p>Review feedback from today's presentation and start implementing the suggested improvements.</p>
<!--/SECTION-->`,
    template: JournalTemplate.DAILY_REFLECTION,
    wordCount: 120,
  },

  mood_tracker: {
    content: `<!--SECTION:current-emotions:emotions:{"title":"Current Emotions"}-->
<h3>Current Emotions</h3>
<span class="emotion-item">anxious</span>
<span class="emotion-item">overwhelmed</span>
<span class="emotion-item">hopeful</span>
<!--/SECTION-->
<!--SECTION:emotion-intensity:scale:{"title":"Overall Intensity"}-->
<h3>Overall Intensity</h3>
<p>7</p>
<!--/SECTION-->
<!--SECTION:emotion-triggers:text:{"title":"What Triggered These Emotions?"}-->
<h3>What Triggered These Emotions?</h3>
<p>Multiple deadlines approaching this week, but also excited about the potential outcomes. The mix of pressure and opportunity is creating complex emotions.</p>
<!--/SECTION-->
<!--SECTION:emotion-physical:text:{"title":"Physical Sensations"}-->
<h3>Physical Sensations</h3>
<p>Tension in shoulders, slight headache, but also feeling energized and alert.</p>
<!--/SECTION-->
<!--SECTION:emotion-tags:tags:{"title":"Contributing Factors"}-->
<h3>Contributing Factors</h3>
<span class="tag-item">work-stress</span>
<span class="tag-item">deadlines</span>
<span class="tag-item">excitement</span>
<!--/SECTION-->`,
    template: JournalTemplate.MOOD_TRACKER,
    wordCount: 80,
  },

  habit_tracker: {
    content: `<!--SECTION:morning-habits:checklist:{"title":"Morning Habits"}-->
<h3>Morning Habits</h3>
<ul>
  <li class="checked">✓ Woke up early</li>
  <li>Morning exercise</li>
  <li class="checked">✓ Meditation/mindfulness</li>
  <li class="checked">✓ Healthy breakfast</li>
  <li>Morning pages</li>
</ul>
<!--/SECTION-->
<!--SECTION:daily-habits:checklist:{"title":"Daily Habits"}-->
<h3>Daily Habits</h3>
<ul>
  <li class="checked">✓ Drank 8 glasses of water</li>
  <li class="checked">✓ Hit step goal</li>
  <li>Read for 30 minutes</li>
  <li class="checked">✓ Limited social media</li>
  <li class="checked">✓ Practiced gratitude</li>
</ul>
<!--/SECTION-->
<!--SECTION:habit-reflection:text:{"title":"Habit Reflection"}-->
<h3>Habit Reflection</h3>
<p>Today was a good day for habits overall. Managed to complete most of my morning routine, which set a positive tone. The meditation practice was particularly helpful in managing stress throughout the day.</p>
<!--/SECTION-->
<!--SECTION:tomorrow-focus:text:{"title":"Tomorrow's Habit Focus"}-->
<h3>Tomorrow's Habit Focus</h3>
<p>Focus on getting the morning exercise done - it's been the most challenging habit to maintain consistently.</p>
<!--/SECTION-->`,
    template: JournalTemplate.HABIT_TRACKER,
    wordCount: 90,
  },

  goal_progress: {
    content: `<!--SECTION:goals-worked:goals:{"title":"Goals I Worked On"}-->
<h3>Goals I Worked On</h3>
<ul>
  <li><a href="/goals/goal-learn-spanish">Learn Spanish - B2 Level</a></li>
  <li><a href="/goals/goal-fitness">Run a Half Marathon</a></li>
  <li><a href="/goals/goal-side-project">Launch Side Project</a></li>
</ul>
<!--/SECTION-->
<!--SECTION:progress-description:text:{"title":"Progress Details"}-->
<h3>Progress Details</h3>
<p>Spanish: Completed lesson 15 of the intermediate course and had a 30-minute conversation practice session.

Running: Completed a 10K training run at a comfortable pace. Feeling stronger each week.

Side Project: Finished the user authentication module and started working on the main dashboard.</p>
<!--/SECTION-->
<!--SECTION:obstacles:text:{"title":"Obstacles Encountered"}-->
<h3>Obstacles Encountered</h3>
<p>Time management continues to be challenging. Had to skip the morning Spanish practice to make time for the running session. Need to find a better balance.</p>
<!--/SECTION-->
<!--SECTION:next-steps:text:{"title":"Next Steps"}-->
<h3>Next Steps</h3>
<p>Tomorrow: Spanish vocabulary review in the morning, 5K recovery run in the evening, and 2 hours on the side project after dinner.</p>
<!--/SECTION-->
<!--SECTION:progress-rating:scale:{"title":"Progress Satisfaction"}-->
<h3>Progress Satisfaction</h3>
<p>8</p>
<!--/SECTION-->`,
    template: JournalTemplate.GOAL_PROGRESS,
    wordCount: 150,
  },

  creative_writing: {
    content: `<!--SECTION:writing-prompt:choice:{"title":"Today's Prompt"}-->
<h3>Today's Prompt</h3>
<p class="selected">A letter to your future self</p>
<!--/SECTION-->
<!--SECTION:creative-content:text:{"title":"Your Creative Writing"}-->
<h3>Your Creative Writing</h3>
<p>Dear Future Me,

I hope this letter finds you in good health and high spirits. As I write this, I'm sitting by the window watching the rain fall, wondering what life will be like when you read this.

Have you achieved the goals we set? I hope the side project we're working on has grown into something meaningful. Remember how scared we were to start? But we did it anyway.

I hope you've maintained the relationships that matter. Call Mom if you haven't in a while. She always worries, even when she says she doesn't.

Most importantly, I hope you've stayed true to yourself. The world has a way of trying to change us, but our core values - kindness, curiosity, and perseverance - I hope these still guide you.

Remember to be patient with yourself. We've always been our own harshest critic.

With love and hope,
Your Past Self</p>
<!--/SECTION-->
<!--SECTION:writing-emotions:emotions:{"title":"Writing Emotions"}-->
<h3>Writing Emotions</h3>
<li>hopeful</li>
<li>nostalgic</li>
<li>peaceful</li>
<!--/SECTION-->
<!--SECTION:writing-tags:tags:{"title":"Themes"}-->
<h3>Themes</h3>
<span class="tag">reflection</span>
<span class="tag">self-compassion</span>
<span class="tag">growth</span>
<span class="tag">relationships</span>
<!--/SECTION-->`,
    template: JournalTemplate.CREATIVE_WRITING,
    wordCount: 200,
  },

  gratitude: {
    content: `<!--SECTION:gratitude-list:text:{"title":"Things I'm Grateful For"}-->
<h3>Things I'm Grateful For</h3>
<p>1. The smell of fresh coffee in the morning - it's such a simple pleasure but starts my day perfectly
2. My partner's support during a stressful week - they always know just what to say
3. The beautiful sunset I witnessed during my evening walk
4. Having a job that challenges me and helps me grow
5. My health and the ability to exercise regularly
6. The book I'm currently reading that's opening my mind to new perspectives
7. Technology that allows me to stay connected with distant friends</p>
<!--/SECTION-->
<!--SECTION:gratitude-person:text:{"title":"Person I'm Grateful For"}-->
<h3>Person I'm Grateful For</h3>
<p>My mentor, Sarah. She took time out of her busy schedule today to help me work through a challenging problem. Her patience and wisdom continue to inspire me to be better.</p>
<!--/SECTION-->
<!--SECTION:gratitude-moment:text:{"title":"Moment of Joy"}-->
<h3>Moment of Joy</h3>
<p>During lunch, I stepped outside and felt the warm sun on my face. For just a moment, all my worries melted away and I felt completely present. It was a beautiful reminder to slow down and appreciate the simple moments.</p>
<!--/SECTION-->
<!--SECTION:gratitude-scale:scale:{"title":"Gratitude Level"}-->
<h3>Gratitude Level</h3>
<p>9</p>
<!--/SECTION-->`,
    template: JournalTemplate.GRATITUDE,
    wordCount: 180,
  },

  blank: {
    content: `<!--SECTION:content:text:{"title":"Your Thoughts"}-->
<h3>Your Thoughts</h3>
<p>Today I've been thinking about the concept of time and how our perception of it changes based on what we're doing. When I'm engaged in something I love, hours fly by in what feels like minutes. But when I'm waiting or doing something tedious, minutes drag on forever.

I wonder if this is why childhood summers felt endless - every day was filled with new experiences and discoveries. Now, with routine and familiarity, weeks blend together.

Maybe the key to a fuller life is to intentionally seek out novel experiences, to break the patterns that make time slip away unnoticed. Even small changes - taking a different route to work, trying a new recipe, starting a conversation with a stranger - might help expand our perception of time.

It's not about filling every moment with activity, but about being present and aware. When we pay attention, even ordinary moments can become extraordinary.</p>
<!--/SECTION-->
<!--SECTION:emotions:emotions:{"title":"Current Emotions (Optional)"}-->
<h3>Current Emotions (Optional)</h3>
<li>contemplative</li>
<li>curious</li>
<!--/SECTION-->
<!--SECTION:tags:tags:{"title":"Tags"}-->
<h3>Tags</h3>
<span class="tag">philosophy</span>
<span class="tag">time</span>
<span class="tag">mindfulness</span>
<!--/SECTION-->`,
    template: JournalTemplate.BLANK,
    wordCount: 160,
  },
};

const JournalEntryRendererDemo: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] =
    useState<string>("daily_reflection");
  const [showLegacyFormat, setShowLegacyFormat] = useState(false);

  const currentEntry = showLegacyFormat
    ? {
        content: `<h3>Today's Emotions</h3>
<p>happy, excited, grateful</p>
<h3>Three Things I'm Grateful For</h3>
<p>Family time, good weather, productive work day</p>
<h3>Today's Highlights</h3>
<p>Completed a major milestone at work</p>
<h3>Challenges & Lessons</h3>
<p>Learned to delegate tasks more effectively</p>
<h3>Tomorrow's Focus</h3>
<p>Start the new project phase with fresh energy</p>`,
        template: "daily_reflection",
        wordCount: 50,
      }
    : sampleEntries[selectedTemplate as keyof typeof sampleEntries];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Journal Entry Renderer Test</h1>

      <div className="mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Select Template:
          </label>
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="px-4 py-2 border rounded-lg bg-surface"
          >
            <option value="daily_reflection">Daily Reflection</option>
            <option value="mood_tracker">Mood Tracker</option>
            <option value="habit_tracker">Habit Tracker</option>
            <option value="goal_progress">Goal Progress</option>
            <option value="creative_writing">Creative Writing</option>
            <option value="gratitude">Gratitude Journal</option>
            <option value="blank">Blank Journal</option>
          </select>
        </div>

        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showLegacyFormat}
              onChange={(e) => setShowLegacyFormat(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">
              Show Legacy Format (without section markers)
            </span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Raw Content */}
        <div>
          <h2 className="text-xl font-semibold mb-3">Raw Content</h2>
          <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
            {currentEntry.content}
          </pre>
        </div>

        {/* Rendered Output */}
        <div>
          <h2 className="text-xl font-semibold mb-3">Rendered Output</h2>
          <div className="bg-surface border rounded-lg p-6">
            <JournalEntryRenderer entry={currentEntry} />
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">
          Features Demonstrated:
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>✓ Section marker parsing for all template types</li>
          <li>
            ✓ Dynamic rendering based on section type (text, emotions, scale,
            checklist, etc.)
          </li>
          <li>✓ Emotion display with colors and emojis</li>
          <li>✓ Scale visualization with progress bars</li>
          <li>✓ Checklist rendering with completion states</li>
          <li>✓ Tag display with proper styling</li>
          <li>✓ Goal linking support</li>
          <li>✓ Choice selection display</li>
          <li>✓ Legacy format backward compatibility</li>
        </ul>
      </div>
    </div>
  );
};

export default JournalEntryRendererDemo;
