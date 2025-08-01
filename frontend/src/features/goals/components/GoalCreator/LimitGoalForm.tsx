import React, { useState } from "react";
import { ShieldAlert, TrendingDown, AlertTriangle, Info } from "lucide-react";
import type {
  LimitGoalFormData,
  Period,
  MetricType,
} from "../../types/goal.types";
import { GOAL_CATEGORIES, METRIC_UNITS } from "../../types/goal.types";
import { useEncryption } from "../../../../hooks/useEncryption";

interface LimitGoalFormProps {
  onSubmit: (data: LimitGoalFormData) => void;
  onCancel: () => void;
  initialData?: Partial<LimitGoalFormData>;
  isJournalLinked?: boolean;
  setIsJournalLinked?: (value: boolean) => void;
}

const commonLimitGoals = [
  {
    title: "Screen Time Limit",
    limitValue: 120,
    unit: "minutes",
    period: "day",
    icon: "📱",
  },
  {
    title: "Daily Calorie Limit",
    limitValue: 2000,
    unit: "calories",
    period: "day",
    icon: "🍔",
  },
  {
    title: "Weekly Spending Limit",
    limitValue: 200,
    unit: "$",
    period: "week",
    icon: "💳",
  },
  {
    title: "Coffee Intake",
    limitValue: 2,
    unit: "cups",
    period: "day",
    icon: "☕",
  },
  {
    title: "Social Media Time",
    limitValue: 30,
    unit: "minutes",
    period: "day",
    icon: "📲",
  },
  {
    title: "Monthly Dining Out",
    limitValue: 100,
    unit: "$",
    period: "month",
    icon: "🍽️",
  },
];

