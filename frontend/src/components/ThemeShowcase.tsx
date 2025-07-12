import React from 'react';
import Button from './common/Button';

const ThemeShowcase: React.FC = () => {
  return (
    <div className="p-8 space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold text-gradient animate-float">
          Enhanced Theme System
        </h1>
        <p className="text-xl text-secondary">
          Experience the power of modern, vibrant themes
        </p>
      </div>

      {/* Color Palette */}
      <div className="glass p-6 rounded-xl space-y-4">
        <h2 className="text-2xl font-semibold text-theme">Color Palette</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="h-20 rounded-lg bg-gradient" />
            <p className="text-sm text-muted">Background</p>
          </div>
          <div className="space-y-2">
            <div className="h-20 rounded-lg bg-surface border border-surface-muted" />
            <p className="text-sm text-muted">Surface</p>
          </div>
          <div className="space-y-2">
            <div className="h-20 rounded-lg bg-accent glow" />
            <p className="text-sm text-muted">Accent</p>
          </div>
          <div className="space-y-2">
            <div className="h-20 rounded-lg bg-gradient-to-r from-[var(--success)] via-[var(--warning)] to-[var(--error)]" />
            <p className="text-sm text-muted">Status Colors</p>
          </div>
        </div>
      </div>

      {/* Buttons Showcase */}
      <div className="bg-surface p-6 rounded-xl hover-lift space-y-4">
        <h2 className="text-2xl font-semibold text-theme">Interactive Elements</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" className="animate-pulse-glow">
            Primary Action
          </Button>
          <Button variant="secondary">
            Secondary
          </Button>
          <Button variant="outline">
            Outline
          </Button>
          <Button variant="ghost">
            Ghost Button
          </Button>
          <Button variant="danger">
            Danger
          </Button>
        </div>
      </div>

      {/* Goal Card Example */}
      <div className="bg-surface p-6 rounded-xl border-l-4 border-accent hover:shadow-lg transition-all duration-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🎯</span>
              <h3 className="font-semibold text-lg text-theme">Daily Exercise Goal</h3>
              <span className="text-xs px-2 py-1 bg-surface-muted text-muted rounded-full">
                Fitness
              </span>
            </div>
            <p className="text-secondary mb-3">Complete 30 minutes of cardio</p>
            
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Progress</span>
                <span className="text-accent font-medium">75%</span>
              </div>
              <div className="h-2 bg-surface-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-hover)] animate-shimmer"
                  style={{ width: '75%' }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-4">
              <Button variant="primary" size="sm">
                + Log Activity
              </Button>
              <Button variant="ghost" size="sm">
                View Details
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Status Examples */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-success-bg border border-[var(--success)] p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[var(--success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium text-[var(--success)]">Success!</span>
          </div>
          <p className="text-sm text-[var(--success)] mt-1">Goal completed successfully</p>
        </div>
        
        <div className="bg-warning-bg border border-[var(--warning)] p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[var(--warning)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="font-medium text-[var(--warning)]">Warning</span>
          </div>
          <p className="text-sm text-[var(--warning)] mt-1">Approaching deadline</p>
        </div>
        
        <div className="bg-error-bg border border-[var(--error)] p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[var(--error)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="font-medium text-[var(--error)]">Error</span>
          </div>
          <p className="text-sm text-[var(--error)] mt-1">Failed to sync data</p>
        </div>
      </div>

      {/* Form Elements */}
      <div className="glass p-6 rounded-xl space-y-4">
        <h2 className="text-2xl font-semibold text-theme">Form Elements</h2>
        <div className="space-y-3 max-w-md">
          <input
            type="text"
            placeholder="Enter your goal title..."
            className="form-input"
          />
          <textarea
            placeholder="Describe your goal..."
            rows={3}
            className="form-textarea"
          />
          <select className="form-select">
            <option>Select category</option>
            <option>Health & Fitness</option>
            <option>Personal Development</option>
            <option>Career</option>
          </select>
        </div>
      </div>

      {/* Special Effects */}
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-semibold text-theme">Special Effects</h2>
        <div className="flex justify-center gap-4">
          <div className="p-8 bg-surface rounded-xl glow hover-lift">
            <p className="text-gradient font-bold">Glow Effect</p>
          </div>
          <div className="p-8 glass rounded-xl hover-lift">
            <p className="font-bold text-theme">Glass Morphism</p>
          </div>
          <div className="p-8 bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] rounded-xl text-white hover-lift animate-pulse-glow">
            <p className="font-bold">Gradient + Pulse</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeShowcase;
