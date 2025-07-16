import React, { useState } from "react";
import { enhancedJournalContentUtils } from "../../templates/enhanced-template-content-utils";
import { enhancedTemplates } from "../../templates/enhanced-templates";
import type { SectionResponse } from "../../types/enhanced-template.types";

export const JournalParsingDebug: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] =
    useState<string>("daily_reflection");
  const [inputContent, setInputContent] = useState<string>("");
  const [parsedSections, setParsedSections] = useState<
    SectionResponse[] | null
  >(null);
  const [convertedContent, setConvertedContent] = useState<string>("");
  const [error, setError] = useState<string>("");

  const template =
    enhancedTemplates[selectedTemplate as keyof typeof enhancedTemplates];

  if (!template) {
    return (
      <div className="p-4 space-y-4 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-bold">Journal Parsing Debug Tool</h2>
        <p className="text-red-600">
          Error: Template not found for key: {selectedTemplate}
        </p>
      </div>
    );
  }

  const testParsing = () => {
    try {
      setError("");

      // Test contentToSections
      console.log("=== PARSING DEBUG START ===");
      console.log("Template:", template.name);
      console.log("Input content:", inputContent);

      const sections = enhancedJournalContentUtils.contentToSections(
        template,
        inputContent,
      );
      console.log("Parsed sections:", sections);
      setParsedSections(sections);

      // Test sectionsToContent
      const content = enhancedJournalContentUtils.sectionsToContent(
        template,
        sections,
      );
      console.log("Converted content:", content);
      setConvertedContent(content);

      console.log("=== PARSING DEBUG END ===");
    } catch (err) {
      console.error("Parsing error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const loadSampleContent = (
    type: "with-markers" | "plain-text" | "legacy",
  ) => {
    const samples = {
      "with-markers": `<article class="journal-entry">
<!--SECTION:gratitude:text:{"title":"Morning Gratitude","type":"text","completedAt":"2024-01-15T10:00:00Z"}-->
<h3>Morning Gratitude</h3>
<div class="section-content">I'm grateful for the sunny morning and the coffee that started my day perfectly. Also thankful for my supportive team at work.</div>
<!--/SECTION-->

<!--SECTION:mood:mood:{"title":"Current Mood","type":"mood","completedAt":"2024-01-15T10:05:00Z"}-->
<h3>Current Mood</h3>
<p>😊 Happy</p>
<!--/SECTION-->

<!--SECTION:energy:scale:{"title":"Energy Level","type":"scale","completedAt":"2024-01-15T10:06:00Z"}-->
<h3>Energy Level</h3>
<p>Rating: 8/10</p>
<!--/SECTION-->
</article>`,

      "plain-text": `Today was a great day! I accomplished a lot at work and had a nice evening with family.

I'm feeling very grateful for all the opportunities I have.

Energy is high and I'm ready for tomorrow's challenges.`,

      legacy: `## Morning Gratitude

I'm grateful for the sunny morning and the coffee that started my day perfectly. Also thankful for my supportive team at work.

---

## Current Mood

😊 Happy

---

## Energy Level

Rating: 8/10`,
    };

    setInputContent(samples[type]);
  };

  return (
    <div className="p-4 space-y-4 bg-gray-50 rounded-lg">
      <h2 className="text-xl font-bold">Journal Parsing Debug Tool</h2>

      {/* Template Selection */}
      <div>
        <label className="block text-sm font-medium mb-2">Template</label>
        <select
          value={selectedTemplate}
          onChange={(e) => setSelectedTemplate(e.target.value)}
          className="w-full p-2 border rounded"
        >
          {Object.keys(enhancedTemplates).map((key) => (
            <option key={key} value={key}>
              {enhancedTemplates[key as keyof typeof enhancedTemplates].name}
            </option>
          ))}
        </select>
      </div>

      {/* Sample Content Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => loadSampleContent("with-markers")}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Load With Markers
        </button>
        <button
          onClick={() => loadSampleContent("plain-text")}
          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Load Plain Text
        </button>
        <button
          onClick={() => loadSampleContent("legacy")}
          className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Load Legacy Format
        </button>
      </div>

      {/* Input Content */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Input Content (HTML)
        </label>
        <textarea
          value={inputContent}
          onChange={(e) => setInputContent(e.target.value)}
          className="w-full h-40 p-2 border rounded font-mono text-sm"
          placeholder="Paste journal entry content here..."
        />
      </div>

      {/* Test Button */}
      <button
        onClick={testParsing}
        className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
      >
        Test Parsing
      </button>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      {/* Parsed Sections */}
      {parsedSections && (
        <div>
          <h3 className="font-bold mb-2">Parsed Sections:</h3>
          <pre className="p-3 bg-gray-800 text-white rounded overflow-auto text-sm">
            {JSON.stringify(parsedSections, null, 2)}
          </pre>
        </div>
      )}

      {/* Converted Content */}
      {convertedContent && (
        <div>
          <h3 className="font-bold mb-2">Re-converted Content:</h3>
          <div className="p-3 bg-white border rounded">
            <pre className="whitespace-pre-wrap font-mono text-sm">
              {convertedContent}
            </pre>
          </div>
        </div>
      )}

      {/* Template Structure */}
      <div>
        <h3 className="font-bold mb-2">Template Structure:</h3>
        <pre className="p-3 bg-gray-800 text-white rounded overflow-auto text-sm">
          {JSON.stringify(
            template?.sections?.map((s) => ({
              id: s.id,
              title: s.title,
              type: s.type,
              required: s.required,
            })) || [],
            null,
            2,
          )}
        </pre>
      </div>
    </div>
  );
};
