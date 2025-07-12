import React from "react";
import { Link } from "react-router-dom";
import Button from "../../../../components/common/Button";

const EmptyState: React.FC = () => {
  return (
    <div className="text-center py-12 px-4">
      <div className="max-w-md mx-auto">
        {/* Icon */}
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-primary-100 mb-4">
          <svg
            className="h-8 w-8 text-primary-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
            />
          </svg>
        </div>

        {/* Title */}
        <h3 className="text-lg font-medium text-[var(--text)] mb-2">
          No goals yet
        </h3>

        {/* Description */}
        <p className="text-muted mb-6">
          Start your journey by creating your first goal. Whether it's building
          a new habit, reaching a milestone, or setting limits, we're here to
          help you succeed.
        </p>

        {/* CTA Button */}
        <Link to="/goals/new">
          <Button size="lg" className="inline-flex items-center">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create Your First Goal
          </Button>
        </Link>

        {/* Inspiration Section */}
        <div className="mt-8 grid grid-cols-2 gap-4 text-left">
          <div className="bg-surface-muted rounded-lg p-4">
            <div className="text-2xl mb-2">🏃‍♂️</div>
            <h4 className="font-medium text-[var(--text)] mb-1">Get Active</h4>
            <p className="text-sm text-muted">
              Set a daily step goal or workout routine
            </p>
          </div>
          <div className="bg-surface-muted rounded-lg p-4">
            <div className="text-2xl mb-2">📚</div>
            <h4 className="font-medium text-[var(--text)] mb-1">Learn More</h4>
            <p className="text-sm text-muted">
              Read books or practice a new skill daily
            </p>
          </div>
          <div className="bg-surface-muted rounded-lg p-4">
            <div className="text-2xl mb-2">🧘‍♀️</div>
            <h4 className="font-medium text-[var(--text)] mb-1">
              Find Balance
            </h4>
            <p className="text-sm text-muted">
              Meditate or journal for mental wellness
            </p>
          </div>
          <div className="bg-surface-muted rounded-lg p-4">
            <div className="text-2xl mb-2">💰</div>
            <h4 className="font-medium text-[var(--text)] mb-1">Save Smart</h4>
            <p className="text-sm text-muted">
              Track spending or build savings habits
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmptyState;
