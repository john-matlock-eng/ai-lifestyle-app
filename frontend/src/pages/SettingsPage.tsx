import React from 'react';
import { ThemeSwitcher } from '../components/common';

const SettingsPage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Settings</h1>
      <div className="space-y-4">
        <label className="block">
          <span className="text-theme">Theme</span>
          <div className="mt-1">
            <ThemeSwitcher />
          </div>
        </label>
      </div>
    </div>
  );
};

export default SettingsPage;
