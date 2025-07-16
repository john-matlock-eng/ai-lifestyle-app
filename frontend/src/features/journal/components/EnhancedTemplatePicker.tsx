// EnhancedTemplatePicker.tsx - Fixed hover overlay issue
import React, { useState } from "react";
import {
  Sparkles,
  Heart,
  Target,
  BarChart3,
  CheckSquare,
  PenTool,
  FileText,
  Clock,
  Hash,
  Plus,
} from "lucide-react";
import { JournalTemplate } from "@/types/journal";
import { enhancedTemplates } from "../templates/enhanced-templates";
import { getTemplateEstimatedTime } from "../templates/template-utils";
import "./template-picker-override.css";

interface EnhancedTemplatePickerProps {
  onSelect: (templateId: JournalTemplate) => void;
  onCancel?: () => void;
  showBlank?: boolean;
}

const templateCategories = [
  {
    name: "Daily",
    templates: [
      JournalTemplate.DAILY_REFLECTION,
      JournalTemplate.MOOD_TRACKER,
      JournalTemplate.HABIT_TRACKER,
    ],
  },
  {
    name: "Goals & Progress",
    templates: [JournalTemplate.GOAL_PROGRESS],
  },
  {
    name: "Wellness",
    templates: [JournalTemplate.GRATITUDE, JournalTemplate.MOOD_TRACKER],
  },
  {
    name: "Creative",
    templates: [JournalTemplate.CREATIVE_WRITING, JournalTemplate.BLANK],
  },
];

export const EnhancedTemplatePicker: React.FC<EnhancedTemplatePickerProps> = ({
  onSelect,
  onCancel,
  showBlank = true,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [hoveredTemplate, setHoveredTemplate] =
    useState<JournalTemplate | null>(null);

  const filteredTemplates = selectedCategory
    ? templateCategories.find((cat) => cat.name === selectedCategory)
        ?.templates || []
    : (Object.keys(enhancedTemplates) as JournalTemplate[]);

  const getIconComponent = (templateId: JournalTemplate) => {
    switch (templateId) {
      case JournalTemplate.DAILY_REFLECTION:
        return <Sparkles className="w-6 h-6" />;
      case JournalTemplate.GRATITUDE:
        return <Heart className="w-6 h-6" />;
      case JournalTemplate.GOAL_PROGRESS:
        return <Target className="w-6 h-6" />;
      case JournalTemplate.MOOD_TRACKER:
        return <BarChart3 className="w-6 h-6" />;
      case JournalTemplate.HABIT_TRACKER:
        return <CheckSquare className="w-6 h-6" />;
      case JournalTemplate.CREATIVE_WRITING:
        return <PenTool className="w-6 h-6" />;
      default:
        return <FileText className="w-6 h-6" />;
    }
  };

  return (
    <div className="enhanced-template-picker">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-theme mb-2">
          Choose a Journal Template
        </h2>
        <p className="text-muted">
          Select a template to guide your journaling experience
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`
            px-4 py-2 rounded-full text-sm font-medium transition-all
            ${
              selectedCategory === null
                ? "bg-accent text-white"
                : "bg-surface-muted text-muted hover:bg-surface-hover"
            }
          `}
        >
          All Templates
        </button>
        {templateCategories.map((category) => (
          <button
            key={category.name}
            onClick={() => setSelectedCategory(category.name)}
            className={`
              px-4 py-2 rounded-full text-sm font-medium transition-all
              ${
                selectedCategory === category.name
                  ? "bg-accent text-white"
                  : "bg-surface-muted text-muted hover:bg-surface-hover"
              }
            `}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Blank Template Card */}
        {showBlank &&
          (selectedCategory === null || selectedCategory === "Creative") && (
            <div
              onClick={() => onSelect(JournalTemplate.BLANK)}
              onMouseEnter={() => setHoveredTemplate(JournalTemplate.BLANK)}
              onMouseLeave={() => setHoveredTemplate(null)}
              className={`
              template-card group relative
              p-6 rounded-2xl border-2 cursor-pointer
              transition-all duration-300 transform
              ${
                hoveredTemplate === JournalTemplate.BLANK
                  ? "scale-105 shadow-2xl border-accent bg-surface"
                  : "hover:scale-105 hover:shadow-xl border-surface-muted bg-surface hover:bg-surface-hover"
              }
            `}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 rounded-xl bg-surface-muted group-hover:bg-accent/10 transition-colors">
                  <Plus className="w-6 h-6 text-muted group-hover:text-accent" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-theme">
                    Blank Journal
                  </h3>
                  <p className="text-sm text-muted mt-1">
                    Start with a clean slate
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-muted">
                  No structure or prompts - just you and your thoughts. Perfect
                  for free writing.
                </p>

                <div className="flex items-center gap-4 text-xs text-muted">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />1 section
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Any duration
                  </span>
                </div>
              </div>
            </div>
          )}

        {/* Template Cards */}
        {filteredTemplates
          .filter((id) => id !== JournalTemplate.BLANK || !showBlank)
          .map((templateId) => {
            const template = enhancedTemplates[templateId];
            if (!template) return null;

            return (
              <div
                key={templateId}
                onClick={() => onSelect(templateId)}
                onMouseEnter={() => setHoveredTemplate(templateId)}
                onMouseLeave={() => setHoveredTemplate(null)}
                className={`
                  template-card group relative
                  p-6 rounded-2xl border-2 cursor-pointer
                  transition-all duration-300 transform
                  ${
                    hoveredTemplate === templateId
                      ? "scale-105 shadow-2xl bg-surface"
                      : "hover:scale-105 hover:shadow-xl border-surface-muted bg-surface hover:bg-surface-hover"
                  }
                `}
                style={{
                  borderColor:
                    hoveredTemplate === templateId ? template.color : undefined,
                }}
              >
                {/* Template Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="p-3 rounded-xl transition-colors"
                    style={{
                      backgroundColor:
                        hoveredTemplate === templateId
                          ? `${template.color}20`
                          : "rgb(var(--surface-muted))",
                      color:
                        hoveredTemplate === templateId
                          ? template.color
                          : "rgb(var(--muted))",
                    }}
                  >
                    {getIconComponent(templateId)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-theme">
                      {template.name}
                    </h3>
                    <p className="text-sm text-muted mt-1">
                      {template.description}
                    </p>
                  </div>
                </div>

                {/* Template Details */}
                <div className="space-y-3">
                  {/* Section Preview */}
                  <div className="space-y-1">
                    {template.sections.slice(0, 3).map((section, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-xs text-muted"
                      >
                        <div className="w-1 h-1 rounded-full bg-muted" />
                        <span>{section.title}</span>
                      </div>
                    ))}
                    {template.sections.length > 3 && (
                      <div className="text-xs text-muted ml-3">
                        +{template.sections.length - 3} more sections
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {template.sections.length} sections
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />~
                      {getTemplateEstimatedTime(templateId)} min
                    </span>
                  </div>

                  {/* Tags */}
                  {template.extractors?.tags && (
                    <div className="flex flex-wrap gap-1">
                      {template.extractors
                        .tags({})
                        .slice(0, 3)
                        .map((tag) => (
                          <span key={tag} className="tag tag-xs">
                            <Hash className="w-2 h-2" />
                            {tag}
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
      </div>

      {/* Actions */}
      {onCancel && (
        <div className="flex justify-center">
          <button
            onClick={onCancel}
            className="text-muted hover:text-theme transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default EnhancedTemplatePicker;
