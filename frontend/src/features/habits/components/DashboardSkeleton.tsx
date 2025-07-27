import React from "react";

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen animate-pulse">
      {/* Header Skeleton */}
      <div className="glass shadow-md border-b border-surface-muted mb-6 -mx-4 -mt-6 sm:-mx-6 lg:-mx-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <div className="h-8 bg-surface-muted rounded-md w-64 mb-2"></div>
              <div className="h-4 bg-surface-muted rounded-md w-48"></div>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-4">
              <div className="h-16 w-24 bg-surface-muted rounded-lg"></div>
              <div className="h-16 w-24 bg-surface-muted rounded-lg"></div>
              <div className="h-16 w-24 bg-surface-muted rounded-lg"></div>
            </div>
          </div>

          {/* Level Progress Skeleton */}
          <div className="mt-4">
            <div className="flex justify-between mb-1">
              <div className="h-3 bg-surface-muted rounded-md w-16"></div>
              <div className="h-3 bg-surface-muted rounded-md w-24"></div>
            </div>
            <div className="h-2 bg-surface-muted rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Habit Tracker Skeleton */}
        <div className="lg:col-span-2">
          <div className="h-8 bg-surface-muted rounded-md w-48 mb-6"></div>

          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="glass rounded-lg p-4 border border-surface-muted"
              >
                <div className="h-8 bg-surface-muted rounded-md mb-2"></div>
                <div className="h-6 bg-surface-muted rounded-md w-16"></div>
              </div>
            ))}
          </div>

          {/* Progress Bar Skeleton */}
          <div className="glass rounded-lg p-4 border border-surface-muted mb-6">
            <div className="h-4 bg-surface-muted rounded-md w-32 mb-2"></div>
            <div className="h-4 bg-surface-muted rounded-full"></div>
          </div>

          {/* Habit Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="glass rounded-xl border-2 border-surface-muted p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-surface-muted rounded-lg"></div>
                    <div>
                      <div className="h-5 bg-surface-muted rounded-md w-32 mb-2"></div>
                      <div className="h-3 bg-surface-muted rounded-md w-20"></div>
                    </div>
                  </div>
                </div>
                <div className="h-12 bg-surface-muted rounded-md mb-4"></div>
                <div className="flex justify-between mb-4">
                  {[...Array(7)].map((_, j) => (
                    <div
                      key={j}
                      className="w-8 h-8 bg-surface-muted rounded-full"
                    ></div>
                  ))}
                </div>
                <div className="h-10 bg-surface-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Skeleton */}
        <div className="space-y-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="glass rounded-lg p-4 border border-surface-muted"
            >
              <div className="h-5 bg-surface-muted rounded-md w-32 mb-3"></div>
              <div className="space-y-2">
                <div className="h-16 bg-surface-muted rounded-md"></div>
                <div className="h-16 bg-surface-muted rounded-md"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
