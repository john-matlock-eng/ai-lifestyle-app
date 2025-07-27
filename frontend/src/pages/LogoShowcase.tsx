import React from "react";
import { EllieLogo } from "../components/common";

const LogoShowcase: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-12 text-theme">
          Ellie Logo Variations
        </h1>

        {/* Full Logo Sizes */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6 text-theme">Full Logo</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-end">
            <div className="text-center">
              <EllieLogo variant="full" size="sm" />
              <p className="mt-2 text-sm text-muted">Small (60px)</p>
            </div>
            <div className="text-center">
              <EllieLogo variant="full" size="md" />
              <p className="mt-2 text-sm text-muted">Medium (120px)</p>
            </div>
            <div className="text-center">
              <EllieLogo variant="full" size="lg" />
              <p className="mt-2 text-sm text-muted">Large (180px)</p>
            </div>
            <div className="text-center">
              <EllieLogo variant="full" size="xl" />
              <p className="mt-2 text-sm text-muted">XL (240px)</p>
            </div>
          </div>
        </section>

        {/* Icon Sizes */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6 text-theme">
            Icon (Favicon)
          </h2>
          <div className="flex gap-8 items-end">
            <div className="text-center">
              <EllieLogo variant="icon" size="sm" />
              <p className="mt-2 text-sm text-muted">Small (24px)</p>
            </div>
            <div className="text-center">
              <EllieLogo variant="icon" size="md" />
              <p className="mt-2 text-sm text-muted">Medium (32px)</p>
            </div>
            <div className="text-center">
              <EllieLogo variant="icon" size="lg" />
              <p className="mt-2 text-sm text-muted">Large (48px)</p>
            </div>
            <div className="text-center">
              <EllieLogo variant="icon" size="xl" />
              <p className="mt-2 text-sm text-muted">XL (64px)</p>
            </div>
          </div>
        </section>

        {/* Horizontal Logo */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6 text-theme">
            Horizontal Logo
          </h2>
          <div className="space-y-8">
            <div className="bg-white/10 p-6 rounded-lg">
              <EllieLogo variant="horizontal" size="sm" />
              <p className="mt-4 text-sm text-muted">Small (140x40)</p>
            </div>
            <div className="bg-white/10 p-6 rounded-lg">
              <EllieLogo variant="horizontal" size="md" />
              <p className="mt-4 text-sm text-muted">Medium (280x80)</p>
            </div>
            <div className="bg-white/10 p-6 rounded-lg">
              <EllieLogo variant="horizontal" size="lg" />
              <p className="mt-4 text-sm text-muted">Large (420x120)</p>
            </div>
          </div>
        </section>

        {/* Usage Examples */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6 text-theme">
            Usage Examples
          </h2>

          {/* Header Example */}
          <div className="bg-surface rounded-lg p-6 mb-6">
            <header className="flex items-center justify-between">
              <EllieLogo variant="horizontal" size="sm" />
              <nav className="flex gap-6">
                <a href="#" className="text-theme hover:text-accent">
                  Dashboard
                </a>
                <a href="#" className="text-theme hover:text-accent">
                  Goals
                </a>
                <a href="#" className="text-theme hover:text-accent">
                  Journal
                </a>
              </nav>
            </header>
            <p className="mt-4 text-sm text-muted">
              Header with horizontal logo
            </p>
          </div>

          {/* App Icon Example */}
          <div className="bg-surface rounded-lg p-6 mb-6">
            <div className="flex items-center gap-4">
              <EllieLogo variant="icon" size="lg" />
              <div>
                <h3 className="text-lg font-semibold text-theme">
                  AI Lifestyle App
                </h3>
                <p className="text-sm text-muted">
                  Your wellness journey starts here
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted">App icon usage</p>
          </div>

          {/* Loading Screen Example */}
          <div className="bg-surface rounded-lg p-6 flex flex-col items-center justify-center h-64">
            <EllieLogo variant="full" size="md" animated={true} />
            <p className="mt-4 text-theme">
              Loading your wellness dashboard...
            </p>
            <p className="mt-4 text-sm text-muted">
              Loading screen with animated sparkle
            </p>
          </div>
        </section>

        {/* Code Example */}
        <section>
          <h2 className="text-2xl font-semibold mb-6 text-theme">How to Use</h2>
          <div className="bg-surface rounded-lg p-6">
            <pre className="text-sm text-theme overflow-x-auto">
              {`import { EllieLogo } from '@/components/common';

// Full logo
<EllieLogo variant="full" size="lg" />

// Icon for favicon/small spaces
<EllieLogo variant="icon" size="md" />

// Horizontal for headers
<EllieLogo variant="horizontal" size="sm" />

// With animation disabled
<EllieLogo variant="full" size="md" animated={false} />

// With custom className
<EllieLogo variant="icon" size="lg" className="hover:scale-110" />`}
            </pre>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LogoShowcase;
