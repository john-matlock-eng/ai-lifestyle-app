import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { ThemeSwitcher } from '../components/common';
import EncryptionSettings from './settings/EncryptionSettings';

const SettingsPage: React.FC = () => {
  const location = useLocation();
  const encryptionRef = useRef<HTMLDivElement>(null);

  // Scroll to encryption section if navigated from onboarding
  useEffect(() => {
    if (location.state?.openEncryption && encryptionRef.current) {
      encryptionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Add a highlight effect
      encryptionRef.current.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
      setTimeout(() => {
        encryptionRef.current?.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2');
      }, 2000);
    }
  }, [location.state]);

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account preferences and security</p>
      </div>

      {/* Theme Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Appearance</h2>
        <div className="space-y-4">
          <label className="block">
            <span className="text-gray-700 font-medium">Theme</span>
            <p className="text-sm text-gray-500 mb-2">Choose your preferred color scheme</p>
            <div className="mt-1">
              <ThemeSwitcher />
            </div>
          </label>
        </div>
      </div>

      {/* Encryption Settings */}
      <div ref={encryptionRef} className="transition-all duration-300">
        <EncryptionSettings />
      </div>
    </div>
  );
};

export default SettingsPage;