export const LimitGoalForm: React.FC<LimitGoalFormProps> = ({
  onSubmit,
  onCancel,
  initialData = {},
  isJournalLinked = false,
  setIsJournalLinked,
}) => {
  const { encrypt } = useEncryption("goals");

  const [formData, setFormData] = useState<LimitGoalFormData>({
    title: "",
    description: "",
    category: "lifestyle",
    goalPattern: "limit",
    limitValue: 0,
    unit: "minutes",
    period: "day",
    targetType: "maximum",
    icon: "🛡️",
    color: "var(--error)",
    ...initialData,
  });

  const [metricType, setMetricType] = useState<MetricType>("duration");
  const [includePrivateNotes, setIncludePrivateNotes] = useState(false);
  const [privateNotes, setPrivateNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let dataToSubmit = { ...formData };

    if (includePrivateNotes && privateNotes) {
      const encrypted = await encrypt({ notes: privateNotes });
      // Store encrypted notes separately or in a different way
      // For now, we'll include it in the description
      dataToSubmit = {
        ...dataToSubmit,
        description:
          dataToSubmit.description +
          `\n\n[ENCRYPTED_NOTES]${JSON.stringify(encrypted)}`,
      };
    }

    onSubmit(dataToSubmit);
  };

  const updateFormData = (updates: Partial<LimitGoalFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const selectTemplate = (template: (typeof commonLimitGoals)[0]) => {
    updateFormData({
      title: template.title,
      limitValue: template.limitValue,
      unit: template.unit,
      period: template.period as Period,
    });

    // Set appropriate metric type based on unit
    if (template.unit === "minutes" || template.unit === "hours") {
      setMetricType("duration");
    } else if (template.unit === "$") {
      setMetricType("money");
    } else if (template.unit === "calories") {
      setMetricType("calories");
    } else {
      setMetricType("amount");
    }
  };

  const availableUnits = METRIC_UNITS[metricType] || [];

  const periods: { value: Period; label: string }[] = [
    { value: "day", label: "Day" },
    { value: "week", label: "Week" },
    { value: "month", label: "Month" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-[var(--error-bg)] rounded-lg">
          <ShieldAlert className="h-6 w-6 text-[var(--accent)]" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[var(--text)]">
            Create Limit Goal
          </h3>
          <p className="text-sm text-[var(--text-muted)]">
            Set boundaries to stay within healthy limits
          </p>
        </div>
      </div>

      {/* Quick Templates */}
      <div className="bg-[var(--surface-muted)] rounded-lg p-4">
        <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-3">
          <TrendingDown className="inline h-4 w-4 mr-1 text-[var(--accent)]" />
          Common Limits
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {commonLimitGoals.map((template, index) => (
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
                    Max {template.limitValue} {template.unit}/{template.period}
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
          Goal Title <span className="text-[var(--accent)]">*</span>
        </label>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={(e) => updateFormData({ title: e.target.value })}
          placeholder="e.g., Limit screen time"
          className="w-full px-3 py-2 border border-[var(--surface-muted)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
          required
        />
      </div>

      {/* Category */}
      <div>
        <label
          htmlFor="category"
          className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
        >
          Category <span className="text-[var(--accent)]">*</span>
        </label>
        <select
          id="category"
          value={formData.category}
          onChange={(e) => updateFormData({ category: e.target.value })}
          className="w-full px-3 py-2 border border-[var(--surface-muted)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
          required
        >
          {GOAL_CATEGORIES.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Limit Configuration */}
      <div className="bg-[var(--surface-muted)] rounded-lg p-4 space-y-4">
        <h4 className="font-medium text-[var(--text)] flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-[var(--accent)]" />
          Set your limit
        </h4>

        {/* Limit Type */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            Limit Type
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => updateFormData({ targetType: "maximum" })}
              className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                formData.targetType === "maximum"
                  ? "border-[var(--accent)] bg-[var(--surface-muted)] text-[var(--accent)]"
                  : "border-[color:var(--surface-muted)] hover:border-[color:var(--surface-muted)]"
              }`}
            >
              Maximum (stay under)
            </button>
            <button
              type="button"
              onClick={() => updateFormData({ targetType: "minimum" })}
              className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                formData.targetType === "minimum"
                  ? "border-[var(--accent)] bg-[var(--surface-muted)] text-[var(--accent)]"
                  : "border-[color:var(--surface-muted)] hover:border-[color:var(--surface-muted)]"
              }`}
            >
              Minimum (stay above)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Limit Value */}
          <div>
            <label
              htmlFor="limitValue"
              className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
            >
              {formData.targetType === "maximum" ? "Maximum" : "Minimum"} Value
            </label>
            <input
              type="number"
              id="limitValue"
              value={formData.limitValue}
              onChange={(e) =>
                updateFormData({ limitValue: parseFloat(e.target.value) || 0 })
              }
              min={0}
              step="0.1"
              className="w-full px-3 py-2 border border-[color:var(--surface-muted)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
              required
            />
          </div>

          {/* Unit */}
          <div>
            <label
              htmlFor="unit"
              className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
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
                className="flex-1 px-3 py-2 border border-[var(--surface-muted)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
              >
                <option value="duration">Duration</option>
                <option value="amount">Amount</option>
                <option value="calories">Calories</option>
                <option value="money">Money</option>
                <option value="count">Count</option>
              </select>
              <select
                id="unit"
                value={formData.unit}
                onChange={(e) => updateFormData({ unit: e.target.value })}
                className="flex-1 px-3 py-2 border border-[var(--surface-muted)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
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
              className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
            >
              Per
            </label>
            <select
              id="period"
              value={formData.period}
              onChange={(e) =>
                updateFormData({ period: e.target.value as Period })
              }
              className="w-full px-3 py-2 border border-[color:var(--surface-muted)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
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

        {/* Limit Summary */}
        <div className="bg-[var(--error-bg)] rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-[var(--accent)]" />
            <span className="font-medium text-[var(--text)]">Your Limit</span>
          </div>

          <div className="text-lg font-semibold text-[var(--text)]">
            {formData.targetType === "maximum" ? "Stay under" : "Stay above"}{" "}
            <span className="text-[var(--accent)]">{formData.limitValue}</span>{" "}
            {formData.unit} per {formData.period}
          </div>

          <div className="text-sm text-[var(--accent)]">
            {formData.targetType === "maximum"
              ? `You'll be notified when approaching this limit`
              : `You'll be reminded to meet this minimum requirement`}
          </div>

          {/* Visual representation */}
          <div className="mt-3 pt-3 border-t border-[var(--surface-muted)]">
            <div className="flex items-center justify-between text-xs text-[var(--accent)] mb-1">
              <span>Safe Zone</span>
              <span>Warning</span>
              <span>
                {formData.targetType === "maximum"
                  ? "Over Limit"
                  : "Under Limit"}
              </span>
            </div>
            <div className="h-2 bg-gradient-to-r from-[var(--success)] via-[var(--warning)] to-[var(--error)] rounded-full" />
          </div>
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
          placeholder="Why is this limit important? What are you trying to achieve?"
          rows={3}
          className="w-full px-3 py-2 border border-[var(--surface-muted)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
        />
      </div>

      {/* Private Notes */}
      <div className="border-t pt-4">
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
              placeholder="Your triggers, alternatives, or coping strategies (encrypted)..."
              rows={3}
              className="w-full px-3 py-2 border border-[color:var(--surface-muted)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
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
            className="text-sm text-[var(--text-secondary)]"
          >
            Link this goal to journaling
          </label>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text)]"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[color:var(--bg)]"
        >
          Create Goal
        </button>
      </div>
    </form>
  );
};
