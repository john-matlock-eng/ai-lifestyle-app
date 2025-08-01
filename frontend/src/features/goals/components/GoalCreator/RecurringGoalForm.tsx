import React, { useState } from "react";
import { Repeat, Calendar, Clock, Info } from "lucide-react";
import type {
  Period,
  Frequency,
  RecurringGoalFormData,
  MetricType,
} from "../../types/goal.types";
import { GOAL_CATEGORIES, METRIC_UNITS } from "../../types/goal.types";

interface RecurringGoalFormProps {
  onSubmit: (data: RecurringGoalFormData) => void;
  onCancel: () => void;
  initialData?: Partial<RecurringGoalFormData>;
  isJournalLinked?: boolean;
  setIsJournalLinked?: (value: boolean) => void;
}

const frequencies: { value: Frequency; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const periods: { value: Period; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

const daysOfWeek = [
  { value: 0, label: "Sun", short: "S" },
  { value: 1, label: "Mon", short: "M" },
  { value: 2, label: "Tue", short: "T" },
  { value: 3, label: "Wed", short: "W" },
  { value: 4, label: "Thu", short: "T" },
  { value: 5, label: "Fri", short: "F" },
  { value: 6, label: "Sat", short: "S" },
];

export const RecurringGoalForm: React.FC<RecurringGoalFormProps> = ({
  onSubmit,
  onCancel,
  initialData = {},
  isJournalLinked = false,
  setIsJournalLinked,
}) => {
  const [formData, setFormData] = useState<RecurringGoalFormData>({
    title: "",
    description: "",
    category: "health",
    goalPattern: "recurring",
    targetValue: 1,
    unit: "times",
    period: "day",
    frequency: "daily",
    daysOfWeek: [],
    icon: "🎯",
    color: "#3B82F6",
    ...initialData,
  });

  const [metricType, setMetricType] = useState<MetricType>("count");
  const [includePrivateNotes, setIncludePrivateNotes] = useState(false);
  const [privateNotes, setPrivateNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // For now, we'll just submit the form data without metadata
    // The parent component can handle encryption if needed
    onSubmit(formData);
  };

  const updateFormData = (updates: Partial<RecurringGoalFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const toggleDayOfWeek = (day: number) => {
    const current = formData.daysOfWeek || [];
    if (current.includes(day)) {
      updateFormData({ daysOfWeek: current.filter((d) => d !== day) });
    } else {
      updateFormData({ daysOfWeek: [...current, day].sort() });
    }
  };

  const availableUnits = METRIC_UNITS[metricType] || [];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-[var(--accent-bg)] rounded-lg">
          <Repeat className="h-6 w-6 text-[var(--accent)]" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[var(--text)]">
            Create Recurring Goal
          </h3>
          <p className="text-sm text-[var(--text-muted)]">
            Set up a goal you'll work on regularly
          </p>
        </div>
      </div>

      {/* Goal Title */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-[var(--text)] mb-1"
        >
          Goal Title <span className="text-[var(--error)]">*</span>
        </label>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={(e) => updateFormData({ title: e.target.value })}
          placeholder="e.g., Exercise regularly"
          className="w-full px-3 py-2 border border-[var(--surface-muted)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] bg-[var(--surface)] text-[var(--text)]"
          required
        />
      </div>

      {/* Category */}
      <div>
        <label
          htmlFor="category"
          className="block text-sm font-medium text-[var(--text)] mb-1"
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

      {/* Target Configuration */}
      <div className="bg-[var(--accent-bg)] rounded-lg p-4 space-y-4">
        <h4 className="font-medium text-[var(--text)] flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[var(--accent)]" />
          How often do you want to do this?
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Target Value */}
          <div>
            <label
              htmlFor="targetValue"
              className="block text-sm font-medium text-[var(--text)] mb-1"
            >
              How many
            </label>
            <input
              type="number"
              id="targetValue"
              value={formData.targetValue}
              onChange={(e) =>
                updateFormData({ targetValue: parseInt(e.target.value) || 1 })
              }
              min={1}
              className="w-full px-3 py-2 border border-[var(--surface-muted)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] bg-[var(--surface)] text-[var(--text)]"
              required
            />
          </div>

          {/* Unit */}
          <div>
            <label
              htmlFor="unit"
              className="block text-sm font-medium text-[var(--text)] mb-1"
            >
              Unit
            </label>
            <div className="flex gap-2">
              <select
                value={metricType}
                onChange={(e) => {
                  const newType = e.target.value as MetricType;
                  setMetricType(newType);
                  updateFormData({ unit: METRIC_UNITS[newType][0] || "" });
                }}
                className="flex-1 px-3 py-2 border border-[var(--surface-muted)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] bg-[var(--surface)] text-[var(--text)]"
              >
                <option value="count">Count</option>
                <option value="duration">Duration</option>
                <option value="amount">Amount</option>
                <option value="distance">Distance</option>
              </select>
              <select
                id="unit"
                value={formData.unit}
                onChange={(e) => updateFormData({ unit: e.target.value })}
                className="flex-1 px-3 py-2 border border-[var(--surface-muted)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] bg-[var(--surface)] text-[var(--text)]"
                required
              >
                {availableUnits.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Period */}
          <div>
            <label
              htmlFor="period"
              className="block text-sm font-medium text-[var(--text)] mb-1"
            >
              Per
            </label>
            <select
              id="period"
              value={formData.period}
              onChange={(e) =>
                updateFormData({ period: e.target.value as Period })
              }
              className="w-full px-3 py-2 border border-[var(--surface-muted)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] bg-[var(--surface)] text-[var(--text)]"
              required
            >
              {periods.map((period) => (
                <option key={period.value} value={period.value}>
                  {period.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Frequency */}
        <div>
          <label className="block text-sm font-medium text-[var(--text)] mb-2">
            <Clock className="inline h-4 w-4 mr-1" />
            Frequency
          </label>
          <div className="flex gap-2">
            {frequencies.map((freq) => (
              <label
                key={freq.value}
                className={`flex-1 text-center py-2 px-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  formData.frequency === freq.value
                    ? "border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--accent)]"
                    : "border-[var(--surface-muted)] hover:border-[var(--accent)]/50 bg-[var(--surface)] text-[var(--text)]"
                }`}
              >
                <input
                  type="radio"
                  name="frequency"
                  value={freq.value}
                  checked={formData.frequency === freq.value}
                  onChange={(e) =>
                    updateFormData({ frequency: e.target.value as Frequency })
                  }
                  className="sr-only"
                />
                {freq.label}
              </label>
            ))}
          </div>
        </div>

        {/* Days of Week (for weekly frequency) */}
        {formData.frequency === "weekly" && (
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-2">
              Which days?
            </label>
            <div className="flex gap-1">
              {daysOfWeek.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDayOfWeek(day.value)}
                  className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
                    formData.daysOfWeek?.includes(day.value)
                      ? "bg-[var(--accent)] text-white"
                      : "bg-[var(--surface-muted)] text-[var(--text-muted)] hover:bg-[var(--surface-muted)]/80"
                  }`}
                  aria-label={day.label}
                >
                  {day.short}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Example */}
        <div className="text-sm text-[var(--accent)] bg-[var(--accent-bg)] rounded p-2">
          <strong>Goal:</strong> {formData.targetValue} {formData.unit} per{" "}
          {formData.period}
          {formData.frequency === "weekly" &&
            formData.daysOfWeek &&
            formData.daysOfWeek.length > 0 && (
              <span>
                {" "}
                on{" "}
                {formData.daysOfWeek.map((d) => daysOfWeek[d].label).join(", ")}
              </span>
            )}
        </div>
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-[var(--text)] mb-1"
        >
          Description (optional)
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => updateFormData({ description: e.target.value })}
          placeholder="Add more details about your goal..."
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
          <span className="text-sm font-medium text-[var(--text)]">
            Add private encrypted notes
          </span>
          <Info className="h-4 w-4 text-[var(--text-muted)]" />
        </label>

        {includePrivateNotes && (
          <div className="mt-3">
            <textarea
              value={privateNotes}
              onChange={(e) => setPrivateNotes(e.target.value)}
              placeholder="Your motivation, obstacles, or personal thoughts (encrypted)..."
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
            className="h-4 w-4 text-[var(--accent)] focus:ring-[var(--accent)] border-[var(--surface-muted)] rounded"
          />
          <label
            htmlFor="journal-linked"
            className="text-sm text-[var(--text)]"
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
          className="px-4 py-2 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg)] transition-colors"
        >
          Create Goal
        </button>
      </div>
    </form>
  );
};
