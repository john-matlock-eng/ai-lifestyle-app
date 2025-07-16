import { describe, it, expect, beforeEach } from "vitest";
import { enhancedJournalContentUtils } from "../../templates/enhanced-template-content-utils";
import type {
  EnhancedTemplate,
  SectionResponse,
} from "../../types/enhanced-template.types";
import type { JournalTemplate } from "@/types/journal";

describe("enhancedJournalContentUtils", () => {
  let mockTemplate: EnhancedTemplate;

  beforeEach(() => {
    mockTemplate = {
      id: "blank" as JournalTemplate,
      name: "Test Template",
      description: "Test",
      sections: [
        {
          id: "text-section",
          title: "Main Content",
          type: "text",
          required: true,
          prompt: "",
        },
        {
          id: "mood-section",
          title: "Current Mood",
          type: "mood",
          required: false,
          options: {
            moods: [
              { value: "happy", label: "Happy", emoji: "😊" },
              { value: "calm", label: "Calm", emoji: "😌" },
            ],
          },
          prompt: "",
        },
        {
          id: "scale-section",
          title: "Energy Level",
          type: "scale",
          required: false,
          options: { min: 1, max: 10 },
          prompt: "",
        },
      ],
    };
  });

  describe("contentToSections", () => {
    it("should parse content with section markers correctly", () => {
      const content = `<article class="journal-entry">
<!--SECTION:text-section:text:{"title":"Main Content","type":"text"}-->
<h3>Main Content</h3>
<div class="section-content">This is my journal entry for today.</div>
<!--/SECTION-->

<!--SECTION:mood-section:mood:{"title":"Current Mood","type":"mood"}-->
<h3>Current Mood</h3>
<p>😊 Happy</p>
<!--/SECTION-->

<!--SECTION:scale-section:scale:{"title":"Energy Level","type":"scale"}-->
<h3>Energy Level</h3>
<p>Rating: 7/10</p>
<!--/SECTION-->
</article>`;

      const sections = enhancedJournalContentUtils.contentToSections(
        mockTemplate,
        content,
      );

      expect(sections).toHaveLength(3);
      expect(sections[0].sectionId).toBe("text-section");
      expect(sections[0].value).toBe("This is my journal entry for today.");
      expect(sections[1].sectionId).toBe("mood-section");
      expect(sections[1].value).toBe("happy");
      expect(sections[2].sectionId).toBe("scale-section");
      expect(sections[2].value).toBe(7);
    });

    it("should handle plain text content without markers", () => {
      const content = "This is plain text content without any markers.";

      const sections = enhancedJournalContentUtils.contentToSections(
        mockTemplate,
        content,
      );

      expect(sections).toHaveLength(3);
      expect(sections[0].sectionId).toBe("text-section");
      expect(sections[0].value).toBe(
        "This is plain text content without any markers.",
      );
      expect(sections[1].value).toBe(""); // mood default
      expect(sections[2].value).toBe(5); // scale default
    });

    it("should handle HTML content without section markers", () => {
      const content = `<p>This is a paragraph.</p>
<p>This is another paragraph.</p>
<ul>
<li>Item 1</li>
<li>Item 2</li>
</ul>`;

      const sections = enhancedJournalContentUtils.contentToSections(
        mockTemplate,
        content,
      );

      expect(sections).toHaveLength(3);
      expect(sections[0].sectionId).toBe("text-section");
      expect(sections[0].value).toContain("This is a paragraph");
      expect(sections[0].value).toContain("This is another paragraph");
      expect(sections[0].value).toContain("Item 1");
    });

    it("should handle content with HTML entities", () => {
      const content = `<!--SECTION:text-section:text:{"title":"Main Content"}-->
<h3>Main Content</h3>
<div class="section-content">Testing &amp; special chars: &lt;tag&gt; &quot;quotes&quot; &#39;apostrophe&#39;</div>
<!--/SECTION-->`;

      const sections = enhancedJournalContentUtils.contentToSections(
        mockTemplate,
        content,
      );

      expect(sections[0].value).toBe(
        "Testing & special chars: <tag> \"quotes\" 'apostrophe'",
      );
    });

    it("should handle malformed section markers gracefully", () => {
      const content = `<!--SECTION:text-section:text:INVALID_JSON-->
<h3>Main Content</h3>
<div>Some content</div>
<!--/SECTION-->`;

      const sections = enhancedJournalContentUtils.contentToSections(
        mockTemplate,
        content,
      );

      expect(sections).toHaveLength(3);
      // The content includes the title since JSON parsing failed
      expect(sections[0].value).toContain("Some content");
    });

    it("should handle empty content", () => {
      const sections = enhancedJournalContentUtils.contentToSections(
        mockTemplate,
        "",
      );

      expect(sections).toHaveLength(3);
      expect(sections[0].value).toBe("");
      expect(sections[1].value).toBe("");
      expect(sections[2].value).toBe(5);
    });
  });

  describe("sectionsToContent", () => {
    it("should convert sections to HTML with markers", () => {
      const sections: SectionResponse[] = [
        {
          sectionId: "text-section",
          value: "This is my content",
          metadata: { wordCount: 4 },
        },
        {
          sectionId: "mood-section",
          value: "happy",
          metadata: {},
        },
        {
          sectionId: "scale-section",
          value: 8,
          metadata: {},
        },
      ];

      const content = enhancedJournalContentUtils.sectionsToContent(
        mockTemplate,
        sections,
      );

      expect(content).toContain('<article class="journal-entry">');
      expect(content).toContain("<!--SECTION:text-section:text:");
      expect(content).toContain("This is my content");
      expect(content).toContain("😊 Happy");
      expect(content).toContain("Rating: 8/10");
    });

    it("should handle empty sections", () => {
      const sections: SectionResponse[] = [
        {
          sectionId: "text-section",
          value: "",
          metadata: {},
        },
      ];

      const content = enhancedJournalContentUtils.sectionsToContent(
        mockTemplate,
        sections,
      );

      expect(content).toContain("<!--SECTION:text-section:text:");
      // Version 2.0 doesn't use div wrapper for empty content
      expect(content).toContain("<h3>Main Content</h3>\n\n<!--/SECTION-->");
    });
  });

  describe("roundtrip conversion", () => {
    it("should preserve content through conversion cycle", () => {
      const originalSections: SectionResponse[] = [
        {
          sectionId: "text-section",
          value: "Test content with\nmultiple lines\nand formatting",
          metadata: {},
        },
        {
          sectionId: "mood-section",
          value: "calm",
          metadata: {},
        },
        {
          sectionId: "scale-section",
          value: 3,
          metadata: {},
        },
      ];

      // Convert to content
      const content = enhancedJournalContentUtils.sectionsToContent(
        mockTemplate,
        originalSections,
      );

      // Parse back to sections
      const parsedSections = enhancedJournalContentUtils.contentToSections(
        mockTemplate,
        content,
      );

      // Check values match
      expect(parsedSections[0].value).toBe(originalSections[0].value);
      expect(parsedSections[1].value).toBe(originalSections[1].value);
      expect(parsedSections[2].value).toBe(originalSections[2].value);
    });
  });
});
