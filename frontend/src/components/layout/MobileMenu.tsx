import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 md:hidden"
        onClick={onClose}
      />

      {/* Menu Panel */}
      <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-surface shadow-xl z-50 md:hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <div className="text-base font-medium text-[var(--text)]">
              {user?.firstName} {user?.lastName}
            </div>
            <div className="text-sm text-gray-500">{user?.email}</div>
          </div>
          <button
            type="button"
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            onClick={onClose}
          >
            <span className="sr-only">Close menu</span>
            <svg
              className="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <nav className="px-2 pt-2 pb-3 space-y-1">
          <Link
            to="/dashboard"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive('/dashboard') ? 'text-[var(--text)] bg-gray-100' : 'text-gray-500 hover:text-[var(--text)] hover:bg-gray-100'
            }`}
            onClick={onClose}
          >
            Dashboard
          </Link>
          <Link
            to="/goals"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive('/goals') ? 'text-[var(--text)] bg-gray-100' : 'text-gray-500 hover:text-[var(--text)] hover:bg-gray-100'
            }`}
            onClick={onClose}
          >
            Goals
          </Link>
          <Link
            to="/meals"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive('/meals') ? 'text-[var(--text)] bg-gray-100' : 'text-gray-500 hover:text-[var(--text)] hover:bg-gray-100'
            }`}
            onClick={onClose}
          >
            Meals
          </Link>
          <Link
            to="/workouts"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive('/workouts') ? 'text-[var(--text)] bg-gray-100' : 'text-gray-500 hover:text-[var(--text)] hover:bg-gray-100'
            }`}
            onClick={onClose}
          >
            Workouts
          </Link>
          <Link
            to="/wellness"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive('/wellness') ? 'text-[var(--text)] bg-gray-100' : 'text-gray-500 hover:text-[var(--text)] hover:bg-gray-100'
            }`}
            onClick={onClose}
          >
            Wellness
          </Link>
        </nav>

        <div className="border-t pt-4 pb-3">
          <div className="px-2 space-y-1">
            <Link
              to="/profile"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-500 hover:text-[var(--text)] hover:bg-gray-100"
              onClick={onClose}
            >
              Your Profile
            </Link>
            <Link
              to="/settings"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-500 hover:text-[var(--text)] hover:bg-gray-100"
              onClick={onClose}
            >
              Settings
            </Link>
            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-500 hover:text-[var(--text)] hover:bg-gray-100"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileMenu;
