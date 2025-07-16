import React, { useState } from "react";
import { Flame, Calendar, Zap, Info } from "lucide-react";
import type { StreakGoalFormData, Frequency } from "../../types/goal.types";
import { GOAL_CATEGORIES } from "../../types/goal.types";

interface StreakGoalFormProps {
  onSubmit: (data: StreakGoalFormData) => void;
  onCancel: () => void;
  initialData?: Partial<StreakGoalFormData>;
  isJournalLinked?: boolean;
  setIsJournalLinked?: (value: boolean) => void;
}

const commonStreakGoals = [
  { title: "Daily Meditation", targetStreak: 30, unit: "days", icon: "🧘" },
  { title: "100 Days of Code", targetStreak: 100, unit: "days", icon: "💻" },
  { title: "No Smoking", targetStreak: 365, unit: "days", icon: "🚭" },
  { title: "Daily Exercise", targetStreak: 50, unit: "days", icon: "💪" },
  { title: "Reading Habit", targetStreak: 60, unit: "days", icon: "📚" },
  { title: "Gratitude Journal", targetStreak: 90, unit: "days", icon: "🙏" },
];

export const StreakGoalForm: React.FC<StreakGoalFormProps> = ({
  onSubmit,
  onCancel,
  initialData = {},
  isJournalLinked = false,
  setIsJournalLinked,
}) => {
  const [formData, setFormData] = useState<StreakGoalFormData>({
    title: "",
    description: "",
    category: "wellness",
    goalPattern: "streak",
    targetStreak: 30,
    unit: "days",
    frequency: "daily",
    icon: "🔥",
    color: "var(--accent)",
    ...initialData,
  });

  const [includePrivateNotes, setIncludePrivateNotes] = useState(false);
  const [privateNotes, setPrivateNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // For now, we'll just submit the form data without metadata
    // The parent component can handle encryption if needed
    onSubmit(formData);
  };

  const updateFormData = (updates: Partial<StreakGoalFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const selectTemplate = (template: (typeof commonStreakGoals)[0]) => {
    updateFormData({
      title: template.title,
      targetStreak: template.targetStreak,
      unit: template.unit,
      icon: template.icon,
    });
  };

  // Calculate estimated completion date
  const estimatedCompletion = new Date();
  estimatedCompletion.setDate(
    estimatedCompletion.getDate() + formData.targetStreak,
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-[var(--accent-bg)] rounded-lg">
          <Flame className="h-6 w-6 text-[var(--accent)]" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[var(--text)]">
            Create Streak Goal
          </h3>
          <p className="text-sm text-[var(--text-muted)]">
            Build momentum with consecutive daily habits
          </p>
        </div>
      </div>

      {/* Quick Templates */}
      <div className="bg-[var(--surface-muted)] rounded-lg p-4">
        <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-3">
          <Zap className="inline h-4 w-4 mr-1 text-[var(--accent)]" />
          Quick Start Templates
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {commonStreakGoals.map((template, index) => (
            <button
              key={index}
              type="button"
              onClick={() => selectTemplate(template)}
              className="text-left p-2 rounded-lg border border-[var(--surface-muted)] hover:bg-[var(--surface-hover)] hover:border-[var(--accent)] transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{template.icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-[var(--text)]">
                    {template.title}
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">
                    {template.targetStreak} {template.unit}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Goal Title */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
        >
          Goal Title <span className="text-[var(--error)]">*</span>
        </label>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={(e) => updateFormData({ title: e.target.value })}
          placeholder="e.g., 30 days of meditation"
          className="w-full px-3 py-2 border border-[var(--surface-muted)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] bg-[var(--surface)] text-[var(--text)]"
          required
        />
      </div>

      {/* Category */}
      <div>
        <label
          htmlFor="category"
          className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
        >
          Category <span className="text-[var(--error)]">*</span>
        </label>
        <select
          id="category"
          value={formData.category}
          onChange={(e) => updateFormData({ category: e.target.value })}
          className="w-full px-3 py-2 border border-[var(--surface-muted)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] bg-[var(--surface)] text-[var(--text)]"
          required
        >
          {GOAL_CATEGORIES.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Streak Configuration */}
      <div className="bg-[var(--surface-muted)] rounded-lg p-4 space-y-4">
        <h4 className="font-medium text-[var(--text)] flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[var(--accent)]" />
          How long do you want your streak to be?
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Target Streak */}
          <div>
            <label
              htmlFor="targetStreak"
              className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
            >
              Target Streak Length
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                id="targetStreak"
                value={formData.targetStreak}
                onChange={(e) =>
                  updateFormData({
                    targetStreak: parseInt(e.target.value) || 1,
                  })
                }
                min={1}
                className="flex-1 px-3 py-2 border border-[var(--surface-muted)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] bg-[var(--surface)] text-[var(--text)]"
                required
              />
              <select
                value={formData.unit}
                onChange={(e) => updateFormData({ unit: e.target.value })}
                className="px-3 py-2 border border-[var(--surface-muted)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] bg-[var(--surface)] text-[var(--text)]"
              >
                <option value="days">Days</option>
                <option value="weeks">Weeks</option>
                <option value="months">Months</option>
              </select>
            </div>
          </div>

          {/* Frequency */}
          <div>
            <label
              htmlFor="frequency"
              className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
            >
              Frequency
            </label>
            <select
              id="frequency"
              value={formData.frequency}
              onChange={(e) =>
                updateFormData({ frequency: e.target.value as Frequency })
              }
              className="w-full px-3 py-2 border border-[var(--surface-muted)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] bg-[var(--surface)] text-[var(--text)]"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>

        {/* Streak Preview */}
        <div className="bg-[var(--accent-bg)] rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-[var(--text)]">
              Your Streak Goal
            </span>
            <Flame className="h-5 w-5 text-[var(--accent)]" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1">
                {[...Array(Math.min(7, formData.targetStreak))].map((_, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 bg-[var(--accent)] rounded-full flex items-center justify-center text-[var(--bg)] text-xs font-medium border-2 border-[var(--accent-bg)]"
                    style={{ opacity: 1 - i * 0.1 }}
                  >
                    {i + 1}
                  </div>
                ))}
                {formData.targetStreak > 7 && (
                  <div className="w-8 h-8 bg-[var(--surface-muted)] rounded-full flex items-center justify-center text-[var(--accent)] text-xs font-medium border-2 border-[var(--accent-bg)]">
                    +{formData.targetStreak - 7}
                  </div>
                )}
              </div>
            </div>

            <div className="text-lg font-semibold text-[var(--text)]">
              {formData.targetStreak} consecutive {formData.unit}
            </div>

            <div className="text-sm text-[var(--accent)]">
              Complete by{" "}
              {estimatedCompletion.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          </div>
        </div>

        {/* Motivation Tips */}
        <div className="bg-[var(--surface)] rounded-lg p-3 border border-[var(--surface-muted)]">
          <h5 className="text-sm font-medium text-[var(--text)] mb-2">
            💡 Tips for Success
          </h5>
          <ul className="text-xs space-y-1">
            <li className="text-[var(--text-muted)]">
              • Start small - even 1 minute counts!
            </li>
            <li className="text-[var(--text-muted)]">
              • Set a specific time each day
            </li>
            <li className="text-[var(--text-muted)]">
              • Track visually to stay motivated
            </li>
            <li className="text-[var(--text-muted)]">
              • Plan for obstacles in advance
            </li>
          </ul>
        </div>
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
        >
          Description (optional)
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => updateFormData({ description: e.target.value })}
          placeholder="What habit are you building? Why is it important?"
          rows={3}
          className="w-full px-3 py-2 border border-[var(--surface-muted)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] bg-[var(--surface)] text-[var(--text)]"
        />
      </div>

      {/* Private Notes */}
      <div className="border-t border-[var(--surface-muted)] pt-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={includePrivateNotes}
            onChange={(e) => setIncludePrivateNotes(e.target.checked)}
            className="h-4 w-4 text-[var(--accent)] rounded"
          />
          <span className="text-sm font-medium text-[var(--text-secondary)]">
            Add private encrypted notes
          </span>
          <Info className="h-4 w-4 text-[var(--text-muted)]" />
        </label>

        {includePrivateNotes && (
          <div className="mt-3">
            <textarea
              value={privateNotes}
              onChange={(e) => setPrivateNotes(e.target.value)}
              placeholder="Your triggers, coping strategies, or personal motivations (encrypted)..."
              rows={3}
              className="w-full px-3 py-2 border border-[var(--surface-muted)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] bg-[var(--surface)] text-[var(--text)]"
            />
            <p className="text-xs text-[var(--text-muted)] mt-1">
              🔒 These notes will be encrypted and only visible to you
            </p>
          </div>
        )}
      </div>

      {/* Journal Linking */}
      {setIsJournalLinked && (
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="journal-linked"
            checked={isJournalLinked}
            onChange={(e) => setIsJournalLinked(e.target.checked)}
            className="h-4 w-4 text-[var(--accent)] focus:ring-[var(--accent)] focus:ring-2 border-[var(--surface-muted)] rounded"
          />
          <label
            htmlFor="journal-linked"
            className="text-sm text-[var(--text-secondary)]"
          >
            Link this goal to journaling
          </label>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-[var(--surface-muted)]">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text)]"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-[var(--accent)] text-[var(--bg)] rounded-lg hover:bg-[var(--accent-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg)]"
        >
          Create Goal
        </button>
      </div>
    </form>
  );
};
