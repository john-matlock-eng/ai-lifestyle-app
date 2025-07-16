import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { JournalEntryRenderer } from "../JournalEntryRenderer";
import { JournalTemplate } from "@/types/journal";
import "@testing-library/jest-dom";

describe("JournalEntryRenderer - Enhanced Version", () => {
  describe("Section Marker Parsing", () => {
    it("should parse and render daily reflection with section markers", () => {
      const entry = {
        content: `
<!--SECTION:emotions:emotions:{"title":"Today's Emotions"}-->
<h3>Today's Emotions</h3>
<ul>
  <li>happy</li>
  <li>content</li>
  <li>grateful</li>
</ul>
<!--/SECTION-->
<!--SECTION:gratitude:text:{"title":"Three Things I'm Grateful For"}-->
<h3>Three Things I'm Grateful For</h3>
<p>I'm grateful for my family, good health, and a productive day at work.</p>
<!--/SECTION-->
<!--SECTION:highlights:text:{"title":"Today's Highlights"}-->
<h3>Today's Highlights</h3>
<p>Completed a major project milestone and had a great team meeting.</p>
<!--/SECTION-->
<!--SECTION:challenges:text:{"title":"Challenges & Lessons"}-->
<h3>Challenges & Lessons</h3>
<p>Struggled with time management but learned to prioritize better.</p>
<!--/SECTION-->
<!--SECTION:tomorrow:text:{"title":"Tomorrow's Focus"}-->
<h3>Tomorrow's Focus</h3>
<p>Review project feedback and start on the next phase.</p>
<!--/SECTION-->`,
        template: JournalTemplate.DAILY_REFLECTION,
        wordCount: 50,
      };

      render(<JournalEntryRenderer entry={entry} />);

      // Check that all sections are rendered
      expect(screen.getByText("Today's Emotions")).toBeInTheDocument();
      expect(
        screen.getByText("Three Things I'm Grateful For"),
      ).toBeInTheDocument();
      expect(screen.getByText("Today's Highlights")).toBeInTheDocument();
      expect(screen.getByText("Challenges & Lessons")).toBeInTheDocument();
      expect(screen.getByText("Tomorrow's Focus")).toBeInTheDocument();

      // Check that emotions are displayed with proper styling
      expect(screen.getByText("Happy")).toBeInTheDocument(); // Should be capitalized
      expect(screen.getByText("Content")).toBeInTheDocument();
      expect(screen.getByText("Grateful")).toBeInTheDocument();
    });

    it("should render mood tracker with scale and emotions", () => {
      const entry = {
        content: `
<!--SECTION:current-emotions:emotions:{"title":"Current Emotions"}-->
<h3>Current Emotions</h3>
<span class="emotion-item">anxious</span>
<span class="emotion-item">overwhelmed</span>
<!--/SECTION-->
<!--SECTION:emotion-intensity:scale:{"title":"Overall Intensity"}-->
<h3>Overall Intensity</h3>
<p>8</p>
<!--/SECTION-->
<!--SECTION:emotion-triggers:text:{"title":"What Triggered These Emotions?"}-->
<h3>What Triggered These Emotions?</h3>
<p>Work deadline approaching and multiple tasks piling up.</p>
<!--/SECTION-->`,
        template: JournalTemplate.MOOD_TRACKER,
        wordCount: 20,
      };

      render(<JournalEntryRenderer entry={entry} />);

      // Check emotions
      expect(screen.getByText("Current Emotions")).toBeInTheDocument();
      expect(screen.getByText("Anxious")).toBeInTheDocument();
      expect(screen.getByText("Overwhelmed")).toBeInTheDocument();

      // Check scale rendering
      expect(screen.getByText("Overall Intensity")).toBeInTheDocument();
      expect(screen.getByText("8")).toBeInTheDocument();
      expect(screen.getByText("out of 10")).toBeInTheDocument();
    });

    it("should render habit tracker with checklists", () => {
      const entry = {
        content: `
<!--SECTION:morning-habits:checklist:{"title":"Morning Habits"}-->
<h3>Morning Habits</h3>
<ul>
  <li class="checked">✓ Woke up early</li>
  <li>Morning exercise</li>
  <li class="checked">✓ Meditation/mindfulness</li>
  <li class="checked">✓ Healthy breakfast</li>
  <li>Morning pages</li>
</ul>
<!--/SECTION-->
<!--SECTION:habit-reflection:text:{"title":"Habit Reflection"}-->
<h3>Habit Reflection</h3>
<p>Good morning routine today, helped set a positive tone for the day.</p>
<!--/SECTION-->`,
        template: JournalTemplate.HABIT_TRACKER,
        wordCount: 20,
      };

      render(<JournalEntryRenderer entry={entry} />);

      // Check checklist rendering
      expect(screen.getByText("Morning Habits")).toBeInTheDocument();
      expect(screen.getByText("Woke up early")).toBeInTheDocument();
      expect(screen.getByText("Morning exercise")).toBeInTheDocument();

      // Check that completed items have strikethrough styling
      const wokeUpEarly = screen.getByText("Woke up early");
      expect(wokeUpEarly.className).toContain("line-through");
    });

    it("should render goal progress with linked goals", () => {
      const entry = {
        content: `
<!--SECTION:goals-worked:goals:{"title":"Goals I Worked On"}-->
<h3>Goals I Worked On</h3>
<ul>
  <li><a href="/goals/goal-123">Complete Project X</a></li>
  <li><a href="/goals/goal-456">Learn Spanish</a></li>
</ul>
<!--/SECTION-->
<!--SECTION:progress-rating:scale:{"title":"Progress Satisfaction"}-->
<h3>Progress Satisfaction</h3>
<p>7</p>
<!--/SECTION-->`,
        template: JournalTemplate.GOAL_PROGRESS,
        wordCount: 30,
      };

      render(<JournalEntryRenderer entry={entry} />);

      expect(screen.getByText("Goals I Worked On")).toBeInTheDocument();
      expect(screen.getByText("Goal: goal-123")).toBeInTheDocument();
      expect(screen.getByText("Goal: goal-456")).toBeInTheDocument();
    });

    it("should render creative writing with choice selection", () => {
      const entry = {
        content: `
<!--SECTION:writing-prompt:choice:{"title":"Today's Prompt"}-->
<h3>Today's Prompt</h3>
<p class="selected">A letter to your future self</p>
<!--/SECTION-->
<!--SECTION:creative-content:text:{"title":"Your Creative Writing"}-->
<h3>Your Creative Writing</h3>
<p>Dear Future Me,

I hope this letter finds you well and thriving...</p>
<!--/SECTION-->
<!--SECTION:writing-tags:tags:{"title":"Themes"}-->
<h3>Themes</h3>
<span class="tag">reflection</span>
<span class="tag">hope</span>
<span class="tag">personal-growth</span>
<!--/SECTION-->`,
        template: JournalTemplate.CREATIVE_WRITING,
        wordCount: 50,
      };

      render(<JournalEntryRenderer entry={entry} />);

      // Check choice rendering
      expect(screen.getByText("Today's Prompt")).toBeInTheDocument();
      expect(
        screen.getByText("A letter to your future self"),
      ).toBeInTheDocument();

      // Check tags
      expect(screen.getByText("Themes")).toBeInTheDocument();
      expect(screen.getByText("#reflection")).toBeInTheDocument();
      expect(screen.getByText("#hope")).toBeInTheDocument();
      expect(screen.getByText("#personal-growth")).toBeInTheDocument();
    });
  });

  describe("Legacy Content Support", () => {
    it("should still render legacy daily reflection format", () => {
      const entry = {
        content: `<h3>Today's Emotions</h3>
<p>happy, excited</p>
<h3>Three Things I'm Grateful For</h3>
<p>Family, health, sunshine</p>
<h3>Today's Highlights</h3>
<p>Finished a big project</p>`,
        template: "daily_reflection",
        wordCount: 20,
      };

      render(<JournalEntryRenderer entry={entry} />);

      expect(screen.getByText("Today's Emotions")).toBeInTheDocument();
      expect(screen.getByText("happy, excited")).toBeInTheDocument();
      expect(
        screen.getByText("Three Things I'm Grateful For"),
      ).toBeInTheDocument();
    });

    it("should render plain markdown content", () => {
      const entry = {
        content: `# My Thoughts

This is a **bold** statement and this is *italic*.

- First item
- Second item
- Third item

> This is a quote

[Link to something](https://example.com)`,
        template: JournalTemplate.BLANK,
        wordCount: 30,
      };

      render(<JournalEntryRenderer entry={entry} />);

      expect(screen.getByText("My Thoughts")).toBeInTheDocument();
      expect(screen.getByText("bold", { exact: false })).toBeInTheDocument();
      expect(screen.getByText("First item")).toBeInTheDocument();
      expect(screen.getByText("This is a quote")).toBeInTheDocument();
    });
  });

  describe("Empty Content Handling", () => {
    it("should show placeholder for empty sections", () => {
      const entry = {
        content: `
<!--SECTION:emotions:emotions:{"title":"Today's Emotions"}-->
<h3>Today's Emotions</h3>
<!--/SECTION-->
<!--SECTION:gratitude:text:{"title":"Three Things I'm Grateful For"}-->
<h3>Three Things I'm Grateful For</h3>
<p></p>
<!--/SECTION-->`,
        template: JournalTemplate.DAILY_REFLECTION,
        wordCount: 0,
      };

      render(<JournalEntryRenderer entry={entry} />);

      expect(screen.getByText("No emotions recorded")).toBeInTheDocument();
      expect(screen.getByText("No content added")).toBeInTheDocument();
    });
  });

  describe("Unknown Template Handling", () => {
    it("should render unknown templates gracefully", () => {
      const entry = {
        content: `
<!--SECTION:custom-section:text:{"title":"Custom Section"}-->
<h3>Custom Section</h3>
<p>This is custom content</p>
<!--/SECTION-->`,
        template: "unknown_template",
        wordCount: 10,
      };

      render(<JournalEntryRenderer entry={entry} />);

      expect(screen.getByText("Custom Section")).toBeInTheDocument();
      expect(screen.getByText("This is custom content")).toBeInTheDocument();
    });
  });
});
