import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts';
import { EncryptionOnboarding } from '../components/EncryptionOnboarding';
import { useEncryption } from '../contexts/useEncryption';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { isEncryptionEnabled } = useEncryption();
  const [showEncryptionBanner, setShowEncryptionBanner] = useState(true);

  // Check if user has dismissed the banner before
  useEffect(() => {
    const dismissed = localStorage.getItem('encryptionBannerDismissed');
    if (dismissed === 'true') {
      setShowEncryptionBanner(false);
    }
  }, []);

  const handleDismissEncryptionBanner = () => {
    setShowEncryptionBanner(false);
    localStorage.setItem('encryptionBannerDismissed', 'true');
  };

  return (
    <div>
      {/* Encryption Onboarding Banner */}
      {showEncryptionBanner && !isEncryptionEnabled && (
        <div className="-mx-4 -mt-6 mb-6 sm:-mx-6 lg:-mx-8">
          <EncryptionOnboarding 
            variant="banner" 
            onDismiss={handleDismissEncryptionBanner} 
          />
        </div>
      )}

      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gradient sm:text-3xl sm:truncate">
            Welcome back, {user?.firstName}!
          </h2>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Stats Cards */}
        <div className="bg-surface overflow-hidden shadow-md rounded-lg hover:shadow-lg transition-all hover-lift border border-surface-muted">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-text-muted truncate">Today's Meals</dt>
                  <dd className="text-lg font-medium text-theme">0</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-surface overflow-hidden shadow-md rounded-lg hover:shadow-lg transition-all hover-lift border border-surface-muted">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-warning-theme" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-text-muted truncate">Workouts This Week</dt>
                  <dd className="text-lg font-medium text-theme">0</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-surface overflow-hidden shadow-md rounded-lg hover:shadow-lg transition-all hover-lift border border-surface-muted">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-error-theme" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-text-muted truncate">Wellness Score</dt>
                  <dd className="text-lg font-medium text-theme">--</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-surface overflow-hidden shadow-md rounded-lg hover:shadow-lg transition-all hover-lift border border-surface-muted">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-success-theme" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-text-muted truncate">Active Routines</dt>
                  <dd className="text-lg font-medium text-theme">0</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h3 className="text-lg leading-6 font-medium text-theme">Quick Actions</h3>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <button className="relative rounded-lg border border-surface-muted bg-surface px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-accent hover:shadow-md focus:outline-none focus:shadow-focus transition-all hover-lift">
            <div className="flex-shrink-0">
              <svg className="h-10 w-10 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <span className="absolute inset-0" aria-hidden="true" />
              <p className="text-sm font-medium text-theme">Log a Meal</p>
              <p className="text-sm text-text-muted">Track your nutrition</p>
            </div>
          </button>

          <button className="relative rounded-lg border border-surface-muted bg-surface px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-accent hover:shadow-md focus:outline-none focus:shadow-focus transition-all hover-lift">
            <div className="flex-shrink-0">
              <svg className="h-10 w-10 text-warning-theme" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <span className="absolute inset-0" aria-hidden="true" />
              <p className="text-sm font-medium text-theme">Start Workout</p>
              <p className="text-sm text-text-muted">Begin exercise session</p>
            </div>
          </button>

          <button className="relative rounded-lg border border-surface-muted bg-surface px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-accent hover:shadow-md focus:outline-none focus:shadow-focus transition-all hover-lift">
            <div className="flex-shrink-0">
              <svg className="h-10 w-10 text-success-theme" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <span className="absolute inset-0" aria-hidden="true" />
              <p className="text-sm font-medium text-theme">Check In</p>
              <p className="text-sm text-text-muted">Daily wellness update</p>
            </div>
          </button>
        </div>
      </div>

      {/* Account Status */}
      <div className="mt-8 bg-surface shadow-md rounded-lg border border-surface-muted">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-theme">Account Status</h3>
          <div className="mt-3 max-w-xl text-sm text-text-muted">
            <p>Your account security status and settings.</p>
          </div>
          <div className="mt-5 space-y-3">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-success-theme mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-text-secondary">
                Email verified: {user?.emailVerified ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex items-center">
              <svg className={`h-5 w-5 ${user?.mfaEnabled ? 'text-success-theme' : 'text-text-disabled'} mr-2`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-text-secondary">
                Two-factor authentication: {user?.mfaEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
