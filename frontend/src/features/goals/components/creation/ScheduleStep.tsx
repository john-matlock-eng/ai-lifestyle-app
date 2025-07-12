import React, { useState } from 'react';
import type { GoalPattern, GoalSchedule } from '../../types/api.types';
import Button from '../../../../components/common/Button';

const days = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

interface ScheduleStepProps {
  pattern: GoalPattern;
  initialValues?: GoalSchedule;
  onComplete: (schedule?: GoalSchedule) => void;
}

const ScheduleStep: React.FC<ScheduleStepProps> = ({ pattern, initialValues, onComplete }) => {
  const [schedule, setSchedule] = useState<GoalSchedule>({
    frequency: initialValues?.frequency || 'daily',
    daysOfWeek: initialValues?.daysOfWeek || [],
    preferredTimes: initialValues?.preferredTimes || [],
    checkInFrequency: initialValues?.checkInFrequency || 'daily',
    allowSkipDays: initialValues?.allowSkipDays,
    catchUpAllowed: initialValues?.catchUpAllowed ?? true,
  });

  const handleDayToggle = (day: number) => {
    setSchedule((prev) => {
      const days = prev.daysOfWeek || [];
      return {
        ...prev,
        daysOfWeek: days.includes(day)
          ? days.filter((d) => d !== day)
          : [...days, day].sort(),
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pattern !== 'recurring') {
      onComplete(undefined);
    } else {
      onComplete(schedule);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-[var(--text)] mb-4">Schedule Your Goal</h3>
        <p className="text-sm text-muted">
          When and how often do you want to work on this goal?
        </p>
      </div>

      {pattern === 'recurring' && (
        <>
          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium text-theme mb-1">
              Frequency
            </label>
            <select
              value={schedule.frequency}
              onChange={(e) =>
                setSchedule({
                  ...schedule,
                  frequency: e.target.value as GoalSchedule['frequency'],
                })
              }
              className="w-full px-3 py-2 border border-[color:var(--surface-muted)] rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {/* Days of week */}
          {schedule.frequency === 'weekly' && (
            <div>
              <label className="block text-sm font-medium text-theme mb-1">
                Days of Week
              </label>
              <div className="flex gap-1">
                {days.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => handleDayToggle(d.value)}
                    className={`w-8 h-8 rounded-full text-sm transition-colors ${schedule.daysOfWeek?.includes(d.value) ? 'bg-primary-600 text-white' : 'bg-[var(--surface-muted)] text-muted hover:bg-gray-200'}`}
                    aria-label={d.label}
                  >
                    {d.label.charAt(0)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Preferred times */}
          <div>
            <label className="block text-sm font-medium text-theme mb-1">
              Preferred Times (optional)
            </label>
            <input
              type="time"
              value={schedule.preferredTimes?.[0] || ''}
              onChange={(e) => setSchedule({ ...schedule, preferredTimes: e.target.value ? [e.target.value] : [] })}
              className="w-full px-3 py-2 border border-[color:var(--surface-muted)] rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </>
      )}

      {/* Check-in frequency */}
      <div>
        <label className="block text-sm font-medium text-theme mb-1">
          Check-in Frequency
        </label>
        <select
          value={schedule.checkInFrequency}
          onChange={(e) =>
            setSchedule({
              ...schedule,
              checkInFrequency: e.target.value as GoalSchedule['checkInFrequency'],
            })
          }
          className="w-full px-3 py-2 border border-[color:var(--surface-muted)] rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      {/* Allow skip days */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-theme mb-1">
            Allow Skip Days
          </label>
          <input
            type="number"
            min="0"
            value={schedule.allowSkipDays ?? 0}
            onChange={(e) => setSchedule({ ...schedule, allowSkipDays: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-[color:var(--surface-muted)] rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="flex items-center gap-2 mt-6 md:mt-0">
          <input
            id="catchUp"
            type="checkbox"
            checked={schedule.catchUpAllowed}
            onChange={(e) => setSchedule({ ...schedule, catchUpAllowed: e.target.checked })}
            className="h-4 w-4 text-primary-600 rounded"
          />
          <label htmlFor="catchUp" className="text-sm text-theme">Allow catch up</label>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit">Continue</Button>
      </div>
    </form>
  );
};

export default ScheduleStep;
