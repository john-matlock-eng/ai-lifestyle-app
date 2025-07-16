// TemplatePickerTest.tsx - Test component to verify glass overlay fixes
import React, { useState } from "react";
import { EnhancedTemplatePicker } from "./EnhancedTemplatePicker";
import { JournalTemplate } from "@/types/journal";

const TemplatePickerTest: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] =
    useState<JournalTemplate | null>(null);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-theme mb-2">
            Template Picker Glass Overlay Fix Test
          </h1>
          <p className="text-muted">
            Hover over the template cards - text should remain fully readable
          </p>
        </div>

        <div className="bg-surface rounded-lg shadow-lg p-6 border border-surface-muted">
          <h2 className="text-xl font-semibold mb-4">✅ Fixed Issues:</h2>
          <ul className="list-disc list-inside space-y-2 text-muted mb-6">
            <li>Removed transparent overlay that covered content on hover</li>
            <li>Changed from gradient backgrounds to solid colors</li>
            <li>Removed glass morphism effects (backdrop-filter blur)</li>
            <li>All backgrounds are now fully opaque</li>
            <li>Text contrast is maintained in all states</li>
          </ul>
        </div>

        <div className="bg-surface rounded-lg shadow-lg p-8 border border-surface-muted">
          <EnhancedTemplatePicker
            onSelect={(template) => {
              setSelectedTemplate(template);
              console.log("Selected template:", template);
            }}
            showBlank={true}
          />
        </div>

        {selectedTemplate && (
          <div className="bg-surface rounded-lg shadow-lg p-6 border border-surface-muted">
            <h2 className="text-xl font-semibold mb-2">Selected Template:</h2>
            <p className="text-accent">{selectedTemplate}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplatePickerTest;
